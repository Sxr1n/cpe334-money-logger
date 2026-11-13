import { useEffect, useState } from 'react'
import { api, ApiError } from '../api'
import { formatTHB } from '../format'

interface Group {
  items: { id: number; name: string; balance: number }[]
  total: number
}

interface Overview {
  cash: Group
  loanTaken: Group
  loanGiven: Group
  month: { from: string; to: string; income: number; expense: number; net: number }
}

function BalanceCard({ title, group, testId, empty }: { title: string; group: Group; testId: string; empty: string }) {
  return (
    <div className="col-md-4">
      <div className="card h-100 shadow-sm">
        <div className="card-header bg-light">
          <h2 className="h6 mb-0">{title}</h2>
        </div>
        <ul className="list-group list-group-flush">
          {group.items.length === 0 && <li className="list-group-item text-muted">{empty}</li>}
          {group.items.map((a) => (
            <li key={a.id} className="list-group-item d-flex justify-content-between">
              <span>{a.name}</span>
              <span className="font-monospace">{formatTHB(a.balance)}</span>
            </li>
          ))}
          <li className="list-group-item d-flex justify-content-between fw-bold">
            <span>Total</span>
            <span className="font-monospace" data-testid={testId}>
              {formatTHB(group.total)}
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Overview>('/overview')
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
  }, [])

  if (error) return <div className="alert alert-danger" role="alert">{error}</div>
  if (!data) return <div className="spinner-border" role="status" aria-label="Loading" />

  const monthName = new Date(`${data.month.from}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })

  return (
    <>
      <h1 className="h4 mb-3">Overview</h1>
      <div className="row g-3 mb-4">
        <BalanceCard title="Cash" group={data.cash} testId="cash-total" empty="No cash accounts." />
        <BalanceCard title="Debts (credit cards and loans taken)" group={data.loanTaken} testId="debt-total" empty="No debts." />
        <BalanceCard title="Owed to me" group={data.loanGiven} testId="loan-given-total" empty="Nobody owes you money." />
      </div>
      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h2 className="h6 mb-0">This month — {monthName}</h2>
        </div>
        <div className="card-body">
          <dl className="row mb-0">
            <dt className="col-6">Income</dt>
            <dd className="col-6 text-end font-monospace" data-testid="month-income">{formatTHB(data.month.income)}</dd>
            <dt className="col-6">Expense</dt>
            <dd className="col-6 text-end font-monospace" data-testid="month-expense">{formatTHB(data.month.expense)}</dd>
            <dt className="col-6">Net</dt>
            <dd className="col-6 text-end font-monospace fw-bold mb-0" data-testid="month-net">{formatTHB(data.month.net)}</dd>
          </dl>
          <p className="text-muted small mb-0 mt-2">Transfers, loans, repayments and opening balances are not counted.</p>
        </div>
      </div>
    </>
  )
}
