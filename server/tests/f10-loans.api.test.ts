import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb } from './helpers/db'

let aliceId: number
let bobId: number
let acc: Record<string, number>
let alice: string
let kenId: number
let momId: number
let walletId: number
let bobKenId: number

const DATE = '2026-11-22'

async function byName(userId: number) {
  const rows = await prisma.account.findMany({ where: { userId } })
  return Object.fromEntries(rows.map((a) => [a.name, a.id]))
}

const setOpening = (id: number, amount: number) =>
  request(app).put(`/api/accounts/${id}/opening-balance`).set('Cookie', alice).send({ amount, date: '2026-11-01' })

const postTxn = (body: object, cookie = alice) =>
  request(app).post('/api/transactions').set('Cookie', cookie).send({ date: DATE, ...body })

const getSummary = () =>
  request(app).get('/api/summary?from=2026-11-01&to=2026-11-30').set('Cookie', alice)

const account = (id: number) => prisma.account.findUniqueOrThrow({ where: { id } })

beforeEach(async () => {
  await resetDb()
  aliceId = (await createUser('alice', { seedAccounts: true })).id
  bobId = (await createUser('bob', { seedAccounts: true })).id
  await createUser('admin', { role: 'ADMIN' })
  acc = await byName(aliceId)
  alice = await loginCookie('alice')

  kenId = (await request(app).post('/api/accounts').set('Cookie', alice).send({ name: 'Loan to Ken', type: 'LOAN_GIVEN' })).body.id
  momId = (await request(app).post('/api/accounts').set('Cookie', alice).send({ name: 'Loan from Mom', type: 'LOAN_TAKEN' })).body.id
  walletId = (await request(app).post('/api/accounts').set('Cookie', alice).send({ name: 'Wallet', type: 'CASH' })).body.id
  bobKenId = (await prisma.account.create({ data: { userId: bobId, name: 'Loan to Ken', type: 'LOAN_GIVEN', balance: 50000n } })).id
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('F-10 Loans given and taken (API-DB)', () => {
  it('TEST-F10-01 lending from Bank increases LOAN_GIVEN without changing expense', async () => {
    await setOpening(acc.Bank, 1000000)
    const before = (await getSummary()).body

    const res = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 200000,
      lines: [{ accountId: kenId, amount: 200000 }],
    })
    expect(res.status).toBe(201)
    expect((await account(acc.Bank)).balance).toBe(800000n)
    expect((await account(kenId)).balance).toBe(200000n)
    expect((await getSummary()).body.expense).toBe(before.expense)
  })

  it('TEST-F10-02 LOAN_GIVEN repayment enforces BR-08 (150000 ok, 50001 rejected, 50000 ok)', async () => {
    await setOpening(kenId, 200000)
    const before = (await getSummary()).body

    const r1 = await postTxn({
      form: 'RECEIPT',
      primaryAccountId: acc.Bank,
      total: 150000,
      lines: [{ accountId: kenId, amount: 150000 }],
    })
    expect(r1.status).toBe(201)
    expect((await account(kenId)).balance).toBe(50000n)
    expect((await getSummary()).body.income).toBe(before.income)

    const countBefore = await prisma.txn.count()
    const over = await postTxn({
      form: 'RECEIPT',
      primaryAccountId: acc.Bank,
      total: 50001,
      lines: [{ accountId: kenId, amount: 50001 }],
    })
    expect(over.status).toBe(422)
    expect(over.body.error.code).toBe('RULE_VIOLATION')
    expect(await prisma.txn.count()).toBe(countBefore)
    expect((await account(kenId)).balance).toBe(50000n)

    const exact = await postTxn({
      form: 'RECEIPT',
      primaryAccountId: acc.Bank,
      total: 50000,
      lines: [{ accountId: kenId, amount: 50000 }],
    })
    expect(exact.status).toBe(201)
    expect((await account(kenId)).balance).toBe(0n)
  })

  it('TEST-F10-03 borrowing via RECEIPT LOAN_TAKEN increases debt and Bank without changing income', async () => {
    const before = (await getSummary()).body
    const res = await postTxn({
      form: 'RECEIPT',
      primaryAccountId: acc.Bank,
      total: 500000,
      lines: [{ accountId: momId, amount: 500000 }],
    })
    expect(res.status).toBe(201)
    expect((await account(momId)).balance).toBe(500000n)
    expect((await account(acc.Bank)).balance).toBe(500000n)
    expect((await getSummary()).body.income).toBe(before.income)
  })

  it('TEST-F10-04 mixed RECEIPT (Salary + Ken repayment) counts only Salary as income', async () => {
    await setOpening(kenId, 50000)
    const before = (await getSummary()).body

    const res = await postTxn({
      form: 'RECEIPT',
      primaryAccountId: acc.Bank,
      total: 3050000,
      lines: [
        { accountId: acc.Salary, amount: 3000000 },
        { accountId: kenId, amount: 50000 },
      ],
    })
    expect(res.status).toBe(201)
    expect((await account(kenId)).balance).toBe(0n)
    expect((await account(acc.Bank)).balance).toBe(3050000n)
    expect((await getSummary()).body.income).toBe(before.income + 3000000)
  })

  it('TEST-F10-05 4-line PAYMENT (Dining + Credit Card + Ken + Wallet) applies all effects and counts only Dining as expense', async () => {
    await setOpening(acc.Bank, 200000)
    await setOpening(acc['Credit Card'], 50000)
    const before = (await getSummary()).body

    const res = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 100000,
      lines: [
        { accountId: acc.Dining, amount: 10000 },
        { accountId: acc['Credit Card'], amount: 20000 },
        { accountId: kenId, amount: 30000 },
        { accountId: walletId, amount: 40000 },
      ],
    })
    expect(res.status).toBe(201)
    expect((await account(acc.Bank)).balance).toBe(100000n)
    expect((await account(acc['Credit Card'])).balance).toBe(30000n)
    expect((await account(kenId)).balance).toBe(30000n)
    expect((await account(walletId)).balance).toBe(40000n)
    expect((await getSummary()).body.expense).toBe(before.expense + 10000)
  })

  it('TEST-F10-06 rejects invalid form/account combinations (422) and cross-user loan line (404)', async () => {
    await setOpening(acc.Bank, 200000)

    expect(
      (await postTxn({ form: 'RECEIPT', primaryAccountId: acc.Bank, total: 1000, lines: [{ accountId: acc.Dining, amount: 1000 }] })).status,
    ).toBe(422)
    expect(
      (await postTxn({ form: 'RECEIPT', primaryAccountId: momId, total: 1000, lines: [{ accountId: acc.Salary, amount: 1000 }] })).status,
    ).toBe(422)
    expect(
      (await postTxn({ form: 'PAYMENT', primaryAccountId: kenId, total: 1000, lines: [{ accountId: acc.Dining, amount: 1000 }] })).status,
    ).toBe(422)

    const foreign = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 1000,
      lines: [{ accountId: bobKenId, amount: 1000 }],
    })
    expect(foreign.status).toBe(404)
    expect((await account(bobKenId)).balance).toBe(50000n)
  })

  it('TEST-F10-07 GET /api/overview reflects Loan to Ken and Loan from Mom totals', async () => {
    await setOpening(acc.Bank, 1000000)
    expect((await postTxn({ form: 'PAYMENT', primaryAccountId: acc.Bank, total: 200000, lines: [{ accountId: kenId, amount: 200000 }] })).status).toBe(201)
    expect((await postTxn({ form: 'RECEIPT', primaryAccountId: acc.Bank, total: 500000, lines: [{ accountId: momId, amount: 500000 }] })).status).toBe(201)

    const ov = await request(app).get('/api/overview').set('Cookie', alice)
    expect(ov.status).toBe(200)
    expect(ov.body.loanGiven.total).toBe(200000)
    expect(ov.body.loanTaken.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: momId, name: 'Loan from Mom', balance: 500000 })]),
    )
  })
})
