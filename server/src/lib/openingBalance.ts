export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  )
}

export function validateOpeningBalanceInput(body: unknown): {
  valid: boolean
  errorType?: 'BAD_REQUEST' | 'VALIDATION_FAILED'
  details?: Record<string, string>
} {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, errorType: 'BAD_REQUEST' }
  }
  const { amount, date } = body as Record<string, unknown>
  if (amount === undefined || date === undefined) {
    return { valid: false, errorType: 'BAD_REQUEST' }
  }
  if (typeof amount !== 'number' || typeof date !== 'string') {
    return { valid: false, errorType: 'BAD_REQUEST' }
  }

  const details: Record<string, string> = {}
  if (!Number.isInteger(amount) || amount < 0 || amount > 99999999999) {
    details.amount = 'Must be an integer between 0 and 99,999,999,999 satang'
  }
  if (!isValidDateString(date)) {
    details.date = 'Must be a valid calendar date in YYYY-MM-DD format'
  }

  if (Object.keys(details).length > 0) {
    return { valid: false, errorType: 'VALIDATION_FAILED', details }
  }
  return { valid: true }
}
