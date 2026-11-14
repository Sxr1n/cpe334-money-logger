import 'dotenv/config'
import { execSync } from 'node:child_process'

// Apply all committed migrations to the test database once per run.
export default function setup() {
  if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set')
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    stdio: 'pipe',
  })
}
