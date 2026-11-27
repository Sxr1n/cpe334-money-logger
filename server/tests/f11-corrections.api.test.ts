import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../src/app'
import { getTodayBangkok } from '../src/lib/ledger'
import { prisma } from '../src/prisma'
import { postingSteps } from '../src/routes/transactions'
import { createUser, loginCookie, resetDb } from './helpers/db'

let aliceId: number
let bobId: number
let acc: Record<string, number>
let bobAcc: Record<string, number>
let alice: string
let bob: string
let walletId: number

const DATE = '2026-11-20'

async function byName(userId: number) {
  const rows = await prisma.account.findMany({ where: { userId } })
  return Object.fromEntries(rows.map((a) => [a.name, a.id]))
}

const setOpening = (id: number, amount: number) =>
  request(app).put(`/api/accounts/${id}/opening-balance`).set('Cookie', alice).send({ amount, date: '2026-11-01' })

const postTxn = (body: object, cookie = alice) =>
  request(app).post('/api/transactions').set('Cookie', cookie).send({ date: DATE, ...body })

const putTxn = (id: number, body: object, cookie = alice) =>
  request(app).put(`/api/transactions/${id}`).set('Cookie', cookie).send({ date: DATE, ...body })

const voidTxn = (id: number, cookie = alice) =>
  request(app).post(`/api/transactions/${id}/void`).set('Cookie', cookie)

const account = (id: number) => prisma.account.findUniqueOrThrow({ where: { id } })

beforeEach(async () => {
  await resetDb()
  aliceId = (await createUser('alice', { seedAccounts: true })).id
  bobId = (await createUser('bob', { seedAccounts: true })).id
  await createUser('admin', { role: 'ADMIN' })
  acc = await byName(aliceId)
  bobAcc = await byName(bobId)
  alice = await loginCookie('alice')
  bob = await loginCookie('bob')

  walletId = (await request(app).post('/api/accounts').set('Cookie', alice).send({ name: 'Wallet', type: 'CASH' })).body.id
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('F-11 Transaction corrections (API-DB)', () => {
  it('TEST-F11-01 editing card payment replaces lines, adjusts debt by net delta, and updates category totals', async () => {
    const created = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc['Credit Card'],
      total: 120000,
      lines: [
        { accountId: acc.Dining, amount: 70000 },
        { accountId: acc.Groceries, amount: 50000 },
      ],
      note: 'Dinner & groceries',
    })
    expect(created.status).toBe(201)
    expect((await account(acc['Credit Card'])).balance).toBe(120000n)

    const edited = await putTxn(created.body.id, {
      form: 'PAYMENT',
      primaryAccountId: acc['Credit Card'],
      total: 100000,
      lines: [{ accountId: acc.Dining, amount: 100000 }],
      note: 'Dinner only',
    })
    expect(edited.status).toBe(200)
    expect(edited.body.total).toBe(100000)
    expect(edited.body.note).toBe('Dinner only')
    expect(edited.body.lines).toHaveLength(1)
    expect((await account(acc['Credit Card'])).balance).toBe(100000n)

    const cats = await request(app).get('/api/reports/categories?from=2026-11-01&to=2026-11-30').set('Cookie', alice)
    expect(cats.status).toBe(200)
    expect(cats.body.items).toEqual([
      expect.objectContaining({ accountId: acc.Dining, total: 100000 }),
    ])
  })

  it('TEST-F11-02 editing receipt primary from Bank to Wallet moves balances and updates date/note', async () => {
    const created = await postTxn({
      form: 'RECEIPT',
      primaryAccountId: acc.Bank,
      total: 500000,
      lines: [{ accountId: acc.Salary, amount: 500000 }],
      note: 'Original',
    })
    expect(created.status).toBe(201)

    const edited = await putTxn(created.body.id, {
      form: 'RECEIPT',
      primaryAccountId: walletId,
      date: '2026-11-21',
      total: 500000,
      lines: [{ accountId: acc.Salary, amount: 500000 }],
      note: 'Moved to wallet',
    })
    expect(edited.status).toBe(200)
    expect(edited.body).toMatchObject({ date: '2026-11-21', note: 'Moved to wallet' })
    expect((await account(acc.Bank)).balance).toBe(0n)
    expect((await account(walletId)).balance).toBe(500000n)
  })

  it('TEST-F11-03 invalid edits (lines mismatch, future date, changed form, same primary/line) return 422 leaving DB unchanged', async () => {
    await setOpening(acc.Bank, 500000)
    const created = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 100000,
      lines: [{ accountId: acc.Dining, amount: 100000 }],
      note: 'Keep me',
    })
    const id = created.body.id
    const beforeTxn = await prisma.txn.findUniqueOrThrow({ where: { id }, include: { lines: true } })
    const beforeBank = (await account(acc.Bank)).balance

    const todayParts = getTodayBangkok().split('-').map(Number)
    const tomorrow = new Date(Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2] + 1)).toISOString().slice(0, 10)

    const invalidBodies = [
      { form: 'PAYMENT', primaryAccountId: acc.Bank, total: 100000, lines: [{ accountId: acc.Dining, amount: 90000 }] },
      { form: 'PAYMENT', primaryAccountId: acc.Bank, date: tomorrow, total: 100000, lines: [{ accountId: acc.Dining, amount: 100000 }] },
      { form: 'RECEIPT', primaryAccountId: acc.Bank, total: 100000, lines: [{ accountId: acc.Salary, amount: 100000 }] },
      { form: 'PAYMENT', primaryAccountId: acc.Bank, total: 100000, lines: [{ accountId: acc.Bank, amount: 100000 }] },
    ]
    for (const b of invalidBodies) {
      const res = await putTxn(id, b)
      expect(res.status).toBe(422)
    }

    const afterTxn = await prisma.txn.findUniqueOrThrow({ where: { id }, include: { lines: true } })
    expect(afterTxn.total).toBe(beforeTxn.total)
    expect(afterTxn.note).toBe(beforeTxn.note)
    expect(afterTxn.lines).toHaveLength(1)
    expect((await account(acc.Bank)).balance).toBe(beforeBank)
  })

  it('TEST-F11-04 D-12 rejects edit that leaves Bank negative (399999 -> 422), accepts exact 400000 (Bank = 0)', async () => {
    const rec = await postTxn({
      form: 'RECEIPT',
      primaryAccountId: acc.Bank,
      total: 500000,
      lines: [{ accountId: acc.Salary, amount: 500000 }],
    })
    await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 400000,
      lines: [{ accountId: acc.Dining, amount: 400000 }],
    })
    expect((await account(acc.Bank)).balance).toBe(100000n)

    const low = await putTxn(rec.body.id, {
      form: 'RECEIPT',
      primaryAccountId: acc.Bank,
      total: 399999,
      lines: [{ accountId: acc.Salary, amount: 399999 }],
    })
    expect(low.status).toBe(422)
    expect(low.body.error.code).toBe('RULE_VIOLATION')
    expect((await account(acc.Bank)).balance).toBe(100000n)

    const exact = await putTxn(rec.body.id, {
      form: 'RECEIPT',
      primaryAccountId: acc.Bank,
      total: 400000,
      lines: [{ accountId: acc.Salary, amount: 400000 }],
    })
    expect(exact.status).toBe(200)
    expect((await account(acc.Bank)).balance).toBe(0n)
  })

  it('TEST-F11-05 voiding a PAYMENT restores Bank balance, removes expense, and keeps transaction in history/detail as VOID', async () => {
    await setOpening(acc.Bank, 200000)
    const created = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 120000,
      lines: [{ accountId: acc.Dining, amount: 120000 }],
    })
    expect((await account(acc.Bank)).balance).toBe(80000n)

    const v = await voidTxn(created.body.id)
    expect(v.status).toBe(200)
    expect(v.body.status).toBe('VOID')
    expect((await account(acc.Bank)).balance).toBe(200000n)

    const sum = await request(app).get('/api/summary?from=2026-11-01&to=2026-11-30').set('Cookie', alice)
    expect(sum.body.expense).toBe(0)

    const hist = await request(app).get('/api/transactions').set('Cookie', alice)
    expect(hist.body.items[0]).toMatchObject({ id: created.body.id, status: 'VOID' })

    const det = await request(app).get(`/api/transactions/${created.body.id}`).set('Cookie', alice)
    expect(det.body.status).toBe('VOID')
  })

  it('TEST-F11-06 voiding receipt whose cash was spent returns 422 naming Bank; voiding or editing VOID returns 422', async () => {
    const rec = await postTxn({
      form: 'RECEIPT',
      primaryAccountId: acc.Bank,
      total: 1000000,
      lines: [{ accountId: acc.Salary, amount: 1000000 }],
    })
    const pay = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 800000,
      lines: [{ accountId: acc.Dining, amount: 800000 }],
    })

    const vRec = await voidTxn(rec.body.id)
    expect(vRec.status).toBe(422)
    expect(vRec.body.error.details.total).toContain('Bank')
    expect((await account(acc.Bank)).balance).toBe(200000n)

    expect((await voidTxn(pay.body.id)).status).toBe(200)
    expect((await voidTxn(pay.body.id)).status).toBe(422)
    expect(
      (
        await putTxn(pay.body.id, {
          form: 'PAYMENT',
          primaryAccountId: acc.Bank,
          total: 800000,
          lines: [{ accountId: acc.Dining, amount: 800000 }],
        })
      ).status,
    ).toBe(422)
  })

  it('TEST-F11-07 voiding a payment on an archived Wallet returns 422 Unarchive Wallet first', async () => {
    await setOpening(walletId, 50000)
    const pay = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: walletId,
      total: 50000,
      lines: [{ accountId: acc.Dining, amount: 50000 }],
    })
    expect((await account(walletId)).balance).toBe(0n)
    expect((await request(app).patch(`/api/accounts/${walletId}`).set('Cookie', alice).send({ archived: true })).status).toBe(200)

    const v = await voidTxn(pay.body.id)
    expect(v.status).toBe(422)
    expect(v.body.error.message).toBe('Unarchive Wallet first')
    expect((await account(walletId)).balance).toBe(0n)
  })

  it('TEST-F11-08 401 / 403 / cross-user 404 on PUT and void', async () => {
    await setOpening(acc.Bank, 500000)
    const alicePay = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 10000,
      lines: [{ accountId: acc.Dining, amount: 10000 }],
    })
    const bobRec = await postTxn(
      {
        form: 'RECEIPT',
        primaryAccountId: bobAcc.Bank,
        total: 20000,
        lines: [{ accountId: bobAcc.Salary, amount: 20000 }],
      },
      bob,
    )

    const body = { form: 'PAYMENT', primaryAccountId: acc.Bank, date: DATE, total: 10000, lines: [{ accountId: acc.Dining, amount: 10000 }] }
    expect((await request(app).put(`/api/transactions/${alicePay.body.id}`).send(body)).status).toBe(401)
    expect((await request(app).post(`/api/transactions/${alicePay.body.id}/void`)).status).toBe(401)

    const admin = await loginCookie('admin')
    expect((await putTxn(alicePay.body.id, body, admin)).status).toBe(403)
    expect((await voidTxn(alicePay.body.id, admin)).status).toBe(403)

    expect((await putTxn(bobRec.body.id, { form: 'RECEIPT', primaryAccountId: bobAcc.Bank, total: 10000, lines: [{ accountId: bobAcc.Salary, amount: 10000 }] })).status).toBe(404)
    expect((await voidTxn(bobRec.body.id)).status).toBe(404)
    expect((await account(bobAcc.Bank)).balance).toBe(20000n)

    expect((await putTxn(alicePay.body.id, { form: 'PAYMENT', primaryAccountId: bobAcc.Bank, total: 10000, lines: [{ accountId: acc.Dining, amount: 10000 }] })).status).toBe(404)
  })

  it('TEST-F11-09 (NFR-06) failure on 2nd balance update rolls back edit atomically', async () => {
    await setOpening(acc.Bank, 500000)
    const created = await postTxn({
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 100000,
      lines: [{ accountId: acc.Dining, amount: 100000 }],
      note: 'Before fail',
    })
    const id = created.body.id
    const beforeBank = (await account(acc.Bank)).balance
    const beforeWallet = (await account(walletId)).balance

    const spy = vi.spyOn(postingSteps, 'updateAccountBalance')
    spy.mockResolvedValueOnce(undefined as never).mockRejectedValueOnce(new Error('Simulated 2nd balance update failure'))

    const res = await putTxn(id, {
      form: 'PAYMENT',
      primaryAccountId: acc.Bank,
      total: 150000,
      lines: [{ accountId: walletId, amount: 150000 }],
      note: 'Should rollback',
    })
    spy.mockRestore()

    expect(res.status).toBe(500)
    const txnAfter = await prisma.txn.findUniqueOrThrow({ where: { id }, include: { lines: true } })
    expect(txnAfter.total).toBe(100000n)
    expect(txnAfter.note).toBe('Before fail')
    expect(txnAfter.lines[0].accountId).toBe(acc.Dining)
    expect((await account(acc.Bank)).balance).toBe(beforeBank)
    expect((await account(walletId)).balance).toBe(beforeWallet)
  })
})
