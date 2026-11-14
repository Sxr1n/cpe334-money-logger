import 'dotenv/config'

// Runs before each test file's imports, so src/prisma.ts connects to the test database.
if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set')
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
