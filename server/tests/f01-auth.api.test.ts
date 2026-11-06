import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb, TEST_PASSWORD } from './helpers/db'

beforeEach(async () => {
  await resetDb()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('F-01 Authentication and session', () => {
  it('TEST-F01-01 valid login sets an httpOnly session cookie and /me returns the same identity', async () => {
    const alice = await createUser('alice')

    const res = await request(app).post('/api/auth/login').send({ username: 'alice', password: TEST_PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: alice.id, username: 'alice', displayName: 'Alice Example', role: 'USER' })
    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('ml_session='))
    expect(cookie).toBeDefined()
    expect(cookie).toMatch(/HttpOnly/i)

    const me = await request(app).get('/api/auth/me').set('Cookie', cookie!.split(';')[0])
    expect(me.status).toBe(200)
    expect(me.body).toEqual(res.body)
  })

  it('TEST-F01-02 wrong password and unknown username both get the same generic 401 and no cookie', async () => {
    await createUser('alice')

    const wrongPassword = await request(app).post('/api/auth/login').send({ username: 'alice', password: 'wrong-pass' })
    const unknownUser = await request(app).post('/api/auth/login').send({ username: 'nobody', password: TEST_PASSWORD })

    for (const res of [wrongPassword, unknownUser]) {
      expect(res.status).toBe(401)
      expect(res.body).toEqual({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' } })
      expect(res.headers['set-cookie']).toBeUndefined()
    }
  })

  it('TEST-F01-03 a DISABLED user cannot log in with the correct password', async () => {
    await createUser('alice', { status: 'DISABLED' })

    const res = await request(app).post('/api/auth/login').send({ username: 'alice', password: TEST_PASSWORD })

    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' } })
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  it('TEST-F01-04 after logout the old session cookie is rejected', async () => {
    await createUser('alice')
    const cookie = await loginCookie('alice')

    const logout = await request(app).post('/api/auth/logout').set('Cookie', cookie)
    expect(logout.status).toBe(200)
    expect(logout.body).toEqual({ ok: true })

    const me = await request(app).get('/api/auth/me').set('Cookie', cookie)
    expect(me.status).toBe(401)
    expect(me.body.error.code).toBe('UNAUTHENTICATED')
  })

  it('TEST-F01-05 every protected Sprint 1 endpoint returns 401 without a session and no private data', async () => {
    const endpoints: [method: 'get' | 'post' | 'put' | 'patch', path: string][] = [
      ['get', '/api/auth/me'],
      ['post', '/api/auth/logout'],
      ['get', '/api/admin/users'],
      ['patch', '/api/admin/users/1'],
      ['get', '/api/accounts'],
      ['put', '/api/accounts/1/opening-balance'],
      ['post', '/api/transactions'],
      ['get', '/api/transactions'],
      ['get', '/api/transactions/1'],
      ['get', '/api/overview'],
      ['get', '/api/summary'],
    ]

    for (const [method, path] of endpoints) {
      const res = await request(app)[method](path).send({})
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(401)
      expect(Object.keys(res.body), `${method.toUpperCase()} ${path}`).toEqual(['error'])
      expect(res.body.error.code).toBe('UNAUTHENTICATED')
    }
  })

  it('TEST-F01-06 seeded passwords are stored as bcrypt (cost >= 10) and never returned', async () => {
    process.env.SEED_USER_PASSWORD = 'Seed-user-pass-1'
    process.env.SEED_ADMIN_PASSWORD = 'Seed-admin-pass-1'
    const { seed } = await import('../prisma/seed')
    await seed(prisma)

    const users = await prisma.user.findMany()
    expect(users.map((u) => u.username).sort()).toEqual(['admin', 'alice', 'bob'])
    for (const user of users) {
      expect(user.passwordHash).toMatch(/^\$2[aby]\$(1\d|[2-9]\d)\$/)
      expect(user.passwordHash).not.toContain('Seed-')
    }

    const login = await request(app).post('/api/auth/login').send({ username: 'alice', password: 'Seed-user-pass-1' })
    expect(login.status).toBe(200)
    const me = await request(app).get('/api/auth/me').set('Cookie', (login.headers['set-cookie'] as unknown as string[])[0].split(';')[0])
    for (const body of [login.body, me.body]) {
      expect(body).not.toHaveProperty('password')
      expect(body).not.toHaveProperty('passwordHash')
      expect(JSON.stringify(body)).not.toContain('$2')
    }
  })
})
