import jwt from 'jsonwebtoken'

export const SESSION_COOKIE_NAME = 'ml_session'
export const SESSION_TTL_SECONDS = 8 * 60 * 60 // NFR-04: 8-hour session
export const BCRYPT_COST = 10 // NFR-03: cost >= 10

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return secret
}

export interface SessionPayload {
  sub: number
  tv: number
}

export function signSessionToken(userId: number, tokenVersion: number): string {
  return jwt.sign({ sub: userId, tv: tokenVersion }, jwtSecret(), { expiresIn: SESSION_TTL_SECONDS })
}

// Returns null for a bad signature, an expired token or an unexpected payload.
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, jwtSecret())
    if (typeof decoded === 'object' && typeof decoded.sub === 'number' && typeof decoded.tv === 'number') {
      return { sub: decoded.sub, tv: decoded.tv }
    }
    return null
  } catch {
    return null
  }
}
