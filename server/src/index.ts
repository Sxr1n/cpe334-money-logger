import 'dotenv/config'
import app from './app'

for (const name of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!process.env[name]) throw new Error(`${name} is not set`) // NFR-09: fail fast on missing config
}

const PORT = process.env.PORT ?? 4000

app.listen(PORT, () => {
  console.log(`Money Logger API listening on port ${PORT}`)
})
