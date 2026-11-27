import { AccountType } from '../../generated/prisma/client'

export interface AccountInputResult {
  ok: boolean
  name?: string
  type?: AccountType
  badRequest?: boolean
  details?: Record<string, string>
}

const TYPES = Object.values(AccountType) as string[]

export function validateName(name: string): string | null {
  const trimmed = name.trim()
  return trimmed.length >= 1 && trimmed.length <= 50 ? null : 'Enter a name of 1 to 50 characters'
}

// F-07 §2: POST /api/accounts body. Shape errors → 400; field errors → 422 details.
export function validateAccountInput(body: unknown): AccountInputResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, badRequest: true }
  const { name, type } = body as Record<string, unknown>
  if (typeof name !== 'string' || typeof type !== 'string') return { ok: false, badRequest: true }

  const details: Record<string, string> = {}
  const nameError = validateName(name)
  if (nameError) details.name = nameError
  if (!TYPES.includes(type)) details.type = 'Choose one of CASH, LOAN_TAKEN, LOAN_GIVEN, INCOME, EXPENSE'
  if (Object.keys(details).length > 0) return { ok: false, details }
  return { ok: true, name: name.trim(), type: type as AccountType }
}

export type CreditLimitResult = { ok: true; value: bigint | null } | { ok: false; badRequest: true } | { ok: false; error: string }

// CHG-01 FR-28: integer satang in the BR-02 range, or null to remove. Non-integers → 400; out of range → 422.
export function validateCreditLimit(value: unknown): CreditLimitResult {
  if (value === null) return { ok: true, value: null }
  if (typeof value !== 'number' || !Number.isInteger(value)) return { ok: false, badRequest: true }
  if (value < 1 || value > 99999999999) return { ok: false, error: 'Credit limit must be between ฿0.01 and ฿999,999,999.99' }
  return { ok: true, value: BigInt(value) }
}
