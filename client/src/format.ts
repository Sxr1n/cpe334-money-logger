// Money is integer satang from the API (D-01); format as THB only for display.
export function formatTHB(satang: number) {
  return `฿${(satang / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// YYYY-MM-DD calendar date → "05 Nov 2026" (no time zone shift).
export function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export interface TxnView {
  id: number
  form: 'PAYMENT' | 'RECEIPT'
  date: string
  total: number
  note: string | null
  status: string
  isFavorite: boolean // F-13
  primaryAccount: { id: number; name: string; type: string }
  lines: { id: number; account: { id: number; name: string; type: string }; amount: number }[]
}

export const formLabel = (form: TxnView['form']) => (form === 'RECEIPT' ? 'Received' : 'Paid')

// F-11: balance before editTxn took effect (current balance minus editTxn's signed delta).
export function preEditBalance(accountId: number, currentBalance: number, editTxn?: TxnView): number {
  if (!editTxn) return currentBalance
  let effect = 0
  if (editTxn.form === 'RECEIPT') {
    if (editTxn.primaryAccount.id === accountId && editTxn.primaryAccount.type === 'CASH') effect += editTxn.total
    for (const l of editTxn.lines) {
      if (l.account.id !== accountId) continue
      if (l.account.type === 'CASH' || l.account.type === 'LOAN_GIVEN') effect -= l.amount
      else if (l.account.type === 'LOAN_TAKEN') effect += l.amount
    }
  } else {
    if (editTxn.primaryAccount.id === accountId) {
      if (editTxn.primaryAccount.type === 'CASH') effect -= editTxn.total
      else if (editTxn.primaryAccount.type === 'LOAN_TAKEN') effect += editTxn.total
    }
    for (const l of editTxn.lines) {
      if (l.account.id !== accountId) continue
      if (l.account.type === 'LOAN_TAKEN') effect -= l.amount
      else if (l.account.type === 'CASH' || l.account.type === 'LOAN_GIVEN') effect += l.amount
    }
  }
  return currentBalance - effect
}
