import { describe, expect, it } from 'vitest'
import { validateOpeningBalanceInput } from '../src/lib/openingBalance'

describe('F-03 Opening balance validator (unit)', () => {
  it('TEST-F03-03 validator cases: -1, 100.5, 1e11, 0, 99999999999 and date checks', () => {
    // Negative amount -> invalid
    expect(validateOpeningBalanceInput({ amount: -1, date: '2026-11-01' }).valid).toBe(false)

    // Non-integer satang -> invalid
    expect(validateOpeningBalanceInput({ amount: 100.5, date: '2026-11-01' }).valid).toBe(false)

    // Above 99,999,999,999 -> invalid
    expect(validateOpeningBalanceInput({ amount: 100000000000, date: '2026-11-01' }).valid).toBe(false)

    // Valid: 0 satang -> valid
    expect(validateOpeningBalanceInput({ amount: 0, date: '2026-11-01' }).valid).toBe(true)

    // Valid: max satang 99,999,999,999 -> valid
    expect(validateOpeningBalanceInput({ amount: 99999999999, date: '2026-11-01' }).valid).toBe(true)

    // Invalid date formats
    expect(validateOpeningBalanceInput({ amount: 500000, date: 'invalid-date' }).valid).toBe(false)
    expect(validateOpeningBalanceInput({ amount: 500000, date: '2026-02-31' }).valid).toBe(false)
    expect(validateOpeningBalanceInput({ amount: 500000, date: '' }).valid).toBe(false)

    // Non-object or missing fields
    expect(validateOpeningBalanceInput(null).valid).toBe(false)
    expect(validateOpeningBalanceInput({ amount: '500000', date: '2026-11-01' }).valid).toBe(false)
    expect(validateOpeningBalanceInput({ amount: 500000 }).valid).toBe(false)
  })
})
