import { useEffect, useState } from 'react'
import { api, ApiError } from '../api'

export type AccountType = 'CASH' | 'LOAN_TAKEN' | 'LOAN_GIVEN' | 'INCOME' | 'EXPENSE'

export interface AccountItem {
  id: number
  name: string
  type: AccountType
  balance: number
  openingBalance: number | null
  openingDate: string | null
}

const TYPE_SECTIONS: { type: AccountType; title: string }[] = [
  { type: 'CASH', title: 'Cash & Bank Accounts' },
  { type: 'LOAN_TAKEN', title: 'Loans Taken & Credit Cards' },
  { type: 'LOAN_GIVEN', title: 'Loans Given' },
  { type: 'INCOME', title: 'Income Categories' },
  { type: 'EXPENSE', title: 'Expense Categories' },
]

function formatTHB(satang: number) {
  return `฿${(satang / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function getTodayInBangkok() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null)

  // Form fields
  const [amountStr, setAmountStr] = useState<string>('')
  const [dateStr, setDateStr] = useState<string>(getTodayInBangkok())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  function loadAccounts() {
    api<{ items: AccountItem[] }>('/accounts')
      .then((res) => setAccounts(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
  }

  function startSetOpening(acc: AccountItem) {
    setEditingAccount(acc)
    setAmountStr('')
    setDateStr(getTodayInBangkok())
    setFieldErrors({})
    setFormError(null)
  }

  function cancelOpening() {
    setEditingAccount(null)
    setFieldErrors({})
    setFormError(null)
  }

  async function handleSaveOpening(e: React.FormEvent) {
    e.preventDefault()
    if (!editingAccount) return

    const errors: Record<string, string> = {}
    const trimmedAmount = amountStr.trim()
    const num = Number(trimmedAmount)

    if (trimmedAmount === '' || isNaN(num) || num < 0) {
      errors.amount = 'Enter an amount of 0 or more'
    } else {
      const parts = trimmedAmount.split('.')
      if (parts[1] && parts[1].length > 2) {
        errors.amount = 'At most 2 decimal places'
      } else {
        const satang = Math.round(num * 100)
        if (satang > 99999999999) {
          errors.amount = 'Too large'
        }
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      errors.date = 'Enter a valid date'
    } else {
      const [y, m, d] = dateStr.split('-').map(Number)
      const testDate = new Date(Date.UTC(y, m - 1, d))
      if (testDate.getUTCFullYear() !== y || testDate.getUTCMonth() !== m - 1 || testDate.getUTCDate() !== d) {
        errors.date = 'Enter a valid date'
      }
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const satang = Math.round(num * 100)
    setPending(true)
    setFormError(null)

    try {
      const updated = await api<AccountItem>(`/accounts/${editingAccount.id}/opening-balance`, {
        method: 'PUT',
        body: { amount: satang, date: dateStr },
      })
      setAccounts((prev) => prev?.map((a) => (a.id === updated.id ? updated : a)) ?? null)
      setEditingAccount(null)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Accounts</h1>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible" role="alert">
          {error}
          <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => setError(null)} />
        </div>
      )}

      {accounts === null && !error && <div className="spinner-border" role="status" aria-label="Loading" />}
      {accounts?.length === 0 && <p>No accounts.</p>}

      {editingAccount && (
        <div className="card mb-4 border-primary">
          <div className="card-header bg-primary text-white">
            Set opening balance for <strong>{editingAccount.name}</strong> ({editingAccount.type})
          </div>
          <div className="card-body">
            {formError && <div className="alert alert-danger py-2">{formError}</div>}
            <form onSubmit={handleSaveOpening}>
              <div className="row g-3">
                <div className="col-md-5">
                  <label htmlFor="openingAmount" className="form-label">
                    Amount (THB)
                  </label>
                  <input
                    id="openingAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    className={`form-control ${fieldErrors.amount ? 'is-invalid' : ''}`}
                    placeholder="0.00"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    disabled={pending}
                  />
                  {fieldErrors.amount && <div className="invalid-feedback">{fieldErrors.amount}</div>}
                </div>
                <div className="col-md-5">
                  <label htmlFor="openingDate" className="form-label">
                    Date
                  </label>
                  <input
                    id="openingDate"
                    type="date"
                    className={`form-control ${fieldErrors.date ? 'is-invalid' : ''}`}
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    disabled={pending}
                  />
                  {fieldErrors.date && <div className="invalid-feedback">{fieldErrors.date}</div>}
                </div>
                <div className="col-md-2 d-flex align-items-end gap-2">
                  <button type="submit" className="btn btn-primary" disabled={pending}>
                    {pending ? <span className="spinner-border spinner-border-sm" role="status" /> : 'Save'}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={cancelOpening} disabled={pending}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {accounts && accounts.length > 0 && (
        <div className="row g-4">
          {TYPE_SECTIONS.map(({ type, title }) => {
            const list = accounts.filter((a) => a.type === type)
            if (list.length === 0) return null
            const isCashOrLoan = type === 'CASH' || type === 'LOAN_TAKEN' || type === 'LOAN_GIVEN'

            return (
              <div key={type} className="col-12">
                <div className="card shadow-sm">
                  <div className="card-header bg-light">
                    <h2 className="h6 mb-0 text-secondary">{title}</h2>
                  </div>
                  <div className="card-body p-0">
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Account Name</th>
                          {isCashOrLoan && <th className="text-end">Balance</th>}
                          {isCashOrLoan && <th className="text-end">Opening Balance</th>}
                          <th className="text-end" style={{ width: '180px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((acc) => (
                          <tr key={acc.id}>
                            <td>
                              <strong>{acc.name}</strong>
                            </td>
                            {isCashOrLoan && (
                              <td className="text-end font-monospace">
                                {formatTHB(acc.balance)}
                              </td>
                            )}
                            {isCashOrLoan && (
                              <td className="text-end text-muted small">
                                {acc.openingBalance !== null && acc.openingDate
                                  ? `Opening ${formatTHB(acc.openingBalance)} on ${formatDisplayDate(acc.openingDate)}`
                                  : '—'}
                              </td>
                            )}
                            <td className="text-end">
                              {isCashOrLoan && acc.openingBalance === null && (
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => startSetOpening(acc)}
                                  disabled={editingAccount?.id === acc.id}
                                >
                                  Set opening balance
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
