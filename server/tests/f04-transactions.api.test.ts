import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../src/app'
import { getTodayBangkok } from '../src/lib/ledger'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb } from './helpers/db'

let aliceId: number
let bobId: number
let aliceBankId: number
let aliceCreditId: number
let aliceSalaryId: number
let aliceDiningId: number
let bobBankId: number
let bobSalaryId: number

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
  aliceDiningId = aliceAccounts.find((a) => a.name === 'Dining')!.id

  const bobAccounts = await prisma.account.findMany({ where: { userId: bobId } })
  bobBankId = bobAccounts.find((a) => a.name === 'Bank')!.id
  bobSalaryId = bobAccounts.find((a) => a.name === 'Salary')!.id
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('F-04 Receive money', () => {
  it('TEST-F04-01 alice posts RECEIPT Bank <- Salary 3000000; Bank balance becomes 3500000 and status is POSTED', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    // Precondition: Bank has opening balance 500000
    await request(app)
      .put(`/api/accounts/${aliceBankId}/opening-balance`)
      .set('Cookie', cookie)
      .send({ amount: 500000, date: '2026-11-01' })

    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 3000000,
        note: 'November salary',
        lines: [{ accountId: aliceSalaryId, amount: 3000000 }],
      })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      form: 'RECEIPT',
      date: today,
      total: 3000000,
      note: 'November salary',
      status: 'POSTED',
      primaryAccount: { id: aliceBankId, name: 'Bank', type: 'CASH' },
      lines: [{ account: { id: aliceSalaryId, name: 'Salary', type: 'INCOME' }, amount: 3000000 }],
    })
    expect(res.body.id).toBeDefined()
    expect(res.body.createdAt).toBeDefined()

    // Verify DB
    const txnCount = await prisma.txn.count({ where: { userId: aliceId } })
    expect(txnCount).toBe(1)
    const lineCount = await prisma.txnLine.count()
    expect(lineCount).toBe(1)

    const updatedBank = await prisma.account.findUnique({ where: { id: aliceBankId } })
    expect(Number(updatedBank?.balance)).toBe(3500000)
  })

  it('TEST-F04-02 line sum mismatch or zero lines rejected with 422 RULE_VIOLATION (BR-01)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    // 1 satang short: lines 2000000 + 999999 = 2999999 vs total 3000000
    const mismatchRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 3000000,
        lines: [
          { accountId: aliceSalaryId, amount: 2000000 },
          { accountId: aliceDiningId, amount: 999999 },
        ],
      })

    expect(mismatchRes.status).toBe(422)
    expect(mismatchRes.body.error?.code).toBe('RULE_VIOLATION')
    expect(mismatchRes.body.error?.details?.lines).toBeDefined()

    // Zero lines
    const zeroLinesRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 3000000,
        lines: [],
      })

    expect(zeroLinesRes.status).toBe(422)
    expect(zeroLinesRes.body.error?.code).toBe('RULE_VIOLATION')

    // Verify DB has no transactions or lines, Bank balance unchanged
    expect(await prisma.txn.count()).toBe(0)
    expect(await prisma.txnLine.count()).toBe(0)
    const bank = await prisma.account.findUnique({ where: { id: aliceBankId } })
    expect(Number(bank?.balance)).toBe(0)
  })

  it('TEST-F04-03 rejected if primary is not CASH or lines are not INCOME (BR-03)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    // Primary account is Credit Card (LOAN_TAKEN)
    const badPrimaryRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceCreditId,
        date: today,
        total: 100000,
        lines: [{ accountId: aliceSalaryId, amount: 100000 }],
      })

    expect(badPrimaryRes.status).toBe(422)
    expect(badPrimaryRes.body.error?.code).toBe('RULE_VIOLATION')
    expect(badPrimaryRes.body.error?.details?.primaryAccountId).toBeDefined()

    // Line is Dining (EXPENSE)
    const badLineRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 100000,
        lines: [{ accountId: aliceDiningId, amount: 100000 }],
      })

    expect(badLineRes.status).toBe(422)
    expect(badLineRes.body.error?.code).toBe('RULE_VIOLATION')
    expect(badLineRes.body.error?.details?.lines).toBeDefined()

    expect(await prisma.txn.count()).toBe(0)
  })

  it('TEST-F04-04 rejects invalid satang amounts, future date, ancient date; accepts today (BR-02, BR-09)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    // Line amount 0
    const zeroLine = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 0,
        lines: [{ accountId: aliceSalaryId, amount: 0 }],
      })
    expect(zeroLine.status).toBe(422)
    expect(zeroLine.body.error?.code).toBe('VALIDATION_FAILED')

    // Line amount negative
    const negLine = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: today,
        total: -100,
        lines: [{ accountId: aliceSalaryId, amount: -100 }],
      })
    expect(negLine.status).toBe(422)
    expect(negLine.body.error?.code).toBe('VALIDATION_FAILED')

    // Total non-integer satang (100.5)
    const nonInt = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 100.5,
        lines: [{ accountId: aliceSalaryId, amount: 100.5 }],
      })
    expect(nonInt.status).toBe(422)
    expect(nonInt.body.error?.code).toBe('VALIDATION_FAILED')

    // Total > 99,999,999,999 satang
    const hugeTotal = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 100000000000,
        lines: [{ accountId: aliceSalaryId, amount: 100000000000 }],
      })
    expect(hugeTotal.status).toBe(422)
    expect(hugeTotal.body.error?.code).toBe('VALIDATION_FAILED')

    // Future date: 2099-01-01
    const futureDate = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: '2099-01-01',
        total: 100000,
        lines: [{ accountId: aliceSalaryId, amount: 100000 }],
      })
    expect(futureDate.status).toBe(422)
    expect(futureDate.body.error?.code).toBe('VALIDATION_FAILED')
    expect(futureDate.body.error?.details?.date).toBe('Date cannot be in the future')

    // Ancient date: 1999-12-31
    const ancientDate = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: '1999-12-31',
        total: 100000,
        lines: [{ accountId: aliceSalaryId, amount: 100000 }],
      })
    expect(ancientDate.status).toBe(422)
    expect(ancientDate.body.error?.code).toBe('VALIDATION_FAILED')
    expect(ancientDate.body.error?.details?.date).toBe('Date cannot be earlier than 2000-01-01')

    // Date today -> 201
    const validToday = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 100000,
        lines: [{ accountId: aliceSalaryId, amount: 100000 }],
      })
    expect(validToday.status).toBe(201)
  })

  it('TEST-F04-05 cross-user isolation: alice using bob account gets 404 and bob accounts unchanged (BR-11)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    // Alice using bob's Bank as primary
    const bobPrimaryRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: bobBankId,
        date: today,
        total: 100000,
        lines: [{ accountId: aliceSalaryId, amount: 100000 }],
      })
    expect(bobPrimaryRes.status).toBe(404)
    expect(bobPrimaryRes.body.error?.code).toBe('NOT_FOUND')

    // Alice using bob's Salary as line
    const bobLineRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 100000,
        lines: [{ accountId: bobSalaryId, amount: 100000 }],
      })
    expect(bobLineRes.status).toBe(404)
    expect(bobLineRes.body.error?.code).toBe('NOT_FOUND')

    // Verify bob's Bank balance unchanged
    const bobBank = await prisma.account.findUnique({ where: { id: bobBankId } })
    expect(Number(bobBank?.balance)).toBe(0)
    expect(await prisma.txn.count()).toBe(0)
  })

  it('TEST-F04-06 atomicity: failure during posting rolls back transaction and line inserts (NFR-06)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    // Spy on prisma.account.update to throw an error simulating failure after transaction insert
    const updateSpy = vi.spyOn(prisma.account, 'update').mockImplementationOnce((async () => {
      throw new Error('Simulated balance update failure')
    }) as any)

    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'RECEIPT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 100000,
        lines: [{ accountId: aliceSalaryId, amount: 100000 }],
      })

    updateSpy.mockRestore()

    expect(res.status).toBe(500)
    expect(res.body.error?.code).toBe('INTERNAL')

    // Verify complete rollback: 0 transactions, 0 lines, Bank balance 0
    expect(await prisma.txn.count()).toBe(0)
    expect(await prisma.txnLine.count()).toBe(0)
    const bank = await prisma.account.findUnique({ where: { id: aliceBankId } })
    expect(Number(bank?.balance)).toBe(0)
  })
})
