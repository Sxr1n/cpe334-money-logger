import { Router } from 'express'
import { parsePaging, sendValidationFailed } from '../lib/query'
import { prisma } from '../prisma'

// Mounted at /api/admin behind requireAuth + requireRole('ADMIN') (see app.ts).
const router = Router()

// FR-04: explicit field list, so no financial data can leak into the response.
const userFields = { id: true, username: true, displayName: true, role: true, status: true, createdAt: true } as const

const validationFailed = (details: Record<string, string>) => ({
  error: { code: 'VALIDATION_FAILED', message: 'Invalid request.', details },
})

router.get('/users', async (req, res) => {
  const paging = parsePaging(req.query)
  if ('error' in paging) return sendValidationFailed(res, paging.error)

  const [items, total] = await Promise.all([
    prisma.user.findMany({ select: userFields, orderBy: { username: 'asc' }, skip: paging.skip, take: paging.pageSize }),
    prisma.user.count(),
  ])
  res.json({ items, page: paging.page, pageSize: paging.pageSize, total })
})

router.patch('/users/:id', async (req, res) => {
  const id = Number(req.params.id)
  const status = req.body?.status
  if (status !== 'ACTIVE' && status !== 'DISABLED') {
    return res.status(422).json(validationFailed({ status: 'Must be ACTIVE or DISABLED' }))
  }
  // BR-13: an administrator cannot lock themselves out.
  if (id === req.user!.id && status === 'DISABLED') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You cannot disable your own account.' } })
  }

  const user = Number.isInteger(id) ? await prisma.user.findUnique({ where: { id } }) : null
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } })
  if (user.status === status) {
    return res.json(await prisma.user.findUniqueOrThrow({ where: { id }, select: userFields }))
  }

  // BR-13/D-08: disabling also bumps token_version, so existing sessions fail on their next request.
  const updated = await prisma.user.update({
    where: { id },
    data: { status, ...(status === 'DISABLED' ? { tokenVersion: { increment: 1 } } : {}) },
    select: userFields,
  })
  res.json(updated)
})

export default router
