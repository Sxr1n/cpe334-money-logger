import { describe, expect, it } from 'vitest'
import type { TxnView } from './format'
import { toDuplicateDraft } from './duplicate'

describe('F-14 toDuplicateDraft (BR-17)', () => {
  it('TEST-F14-01 copies form, primary, total, lines and note; date = today; no favourite, id or status', () => {
    const txn: TxnView = {
      id: 42,
      form: 'PAYMENT',
      date: '2026-11-01',
      total: 120000,
      note: 'Weekend',
      status: 'POSTED',
      isFavorite: true,
      primaryAccount: { id: 1, name: 'Bank', type: 'CASH' },
      lines: [
        { id: 7, account: { id: 4, name: 'Dining', type: 'EXPENSE' }, amount: 70000 },
        { id: 8, account: { id: 5, name: 'Groceries', type: 'EXPENSE' }, amount: 50000 },
      ],
    }

    const draft = toDuplicateDraft(txn, '2026-11-26')

    expect(draft).toEqual({
      form: 'PAYMENT',
      primaryAccountId: 1,
      date: '2026-11-26',
      total: 120000,
      note: 'Weekend',
      lines: [
        { accountId: 4, amount: 70000 },
        { accountId: 5, amount: 50000 },
      ],
    })
    expect(draft).not.toHaveProperty('isFavorite')
    expect(draft).not.toHaveProperty('id')
    expect(draft).not.toHaveProperty('status')
  })
})
