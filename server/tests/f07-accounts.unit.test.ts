import { describe, expect, it } from 'vitest'
import { validateAccountInput } from '../src/lib/accountInput'

describe('F-07 account input (unit)', () => {
  it('TEST-F07-02 name 1–50 characters after trim; type one of five', () => {
    expect(validateAccountInput({ name: '', type: 'CASH' }).details?.name).toBeDefined()
    expect(validateAccountInput({ name: '   ', type: 'CASH' }).details?.name).toBeDefined()
    expect(validateAccountInput({ name: 'x'.repeat(51), type: 'CASH' }).details?.name).toBeDefined()
    expect(validateAccountInput({ name: 'x'.repeat(50), type: 'CASH' })).toEqual({ ok: true, name: 'x'.repeat(50), type: 'CASH' })
    expect(validateAccountInput({ name: '  Wallet  ', type: 'LOAN_GIVEN' })).toEqual({ ok: true, name: 'Wallet', type: 'LOAN_GIVEN' })
    expect(validateAccountInput({ name: 'Savings', type: 'SAVINGS' }).details?.type).toBeDefined()
    expect(validateAccountInput({ name: 1, type: 'CASH' }).badRequest).toBe(true)
    expect(validateAccountInput(null).badRequest).toBe(true)
  })
})
