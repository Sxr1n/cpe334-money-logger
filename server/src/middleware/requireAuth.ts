import type { NextFunction, Request, Response } from 'express'
import { SESSION_COOKIE_NAME, verifySessionToken } from '../lib/auth'
import { prisma } from '../prisma'

export interface AuthenticatedUser {
  id: number
  username: string
  displayName: string
  role: 'USER' | 'ADMIN'
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser
  }
}

const unauthenticated = (res: Response) =>
  res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please log in.' } })

// BR-12/BR-13: identity comes only from the signed cookie; DISABLED users and tokens issued before
// logout/disable (token_version bumped) are rejected on every request.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[SESSION_COOKIE_NAME]
  const payload = typeof token === 'string' ? verifySessionToken(token) : null
  if (!payload) return unauthenticated(res)

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user || user.status !== 'ACTIVE' || user.tokenVersion !== payload.tv) return unauthenticated(res)

  req.user = { id: user.id, username: user.username, displayName: user.displayName, role: user.role }
  next()
}
