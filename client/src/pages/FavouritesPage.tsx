import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api'
import { duplicateHref } from '../duplicate'
import { formatDisplayDate, formatTHB, formLabel, type TxnView } from '../format'

// F-13 FR-22: POSTED favourites, newest first (the server applies D-15).
export default function FavouritesPage() {
  const [items, setItems] = useState<TxnView[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<{ items: TxnView[] }>('/transactions?favorite=true')
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
  }, [])

  if (error) return <div className="alert alert-danger" role="alert">{error}</div>
  if (!items) return <div className="spinner-border" role="status" aria-label="Loading" />

  return (
    <>
      <h1 className="h4 mb-3">Favourites</h1>
      {items.length === 0 ? (
        <p className="text-muted">No favourites yet — open a transaction and click Add to favourites.</p>
      ) : (
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>Date</th>
              <th>Form</th>
              <th>Account</th>
              <th>Note</th>
              <th className="text-end">Total</th>
              <th>
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td>
                  <Link to={`/transactions/${t.id}`}>{formatDisplayDate(t.date)}</Link>
                </td>
                <td>{formLabel(t.form)}</td>
                <td>{t.primaryAccount.name}</td>
                <td>{t.note ?? ''}</td>
                <td className="text-end font-monospace">{formatTHB(t.total)}</td>
                <td className="text-end">
                  <Link to={duplicateHref(t)} className="btn btn-sm btn-outline-primary">
                    Duplicate
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
