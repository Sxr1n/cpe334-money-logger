import { AccountType } from '../generated/prisma/client'
import { describe, expect, it } from 'vitest'
import {
  validateAllowedAccountTypes,
  validateTxnInput,
} from '../src/lib/ledger'

describe('F-04 Ledger core & validator (unit)', () => {
  it('TEST-F04-02 validateLines detects line sum mismatch and empty lines (BR-01)', () => {
    // lines [2000000, 999999] vs total 3000000 (1 satang short)
    const mismatch = validateTxnInput({
      form: 'RECEIPT',
      primaryAccountId: 1,
      date: '2026-11-07',
      total: 3000000,
      lines: [
        { accountId: 2, amount: 2000000 },
        { accountId: 3, amount: 999999 },
      ],
    })
    expect(mismatch.valid).toBe(false)
    expect(mismatch.errorType).toBe('RULE_VIOLATION')
    expect(mismatch.details?.lines).toBe('Lines must add up to the total')

    // empty lines
    const empty = validateTxnInput({
      form: 'RECEIPT',
      primaryAccountId: 1,
      date: '2026-11-07',
      total: 3000000,
      lines: [],
    })
    expect(empty.valid).toBe(false)
    expect(empty.errorType).toBe('RULE_VIOLATION')
    expect(empty.details?.lines).toBe('At least one line is required')
  })

  it('TEST-F04-03 validateAllowedAccountTypes enforces Sprint 1 allowed types table (BR-03)', () => {
    // RECEIPT with LOAN_TAKEN primary -> rejected
    const badPrimary = validateAllowedAccountTypes('RECEIPT', AccountType.LOAN_TAKEN, [AccountType.INCOME])
    expect(badPrimary.valid).toBe(false)
    expect(badPrimary.errorType).toBe('RULE_VIOLATION')
    expect(badPrimary.details?.primaryAccountId).toBe('Receiving account must be CASH')

    // RECEIPT with EXPENSE line -> rejected
    const badLine = validateAllowedAccountTypes('RECEIPT', AccountType.CASH, [AccountType.EXPENSE])
    expect(badLine.valid).toBe(false)
    expect(badLine.errorType).toBe('RULE_VIOLATION')
    expect(badLine.details?.['lines[0]']).toBe('Receipt lines must be INCOME accounts')

    // RECEIPT with CASH primary and INCOME lines -> valid
    const validReceipt = validateAllowedAccountTypes('RECEIPT', AccountType.CASH, [
      AccountType.INCOME,
      AccountType.INCOME,
    ])
    expect(validReceipt.valid).toBe(true)
  })

  it('TEST-F04-04 satang and date boundary validation (BR-02, BR-09)', () => {
    const fixedNow = new Date('2026-11-07T12:00:00+07:00')

    const baseValid = {
      form: 'RECEIPT' as const,
      primaryAccountId: 1,
      date: '2026-11-07',
      total: 100000,
      lines: [{ accountId: 2, amount: 100000 }],
    }

    // Valid today
    expect(validateTxnInput(baseValid, fixedNow).valid).toBe(true)

    // Total non-integer satang: 100.5
    const nonIntTotal = validateTxnInput({ ...baseValid, total: 100.5, lines: [{ accountId: 2, amount: 100.5 }] }, fixedNow)
    expect(nonIntTotal.valid).toBe(false)
    expect(nonIntTotal.errorType).toBe('VALIDATION_FAILED')
    expect(nonIntTotal.details?.total).toBe('Total must be an integer satang amount')

    // Total zero: 0
    const zeroTotal = validateTxnInput({ ...baseValid, total: 0, lines: [{ accountId: 2, amount: 0 }] }, fixedNow)
    expect(zeroTotal.valid).toBe(false)
    expect(zeroTotal.errorType).toBe('VALIDATION_FAILED')
    expect(zeroTotal.details?.total).toBe('Total must be greater than 0')

    // Total negative: -100
    const negTotal = validateTxnInput({ ...baseValid, total: -100, lines: [{ accountId: 2, amount: -100 }] }, fixedNow)
    expect(negTotal.valid).toBe(false)
    expect(negTotal.errorType).toBe('VALIDATION_FAILED')
    expect(negTotal.details?.total).toBe('Total must be greater than 0')

    // Total exceeds max: 100,000,000,000
    const maxTotal = validateTxnInput(
      { ...baseValid, total: 100000000000, lines: [{ accountId: 2, amount: 100000000000 }] },
      fixedNow,
    )
    expect(maxTotal.valid).toBe(false)
    expect(maxTotal.errorType).toBe('VALIDATION_FAILED')
    expect(maxTotal.details?.total).toBe('Total exceeds maximum allowed amount')

    // Date tomorrow (Bangkok): 2026-11-08
    const futureDate = validateTxnInput({ ...baseValid, date: '2026-11-08' }, fixedNow)
    expect(futureDate.valid).toBe(false)
    expect(futureDate.errorType).toBe('VALIDATION_FAILED')
    expect(futureDate.details?.date).toBe('Date cannot be in the future')

    // Date before 2000-01-01: 1999-12-31
    const ancientDate = validateTxnInput({ ...baseValid, date: '1999-12-31' }, fixedNow)
    expect(ancientDate.valid).toBe(false)
    expect(ancientDate.errorType).toBe('VALIDATION_FAILED')
    expect(ancientDate.details?.date).toBe('Date cannot be earlier than 2000-01-01')

    // Date boundary: 2000-01-01 accepted
    expect(validateTxnInput({ ...baseValid, date: '2000-01-01' }, fixedNow).valid).toBe(true)

    // Note too long (> 200 chars)
    const longNote = validateTxnInput({ ...baseValid, note: 'a'.repeat(201) }, fixedNow)
    expect(longNote.valid).toBe(false)
    expect(longNote.errorType).toBe('VALIDATION_FAILED')
    expect(longNote.details?.note).toBe('Note cannot exceed 200 characters')
  })
})

