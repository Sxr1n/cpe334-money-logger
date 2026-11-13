import { afterEach, describe, expect, it, vi } from 'vitest'
import { bangkokToday, currentMonthRange } from '../src/lib/period'

afterEach(() => {
  vi.useRealTimers()
})

describe('F-06 Asia/Bangkok month boundaries', () => {
  it('TEST-F06-04 (range) at 2026-11-30 23:30 Bangkok the default period is still November', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-30T16:30:00Z'))

    expect(bangkokToday()).toBe('2026-11-30')
    expect(currentMonthRange()).toEqual({ from: '2026-11-01', to: '2026-11-30' })
  })

  it('TEST-F06-04 (range) at 2026-12-01 00:10 Bangkok the default period is December, though UTC is still 30 Nov', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-30T17:10:00Z'))

    expect(bangkokToday()).toBe('2026-12-01')
    expect(currentMonthRange()).toEqual({ from: '2026-12-01', to: '2026-12-31' })
  })

  it('TEST-F06-04 (range) month length follows the calendar, including leap February', () => {
    expect(currentMonthRange(new Date('2028-02-10T05:00:00Z'))).toEqual({ from: '2028-02-01', to: '2028-02-29' })
    expect(currentMonthRange(new Date('2027-02-10T05:00:00Z'))).toEqual({ from: '2027-02-01', to: '2027-02-28' })
  })
})
