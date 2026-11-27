import { describe, expect, it } from 'vitest'
import { AccountType } from '../generated/prisma/client'
import { calculateTxnEffects, validateAllowedAccountTypes } from '../src/lib/ledger'

const ALL_TYPES = [
  AccountType.CASH,
  AccountType.LOAN_TAKEN,
  AccountType.LOAN_GIVEN,
  AccountType.INCOME,
  AccountType.EXPENSE,
]

describe('F-10 Loans given and taken (unit)', () => {
  it('TEST-F10-01 PAYMENT from CASH with LOAN_GIVEN line increases receivable and decreases CASH', () => {
    const effects = calculateTxnEffects(
      'PAYMENT',
      { id: 1, name: 'Bank', type: AccountType.CASH, balance: 1000000n },
      [{ account: { id: 10, name: 'Loan to Ken', type: AccountType.LOAN_GIVEN, balance: 0n }, amount: 200000n }],
      200000n,
    )
    expect(effects.valid).toBe(true)
    expect(effects.deltas).toEqual([
      { accountId: 1, delta: -200000n },
      { accountId: 10, delta: 200000n },
    ])
  })

  it('TEST-F10-02 BR-08 rejects RECEIPT LOAN_GIVEN line exceeding receivable and accepts within receivable', () => {
    const over = calculateTxnEffects(
      'RECEIPT',
      { id: 1, name: 'Bank', type: AccountType.CASH, balance: 0n },
      [{ account: { id: 10, name: 'Loan to Ken', type: AccountType.LOAN_GIVEN, balance: 200000n }, amount: 200001n }],
      200001n,
    )
    expect(over.valid).toBe(false)
    expect(over.errorType).toBe('RULE_VIOLATION')
    expect(over.details?.['lines[0].amount']).toBe('More than the amount owed to you ฿2,000.00')

    const ok = calculateTxnEffects(
      'RECEIPT',
      { id: 1, name: 'Bank', type: AccountType.CASH, balance: 0n },
      [{ account: { id: 10, name: 'Loan to Ken', type: AccountType.LOAN_GIVEN, balance: 200000n }, amount: 150000n }],
      150000n,
    )
    expect(ok.valid).toBe(true)
    expect(ok.deltas).toEqual([
      { accountId: 1, delta: 150000n },
      { accountId: 10, delta: -150000n },
    ])
  })

  it('TEST-F10-06 50-case allowed-lines matrix matches SRS §4.2', () => {
    const expectedAllowed = (form: 'RECEIPT' | 'PAYMENT', primary: AccountType, line: AccountType): boolean => {
      if (form === 'RECEIPT') {
        return primary === AccountType.CASH && line !== AccountType.EXPENSE
      }
      return (primary === AccountType.CASH || primary === AccountType.LOAN_TAKEN) && line !== AccountType.INCOME
    }

    let count = 0
    for (const form of ['RECEIPT', 'PAYMENT'] as const) {
      for (const primary of ALL_TYPES) {
        for (const line of ALL_TYPES) {
          count++
          const res = validateAllowedAccountTypes(form, primary, [line])
          const shouldAllow = expectedAllowed(form, primary, line)
          expect(res.valid, `${form} primary=${primary} line=${line}`).toBe(shouldAllow)
          if (!shouldAllow) {
            expect(res.errorType).toBe('RULE_VIOLATION')
          }
        }
      }
    }
    expect(count).toBe(50)
  })
})
