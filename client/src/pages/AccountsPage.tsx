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
  periodTotal: number | null // F-06: this month's total for INCOME/EXPENSE, null otherwise
  archived: boolean // F-07
}

const TYPE_LABELS: Record<AccountType, string> = {
  CASH: 'Cash',
  LOAN_TAKEN: 'Debt (credit card or loan taken)',
  LOAN_GIVEN: 'Owed to me (loan given)',
  INCOME: 'Income',
  EXPENSE: 'Expense',
}

const errorText = (err: unknown) => (err instanceof ApiError ? err.message : 'Something went wrong.')

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

  // F-07: new account form
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<AccountType>('CASH')
  const [newErrors, setNewErrors] = useState<Record<string, string>>({})
  const [newPending, setNewPending] = useState(false)

  // F-07: rename / archive per row
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({})
  const [rowPending, setRowPending] = useState<number | null>(null)

  const replaceAccount = (updated: AccountItem) =>
    setAccounts((prev) => prev?.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)) ?? null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (name.length < 1 || name.length > 50) {
      setNewErrors({ name: 'Enter a name of 1 to 50 characters' })
      return
    }
    setNewPending(true)
    setNewErrors({})
    try {
      const created = await api<AccountItem>('/accounts', { method: 'POST', body: { name, type: newType } })
      setAccounts((prev) => [...(prev ?? []), { ...created, periodTotal: null }].sort((a, b) => a.name.localeCompare(b.name)))
      setShowNew(false)
      setNewName('')
    } catch (err) {
      setNewErrors(err instanceof ApiError && err.details ? err.details : { form: errorText(err) })
    } finally {
      setNewPending(false)
    }
  }

  async function patchAccount(acc: AccountItem, body: { name?: string; archived?: boolean }) {
    setRowPending(acc.id)
    setRowErrors((prev) => ({ ...prev, [acc.id]: '' }))
    try {
      replaceAccount(await api<AccountItem>(`/accounts/${acc.id}`, { method: 'PATCH', body }))
      if (body.name !== undefined) setRenamingId(null)
    } catch (err) {
      const details = err instanceof ApiError ? err.details : undefined
      setRowErrors((prev) => ({ ...prev, [acc.id]: details?.name ?? details?.archived ?? errorText(err) }))
    } finally {
      setRowPending(null)
    }
  }

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
        {!showNew && (
          <button className="btn btn-primary btn-sm" onClick={() => { setShowNew(true); setNewErrors({}) }}>
            New account
          </button>
        )}
      </div>

      {showNew && (
        <div className="card mb-4 border-primary">
          <div className="card-header">New account</div>
          <div className="card-body">
            {newErrors.form && <div className="alert alert-danger py-2">{newErrors.form}</div>}
            <form onSubmit={handleCreate} className="row g-3 align-items-start">
              <div className="col-md-5">
                <label htmlFor="newName" className="form-label">Name</label>
                <input
                  id="newName"
                  className={`form-control ${newErrors.name ? 'is-invalid' : ''}`}
                  value={newName}
                  maxLength={60}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={newPending}
                />
                {newErrors.name && <div className="invalid-feedback">{newErrors.name}</div>}
              </div>
              <div className="col-md-4">
                <label htmlFor="newType" className="form-label">Type</label>
                <select
                  id="newType"
                  className={`form-select ${newErrors.type ? 'is-invalid' : ''}`}
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as AccountType)}
                  disabled={newPending}
                >
                  {TYPE_SECTIONS.map(({ type }) => (
                    <option key={type} value={type}>{TYPE_LABELS[type]}</option>
                  ))}
                </select>
                {newErrors.type && <div className="invalid-feedback">{newErrors.type}</div>}
              </div>
              <div className="col-md-3 d-flex gap-2" style={{ paddingTop: '2rem' }}>
                <button type="submit" className="btn btn-primary" disabled={newPending}>
                  {newPending ? <span className="spinner-border spinner-border-sm" role="status" /> : 'Create'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowNew(false)} disabled={newPending}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            const list = accounts.filter((a) => a.type === type && !a.archived)
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
                          {!isCashOrLoan && <th className="text-end">This month</th>}
                          <th className="text-end" style={{ width: '340px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((acc) => (
                          <tr key={acc.id}>
                            <td>
                              {renamingId === acc.id ? (
                                <form
                                  className="d-flex gap-2"
                                  onSubmit={(e) => { e.preventDefault(); patchAccount(acc, { name: renameValue }) }}
                                >
                                  <input
                                    aria-label={`New name for ${acc.name}`}
                                    className="form-control form-control-sm"
                                    value={renameValue}
                                    maxLength={60}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    disabled={rowPending === acc.id}
                                  />
                                  <button type="submit" className="btn btn-sm btn-primary" disabled={rowPending === acc.id}>Save name</button>
                                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setRenamingId(null)}>
                                    Cancel
                                  </button>
                                </form>
                              ) : (
                                <strong>{acc.name}</strong>
                              )}
                              {rowErrors[acc.id] && <div className="text-danger small mt-1">{rowErrors[acc.id]}</div>}
                            </td>
                            {isCashOrLoan && (
                              <td className="text-end font-monospace">
                                {formatTHB(acc.balance)}
                              </td>
                            )}
                            {!isCashOrLoan && (
                              <td className="text-end font-monospace">{formatTHB(acc.periodTotal ?? 0)}</td>
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
                              <div className="btn-group btn-group-sm ms-1">
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => { setRenamingId(acc.id); setRenameValue(acc.name) }}
                                  disabled={rowPending === acc.id}
                                >
                                  Rename
                                </button>
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => patchAccount(acc, { archived: true })}
                                  disabled={rowPending === acc.id}
                                >
                                  Archive
                                </button>
                              </div>
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

      {accounts && accounts.some((a) => a.archived) && (
        <details className="card shadow-sm mt-4">
          <summary className="card-header bg-light">Archived ({accounts.filter((a) => a.archived).length})</summary>
          <table className="table align-middle mb-0">
            <tbody>
              {accounts.filter((a) => a.archived).map((acc) => (
                <tr key={acc.id}>
                  <td>
                    <strong>{acc.name}</strong> <span className="text-muted small">{TYPE_LABELS[acc.type]}</span>
                    {rowErrors[acc.id] && <div className="text-danger small mt-1">{rowErrors[acc.id]}</div>}
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => patchAccount(acc, { archived: false })}
                      disabled={rowPending === acc.id}
                    >
                      Unarchive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </>
  )
}
