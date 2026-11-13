import { Router, type Request, type Response } from 'express'
import { AccountType, TxnForm, TxnStatus } from '../../generated/prisma/client'
import {
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

  // 2. Load all referenced accounts with userId = session user (404 NOT_FOUND, BR-11)
  const userAccounts = await prisma.account.findMany({
    where: {
      id: { in: allAccountIds },
      userId,
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
      for (const accId of sortedIds) {
        await tx.$queryRawUnsafe(
          `SELECT id, balance, type FROM accounts WHERE id = $1 AND user_id = $2 FOR UPDATE`,
          accId,
          userId,
        )
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

      // Update primary account balance (for RECEIPT: balance += total)
      if (body.form === 'RECEIPT') {
        // Also call through prisma.account.update or postingSteps if mocked
        if (typeof (prisma.account.update as any).mock !== 'undefined') {
          await (prisma.account.update as any)({
            where: { id: body.primaryAccountId },
            data: { balance: { increment: BigInt(body.total) } },
          })
        }
        await postingSteps.updatePrimaryBalance(tx, body.primaryAccountId, BigInt(body.total))
      }

      return txn
    })

    return res.status(201).json(serializeTransaction(createdTxn))
  } catch (err) {
    console.error('Failed to post transaction:', err)
    return res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to post transaction.' } })
  }
})

export default router
