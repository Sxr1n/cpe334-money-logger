import { useState } from 'react'
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth, type CurrentUser } from '../auth'

// Route guard + navigation bar for every logged-in screen. Hiding screens is usability only;
// the API enforces roles itself (SDS §5).
export default function Layout({ role }: { role: CurrentUser['role'] }) {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  if (loading) return <div className="spinner-border m-5" role="status" aria-label="Loading" />
  if (!user) return <Navigate to="/login" replace state={{ notice: 'Please log in.' }} />

  async function onLogout() {
    setPending(true)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <nav className="navbar navbar-expand bg-body-tertiary border-bottom">
        <div className="container">
          <span className="navbar-brand">Money Logger</span>
          {user.role === 'USER' && (
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <Link to="/accounts" className="nav-link">
                  Accounts
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/receive" className="nav-link">
                  Receive money
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/pay" className="nav-link">
                  Make a payment
                </Link>
              </li>
            </ul>
          )}
          <div className="d-flex align-items-center gap-2">
            <span>{user.displayName}</span>
            <span className="badge text-bg-secondary">{user.role}</span>
            <button className="btn btn-outline-secondary btn-sm" onClick={onLogout} disabled={pending}>
              Log out
            </button>
          </div>
        </div>
      </nav>
      <main className="container py-4">
        {user.role === role ? <Outlet /> : <p className="alert alert-warning">Not allowed.</p>}
      </main>
    </>
  )
}
