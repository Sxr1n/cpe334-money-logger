import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app'

describe('app scaffold', () => {
  it('GET /api/health returns status and version', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok', version: process.env.APP_VERSION ?? 'dev' })
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
