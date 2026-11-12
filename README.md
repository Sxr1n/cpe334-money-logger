# cpe334-money-logger

Personal Money and Expense Logging System — CPE334 group project (Theme 7).
Engineering documents are in `docs/` (SRS, features, traceability, sprint plan, System SDS, feature contracts).

## Stack
React 19 + Vite + TypeScript + Bootstrap (`client/`) · Express 5 + TypeScript + Prisma 7 (`server/`) · PostgreSQL 16 (docker compose) · Vitest + Supertest (server tests) · Playwright (`e2e/`).

## Requirements
Node.js 24 (tested with v24.19.0), npm, Docker Desktop.

## Local setup
```bash
docker compose up -d                       # PostgreSQL 16 on localhost:5434
cp server/.env.example server/.env         # then set JWT_SECRET and seed passwords
cd server && npm install                   # also runs prisma generate
npx prisma migrate deploy                  # apply migrations to the dev database
npx prisma generate                        # Prisma 7 does not regenerate the client after migrate
npx prisma db seed                         # alice, bob (USER) and admin (ADMIN); passwords from server/.env
npm run dev                                # API on http://localhost:4000
cd ../client && npm install && npm run dev # UI on http://localhost:5173 (proxies /api)
```

## Tests
```bash
docker exec money-logger-postgres psql -U postgres -c "CREATE DATABASE money_logger_test"   # once
cd server && npm test                      # unit + API-DB tests on TEST_DATABASE_URL (migrated automatically)
cd client && npm run build                 # type-check + production build
npm install && npx playwright install chromium   # once, at repo root
npx playwright test                        # E2E on the seeded dev database (starts server and client)
```

## Configuration
All settings come from environment variables; `server/.env.example` lists every variable. Never commit `.env` or real secrets.
