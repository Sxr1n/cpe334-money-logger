import cookieParser from 'cookie-parser'
import express, { type NextFunction, type Request, type Response } from 'express'
import healthRouter from './routes/health'

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use('/api', healthRouter)

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
