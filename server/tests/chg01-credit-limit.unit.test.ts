import { AccountType } from '../generated/prisma/client'
import { describe, expect, it } from 'vitest'
import { validateCreditLimit } from '../src/lib/accountInput'
import { calculateTxnEffects } from '../src/lib/ledger'

describe('CHG-01 credit limit (unit)', () => {
  it('TEST-F05-10 unit: creditLimit input is integer satang 1..99999999999 or null', () => {
    expect(validateCreditLimit(null)).toEqual({ ok: true, value: null })
    expect(validateCreditLimit(1)).toEqual({ ok: true, value: 1n })
    expect(validateCreditLimit(99999999999)).toEqual({ ok: true, value: 99999999999n })

    for (const bad of [0, -1, 100000000000]) {
      const r = validateCreditLimit(bad)
      expect(r.ok, String(bad)).toBe(false)
      expect('error' in r && r.error, String(bad)).toBe('Credit limit must be between ฿0.01 and ฿999,999,999.99')
    }
    for (const bad of [1.5, '5000', undefined, true, {}]) {
      expect(validateCreditLimit(bad), String(bad)).toEqual({ ok: false, badRequest: true })
    }
  })

  it('TEST-F05-11 unit: a charge is limited by the card limit; equal is accepted; no limit = no check (BR-18)', () => {
    const card = { id: 12, name: 'Credit Card', type: AccountType.LOAN_TAKEN, balance: 120000n, creditLimit: 500000n }
    const dining = { id: 14, name: 'Dining', type: AccountType.EXPENSE, balance: 0n, creditLimit: null }

    const over = calculateTxnEffects('PAYMENT', card, [{ account: dining, amount: 380001n }], 380001n)
    expect(over.valid).toBe(false)
    expect(over.errorType).toBe('RULE_VIOLATION')
    expect(over.details?.total).toBe('Over the credit limit of Credit Card (available ฿3,800.00)')

    const exact = calculateTxnEffects('PAYMENT', card, [{ account: dining, amount: 380000n }], 380000n)
    expect(exact.valid).toBe(true)
    expect(exact.deltas).toEqual([{ accountId: 12, delta: 380000n }])

    const noLimit = calculateTxnEffects('PAYMENT', { ...card, creditLimit: null }, [{ account: dining, amount: 99999999999n }], 99999999999n)
    expect(noLimit.valid).toBe(true)
  })

  it('TEST-F05-12 unit: borrowing (RECEIPT line from LOAN_TAKEN) is limited too; repayment is never limited', () => {
    const bank = { id: 11, name: 'Bank', type: AccountType.CASH, balance: 100000n, creditLimit: null }
    const card = { id: 12, name: 'Credit Card', type: AccountType.LOAN_TAKEN, balance: 500000n, creditLimit: 500000n }

    const borrow = calculateTxnEffects('RECEIPT', bank, [{ account: card, amount: 1n }], 1n)
    expect(borrow.valid).toBe(false)
    expect(borrow.details?.['lines[0].amount']).toBe('Over the credit limit of Credit Card (available ฿0.00)')

    const repay = calculateTxnEffects('PAYMENT', bank, [{ account: card, amount: 100000n }], 100000n)
    expect(repay.valid).toBe(true)
  })
})
