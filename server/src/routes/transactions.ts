import { Router, type Request, type Response } from 'express'
import { AccountType, Prisma, TxnForm, TxnStatus } from '../../generated/prisma/client'
import {
  calculateTxnEffects,
  computeNetDeltas,
  formatBaht,
  validateAllowedAccountTypes,
  validateTxnInput,
  type AccountDelta,
  type CreateTxnInput,
  type TxnEffectInput,
} from '../lib/ledger'
import { escapeLike, parsePaging, parseTxnFilter, sendValidationFailed } from '../lib/query'
import { prisma } from '../prisma'

const router = Router()

function serializeTransaction(txn: any) {
  return {
    id: txn.id,
    form: txn.form,
    date: txn.txnDate instanceof Date ? txn.txnDate.toISOString().slice(0, 10) : txn.txnDate,
    total: Number(txn.total),
    note: txn.note,
    status: txn.status,
    isFavorite: txn.isFavorite,
    primaryAccount: {
      id: txn.primaryAccount.id,
      name: txn.primaryAccount.name,
      type: txn.primaryAccount.type,
    },
    lines: txn.lines.map((l: any) => ({
      id: l.id,
      account: {
        id: l.account.id,
        name: l.account.name,
        type: l.account.type,
      },
      amount: Number(l.amount),
    })),
    createdAt: txn.createdAt.toISOString(),
  }
}

// Balance update step (can be spied on for atomicity testing)
export const postingSteps = {
  async updatePrimaryBalance(client: any, accountId: number, delta: bigint) {
    return client.account.update({
      where: { id: accountId },
      data: {
        balance: { increment: delta },
      },
    })
  },
  async updateAccountBalance(client: any, accountId: number, delta: bigint) {
    return this.updatePrimaryBalance(client, accountId, delta)
  },
}

const withAccounts = { primaryAccount: true, lines: { include: { account: true }, orderBy: { id: 'asc' as const } } }

// GET /api/transactions?page&pageSize (USER) — FR-18: own history, newest first
router.get('/', async (req: Request, res: Response) => {
  const paging = parsePaging(req.query)
  if ('error' in paging) return sendValidationFailed(res, paging.error)
  const parsed = parseTxnFilter(req.query)
  if ('error' in parsed) return sendValidationFailed(res, parsed.error)
  const f = parsed.filter

  // F-12: filters AND together; the account filter matches the primary or any line (D-13).
  const where: Prisma.TxnWhereInput = {
    userId: req.user!.id,
    txnDate: {
      ...(f.from ? { gte: new Date(`${f.from}T00:00:00Z`) } : {}),
      ...(f.to ? { lte: new Date(`${f.to}T00:00:00Z`) } : {}),
    },
    total: {
      ...(f.minAmount !== undefined ? { gte: f.minAmount } : {}),
      ...(f.maxAmount !== undefined ? { lte: f.maxAmount } : {}),
    },
    ...(f.form ? { form: f.form } : {}),
    ...(f.status ? { status: f.status } : {}),
    ...(f.q ? { note: { contains: escapeLike(f.q), mode: 'insensitive' as const } } : {}),
    ...(f.accountId ? { OR: [{ primaryAccountId: f.accountId }, { lines: { some: { accountId: f.accountId } } }] } : {}),
    ...(f.favorite ? { isFavorite: true, status: TxnStatus.POSTED } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.txn.findMany({
      where,
      include: withAccounts,
      orderBy: [{ txnDate: 'desc' }, { id: 'desc' }],
      skip: paging.skip,
      take: paging.pageSize,
    }),
    prisma.txn.count({ where }),
  ])
  res.json({ items: items.map(serializeTransaction), page: paging.page, pageSize: paging.pageSize, total })
})

// GET /api/transactions/:id (USER) — BR-11: another user's id is "not found"
// PUT /api/transactions/:id/favorite (USER) — F-13: a VOID transaction cannot become a favourite (D-15)
router.put('/:id/favorite', async (req: Request, res: Response) => {
  const favorite = (req.body as { favorite?: unknown } | undefined)?.favorite
  if (typeof favorite !== 'boolean') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid request body.' } })
  }
  const id = Number(req.params.id)
  const txn = Number.isInteger(id) ? await prisma.txn.findFirst({ where: { id, userId: req.user!.id } }) : null
  if (!txn) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } })
  if (favorite && txn.status === TxnStatus.VOID) {
    return res.status(422).json({ error: { code: 'RULE_VIOLATION', message: 'A void transaction cannot be a favourite.' } })
  }
  const updated = await prisma.txn.update({ where: { id }, data: { isFavorite: favorite }, include: withAccounts })
  res.json(serializeTransaction(updated))
})

router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const txn = Number.isInteger(id)
    ? await prisma.txn.findFirst({ where: { id, userId: req.user!.id }, include: withAccounts })
    : null
  if (!txn) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } })
  res.json(serializeTransaction(txn))
})

// POST /api/transactions (USER)
router.post('/', async (req: Request, res: Response) => {
  const userId = req.user!.id

  // 1. JSON shape & type check (400 BAD_REQUEST)
  const validation = validateTxnInput(req.body)
  if (validation.errorType === 'BAD_REQUEST') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid request body.' } })
  }

  const body = req.body as CreateTxnInput
  const allAccountIds = Array.from(new Set([body.primaryAccountId, ...body.lines.map((l) => l.accountId)]))

  // 2. Load all referenced accounts with userId = session user and not archived (404 NOT_FOUND, BR-04, BR-11)
  const userAccounts = await prisma.account.findMany({
    where: {
      id: { in: allAccountIds },
      userId,
      archivedAt: null,
    },
  })

  // If any account not found or belongs to another user -> 404
  if (userAccounts.length !== allAccountIds.length) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'One or more accounts not found.' } })
  }

  // 3. Validation failure (422 VALIDATION_FAILED)
  if (!validation.valid && validation.errorType === 'VALIDATION_FAILED') {
    return res.status(422).json({
      error: { code: 'VALIDATION_FAILED', message: 'Validation failed.', details: validation.details },
    })
  }

  // 4. Business rule checks (422 RULE_VIOLATION, BR-01, BR-04)
  if (!validation.valid && validation.errorType === 'RULE_VIOLATION') {
    return res.status(422).json({
      error: { code: 'RULE_VIOLATION', message: 'Business rule violation.', details: validation.details },
    })
  }

  // 5. Account types check against database accounts (BR-03)
  const accountMap = new Map(userAccounts.map((a) => [a.id, a]))
  const primaryAccount = accountMap.get(body.primaryAccountId)!
  const lineTypes = body.lines.map((l) => accountMap.get(l.accountId)!.type)

  const typeValidation = validateAllowedAccountTypes(body.form, primaryAccount.type, lineTypes)
  if (!typeValidation.valid) {
    return res.status(422).json({
      error: { code: 'RULE_VIOLATION', message: 'Business rule violation.', details: typeValidation.details },
    })
  }

  // 6. DB transaction: atomic posting (SDS §2.4, BR-05, NFR-06)
  try {
    const createdTxn = await prisma.$transaction(async (tx) => {
      // Lock accounts in ascending ID order to prevent deadlock
      const sortedIds = [...allAccountIds].sort((a, b) => a - b)
      const lockedAccounts: any[] = []
      for (const accId of sortedIds) {
        const rows: any[] = await tx.$queryRawUnsafe(
          `SELECT id, name, balance, type FROM accounts WHERE id = $1 AND user_id = $2 AND archived_at IS NULL FOR UPDATE`,
          accId,
          userId,
        )
        // F-07 BR-04: an account archived between the first load and this lock gives the same 404 as a missing one.
        if (rows.length === 0) {
          throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' })
        }
        lockedAccounts.push(rows[0])
      }

      const lockedAccountMap = new Map(lockedAccounts.map((a) => [a.id, a]))
      const lockedPrimary = lockedAccountMap.get(body.primaryAccountId)!
      const lockedLines = body.lines.map((l) => ({
        account: lockedAccountMap.get(l.accountId)!,
        amount: BigInt(l.amount),
      }))

      // Calculate balance effects and verify BR-07, BR-08 against locked account balances
      const effectsResult = calculateTxnEffects(
        body.form,
        {
          id: lockedPrimary.id,
          name: lockedPrimary.name,
          type: lockedPrimary.type as AccountType,
          balance: BigInt(lockedPrimary.balance),
        },
        lockedLines.map((l) => ({
          account: {
            id: l.account.id,
            name: l.account.name,
            type: l.account.type as AccountType,
            balance: BigInt(l.account.balance),
          },
          amount: l.amount,
        })),
        BigInt(body.total),
      )

      if (!effectsResult.valid) {
        const err: any = new Error('RULE_VIOLATION')
        err.code = 'RULE_VIOLATION'
        err.details = effectsResult.details
        throw err
      }

      // Insert transaction and lines
      const txnDate = new Date(`${body.date}T00:00:00Z`)
      const txn = await tx.txn.create({
        data: {
          userId,
          form: body.form as TxnForm,
          primaryAccountId: body.primaryAccountId,
          txnDate,
          total: BigInt(body.total),
          note: body.note?.trim() || null,
          status: TxnStatus.POSTED,
          lines: {
            create: body.lines.map((l) => ({
              accountId: l.accountId,
              amount: BigInt(l.amount),
            })),
          },
        },
        include: {
          primaryAccount: true,
          lines: {
            include: {
              account: true,
            },
          },
        },
      })

      // Apply balance deltas
      if (effectsResult.deltas) {
        for (const d of effectsResult.deltas) {
          await postingSteps.updateAccountBalance(tx, d.accountId, d.delta)
        }
      }

      return txn
    })

    return res.status(201).json(serializeTransaction(createdTxn))
  } catch (err: any) {
    if (err?.code === 'NOT_FOUND') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'One or more accounts not found.' } })
    }
    if (err?.code === 'RULE_VIOLATION') {
      return res.status(422).json({
        error: { code: 'RULE_VIOLATION', message: 'Business rule violation.', details: err.details },
      })
    }

    // Check constraint backstop (CHECK (balance >= 0))
    if (err?.code === '23514' || (err?.message && /check constraint/i.test(err.message))) {
      return res.status(422).json({
        error: {
          code: 'RULE_VIOLATION',
          message: 'Balance cannot be negative.',
          details: { total: 'Account balance cannot be negative' },
        },
      })
    }

    console.error('Failed to post transaction:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to post transaction.' } })
  }
})

const HAS_BALANCE_TYPES: AccountType[] = [AccountType.CASH, AccountType.LOAN_TAKEN, AccountType.LOAN_GIVEN]

function toEffectInput(txn: {
  form: string
  primaryAccount: { id: number; type: AccountType }
  lines: { account: { id: number; type: AccountType }; amount: bigint }[]
  total: bigint
}): TxnEffectInput {
  return {
    form: txn.form as 'RECEIPT' | 'PAYMENT',
    primaryAccount: { id: txn.primaryAccount.id, type: txn.primaryAccount.type },
    lines: txn.lines.map((l) => ({ account: { id: l.account.id, type: l.account.type }, amount: l.amount })),
    total: txn.total,
  }
}

// F-11 §2: Lock txn FOR UPDATE (must be POSTED), lock union of affected accounts in ascending id order,
// verify archived & non-negative invariants (D-12), and return locked account map.
async function lockAndValidateCorrection(
  tx: any,
  txnId: number,
  userId: number,
  accountIdsToLock: number[],
  netDeltas: AccountDelta[],
) {
  const txnRows: any[] = await tx.$queryRawUnsafe(
    `SELECT id, status FROM transactions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
    txnId,
    userId,
  )
  if (txnRows.length === 0) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' })
  if (txnRows[0].status !== TxnStatus.POSTED) {
    throw Object.assign(new Error('This transaction is void'), { code: 'RULE_VIOLATION', customMessage: 'This transaction is void.' })
  }

  const sortedIds = [...new Set(accountIdsToLock)].sort((a, b) => a - b)
  const lockedMap = new Map<number, { id: number; name: string; balance: bigint; type: AccountType; archivedAt: Date | null }>()
  for (const accId of sortedIds) {
    const rows: any[] = await tx.$queryRawUnsafe(
      `SELECT id, name, balance, type, archived_at FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      accId,
      userId,
    )
    if (rows.length === 0) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' })
    const r = rows[0]
    lockedMap.set(r.id, { id: r.id, name: r.name, balance: BigInt(r.balance), type: r.type as AccountType, archivedAt: r.archived_at })
  }

  for (const d of netDeltas) {
    const acc = lockedMap.get(d.accountId)
    if (!acc || !HAS_BALANCE_TYPES.includes(acc.type)) continue
    if (acc.archivedAt !== null) {
      throw Object.assign(new Error(`Unarchive ${acc.name} first`), {
        code: 'RULE_VIOLATION',
        customMessage: `Unarchive ${acc.name} first`,
      })
    }
    const nextBalance = acc.balance + d.delta
    if (nextBalance < 0n) {
      throw Object.assign(new Error('RULE_VIOLATION'), {
        code: 'RULE_VIOLATION',
        details: { total: `${acc.name} would go below ฿0.00 (−฿${formatBaht(-nextBalance)})` },
      })
    }
  }
}

function handleCorrectionError(err: any, res: Response, label: string) {
  if (err?.code === 'NOT_FOUND') {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } })
  }
  if (err?.code === 'RULE_VIOLATION') {
    return res.status(422).json({
      error: {
        code: 'RULE_VIOLATION',
        message: err.customMessage ?? 'Business rule violation.',
        ...(err.details ? { details: err.details } : {}),
      },
    })
  }
  if (err?.code === '23514' || (err?.message && /check constraint/i.test(err.message))) {
    return res.status(422).json({
      error: { code: 'RULE_VIOLATION', message: 'Balance cannot be negative.', details: { total: 'Account balance cannot be negative' } },
    })
  }
  console.error(`Failed to ${label} transaction:`, err)
  return res.status(500).json({ error: { code: 'INTERNAL', message: `Failed to ${label} transaction.` } })
}

// PUT /api/transactions/:id (USER) — F-11 edit POSTED transaction atomically
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const validation = validateTxnInput(req.body)
  if (!validation.valid && validation.errorType === 'BAD_REQUEST') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid request body.' } })
  }

  const userId = req.user!.id
  const existing = Number.isInteger(id)
    ? await prisma.txn.findFirst({ where: { id, userId }, include: withAccounts })
    : null
  if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } })

  const body = req.body as CreateTxnInput
  const allNewIds = Array.from(new Set([body.primaryAccountId, ...body.lines.map((l) => l.accountId)]))
  const newAccounts = await prisma.account.findMany({ where: { id: { in: allNewIds }, userId, archivedAt: null } })
  if (newAccounts.length !== allNewIds.length) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'One or more accounts not found.' } })
  }

  if (!validation.valid && validation.errorType === 'VALIDATION_FAILED') {
    return res.status(422).json({ error: { code: 'VALIDATION_FAILED', message: 'Validation failed.', details: validation.details } })
  }
  if (!validation.valid && validation.errorType === 'RULE_VIOLATION') {
    return res.status(422).json({ error: { code: 'RULE_VIOLATION', message: 'Business rule violation.', details: validation.details } })
  }
  if (body.form !== existing.form) {
    return res.status(422).json({
      error: {
        code: 'RULE_VIOLATION',
        message: 'Business rule violation.',
        details: { form: 'The form cannot be changed; void and record a new transaction' },
      },
    })
  }

  const newAccountMap = new Map(newAccounts.map((a) => [a.id, a]))
  const newPrimary = newAccountMap.get(body.primaryAccountId)!
  const newLineTypes = body.lines.map((l) => newAccountMap.get(l.accountId)!.type)
  const typeValidation = validateAllowedAccountTypes(body.form, newPrimary.type, newLineTypes)
  if (!typeValidation.valid) {
    return res.status(422).json({ error: { code: 'RULE_VIOLATION', message: 'Business rule violation.', details: typeValidation.details } })
  }

  const oldEffectInput = toEffectInput(existing)
  const newEffectInput: TxnEffectInput = {
    form: body.form,
    primaryAccount: { id: newPrimary.id, type: newPrimary.type },
    lines: body.lines.map((l) => ({ account: { id: l.accountId, type: newAccountMap.get(l.accountId)!.type }, amount: BigInt(l.amount) })),
    total: BigInt(body.total),
  }
  const netDeltas = computeNetDeltas(oldEffectInput, newEffectInput)
  const unionIds = [existing.primaryAccountId, ...existing.lines.map((l) => l.accountId), ...allNewIds]

  try {
    const updatedTxn = await prisma.$transaction(async (tx) => {
      await lockAndValidateCorrection(tx, id, userId, unionIds, netDeltas)
      await tx.txnLine.deleteMany({ where: { txnId: id } })
      const txn = await tx.txn.update({
        where: { id },
        data: {
          primaryAccountId: body.primaryAccountId,
          txnDate: new Date(`${body.date}T00:00:00Z`),
          total: BigInt(body.total),
          note: body.note?.trim() || null,
          lines: { create: body.lines.map((l) => ({ accountId: l.accountId, amount: BigInt(l.amount) })) },
        },
        include: withAccounts,
      })
      for (const d of netDeltas) {
        await postingSteps.updateAccountBalance(tx, d.accountId, d.delta)
      }
      return txn
    })
    return res.json(serializeTransaction(updatedTxn))
  } catch (err: any) {
    return handleCorrectionError(err, res, 'edit')
  }
})

// POST /api/transactions/:id/void (USER) — F-11 void POSTED transaction atomically
router.post('/:id/void', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const userId = req.user!.id
  const existing = Number.isInteger(id)
    ? await prisma.txn.findFirst({ where: { id, userId }, include: withAccounts })
    : null
  if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } })

  const negatedDeltas = computeNetDeltas(toEffectInput(existing), null)
  const affectedIds = [existing.primaryAccountId, ...existing.lines.map((l) => l.accountId)]

  try {
    const voidedTxn = await prisma.$transaction(async (tx) => {
      await lockAndValidateCorrection(tx, id, userId, affectedIds, negatedDeltas)
      const txn = await tx.txn.update({
        where: { id },
        data: { status: TxnStatus.VOID },
        include: withAccounts,
      })
      for (const d of negatedDeltas) {
        await postingSteps.updateAccountBalance(tx, d.accountId, d.delta)
      }
      return txn
    })
    return res.json(serializeTransaction(voidedTxn))
  } catch (err: any) {
    return handleCorrectionError(err, res, 'void')
  }
})

export default router

