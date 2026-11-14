import type { NextFunction, Request, Response } from 'express'
import type { AuthenticatedUser } from './requireAuth'

export function requireRole(role: AuthenticatedUser['role']) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have access to this resource.' } })
    }
    next()
  }
}
