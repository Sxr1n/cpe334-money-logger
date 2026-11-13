import 'dotenv/config'
import { prisma } from '../src/prisma'
import { seed } from './seed'

// E2E starts from a known state: empty every table of the dev database and re-seed it (synthetic data only).
async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to reset a production database')
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`
  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`)
  }
  await seed(prisma)
  await prisma.$disconnect()
}

main()
