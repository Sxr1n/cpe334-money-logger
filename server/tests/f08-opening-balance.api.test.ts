import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb } from './helpers/db'

let aliceId: number
let acc: Record<string, number>
let bobBank: number
let alice: string

const DATE = '2026-11-20'

async function byName(userId: number) {
  const rows = await prisma.account.findMany({ where: { userId } })
  return Object.fromEntries(rows.map((a) => [a.name, a.id]))
}

const setOpening = (id: number, amount: number) =>
  request(app).put(`/api/accounts/${id}/opening-balance`).set('Cookie', alice).send({ amount, date: '2026-11-01' })
const editOpening = (id: number, body: object, cookie = alice) =>
  request(app).patch(`/api/accounts/${id}/opening-balance`).set('Cookie', cookie).send(body)
const txn = (body: object) => request(app).post('/api/transactions').set('Cookie', alice).send({ date: DATE, ...body })
const account = (id: number) => prisma.account.findUniqueOrThrow({ where: { id } })

beforeEach(async () => {
  await resetDb()
  aliceId = (await createUser('alice', { seedAccounts: true })).id
  const bobId = (await createUser('bob', { seedAccounts: true })).id
  await createUser('admin', { role: 'ADMIN' })
  acc = await byName(aliceId)
  bobBank = (await byName(bobId)).Bank
  alice = await loginCookie('alice')
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('F-08 Opening balance management', () => {
  it('TEST-F08-01 raising the opening balance moves the balance by new − old; no transaction, income unchanged', async () => {
    expect((await setOpening(acc.Bank, 1000000)).status).toBe(200)
    expect((await txn({ form: 'RECEIPT', primaryAccountId: acc.Bank, total: 500000, lines: [{ accountId: acc.Salary, amount: 500000 }] })).status).toBe(201)
    const txnCount = await prisma.txn.count()
    const incomeBefore = (await request(app).get('/api/summary?from=2026-11-01&to=2026-11-30').set('Cookie', alice)).body.income

    const res = await editOpening(acc.Bank, { amount: 2000000, date: '2026-11-02' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: acc.Bank, balance: 2500000, openingBalance: 2000000, openingDate: '2026-11-02' })
    expect(await prisma.txn.count()).toBe(txnCount)
    const incomeAfter = (await request(app).get('/api/summary?from=2026-11-01&to=2026-11-30').set('Cookie', alice)).body.income
    expect(incomeAfter).toBe(incomeBefore)
  })

  it('TEST-F08-02 lowering below what later payments used is rejected; exactly 0 is accepted (CASH)', async () => {
    await setOpening(acc.Bank, 1000000)
    expect((await txn({ form: 'PAYMENT', primaryAccountId: acc.Bank, total: 800000, lines: [{ accountId: acc.Dining, amount: 800000 }] })).status).toBe(201)

    const low = await editOpening(acc.Bank, { amount: 799999, date: '2026-11-01' })
    expect(low.status).toBe(422)
    expect(low.body.error.code).toBe('RULE_VIOLATION')
    expect(low.body.error.details.amount).toBe('Too low: the balance would be −฿0.01 because of later transactions')
    expect(await account(acc.Bank)).toMatchObject({ balance: 200000n, openingBalance: 1000000n })

    const exact = await editOpening(acc.Bank, { amount: 800000, date: '2026-11-01' })
    expect(exact.status).toBe(200)
    expect(exact.body.balance).toBe(0)
  })

  it('TEST-F08-03 same rule for a LOAN_TAKEN debt after a repayment', async () => {
    await setOpening(acc.Bank, 1000000)
    await setOpening(acc['Credit Card'], 500000)
    expect((await txn({ form: 'PAYMENT', primaryAccountId: acc.Bank, total: 300000, lines: [{ accountId: acc['Credit Card'], amount: 300000 }] })).status).toBe(201)

    expect((await editOpening(acc['Credit Card'], { amount: 299999, date: '2026-11-01' })).status).toBe(422)
    expect((await account(acc['Credit Card'])).balance).toBe(200000n)
    const ok = await editOpening(acc['Credit Card'], { amount: 300000, date: '2026-11-01' })
    expect(ok.status).toBe(200)
    expect(ok.body.balance).toBe(0)
  })

  it('TEST-F08-04 validation, type, archived and not-set cases leave the row unchanged', async () => {
    await setOpening(acc.Bank, 1000000)
    const before = await account(acc.Bank)
    for (const body of [
      { amount: -1, date: '2026-11-01' },
      { amount: 1.5, date: '2026-11-01' },
      { amount: 100000000000, date: '2026-11-01' },
      { amount: 1000, date: '2026-02-30' },
    ]) {
      const res = await editOpening(acc.Bank, body)
      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('VALIDATION_FAILED')
    }
    expect(await account(acc.Bank)).toEqual(before)

    const income = await editOpening(acc.Salary, { amount: 1000, date: '2026-11-01' })
    expect(income.status).toBe(422)
    expect(income.body.error.code).toBe('RULE_VIOLATION')

    const archived = await prisma.account.create({
      data: { userId: aliceId, name: 'Old', type: 'CASH', openingBalance: 0n, openingDate: new Date('2026-11-01'), archivedAt: new Date() },
    })
    const arch = await editOpening(archived.id, { amount: 1000, date: '2026-11-01' })
    expect(arch.status).toBe(422)
    expect(arch.body.error.code).toBe('RULE_VIOLATION')
    expect((await account(archived.id)).balance).toBe(0n)

    const wallet = await prisma.account.create({ data: { userId: aliceId, name: 'Wallet', type: 'CASH' } })
    const notSet = await editOpening(wallet.id, { amount: 1000, date: '2026-11-01' })
    expect(notSet.status).toBe(409)
    expect(await account(wallet.id)).toMatchObject({ balance: 0n, openingBalance: null })
  })

  it('TEST-F08-05 401 / 403 / cross-user 404', async () => {
    const body = { amount: 1000, date: '2026-11-01' }
    expect((await request(app).patch(`/api/accounts/${acc.Bank}/opening-balance`).send(body)).status).toBe(401)
    expect((await editOpening(acc.Bank, body, await loginCookie('admin'))).status).toBe(403)

    await prisma.account.update({ where: { id: bobBank }, data: { balance: 5000n, openingBalance: 5000n, openingDate: new Date('2026-11-01') } })
    expect((await editOpening(bobBank, body)).status).toBe(404)
    expect(await account(bobBank)).toMatchObject({ balance: 5000n, openingBalance: 5000n })
  })
})
