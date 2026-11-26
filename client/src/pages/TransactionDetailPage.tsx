import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import { duplicateHref } from '../duplicate'
import { formatDisplayDate, formatTHB, formLabel, type TxnView } from '../format'

export default function TransactionDetailPage() {
  const { id } = useParams()
  const [txn, setTxn] = useState<TxnView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [favPending, setFavPending] = useState(false)
  const [favError, setFavError] = useState<string | null>(null)

  async function toggleFavorite() {
    if (!txn) return
    setFavPending(true)
    setFavError(null)
    try {
      setTxn(await api<TxnView>(`/transactions/${txn.id}/favorite`, { method: 'PUT', body: { favorite: !txn.isFavorite } }))
    } catch (err) {
      setFavError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setFavPending(false)
    }
  }

  useEffect(() => {
    api<TxnView>(`/transactions/${id}`)
      .then(setTxn)
      .catch((err) => setError(err instanceof ApiError && err.status === 404 ? 'Not found.' : 'Something went wrong.'))
  }, [id])

  if (error) return <div className="alert alert-warning" role="alert">{error}</div>
  if (!txn) return <div className="spinner-border" role="status" aria-label="Loading" />

  return (
    <>
      <Link to="/transactions" className="small">
        ← Back to history
      </Link>
      <div className="d-flex align-items-center gap-3 my-3">
        <h1 className="h4 mb-0">
          {formLabel(txn.form)} {formatTHB(txn.total)}
        </h1>
        {txn.status !== 'VOID' && (
          <button
            className={`btn btn-sm ${txn.isFavorite ? 'btn-warning' : 'btn-outline-secondary'}`}
            aria-pressed={txn.isFavorite}
            onClick={toggleFavorite}
            disabled={favPending}
          >
            {txn.isFavorite ? '★ Favourite' : '☆ Add to favourites'}
          </button>
        )}
        {/* F-14: POSTED and VOID can be duplicated (D-15) */}
        <Link to={duplicateHref(txn)} className="btn btn-sm btn-outline-primary">
          Duplicate
        </Link>
      </div>
      {favError && <div className="alert alert-danger py-2">{favError}</div>}
      <dl className="row">
        <dt className="col-sm-3">Date</dt>
        <dd className="col-sm-9">{formatDisplayDate(txn.date)}</dd>
        <dt className="col-sm-3">{txn.form === 'RECEIPT' ? 'Received into' : 'Paid from'}</dt>
        <dd className="col-sm-9">{txn.primaryAccount.name}</dd>
        <dt className="col-sm-3">Note</dt>
        <dd className="col-sm-9">{txn.note ?? '—'}</dd>
      </dl>
      <table className="table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Type</th>
            <th className="text-end">Amount</th>
          </tr>
        </thead>
        <tbody>
          {txn.lines.map((l) => (
            <tr key={l.id}>
              <td>{l.account.name}</td>
              <td>{l.account.type}</td>
              <td className="text-end font-monospace">{formatTHB(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
