import { api, ApiError } from './api'
import type { TxnView } from './format'

export interface DuplicateDraft {
  form: TxnView['form']
  primaryAccountId: number
  date: string
  total: number
  note: string | null
  lines: { accountId: number; amount: number }[]
}

// BR-17: copy what the user entered; the date becomes today and the favourite flag, id and status are never copied.
export function toDuplicateDraft(txn: TxnView, today: string): DuplicateDraft {
  return {
    form: txn.form,
    primaryAccountId: txn.primaryAccount.id,
    date: today,
    total: txn.total,
    note: txn.note,
    lines: txn.lines.map((l) => ({ accountId: l.account.id, amount: l.amount })),
  }
}

export const duplicateHref = (txn: Pick<TxnView, 'id' | 'form'>) =>
  `/${txn.form === 'PAYMENT' ? 'pay' : 'receive'}?duplicate=${txn.id}`

export const toAmountStr =(satang: number) => (satang / 100).toFixed(2)

export interface LoadedDuplicate {
  draft: DuplicateDraft
  sourceDate: string
  archived: string[] // names of source accounts no longer offered; their fields are left empty (id 0)
}

export const DUPLICATE_NOT_FOUND = 'Transaction to duplicate was not found'

// F-14: read the source (own only, 404 otherwise) and blank out accounts that are not offered any more.
export async function loadDuplicate(id: string, form: TxnView['form'], offeredIds: number[], today: string): Promise<LoadedDuplicate> {
  let txn: TxnView
  try {
    txn = await api<TxnView>(`/transactions/${encodeURIComponent(id)}`)
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) throw new Error(DUPLICATE_NOT_FOUND)
    throw err
  }
  if (txn.form !== form) throw new Error(DUPLICATE_NOT_FOUND)

  const draft = toDuplicateDraft(txn, today)
  const archived: string[] = []
  const keep = (accountId: number, name: string) => {
    if (offeredIds.includes(accountId)) return accountId
    archived.push(name)
    return 0
  }
  draft.primaryAccountId = keep(draft.primaryAccountId, txn.primaryAccount.name)
  draft.lines = draft.lines.map((l, i) => ({ ...l, accountId: keep(l.accountId, txn.lines[i].account.name) }))
  return { draft, sourceDate: txn.date, archived }
}
