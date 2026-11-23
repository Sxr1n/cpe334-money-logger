import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb } from './helpers/db'

let aliceId: number
let bobId: number
let acc: Record<string, number> // alice's seeded accounts by name
let bobAcc: Record<string, number>
let alice: string

const DATE = '2026-11-20'

async function byName(userId: number) {
  const rows = await prisma.account.findMany({ where: { userId } })
  return Object.fromEntries(rows.map((a) => [a.name, a.id]))
}

const post = (cookie: string, body: object) => request(app).post('/api/accounts').set('Cookie', cookie).send(body)
const patch = (cookie: string, id: number, body: object) =>
  request(app).patch(`/api/accounts/${id}`).set('Cookie', cookie).send(body)

beforeEach(async () => {
  await resetDb()
  aliceId = (await createUser('alice', { seedAccounts: true })).id
  bobId = (await createUser('bob', { seedAccounts: true })).id
  await createUser('admin', { role: 'ADMIN' })
  acc = await byName(aliceId)
  bobAcc = await byName(bobId)
  alice = await loginCookie('alice')
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('F-07 Account management', () => {
  it('TEST-F07-01 creates accounts of all five types, listed and usable', async () => {
    const created: Record<string, number> = {}
    for (const [name, type] of [
      ['Wallet', 'CASH'],
      ['Loan to Ken', 'LOAN_GIVEN'],
      ['Loan from Mom', 'LOAN_TAKEN'],
      ['Interest', 'INCOME'],
      ['Transport', 'EXPENSE'],
    ]) {
      const res = await post(alice, { name, type })
      expect(res.status).toBe(201)
      expect(res.body).toMatchObject({ name, type, balance: 0, openingBalance: null, openingDate: null, archived: false })
      created[name] = res.body.id
    }

    const list = await request(app).get('/api/accounts').set('Cookie', alice)
    for (const id of Object.values(created)) {
      expect(list.body.items.find((a: { id: number }) => a.id === id)).toMatchObject({ archived: false })
    }

    const receipt = await request(app)
      .post('/api/transactions')
      .set('Cookie', alice)
      .send({ form: 'RECEIPT', primaryAccountId: created.Wallet, date: DATE, total: 10000, lines: [{ accountId: created.Interest, amount: 10000 }] })
    expect(receipt.status).toBe(201)
  })

  it('TEST-F07-02 validates name and type', async () => {
    const before = await prisma.account.count()
    for (const body of [
      { name: '', type: 'CASH' },
      { name: '   ', type: 'CASH' },
      { name: 'x'.repeat(51), type: 'CASH' },
    ]) {
      const res = await post(alice, body)
      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('VALIDATION_FAILED')
      expect(res.body.error.details.name).toBeDefined()
    }
    const badType = await post(alice, { name: 'Savings', type: 'SAVINGS' })
    expect(badType.status).toBe(422)
    expect(badType.body.error.details.type).toBeDefined()
    expect(await prisma.account.count()).toBe(before)

    expect((await post(alice, { name: 'y'.repeat(50), type: 'CASH' })).status).toBe(201)
    const trimmed = await post(alice, { name: '  Wallet  ', type: 'CASH' })
    expect(trimmed.status).toBe(201)
    expect(trimmed.body.name).toBe('Wallet')
  })

  it('TEST-F07-03 rejects duplicate names per user and type, ignoring case', async () => {
    const dup = await post(alice, { name: 'bank', type: 'CASH' })
    expect(dup.status).toBe(409)
    expect(dup.body.error.code).toBe('CONFLICT')
    expect(dup.body.error.details.name).toBe('You already have a CASH account with this name')
    expect(await prisma.account.count({ where: { userId: aliceId, type: 'CASH' } })).toBe(1)

    expect((await post(alice, { name: 'Bank', type: 'EXPENSE' })).status).toBe(201)
    expect((await post(alice, { name: 'Wallet', type: 'CASH' })).status).toBe(201)
    expect((await post(await loginCookie('bob'), { name: 'Wallet', type: 'CASH' })).status).toBe(201)

    const rename = await patch(alice, acc.Dining, { name: 'groceries' })
    expect(rename.status).toBe(409)
    expect((await prisma.account.findUnique({ where: { id: acc.Dining } }))!.name).toBe('Dining')
  })

  it('TEST-F07-04 rename shows the new name on earlier transactions', async () => {
    const purchase = await request(app)
      .post('/api/transactions')
      .set('Cookie', alice)
      .send({ form: 'PAYMENT', primaryAccountId: acc['Credit Card'], date: DATE, total: 70000, lines: [{ accountId: acc.Dining, amount: 70000 }] })
    expect(purchase.status).toBe(201)

    const res = await patch(alice, acc.Dining, { name: 'Food & drinks' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: acc.Dining, name: 'Food & drinks', archived: false })

    const detail = await request(app).get(`/api/transactions/${purchase.body.id}`).set('Cookie', alice)
    expect(detail.body.lines[0].account.name).toBe('Food & drinks')
  })

  it('TEST-F07-05 archive needs a zero balance for CASH/LOAN; EXPENSE keeps its history', async () => {
    const ok = await patch(alice, acc.Bank, { archived: true })
    expect(ok.status).toBe(200)
    expect(ok.body.archived).toBe(true)
    expect((await patch(alice, acc.Bank, { archived: false })).status).toBe(200)

    await prisma.account.update({ where: { id: acc.Bank }, data: { balance: 1n, openingBalance: 1n, openingDate: new Date(DATE) } })
    const blocked = await patch(alice, acc.Bank, { archived: true })
    expect(blocked.status).toBe(422)
    expect(blocked.body.error.code).toBe('RULE_VIOLATION')
    expect(blocked.body.error.details.archived).toBe('Balance must be ฿0.00 to archive (now ฿0.01)')
    const bank = await prisma.account.findUnique({ where: { id: acc.Bank } })
    expect(bank!.balance).toBe(1n)
    expect(bank!.archivedAt).toBeNull()

    const pay = await request(app)
      .post('/api/transactions')
      .set('Cookie', alice)
      .send({ form: 'PAYMENT', primaryAccountId: acc['Credit Card'], date: DATE, total: 30000, lines: [{ accountId: acc.Telecom, amount: 30000 }] })
    expect(pay.status).toBe(201)
    expect((await patch(alice, acc.Telecom, { archived: true })).status).toBe(200)

    const summary = await request(app).get('/api/summary?from=2026-11-01&to=2026-11-30').set('Cookie', alice)
    expect(summary.body.expense).toBe(30000)
    const history = await request(app).get('/api/transactions').set('Cookie', alice)
    expect(history.body.items.map((t: { id: number }) => t.id)).toContain(pay.body.id)
  })

  it('TEST-F07-06 archived accounts cannot be used until unarchived', async () => {
    const wallet = (await post(alice, { name: 'Wallet', type: 'CASH' })).body.id
    expect((await patch(alice, wallet, { archived: true })).status).toBe(200)
    expect((await patch(alice, acc.Telecom, { archived: true })).status).toBe(200)
    const before = await prisma.txn.count()

    const payment = { form: 'PAYMENT', primaryAccountId: acc['Credit Card'], date: DATE, total: 5000, lines: [{ accountId: acc.Telecom, amount: 5000 }] }
    expect((await request(app).post('/api/transactions').set('Cookie', alice).send(payment)).status).toBe(404)
    const intoWallet = { form: 'RECEIPT', primaryAccountId: wallet, date: DATE, total: 5000, lines: [{ accountId: acc.Salary, amount: 5000 }] }
    expect((await request(app).post('/api/transactions').set('Cookie', alice).send(intoWallet)).status).toBe(404)
    expect(await prisma.txn.count()).toBe(before)

    expect((await patch(alice, acc.Telecom, { archived: false })).status).toBe(200)
    expect((await request(app).post('/api/transactions').set('Cookie', alice).send(payment)).status).toBe(201)

    const opening = await request(app).put(`/api/accounts/${wallet}/opening-balance`).set('Cookie', alice).send({ amount: 1000, date: DATE })
    expect(opening.status).toBe(422)
    expect(opening.body.error.code).toBe('RULE_VIOLATION')
  })

  it('TEST-F07-07 401 / 403 / cross-user 404; identity only from the session', async () => {
    expect((await request(app).post('/api/accounts').send({ name: 'X', type: 'CASH' })).status).toBe(401)
    expect((await request(app).patch(`/api/accounts/${acc.Bank}`).send({ name: 'X' })).status).toBe(401)

    const admin = await loginCookie('admin')
    expect((await post(admin, { name: 'X', type: 'CASH' })).status).toBe(403)
    expect((await patch(admin, acc.Bank, { name: 'X' })).status).toBe(403)

    expect((await patch(alice, bobAcc.Bank, { name: 'Hacked' })).status).toBe(404)
    expect((await patch(alice, bobAcc.Bank, { archived: true })).status).toBe(404)
    const bobBank = await prisma.account.findUnique({ where: { id: bobAcc.Bank } })
    expect(bobBank).toMatchObject({ name: 'Bank', archivedAt: null })

    const res = await post(alice, { name: 'Wallet', type: 'CASH', userId: bobId })
    expect(res.status).toBe(201)
    expect((await prisma.account.findUnique({ where: { id: res.body.id } }))!.userId).toBe(aliceId)
  })
})
