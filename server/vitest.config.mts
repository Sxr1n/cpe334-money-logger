import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**'],
    // API-DB tests share one real PostgreSQL test database, so files must not run concurrently.
    fileParallelism: false,
  },
})
