import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { currentMonthRange } from '../src/lib/period'
import { getTodayBangkok } from '../src/lib/ledger'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb } from './helpers/db'

let aliceId: number
let bobId: number
const ids: Record<string, number> = {}

beforeEach(async () => {
  await resetDb()
  aliceId = (await createUser('alice', { seedAccounts: true })).id
  bobId = (await createUser('bob', { seedAccounts: true })).id
  await createUser('admin', { role: 'ADMIN' })
  for (const a of await prisma.account.findMany({ where: { userId: aliceId } })) ids[a.name] = a.id
})

afterAll(async () => {
  await prisma.$disconnect()
})

// Sprint 1 scenario through the real API: opening ฿5,000, salary ฿30,000, card purchase ฿700 + ฿500, card repayment ฿1,200.
async function postScenario(cookie: string) {
  const today = getTodayBangkok()
  const post = (body: object) => request(app).post('/api/transactions').set('Cookie', cookie).send(body)
  expect((await request(app).put(`/api/accounts/${ids.Bank}/opening-balance`).set('Cookie', cookie).send({ amount: 500000, date: '2026-11-01' })).status).toBe(200)
  expect((await post({ form: 'RECEIPT', primaryAccountId: ids.Bank, date: today, total: 3000000, lines: [{ accountId: ids.Salary, amount: 3000000 }] })).status).toBe(201)
  expect((await post({ form: 'PAYMENT', primaryAccountId: ids['Credit Card'], date: today, total: 120000, lines: [{ accountId: ids.Dining, amount: 70000 }, { accountId: ids.Groceries, amount: 50000 }] })).status).toBe(201)
  expect((await post({ form: 'PAYMENT', primaryAccountId: ids.Bank, date: today, total: 120000, lines: [{ accountId: ids['Credit Card'], amount: 120000 }] })).status).toBe(201)
}

// Inserts a POSTED transaction directly (bypassing BR-09) to place it on any date.
async function insertTxn(userId: number, primaryAccountId: number, lineAccountId: number, amount: number, date: string) {
  return prisma.txn.create({
    data: {
      userId,
      form: 'RECEIPT',
      primaryAccountId,
      txnDate: new Date(`${date}T00:00:00Z`),
      total: BigInt(amount),
      lines: { create: [{ accountId: lineAccountId, amount: BigInt(amount) }] },
    },
  })
}

describe('F-06 Overview, summary and history', () => {
  it('TEST-F06-01 accounts are grouped by type with balances and this month\'s INCOME/EXPENSE totals', async () => {
    const cookie = await loginCookie('alice')
    await postScenario(cookie)

    const res = await request(app).get('/api/accounts').set('Cookie', cookie)

    expect(res.status).toBe(200)
    const view = res.body.items.map((a: { name: string; type: string; balance: number; periodTotal: number | null }) => [a.name, a.type, a.balance, a.periodTotal])
    expect(view).toEqual([
      ['Bank', 'CASH', 3380000, null],
      ['Credit Card', 'LOAN_TAKEN', 0, null],
      ['Salary', 'INCOME', 0, 3000000],
      ['Dining', 'EXPENSE', 0, 70000],
      ['Electricity', 'EXPENSE', 0, 0],
      ['Groceries', 'EXPENSE', 0, 50000],
      ['Telecom', 'EXPENSE', 0, 0],
    ])
  })

  it('TEST-F06-02 overview shows cash balances, card debt, loans given and the month summary', async () => {
    const cookie = await loginCookie('alice')
    await postScenario(cookie)

    const res = await request(app).get('/api/overview').set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      cash: { items: [{ id: ids.Bank, name: 'Bank', balance: 3380000 }], total: 3380000 },
      loanTaken: { items: [{ id: ids['Credit Card'], name: 'Credit Card', balance: 0 }], total: 0 },
      loanGiven: { items: [], total: 0 },
      month: { ...currentMonthRange(), income: 3000000, expense: 120000, net: 2880000 },
    })
  })

  it('TEST-F06-03 month summary counts salary and spending only, not the opening balance or card repayment', async () => {
    const cookie = await loginCookie('alice')
    await postScenario(cookie)

    const res = await request(app).get('/api/summary').set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ...currentMonthRange(), income: 3000000, expense: 120000, net: 2880000 })
  })

  it('TEST-F06-04 (inclusion) a period includes its first and last day and excludes the day before', async () => {
    const cookie = await loginCookie('alice')
    for (const date of ['2026-10-31', '2026-11-01', '2026-11-30']) await insertTxn(aliceId, ids.Bank, ids.Salary, 100, date)

    const res = await request(app).get('/api/summary?from=2026-11-01&to=2026-11-30').set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ from: '2026-11-01', to: '2026-11-30', income: 200, expense: 0, net: 200 })

    for (const query of ['from=2026-11-30&to=2026-11-01', 'from=2026-02-30', 'to=yesterday']) {
      const bad = await request(app).get(`/api/summary?${query}`).set('Cookie', cookie)
      expect(bad.status, query).toBe(422)
      expect(bad.body.error.code).toBe('VALIDATION_FAILED')
    }
  })

  it('TEST-F06-05 history is newest first, 50 per page, and the detail includes lines', async () => {
    const cookie = await loginCookie('alice')
    for (let i = 0; i < 51; i++) {
      const day = String((i % 28) + 1).padStart(2, '0')
      await insertTxn(aliceId, ids.Bank, ids.Salary, 100 + i, `2026-10-${day}`)
    }

    const page1 = await request(app).get('/api/transactions?page=1').set('Cookie', cookie)
    const page2 = await request(app).get('/api/transactions?page=2').set('Cookie', cookie)

    expect(page1.status).toBe(200)
    expect(page1.body).toMatchObject({ page: 1, pageSize: 50, total: 51 })
    expect(page1.body.items).toHaveLength(50)
    expect(page2.body.items).toHaveLength(1)
    const all = [...page1.body.items, ...page2.body.items]
    for (let i = 1; i < all.length; i++) {
      const [prev, cur] = [all[i - 1], all[i]]
      expect(prev.date > cur.date || (prev.date === cur.date && prev.id > cur.id)).toBe(true)
    }

    const detail = await request(app).get(`/api/transactions/${all[0].id}`).set('Cookie', cookie)
    expect(detail.status).toBe(200)
    expect(detail.body.lines).toEqual([{ id: expect.any(Number), account: { id: ids.Salary, name: 'Salary', type: 'INCOME' }, amount: all[0].total }])

    for (const query of ['page=0', 'pageSize=51', 'page=abc']) {
      expect((await request(app).get(`/api/transactions?${query}`).set('Cookie', cookie)).status, query).toBe(422)
    }
  })

  it('TEST-F06-06 another user\'s transaction is 404 and the admin gets 403 on overview, summary and history', async () => {
    const bobAccounts = await prisma.account.findMany({ where: { userId: bobId } })
    const bobTxn = await insertTxn(bobId, bobAccounts.find((a) => a.name === 'Bank')!.id, bobAccounts.find((a) => a.name === 'Salary')!.id, 999, '2026-11-02')
    const aliceTxn = await insertTxn(aliceId, ids.Bank, ids.Salary, 100, '2026-11-02')
    const alice = await loginCookie('alice')

    const other = await request(app).get(`/api/transactions/${bobTxn.id}`).set('Cookie', alice)
    expect(other.status).toBe(404)
    expect(Object.keys(other.body)).toEqual(['error'])
    expect((await request(app).get('/api/transactions/abc').set('Cookie', alice)).status).toBe(404)

    const list = await request(app).get('/api/transactions').set('Cookie', alice)
    expect(list.body.items.map((t: { id: number }) => t.id)).toEqual([aliceTxn.id])

    const admin = await loginCookie('admin')
    for (const path of ['/api/overview', '/api/summary', '/api/transactions', `/api/transactions/${aliceTxn.id}`]) {
      const res = await request(app).get(path).set('Cookie', admin)
      expect(res.status, path).toBe(403)
      expect(Object.keys(res.body)).toEqual(['error'])
    }
  })
})
