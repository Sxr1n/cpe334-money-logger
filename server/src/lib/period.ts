// A-02: "today" and month boundaries follow Asia/Bangkok, not the server clock's UTC date.
const bangkokDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' })

// YYYY-MM-DD in Asia/Bangkok (en-CA formats dates as ISO).
export function bangkokToday(now: Date = new Date()): string {
  return bangkokDate.format(now)
}

// FR-25 default period: first..last day of the current Bangkok calendar month.
export function currentMonthRange(now: Date = new Date()): { from: string; to: string } {
  const month = bangkokToday(now).slice(0, 7)
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` }
}
