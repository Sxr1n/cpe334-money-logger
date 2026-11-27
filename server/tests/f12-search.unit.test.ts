import { describe, expect, it } from 'vitest'
import { escapeLike, parseTxnFilter } from '../src/lib/query'

const err = (q: Record<string, string>) => {
  const r = parseTxnFilter(q)
  return 'error' in r ? Object.keys(r.error) : []
}

describe('F-12 history filter parser (unit)', () => {
  it('TEST-F12-05 rejects each invalid parameter by name', () => {
    expect(err({ from: '2026-11-30', to: '2026-11-01' })).toEqual(['from'])
    expect(err({ to: '2026-02-30' })).toEqual(['to'])
    expect(err({ accountId: '0' })).toEqual(['accountId'])
    expect(err({ accountId: '1.5' })).toEqual(['accountId'])
    expect(err({ form: 'payment' })).toEqual(['form'])
    expect(err({ status: 'ALL' })).toEqual(['status'])
    expect(err({ minAmount: '-1' })).toEqual(['minAmount'])
    expect(err({ maxAmount: '100000000000' })).toEqual(['maxAmount'])
    expect(err({ minAmount: '10', maxAmount: '5' })).toEqual(['minAmount'])
    expect(err({ q: 'x'.repeat(101) })).toEqual(['q'])
  })

  it('TEST-F12-04 accepts valid filters; blank q means no text filter', () => {
    expect(parseTxnFilter({})).toEqual({ filter: {} })
    expect(parseTxnFilter({ q: '   ' })).toEqual({ filter: {} })
    expect(parseTxnFilter({ from: '2026-11-01', to: '2026-11-30', accountId: '7', form: 'RECEIPT', status: 'VOID', minAmount: '0', maxAmount: '50000', q: ' lunch ' })).toEqual({
      filter: { from: '2026-11-01', to: '2026-11-30', accountId: 7, form: 'RECEIPT', status: 'VOID', minAmount: 0n, maxAmount: 50000n, q: 'lunch' },
    })
  })

  it('TEST-F12-04 escapeLike makes % _ and backslash literal', () => {
    expect(escapeLike('10% off')).toBe(String.raw`10\% off`)
    expect(escapeLike('h_b')).toBe(String.raw`h\_b`)
    expect(escapeLike(String.raw`a\b`)).toBe(String.raw`a\\b`)
    expect(escapeLike('lunch')).toBe('lunch')
  })
})
