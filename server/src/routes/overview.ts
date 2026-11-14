import { Router } from 'express'
import type { AccountType } from '../../generated/prisma/client'
import { currentMonthRange } from '../lib/period'
import { parsePeriod, sendValidationFailed } from '../lib/query'
import { summarize } from '../lib/summary'
import { prisma } from '../prisma'

// Mounted at /api behind requireAuth + requireRole('USER') for /overview and /summary (see app.ts).
const router = Router()

router.get('/overview', async (req, res) => {
  const userId = req.user!.id
  const accounts = await prisma.account.findMany({
    where: { userId, type: { in: ['CASH', 'LOAN_TAKEN', 'LOAN_GIVEN'] } },
    orderBy: { name: 'asc' },
  })
  const group = (type: AccountType) => {
    const items = accounts.filter((a) => a.type === type).map((a) => ({ id: a.id, name: a.name, balance: Number(a.balance) }))
    return { items, total: items.reduce((sum, a) => sum + a.balance, 0) }
  }
  res.json({
    cash: group('CASH'),
    loanTaken: group('LOAN_TAKEN'),
    loanGiven: group('LOAN_GIVEN'),
    month: await summarize(userId, currentMonthRange()),
  })
})

router.get('/summary', async (req, res) => {
  const period = parsePeriod(req.query)
  if ('error' in period) return sendValidationFailed(res, period.error)
  res.json(await summarize(req.user!.id, period))
})

export default router
