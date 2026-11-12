import { useEffect, useState } from 'react'

export default function App() {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((body: { version: string }) => setVersion(body.version))
      .catch(() => setVersion('unavailable'))
  }, [])

  return (
    <main className="container py-4">
      <h1>Money Logger</h1>
      <p className="text-muted">API version: {version ?? '...'}</p>
    </main>
  )
}
