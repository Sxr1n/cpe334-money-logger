import { describe, expect, it } from 'vitest'
import { parseMonthRange } from '../src/lib/period'

// 2026-11-25 10:00 in Bangkok
const NOW = new Date('2026-11-25T03:00:00Z')
const keys = (q: Record<string, string>) => {
  const r = parseMonthRange(q, NOW)
  return 'error' in r ? Object.keys(r.error) : r.months
}

describe('F-16 month range (unit)', () => {
  it('TEST-F16-04 default, 12-month limit, order and format', () => {
    expect(keys({})).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'])
    expect(keys({ toMonth: '2026-02' })).toEqual(['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'])
    expect(keys({ fromMonth: '2025-12', toMonth: '2026-11' })).toHaveLength(12)
    expect(keys({ fromMonth: '2025-11', toMonth: '2026-11' })).toEqual(['fromMonth'])
    expect(keys({ fromMonth: '2026-11', toMonth: '2026-10' })).toEqual(['fromMonth'])
    expect(keys({ fromMonth: '2026-13' })).toEqual(['fromMonth'])
    expect(keys({ toMonth: '2026-00' })).toEqual(['toMonth'])
    expect(keys({ fromMonth: '2026-11', toMonth: '2026-11' })).toEqual(['2026-11'])
  })
})
