import bcrypt from 'bcryptjs'
import request from 'supertest'
import app from '../../src/app'
import { prisma } from '../../src/prisma'

// Empty every application table (keeps Prisma's migration history).
export async function resetDb() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`
  if (tables.length === 0) return
  const list = tables.map((t) => `"${t.tablename}"`).join(', ')
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`)
}

export const TEST_PASSWORD = 'Test-pass-123'

export async function createUser(
  username: string,
  options: { role?: 'USER' | 'ADMIN'; status?: 'ACTIVE' | 'DISABLED'; password?: string } = {},
) {
  return prisma.user.create({
    data: {
      username,
      displayName: `${username[0].toUpperCase()}${username.slice(1)} Example`,
      passwordHash: await bcrypt.hash(options.password ?? TEST_PASSWORD, 10),
      role: options.role ?? 'USER',
      status: options.status ?? 'ACTIVE',
    },
  })
}

// Logs in through the real endpoint and returns the Cookie header value for later requests.
export async function loginCookie(username: string, password = TEST_PASSWORD): Promise<string> {
  const res = await request(app).post('/api/auth/login').send({ username, password })
  if (res.status !== 200) throw new Error(`login failed for ${username}: ${res.status}`)
  const setCookie = res.headers['set-cookie'] as unknown as string[]
  return setCookie.map((c) => c.split(';')[0]).join('; ')
}
