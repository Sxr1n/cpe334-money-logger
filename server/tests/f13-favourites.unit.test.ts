import { describe, expect, it } from 'vitest'
import { parseTxnFilter } from '../src/lib/query'

describe('F-13 favourite filter (unit)', () => {
  it('TEST-F13-03 favorite accepts only "true"', () => {
    expect(parseTxnFilter({ favorite: 'true' })).toEqual({ filter: { favorite: true } })
    for (const v of ['yes', 'false', '1']) {
      const r = parseTxnFilter({ favorite: v })
      expect('error' in r && Object.keys(r.error)).toEqual(['favorite'])
    }
  })
})
