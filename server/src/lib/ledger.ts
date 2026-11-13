import { AccountType, type Account } from '../../generated/prisma/client'

export interface TxnLineInput {
  accountId: number
  amount: number
}

export interface CreateTxnInput {
  form: 'RECEIPT' | 'PAYMENT'
  primaryAccountId: number
  date: string
  total: number
  note?: string | null
  lines: TxnLineInput[]
}

export interface ValidationResult {
  valid: boolean
  errorType?: 'BAD_REQUEST' | 'VALIDATION_FAILED' | 'RULE_VIOLATION'
  details?: Record<string, string>
}

// Asia/Bangkok date helper
export function getTodayBangkok(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now)
}

// Allowed lines table for Sprint 1 (contract §2)
export function validateAllowedAccountTypes(
  form: 'RECEIPT' | 'PAYMENT',
  primaryType: AccountType,
  lineTypes: AccountType[],
): ValidationResult {
  const details: Record<string, string> = {}

  if (form === 'RECEIPT') {
    if (primaryType !== AccountType.CASH) {
      details.primaryAccountId = 'Receiving account must be CASH'
    }
    lineTypes.forEach((type, idx) => {
      if (type !== AccountType.INCOME) {
        details.lines = 'Receipt lines must be INCOME accounts'
        details[`lines[${idx}]`] = 'Receipt lines must be INCOME accounts'
      }
    })
  } else if (form === 'PAYMENT') {
    if (primaryType !== AccountType.CASH && primaryType !== AccountType.LOAN_TAKEN) {
      details.primaryAccountId = 'Paying account must be CASH or LOAN_TAKEN'
    }
    lineTypes.forEach((type, idx) => {
      if (type !== AccountType.EXPENSE && type !== AccountType.LOAN_TAKEN) {
        details[`lines[${idx}]`] = 'Payment lines must be EXPENSE or LOAN_TAKEN accounts'
      }
    })
  }

  if (Object.keys(details).length > 0) {
    return { valid: false, errorType: 'RULE_VIOLATION', details }
  }

  return { valid: true }
}

export function validateTxnInput(body: unknown, now?: Date): ValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, errorType: 'BAD_REQUEST' }
  }

  const b = body as Record<string, unknown>

  // Shape validation (BAD_REQUEST)
  if (b.form !== 'RECEIPT' && b.form !== 'PAYMENT') {
    return { valid: false, errorType: 'BAD_REQUEST' }
  }
  if (typeof b.primaryAccountId !== 'number' || !Number.isInteger(b.primaryAccountId)) {
    return { valid: false, errorType: 'BAD_REQUEST' }
  }
  if (typeof b.date !== 'string') {
    return { valid: false, errorType: 'BAD_REQUEST' }
  }
  if (typeof b.total !== 'number') {
    return { valid: false, errorType: 'BAD_REQUEST' }
  }
  if (!Array.isArray(b.lines)) {
    return { valid: false, errorType: 'BAD_REQUEST' }
  }
  for (const line of b.lines) {
    if (!line || typeof line !== 'object' || Array.isArray(line)) {
      return { valid: false, errorType: 'BAD_REQUEST' }
    }
    const l = line as Record<string, unknown>
    if (typeof l.accountId !== 'number' || !Number.isInteger(l.accountId)) {
      return { valid: false, errorType: 'BAD_REQUEST' }
    }
    if (typeof l.amount !== 'number') {
      return { valid: false, errorType: 'BAD_REQUEST' }
    }
  }
  if (b.note !== undefined && b.note !== null && typeof b.note !== 'string') {
    return { valid: false, errorType: 'BAD_REQUEST' }
  }

  const validationDetails: Record<string, string> = {}

  // BR-02 total satang validation
  if (!Number.isInteger(b.total)) {
    validationDetails.total = 'Total must be an integer satang amount'
  } else if ((b.total as number) <= 0) {
    validationDetails.total = 'Total must be greater than 0'
  } else if ((b.total as number) > 99999999999) {
    validationDetails.total = 'Total exceeds maximum allowed amount'
  }

  // BR-09 date validation (2000-01-01 <= date <= today(Asia/Bangkok))
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(b.date as string)) {
    validationDetails.date = 'Date must be formatted as YYYY-MM-DD'
  } else {
    const parsedDate = new Date(`${b.date}T00:00:00Z`)
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== b.date) {
      validationDetails.date = 'Date is invalid'
    } else {
      const todayBangkok = getTodayBangkok(now)
      if ((b.date as string) < '2000-01-01') {
        validationDetails.date = 'Date cannot be earlier than 2000-01-01'
      } else if ((b.date as string) > todayBangkok) {
        validationDetails.date = 'Date cannot be in the future'
      }
    }
  }

  // Note length validation (at most 200 chars)
  if (typeof b.note === 'string' && b.note.length > 200) {
    validationDetails.note = 'Note cannot exceed 200 characters'
  }

  // Line amount satang checks (BR-02)
  const lines = b.lines as { accountId: number; amount: number }[]
  lines.forEach((l, idx) => {
    if (!Number.isInteger(l.amount)) {
      validationDetails[`lines[${idx}].amount`] = 'Line amount must be an integer satang amount'
    } else if (l.amount <= 0) {
      validationDetails[`lines[${idx}].amount`] = 'Line amount must be greater than 0'
    } else if (l.amount > 99999999999) {
      validationDetails[`lines[${idx}].amount`] = 'Line amount exceeds maximum allowed amount'
    }
  })

  if (Object.keys(validationDetails).length > 0) {
    return { valid: false, errorType: 'VALIDATION_FAILED', details: validationDetails }
  }

  // Business rules checks (RULE_VIOLATION)
  const ruleDetails: Record<string, string> = {}

  // BR-01: lines.length >= 1
  if (lines.length === 0) {
    ruleDetails.lines = 'At least one line is required'
  } else {
    // BR-01: sum(amount) == total
    const sum = lines.reduce((acc, l) => acc + l.amount, 0)
    if (sum !== b.total) {
      ruleDetails.lines = 'Lines must add up to the total'
    }
  }

  // BR-04: no line uses primary account
  if (lines.some((l) => l.accountId === b.primaryAccountId)) {
    ruleDetails.lines = 'Line account cannot be the same as primary account'
  }

  // BR-04: no account twice in lines
  const accountIds = lines.map((l) => l.accountId)
  if (new Set(accountIds).size !== accountIds.length) {
    ruleDetails.lines = 'Each line must use a different account'
  }

  if (Object.keys(ruleDetails).length > 0) {
    return { valid: false, errorType: 'RULE_VIOLATION', details: ruleDetails }
  }

  return { valid: true }
}

