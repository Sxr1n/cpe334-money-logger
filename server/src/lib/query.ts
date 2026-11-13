import type { Response } from 'express'
import { currentMonthRange } from './period'

export const sendValidationFailed = (res: Response, details: Record<string, string>) =>
  res.status(422).json({ error: { code: 'VALIDATION_FAILED', message: 'Invalid request.', details } })

// SDS §4.1 lists: ?page (>= 1, default 1) & ?pageSize (1-50, default 50). Returns error details when invalid.
type Invalid = { error: Record<string, string> }

export function parsePaging(query: Record<string, unknown>): Invalid | { page: number; pageSize: number; skip: number } {
  const page = query.page === undefined ? 1 : Number(query.page)
  const pageSize = query.pageSize === undefined ? 50 : Number(query.pageSize)
  if (!Number.isInteger(page) || page < 1) return { error: { page: 'Must be 1 or more' } }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) return { error: { pageSize: 'Must be 1 to 50' } }
  return { page, pageSize, skip: (page - 1) * pageSize }
}

// Rejects shapes like 2026-13-01 (Invalid Date) and 2026-02-30 (rolls over to March).
function isCalendarDate(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s)
}

// FR-25: optional ?from & ?to (YYYY-MM-DD, from <= to); a missing bound defaults to the current Bangkok month.
export function parsePeriod(query: Record<string, unknown>): Invalid | { from: string; to: string } {
  const month = currentMonthRange()
  const from = query.from ?? month.from
  const to = query.to ?? month.to
  if (!isCalendarDate(from)) return { error: { from: 'Enter a valid date (YYYY-MM-DD)' } }
  if (!isCalendarDate(to)) return { error: { to: 'Enter a valid date (YYYY-MM-DD)' } }
  if (from > to) return { error: { from: 'Must not be after "to"' } }
  return { from, to }
}
