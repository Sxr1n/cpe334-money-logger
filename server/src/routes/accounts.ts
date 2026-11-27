import { AccountType, type Account } from '../../generated/prisma/client'
import { Router, type Request, type Response } from 'express'
import { validateAccountInput, validateCreditLimit, validateName } from '../lib/accountInput'
import { formatBaht } from '../lib/ledger'
import { balanceAfterOpeningChange, validateOpeningBalanceInput } from '../lib/openingBalance'
import { parsePeriod, sendValidationFailed } from '../lib/query'
import { periodTotalsByAccount } from '../lib/summary'
import { prisma } from '../prisma'

const router = Router()

const TYPE_ORDER: Record<AccountType, number> = {
  CASH: 1,
  LOAN_TAKEN: 2,
  LOAN_GIVEN: 3,
  INCOME: 4,
  EXPENSE: 5,
}

function serializeAccount(acc: Account) {
  return {
    id: acc.id,
    name: acc.name,
    type: acc.type,
    balance: Number(acc.balance),
    openingBalance: acc.openingBalance !== null ? Number(acc.openingBalance) : null,
    openingDate: acc.openingDate ? acc.openingDate.toISOString().slice(0, 10) : null,
    archived: acc.archivedAt !== null,
    creditLimit: acc.creditLimit !== null ? Number(acc.creditLimit) : null, // CHG-01
    availableCredit: acc.creditLimit !== null ? Number(acc.creditLimit - acc.balance) : null,
  }
}

const notFound = (res: Response) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } })
const badRequest = (res: Response) => res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid request body.' } })
const duplicateName = (res: Response, type: AccountType) =>
  res.status(409).json({
    error: { code: 'CONFLICT', message: 'Duplicate account name.', details: { name: `You already have a ${type} account with this name` } },
  })

const HAS_BALANCE: AccountType[] = [AccountType.CASH, AccountType.LOAN_TAKEN, AccountType.LOAN_GIVEN]

// BR-14: same user + type + name ignoring case, archived accounts included.
async function nameTaken(userId: number, type: AccountType, name: string, exceptId?: number) {
  const other = await prisma.account.findFirst({
    where: { userId, type, name: { equals: name, mode: 'insensitive' }, ...(exceptId ? { id: { not: exceptId } } : {}) },
  })
  return other !== null
}

// The unique index (user_id, type, lower(name)) is the backstop for a concurrent duplicate.
function isUniqueViolation(err: unknown) {
  const e = err as { code?: string; message?: string }
  return e?.code === 'P2002' || e?.code === '23505' || /unique constraint/i.test(e?.message ?? '')
}

// GET /api/accounts?from&to (USER) — F-06 adds periodTotal for INCOME/EXPENSE (FR-06)
router.get('/', async (req: Request, res: Response) => {
  const period = parsePeriod(req.query)
  if ('error' in period) return sendValidationFailed(res, period.error)

  const [accounts, totals] = await Promise.all([
    prisma.account.findMany({ where: { userId: req.user!.id }, orderBy: { name: 'asc' } }),
    periodTotalsByAccount(req.user!.id, period),
  ])

  accounts.sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name))

  res.json({
    items: accounts.map((acc) => ({
      ...serializeAccount(acc),
      periodTotal: acc.type === AccountType.INCOME || acc.type === AccountType.EXPENSE ? totals.get(acc.id) ?? 0 : null,
    })),
  })
})

// POST /api/accounts (USER) — F-07: the owner is always the session user (BR-11/BR-12)
router.post('/', async (req: Request, res: Response) => {
  const input = validateAccountInput(req.body)
  if (input.badRequest) return badRequest(res)
  if (!input.ok) return sendValidationFailed(res, input.details!)

  const userId = req.user!.id
  if (await nameTaken(userId, input.type!, input.name!)) return duplicateName(res, input.type!)
  try {
    const created = await prisma.account.create({ data: { userId, name: input.name!, type: input.type! } })
    res.status(201).json(serializeAccount(created))
  } catch (err) {
    if (isUniqueViolation(err)) return duplicateName(res, input.type!)
    throw err
  }
})

// PATCH /api/accounts/:id (USER) — F-07: rename and/or archive/unarchive
router.patch('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const body = req.body as Record<string, unknown> | undefined
  if (!body || typeof body !== 'object' || Array.isArray(body)) return badRequest(res)
  const { name, archived, creditLimit } = body
  const limit = creditLimit === undefined ? undefined : validateCreditLimit(creditLimit)
  if (limit && !limit.ok && 'badRequest' in limit) return badRequest(res)
  if (
    (name === undefined && archived === undefined && creditLimit === undefined) ||
    (name !== undefined && typeof name !== 'string') ||
    (archived !== undefined && typeof archived !== 'boolean')
  ) {
    return badRequest(res)
  }

  const userId = req.user!.id
  const account = Number.isInteger(id) ? await prisma.account.findFirst({ where: { id, userId } }) : null
  if (!account) return notFound(res)

  if (typeof name === 'string') {
    const nameError = validateName(name)
    if (nameError) return sendValidationFailed(res, { name: nameError })
    if (await nameTaken(userId, account.type, name.trim(), id)) return duplicateName(res, account.type)
  }
  if (limit && !limit.ok && 'error' in limit) return sendValidationFailed(res, { creditLimit: limit.error })
  const limitRule = (msg: string) =>
    res.status(422).json({ error: { code: 'RULE_VIOLATION', message: 'Business rule violation.', details: { creditLimit: msg } } })
  if (limit && account.type !== AccountType.LOAN_TAKEN) return limitRule('A credit limit can only be set on a LOAN_TAKEN account')
  if (limit && account.archivedAt !== null) return limitRule('Account is archived')

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Lock the row so a concurrent posting cannot change the balance between the check and the archive (BR-15).
      const [row] = await tx.$queryRaw<[{ balance: bigint }]>`SELECT balance FROM accounts WHERE id = ${id} FOR UPDATE`
      if (archived === true && HAS_BALANCE.includes(account.type) && row.balance !== 0n) {
        throw Object.assign(new Error('ARCHIVE_BALANCE'), { balance: row.balance })
      }
      // CHG-01 BR-18: checked on the locked row so a concurrent charge cannot slip under the new limit.
      if (limit?.ok && limit.value !== null && limit.value < row.balance) {
        throw Object.assign(new Error('LIMIT_BELOW_DEBT'), { balance: row.balance })
      }
      return tx.account.update({
        where: { id },
        data: {
          ...(typeof name === 'string' ? { name: name.trim() } : {}),
          // Archiving twice keeps the first timestamp; unarchiving an active account changes nothing.
          ...(archived === true && account.archivedAt === null ? { archivedAt: new Date() } : {}),
          ...(archived === false ? { archivedAt: null } : {}),
          ...(limit?.ok ? { creditLimit: limit.value } : {}),
        },
      })
    })
    res.json(serializeAccount(updated))
  } catch (err) {
    if (err instanceof Error && err.message === 'ARCHIVE_BALANCE') {
      const { balance } = err as Error & { balance: bigint }
      return res.status(422).json({
        error: {
          code: 'RULE_VIOLATION',
          message: 'Business rule violation.',
          details: { archived: `Balance must be ฿0.00 to archive (now ฿${formatBaht(balance)})` },
        },
      })
    }
    if (err instanceof Error && err.message === 'LIMIT_BELOW_DEBT') {
      return limitRule(`Limit is below the current debt ฿${formatBaht((err as Error & { balance: bigint }).balance)}`)
    }
    if (isUniqueViolation(err)) return duplicateName(res, account.type)
    throw err
  }
})

// PUT /api/accounts/:id/opening-balance (USER)
router.put('/:id/opening-balance', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } })
  }

  // 1. Check body shape (400 BAD_REQUEST)
  const validation = validateOpeningBalanceInput(req.body)
  if (validation.errorType === 'BAD_REQUEST') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid request body.' } })
  }

  // 2. Fetch account & check ownership (404 NOT_FOUND)
  const account = await prisma.account.findUnique({
    where: { id },
  })
  if (!account || account.userId !== req.user!.id) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } })
  }

  // 3. Validation failure (422 VALIDATION_FAILED)
  if (!validation.valid && validation.errorType === 'VALIDATION_FAILED') {
    return res.status(422).json({
      error: { code: 'VALIDATION_FAILED', message: 'Validation failed.', details: validation.details },
    })
  }

  // 4. Check account type (422 RULE_VIOLATION, BR-10)
  if (account.type !== AccountType.CASH && account.type !== AccountType.LOAN_TAKEN && account.type !== AccountType.LOAN_GIVEN) {
    return res.status(422).json({
      error: {
        code: 'RULE_VIOLATION',
        message: 'Opening balance can only be set on CASH, LOAN_TAKEN or LOAN_GIVEN accounts.',
      },
    })
  }

  // F-07: an archived account takes no opening balance
  if (account.archivedAt !== null) {
    return res.status(422).json({ error: { code: 'RULE_VIOLATION', message: 'Account is archived.' } })
  }

  // 5. Check if opening balance already set (409 CONFLICT, BR-10)
  if (account.openingBalance !== null) {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'Opening balance already set.' },
    })
  }

  // 6. DB transaction: atomic row lock and update (BR-05/SD-02)
  const { amount, date } = req.body as { amount: number; date: string }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<[{ id: number; opening_balance: bigint | null }]>`
        SELECT id, opening_balance FROM accounts WHERE id = ${id} FOR UPDATE
      `
      if (!locked[0] || locked[0].opening_balance !== null) {
        throw new Error('CONFLICT')
      }

      return tx.account.update({
        where: { id },
        data: {
          openingBalance: BigInt(amount),
          openingDate: new Date(date),
          balance: { increment: BigInt(amount) },
        },
      })
    })

    res.json(serializeAccount(updated))
  } catch (err) {
    if (err instanceof Error && err.message === 'CONFLICT') {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'Opening balance already set.' },
      })
    }
    throw err
  }
})

// PATCH /api/accounts/:id/opening-balance (USER) — F-08: change an existing opening balance (D-10)
router.patch('/:id/opening-balance', async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const validation = validateOpeningBalanceInput(req.body)
  if (validation.errorType === 'BAD_REQUEST') return badRequest(res)

  const account = Number.isInteger(id) ? await prisma.account.findFirst({ where: { id, userId: req.user!.id } }) : null
  if (!account) return notFound(res)
  if (!validation.valid) return sendValidationFailed(res, validation.details!)

  const rule = (message: string, details?: Record<string, string>) =>
    res.status(422).json({ error: { code: 'RULE_VIOLATION', message, ...(details ? { details } : {}) } })
  if (!HAS_BALANCE.includes(account.type)) return rule('Opening balance can only be set on CASH, LOAN_TAKEN or LOAN_GIVEN accounts.')
  if (account.archivedAt !== null) return rule('Account is archived.')
  if (account.openingBalance === null) {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'Opening balance not set yet.' } })
  }

  const { amount, date } = req.body as { amount: number; date: string }
  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Lock the row so a concurrent posting cannot slip between the check and the write (BR-05).
      const [row] = await tx.$queryRaw<[{ balance: bigint; opening_balance: bigint; credit_limit: bigint | null }]>`
        SELECT balance, opening_balance, credit_limit FROM accounts WHERE id = ${id} FOR UPDATE`
      const balance = balanceAfterOpeningChange(row.balance, row.opening_balance, BigInt(amount))
      if (balance < 0n) throw Object.assign(new Error('NEGATIVE'), { balance })
      if (row.credit_limit !== null && balance > row.credit_limit) throw Object.assign(new Error('OVER_LIMIT'), { limit: row.credit_limit })
      return tx.account.update({ where: { id }, data: { openingBalance: BigInt(amount), openingDate: new Date(date), balance } })
    })
    res.json(serializeAccount(updated))
  } catch (err) {
    if (err instanceof Error && err.message === 'NEGATIVE') {
      const { balance } = err as Error & { balance: bigint }
      return rule('Business rule violation.', {
        amount: `Too low: the balance would be −฿${formatBaht(-balance)} because of later transactions`,
      })
    }
    if (err instanceof Error && err.message === 'OVER_LIMIT') {
      return rule('Business rule violation.', {
        amount: `Too high: the debt would exceed the credit limit ฿${formatBaht((err as Error & { limit: bigint }).limit)}`,
      })
    }
    throw err
  }
})

export default router
