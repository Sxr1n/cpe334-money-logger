import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'

export interface CurrentUser {
  id: number
  username: string
  displayName: string
  role: 'USER' | 'ADMIN'
}

interface AuthState {
  user: CurrentUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<CurrentUser>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<CurrentUser>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(username: string, password: string) {
    const me = await api<CurrentUser>('/auth/login', { method: 'POST', body: { username, password } })
    setUser(me)
    return me
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const homePath = (role: CurrentUser['role']) => (role === 'ADMIN' ? '/admin/users' : '/overview')
