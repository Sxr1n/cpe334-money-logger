import 'dotenv/config'
import { prisma } from '../src/prisma'

// E2E only (TEST-F14-03): mark one transaction VOID in the dev database.
// shortcut: sets the status without reversing balances; replace with the F-11 void API once it merges.
async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to change a production database')
  const id = Number(process.argv[2])
  if (!Number.isInteger(id) || id <= 0) throw new Error('Usage: tsx prisma/e2e-void.ts <transactionId>')
  await prisma.txn.update({ where: { id }, data: { status: 'VOID' } })
  await prisma.$disconnect()
}

main()
