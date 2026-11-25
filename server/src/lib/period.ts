// A-02: "today" and month boundaries follow Asia/Bangkok, not the server clock's UTC date.
const bangkokDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' })

// YYYY-MM-DD in Asia/Bangkok (en-CA formats dates as ISO).
export function bangkokToday(now: Date = new Date()): string {
  return bangkokDate.format(now)
}

// FR-25 default period: first..last day of the current Bangkok calendar month.
export function currentMonthRange(now: Date = new Date()): { from: string; to: string } {
  return monthBounds(bangkokToday(now).slice(0, 7))
}

// First and last calendar day of a YYYY-MM month.
export function monthBounds(month: string): { from: string; to: string } {
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` }
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/
const toIndex = (m: string) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1
const fromIndex = (i: number) => `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`

// F-16 / D-14: ?fromMonth&toMonth (YYYY-MM), default the last 6 Bangkok months, at most 12 months.
export function parseMonthRange(
  query: Record<string, unknown>,
  now: Date = new Date(),
): { error: Record<string, string> } | { fromMonth: string; toMonth: string; months: string[] } {
  const to = query.toMonth ?? bangkokToday(now).slice(0, 7)
  if (typeof to !== 'string' || !MONTH.test(to)) return { error: { toMonth: 'Enter a month as YYYY-MM' } }
  const from = query.fromMonth ?? fromIndex(toIndex(to) - 5)
  if (typeof from !== 'string' || !MONTH.test(from)) return { error: { fromMonth: 'Enter a month as YYYY-MM' } }
  const count = toIndex(to) - toIndex(from) + 1
  if (count < 1) return { error: { fromMonth: 'Must not be after toMonth' } }
  if (count > 12) return { error: { fromMonth: 'At most 12 months' } }
  return { fromMonth: from, toMonth: to, months: Array.from({ length: count }, (_, i) => fromIndex(toIndex(from) + i)) }
}
