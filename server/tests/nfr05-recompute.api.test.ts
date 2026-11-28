import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb } from './helpers/db'

// NFR-05 / AC-F08-07 (TEST-NFR05-01): 1,000 seeded random operations through the HTTP API, then every stored
// balance must equal an independent SQL recomputation from opening balances and POSTED lines (SRS §4.3).

const OPS = 1000
const SEED = 334_2026

// mulberry32: small deterministic PRNG so a failure can be replayed with the same seed.
function prng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Acc = { id: number; type: string }
let userId: number
let cookie: string
let accounts: Acc[]

beforeAll(async () => {
  await resetDb()
  userId = (await createUser('alice', { seedAccounts: true })).id
  cookie = await loginCookie('alice')
  const extra: [string, string][] = [
    ['Wallet', 'CASH'], ['Savings', 'CASH'], ['Loan from Mom', 'LOAN_TAKEN'], ['Loan to Ken', 'LOAN_GIVEN'], ['Loan to Ann', 'LOAN_GIVEN'],
  ]
  for (const [name, type] of extra) {
    expect((await request(app).post('/api/accounts').set('Cookie', cookie).send({ name, type })).status).toBe(201)
  }
  accounts = (await prisma.account.findMany({ where: { userId }, orderBy: { id: 'asc' } })).map((a) => ({ id: a.id, type: a.type }))
  for (const a of accounts.filter((x) => x.type !== 'INCOME' && x.type !== 'EXPENSE')) {
    const res = await request(app).put(`/api/accounts/${a.id}/opening-balance`).set('Cookie', cookie).send({ amount: 500000, date: '2026-10-01' })
    expect(res.status).toBe(200)
  }
  // One card with a credit limit so BR-18 rejections are part of the run (CHG-01).
  const card = accounts.find((a) => a.type === 'LOAN_TAKEN')!
  expect((await request(app).patch(`/api/accounts/${card.id}`).set('Cookie', cookie).send({ creditLimit: 3000000 })).status).toBe(200)
})

afterAll(async () => {
  await prisma.$disconnect()
})

async function recomputeDifferences() {
  return prisma.$queryRaw<{ id: number; type: string; stored: bigint; recomputed: bigint }[]>`
    SELECT a.id, a.type::text AS type, a.balance AS stored,
      (COALESCE(a.opening_balance, 0)
      + COALESCE((SELECT SUM(CASE
            WHEN t.form = 'PAYMENT' AND a.type = 'CASH' THEN -t.total
            WHEN t.form = 'PAYMENT' AND a.type = 'LOAN_TAKEN' THEN t.total
            WHEN t.form = 'RECEIPT' AND a.type = 'CASH' THEN t.total
            ELSE 0 END)
          FROM transactions t WHERE t.primary_account_id = a.id AND t.status = 'POSTED'), 0)
      + COALESCE((SELECT SUM(CASE
            WHEN t.form = 'PAYMENT' AND a.type = 'LOAN_TAKEN' THEN -l.amount
            WHEN t.form = 'PAYMENT' THEN l.amount
            WHEN a.type = 'LOAN_TAKEN' THEN l.amount
            ELSE -l.amount END)
          FROM transaction_lines l JOIN transactions t ON t.id = l.txn_id
          WHERE l.account_id = a.id AND t.status = 'POSTED'), 0))::bigint AS recomputed
    FROM accounts a
    WHERE a.user_id = ${userId} AND a.type IN ('CASH', 'LOAN_TAKEN', 'LOAN_GIVEN')
    ORDER BY a.id`
}

describe('NFR-05 balance recomputation (API-DB, property)', () => {
  it(`TEST-NFR05-01 after ${OPS} seeded random operations every stored balance equals the recomputation (0 satang)`, async () => {
    const rand = prng(SEED)
    const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)]
    const amount = () => 1 + Math.floor(rand() * 200000)
    const date = () => `2026-10-${String(2 + Math.floor(rand() * 27)).padStart(2, '0')}`
    const ofType = (...types: string[]) => accounts.filter((a) => types.includes(a.type))
    const posted: { id: number; form: 'PAYMENT' | 'RECEIPT' }[] = []
    const count = { posted: 0, edited: 0, voided: 0, openingEdits: 0, rejected: 0 }
    const unexpected: string[] = []

    // SRS §4.2 allowed lines: RECEIPT into CASH ← anything but EXPENSE; PAYMENT from CASH/LOAN_TAKEN → anything but INCOME.
    const randomTxn = (form: 'PAYMENT' | 'RECEIPT') => {
      const primary = form === 'RECEIPT' ? pick(ofType('CASH')) : pick(ofType('CASH', 'LOAN_TAKEN'))
      const lineTypes = form === 'RECEIPT' ? ['INCOME', 'LOAN_GIVEN', 'LOAN_TAKEN', 'CASH'] : ['EXPENSE', 'LOAN_TAKEN', 'LOAN_GIVEN', 'CASH']
      const pool = ofType(...lineTypes).filter((a) => a.id !== primary.id)
      const lines: { accountId: number; amount: number }[] = []
      for (let n = 1 + Math.floor(rand() * 3); lines.length < n; ) {
        const acc = pick(pool)
        if (!lines.some((l) => l.accountId === acc.id)) lines.push({ accountId: acc.id, amount: amount() })
      }
      return { form, primaryAccountId: primary.id, date: date(), total: lines.reduce((s, l) => s + l.amount, 0), lines }
    }

    for (let i = 0; i < OPS; i++) {
      const r = rand()
      let res: request.Response
      let kind: keyof typeof count
      if (r < 0.6 || posted.length === 0) {
        const body = randomTxn(rand() < 0.5 ? 'PAYMENT' : 'RECEIPT')
        res = await request(app).post('/api/transactions').set('Cookie', cookie).send(body)
        kind = 'posted'
        if (res.status === 201) posted.push({ id: res.body.id, form: body.form })
      } else if (r < 0.75) {
        const t = pick(posted)
        res = await request(app).put(`/api/transactions/${t.id}`).set('Cookie', cookie).send(randomTxn(t.form))
        kind = 'edited'
      } else if (r < 0.85) {
        const t = posted.splice(Math.floor(rand() * posted.length), 1)[0]
        res = await request(app).post(`/api/transactions/${t.id}/void`).set('Cookie', cookie)
        kind = 'voided'
        if (res.status !== 200) posted.push(t)
      } else {
        const a = pick(ofType('CASH', 'LOAN_TAKEN', 'LOAN_GIVEN'))
        res = await request(app).patch(`/api/accounts/${a.id}/opening-balance`).set('Cookie', cookie).send({ amount: Math.floor(rand() * 1000000), date: '2026-10-01' })
        kind = 'openingEdits'
      }
      if (res.status === 200 || res.status === 201) count[kind]++
      else if (res.status === 422) count.rejected++ // a business-rule rejection (BR-07, BR-08, BR-18, D-10, D-12) is a valid outcome
      else unexpected.push(`op ${i} ${kind}: ${res.status} ${JSON.stringify(res.body)}`)
    }

    const rows = await recomputeDifferences()
    console.log(`TEST-NFR05-01 seed ${SEED}: ${JSON.stringify(count)}; ${rows.length} balance accounts checked`)
    expect(unexpected).toEqual([])
    expect(count.posted + count.edited + count.voided + count.openingEdits + count.rejected).toBe(OPS)
    for (const k of ['posted', 'edited', 'voided', 'openingEdits', 'rejected'] as const) expect(count[k], k).toBeGreaterThan(0)
    for (const row of rows) expect(row.stored - row.recomputed, `account ${row.id} (${row.type})`).toBe(0n)
  }, 600_000)
})
