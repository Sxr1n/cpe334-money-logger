import bcrypt from 'bcryptjs'
import { Router, type CookieOptions } from 'express'
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS, signSessionToken } from '../lib/auth'
import { requireAuth } from '../middleware/requireAuth'
import { prisma } from '../prisma'

const router = Router()

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body ?? {}
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Username and password are required.' } })
  }

  // FR-01/BR-13: one response for unknown user, wrong password and DISABLED user.
  const user = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } })
  const valid = user !== null && user.status === 'ACTIVE' && (await bcrypt.compare(password, user.passwordHash))
  if (!user || !valid) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' } })
  }

  res.cookie(SESSION_COOKIE_NAME, signSessionToken(user.id, user.tokenVersion), {
    ...cookieOptions,
    maxAge: SESSION_TTL_SECONDS * 1000,
  })
  res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role })
})

router.post('/auth/logout', requireAuth, async (req, res) => {
  // FR-02/NFR-04: bumping token_version invalidates every token issued before now, even if replayed.
  await prisma.user.update({ where: { id: req.user!.id }, data: { tokenVersion: { increment: 1 } } })
  res.clearCookie(SESSION_COOKIE_NAME, cookieOptions)
  res.json({ ok: true })
})

router.get('/auth/me', requireAuth, (req, res) => {
  res.json(req.user)
})

export default router
