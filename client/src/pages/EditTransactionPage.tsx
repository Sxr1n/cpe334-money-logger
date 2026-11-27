import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import type { TxnView } from '../format'
import PayPage from './PayPage'
import ReceiveMoneyPage from './ReceiveMoneyPage'

// F-11: load an own POSTED transaction and render the matching Pay or Receive form in edit mode.
export default function EditTransactionPage() {
  const { id } = useParams()
  const [txn, setTxn] = useState<TxnView | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<TxnView>(`/transactions/${id}`)
      .then((t) => {
        if (t.status === 'VOID') setError('This transaction is void.')
        else setTxn(t)
      })
      .catch((err) => setError(err instanceof ApiError && err.status === 404 ? 'Not found.' : 'Something went wrong.'))
  }, [id])

  if (error) return <div className="alert alert-warning" role="alert">{error}</div>
  if (!txn) return <div className="spinner-border" role="status" aria-label="Loading" />

  return txn.form === 'PAYMENT' ? <PayPage editTxn={txn} /> : <ReceiveMoneyPage editTxn={txn} />
}
