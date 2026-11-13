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

export default function ReceiveMoneyPage() {
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

      const cash = res.items.filter((a) => a.type === 'CASH')
      const income = res.items.filter((a) => a.type === 'INCOME')

      if (cash.length > 0) setPrimaryAccountId(cash[0].id)
      if (income.length > 0) {
        setLines([{ id: 'line-1', accountId: income[0].id, amountStr: '' }])
      }
    } catch (err) {
      setFetchError(err instanceof ApiError ? err.message : 'Failed to load accounts.')
    } finally {
      setLoading(false)
    }
  }

  const cashAccounts = accounts?.filter((a) => a.type === 'CASH') ?? []
  const incomeAccounts = accounts?.filter((a) => a.type === 'INCOME') ?? []

  function addLine() {
    const defaultAccId = incomeAccounts[0]?.id ?? 0
    setLines((prev) => [...prev, { id: `line-${Date.now()}-${Math.random()}`, accountId: defaultAccId, amountStr: '' }])
  }

  function removeLine(id: string) {
    if (lines.length <= 1) return
    setLines((prev) => prev.filter((l) => l.id !== id))
  }

  function updateLine(id: string, field: 'accountId' | 'amountStr', value: any) {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: field === 'accountId' ? Number(value) : value } : l)),
    )
  }

  // Calculate live totals
  const totalParse = parseSatang(totalStr)
  const targetTotalSatang = totalParse.satang ?? 0

  let linesSumSatang = 0
  let allLinesHaveValidSatang = lines.length > 0
  lines.forEach((l) => {
    const p = parseSatang(l.amountStr)
    if (p.satang !== null && p.satang > 0) {
      linesSumSatang += p.satang
    } else {
      allLinesHaveValidSatang = false
    }
  })

  const lineAccountIds = lines.map((l) => l.accountId)
  const hasDuplicateLineAccounts = new Set(lineAccountIds).size !== lineAccountIds.length
  const todayBangkok = getTodayInBangkok()
  const isFutureDate = dateStr > todayBangkok
  const isBefore2000 = dateStr < '2000-01-01'

  const isTotalValid = totalParse.satang !== null && totalParse.satang > 0
  const isMatch = isTotalValid && allLinesHaveValidSatang && linesSumSatang === targetTotalSatang

  const isSaveDisabled =
    !isMatch || hasDuplicateLineAccounts || isFutureDate || isBefore2000 || primaryAccountId === 0 || lines.length === 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setFormError(null)

    const errors: Record<string, string> = {}

    if (!isTotalValid) {
      errors.total = totalParse.error ?? 'Required'
    }
    if (isFutureDate) {
      errors.date = 'Date cannot be in the future'
    } else if (isBefore2000) {
      errors.date = 'Date cannot be earlier than 2000-01-01'
    }
    if (hasDuplicateLineAccounts) {
      errors.lines = 'Choose a different account for each line'
    }
    if (!isMatch) {
      errors.lines = 'Lines must add up to the total'
    }

    lines.forEach((l, idx) => {
      const p = parseSatang(l.amountStr)
      if (p.error) {
        errors[`lines[${idx}].amount`] = p.error
      }
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setPending(true)
    try {
      const payload = {
        form: 'RECEIPT',
        primaryAccountId,
        date: dateStr,
        total: targetTotalSatang,
        note: noteStr.trim() ? noteStr.trim() : null,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          amount: parseSatang(l.amountStr).satang!,
        })),
      }

      const res = await api<any>('/transactions', {
        method: 'POST',
        body: payload,
      })

      setSuccessTxn(res)
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message)
        if (err.details) {
          setFieldErrors(err.details)
        }
      } else {
        setFormError('Failed to save transaction.')
      }
    } finally {
      setPending(false)
    }
  }

  function resetForm() {
    setSuccessTxn(null)
    setTotalStr('')
    setNoteStr('')
    setDateStr(getTodayInBangkok())
    setFieldErrors({})
    setFormError(null)
    if (incomeAccounts.length > 0) {
      setLines([{ id: `line-${Date.now()}`, accountId: incomeAccounts[0].id, amountStr: '' }])
    }
  }

  if (loading) return <div className="spinner-border m-5" role="status" aria-label="Loading" />
  if (fetchError) return <div className="alert alert-danger">{fetchError}</div>

  if (incomeAccounts.length === 0) {
    return (
      <div className="container py-4">
        <h1 className="h4 mb-3">Receive money</h1>
        <div className="alert alert-info">No income accounts available.</div>
      </div>
    )
  }

  return (
    <div className="container py-4" style={{ maxWidth: '720px' }}>
      <h1 className="h4 mb-3">Receive money</h1>

      {successTxn && (
        <div className="alert alert-success" role="alert">
          <h5 className="alert-heading">Saved</h5>
          <p className="mb-1">
            Recorded <strong>{formatTHB(successTxn.total)}</strong> into{' '}
            <strong>{successTxn.primaryAccount?.name}</strong>.
          </p>
          <div className="mt-3 d-flex gap-2">
            <button className="btn btn-sm btn-outline-success" onClick={resetForm}>
              Receive another payment
            </button>
            <Link to="/accounts" className="btn btn-sm btn-secondary">
              Go to Accounts
            </Link>
          </div>
        </div>
      )}

      {formError && <div className="alert alert-danger">{formError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* Receiving Account */}
        <div className="mb-3">
          <label htmlFor="primaryAccountSelect" className="form-label fw-bold">
            Receiving account
          </label>
          <select
            id="primaryAccountSelect"
            className={`form-select ${fieldErrors.primaryAccountId ? 'is-invalid' : ''}`}
            value={primaryAccountId}
            onChange={(e) => setPrimaryAccountId(Number(e.target.value))}
            disabled={pending}
          >
            {cashAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({formatTHB(acc.balance)})
              </option>
            ))}
          </select>
          {fieldErrors.primaryAccountId && <div className="invalid-feedback">{fieldErrors.primaryAccountId}</div>}
        </div>

        {/* Date & Total */}
        <div className="row g-3 mb-3">
          <div className="col-sm-6">
            <label htmlFor="dateInput" className="form-label fw-bold">
              Date
            </label>
            <input
              id="dateInput"
              type="date"
              className={`form-control ${fieldErrors.date ? 'is-invalid' : ''}`}
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              disabled={pending}
            />
            {fieldErrors.date && <div className="invalid-feedback">{fieldErrors.date}</div>}
          </div>

          <div className="col-sm-6">
            <label htmlFor="totalInput" className="form-label fw-bold">
              Total (THB)
            </label>
            <input
              id="totalInput"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className={`form-control ${fieldErrors.total ? 'is-invalid' : ''}`}
              value={totalStr}
              onChange={(e) => setTotalStr(e.target.value)}
              disabled={pending}
            />
            {fieldErrors.total && <div className="invalid-feedback">{fieldErrors.total}</div>}
          </div>
        </div>

        {/* Note */}
        <div className="mb-3">
          <label htmlFor="noteInput" className="form-label">
            Note (optional)
          </label>
          <input
            id="noteInput"
            type="text"
            maxLength={200}
            className={`form-control ${fieldErrors.note ? 'is-invalid' : ''}`}
            value={noteStr}
            onChange={(e) => setNoteStr(e.target.value)}
            disabled={pending}
          />
          {fieldErrors.note && <div className="invalid-feedback">{fieldErrors.note}</div>}
        </div>

        {/* Lines Table */}
        <div className="card mb-3">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span className="fw-bold">Income Lines</span>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addLine} disabled={pending}>
              + Add line
            </button>
          </div>
          <div className="card-body p-0">
            <table className="table table-borderless mb-0">
              <thead>
                <tr className="border-bottom">
                  <th style={{ width: '55%' }}>Category (Income)</th>
                  <th style={{ width: '35%' }}>Amount (THB)</th>
                  <th style={{ width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => (
                  <tr key={l.id}>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={l.accountId}
                        onChange={(e) => updateLine(l.id, 'accountId', e.target.value)}
                        disabled={pending}
                      >
                        {incomeAccounts.map((inc) => (
                          <option key={inc.id} value={inc.id}>
                            {inc.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        className={`form-control form-control-sm ${
                          fieldErrors[`lines[${idx}].amount`] ? 'is-invalid' : ''
                        }`}
                        value={l.amountStr}
                        onChange={(e) => updateLine(l.id, 'amountStr', e.target.value)}
                        disabled={pending}
                      />
                      {fieldErrors[`lines[${idx}].amount`] && (
                        <div className="invalid-feedback">{fieldErrors[`lines[${idx}].amount`]}</div>
                      )}
                    </td>
                    <td className="text-end">
                      {lines.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeLine(l.id)}
                          disabled={pending}
                          title="Remove line"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fieldErrors.lines && (
            <div className="card-footer bg-transparent border-top-0 pt-0 text-danger small">
              {fieldErrors.lines}
            </div>
          )}
        </div>

        {/* Live Footer */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center border-top pt-3">
          <div className="mb-2 mb-sm-0">
            <span className="fw-semibold">
              Lines total {formatTHB(linesSumSatang)} of {formatTHB(targetTotalSatang)}
            </span>
            {!isMatch && (
              <span className="text-danger ms-2 small d-block d-sm-inline">
                Lines must add up to the total
              </span>
            )}
            {hasDuplicateLineAccounts && (
              <span className="text-danger ms-2 small d-block">
                Choose a different account for each line
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary px-4"
            disabled={isSaveDisabled || pending}
          >
            {pending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
