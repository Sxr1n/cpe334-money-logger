import { describe, expect, it } from 'vitest'
import { percentOf } from '../src/lib/summary'

describe('F-15 percent (unit)', () => {
  it('TEST-F15-01 one decimal from integer satang; null when there is no spending', () => {
    expect(percentOf(70000, 120000)).toBe(58.3)
    expect(percentOf(50000, 120000)).toBe(41.7)
    expect(percentOf(1, 3)).toBe(33.3)
    expect(percentOf(120000, 120000)).toBe(100)
    expect(percentOf(0, 0)).toBeNull()
  })
})
