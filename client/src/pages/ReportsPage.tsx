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

export default function ReportsPage() {
  return (
    <>
      <h1 className="h4 mb-3">Reports</h1>
      <CategorySpending />
    </>
  )
}
