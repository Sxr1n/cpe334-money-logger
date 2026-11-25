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

// Inserted directly: only the flag and status matter here.
async function mk(userId: number, primary: number, line: number, status: 'POSTED' | 'VOID' = 'POSTED') {
  const t = await prisma.txn.create({
    data: {
      userId,
      form: 'PAYMENT',
      primaryAccountId: primary,
      txnDate: new Date('2026-11-20T00:00:00Z'),
      total: 1000n,
      status,
      lines: { create: [{ accountId: line, amount: 1000n }] },
    },
  })
  return t.id
}

const fav = (id: number, body: unknown, cookie = alice) =>
  request(app).put(`/api/transactions/${id}/favorite`).set('Cookie', cookie).send(body as object)
const favList = (cookie = alice) => request(app).get('/api/transactions?favorite=true').set('Cookie', cookie)
const flag = async (id: number) => (await prisma.txn.findUniqueOrThrow({ where: { id } })).isFavorite

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

describe('F-13 Favourite transactions', () => {
  it('TEST-F13-01 mark, list, mark again, unmark', async () => {
    const id = await mk(aliceId, acc['Credit Card'], acc.Dining)
    await mk(aliceId, acc['Credit Card'], acc.Groceries)

    const on = await fav(id, { favorite: true })
    expect(on.status).toBe(200)
    expect(on.body).toMatchObject({ id, isFavorite: true })
    expect((await favList()).body.items.map((t: { id: number }) => t.id)).toEqual([id])

    expect((await fav(id, { favorite: true })).status).toBe(200)
    expect((await favList()).body.total).toBe(1)

    const off = await fav(id, { favorite: false })
    expect(off.status).toBe(200)
    expect(off.body.isFavorite).toBe(false)
    expect((await favList()).body).toMatchObject({ items: [], total: 0 })
  })

  it('TEST-F13-02 VOID cannot be marked; a voided favourite leaves the list; unmarking VOID is allowed (D-15)', async () => {
    const voided = await mk(aliceId, acc.Bank, acc.Dining, 'VOID')
    const res = await fav(voided, { favorite: true })
    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('RULE_VIOLATION')
    expect(await flag(voided)).toBe(false)

    const later = await mk(aliceId, acc.Bank, acc.Dining)
    expect((await fav(later, { favorite: true })).status).toBe(200)
    await prisma.txn.update({ where: { id: later }, data: { status: 'VOID' } })
    expect((await favList()).body.items).toEqual([])
    expect((await fav(later, { favorite: false })).status).toBe(200)
    expect(await flag(later)).toBe(false)
  })

  it('TEST-F13-03 invalid favorite parameter / body', async () => {
    const id = await mk(aliceId, acc.Bank, acc.Dining)
    const q = await request(app).get('/api/transactions?favorite=yes').set('Cookie', alice)
    expect(q.status).toBe(422)
    expect(Object.keys(q.body.error.details)).toContain('favorite')
    expect((await fav(id, { favorite: 'true' })).status).toBe(400)
    expect((await fav(id, {})).status).toBe(400)
  })

  it('TEST-F13-04 401 / 403 / cross-user 404; lists are separate', async () => {
    const mine = await mk(aliceId, acc.Bank, acc.Dining)
    const bobs = await mk(bobId, bobAcc.Bank, bobAcc.Dining)
    await prisma.txn.update({ where: { id: bobs }, data: { isFavorite: true } })

    expect((await request(app).put(`/api/transactions/${mine}/favorite`).send({ favorite: true })).status).toBe(401)
    expect((await fav(mine, { favorite: true }, await loginCookie('admin'))).status).toBe(403)
    expect((await fav(bobs, { favorite: false })).status).toBe(404)
    expect(await flag(bobs)).toBe(true)
    expect((await favList()).body.items).toEqual([])
  })
})
