import { describe, expect, it } from 'vitest'
import { AccountType } from '../generated/prisma/client'
import { calculateTxnEffects, validateAllowedAccountTypes } from '../src/lib/ledger'

describe('F-09 Transfers between own cash accounts (unit)', () => {
  it('TEST-F09-01 PAYMENT from CASH with CASH line is allowed and computes Bank -, Wallet +', () => {
    const allowed = validateAllowedAccountTypes('PAYMENT', AccountType.CASH, [AccountType.CASH])
    expect(allowed.valid).toBe(true)

    const effects = calculateTxnEffects(
      'PAYMENT',
      { id: 1, name: 'Bank', type: AccountType.CASH, balance: 1000000n },
      [{ account: { id: 2, name: 'Wallet', type: AccountType.CASH, balance: 0n }, amount: 300000n }],
      300000n,
    )
    expect(effects.valid).toBe(true)
    expect(effects.deltas).toEqual([
      { accountId: 1, delta: -300000n },
      { accountId: 2, delta: 300000n },
    ])
  })

  it('TEST-F09-02 RECEIPT into CASH with CASH line is allowed and computes Wallet +, Bank -', () => {
    const allowed = validateAllowedAccountTypes('RECEIPT', AccountType.CASH, [AccountType.CASH])
    expect(allowed.valid).toBe(true)

    const effects = calculateTxnEffects(
      'RECEIPT',
      { id: 2, name: 'Wallet', type: AccountType.CASH, balance: 300000n },
      [{ account: { id: 1, name: 'Bank', type: AccountType.CASH, balance: 700000n }, amount: 200000n }],
      200000n,
    )
    expect(effects.valid).toBe(true)
    expect(effects.deltas).toEqual([
      { accountId: 2, delta: 200000n },
      { accountId: 1, delta: -200000n },
    ])
  })

  it('TEST-F09-03 BR-07 rejects RECEIPT CASH line exceeding line balance and accepts exact balance', () => {
    const over = calculateTxnEffects(
      'RECEIPT',
      { id: 2, name: 'Wallet', type: AccountType.CASH, balance: 0n },
      [{ account: { id: 1, name: 'Bank', type: AccountType.CASH, balance: 500000n }, amount: 500001n }],
      500001n,
    )
    expect(over.valid).toBe(false)
    expect(over.errorType).toBe('RULE_VIOLATION')
    expect(over.details?.['lines[0].amount']).toBe('Not enough money in Bank (balance ฿5,000.00)')

    const exact = calculateTxnEffects(
      'RECEIPT',
      { id: 2, name: 'Wallet', type: AccountType.CASH, balance: 0n },
      [{ account: { id: 1, name: 'Bank', type: AccountType.CASH, balance: 500000n }, amount: 500000n }],
      500000n,
    )
    expect(exact.valid).toBe(true)
    expect(exact.deltas).toEqual([
      { accountId: 2, delta: 500000n },
      { accountId: 1, delta: -500000n },
    ])
  })
})
