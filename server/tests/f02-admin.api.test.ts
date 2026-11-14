import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb, TEST_PASSWORD } from './helpers/db'

let adminId: number
let aliceId: number
let bobId: number

beforeEach(async () => {
  await resetDb()
  adminId = (await createUser('admin', { role: 'ADMIN' })).id
  aliceId = (await createUser('alice')).id
  bobId = (await createUser('bob')).id
})

afterAll(async () => {
  await prisma.$disconnect()
})

const login = (username: string) => request(app).post('/api/auth/login').send({ username, password: TEST_PASSWORD })

describe('F-02 Administrator user access', () => {
  it('TEST-F02-01 admin lists all users with exactly the six non-financial fields', async () => {
    const cookie = await loginCookie('admin')

    const res = await request(app).get('/api/admin/users').set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.total).toBe(3)
    expect(res.body.page).toBe(1)
    expect(res.body.pageSize).toBe(50)
    expect(res.body.items.map((u: { username: string }) => u.username)).toEqual(['admin', 'alice', 'bob'])
    for (const item of res.body.items) {
      expect(Object.keys(item).sort()).toEqual(['createdAt', 'displayName', 'id', 'role', 'status', 'username'])
    }
    expect(res.body.items[1]).toMatchObject({ id: aliceId, username: 'alice', role: 'USER', status: 'ACTIVE' })
  })

  it('TEST-F02-02 disabling a user rejects their existing session and login; re-enabling restores login', async () => {
    const adminCookie = await loginCookie('admin')
    const aliceCookie = await loginCookie('alice')

    const disable = await request(app).patch(`/api/admin/users/${aliceId}`).set('Cookie', adminCookie).send({ status: 'DISABLED' })
    expect(disable.status).toBe(200)
    expect(disable.body).toMatchObject({ id: aliceId, status: 'DISABLED' })

    expect((await request(app).get('/api/auth/me').set('Cookie', aliceCookie)).status).toBe(401)
    expect((await login('alice')).status).toBe(401)

    const enable = await request(app).patch(`/api/admin/users/${aliceId}`).set('Cookie', adminCookie).send({ status: 'ACTIVE' })
    expect(enable.status).toBe(200)
    expect(enable.body.status).toBe('ACTIVE')
    expect((await login('alice')).status).toBe(200)
    // The session from before the disable stays invalid.
    expect((await request(app).get('/api/auth/me').set('Cookie', aliceCookie)).status).toBe(401)
  })

  it('TEST-F02-03 admin cannot disable their own account', async () => {
    const cookie = await loginCookie('admin')

    const res = await request(app).patch(`/api/admin/users/${adminId}`).set('Cookie', cookie).send({ status: 'DISABLED' })

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(200)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: adminId } })).status).toBe('ACTIVE')
  })

  it('TEST-F02-03 (errors) unknown user id gives 404 and an invalid status gives 422', async () => {
    const cookie = await loginCookie('admin')

    const unknown = await request(app).patch('/api/admin/users/99999').set('Cookie', cookie).send({ status: 'DISABLED' })
    expect(unknown.status).toBe(404)
    expect(unknown.body.error.code).toBe('NOT_FOUND')

    const invalid = await request(app).patch(`/api/admin/users/${bobId}`).set('Cookie', cookie).send({ status: 'BANNED' })
    expect(invalid.status).toBe(422)
    expect(invalid.body.error.code).toBe('VALIDATION_FAILED')
    expect((await prisma.user.findUniqueOrThrow({ where: { id: bobId } })).status).toBe('ACTIVE')
  })

  it('TEST-F02-04 admin gets 403 with no data from every Sprint 1 financial endpoint', async () => {
    const cookie = await loginCookie('admin')
    const endpoints: [method: 'get' | 'post' | 'put', path: string][] = [
      ['get', '/api/accounts'],
      ['put', '/api/accounts/1/opening-balance'],
      ['post', '/api/transactions'],
      ['get', '/api/transactions'],
      ['get', '/api/transactions/1'],
      ['get', '/api/overview'],
      ['get', '/api/summary'],
    ]

    for (const [method, path] of endpoints) {
      const res = await request(app)[method](path).set('Cookie', cookie).send({ amount: 100, date: '2026-11-01' })
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(403)
      expect(Object.keys(res.body)).toEqual(['error'])
      expect(res.body.error.code).toBe('FORBIDDEN')
    }
  })

  it('TEST-F02-05 a USER gets 403 from admin endpoints and cannot change another user', async () => {
    const cookie = await loginCookie('alice')

    const list = await request(app).get('/api/admin/users').set('Cookie', cookie)
    const patch = await request(app).patch(`/api/admin/users/${bobId}`).set('Cookie', cookie).send({ status: 'DISABLED' })

    expect(list.status).toBe(403)
    expect(Object.keys(list.body)).toEqual(['error'])
    expect(patch.status).toBe(403)
    expect((await prisma.user.findUniqueOrThrow({ where: { id: bobId } })).status).toBe('ACTIVE')
  })

  it('TEST-F02-06 admin endpoints return 401 without a session', async () => {
    expect((await request(app).get('/api/admin/users')).status).toBe(401)
    expect((await request(app).patch(`/api/admin/users/${bobId}`).send({ status: 'DISABLED' })).status).toBe(401)
  })
})
