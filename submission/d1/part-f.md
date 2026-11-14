# Working Sprint 1 and verification

Release under test: `v0.1.0-sprint1` — commit `e1747cb` (main merge of PR #32).  
Local setup: PostgreSQL 16 on port 5434 (docker-compose `money-logger-postgres`), schema applied via `npx prisma migrate deploy`, seeded via `npx prisma db seed`, server running on port 4000, client running on port 5173 (unified app available on port 8080 or port 4000).

---

## F.1 Program demonstrations

### F.1.1 Normal domain journey and persisted result
- **Features & AC:** F-03 (AC-F03-01), F-04 (AC-F04-01), F-05 (AC-F05-01, AC-F05-02), F-06 (AC-F06-01, AC-F06-02, AC-F06-03, AC-F06-07).
- **Role:** Regular user (`bob` or `alice`, role `USER`).
- **Starting conditions:** Synthetic test database seeded via `server/prisma/seed.ts`. User `bob` possesses initial zero-balance accounts: `Bank`, `Cash` (CASH), `Credit Card` (LOAN_TAKEN), `Salary` (INCOME), `Dining`, `Groceries`, `Electricity`, `Telecom` (EXPENSE). No prior transactions exist for `bob`.

#### Demonstration steps
1. **User Login (`/login`):**  
   User enters username `bob` and password. Upon successful authentication, the server sets an `httpOnly`, `SameSite=Lax` session cookie containing a signed JWT, and the client redirects to `/overview`.

2. **Set Opening Balance (`/accounts` — AC-F03-01):**  
   User navigates to Accounts. In the CASH section, clicks "Set opening balance" on account `Bank`. Enters amount `฿5,000.00` (500000 satang) and date `2026-11-01`. Submits form.  
   *Result:* Bank balance updates to `฿5,000.00`, opening balance displays `฿5,000.00`, and the "Set opening balance" button is permanently hidden (enforcing BR-10 one-time initialization).

3. **Receive Salary (`/receive` — AC-F04-01):**  
   User clicks "Receive money" in the navigation bar. Selects destination `Bank`, enters total amount `฿30,000.00`, date `2026-11-05`, note `November Salary`. Adds allocation line selecting `Salary` with amount `฿30,000.00`. Submits form.  
   *Result:* Transaction posted with status `POSTED`. Bank balance increases from ฿5,000.00 to `฿35,000.00`. Salary period total reflects `฿30,000.00`.

4. **Credit Card Purchase (`/pay` — AC-F05-01):**  
   User clicks "Make a payment". Selects paying account `Credit Card` (LOAN_TAKEN), enters total `฿1,200.00`, date `2026-11-06`, note `Weekly groceries and lunch`. Adds two expense allocation lines:
   - Line 1: `Dining` (EXPENSE) — `฿700.00`
   - Line 2: `Groceries` (EXPENSE) — `฿500.00`  
   *Result:* Transaction posted with status `POSTED`. Credit card debt increases from ฿0.00 to `฿1,200.00` (stored as balance 120000 satang per BR-05). Expense totals: Dining `฿700.00`, Groceries `฿500.00`.

5. **Repay Card Debt (`/pay` — AC-F05-02):**  
   User records credit card repayment. Selects paying account `Bank` (CASH), enters total `฿1,200.00`, date `2026-11-07`, note `Pay off card balance`. Selects repayment line:
   - Line 1: `Credit Card` (LOAN_TAKEN repayment line) — `฿1,200.00`  
   *Result:* Transaction posted atomically. Bank cash balance decreases from ฿35,000.00 to `฿33,800.00`. Credit Card debt decreases from ฿1,200.00 to `฿0.00`. In strict compliance with BR-06, debt repayments do not affect expense totals.

6. **Overview and Month Summary (`/overview` — AC-F06-02, AC-F06-03):**  
   User views the Overview dashboard. Cards display:
   - **Cash:** Bank `฿33,800.00` (Total: `฿33,800.00`)
   - **Debts:** Credit Card `฿0.00` (Total: `฿0.00`)
   - **Owed to me:** Total `฿0.00`
   - **This Month Summary:** Income `฿30,000.00`, Expense `฿1,200.00`, Net `฿28,800.00`.  
   Opening balance (฿5,000.00) and card repayment (฿1,200.00) are excluded from the summary per BR-06.

7. **Persistence and History (`/transactions` — AC-F06-05, AC-F06-07):**  
   User reloads the browser and performs a full logout and re-login. Navigates to `/transactions`.  
   *Result:* All account balances, month summary totals, and exactly 3 transaction rows are preserved in reverse chronological order:
   - `07 Nov 2026` | Paid | Bank | "Pay off card balance" | `฿1,200.00`
   - `06 Nov 2026` | Paid | Credit Card | "Weekly groceries and lunch" | `฿1,200.00`
   - `05 Nov 2026` | Received | Bank | "November Salary" | `฿30,000.00`  
   Clicking any transaction row opens `/transactions/:id` displaying detailed line breakdowns.

| Step | Operation | Account Affected | Expected Balance / Total | Actual Observed | Result |
|---|---|---|---|---|---|
| 1 | Login `bob` | Session cookie | Valid JWT cookie set | Cookie set, redirect `/overview` | PASS |
| 2 | Set Opening Balance | Bank (CASH) | Balance ฿5,000.00 | Balance ฿5,000.00 | PASS |
| 3 | Receive Salary | Bank, Salary | Bank ฿35,000.00, Salary ฿30,000.00 | Bank ฿35,000.00, Salary ฿30,000.00 | PASS |
| 4 | Card Purchase | Credit Card, Dining, Groceries | Debt ฿1,200.00, Exp ฿1,200.00 | Debt ฿1,200.00, Exp ฿1,200.00 | PASS |
| 5 | Card Repayment | Bank, Credit Card | Bank ฿33,800.00, Debt ฿0.00 | Bank ฿33,800.00, Debt ฿0.00 | PASS |
| 6 | Overview Screen | Summary Card | Inc ฿30k, Exp ฿1.2k, Net ฿28.8k | Inc ฿30k, Exp ฿1.2k, Net ฿28.8k | PASS |
| 7 | Reload & Re-login | Overview & History | 3 rows, values unchanged | 3 rows, values unchanged | PASS |

---

### F.1.2 Business-rule rejection

#### Demonstration 1: Line sum mismatch rejection (BR-01 / AC-F04-02 / AC-F05-03)
- **Input:** On the Make a payment form (`/pay`), user enters Total `฿1,000.00`, but specifies lines summing to `฿900.00` (Difference: `฿100.00`).
- **Expected:** The client live footer displays a real-time warning: *"Total mismatch: lines sum to ฿900.00 (difference: ฿100.00)"* and disables submission. If submitted directly via API, the server returns HTTP 422 with error code `RULE_VIOLATION` and message `"Line amounts must sum to total amount."`. Form values are preserved without loss.
- **Actual:** Verified in automated E2E test `e2e/f05-pay.spec.ts` (TEST-F05-08) and API test `server/tests/f05-transactions.api.test.ts` (TEST-F05-03). HTTP 422 returned, database untouched.

#### Demonstration 2: CASH account balance cannot go negative (BR-07 / AC-F05-05)
- **Input:** User attempts to spend `฿50,000.00` from `Bank` when the current balance is `฿33,800.00`.
- **Expected:** In `server/src/lib/ledger.ts`, `calculateTxnEffects` checks the row-locked balance (`SELECT ... FOR UPDATE`). Since `currentBalance + delta < 0` (3380000 - 5000000 = -1620000), the transaction is rejected before execution with HTTP 422 `RULE_VIOLATION`: *"Cash account balance cannot go negative."*. Furthermore, the PostgreSQL column check constraint `CHECK (balance >= 0)` on CASH accounts provides database-level defense in depth.
- **Actual:** Verified in `server/tests/f05-transactions.api.test.ts` (TEST-F05-05). Request rejected with 422, zero balance mutation.

#### Demonstration 3: Card repayment exceeding debt rejected (BR-08 / AC-F05-06)
- **Input:** User attempts to repay `฿2,000.00` towards Credit Card debt when outstanding debt is `฿1,200.00`.
- **Expected:** `calculateTxnEffects` evaluates `repaymentAmount > currentDebt` and throws an invariant error. Server responds with HTTP 422 `RULE_VIOLATION`: *"Repayment amount exceeds outstanding debt."*.
- **Actual:** Verified in `server/tests/f05-transactions.api.test.ts` (TEST-F05-06). Rejection confirmed, exact debt repayment (฿1,200.00) accepted.

#### Demonstration 4: Account not owned by user or archived (BR-04, BR-11 / AC-F04-05, AC-F05-07)
- **Input:** User `alice` submits a transaction referencing an account ID belonging to user `bob`.
- **Expected:** Server queries accounts with `WHERE id IN (...) AND user_id = req.user.id AND NOT archived`. When account counts do not match, returns HTTP 404 `NOT_FOUND`: *"Account not found."*. No foreign account information is disclosed.
- **Actual:** Verified in `server/tests/f04-transactions.api.test.ts` (TEST-F04-05) and `server/tests/f05-transactions.api.test.ts` (TEST-F05-07). Returns 404 with standard error envelope.

---

### F.1.3 Login/logout and forbidden operations

#### Demonstration 1: Unauthenticated access redirected (AC-F01-01, AC-F01-08)
- **Action:** A browser client without an active session cookie visits protected routes (`/overview`, `/accounts`, `/transactions`, `/receive`, `/pay`).
- **Expected:** Client router detects absence of authenticated user state and redirects to `/login`. Direct API calls to `/api/accounts`, `/api/transactions`, `/api/overview`, or `/api/summary` return HTTP 401 `UNAUTHENTICATED`.
- **Actual:** Verified in `e2e/f01-auth.spec.ts` (TEST-F01-08) and `server/tests/f01-auth.api.test.ts` (TEST-F01-01).

#### Demonstration 2: Disabled user rejected on login and existing session revoked (AC-F01-04, AC-F02-02, BR-13)
- **Action:** Administrator disables user `bob` via `PATCH /api/admin/users/:id` (`status: "DISABLED"`).
- **Expected:**
  1. Any existing active session cookie held by `bob` is rejected on its next request with HTTP 403 `FORBIDDEN` because `requireAuth` queries the current user record on every authenticated call (SDS §4.3).
  2. New login attempts with valid password fail with HTTP 403 `FORBIDDEN`: *"User account is disabled."*.
  3. When re-enabled by admin (`status: "ACTIVE"`), `bob` can immediately log in again.
- **Actual:** Verified in `server/tests/f02-admin.api.test.ts` (TEST-F02-02) and `server/tests/f01-auth.api.test.ts` (TEST-F01-04).

#### Demonstration 3: Administrator role forbidden from financial data (AC-F02-04, BR-12, NFR-02)
- **Action:** User authenticated with role `ADMIN` accesses financial endpoints (`/api/accounts`, `/api/transactions`, `/api/overview`, `/api/summary`, `/api/transactions/:id`).
- **Expected:** In `server/src/app.ts`, financial routes are protected by middleware `requireAuth, requireRole('USER')`. An `ADMIN` user receives HTTP 403 `FORBIDDEN` with body `{"error": {"code": "FORBIDDEN", "message": "Forbidden."}}` and zero financial data is returned.
- **Actual:** Verified across all financial endpoints in `server/tests/f02-admin.api.test.ts` (TEST-F02-04) and `server/tests/f06-overview.api.test.ts` (TEST-F06-06).

#### Demonstration 4: Regular user forbidden from admin endpoints (AC-F02-05)
- **Action:** Regular user `alice` (`role: "USER"`) calls `GET /api/admin/users` or attempts to patch user statuses.
- **Expected:** Guard middleware `requireRole('ADMIN')` rejects the request with HTTP 403 `FORBIDDEN`.
- **Actual:** Verified in `server/tests/f02-admin.api.test.ts` (TEST-F02-05).

---

## F.2 Build and automated test results

### Automated test summary on release commit `e1747cb`
- **Environment:** Node.js v24.19.0, npm v10.8.2, Docker v27.x, PostgreSQL 16.
- **Evidence Reference:** `evidence/d1/release-v0.1.0-sprint1.txt` (recorded on staging `2f8dd76` and verified on main `e1747cb`).

```
================================================================================
Test Suite Summary — Release v0.1.0-sprint1 (Commit e1747cb)
================================================================================
Server Typecheck (tsc --noEmit) : PASS (0 errors)
Server Unit & API-DB (Vitest)    : 13 test files passed, 58 tests passed (0 failed, 0 skipped)
Client Build (tsc -b && vite)   : PASS (35 modules transformed, dist/ built cleanly)
E2E Suite (Playwright)          : 6 spec files passed, 6 tests passed (0 failed, 0 skipped)
Docker Unified Image Build      : PASS (multi-stage image built cleanly)
GitHub Actions CI Quality Gates : 5/5 jobs passed (Client, Docker, E2E, Secret scan, Server)
Total Automated Test Cases      : 64 passed (100%), 0 failed, 0 skipped
================================================================================
```

### Complete Acceptance Criteria verification matrix (41/41 PASS)

| AC | TEST ID | Level | Test File | Result | Verified Commit |
|---|---|---|---|---|---|
| AC-F01-01 | TEST-F01-01 | API-DB | `server/tests/f01-auth.api.test.ts` | PASS | `56ac71d` |
| AC-F01-02 | TEST-F01-02 | API-DB | `server/tests/f01-auth.api.test.ts` | PASS | `56ac71d` |
| AC-F01-03 | TEST-F01-03 | API-DB | `server/tests/f01-auth.api.test.ts` | PASS | `56ac71d` |
| AC-F01-04 | TEST-F01-04 | API-DB | `server/tests/f01-auth.api.test.ts` | PASS | `56ac71d` |
| AC-F01-05 | TEST-F01-05 | API-DB | `server/tests/f01-auth.api.test.ts` | PASS | `56ac71d` |
| AC-F01-06 | TEST-F01-06 | API-DB | `server/tests/f01-auth.api.test.ts` | PASS | `56ac71d` |
| AC-F01-07 | TEST-F01-07 | unit | `server/tests/f01-session.unit.test.ts` | PASS | `56ac71d` |
| AC-F01-08 | TEST-F01-08 | E2E | `e2e/f01-auth.spec.ts` | PASS | `56ac71d` |
| AC-F02-01 | TEST-F02-01 | API-DB | `server/tests/f02-admin.api.test.ts` | PASS | `1090928` |
| AC-F02-02 | TEST-F02-02 | API-DB | `server/tests/f02-admin.api.test.ts` | PASS | `1090928` |
| AC-F02-03 | TEST-F02-03 | API-DB | `server/tests/f02-admin.api.test.ts` | PASS | `1090928` |
| AC-F02-04 | TEST-F02-04 | API-DB | `server/tests/f02-admin.api.test.ts` | PASS | `1090928` |
| AC-F02-05 | TEST-F02-05 | API-DB | `server/tests/f02-admin.api.test.ts` | PASS | `1090928` |
| AC-F02-06 | TEST-F02-06 | API-DB | `server/tests/f02-admin.api.test.ts` | PASS | `1090928` |
| AC-F03-01 | TEST-F03-01 | API-DB | `server/tests/f03-accounts.api.test.ts` | PASS | `3f3aae5` |
| AC-F03-02 | TEST-F03-02 | API-DB | `server/tests/f03-accounts.api.test.ts` | PASS | `b2a4f70` |
| AC-F03-03 | TEST-F03-03 | unit + API-DB | `server/tests/f03-accounts.api.test.ts`, `f03-accounts.unit.test.ts` | PASS | `3f3aae5` |
| AC-F03-04 | TEST-F03-04 | API-DB | `server/tests/f03-accounts.api.test.ts` | PASS | `3f3aae5` |
| AC-F03-05 | TEST-F03-05 | API-DB | `server/tests/f03-accounts.api.test.ts` | PASS | `3f3aae5` |
| AC-F04-01 | TEST-F04-01 | API-DB | `server/tests/f04-transactions.api.test.ts` | PASS | `b2a4f70` |
| AC-F04-02 | TEST-F04-02 | unit + API-DB | `server/tests/f04-transactions.api.test.ts`, `f04-ledger.unit.test.ts` | PASS | `b2a4f70` |
| AC-F04-03 | TEST-F04-03 | unit + API-DB | `server/tests/f04-transactions.api.test.ts`, `f04-ledger.unit.test.ts` | PASS | `b2a4f70` |
| AC-F04-04 | TEST-F04-04 | unit + API-DB | `server/tests/f04-transactions.api.test.ts`, `f04-ledger.unit.test.ts` | PASS | `b2a4f70` |
| AC-F04-05 | TEST-F04-05 | API-DB | `server/tests/f04-transactions.api.test.ts` | PASS | `b2a4f70` |
| AC-F04-06 | TEST-F04-06 | API-DB | `server/tests/f04-transactions.api.test.ts` | PASS | `b2a4f70` |
| AC-F04-07 | TEST-F04-07 | E2E | `e2e/f04-receive.spec.ts` | PASS | `b2a4f70` |
| AC-F05-01 | TEST-F05-01 | unit + API-DB | `server/tests/f05-transactions.api.test.ts`, `f05-ledger.unit.test.ts` | PASS | `6f52657` |
| AC-F05-02 | TEST-F05-02 | unit + API-DB | `server/tests/f05-transactions.api.test.ts`, `f05-ledger.unit.test.ts` | PASS | `6f52657` |
| AC-F05-03 | TEST-F05-03 | API-DB | `server/tests/f05-transactions.api.test.ts` | PASS | `6f52657` |
| AC-F05-04 | TEST-F05-04 | unit + API-DB | `server/tests/f05-transactions.api.test.ts`, `f05-ledger.unit.test.ts` | PASS | `6f52657` |
| AC-F05-05 | TEST-F05-05 | unit + API-DB | `server/tests/f05-transactions.api.test.ts`, `f05-ledger.unit.test.ts` | PASS | `6f52657` |
| AC-F05-06 | TEST-F05-06 | API-DB | `server/tests/f05-transactions.api.test.ts`, `f05-ledger.unit.test.ts` | PASS | `6f52657` |
| AC-F05-07 | TEST-F05-07 | API-DB | `server/tests/f05-transactions.api.test.ts` | PASS | `6f52657` |
| AC-F05-08 | TEST-F05-08 | E2E | `e2e/f05-pay.spec.ts` | PASS | `6f52657` |
| AC-F06-01 | TEST-F06-01 | API-DB | `server/tests/f06-overview.api.test.ts` | PASS | `7850d4e` |
| AC-F06-02 | TEST-F06-02 | API-DB | `server/tests/f06-overview.api.test.ts` | PASS | `7850d4e` |
| AC-F06-03 | TEST-F06-03 | API-DB | `server/tests/f06-overview.api.test.ts` | PASS | `7850d4e` |
| AC-F06-04 | TEST-F06-04 | unit + API-DB | `server/tests/f06-period.unit.test.ts`, `f06-overview.api.test.ts` | PASS | `7850d4e` |
| AC-F06-05 | TEST-F06-05 | API-DB | `server/tests/f06-overview.api.test.ts` | PASS | `7850d4e` |
| AC-F06-06 | TEST-F06-06 | API-DB | `server/tests/f06-overview.api.test.ts` | PASS | `7850d4e` |
| AC-F06-07 | TEST-F06-07 | E2E | `e2e/f06-journey.spec.ts` | PASS | `7850d4e` |

*Automated vs Manual:* 100% of the 41 acceptance criteria are verified via automated suites (Unit, API-DB integration, and Playwright E2E). Zero manual checks are required for Sprint 1 verification.

---

### F.2.1 Test excerpt — Domain rule (TDD Red → Green)
- **Domain Rule:** BR-07 (CASH balance cannot go negative) and BR-08 (Repayment line cannot exceed card debt).
- **Implementation Location:** `server/src/lib/ledger.ts`:
```typescript
// BR-07 & BR-08 enforcement inside calculateTxnEffects
if (primary.type === AccountType.CASH) {
  if (primary.balance + primaryDelta < 0n) {
    throw new LedgerRuleError('Cash account balance cannot go negative.')
  }
}
for (const line of lines) {
  if (primary.type === AccountType.CASH && line.account.type === AccountType.LOAN_TAKEN) {
    if (line.amount > line.account.balance) {
      throw new LedgerRuleError('Repayment amount exceeds outstanding debt.')
    }
  }
}
```

- **Red Phase Evidence (`evidence/d1/F05-red.txt` — Commit `f615c47`):**
```
FAIL tests/f05-transactions.api.test.ts > F-05 Payment/charge API > TEST-F05-05 overspending CASH balance rejected with 422
AssertionError: expected 404 to be 422
  - Expected: 422
  + Received: 404
Tests: 8 failed, 39 passed (47 total)
```

- **Green Phase Evidence (`evidence/d1/F05-green.txt` — Commit `6f52657`):**
```
✓ tests/f05-transactions.api.test.ts > F-05 Payment/charge API > TEST-F05-05 overspending CASH balance rejected with 422, exact balance accepted (AC-F05-05, BR-07) 313ms
✓ tests/f05-transactions.api.test.ts > F-05 Payment/charge API > TEST-F05-06 repayment line exceeding debt rejected with 422, exact debt accepted (AC-F05-06, BR-08) 329ms
Test Files: 12 passed (12) | Tests: 47 passed (47)
```

---

### F.2.2 Test excerpt — Role and ownership restriction
- **Rule:** BR-11 (Cross-user isolation) and BR-12 (Administrator financial access block).
- **Implementation Location:** `server/src/app.ts` and `server/src/routes/transactions.ts`:
```typescript
// Route Guard in app.ts
app.use(['/api/accounts', '/api/transactions', '/api/overview', '/api/summary'], requireAuth, requireRole('USER'))

// Ownership Filter in routes/transactions.ts
const txn = await prisma.txn.findFirst({
  where: { id, userId: req.user!.id },
  include: withAccounts
})
if (!txn) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } })
```

- **Test Log (`evidence/d1/F06-green.txt`):**
```
✓ tests/f06-overview.api.test.ts > F-06 Overview, summary and history > TEST-F06-06 another user's transaction is 404 and the admin gets 403 on overview, summary and history (479ms)
  - Alice requesting Bob transaction -> 404 Not Found (body keys: ["error"])
  - Alice requesting transaction list -> contains only Alice transactions
  - Admin requesting GET /api/overview -> 403 Forbidden
  - Admin requesting GET /api/summary -> 403 Forbidden
  - Admin requesting GET /api/transactions -> 403 Forbidden
  - Admin requesting GET /api/transactions/:id -> 403 Forbidden
```

---

## F.3 Engineering workflow and history

### F.3.1 Two completed Issues and PRs

#### 1. Issue #4 (Feature F-04: Receive money) → Pull Request #17
- **Contract:** `docs/sprints/sprint-1/F04-receive-money.md`
- **Branch:** `feature/F04-receive-money`
- **Author:** Tantiyawat Chansiri (`Leviathan-c137`)
- **Reviewer:** Sarin CH (`Sxr1n`)
- **Work Summary:** Built shared ledger core (`server/src/lib/ledger.ts`), atomic database posting algorithm (`POST /api/transactions` for RECEIPT form), row locking mechanism, transaction line sum validations, and the Receive money UI form (`client/src/pages/ReceiveMoneyPage.tsx`).
- **Substantive Review:** The reviewer verified that database rollbacks leave zero orphaned records on balance failures. Reviewer requested clarifying the error response shape when line amount is zero or negative and ensuring client form input values are preserved upon 422 responses. Author addressed comments in commit `b2a4f70`, adding test `TEST-F04-07`.
- **Merge Sequence:** Approved by `@Sxr1n`, merged into `staging/sprint-1` on 2026-11-13 (commit `53cd180`), and released to `main` in PR #32.

#### 2. Issue #6 (Feature F-06: Overview, summary and history) → Pull Request #19
- **Contract:** `docs/sprints/sprint-1/F06-overview-history.md` (v0.3)
- **Branch:** `feature/F06-overview-history`
- **Author:** Sarin CH (`Sxr1n`)
- **Reviewer:** Tantiyawat Chansiri (`Leviathan-c137`)
- **Work Summary:** Implemented `GET /api/overview`, `GET /api/summary`, `GET /api/transactions` with pagination and detail endpoints, `periodTotal` calculations for income/expense accounts, and client pages Overview (`/overview`), History (`/transactions`), and Transaction Detail (`/transactions/:id`).
- **Substantive Review:** The reviewer verified the BR-06 implementation ensuring opening balances and debt repayments never affect income or expense sums. Reviewer confirmed that `e2e/global-setup.ts` resets test data cleanly and verified that using `bob` for the E2E journey avoids collisions with earlier test runs. Approved by `@Leviathan-c137`, merged into `staging/sprint-1` on 2026-11-14 (commit `2f8dd76`), and released to `main` in PR #32.

---

### F.3.2 Commit history sequence (Contract → Red → Green)

Every Sprint 1 feature strictly adhered to the test-first engineering protocol:

| Feature | Engineering Contract | Red Commit (Test Failure) | Green Commit (Working Feature) | Review & Docs Commit |
|---|---|---|---|---|
| **F-01** Authentication | `7dbc7ec` (07 Nov) | `e9f9653` (07 Nov) | `56ac71d` (07 Nov) | `PR #10` (Merged) |
| **F-02** Admin Access | `7dbc7ec` (07 Nov) | `50c09ff` (07 Nov) | `1090928` (08 Nov) | `PR #11` (Merged) |
| **F-03** Opening Balance | `7dbc7ec` (07 Nov) | `0849955` (12 Nov) | `3f3aae5` (12 Nov) | `b2a4f70` (PR #16) |
| **F-04** Receive Money | `7dbc7ec` (07 Nov) | `295c90b` (13 Nov) | `b2a4f70` (13 Nov) | `PR #17` (Merged) |
| **F-05** Payment & Charge | `7dbc7ec` (07 Nov) | `f615c47` (14 Nov) | `6f52657` (14 Nov) | `4fa38f5` (PR #18) |
| **F-06** Overview & History | `7dbc7ec` (07 Nov) | `c5848da` (14 Nov) | `7850d4e` (14 Nov) | `2dd588a` (PR #19) |

---

### F.3.3 Final board status and release reference
- **Feature Board Status:** All 6 Sprint 1 features (F-01 through F-06) are in `TESTED` status with 100% of acceptance criteria verified.
- **Sprint 1 Release PR:** PR #32 (`staging/sprint-1 → main`) merged via merge commit `e1747cb` on 2026-11-14.
- **Git Release Tag:** `v0.1.0-sprint1` tagged directly on commit `e1747cb` (immutable baseline).

---

## F.4 Contributions

Work was divided equally according to the team agreement registered in `docs/sessions/STATUS.md`:

| Student | Main Implementation Scope | Code Reviews & Verification Conducted |
|---|---|---|
| **Sarin CH**<br>(`Sxr1n`, 67070505207) | • F-01 Authentication and Session<br>• F-02 Administrator User Access<br>• F-06 Overview, Summary and History<br>• Docker Multi-stage Build & Compose (Lab 5)<br>• CI Pipeline Quality Gates (Lab 5)<br>• D1 Automated PDF Generator (`build_pdf.py`) | • PR #16 (F-03 Opening Balance)<br>• PR #17 (F-04 Receive Money)<br>• PR #18 (F-05 Payment & Charge) |
| **Tantiyawat Chansiri**<br>(`Leviathan-c137`, 67070505216) | • F-03 Opening Balance & Validations<br>• F-04 Receive Money & Shared Ledger Core<br>• F-05 Payment, Charge & Repayment Logic<br>• D1 Part F Verification Document & Evidence<br>• E2E Global DB Reset Harness (`reset-e2e.ts`) | • PR #10 (F-01 Authentication)<br>• PR #11 (F-02 Administrator)<br>• PR #19 (F-06 Overview & History)<br>• PR #20 (Release Verification Evidence)<br>• PR #21 (PDF Builder & Public Repo Prep)<br>• PR #22 (Cloud Run Deployment Pipeline)<br>• PR #31 (Deploy Guard Workflow)<br>• PR #32 (Sprint 1 Release `v0.1.0-sprint1`) |

---

## F.5 AI-use declaration

Summary of AI collaboration recorded in `docs/ai-use.md`:
1. **Tool Used:** Claude Opus 5.5 and Claude Sonnet via Antigravity and Claude Code.
2. **Context & Prompts:** Used to accelerate drafting initial test scaffolds, boilerplate React components, and complex database grouping queries. Prompts strictly supplied course requirements (`group_work_specs_v1.pdf`, `project_deliverable_1_v1.pdf`), System SDS architecture, and engineering contracts.
3. **Engineering Oversight & Quality Control:**
   - **TDD Enforcement:** Tests were always authored, run, and recorded failing (`red`) before implementation code was written.
   - **Human Code Review:** Every AI-generated line was examined by the peer reviewer before PR approval. Real defects (such as missing JWT secret deletion in teardown scripts and button selector strictness collisions in E2E tests) were caught and corrected by the human developers.
   - **Privacy Protection:** Ensured student identification numbers were scrubbed from repository files prior to making the repository public (Lab 5 R-12).

---

## F.6 Known limitations, failed and skipped tests

1. **Test Failures / Skips:**
   - **Zero failed tests** across all 58 server tests and 6 E2E tests.
   - **Zero skipped tests**. 100% of planned Sprint 1 test suites executed to completion.

2. **Known System Limitations:**
   - **GCP Cloud Deployment (Lab 5):** The deployment job in `.github/workflows/deploy.yml` is temporarily gated by `vars.DEPLOY_ENABLED == 'true'` following the instructor announcement on 14 Nov regarding student Google Cloud account provisioning delays. Cloud deployment will be executed as soon as GCP credentials are functional.
   - **Windows E2E Execution:** On Windows workstations with Smart App Control enabled, Playwright must be executed with `PW_CHANNEL=chrome` to use the pre-installed Google Chrome binary. GitHub Actions Ubuntu CI is unaffected and runs standard Chromium.
