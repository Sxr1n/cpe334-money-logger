import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb } from './helpers/db'

// CHG-01 credit limit on LOAN_TAKEN accounts (FR-28, BR-18) — F-05 contract v0.6, AC-F05-09..15
let aliceId: number
let bobId: number
let acc: Record<string, number>
let bobAcc: Record<string, number>
let alice: string

const DATE = '2026-11-22'

async function byName(userId: number) {
  const rows = await prisma.account.findMany({ where: { userId } })
  return Object.fromEntries(rows.map((a) => [a.name, a.id]))
}

const setLimit = (id: number, creditLimit: unknown, cookie: string | null = alice) => {
  const req = request(app).patch(`/api/accounts/${id}`)
  return (cookie ? req.set('Cookie', cookie) : req).send({ creditLimit })
}
const setOpening = (id: number, amount: number) =>
  request(app).put(`/api/accounts/${id}/opening-balance`).set('Cookie', alice).send({ amount, date: '2026-11-01' })
const postTxn = (body: object) => request(app).post('/api/transactions').set('Cookie', alice).send({ date: DATE, ...body })
const charge = (amount: number) =>
  postTxn({ form: 'PAYMENT', primaryAccountId: acc['Credit Card'], total: amount, lines: [{ accountId: acc.Dining, amount }] })
const account = (id: number) => prisma.account.findUniqueOrThrow({ where: { id } })
const listed = async (id: number) =>
  (await request(app).get('/api/accounts').set('Cookie', alice)).body.items.find((a: { id: number }) => a.id === id)
const txnCount = () => prisma.txn.count()

beforeEach(async () => {
  await resetDb()
  aliceId = (await createUser('alice', { seedAccounts: true })).id
  bobId = (await createUser('bob', { seedAccounts: true })).id
  await createUser('admin', { role: 'ADMIN' })
  acc = await byName(aliceId)
  bobAcc = await byName(bobId)
  alice = await loginCookie('alice')
  await setOpening(acc.Bank, 3000000)
  await setOpening(acc['Credit Card'], 120000)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('CHG-01 Credit limit (API-DB)', () => {
  it('TEST-F05-09 set, change to the debt, and remove a credit limit; available credit is listed', async () => {
    const set = await setLimit(acc['Credit Card'], 500000)
    expect(set.status).toBe(200)
    expect(set.body.creditLimit).toBe(500000)
    expect(set.body.availableCredit).toBe(380000)
    const row = await listed(acc['Credit Card'])
    expect(row.creditLimit).toBe(500000)
    expect(row.availableCredit).toBe(380000)

    const equal = await setLimit(acc['Credit Card'], 120000)
    expect(equal.status).toBe(200)
    expect(equal.body.availableCredit).toBe(0)

    const removed = await setLimit(acc['Credit Card'], null)
    expect(removed.status).toBe(200)
    const after = await listed(acc['Credit Card'])
    expect(after.creditLimit).toBeNull()
    expect(after.availableCredit).toBeNull()
    expect((await listed(acc.Bank)).availableCredit).toBeNull()
  })

  it('TEST-F05-10 invalid limits are rejected and the stored limit is unchanged', async () => {
    expect((await setLimit(acc['Credit Card'], 500000)).status).toBe(200)

    const below = await setLimit(acc['Credit Card'], 119999)
    expect(below.status).toBe(422)
    expect(below.body.error.code).toBe('RULE_VIOLATION')
    expect(below.body.error.details.creditLimit).toBe('Limit is below the current debt ฿1,200.00')

    for (const v of [0, -1, 100000000000]) {
      const r = await setLimit(acc['Credit Card'], v)
      expect(r.status, String(v)).toBe(422)
      expect(r.body.error.code, String(v)).toBe('VALIDATION_FAILED')
    }
    for (const v of [1.5, '5000']) expect((await setLimit(acc['Credit Card'], v)).status, String(v)).toBe(400)

    for (const id of [acc.Bank, acc.Salary]) {
      const r = await setLimit(id, 500000)
      expect(r.status).toBe(422)
      expect(r.body.error.code).toBe('RULE_VIOLATION')
    }
    const momId = (await request(app).post('/api/accounts').set('Cookie', alice).send({ name: 'Loan from Mom', type: 'LOAN_TAKEN' })).body.id
    expect((await request(app).patch(`/api/accounts/${momId}`).set('Cookie', alice).send({ archived: true })).status).toBe(200)
    expect((await setLimit(momId, 500000)).status).toBe(422)

    expect((await account(acc['Credit Card'])).creditLimit).toBe(500000n)
    expect((await account(acc.Bank)).creditLimit).toBeNull()
    expect((await account(momId)).creditLimit).toBeNull()
  })

  it('TEST-F05-11 a charge over the limit is rejected; a charge to exactly the limit is accepted (BR-18)', async () => {
    await setLimit(acc['Credit Card'], 500000)
    const before = await txnCount()

    const over = await charge(380001)
    expect(over.status).toBe(422)
    expect(over.body.error.code).toBe('RULE_VIOLATION')
    expect(over.body.error.details.total).toBe('Over the credit limit of Credit Card (available ฿3,800.00)')
    expect(await txnCount()).toBe(before)
    expect((await account(acc['Credit Card'])).balance).toBe(120000n)

    expect((await charge(380000)).status).toBe(201)
    expect((await account(acc['Credit Card'])).balance).toBe(500000n)
  })

  it('TEST-F05-12 borrowing over the limit is rejected; repayment is not blocked; then borrowing up to the limit works', async () => {
    await setLimit(acc['Credit Card'], 500000)
    expect((await charge(380000)).status).toBe(201)

    const borrow = (amount: number) =>
      postTxn({ form: 'RECEIPT', primaryAccountId: acc.Bank, total: amount, lines: [{ accountId: acc['Credit Card'], amount }] })
    const over = await borrow(1)
    expect(over.status).toBe(422)
    expect(over.body.error.details['lines[0].amount']).toBe('Over the credit limit of Credit Card (available ฿0.00)')
    expect((await account(acc.Bank)).balance).toBe(3000000n)
    expect((await account(acc['Credit Card'])).balance).toBe(500000n)

    const repay = await postTxn({ form: 'PAYMENT', primaryAccountId: acc.Bank, total: 100000, lines: [{ accountId: acc['Credit Card'], amount: 100000 }] })
    expect(repay.status).toBe(201)
    expect((await borrow(100000)).status).toBe(201)
    expect((await account(acc['Credit Card'])).balance).toBe(500000n)
  })

  it('TEST-F05-13 a card without a limit keeps the baseline; a limit never changes income or expense', async () => {
    const summary = async () => (await request(app).get('/api/summary?from=2026-11-01&to=2026-11-30').set('Cookie', alice)).body
    const before = await summary()

    expect((await charge(99999999999)).status).toBe(201)
    const afterCharge = await summary()
    expect(afterCharge.expense).toBe(before.expense + 99999999999)
    expect(afterCharge.income).toBe(before.income)

    expect((await setLimit(acc['Credit Card'], 99999999999)).status).toBe(422) // debt 100000119999 > max limit
    await setLimit(acc['Credit Card'], null)
    expect(await summary()).toEqual(afterCharge)
  })

  it('TEST-F05-14 an opening-balance change that would exceed the limit is rejected (BR-18 × F-08)', async () => {
    const cardB = (await request(app).post('/api/accounts').set('Cookie', alice).send({ name: 'Card B', type: 'LOAN_TAKEN' })).body.id
    expect((await setOpening(cardB, 100000)).status).toBe(200)
    expect((await setLimit(cardB, 150000)).status).toBe(200)

    const edit = (amount: number) =>
      request(app).patch(`/api/accounts/${cardB}/opening-balance`).set('Cookie', alice).send({ amount, date: '2026-11-01' })
    const over = await edit(150001)
    expect(over.status).toBe(422)
    expect(over.body.error.code).toBe('RULE_VIOLATION')
    expect((await account(cardB)).balance).toBe(100000n)
    expect((await account(cardB)).openingBalance).toBe(100000n)

    expect((await edit(150000)).status).toBe(200)
    expect((await account(cardB)).balance).toBe(150000n)
  })

  it('TEST-F05-15 credit limit access: 401 without session, 403 for admin, 404 for another user', async () => {
    expect((await setLimit(acc['Credit Card'], 500000, null)).status).toBe(401)
    expect((await setLimit(acc['Credit Card'], 500000, await loginCookie('admin'))).status).toBe(403)

    const cross = await setLimit(bobAcc['Credit Card'], 500000)
    expect(cross.status).toBe(404)
    expect((await account(bobAcc['Credit Card'])).creditLimit).toBeNull()
    expect((await account(acc['Credit Card'])).creditLimit).toBeNull()
  })
})
