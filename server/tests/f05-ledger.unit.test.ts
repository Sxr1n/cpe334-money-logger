import { AccountType } from '../generated/prisma/client'
import { describe, expect, it } from 'vitest'
import {
  calculateTxnEffects,
  validateAllowedAccountTypes,
} from '../src/lib/ledger'

describe('F-05 Ledger core & validator (unit)', () => {
  it('TEST-F05-01 unit: effects of PAYMENT from LOAN_TAKEN primary with EXPENSE lines (BR-05)', () => {
    const card = { id: 12, name: 'Credit Card', type: AccountType.LOAN_TAKEN, balance: 0n }
    const dining = { id: 14, name: 'Dining', type: AccountType.EXPENSE, balance: 0n }
    const groceries = { id: 15, name: 'Groceries', type: AccountType.EXPENSE, balance: 0n }

    const result = calculateTxnEffects(
      'PAYMENT',
      card,
      [
        { account: dining, amount: 70000n },
        { account: groceries, amount: 50000n },
      ],
      120000n,
    )

    expect(result.valid).toBe(true)
    expect(result.deltas).toEqual([
      { accountId: 12, delta: 120000n },
    ])
  })

  it('TEST-F05-02 unit: effects of PAYMENT from CASH primary with LOAN_TAKEN repayment line (BR-05, BR-06)', () => {
    const bank = { id: 11, name: 'Bank', type: AccountType.CASH, balance: 3500000n }
    const card = { id: 12, name: 'Credit Card', type: AccountType.LOAN_TAKEN, balance: 120000n }

    const result = calculateTxnEffects(
      'PAYMENT',
      bank,
      [{ account: card, amount: 120000n }],
      120000n,
    )

    expect(result.valid).toBe(true)
    expect(result.deltas).toEqual([
      { accountId: 11, delta: -120000n },
      { accountId: 12, delta: -120000n },
    ])
  })

  it('TEST-F05-04 unit: validateAllowedAccountTypes enforces Sprint 1 allowed types table for PAYMENT (BR-03)', () => {
    // Primary Salary (INCOME) -> rejected
    const badPrimaryIncome = validateAllowedAccountTypes('PAYMENT', AccountType.INCOME, [AccountType.EXPENSE])
    expect(badPrimaryIncome.valid).toBe(false)
    expect(badPrimaryIncome.errorType).toBe('RULE_VIOLATION')
    expect(badPrimaryIncome.details?.primaryAccountId).toBe('Paying account must be CASH or LOAN_TAKEN')

    // Primary Dining (EXPENSE) -> rejected
    const badPrimaryExpense = validateAllowedAccountTypes('PAYMENT', AccountType.EXPENSE, [AccountType.EXPENSE])
    expect(badPrimaryExpense.valid).toBe(false)
    expect(badPrimaryExpense.errorType).toBe('RULE_VIOLATION')

    // Primary LOAN_GIVEN -> rejected
    const badPrimaryLoanGiven = validateAllowedAccountTypes('PAYMENT', AccountType.LOAN_GIVEN, [AccountType.EXPENSE])
    expect(badPrimaryLoanGiven.valid).toBe(false)
    expect(badPrimaryLoanGiven.errorType).toBe('RULE_VIOLATION')

    // Line CASH -> rejected in Sprint 1
    const badLineCash = validateAllowedAccountTypes('PAYMENT', AccountType.CASH, [AccountType.CASH])
    expect(badLineCash.valid).toBe(false)
    expect(badLineCash.errorType).toBe('RULE_VIOLATION')
    expect(badLineCash.details?.['lines[0]']).toBe('Payment lines must be EXPENSE or LOAN_TAKEN accounts')

    // Line LOAN_GIVEN -> rejected in Sprint 1
    const badLineLoanGiven = validateAllowedAccountTypes('PAYMENT', AccountType.CASH, [AccountType.LOAN_GIVEN])
    expect(badLineLoanGiven.valid).toBe(false)
    expect(badLineLoanGiven.errorType).toBe('RULE_VIOLATION')

    // Line INCOME -> rejected in Sprint 1
    const badLineIncome = validateAllowedAccountTypes('PAYMENT', AccountType.CASH, [AccountType.INCOME])
    expect(badLineIncome.valid).toBe(false)
    expect(badLineIncome.errorType).toBe('RULE_VIOLATION')

    // Valid combinations:
    // CASH primary with EXPENSE line
    expect(validateAllowedAccountTypes('PAYMENT', AccountType.CASH, [AccountType.EXPENSE]).valid).toBe(true)
    // CASH primary with LOAN_TAKEN line
    expect(validateAllowedAccountTypes('PAYMENT', AccountType.CASH, [AccountType.LOAN_TAKEN]).valid).toBe(true)
    // LOAN_TAKEN primary with EXPENSE line
    expect(validateAllowedAccountTypes('PAYMENT', AccountType.LOAN_TAKEN, [AccountType.EXPENSE]).valid).toBe(true)
  })

  it('TEST-F05-05 unit: CASH primary balance check enforces non-negative balance (BR-07)', () => {
    const bank = { id: 11, name: 'Bank', type: AccountType.CASH, balance: 1000000n }
    const dining = { id: 14, name: 'Dining', type: AccountType.EXPENSE, balance: 0n }

    // Bank 1,000,000, payment 1,000,001 -> rejected
    const overspend = calculateTxnEffects(
      'PAYMENT',
      bank,
      [{ account: dining, amount: 1000001n }],
      1000001n,
    )
    expect(overspend.valid).toBe(false)
    expect(overspend.errorType).toBe('RULE_VIOLATION')
    expect(overspend.details?.total).toMatch(/Not enough money in Bank/i)

    // Bank 1,000,000, payment exactly 1,000,000 -> accepted, balance becomes 0
    const exact = calculateTxnEffects(
      'PAYMENT',
      bank,
      [{ account: dining, amount: 1000000n }],
      1000000n,
    )
    expect(exact.valid).toBe(true)
    expect(exact.deltas).toEqual([
      { accountId: 11, delta: -1000000n },
    ])
  })

  it('TEST-F05-06 unit: LOAN_TAKEN repayment line cannot exceed outstanding debt (BR-08)', () => {
    const bank = { id: 11, name: 'Bank', type: AccountType.CASH, balance: 5000000n }
    const card = { id: 12, name: 'Credit Card', type: AccountType.LOAN_TAKEN, balance: 120000n }

    // Card debt 120,000, repayment 120,001 -> rejected
    const overpay = calculateTxnEffects(
      'PAYMENT',
      bank,
      [{ account: card, amount: 120001n }],
      120001n,
    )
    expect(overpay.valid).toBe(false)
    expect(overpay.errorType).toBe('RULE_VIOLATION')
    expect(overpay.details?.['lines[0].amount']).toMatch(/More than the outstanding debt/i)

    // Card debt 120,000, repayment exactly 120,000 -> accepted, debt becomes 0
    const exact = calculateTxnEffects(
      'PAYMENT',
      bank,
      [{ account: card, amount: 120000n }],
      120000n,
    )
    expect(exact.valid).toBe(true)
    expect(exact.deltas).toEqual([
      { accountId: 11, delta: -120000n },
      { accountId: 12, delta: -120000n },
    ])
  })
})
