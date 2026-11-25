import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb } from './helpers/db'

let aliceId: number
let bobId: number
let acc: Record<string, number>
let bobAcc: Record<string, number>
let alice: string

const NOV = 'from=2026-11-01&to=2026-11-30'

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

const report = (qs: string, cookie = alice) => request(app).get(`/api/reports/categories?${qs}`).set('Cookie', cookie)

beforeEach(async () => {
  await resetDb()
  aliceId = (await createUser('alice', { seedAccounts: true })).id
  bobId = (await createUser('bob', { seedAccounts: true })).id
  await createUser('admin', { role: 'ADMIN' })
  acc = await byName(aliceId)
  bobAcc = await byName(bobId)
  alice = await loginCookie('alice')
  await mk(aliceId, { date: '2026-11-06', primary: acc['Credit Card'], lines: [[acc.Dining, 70000], [acc.Groceries, 50000]] })
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('F-15 Category spending', () => {
  it('TEST-F15-01 totals and percentages per EXPENSE account, largest first', async () => {
    const res = await report(NOV)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      from: '2026-11-01',
      to: '2026-11-30',
      total: 120000,
      items: [
        { accountId: acc.Dining, name: 'Dining', archived: false, total: 70000, percent: 58.3 },
        { accountId: acc.Groceries, name: 'Groceries', archived: false, total: 50000, percent: 41.7 },
      ],
    })
  })

  it('TEST-F15-02 repayments, income and VOID transactions are not spending (BR-06)', async () => {
    await mk(aliceId, { date: '2026-11-10', primary: acc.Bank, lines: [[acc['Credit Card'], 120000]] })
    await mk(aliceId, { date: '2026-11-10', form: 'RECEIPT', primary: acc.Bank, lines: [[acc.Salary, 3000000]] })
    await mk(aliceId, { date: '2026-11-11', primary: acc.Bank, lines: [[acc.Telecom, 9900]], status: 'VOID' })
    const res = await report(NOV)
    expect(res.body.total).toBe(120000)
    expect(res.body.items.map((i: { name: string }) => i.name)).toEqual(['Dining', 'Groceries'])
  })

  it('TEST-F15-03 inclusive bounds, archived accounts listed, empty period', async () => {
    await mk(aliceId, { date: '2026-10-31', primary: acc.Bank, lines: [[acc.Electricity, 1000]] })
    await mk(aliceId, { date: '2026-12-01', primary: acc.Bank, lines: [[acc.Electricity, 2000]] })
    await mk(aliceId, { date: '2026-11-01', primary: acc.Bank, lines: [[acc.Telecom, 300]] })
    await mk(aliceId, { date: '2026-11-30', primary: acc.Bank, lines: [[acc.Telecom, 400]] })
    const transport = await prisma.account.create({ data: { userId: aliceId, name: 'Transport', type: 'EXPENSE', archivedAt: new Date() } })
    await mk(aliceId, { date: '2026-11-15', primary: acc.Bank, lines: [[transport.id, 500]] })

    const res = await report(NOV)
    expect(res.body.total).toBe(121200)
    const byName = Object.fromEntries(res.body.items.map((i: { name: string }) => [i.name, i]))
    expect(byName.Telecom.total).toBe(700)
    expect(byName.Electricity).toBeUndefined()
    expect(byName.Transport).toMatchObject({ total: 500, archived: true })

    const empty = await report('from=2026-01-01&to=2026-01-31')
    expect(empty.body).toMatchObject({ total: 0, items: [] })
  })

  it('TEST-F15-04 invalid periods → 422 naming the parameter', async () => {
    for (const [qs, key] of [['from=2026-11-30&to=2026-11-01', 'from'], ['from=2026-13-01', 'from']]) {
      const res = await report(qs)
      expect(res.status, qs).toBe(422)
      expect(res.body.error.code).toBe('VALIDATION_FAILED')
      expect(Object.keys(res.body.error.details)).toContain(key)
    }
  })

  it('TEST-F15-05 401 / 403 / only own spending', async () => {
    await mk(bobId, { date: '2026-11-07', primary: bobAcc.Bank, lines: [[bobAcc.Dining, 999999]] })
    expect((await request(app).get(`/api/reports/categories?${NOV}`)).status).toBe(401)
    expect((await report(NOV, await loginCookie('admin'))).status).toBe(403)
    expect((await report(NOV)).body.total).toBe(120000)
  })
})
