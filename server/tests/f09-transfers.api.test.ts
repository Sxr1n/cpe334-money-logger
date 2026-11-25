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
let walletId: number
let bobWalletId: number

const DATE = '2026-11-20'

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
  bobAcc = await byName(bobId)
  alice = await loginCookie('alice')

  const w = await request(app).post('/api/accounts').set('Cookie', alice).send({ name: 'Wallet', type: 'CASH' })
  walletId = w.body.id
  const bw = await prisma.account.create({ data: { userId: bobId, name: 'Wallet', type: 'CASH', balance: 50000n } })
  bobWalletId = bw.id
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('F-09 Transfers between own cash accounts (API-DB)', () => {
  it('TEST-F09-01 PAYMENT transfer moves balances and leaves income/expense unchanged', async () => {
    await setOpening(acc.Bank, 1000000)
    const before = (await getSummary()).body

    const res = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 300000,
      lines: [{ accountId: walletId, amount: 300000 }],
    })
    expect(res.status).toBe(201)
    expect((await account(acc.Bank)).balance).toBe(700000n)
    expect((await account(walletId)).balance).toBe(300000n)

    const after = (await getSummary()).body
    expect(after.income).toBe(before.income)
    expect(after.expense).toBe(before.expense)
  })

  it('TEST-F09-02 RECEIPT transfer pulls from CASH line and leaves income/expense unchanged', async () => {
    await setOpening(acc.Bank, 700000)
    await setOpening(walletId, 300000)
    const before = (await getSummary()).body

    const res = await postTxn({
      form: 'RECEIPT',
      primaryAccountId: walletId,
      total: 200000,
      lines: [{ accountId: acc.Bank, amount: 200000 }],
    })
    expect(res.status).toBe(201)
    expect((await account(acc.Bank)).balance).toBe(500000n)
    expect((await account(walletId)).balance).toBe(500000n)

    const after = (await getSummary()).body
    expect(after.income).toBe(before.income)
    expect(after.expense).toBe(before.expense)
  })

  it('TEST-F09-03 BR-07 rejects RECEIPT CASH line over balance, accepts exact balance, rejects PAYMENT overdraft', async () => {
    await setOpening(acc.Bank, 500000)
    const countBefore = await prisma.txn.count()

    const over = await postTxn({
      form: 'RECEIPT',
      primaryAccountId: walletId,
      total: 500001,
      lines: [{ accountId: acc.Bank, amount: 500001 }],
    })
    expect(over.status).toBe(422)
    expect(over.body.error.code).toBe('RULE_VIOLATION')
    expect(over.body.error.details['lines[0].amount']).toBeDefined()
    expect(await prisma.txn.count()).toBe(countBefore)
    expect((await account(acc.Bank)).balance).toBe(500000n)
    expect((await account(walletId)).balance).toBe(0n)

    const exact = await postTxn({
      form: 'RECEIPT',
      primaryAccountId: walletId,
      total: 500000,
      lines: [{ accountId: acc.Bank, amount: 500000 }],
    })
    expect(exact.status).toBe(201)
    expect((await account(acc.Bank)).balance).toBe(0n)
    expect((await account(walletId)).balance).toBe(500000n)

    const payOver = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 1,
      lines: [{ accountId: walletId, amount: 1 }],
    })
    expect(payOver.status).toBe(422)
    expect(payOver.body.error.code).toBe('RULE_VIOLATION')
  })

  it('TEST-F09-04 rejects self-transfer (422), other user CASH line (404), archived CASH line (404)', async () => {
    await setOpening(acc.Bank, 500000)

    const same = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 10000,
      lines: [{ accountId: acc.Bank, amount: 10000 }],
    })
    expect(same.status).toBe(422)

    const foreign = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 10000,
      lines: [{ accountId: bobWalletId, amount: 10000 }],
    })
    expect(foreign.status).toBe(404)
    expect((await account(bobWalletId)).balance).toBe(50000n)

    await request(app).patch(`/api/accounts/${walletId}`).set('Cookie', alice).send({ archived: true })
    const archived = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 10000,
      lines: [{ accountId: walletId, amount: 10000 }],
    })
    expect(archived.status).toBe(404)
  })

  it('TEST-F09-05 card cash advance increases Credit Card debt and Wallet without changing expense', async () => {
    const before = (await getSummary()).body
    const res = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc['Credit Card'],
      total: 100000,
      lines: [{ accountId: walletId, amount: 100000 }],
    })
    expect(res.status).toBe(201)
    expect((await account(acc['Credit Card'])).balance).toBe(100000n)
    expect((await account(walletId)).balance).toBe(100000n)
    expect((await getSummary()).body.expense).toBe(before.expense)
  })

  it('TEST-F09-06 mixed PAYMENT counts only EXPENSE line toward expense', async () => {
    await setOpening(acc.Bank, 200000)
    const before = (await getSummary()).body

    const res = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 150000,
      lines: [
        { accountId: acc.Dining, amount: 50000 },
        { accountId: walletId, amount: 100000 },
      ],
    })
    expect(res.status).toBe(201)
    expect((await account(acc.Bank)).balance).toBe(50000n)
    expect((await account(walletId)).balance).toBe(100000n)
    expect((await getSummary()).body.expense).toBe(before.expense + 50000)
  })
})
