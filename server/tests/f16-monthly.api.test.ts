import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { bangkokToday } from '../src/lib/period'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb } from './helpers/db'

let aliceId: number
let bobId: number
let acc: Record<string, number>
let bobAcc: Record<string, number>
let alice: string

async function byName(userId: number) {
  const rows = await prisma.account.findMany({ where: { userId } })
  return Object.fromEntries(rows.map((a) => [a.name, a.id]))
}

// Rows inserted directly: the report only reads lines, and dates may be after "today".
async function mk(
  userId: number,
  t: { date: string; form?: 'PAYMENT' | 'RECEIPT'; primary: number; lines: [number, number][]; status?: 'POSTED' | 'VOID' },
) {
  const total = t.lines.reduce((s, [, a]) => s + a, 0)
  await prisma.txn.create({
    data: {
      userId,
      form: t.form ?? 'PAYMENT',
      primaryAccountId: t.primary,
      txnDate: new Date(`${t.date}T00:00:00Z`),
      total: BigInt(total),
      status: t.status ?? 'POSTED',
      lines: { create: t.lines.map(([accountId, amount]) => ({ accountId, amount: BigInt(amount) })) },
    },
  })
}

const monthly = (qs: string, cookie = alice) => request(app).get(`/api/reports/monthly?${qs}`).set('Cookie', cookie)
const OCT_NOV = 'fromMonth=2026-10&toMonth=2026-11'

beforeEach(async () => {
  await resetDb()
  aliceId = (await createUser('alice', { seedAccounts: true })).id
  bobId = (await createUser('bob', { seedAccounts: true })).id
  await createUser('admin', { role: 'ADMIN' })
  acc = await byName(aliceId)
  bobAcc = await byName(bobId)
  alice = await loginCookie('alice')
  await mk(aliceId, { date: '2026-11-05', form: 'RECEIPT', primary: acc.Bank, lines: [[acc.Salary, 3000000]] })
  await mk(aliceId, { date: '2026-11-06', primary: acc['Credit Card'], lines: [[acc.Dining, 70000], [acc.Groceries, 50000]] })
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('F-16 Period reports', () => {
  it('TEST-F16-01 one row per month (empty months included) plus a total row', async () => {
    const res = await monthly(OCT_NOV)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      fromMonth: '2026-10',
      toMonth: '2026-11',
      items: [
        { month: '2026-10', income: 0, expense: 0, net: 0 },
        { month: '2026-11', income: 3000000, expense: 120000, net: 2880000 },
      ],
      total: { income: 3000000, expense: 120000, net: 2880000 },
    })
  })

  it('TEST-F16-02 repayments, transfers, opening balances and VOID are not income or expense (BR-06)', async () => {
    const wallet = await prisma.account.create({ data: { userId: aliceId, name: 'Wallet', type: 'CASH' } })
    await mk(aliceId, { date: '2026-11-10', primary: acc.Bank, lines: [[acc['Credit Card'], 120000]] })
    await mk(aliceId, { date: '2026-11-11', primary: acc.Bank, lines: [[wallet.id, 50000]] })
    await mk(aliceId, { date: '2026-11-12', primary: acc.Bank, lines: [[acc.Telecom, 9900]], status: 'VOID' })
    await prisma.account.update({ where: { id: acc.Bank }, data: { openingBalance: 500000n, openingDate: new Date('2026-11-01'), balance: { increment: 500000n } } })
    const nov = (await monthly(OCT_NOV)).body.items[1]
    expect(nov).toEqual({ month: '2026-11', income: 3000000, expense: 120000, net: 2880000 })
  })

  it('TEST-F16-03 Bangkok calendar months: 10-31 is October, 11-01 is November', async () => {
    await mk(aliceId, { date: '2026-10-31', primary: acc.Bank, lines: [[acc.Electricity, 1000]] })
    await mk(aliceId, { date: '2026-11-01', primary: acc.Bank, lines: [[acc.Electricity, 2000]] })
    const [oct, nov] = (await monthly(OCT_NOV)).body.items
    expect(oct.expense).toBe(1000)
    expect(nov.expense).toBe(122000)
  })

  it('TEST-F16-04 at most 12 months; reversed or invalid months rejected; default last 6 months', async () => {
    const twelve = await monthly('fromMonth=2025-12&toMonth=2026-11')
    expect(twelve.status).toBe(200)
    expect(twelve.body.items).toHaveLength(12)
    for (const [qs, key] of [
      ['fromMonth=2025-11&toMonth=2026-11', 'fromMonth'],
      ['fromMonth=2026-11&toMonth=2026-10', 'fromMonth'],
      ['fromMonth=2026-13', 'fromMonth'],
      ['toMonth=2026-1', 'toMonth'],
    ]) {
      const res = await monthly(qs)
      expect(res.status, qs).toBe(422)
      expect(res.body.error.code).toBe('VALIDATION_FAILED')
      expect(Object.keys(res.body.error.details), qs).toContain(key)
    }
    const def = await monthly('')
    expect(def.status).toBe(200)
    expect(def.body.items).toHaveLength(6)
    expect(def.body.toMonth).toBe(bangkokToday().slice(0, 7))
  })

  it('TEST-F16-05 401 / 403 / only own figures', async () => {
    await mk(bobId, { date: '2026-11-07', form: 'RECEIPT', primary: bobAcc.Bank, lines: [[bobAcc.Salary, 777777]] })
    expect((await request(app).get(`/api/reports/monthly?${OCT_NOV}`)).status).toBe(401)
    expect((await monthly(OCT_NOV, await loginCookie('admin'))).status).toBe(403)
    expect((await monthly(OCT_NOV)).body.total.income).toBe(3000000)
  })
})
