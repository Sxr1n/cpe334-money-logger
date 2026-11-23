import { describe, expect, it } from 'vitest'
import { balanceAfterOpeningChange } from '../src/lib/openingBalance'

describe('F-08 opening balance change (unit)', () => {
  it('TEST-F08-02 new balance = balance + (new − old); negative results are rejected', () => {
    // Bank: opening 1,000,000, then a payment of 800,000 → balance 200,000
    expect(balanceAfterOpeningChange(200000n, 1000000n, 799999n)).toBe(-1n)
    expect(balanceAfterOpeningChange(200000n, 1000000n, 800000n)).toBe(0n)
    expect(balanceAfterOpeningChange(1500000n, 1000000n, 2000000n)).toBe(2500000n)
  })
})
