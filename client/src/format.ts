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
  primaryAccount: { id: number; name: string; type: string }
  lines: { id: number; account: { id: number; name: string; type: string }; amount: number }[]
}

export const formLabel = (form: TxnView['form']) => (form === 'RECEIPT' ? 'Received' : 'Paid')
