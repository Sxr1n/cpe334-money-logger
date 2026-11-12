import { useEffect, useState } from 'react'
import { api, ApiError } from '../api'
import { useAuth } from '../auth'

interface PlatformUser {
  id: number
  username: string
  displayName: string
  role: 'USER' | 'ADMIN'
  status: 'ACTIVE' | 'DISABLED'
  createdAt: string
}

const bangkokDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { timeZone: 'Asia/Bangkok', day: '2-digit', month: 'short', year: 'numeric' })

export default function UsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<PlatformUser[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)

  useEffect(() => {
    api<{ items: PlatformUser[] }>('/admin/users')
      .then((res) => setUsers(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
  }, [])

  async function setStatus(target: PlatformUser, status: PlatformUser['status']) {
    setPendingId(target.id)
    setError(null)
    try {
      const updated = await api<PlatformUser>(`/admin/users/${target.id}`, { method: 'PATCH', body: { status } })
      setUsers((list) => list?.map((u) => (u.id === updated.id ? updated : u)) ?? null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <>
      <h1 className="h4 mb-3">Users</h1>
      {error && (
        <div className="alert alert-danger alert-dismissible" role="alert">
          {error}
          <button type="button" className="btn-close" aria-label="Dismiss" onClick={() => setError(null)} />
        </div>
      )}
      {users === null && !error && <div className="spinner-border" role="status" aria-label="Loading" />}
      {users?.length === 0 && <p>No users.</p>}
      {users && users.length > 0 && (
        <table className="table align-middle">
          <thead>
            <tr>
              <th>Username</th>
              <th>Display name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.displayName}</td>
                <td>{u.role}</td>
                <td>
                  <span className={`badge ${u.status === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>{u.status}</span>
                </td>
                <td>{bangkokDate(u.createdAt)}</td>
                <td className="text-end">
                  {u.id !== me?.id && (
                    <button
                      className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                      disabled={pendingId === u.id}
                      onClick={() => setStatus(u, u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}
                    >
                      {pendingId === u.id && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" />}
                      {u.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
