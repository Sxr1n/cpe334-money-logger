import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb } from './helpers/db'

let aliceId: number
let bobId: number
let aliceBankId: number
let aliceCreditId: number
let aliceSalaryId: number
let bobBankId: number

beforeEach(async () => {
  await resetDb()
  const alice = await createUser('alice', { seedAccounts: true })
  const bob = await createUser('bob', { seedAccounts: true })
  aliceId = alice.id
  bobId = bob.id

  const aliceAccounts = await prisma.account.findMany({ where: { userId: aliceId } })
  aliceBankId = aliceAccounts.find((a) => a.name === 'Bank')!.id
  aliceCreditId = aliceAccounts.find((a) => a.name === 'Credit Card')!.id
  aliceSalaryId = aliceAccounts.find((a) => a.name === 'Salary')!.id

  const bobAccounts = await prisma.account.findMany({ where: { userId: bobId } })
  bobBankId = bobAccounts.find((a) => a.name === 'Bank')!.id
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('F-03 Opening balance', () => {
  it('TEST-F03-01 alice sets opening balance on Bank; verified on GET /api/accounts', async () => {
    const cookie = await loginCookie('alice')

    const res = await request(app)
      .put(`/api/accounts/${aliceBankId}/opening-balance`)
      .set('Cookie', cookie)
      .send({ amount: 500000, date: '2026-11-01' })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      id: aliceBankId,
      name: 'Bank',
      type: 'CASH',
      balance: 500000,
      openingBalance: 500000,
      openingDate: '2026-11-01',
    })

    const listRes = await request(app).get('/api/accounts').set('Cookie', cookie)
    expect(listRes.status).toBe(200)
    expect(listRes.body.items).toBeDefined()
    const bank = listRes.body.items.find((a: { id: number }) => a.id === aliceBankId)
    expect(bank).toMatchObject({
      id: aliceBankId,
      balance: 500000,
      openingBalance: 500000,
      openingDate: '2026-11-01',
    })
  })

  it('TEST-F03-02 setting opening balance creates no row in transactions or transaction_lines', async () => {
    const cookie = await loginCookie('alice')

    // Count rows before (if tables exist)
    const txTables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('transactions', 'transaction_lines')
    `
    const countBefore = txTables.length === 2
      ? Number((await prisma.$queryRaw<[{ count: bigint }]>`SELECT count(*) FROM transactions`)[0].count)
      : 0
    expect(countBefore).toBe(0)

    const res = await request(app)
      .put(`/api/accounts/${aliceBankId}/opening-balance`)
      .set('Cookie', cookie)
      .send({ amount: 500000, date: '2026-11-01' })

    expect(res.status).toBe(200)

    // Count rows after
    if (txTables.length === 2) {
      const txCount = Number((await prisma.$queryRaw<[{ count: bigint }]>`SELECT count(*) FROM transactions`)[0].count)
      const lineCount = Number((await prisma.$queryRaw<[{ count: bigint }]>`SELECT count(*) FROM transaction_lines`)[0].count)
      expect(txCount).toBe(0)
      expect(lineCount).toBe(0)
    }
  })

  it('TEST-F03-03 rejects negative, non-integer, and excessive amounts; accepts 0 and max satang', async () => {
    const cookie = await loginCookie('alice')

    // Negative amount -> 422 VALIDATION_FAILED
    const r1 = await request(app)
      .put(`/api/accounts/${aliceBankId}/opening-balance`)
      .set('Cookie', cookie)
      .send({ amount: -1, date: '2026-11-01' })
    expect(r1.status).toBe(422)
    expect(r1.body.error.code).toBe('VALIDATION_FAILED')

    // Non-integer amount -> 422 VALIDATION_FAILED
    const r2 = await request(app)
      .put(`/api/accounts/${aliceBankId}/opening-balance`)
      .set('Cookie', cookie)
      .send({ amount: 100.5, date: '2026-11-01' })
    expect(r2.status).toBe(422)
    expect(r2.body.error.code).toBe('VALIDATION_FAILED')

    // Above 99,999,999,999 -> 422 VALIDATION_FAILED
    const r3 = await request(app)
      .put(`/api/accounts/${aliceBankId}/opening-balance`)
      .set('Cookie', cookie)
      .send({ amount: 100000000000, date: '2026-11-01' })
    expect(r3.status).toBe(422)
    expect(r3.body.error.code).toBe('VALIDATION_FAILED')

    // Bank account remains unchanged
    const bankCheck = await prisma.account.findUniqueOrThrow({ where: { id: aliceBankId } })
    expect(bankCheck.balance).toBe(0n)
    expect(bankCheck.openingBalance).toBeNull()

    // Amount 0 -> 200 accepted
    const r0 = await request(app)
      .put(`/api/accounts/${aliceBankId}/opening-balance`)
      .set('Cookie', cookie)
      .send({ amount: 0, date: '2026-11-01' })
    expect(r0.status).toBe(200)
    expect(r0.body.balance).toBe(0)
    expect(r0.body.openingBalance).toBe(0)

    // Max satang 99,999,999,999 on a fresh account (Credit Card) -> 200 accepted
    const rMax = await request(app)
      .put(`/api/accounts/${aliceCreditId}/opening-balance`)
      .set('Cookie', cookie)
      .send({ amount: 99999999999, date: '2026-11-01' })
    expect(rMax.status).toBe(200)
    expect(rMax.body.balance).toBe(99999999999)
    expect(rMax.body.openingBalance).toBe(99999999999)
  })

  it('TEST-F03-04 rejects opening balance on Salary (INCOME) and duplicate on Bank', async () => {
    const cookie = await loginCookie('alice')

    // First set Bank opening balance
    const initRes = await request(app)
      .put(`/api/accounts/${aliceBankId}/opening-balance`)
      .set('Cookie', cookie)
      .send({ amount: 500000, date: '2026-11-01' })
    expect(initRes.status).toBe(200)

    // Opening balance on INCOME account -> 422 RULE_VIOLATION
    const incomeRes = await request(app)
      .put(`/api/accounts/${aliceSalaryId}/opening-balance`)
      .set('Cookie', cookie)
      .send({ amount: 100000, date: '2026-11-01' })
    expect(incomeRes.status).toBe(422)
    expect(incomeRes.body.error.code).toBe('RULE_VIOLATION')

    // Second opening balance on Bank -> 409 CONFLICT
    const dupRes = await request(app)
      .put(`/api/accounts/${aliceBankId}/opening-balance`)
      .set('Cookie', cookie)
      .send({ amount: 100, date: '2026-11-02' })
    expect(dupRes.status).toBe(409)
    expect(dupRes.body.error.code).toBe('CONFLICT')

    // Bank values unchanged
    const bankCheck = await prisma.account.findUniqueOrThrow({ where: { id: aliceBankId } })
    expect(Number(bankCheck.balance)).toBe(500000)
    expect(Number(bankCheck.openingBalance)).toBe(500000)
  })

  it('TEST-F03-05 cross-user isolation: alice cannot set opening balance or view bob accounts', async () => {
    const aliceCookie = await loginCookie('alice')

    // Alice setting opening balance on bob's Bank id -> 404 NOT_FOUND
    const crossRes = await request(app)
      .put(`/api/accounts/${bobBankId}/opening-balance`)
      .set('Cookie', aliceCookie)
      .send({ amount: 100000, date: '2026-11-01' })
    expect(crossRes.status).toBe(404)
    expect(crossRes.body.error.code).toBe('NOT_FOUND')

    // Bob's Bank remains unchanged
    const bobBank = await prisma.account.findUniqueOrThrow({ where: { id: bobBankId } })
    expect(bobBank.balance).toBe(0n)
    expect(bobBank.openingBalance).toBeNull()

    // Alice GET /api/accounts contains none of bob's accounts
    const listRes = await request(app).get('/api/accounts').set('Cookie', aliceCookie)
    expect(listRes.status).toBe(200)
    const ids = listRes.body.items.map((a: { id: number }) => a.id)
    expect(ids).not.toContain(bobBankId)
    for (const item of listRes.body.items) {
      const acc = await prisma.account.findUniqueOrThrow({ where: { id: item.id } })
      expect(acc.userId).toBe(aliceId)
    }
  })
})
