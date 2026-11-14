import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'
import { SESSION_TTL_SECONDS, signSessionToken, verifySessionToken } from '../src/lib/auth'

describe('F-01 session token', () => {
  it('TEST-F01-07 a token past its 8-hour expiry is rejected', () => {
    expect(SESSION_TTL_SECONDS).toBe(8 * 60 * 60)

    const nowSeconds = Math.floor(Date.now() / 1000)
    const expired = jwt.sign(
      { sub: 1, tv: 0, iat: nowSeconds - SESSION_TTL_SECONDS - 60, exp: nowSeconds - 60 },
      process.env.JWT_SECRET!,
    )

    expect(verifySessionToken(expired)).toBeNull()
    expect(verifySessionToken(signSessionToken(1, 0))).toEqual({ sub: 1, tv: 0 })
  })
})
