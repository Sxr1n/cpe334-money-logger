import { Router } from 'express'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: process.env.APP_VERSION ?? 'dev' })
})

export default router
