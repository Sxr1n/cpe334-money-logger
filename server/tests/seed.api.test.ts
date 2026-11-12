import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/prisma'
import { seed } from '../prisma/seed'
import { resetDb } from './helpers/db'

beforeEach(async () => {
  await resetDb()
  process.env.SEED_USER_PASSWORD = 'Seed-user-pass-1'
  process.env.SEED_ADMIN_PASSWORD = 'Seed-admin-pass-1'
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('seed (runs on every container start when SEED_ON_START=true)', () => {
  it('re-running the seed keeps existing users unchanged, including an admin disable', async () => {
    await seed(prisma)
    await prisma.user.update({ where: { username: 'bob' }, data: { status: 'DISABLED', tokenVersion: 5 } })
    const before = await prisma.user.findUniqueOrThrow({ where: { username: 'bob' } })

    await seed(prisma)

    const after = await prisma.user.findUniqueOrThrow({ where: { username: 'bob' } })
    expect(after).toEqual(before)
    expect(await prisma.user.count()).toBe(3)
  })
})
