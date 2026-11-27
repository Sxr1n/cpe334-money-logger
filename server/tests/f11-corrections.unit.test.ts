import { describe, expect, it } from 'vitest'
import { AccountType } from '../generated/prisma/client'
import { computeNetDeltas } from '../src/lib/ledger'

describe('F-11 Transaction corrections (unit)', () => {
  it('TEST-F11-01 computeNetDeltas returns net balance changes between old and new transaction effects', () => {
    const net = computeNetDeltas(
      {
        form: 'PAYMENT',
        primaryAccount: { id: 2, type: AccountType.LOAN_TAKEN },
        lines: [
          { account: { id: 10, type: AccountType.EXPENSE }, amount: 70000n },
          { account: { id: 11, type: AccountType.EXPENSE }, amount: 50000n },
        ],
        total: 120000n,
      },
      {
        form: 'PAYMENT',
        primaryAccount: { id: 2, type: AccountType.LOAN_TAKEN },
        lines: [{ account: { id: 10, type: AccountType.EXPENSE }, amount: 100000n }],
        total: 100000n,
      },
    )

    expect(net).toEqual([{ accountId: 2, delta: -20000n }])
  })
})
