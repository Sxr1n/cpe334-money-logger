import { Router } from 'express'
import { parsePeriod, sendValidationFailed } from '../lib/query'
import { monthBounds, parseMonthRange } from '../lib/period'
import { percentOf, periodTotalsByAccount, summarize } from '../lib/summary'
import { prisma } from '../prisma'

// Mounted at /api/reports behind requireAuth + requireRole('USER') (see app.ts).
const router = Router()

// F-15 FR-26: spending per EXPENSE account (BR-06: POSTED lines only, via periodTotalsByAccount).
router.get('/categories', async (req, res) => {
  const period = parsePeriod(req.query)
  if ('error' in period) return sendValidationFailed(res, period.error)

  const userId = req.user!.id
  const [totals, accounts] = await Promise.all([
    periodTotalsByAccount(userId, period),
    prisma.account.findMany({ where: { userId, type: 'EXPENSE' } }),
  ])
  const rows = accounts
    .map((a) => ({ accountId: a.id, name: a.name, archived: a.archivedAt !== null, total: totals.get(a.id) ?? 0 }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  const total = rows.reduce((sum, r) => sum + r.total, 0)
  res.json({ from: period.from, to: period.to, total, items: rows.map((r) => ({ ...r, percent: percentOf(r.total, total) })) })
})

// F-16 FR-27: income, expense and net per Bangkok month (D-14: at most 12 months).
router.get('/monthly', async (req, res) => {
  const range = parseMonthRange(req.query)
  if ('error' in range) return sendValidationFailed(res, range.error)

  const items = await Promise.all(
    range.months.map(async (month) => {
      const { income, expense, net } = await summarize(req.user!.id, monthBounds(month))
      return { month, income, expense, net }
    }),
  )
  const total = items.reduce((t, i) => ({ income: t.income + i.income, expense: t.expense + i.expense, net: t.net + i.net }), {
    income: 0,
    expense: 0,
    net: 0,
  })
  res.json({ fromMonth: range.fromMonth, toMonth: range.toMonth, items, total })
})

export default router
