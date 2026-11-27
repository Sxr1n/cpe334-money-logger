import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import { formatDisplayDate, formatTHB, formLabel, type TxnView } from '../format'

interface Page {
  items: TxnView[]
  page: number
  pageSize: number
  total: number
}

// F-12: filter names = API query parameters; the URL is the single source of truth (reload/back keep them).
const FILTER_KEYS = ['from', 'to', 'accountId', 'form', 'status', 'minAmount', 'maxAmount', 'q'] as const
type Draft = Record<(typeof FILTER_KEYS)[number], string>

const satangToThb = (v: string | null) => (v ? (Number(v) / 100).toFixed(2) : '')

function draftFromUrl(params: URLSearchParams): Draft {
  const d = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? ''])) as Draft
  d.minAmount = satangToThb(params.get('minAmount'))
  d.maxAmount = satangToThb(params.get('maxAmount'))
  return d
}

// Client checks mirror the server (F-12 §2); the server stays authoritative.
function toParams(d: Draft): { params?: URLSearchParams; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const params = new URLSearchParams()
  for (const k of ['from', 'to', 'accountId', 'form', 'status'] as const) if (d[k]) params.set(k, d[k])
  if (d.from && d.to && d.from > d.to) errors.from = 'Must not be after "to"'
  for (const k of ['minAmount', 'maxAmount'] as const) {
    const v = d[k].trim()
    if (!v) continue
    if (!/^\d+(\.\d{1,2})?$/.test(v)) errors[k] = 'Enter an amount of 0 or more, at most 2 decimals'
    else params.set(k, String(Math.round(Number(v) * 100)))
  }
  if (params.has('minAmount') && params.has('maxAmount') && Number(params.get('minAmount')) > Number(params.get('maxAmount'))) {
    errors.minAmount = 'Must not be more than Max'
  }
  if (d.q.trim().length > 100) errors.q = 'At most 100 characters'
  else if (d.q.trim()) params.set('q', d.q.trim())
  return Object.keys(errors).length ? { errors } : { params, errors }
}

export default function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1') || 1
  const filtered = FILTER_KEYS.some((k) => searchParams.has(k))

  const [draft, setDraft] = useState<Draft>(() => draftFromUrl(searchParams))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [accounts, setAccounts] = useState<{ id: number; name: string; archived: boolean }[]>([])
  const [data, setData] = useState<Page | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<{ items: { id: number; name: string; archived: boolean }[] }>('/accounts')
      .then((res) => setAccounts(res.items))
      .catch(() => setAccounts([]))
  }, [])

  useEffect(() => {
    setData(null)
    setError(null)
    api<Page>(`/transactions?${searchParams.toString()}`)
      .then(setData)
      .catch((err) => {
        if (err instanceof ApiError && err.details) setFieldErrors(err.details)
        else setError(err instanceof ApiError ? err.message : 'Something went wrong.')
        setData({ items: [], page: 1, pageSize: 50, total: 0 })
      })
  }, [searchParams])

  function apply(e: React.FormEvent) {
    e.preventDefault()
    const { params, errors } = toParams(draft)
    setFieldErrors(errors)
    if (params) setSearchParams(params) // new filters start again at page 1
  }

  function clear() {
    setDraft(draftFromUrl(new URLSearchParams()))
    setFieldErrors({})
    setSearchParams(new URLSearchParams())
  }

  function goTo(p: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(p))
    setSearchParams(next)
  }

  const field = (k: keyof Draft, label: string, input: React.ReactNode) => (
    <div className="col-6 col-md-3">
      <label htmlFor={`f-${k}`} className="form-label small mb-1">{label}</label>
      {input}
      {fieldErrors[k] && <div className="invalid-feedback d-block">{fieldErrors[k]}</div>}
    </div>
  )
  const text = (k: keyof Draft, type = 'text') => (
    <input
      id={`f-${k}`}
      type={type}
      className={`form-control form-control-sm ${fieldErrors[k] ? 'is-invalid' : ''}`}
      value={draft[k]}
      onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
    />
  )
  const select = (k: keyof Draft, options: [string, string][]) => (
    <select id={`f-${k}`} className="form-select form-select-sm" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}>
      {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
  )

  const lastPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <>
      <h1 className="h4 mb-3">History</h1>

      <form className="card card-body mb-3" onSubmit={apply}>
        <div className="row g-2">
          {field('from', 'From', text('from', 'date'))}
          {field('to', 'To', text('to', 'date'))}
          {field('accountId', 'Account', select('accountId', [['', 'Any'], ...accounts.map((a): [string, string] => [String(a.id), a.archived ? `${a.name} (archived)` : a.name])]))}
          {field('form', 'Form', select('form', [['', 'Any'], ['RECEIPT', 'Received'], ['PAYMENT', 'Paid']]))}
          {field('status', 'Status', select('status', [['', 'Any'], ['POSTED', 'Posted'], ['VOID', 'Void']]))}
          {field('minAmount', 'Min amount (THB)', text('minAmount'))}
          {field('maxAmount', 'Max amount (THB)', text('maxAmount'))}
          {field('q', 'Text', text('q'))}
        </div>
        <div className="d-flex gap-2 mt-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={!data}>Apply</button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clear}>Clear filters</button>
        </div>
      </form>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {!data && <div className="spinner-border" role="status" aria-label="Loading" />}

      {data && data.total === 0 && !error && (
        filtered ? (
          <p className="text-muted">
            No transactions match these filters.{' '}
            <button className="btn btn-link btn-sm p-0 align-baseline" onClick={clear}>Clear filters</button>
          </p>
        ) : (
          <p className="text-muted">No transactions yet — use Receive money or Make a payment in the menu.</p>
        )
      )}

      {data && data.total > 0 && (
        <>
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Form</th>
                <th>Account</th>
                <th>Note</th>
                <th className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/transactions/${t.id}`}>{formatDisplayDate(t.date)}</Link>
                    {t.status === 'VOID' && <span className="badge bg-secondary ms-2">Void</span>}
                  </td>
                  <td>{formLabel(t.form)}</td>
                  <td>{t.primaryAccount.name}</td>
                  <td>{t.note ?? ''}</td>
                  <td className="text-end font-monospace">
                    <span className={t.status === 'VOID' ? 'text-decoration-line-through text-muted' : ''}>
                      {formatTHB(t.total)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => goTo(page - 1)}>
              Previous
            </button>
            <span className="text-muted small">
              Page {data.page} of {lastPage} · {data.total} transactions
            </span>
            <button className="btn btn-outline-secondary btn-sm" disabled={page >= lastPage} onClick={() => goTo(page + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </>
  )
}
