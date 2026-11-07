import 'dotenv/config'
import bcrypt from 'bcryptjs'
import type { PrismaClient } from '../generated/prisma/client'
import { BCRYPT_COST } from '../src/lib/auth'

// Synthetic demo data only. Passwords come from env so none is committed (NFR-09).
const USERS = [
  { username: 'alice', displayName: 'Alice Example', role: 'USER', passwordEnv: 'SEED_USER_PASSWORD' },
  { username: 'bob', displayName: 'Bob Example', role: 'USER', passwordEnv: 'SEED_USER_PASSWORD' },
  { username: 'admin', displayName: 'Platform Admin', role: 'ADMIN', passwordEnv: 'SEED_ADMIN_PASSWORD' },
] as const

export async function seed(prisma: PrismaClient) {
  for (const u of USERS) {
    const password = process.env[u.passwordEnv]
    if (!password) throw new Error(`${u.passwordEnv} is not set`)
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST)
    // Idempotent and non-destructive: existing users (and an admin's disable) are left untouched,
    // so SEED_ON_START can stay on across restarts and redeploys.
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, displayName: u.displayName, role: u.role, passwordHash },
    })
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  import('../src/prisma').then(async ({ prisma }) => {
    await seed(prisma)
    await prisma.$disconnect()
    console.log('Seed complete: alice, bob (USER), admin (ADMIN)')
  })
}
