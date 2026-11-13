import { Router, type Request, type Response } from 'express'
import { AccountType, TxnForm, TxnStatus } from '../../generated/prisma/client'
import {
  calculateTxnEffects,
  validateAllowedAccountTypes,
  validateTxnInput,
  type CreateTxnInput,
} from '../lib/ledger'
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
          `SELECT id, name, balance, type FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE`,
          accId,
          userId,
        )
        if (rows.length > 0) {
          lockedAccounts.push(rows[0])
        }
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

export default router

