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

// Allowed lines table (F-10 completes SRS §4.2 with LOAN_GIVEN and LOAN_TAKEN lines)
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
      if (type === AccountType.EXPENSE) {
        details.lines = 'Receipt lines cannot be EXPENSE accounts'
        details[`lines[${idx}]`] = 'Receipt lines cannot be EXPENSE accounts'
      }
    })
  } else if (form === 'PAYMENT') {
    if (primaryType !== AccountType.CASH && primaryType !== AccountType.LOAN_TAKEN) {
      details.primaryAccountId = 'Paying account must be CASH or LOAN_TAKEN'
    }
    lineTypes.forEach((type, idx) => {
      if (type === AccountType.INCOME) {
        details[`lines[${idx}]`] = 'Payment lines cannot be INCOME accounts'
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

export interface AccountDelta {
  accountId: number
  delta: bigint
}

export interface TxnEffectsResult {
  valid: boolean
  errorType?: 'RULE_VIOLATION'
  details?: Record<string, string>
  deltas?: AccountDelta[]
}

export function formatBaht(satang: bigint | number): string {
  const n = typeof satang === 'bigint' ? Number(satang) : satang
  return (n / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export interface TxnEffectInput {
  form: 'RECEIPT' | 'PAYMENT'
  primaryAccount: { id: number; type: AccountType }
  lines: { account: { id: number; type: AccountType }; amount: bigint }[]
  total: bigint
}

// SRS §4.3: signed balance deltas for stored-balance accounts (CASH, LOAN_TAKEN, LOAN_GIVEN).
export function computeRawTxnDeltas(txn: TxnEffectInput): Map<number, bigint> {
  const map = new Map<number, bigint>()
  const add = (id: number, d: bigint) => map.set(id, (map.get(id) ?? 0n) + d)

  if (txn.form === 'RECEIPT') {
    if (txn.primaryAccount.type === AccountType.CASH) add(txn.primaryAccount.id, txn.total)
    for (const l of txn.lines) {
      if (l.account.type === AccountType.CASH || l.account.type === AccountType.LOAN_GIVEN) add(l.account.id, -l.amount)
      else if (l.account.type === AccountType.LOAN_TAKEN) add(l.account.id, l.amount)
    }
  } else {
    if (txn.primaryAccount.type === AccountType.CASH) add(txn.primaryAccount.id, -txn.total)
    else if (txn.primaryAccount.type === AccountType.LOAN_TAKEN) add(txn.primaryAccount.id, txn.total)
    for (const l of txn.lines) {
      if (l.account.type === AccountType.LOAN_TAKEN) add(l.account.id, -l.amount)
      else if (l.account.type === AccountType.CASH || l.account.type === AccountType.LOAN_GIVEN) add(l.account.id, l.amount)
    }
  }
  return map
}

// F-11: net deltas = -(old effects) + (new effects), or -(old effects) when voiding (newTxn = null).
export function computeNetDeltas(oldTxn: TxnEffectInput, newTxn: TxnEffectInput | null): AccountDelta[] {
  const net = new Map<number, bigint>()
  for (const [id, d] of computeRawTxnDeltas(oldTxn)) net.set(id, -d)
  if (newTxn) {
    for (const [id, d] of computeRawTxnDeltas(newTxn)) net.set(id, (net.get(id) ?? 0n) + d)
  }
  const result: AccountDelta[] = []
  for (const [accountId, delta] of net) {
    if (delta !== 0n) result.push({ accountId, delta })
  }
  return result
}

// creditLimit (CHG-01) is optional so callers without a limit keep the baseline behaviour.
type LedgerAccount = { id: number; name: string; type: AccountType; balance: bigint; creditLimit?: bigint | null }

// BR-18: the debt a LOAN_TAKEN account would have after adding `amount` must not exceed its limit.
function overCreditLimit(account: LedgerAccount, amount: bigint): string | null {
  if (account.creditLimit == null || account.balance + amount <= account.creditLimit) return null
  return `Over the credit limit of ${account.name} (available ฿${formatBaht(account.creditLimit - account.balance)})`
}

export function calculateTxnEffects(
  form: 'RECEIPT' | 'PAYMENT',
  primaryAccount: LedgerAccount,
  lines: { account: LedgerAccount; amount: bigint }[],
  total: bigint,
): TxnEffectsResult {
  const deltas: AccountDelta[] = []

  if (form === 'RECEIPT') {
    if (primaryAccount.type === AccountType.CASH) {
      deltas.push({ accountId: primaryAccount.id, delta: total })
    }
    // Lines: BR-05, BR-07 (CASH), BR-08 (LOAN_GIVEN), LOAN_TAKEN (+); INCOME lines don't store balance
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.account.type === AccountType.CASH) {
        if (line.amount > line.account.balance) {
          return {
            valid: false,
            errorType: 'RULE_VIOLATION',
            details: {
              [`lines[${i}].amount`]: `Not enough money in ${line.account.name} (balance ฿${formatBaht(line.account.balance)})`,
            },
          }
        }
        deltas.push({ accountId: line.account.id, delta: -line.amount })
      } else if (line.account.type === AccountType.LOAN_GIVEN) {
        if (line.amount > line.account.balance) {
          return {
            valid: false,
            errorType: 'RULE_VIOLATION',
            details: {
              [`lines[${i}].amount`]: `More than the amount owed to you ฿${formatBaht(line.account.balance)}`,
            },
          }
        }
        deltas.push({ accountId: line.account.id, delta: -line.amount })
      } else if (line.account.type === AccountType.LOAN_TAKEN) {
        const over = overCreditLimit(line.account, line.amount)
        if (over) return { valid: false, errorType: 'RULE_VIOLATION', details: { [`lines[${i}].amount`]: over } }
        deltas.push({ accountId: line.account.id, delta: line.amount })
      }
    }
    return { valid: true, deltas }
  }

  if (form === 'PAYMENT') {
    // BR-05 & BR-07: primary CASH balance -= total; primary LOAN_TAKEN balance += total
    if (primaryAccount.type === AccountType.CASH) {
      if (primaryAccount.balance < total) {
        return {
          valid: false,
          errorType: 'RULE_VIOLATION',
          details: {
            total: `Not enough money in ${primaryAccount.name} (balance ฿${formatBaht(primaryAccount.balance)})`,
          },
        }
      }
      deltas.push({ accountId: primaryAccount.id, delta: -total })
    } else if (primaryAccount.type === AccountType.LOAN_TAKEN) {
      const over = overCreditLimit(primaryAccount, total)
      if (over) return { valid: false, errorType: 'RULE_VIOLATION', details: { total: over } }
      deltas.push({ accountId: primaryAccount.id, delta: total })
    }

    // Lines: BR-05 & BR-08: LOAN_TAKEN -= amount; CASH += amount; LOAN_GIVEN += amount; EXPENSE no change
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.account.type === AccountType.LOAN_TAKEN) {
        if (line.amount > line.account.balance) {
          return {
            valid: false,
            errorType: 'RULE_VIOLATION',
            details: {
              [`lines[${i}].amount`]: `More than the outstanding debt ฿${formatBaht(line.account.balance)}`,
            },
          }
        }
        deltas.push({ accountId: line.account.id, delta: -line.amount })
      } else if (line.account.type === AccountType.CASH || line.account.type === AccountType.LOAN_GIVEN) {
        deltas.push({ accountId: line.account.id, delta: line.amount })
      }
    }

    return { valid: true, deltas }
  }

  return { valid: false, errorType: 'RULE_VIOLATION' }
}


