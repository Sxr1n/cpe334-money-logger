import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { homePath, useAuth } from '../auth'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (user) return <Navigate to={homePath(user.role)} replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!username.trim() || !password) return
    setPending(true)
    setError(null)
    try {
      const me = await login(username, password)
      navigate(homePath(me.role), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
      setPassword('')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="container py-5" style={{ maxWidth: 420 }}>
      <h1 className="h3 mb-4">Money Logger</h1>
      {notice && !error && <div className="alert alert-info">{notice}</div>}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            id="username"
            className={`form-control ${touched && !username.trim() ? 'is-invalid' : ''}`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <div className="invalid-feedback">Required</div>
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            className={`form-control ${touched && !password ? 'is-invalid' : ''}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <div className="invalid-feedback">Required</div>
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={pending}>
          {pending && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          Log in
        </button>
      </form>
    </main>
  )
}
