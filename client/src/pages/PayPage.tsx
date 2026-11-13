import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api'

export interface AccountItem {
  id: number
  name: string
  type: string
  balance: number
}

interface FormLine {
  id: string
  accountId: number
  amountStr: string
}

function getTodayInBangkok() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())
}

function formatTHB(satang: number) {
  return `฿${(satang / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function parseSatang(val: string): { satang: number | null; error?: string } {
  const trimmed = val.trim()
  if (!trimmed) return { satang: null, error: 'Required' }
  const num = Number(trimmed)
  if (Number.isNaN(num)) return { satang: null, error: 'Must be a valid number' }
  if (num <= 0) return { satang: null, error: 'Must be more than 0' }

  // Check decimals
  const parts = trimmed.split('.')
  if (parts.length > 2 || (parts[1] && parts[1].length > 2)) {
    return { satang: null, error: 'At most 2 decimal places' }
  }

  const satang = Math.round(num * 100)
  if (satang > 99999999999) {
    return { satang: null, error: 'Amount exceeds maximum allowed' }
  }

  return { satang }
}

export default function PayPage() {
  const [accounts, setAccounts] = useState<AccountItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Form inputs
  const [primaryAccountId, setPrimaryAccountId] = useState<number>(0)
  const [dateStr, setDateStr] = useState<string>(getTodayInBangkok())
  const [totalStr, setTotalStr] = useState<string>('')
  const [noteStr, setNoteStr] = useState<string>('')
  const [lines, setLines] = useState<FormLine[]>([])

  // Errors & submission state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [successTxn, setSuccessTxn] = useState<any | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    try {
      setLoading(true)
      const res = await api<{ items: AccountItem[] }>('/accounts')
      setAccounts(res.items)

      const paying = res.items.filter((a) => a.type === 'CASH' || a.type === 'LOAN_TAKEN')
      const expense = res.items.filter((a) => a.type === 'EXPENSE')
      const loanTaken = res.items.filter((a) => a.type === 'LOAN_TAKEN')

      if (paying.length > 0) setPrimaryAccountId(paying[0].id)
      const defaultLineAcc = expense[0]?.id ?? loanTaken[0]?.id ?? 0
      if (defaultLineAcc) {
        setLines([{ id: 'line-1', accountId: defaultLineAcc, amountStr: '' }])
      }
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.message : 'Failed to load accounts.')
    } finally {
      setLoading(false)
    }
  }

  const payingAccounts = accounts?.filter((a) => a.type === 'CASH' || a.type === 'LOAN_TAKEN') ?? []
  const expenseAccounts = accounts?.filter((a) => a.type === 'EXPENSE') ?? []
  const loanTakenAccounts = accounts?.filter((a) => a.type === 'LOAN_TAKEN') ?? []

  function addLine() {
    const defaultAccId = expenseAccounts[0]?.id ?? loanTakenAccounts[0]?.id ?? 0
    setLines((prev) => [...prev, { id: `line-${Date.now()}-${Math.random()}`, accountId: defaultAccId, amountStr: '' }])
  }

  function removeLine(id: string) {
    if (lines.length <= 1) return
    setLines((prev) => prev.filter((l) => l.id !== id))
  }

  function updateLine(id: string, updates: Partial<FormLine>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        return { ...l, ...updates }
      }),
    )
  }

  // Calculations for live footer
  const totalParsed = parseSatang(totalStr)
  const totalSatang = totalParsed.satang ?? 0

  let linesSatangSum = 0
  let allLinesHaveAmounts = lines.length > 0
  for (const line of lines) {
    const p = parseSatang(line.amountStr)
    if (p.satang !== null) {
      linesSatangSum += p.satang
    } else {
      allLinesHaveAmounts = false
    }
  }

  const isSumMismatch =
    totalStr.trim() !== '' &&
    allLinesHaveAmounts &&
    totalSatang > 0 &&
    linesSatangSum > 0 &&
    totalSatang !== linesSatangSum

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setFieldErrors({})

    const errors: Record<string, string> = {}

    if (!primaryAccountId) {
      errors.primaryAccountId = 'Please select a paying account'
    }

    if (!dateStr.trim()) {
      errors.date = 'Date is required'
    }

    if (totalParsed.error) {
      errors.total = totalParsed.error
    }

    if (lines.length === 0) {
      errors.lines = 'At least one line is required'
    }

    const payloadLines: { accountId: number; amount: number }[] = []
    lines.forEach((l, idx) => {
      const p = parseSatang(l.amountStr)
      if (p.error) {
        errors[`lines[${idx}].amount`] = p.error
      } else if (p.satang !== null) {
        payloadLines.push({ accountId: l.accountId, amount: p.satang })
      }
      if (l.accountId === primaryAccountId) {
        errors[`lines[${idx}].accountId`] = 'Line account cannot be the same as paying account'
      }
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    if (totalSatang !== linesSatangSum) {
      setFieldErrors({ lines: 'Lines must add up to the total' })
      return
    }

    const payload = {
      form: 'PAYMENT' as const,
      primaryAccountId,
      date: dateStr.trim(),
      total: totalSatang,
      note: noteStr.trim() ? noteStr.trim() : null,
      lines: payloadLines,
    }

    setPending(true)
    try {
      const created = await api<any>('/transactions', {
        method: 'POST',
        body: payload,
      })
      setSuccessTxn(created)
      // Reload accounts to update balances
      loadAccounts()
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message)
        if (err.details) {
          setFieldErrors(err.details)
        }
      } else {
        setFormError('Failed to record payment.')
      }
    } finally {
      setPending(false)
    }
  }

  function handleReset() {
    setSuccessTxn(null)
    setTotalStr('')
    setNoteStr('')
    setDateStr(getTodayInBangkok())
    setFieldErrors({})
    setFormError(null)
    const expense = accounts?.filter((a) => a.type === 'EXPENSE') ?? []
    const loanTaken = accounts?.filter((a) => a.type === 'LOAN_TAKEN') ?? []
    const defaultLineAcc = expense[0]?.id ?? loanTaken[0]?.id ?? 0
    setLines([{ id: `line-${Date.now()}`, accountId: defaultLineAcc, amountStr: '' }])
  }

  if (loading) {
    return (
      <div className="container py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading accounts...</span>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger" role="alert">
          {fetchError}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4" style={{ maxWidth: 800 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Make a payment</h2>
        <Link to="/accounts" className="btn btn-outline-secondary btn-sm">
          Back to Accounts
        </Link>
      </div>

      {successTxn && (
        <div className="alert alert-success" role="alert">
          <h5 className="alert-heading">Payment recorded successfully!</h5>
          <p className="mb-2">
            Total: <strong>{formatTHB(successTxn.total)}</strong> from{' '}
            <strong>{successTxn.primaryAccount?.name}</strong> on {successTxn.date}.
          </p>
          <ul className="mb-3">
            {successTxn.lines?.map((l: any) => (
              <li key={l.id}>
                {l.account?.name}: {formatTHB(l.amount)}
              </li>
            ))}
          </ul>
          <button className="btn btn-success btn-sm me-2" onClick={handleReset}>
            Make another payment
          </button>
          <Link to="/accounts" className="btn btn-outline-success btn-sm">
            View Accounts
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="alert alert-danger" role="alert">
            {formError}
          </div>
        )}

        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-light">
            <strong>Payment Details</strong>
          </div>
          <div className="card-body">
            {/* Paying Account */}
            <div className="mb-3">
              <label htmlFor="primaryAccountId" className="form-label">
                Paying Account (CASH or LOAN_TAKEN)
              </label>
              <select
                id="primaryAccountId"
                className={`form-select ${fieldErrors.primaryAccountId ? 'is-invalid' : ''}`}
                value={primaryAccountId}
                onChange={(e) => setPrimaryAccountId(Number(e.target.value))}
              >
                {payingAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type === 'CASH' ? 'Cash/Bank' : 'Credit/Debt'}) — Balance: {formatTHB(a.balance)}
                  </option>
                ))}
              </select>
              {fieldErrors.primaryAccountId && (
                <div className="invalid-feedback">{fieldErrors.primaryAccountId}</div>
              )}
            </div>

            <div className="row">
              {/* Date */}
              <div className="col-md-6 mb-3">
                <label htmlFor="date" className="form-label">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  className={`form-control ${fieldErrors.date ? 'is-invalid' : ''}`}
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                />
                {fieldErrors.date && <div className="invalid-feedback">{fieldErrors.date}</div>}
              </div>

              {/* Total Amount */}
              <div className="col-md-6 mb-3">
                <label htmlFor="total" className="form-label">
                  Total Amount (฿)
                </label>
                <input
                  type="text"
                  id="total"
                  placeholder="0.00"
                  className={`form-control ${fieldErrors.total ? 'is-invalid' : ''}`}
                  value={totalStr}
                  onChange={(e) => setTotalStr(e.target.value)}
                />
                {fieldErrors.total && <div className="invalid-feedback">{fieldErrors.total}</div>}
              </div>
            </div>

            {/* Note */}
            <div className="mb-3">
              <label htmlFor="note" className="form-label">
                Note <span className="text-muted">(optional, max 200 characters)</span>
              </label>
              <input
                type="text"
                id="note"
                maxLength={200}
                placeholder="e.g. Dinner with team, monthly groceries"
                className={`form-control ${fieldErrors.note ? 'is-invalid' : ''}`}
                value={noteStr}
                onChange={(e) => setNoteStr(e.target.value)}
              />
              {fieldErrors.note && <div className="invalid-feedback">{fieldErrors.note}</div>}
            </div>
          </div>
        </div>

        {/* Lines Section */}
        <div className="card mb-4 shadow-sm">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <strong>Spending / Repayment Lines</strong>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addLine}>
              + Add Line
            </button>
          </div>
          <div className="card-body">
            {fieldErrors.lines && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                {fieldErrors.lines}
              </div>
            )}

            {lines.map((line, idx) => {
              const lineError = fieldErrors[`lines[${idx}].amount`] || fieldErrors[`lines[${idx}].accountId`]
              return (
                <div key={line.id} className="row g-2 align-items-start mb-3 border-bottom pb-3">
                  <div className="col-md-7">
                    <label className="form-label small text-muted">Category / Debt account</label>
                    <select
                      className={`form-select ${lineError ? 'is-invalid' : ''}`}
                      value={line.accountId}
                      onChange={(e) => updateLine(line.id, { accountId: Number(e.target.value) })}
                    >
                      <optgroup label="Spending">
                        {expenseAccounts.map((a) => (
                          <option key={a.id} value={a.id} disabled={a.id === primaryAccountId}>
                            {a.name} (Expense)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Repay a debt">
                        {loanTakenAccounts.map((a) => (
                          <option key={a.id} value={a.id} disabled={a.id === primaryAccountId}>
                            {a.name} (Outstanding debt: {formatTHB(a.balance)})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small text-muted">Amount (฿)</label>
                    <input
                      type="text"
                      placeholder="0.00"
                      className={`form-control ${fieldErrors[`lines[${idx}].amount`] ? 'is-invalid' : ''}`}
                      value={line.amountStr}
                      onChange={(e) => updateLine(line.id, { amountStr: e.target.value })}
                    />
                    {fieldErrors[`lines[${idx}].amount`] && (
                      <div className="invalid-feedback">{fieldErrors[`lines[${idx}].amount`]}</div>
                    )}
                  </div>

                  <div className="col-md-1 d-flex align-items-end pt-4">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 1}
                      title="Remove line"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Live comparison footer */}
            <div className="d-flex justify-content-between align-items-center mt-3 p-3 bg-light rounded">
              <div>
                <span className="text-muted me-2">Total:</span>
                <strong>{totalSatang > 0 ? formatTHB(totalSatang) : '฿0.00'}</strong>
                <span className="mx-2">|</span>
                <span className="text-muted me-2">Sum of lines:</span>
                <strong>{linesSatangSum > 0 ? formatTHB(linesSatangSum) : '฿0.00'}</strong>
              </div>
              <div>
                {isSumMismatch && (
                  <span className="badge bg-warning text-dark me-2">
                    Lines must add up to the total
                  </span>
                )}
                {!isSumMismatch && totalSatang > 0 && totalSatang === linesSatangSum && (
                  <span className="badge bg-success me-2">✓ Balanced</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <Link to="/accounts" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={pending || isSumMismatch}
          >
            {pending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Saving...
              </>
            ) : (
              'Save Payment'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
