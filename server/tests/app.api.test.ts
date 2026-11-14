import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import app from '../src/app'
import { prisma } from '../src/prisma'

describe('app scaffold', () => {
  it('GET /api/health returns status and version', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', version: process.env.APP_VERSION ?? 'dev' })
  })

  it('GET /api/ready reports the database as connected (smoke test after each deploy)', async () => {
    const res = await request(app).get('/api/ready')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ready', db: 'connected' })
  })

  it('GET /api/ready returns 503 when the database cannot be reached', async () => {
    const spy = vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('connection refused'))
    const res = await request(app).get('/api/ready')
    spy.mockRestore()
    expect(res.status).toBe(503)
    expect(res.body).toEqual({ status: 'not_ready' })
  })

  it('unknown /api route returns the standard 404 error shape', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Not found.' } })
  })

  it('malformed JSON returns 400 BAD_REQUEST without a stack trace', async () => {
    const res = await request(app).post('/api/health').set('Content-Type', 'application/json').send('{bad')
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: { code: 'BAD_REQUEST', message: 'Request body is not valid JSON.' } })
  })
})
