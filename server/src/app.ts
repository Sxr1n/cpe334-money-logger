import cookieParser from 'cookie-parser'
import express, { type NextFunction, type Request, type Response } from 'express'
import { requireAuth } from './middleware/requireAuth'
import { requireRole } from './middleware/requireRole'
import authRouter from './routes/auth'
import healthRouter from './routes/health'

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use('/api', healthRouter)
app.use('/api', authRouter)

// SDS §5: guards are mounted per route group, so every endpoint added under these prefixes inherits them.
app.use('/api/admin', requireAuth, requireRole('ADMIN'))
app.use(['/api/accounts', '/api/transactions', '/api/overview', '/api/summary'], requireAuth, requireRole('USER'))

// SDS §4.2: one error shape, no stack traces or SQL text in responses.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } })
})

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Request body is not valid JSON.' } })
  }
  console.error(err instanceof Error ? err.message : err)
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong.' } })
})

export default app
