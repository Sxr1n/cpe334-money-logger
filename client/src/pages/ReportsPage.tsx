import { useEffect, useState } from 'react'
import { api, ApiError } from '../api'
import { formatTHB } from '../format'

interface CategoryReport {
  from: string
  to: string
  total: number
  items: { accountId: number; name: string; archived: boolean; total: number; percent: number | null }[]
}

// Current Bangkok month (A-02), same default as the server.
function currentMonth() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())
  const [y, m] = today.split('-').map(Number)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return { from: `${today.slice(0, 7)}-01`, to: `${today.slice(0, 7)}-${String(last).padStart(2, '0')}` }
}

// F-15 FR-26: category spending for a period.
function CategorySpending() {
  const [range, setRange] = useState(currentMonth)
  const [query, setQuery] = useState(range)
  const [data, setData] = useState<CategoryReport | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    setError(null)
    api<CategoryReport>(`/reports/categories?from=${query.from}&to=${query.to}`)
      .then((res) => { setData(res); setErrors({}) })
      .catch((err) => {
        if (err instanceof ApiError && err.details) setErrors(err.details)
        else setError(err instanceof ApiError ? err.message : 'Something went wrong.')
        setData({ ...query, total: 0, items: [] })
      })
  }, [query])

  return (
    <section className="card shadow-sm mb-4">
      <div className="card-body">
        <h2 className="h5">Category spending</h2>
        <form className="row g-2 align-items-end mb-3" onSubmit={(e) => { e.preventDefault(); setQuery(range) }}>
          {(['from', 'to'] as const).map((k) => (
            <div className="col-auto" key={k}>
              <label htmlFor={`cat-${k}`} className="form-label small mb-1">{k === 'from' ? 'From' : 'To'}</label>
              <input
                id={`cat-${k}`}
                type="date"
                className={`form-control form-control-sm ${errors[k] ? 'is-invalid' : ''}`}
                value={range[k]}
                onChange={(e) => setRange({ ...range, [k]: e.target.value })}
              />
              {errors[k] && <div className="invalid-feedback">{errors[k]}</div>}
            </div>
          ))}
          <div className="col-auto">
            <button type="submit" className="btn btn-primary btn-sm" disabled={!data}>Show</button>
          </div>
        </form>

        {error && <div className="alert alert-danger">{error}</div>}
        {!data && <div className="spinner-border" role="status" aria-label="Loading" />}
        {data && data.items.length === 0 && !error && <p className="text-muted mb-0">No spending in this period</p>}
        {data && data.items.length > 0 && (
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-end">Amount</th>
                <th style={{ width: '40%' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((i) => (
                <tr key={i.accountId}>
                  <td>
                    {i.name} {i.archived && <span className="text-muted small">(archived)</span>}
                  </td>
                  <td className="text-end font-monospace">{formatTHB(i.total)}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" role="presentation" style={{ height: '0.5rem' }}>
                        <div className="progress-bar" style={{ width: `${i.percent ?? 0}%` }} />
                      </div>
                      <span className="small font-monospace">{(i.percent ?? 0).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total spending</th>
                <th className="text-end font-monospace">{formatTHB(data.total)}</th>
                <th />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </section>
  )
}

interface MonthRow {
  income: number
  expense: number
  net: number
}
interface MonthlyReport {
  fromMonth: string
  toMonth: string
  items: (MonthRow & { month: string })[]
  total: MonthRow
}

const monthLabel = (m: string) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })

// F-16 FR-27: income / expense / net per month; the server picks the default 6 months (D-14).
function MonthlyReportSection() {
  const [range, setRange] = useState({ fromMonth: '', toMonth: '' })
  const [query, setQuery] = useState('')
  const [data, setData] = useState<MonthlyReport | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    api<MonthlyReport>(`/reports/monthly${query}`)
      .then((res) => {
        setData(res)
        setErrors({})
        setRange({ fromMonth: res.fromMonth, toMonth: res.toMonth })
      })
      .catch((err) => {
        if (err instanceof ApiError && err.details) setErrors(err.details)
        else setError(err instanceof ApiError ? err.message : 'Something went wrong.')
      })
  }, [query])

  const money = (v: number) => <span className={v < 0 ? 'text-danger' : undefined}>{v < 0 ? `−${formatTHB(-v)}` : formatTHB(v)}</span>

  return (
    <section className="card shadow-sm mb-4">
      <div className="card-body">
        <h2 className="h5">Monthly report</h2>
        <form
          className="row g-2 align-items-end mb-3"
          onSubmit={(e) => {
            e.preventDefault()
            setQuery(`?fromMonth=${range.fromMonth}&toMonth=${range.toMonth}`)
          }}
        >
          {(['fromMonth', 'toMonth'] as const).map((k) => (
            <div className="col-auto" key={k}>
              <label htmlFor={`mon-${k}`} className="form-label small mb-1">{k === 'fromMonth' ? 'From month' : 'To month'}</label>
              <input
                id={`mon-${k}`}
                type="month"
                className={`form-control form-control-sm ${errors[k] ? 'is-invalid' : ''}`}
                value={range[k]}
                onChange={(e) => setRange({ ...range, [k]: e.target.value })}
              />
              {errors[k] && <div className="invalid-feedback">{errors[k]}</div>}
            </div>
          ))}
          <div className="col-auto">
            <button type="submit" className="btn btn-primary btn-sm" disabled={!data && !error && Object.keys(errors).length === 0}>Show</button>
          </div>
        </form>

        {error && <div className="alert alert-danger">{error}</div>}
        {!data && !error && <div className="spinner-border" role="status" aria-label="Loading" />}
        {data && (
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Month</th>
                <th className="text-end">Income</th>
                <th className="text-end">Expense</th>
                <th className="text-end">Net</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((i) => (
                <tr key={i.month}>
                  <td>{monthLabel(i.month)}</td>
                  <td className="text-end font-monospace">{money(i.income)}</td>
                  <td className="text-end font-monospace">{money(i.expense)}</td>
                  <td className="text-end font-monospace">{money(i.net)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th>Total</th>
                <th className="text-end font-monospace">{money(data.total.income)}</th>
                <th className="text-end font-monospace">{money(data.total.expense)}</th>
                <th className="text-end font-monospace">{money(data.total.net)}</th>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </section>
  )
}

export default function ReportsPage() {
  return (
    <>
      <h1 className="h4 mb-3">Reports</h1>
      <CategorySpending />
      <MonthlyReportSection />
    </>
  )
}
