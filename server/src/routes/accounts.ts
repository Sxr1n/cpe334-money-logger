import { AccountType, type Account } from '../../generated/prisma/client'
import { Router, type Request, type Response } from 'express'
import { validateOpeningBalanceInput } from '../lib/openingBalance'
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
  }
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

export default router
