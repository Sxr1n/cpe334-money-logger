import { Router } from 'express'
import { prisma } from '../prisma'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: process.env.APP_VERSION ?? 'dev' })
})

// Lab 5: the post-deploy smoke test uses this to prove the app reaches the database.
router.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ready', db: 'connected' })
  } catch {
    res.status(503).json({ status: 'not_ready' })
  }
})

export default router
