import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api'
import { formatDisplayDate, formatTHB, formLabel, type TxnView } from '../format'

interface Page {
  items: TxnView[]
  page: number
  pageSize: number
  total: number
}

export default function HistoryPage() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<Page | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    api<Page>(`/transactions?page=${page}`)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
  }, [page])

  if (error) return <div className="alert alert-danger" role="alert">{error}</div>
  if (!data) return <div className="spinner-border" role="status" aria-label="Loading" />

  const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize))

  return (
    <>
      <h1 className="h4 mb-3">History</h1>
      {data.total === 0 ? (
        <p className="text-muted">No transactions yet — use Receive money or Make a payment in the menu.</p>
      ) : (
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
                  </td>
                  <td>{formLabel(t.form)}</td>
                  <td>{t.primaryAccount.name}</td>
                  <td>{t.note ?? ''}</td>
                  <td className="text-end font-monospace">{formatTHB(t.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span className="text-muted small">
              Page {data.page} of {lastPage} · {data.total} transactions
            </span>
            <button className="btn btn-outline-secondary btn-sm" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        </>
      )}
    </>
  )
}
