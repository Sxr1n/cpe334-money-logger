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

export interface TxnFilter {
  from?: string
  to?: string
  accountId?: number
  form?: 'PAYMENT' | 'RECEIPT'
  status?: 'POSTED' | 'VOID'
  minAmount?: bigint
  maxAmount?: bigint
  q?: string
}

// F-12 §2: every parameter optional; each invalid one is reported under its own name.
export function parseTxnFilter(query: Record<string, unknown>): Invalid | { filter: TxnFilter } {
  const error: Record<string, string> = {}
  const filter: TxnFilter = {}
  const str = (k: string) => (query[k] === undefined ? undefined : typeof query[k] === 'string' ? (query[k] as string) : '\0')

  for (const k of ['from', 'to'] as const) {
    const v = str(k)
    if (v === undefined) continue
    if (isCalendarDate(v)) filter[k] = v
    else error[k] = 'Enter a valid date (YYYY-MM-DD)'
  }
  if (filter.from && filter.to && filter.from > filter.to) error.from = 'Must not be after "to"'

  const accountId = str('accountId')
  if (accountId !== undefined) {
    if (/^[1-9]\d{0,9}$/.test(accountId)) filter.accountId = Number(accountId)
    else error.accountId = 'Must be an account id'
  }

  const form = str('form')
  if (form !== undefined) {
    if (form === 'PAYMENT' || form === 'RECEIPT') filter.form = form
    else error.form = 'Must be PAYMENT or RECEIPT'
  }
  const status = str('status')
  if (status !== undefined) {
    if (status === 'POSTED' || status === 'VOID') filter.status = status
    else error.status = 'Must be POSTED or VOID'
  }

  for (const k of ['minAmount', 'maxAmount'] as const) {
    const v = str(k)
    if (v === undefined) continue
    if (/^\d{1,11}$/.test(v) && BigInt(v) <= 99999999999n) filter[k] = BigInt(v)
    else error[k] = 'Enter an amount in satang'
  }
  if (filter.minAmount !== undefined && filter.maxAmount !== undefined && filter.minAmount > filter.maxAmount) {
    error.minAmount = 'Must not be more than maxAmount'
  }

  const q = str('q')?.trim()
  if (q) {
    if (q.length <= 100) filter.q = q
    else error.q = 'At most 100 characters'
  }

  return Object.keys(error).length > 0 ? { error } : { filter }
}

// Prisma's `contains` passes % and _ through as LIKE wildcards; escape them so `q` matches literally (F-12).
export const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => '\\' + c)
