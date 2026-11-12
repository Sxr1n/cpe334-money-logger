import { defineConfig, devices } from '@playwright/test'

// E2E logs in with the synthetic seed passwords from server/.env (never committed).
try {
  process.loadEnvFile('server/.env')
} catch {
  // CI provides the variables directly.
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    // PW_CHANNEL=chrome uses the installed Google Chrome, e.g. when Windows Smart App Control blocks Playwright's Chromium.
    channel: process.env.PW_CHANNEL || undefined,
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: './server',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run dev',
      cwd: './client',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
})
