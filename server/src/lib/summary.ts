import { prisma } from '../prisma'

const dateOnly = (d: string) => new Date(`${d}T00:00:00Z`)

// BR-06: only INCOME and EXPENSE lines of POSTED transactions count, so opening balances,
// repayments, transfers and loans can never appear as income or expense.
export async function periodTotalsByAccount(userId: number, period: { from: string; to: string }) {
  const rows = await prisma.txnLine.groupBy({
    by: ['accountId'],
    where: {
      account: { userId, type: { in: ['INCOME', 'EXPENSE'] } },
      txn: { userId, status: 'POSTED', txnDate: { gte: dateOnly(period.from), lte: dateOnly(period.to) } },
    },
    _sum: { amount: true },
  })
  return new Map(rows.map((r) => [r.accountId, Number(r._sum.amount ?? 0)]))
}

export async function summarize(userId: number, period: { from: string; to: string }) {
  const [totals, accounts] = await Promise.all([
    periodTotalsByAccount(userId, period),
    prisma.account.findMany({ where: { userId, type: { in: ['INCOME', 'EXPENSE'] } }, select: { id: true, type: true } }),
  ])
  let income = 0
  let expense = 0
  for (const a of accounts) {
    if (a.type === 'INCOME') income += totals.get(a.id) ?? 0
    else expense += totals.get(a.id) ?? 0
  }
  return { from: period.from, to: period.to, income, expense, net: income - expense }
}
