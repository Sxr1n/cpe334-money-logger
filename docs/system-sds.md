# System-Level Software Design Specification — Personal Money and Expense Logging System

| Item | Value |
|---|---|
| Sources | `docs/srs.md` v0.2, `docs/features.md` v0.1, `docs/traceability.md` v0.1 |
| Document version | 0.4 |
| Scope | Whole product (Sprints 1–3). Feature contracts in `docs/sprints/sprint-N/` give exact endpoints, fields and screens. |

---

## 1. Architecture

### 1.1 Stack and why
| Layer | Technology | Why |
|---|---|---|
| UI | React 19 + Vite + TypeScript + Bootstrap 5 | Same stack as our Labs 1–4 (TokTickIT); typed forms; Bootstrap gives consistent validation/alert styles without custom CSS. |
| API / application | Node.js + Express 5 + TypeScript | Same as Labs 1–4; Express 5 forwards async errors to the error handler. |
| Data access | Prisma 7 (with `@prisma/adapter-pg`) | Typed queries, versioned SQL migrations, seed script; interactive transactions for atomic posting. |
| Database | PostgreSQL 16 | Real transactions, row locks (`SELECT … FOR UPDATE`), CHECK constraints, BIGINT money. |
| Auth | bcryptjs + JWT in an httpOnly cookie, user status and token version checked on every request | Reuses the tested TokTickIT design; supports immediate revocation (logout, disable). |
| Tests | Vitest (unit), Vitest + Supertest against a real PostgreSQL test DB (API-DB), Playwright (E2E) | Matches the three test levels required by the course. |
| Packaging | Docker (one app image) + docker compose (app + PostgreSQL) | Required by Lab 5; same compose file shape locally and on the VM. |

### 1.2 Components
Modular monolith: one Express process serves both the API (`/api/*`) and, in production, the built React files. Three logical layers, one app container plus one database container.

```mermaid
flowchart LR
  B["Browser<br/>React SPA"] -- "HTTPS JSON /api/*<br/>httpOnly session cookie" --> R
  subgraph APP["App container (Node LTS, Express 5)"]
    R["Routes<br/>parse + validate shape"] --> M["Middleware<br/>requireAuth · requireRole"]
    M --> S["Services<br/>business rules BR-01..17"]
    S --> L["Ledger core (pure functions)<br/>form/type rules, balance effects"]
    S --> P["Prisma client"]
    ST["Static files<br/>(built React)"]
  end
  P -- "SQL over TCP 5432" --> DB[("PostgreSQL 16<br/>constraints, row locks")]
```

| Component | Responsibility | Must not |
|---|---|---|
| React SPA | Screens, navigation by role, client-side validation for usability (NFR-10), money formatting | Decide permissions or compute balances that are trusted |
| Routes | Map HTTP to services; parse body/query; return the error shape (§4.2) | Contain business rules |
| Middleware | `requireAuth`: verify cookie JWT, load user, reject DISABLED or stale token (401). `requireRole(role)`: 403 on wrong role | Read identity or role from body/query/headers other than the cookie |
| Services | All business rules; ownership filters (`userId = session user`); open the DB transaction and post balances | Trust any `userId` from the client |
| Ledger core | Pure functions: allowed account types per form (BR-03), balance deltas (SRS §4.3), line-sum check (BR-01). Unit-tested without a DB | Do I/O |
| PostgreSQL | Durable storage; constraints as a backstop (CHECK, FK, unique) | — |

### 1.3 Where rules are enforced
| Rule | UI | Service (authoritative) | Database backstop |
|---|---|---|---|
| BR-01 lines = total, each > 0 | Live line-total check before submit | Ledger core + service | `CHECK (amount > 0)`, `CHECK (total > 0)` |
| BR-02 amount format/range | Input parser (2 decimals) | Service | BIGINT column |
| BR-03 account types per form | Account pickers filtered by type | Ledger core | — |
| BR-04 ownership, active, no repeated account | Pickers show own active accounts | Service | `UNIQUE (txn_id, account_id)` on lines |
| BR-05 atomic balance update | — | One Prisma interactive transaction with row locks | Transaction rollback |
| BR-07 / BR-08 no negative CASH, no over-repayment | Shows current balance | Service, after locking the accounts | `CHECK (balance >= 0)` on accounts |
| BR-11 / BR-12 ownership and role | Hides other role's menus (usability only) | Middleware + `userId` filter in every query | FK `user_id` on every financial row |

### 1.4 Repository layout
```
client/          React app (Vite)              → npm project
server/          Express API, prisma/ (schema, migrations, seed.ts), tests/
e2e/             Playwright specs (root package.json runs them)
docker-compose.yml   local PostgreSQL (dev/test); Lab 5 adds the app service
Dockerfile           multi-stage: build client + server → one runtime image (Lab 5)
.env.example         every variable, no real values
```

---

## 2. Data design

### 2.1 Money, dates and time
- **Money** is stored as integer **satang** in `BIGINT` columns (D-01). The API sends and receives integer satang (e.g. `120000` = ฿1,200.00). The UI converts a typed string such as `"1200.50"` to satang by string parsing (no floating point) and formats with `Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })`.
- **Transaction date** is a calendar date (`DATE`, no time; A-02). "Today", the future-date check (BR-09) and month boundaries use **Asia/Bangkok**.
- **Timestamps** (`created_at`, `updated_at`) are `timestamptz` stored in UTC and shown in Asia/Bangkok.

### 2.2 Entities
```mermaid
erDiagram
  USER ||--o{ ACCOUNT : owns
  USER ||--o{ TXN : owns
  ACCOUNT ||--o{ TXN : "is primary of"
  TXN ||--|{ TXN_LINE : "has 1..n"
  ACCOUNT ||--o{ TXN_LINE : "is allocated in"

  USER {
    int id PK
    varchar username UK "stored lower-case"
    varchar display_name
    varchar password_hash "bcrypt cost 10+"
    enum role "USER | ADMIN"
    enum status "ACTIVE | DISABLED"
    int token_version "incremented on logout/disable"
    timestamptz created_at
  }
  ACCOUNT {
    int id PK
    int user_id FK
    varchar name "1-50"
    enum type "CASH | LOAN_TAKEN | LOAN_GIVEN | INCOME | EXPENSE"
    bigint balance "satang; CASH/LOAN only, 0 for INCOME/EXPENSE"
    bigint opening_balance "nullable; satang"
    date opening_date "nullable"
    timestamptz archived_at "nullable (Sprint 2)"
    timestamptz created_at
  }
  TXN {
    int id PK
    int user_id FK
    enum form "PAYMENT | RECEIPT"
    int primary_account_id FK
    date txn_date
    bigint total "satang > 0"
    varchar note "nullable"
    enum status "POSTED | VOID (Sprint 2)"
    boolean is_favorite "Sprint 3"
    timestamptz created_at
    timestamptz updated_at
  }
  TXN_LINE {
    int id PK
    int txn_id FK
    int account_id FK
    bigint amount "satang > 0"
  }
```

The model is named `Txn` (table `transactions`) to avoid confusion with database transactions in code.

### 2.3 Constraints and ownership
| Table | Constraint | Supports |
|---|---|---|
| users | `UNIQUE (username)`; `password_hash NOT NULL` | FR-01, NFR-03 |
| accounts | FK `user_id → users`; `UNIQUE (user_id, type, lower(name))` (raw SQL index in the migration); `CHECK (balance >= 0)`; `CHECK (opening_balance IS NULL OR opening_balance >= 0)`; `CHECK (type IN ('CASH','LOAN_TAKEN','LOAN_GIVEN') OR (opening_balance IS NULL AND balance = 0))` | BR-07, BR-08, BR-10, BR-14 |
| transactions | FK `user_id`, FK `primary_account_id`; `CHECK (total > 0)`; index `(user_id, txn_date DESC, id DESC)` | BR-01, FR-18, NFR-08 |
| transaction_lines | FK `txn_id ON DELETE CASCADE`, FK `account_id`; `CHECK (amount > 0)`; `UNIQUE (txn_id, account_id)`; index `(account_id)` | BR-01, BR-04, FR-25 |

**Ownership.** Every financial row carries or reaches a `user_id`. Services always query with `where: { id, userId: session.userId }`; a row of another user is therefore "not found" and returns **404** (BR-11). Accounts used in a transaction are loaded the same way, so another user's account also gives 404 and nothing is written. Administrators have no route into these tables (§5).

### 2.4 Balances (stored, posted atomically)
- `accounts.balance` holds the current balance of CASH, LOAN_TAKEN and LOAN_GIVEN accounts: opening balance + effects of every POSTED transaction (SRS §4.3).
- INCOME and EXPENSE totals are **not stored**; they are summed from `transaction_lines` of POSTED transactions in the requested period (FR-25–27). Only INCOME and EXPENSE lines enter these sums, so transfers, loans, repayments and opening balances can never be counted (BR-06).
- **Posting algorithm** (one Prisma interactive transaction, BR-05):
  1. Lock the primary and line accounts of the session user with `SELECT … FOR UPDATE`, in ascending id order to avoid deadlocks; any missing id → 404.
  2. Validate BR-01–BR-04, BR-09 with the ledger core.
  3. Compute deltas with the ledger core; reject if any CASH balance would go below 0 (BR-07) or a repayment exceeds the outstanding amount (BR-08) → 422.
  4. Insert the transaction and its lines, apply the deltas, commit. Any error rolls back everything (NFR-06).
- **Opening balance** is two fields on the account (`opening_balance`, `opening_date`). Setting it adds the amount to `balance` in the same DB transaction; it creates no transaction row, so it cannot appear in income/expense (BR-06, BR-10). Changing it (F-08, Sprint 2) adds `new − old`.
- **Edit and void** (Sprint 2) reverse the old deltas and apply the new ones in one DB transaction.
- NFR-05 check (Sprint 2): a test posts 1,000 random valid transactions and compares every stored balance with a recomputation from opening balances and lines.

### 2.5 Migrations and seed
- Schema changes only through `prisma migrate dev` (creates a versioned SQL folder committed to Git). Raw SQL (CHECK constraints, `lower(name)` index) is added to the generated migration file.
- Deployment and fresh setup use `prisma migrate deploy`; no manual database edits (NFR-11).
- `prisma/seed.ts` is idempotent (upsert by username / account name) and creates synthetic data only:

| Username | Role | Accounts |
|---|---|---|
| `alice` | USER | Bank (CASH), Credit Card (LOAN_TAKEN), Salary (INCOME), Dining, Groceries, Electricity, Telecom (EXPENSE) |
| `bob` | USER | same set as alice |
| `admin` | ADMIN | none |

Seed passwords come from `SEED_USER_PASSWORD` and `SEED_ADMIN_PASSWORD` (env), so no password is committed. Opening balances are not seeded; the Sprint 1 journey sets them.

- Test database: a separate database (`TEST_DATABASE_URL`); API-DB tests apply migrations once and truncate tables between test files.

---

## 3. UI design

### 3.1 Screens and navigation
| Screen | Role | Sprint | Purpose |
|---|---|---|---|
| Login | anyone | 1 | Username + password; generic error on failure |
| Overview (home for USER) | USER | 1 | CASH balances, outstanding LOAN_TAKEN (card debt), LOAN_GIVEN, this month's income/expense/net |
| Accounts | USER | 1 (list, opening balance) / 2 (create, rename, archive) | Accounts grouped by type with balance or period total |
| Receive money | USER | 1 | RECEIPT form with dynamic allocation lines |
| Make a payment | USER | 1 | PAYMENT form with dynamic allocation lines |
| History + transaction detail | USER | 1 (list, detail) / 2 (filters, edit, void) / 3 (favourite, duplicate) | Newest first, 50 per page |
| Reports | USER | 3 | Category spending, monthly report |
| Users (home for ADMIN) | ADMIN | 1 | List users, disable/enable |

The top navigation bar shows only the current role's screens, the display name and Logout. Visiting another role's screen shows a "Not allowed" page; the API still returns 403 regardless (hiding a link is not authorization).

### 3.2 Shared UI behaviour
- **Loading:** a spinner in the content area; submit buttons are disabled while a request is pending (prevents double posting).
- **Empty:** a short message plus the next action (e.g. "No transactions yet — Receive money").
- **Validation:** field-level messages under each input (Bootstrap `is-invalid`), shown from client checks and from the server's `error.details`; entered values are kept (NFR-10). The transaction form shows "Lines total ฿x of ฿y" live and blocks submit while they differ.
- **Errors:** `401` → redirect to Login with "Session expired"; `403` → "Not allowed" page; `404` → "Not found"; `422` → field messages; other errors → a dismissible alert with the server message, never a stack trace.
- **Money and dates:** THB with two decimals; dates as `DD MMM YYYY` in Asia/Bangkok.

---

## 4. API conventions

### 4.1 Style
- REST over JSON under `/api`. Plural nouns: `/api/accounts`, `/api/transactions`, `/api/admin/users`.
- Identity is never a parameter: there is no `userId` in any user-facing path or body. The server uses the session user.
- Money fields are integer satang; dates are `YYYY-MM-DD`; timestamps ISO-8601 UTC.
- Lists: `?page=1&pageSize=50` → `{ "items": [...], "page": 1, "pageSize": 50, "total": 123 }`.
- `GET /api/health` (no auth) returns `{ "status": "ok", "version": "<APP_VERSION>" }` for deployment checks.

### 4.2 Errors
All errors use one shape, with no stack traces or SQL text:
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Lines must add up to the total.", "details": { "lines": "sum 110000 ≠ total 120000" } } }
```

| Status | Code | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed JSON or wrong field types |
| 401 | `UNAUTHENTICATED` / `INVALID_CREDENTIALS` | No/invalid/expired/revoked session; failed login (same message for every login failure) |
| 403 | `FORBIDDEN` | Wrong role (BR-12); admin disabling self (BR-13) |
| 404 | `NOT_FOUND` | Record does not exist **or** belongs to another user (BR-11) |
| 409 | `CONFLICT` | Duplicate account name (BR-14), opening balance already set |
| 422 | `VALIDATION_FAILED` / `RULE_VIOLATION` | Field validation (BR-02, BR-09) / business rule (BR-01, BR-03, BR-04, BR-07, BR-08, BR-10) |
| 500 | `INTERNAL` | Unexpected error (logged on the server without request bodies or passwords) |

### 4.3 Endpoint groups (details in feature contracts)
| Group | Endpoints | Role | Sprint |
|---|---|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | any (login: none) | 1 |
| Admin | `GET /api/admin/users`, `PATCH /api/admin/users/:id` (status) | ADMIN | 1 |
| Accounts | `GET /api/accounts`, `PUT /api/accounts/:id/opening-balance` (S1); `POST /api/accounts`, `PATCH /api/accounts/:id` (S2) | USER | 1–2 |
| Transactions | `POST /api/transactions`, `GET /api/transactions`, `GET /api/transactions/:id` (S1); edit/void/filters (S2); favourite (S3) | USER | 1–3 |
| Overview and reports | `GET /api/overview`, `GET /api/summary?from&to` (S1); `GET /api/reports/categories`, `GET /api/reports/monthly` (S3) | USER | 1, 3 |

---

## 5. Roles and permissions

Routers are mounted with middleware, so every new endpoint in a group inherits the check: `/api/admin/*` → `requireAuth, requireRole('ADMIN')`; all financial routers → `requireAuth, requireRole('USER')`.

| Operation | USER | ADMIN | No session |
|---|---|---|---|
| Login | ✔ | ✔ | ✔ |
| Logout, current user | ✔ own | ✔ own | 401 |
| List users, disable/enable user | 403 | ✔ any user except disabling self (403) | 401 |
| Accounts: list, set opening balance, create, rename, archive | ✔ own only (other's → 404) | 403 | 401 |
| Transactions: create, list, view, edit, void, favourite, duplicate | ✔ own only; every referenced account must be own (other's → 404) | 403 | 401 |
| Overview, summary, category spending, reports | ✔ own data only | 403 | 401 |

Verification (SR-01): each protected endpoint has three API-DB tests — no session (401), wrong role (403) and another user's record (404, where a record id applies).

---

## 6. Authentication and session

| Aspect | Design |
|---|---|
| Credentials | Username (stored lower-case) + password. Accounts come from the seed; no self-registration. |
| Password storage | bcryptjs hash, cost 10 (NFR-03 minimum; same as TokTickIT). The hash is never returned by the API or logged. |
| Login | `POST /api/auth/login`. Unknown username, wrong password and DISABLED user all return the same `401 INVALID_CREDENTIALS` (FR-01, BR-13). On success the server signs a JWT `{ sub: userId, tv: tokenVersion }` with `JWT_SECRET`, `expiresIn` 8 h, and sets it as cookie `ml_session`: `httpOnly`, `SameSite=Lax`, `Secure` in production, `Path=/`, max-age 8 h. |
| Each request | `requireAuth` verifies signature and expiry, loads the user, and rejects with 401 if the user is missing, `status = DISABLED`, or `tv ≠ token_version`. It puts `{ id, role }` on the request; nothing else is trusted. |
| Current user | `GET /api/auth/me` → `{ id, username, displayName, role }`. |
| Logout | `POST /api/auth/logout` increments `token_version` and clears the cookie, so the old token is rejected even if replayed (FR-02, NFR-04). Effect: all sessions of that user end. |
| Disable | Admin `PATCH /api/admin/users/:id { status: "DISABLED" }` sets the status and increments `token_version`; the user's next request gets 401 (BR-13, D-08). An admin cannot disable their own account (403). |
| Expiry | 8 hours from login (NFR-04); no refresh token. Tested by signing a token with a past expiry. |
| CSRF | Same-origin app with `SameSite=Lax` cookie and JSON-only state-changing endpoints (`Content-Type: application/json` required). |

---

## 7. Configuration, secrets and deployment

### 7.1 Environment variables
| Variable | Used by | Example in `.env.example` | Secret |
|---|---|---|---|
| `DATABASE_URL` | server, Prisma | `postgresql://postgres:postgres@localhost:5434/money_logger` | yes in production |
| `TEST_DATABASE_URL` | API-DB tests | `postgresql://postgres:postgres@localhost:5434/money_logger_test` | no (local only) |
| `JWT_SECRET` | server | `change-me-to-a-long-random-string` | yes |
| `PORT` | server | `4000` | no |
| `NODE_ENV` | server (default for cookie `Secure`) | `development` | no |
| `COOKIE_SECURE` | server: overrides the cookie `Secure` flag (`false` while a deployment has no HTTPS) | `false` | no |
| `CLIENT_DIST` | server: folder of the built React app to serve (set in the Docker image) | unset locally | no |
| `SEED_ON_START` | Docker entrypoint: run the seed after migrations; the seed only creates missing users | `false` | no |
| `APP_VERSION` | `/api/health`, UI footer | `dev` (set to the release tag at build) | no |
| `SEED_USER_PASSWORD`, `SEED_ADMIN_PASSWORD` | seed script | `change-me` | yes |
| `POSTGRES_PASSWORD` | compose database service | `postgres` (local only) | yes in production |

Rules (NFR-09): only `.env.example` is committed (`.env` is git-ignored); the server refuses to start if `JWT_SECRET` or `DATABASE_URL` is missing; no secret is placed in client code (the SPA uses relative `/api` URLs, so it needs no environment values); the Lab 5 CI adds a secret scan.

### 7.2 Local setup (NFR-11)
`docker compose up -d` (PostgreSQL 16 on host port 5434, named volume) → `npm ci` in `server/` and `client/` → `npx prisma migrate deploy && npx prisma db seed` → `npm run dev` in both (Vite proxies `/api` to port 4000). Exact commands are kept in the README and checked from a fresh clone per release.

### 7.3 GCP deployment (Lab 5)
Chosen design (SD-03, v0.4): the Lab 5 reference stack — **Cloud Run** service `money-logger` and migration job `money-logger-migrate`, **Cloud SQL for PostgreSQL 16** `money-logger-pg`, **Artifact Registry** `money-logger`, **Secret Manager** for `DATABASE_URL`, `JWT_SECRET` and seed passwords, and **GitHub Actions with Workload Identity Federation** (no key files). Full details, environment table and release procedure: `docs/labs/lab05/deployment.md`.

| Concern | Design |
|---|---|
| Image | The multi-stage `Dockerfile` (one image, Express serves the built React app); tagged with the full commit SHA and deployed by digest; `APP_VERSION` = that SHA. |
| Durability (NFR-07) | All data lives in Cloud SQL; the container keeps nothing (sessions are signed cookies checked against `users.token_version`). |
| Migrations | Cloud Run job runs `prisma migrate deploy && prisma db seed` before the service is updated; migrations stay additive so rollback works; the seed only creates missing users. |
| Secrets | Generated by `deploy/deploy.sh` into Secret Manager; the runtime service account reads only its secrets; GitHub stores only non-secret environment variables. |
| Pipeline | PR → CI (required checks, ruleset `protect-main`) → reviewed merge to `main` → **Deploy demo**: CI again, build + push, migrate, update service, smoke test, summary. Rollback = run the workflow with an earlier commit SHA. |
| Cost | min instances 0, db-f1-micro, storage auto-increase off, alerts-only budget; pause Cloud SQL between labs. |

## 8. Design decisions
| ID | Decision | Alternatives considered | Status |
|---|---|---|---|
| SD-01 | Store CASH/LOAN balances in `accounts.balance`, posted in the same DB transaction with row locks; INCOME/EXPENSE totals computed from lines per period | Compute every balance on read (simpler edits, but conflicts with BR-05/NFR-05 wording and harder BR-07 concurrency) | Accepted (team, 2026-11-07) |
| SD-02 | Opening balance as `opening_balance` + `opening_date` fields on the account | Special OPENING transaction (needs a third form and extra exclusions everywhere) | Accepted (team, 2026-11-07) |
| SD-03 | Deploy on Cloud Run + Cloud SQL + Secret Manager with GitHub Actions and Workload Identity Federation (Lab 5 reference stack and starter kit) | One Compute Engine VM with docker compose (original v0.1 choice: own pipeline, TLS, secrets and rollback to build) | Accepted (team, 2026-11-14), revised from VM in v0.4 |
| SD-04 | Session = JWT cookie with `token_version`; logout and disable increment it | Server-side session table (per-device logout, more code and new tests) | Accepted (team, 2026-11-07) |
| SD-05 | One app image: Express serves the built React app (same origin) | Two images (client + server) | Accepted (implemented in Lab 5 L5-S1) |
| SD-06 | Validation failures → 422; another user's record → 404; wrong role → 403 | 400 for all validation (TokTickIT) | Accepted (follows D-02 and `docs/traceability.md`) |

Open (decided in D1-S4): whether Sprint 1's `POST /api/transactions` already accepts line types of Sprint 2 features (transfer, loan lines) or rejects them until F-09/F-10.

## 9. Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial System SDS | D1-S3 baseline |
| 0.2 | 2026-11-07 | Local PostgreSQL host port 5433 → 5434 (5433 is taken by the Labs 1–4 database on developer machines) | D1-S5 |
| 0.3 | 2026-11-07 | Docker image and compose `app` service (L5-S1): env `COOKIE_SECURE`, `CLIENT_DIST`, `SEED_ON_START`; seed made non-destructive; SD-05 accepted | Lab 5 L5-S1 |
| 0.4 | 2026-11-14 | SD-03 changed from one VM + docker compose to Cloud Run + Cloud SQL (Lab 5 reference stack; handout received with the starter kit); §7.3 rewritten; `/api/ready` added | Lab 5 |
