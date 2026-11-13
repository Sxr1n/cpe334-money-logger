import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import { formatDisplayDate, formatTHB, formLabel, type TxnView } from '../format'

export default function TransactionDetailPage() {
  const { id } = useParams()
  const [txn, setTxn] = useState<TxnView | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      <h1 className="h4 my-3">
        {formLabel(txn.form)} {formatTHB(txn.total)}
      </h1>
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
