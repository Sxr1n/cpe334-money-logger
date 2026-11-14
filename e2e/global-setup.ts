import { execSync } from 'node:child_process'

// Reset + seed the E2E database so every run starts from the same synthetic data.
export default function globalSetup() {
  execSync('npx tsx prisma/reset-e2e.ts', { cwd: 'server', stdio: 'inherit' })
}
