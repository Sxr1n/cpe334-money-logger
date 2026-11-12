import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'

function Footer() {
  const [version, setVersion] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((body: { version: string }) => setVersion(body.version))
      .catch(() => setVersion('unavailable'))
  }, [])
  return <footer className="container text-muted small py-3">API version: {version ?? '...'}</footer>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout role="USER" />}>
            {/* F-06 replaces this placeholder with the Overview screen. */}
            <Route path="/overview" element={<h1 className="h4">Overview</h1>} />
          </Route>
          <Route element={<Layout role="ADMIN" />}>
            {/* F-02 replaces this placeholder with the Users screen. */}
            <Route path="/admin/users" element={<h1 className="h4">Users</h1>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  )
}
