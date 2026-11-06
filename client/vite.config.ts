import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Same-origin /api in dev, matching production where Express serves the built app (SD-05).
  server: { proxy: { '/api': 'http://localhost:4000' } },
})
