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

async function byName(userId: number) {
  const rows = await prisma.account.findMany({ where: { userId } })
  return Object.fromEntries(rows.map((a) => [a.name, a.id]))
}

// Test data is inserted directly: balances do not matter for search, and dates may be after "today".
async function mk(
  userId: number,
  t: { date: string; form?: 'PAYMENT' | 'RECEIPT'; primary: number; total: number; lines: [number, number][]; note?: string; status?: 'POSTED' | 'VOID' },
) {
  const row = await prisma.txn.create({
    data: {
      userId,
      form: t.form ?? 'PAYMENT',
      primaryAccountId: t.primary,
      txnDate: new Date(`${t.date}T00:00:00Z`),
      total: BigInt(t.total),
      note: t.note ?? null,
      status: t.status ?? 'POSTED',
      lines: { create: t.lines.map(([accountId, amount]) => ({ accountId, amount: BigInt(amount) })) },
    },
  })
  return row.id
}

const search = (qs: string, cookie = alice) => request(app).get(`/api/transactions?${qs}`).set('Cookie', cookie)
const ids = (res: { body: { items: { id: number }[] } }) => res.body.items.map((t) => t.id).sort((a, b) => a - b)

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

describe('F-12 Search and filter history', () => {
  it('TEST-F12-01 date range is inclusive on both bounds', async () => {
    const pay = (date: string) => mk(aliceId, { date, primary: acc.Bank, total: 1000, lines: [[acc.Dining, 1000]] })
    await pay('2026-10-31')
    const nov1 = await pay('2026-11-01')
    const nov15 = await pay('2026-11-15')
    const nov30 = await pay('2026-11-30')

    const res = await search('from=2026-11-01&to=2026-11-30')
    expect(res.status).toBe(200)
    expect(ids(res)).toEqual([nov1, nov15, nov30])
    expect(res.body.total).toBe(3)
    expect(ids(await search('from=2026-11-15'))).toEqual([nov15, nov30])
  })

  it('TEST-F12-02 account filter matches the primary account or any line (D-13)', async () => {
    const card = await mk(aliceId, { date: '2026-11-10', primary: acc['Credit Card'], total: 3000, lines: [[acc.Dining, 2000], [acc.Groceries, 1000]] })
    const groceriesOnly = await mk(aliceId, { date: '2026-11-11', primary: acc['Credit Card'], total: 500, lines: [[acc.Groceries, 500]] })
    const bankPay = await mk(aliceId, { date: '2026-11-12', primary: acc.Bank, total: 700, lines: [[acc.Dining, 700]] })
    const repay = await mk(aliceId, { date: '2026-11-13', primary: acc.Bank, total: 3500, lines: [[acc['Credit Card'], 3500]] })

    expect(ids(await search(`accountId=${acc.Dining}`))).toEqual([card, bankPay])
    expect(ids(await search(`accountId=${acc.Bank}`))).toEqual([bankPay, repay])
    expect(ids(await search(`accountId=${acc['Credit Card']}`))).toEqual([card, groceriesOnly, repay])

    const foreign = await search(`accountId=${bobAcc.Dining}`)
    expect(foreign.status).toBe(200)
    expect(foreign.body).toMatchObject({ items: [], total: 0 })
  })

  it('TEST-F12-03 form, status and inclusive amount range', async () => {
    const receipt = await mk(aliceId, { date: '2026-11-01', form: 'RECEIPT', primary: acc.Bank, total: 120000, lines: [[acc.Salary, 120000]] })
    const low = await mk(aliceId, { date: '2026-11-02', primary: acc.Bank, total: 49999, lines: [[acc.Dining, 49999]] })
    const atMin = await mk(aliceId, { date: '2026-11-03', primary: acc.Bank, total: 50000, lines: [[acc.Dining, 50000]] })
    const high = await mk(aliceId, { date: '2026-11-04', primary: acc.Bank, total: 120001, lines: [[acc.Dining, 120001]] })
    const voided = await mk(aliceId, { date: '2026-11-05', primary: acc.Bank, total: 800, lines: [[acc.Dining, 800]], status: 'VOID' })

    expect(ids(await search('form=RECEIPT'))).toEqual([receipt])
    expect(ids(await search('status=VOID'))).toEqual([voided])
    expect(ids(await search('status=POSTED'))).toEqual([receipt, low, atMin, high])
    expect(ids(await search('minAmount=50000&maxAmount=120000'))).toEqual([receipt, atMin])
  })

  it('TEST-F12-04 note text is case-insensitive and literal; filters combine with AND; total counts the filtered set', async () => {
    const team = await mk(aliceId, { date: '2026-11-05', primary: acc.Bank, total: 100, lines: [[acc.Dining, 100]], note: 'Team lunch' })
    const ken = await mk(aliceId, { date: '2026-11-06', primary: acc.Bank, total: 100, lines: [[acc.Dining, 100]], note: 'lunch with Ken' })
    await mk(aliceId, { date: '2026-11-07', primary: acc.Bank, total: 100, lines: [[acc.Dining, 100]], note: 'Launch party' })
    const percent = await mk(aliceId, { date: '2026-11-08', primary: acc.Bank, total: 100, lines: [[acc.Groceries, 100]], note: '10% off' })
    await mk(aliceId, { date: '2026-11-09', primary: acc.Bank, total: 100, lines: [[acc.Groceries, 100]], note: 'lunchXbox' }) // matches q=h_b only if _ were a wildcard
    await mk(aliceId, { date: '2026-10-20', primary: acc.Bank, total: 100, lines: [[acc.Dining, 100]], note: 'old lunch' })

    expect(ids(await search('q=LUNCH&from=2026-11-01'))).toEqual(expect.arrayContaining([team, ken]))
    expect((await search('q=LUNCH&from=2026-11-01')).body.items.map((t: { note: string }) => t.note)).not.toContain('Launch party')
    expect(ids(await search('q=%25'))).toEqual([percent])
    expect(ids(await search('q=h_b'))).toEqual([])

    const combined = await search(`accountId=${acc.Dining}&q=lunch&from=2026-11-01&to=2026-11-30&pageSize=1`)
    expect(combined.body.total).toBe(2)
    expect(combined.body.items).toHaveLength(1)
    expect(combined.body.items[0].id).toBe(ken) // newest first
  })

  it('TEST-F12-05 invalid parameters → 422 naming the parameter', async () => {
    const cases: [string, string][] = [
      ['from=2026-11-30&to=2026-11-01', 'from'],
      ['from=2026-13-01', 'from'],
      ['minAmount=-1', 'minAmount'],
      ['minAmount=10&maxAmount=5', 'minAmount'],
      ['maxAmount=1.5', 'maxAmount'],
      ['accountId=abc', 'accountId'],
      ['form=TRANSFER', 'form'],
      ['status=DELETED', 'status'],
      [`q=${'x'.repeat(101)}`, 'q'],
    ]
    for (const [qs, key] of cases) {
      const res = await search(qs)
      expect(res.status, qs).toBe(422)
      expect(res.body.error.code).toBe('VALIDATION_FAILED')
      expect(Object.keys(res.body.error.details), qs).toContain(key)
    }
  })

  it('TEST-F12-06 401 / 403 / other users are never matched', async () => {
    await mk(bobId, { date: '2026-11-05', primary: bobAcc.Bank, total: 100, lines: [[bobAcc.Dining, 100]], note: 'secret lunch' })
    expect((await request(app).get('/api/transactions?q=secret')).status).toBe(401)
    expect((await search('q=secret', await loginCookie('admin'))).status).toBe(403)
    const res = await search('q=secret')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ items: [], total: 0 })
  })
})
