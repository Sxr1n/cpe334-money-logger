# F-06 Overview, summary and history — Sprint 1
Linked: FR-06, FR-18, FR-24, FR-25, BR-06, BR-11, NFR-02, NFR-08   Status: SPECIFIED   Owner: Sxr1n
Depends on: F-03, F-04, F-05. Design references: `docs/system-sds.md` §2.1 (dates), §2.4 (balances), §3, §4

## 1 Behavior & workflow
**Happy path** (after the Sprint 1 scenario: opening Bank ฿5,000, salary ฿30,000, card purchase ฿1,200 = Dining ฿700 + Groceries ฿500, card repayment ฿1,200 from Bank)
1. Alice opens Overview: Bank ฿33,800.00; Credit Card debt ฿0.00; no loans given; this month income ฿30,000.00, expense ฿1,200.00, net ฿28,800.00.
2. Accounts shows every account grouped by type; Salary, Dining, Groceries show this month's totals.
3. History lists her 3 transactions newest first; opening a row shows its lines.

**Failure and boundary cases**
- Period defaults to the current calendar month in Asia/Bangkok. A transaction dated the 1st or the last day of the month is inside it.
- `from` later than `to`, or an invalid date → 422.
- No transactions → zero totals and the empty state.
- Another user's transaction id → 404. ADMIN → 403 on every endpoint here.
- Opening balances, card repayments and (later) transfers/loans never change income or expense (BR-06): totals read only INCOME lines of RECEIPTs and EXPENSE lines of PAYMENTs with status POSTED.

## 2 Business rules & validation
- BR-06: `income = Σ lines.amount where account.type = INCOME`, `expense = Σ lines.amount where account.type = EXPENSE`, over POSTED transactions of the user with `from ≤ txn_date ≤ to`; `net = income − expense`.
- BR-11: every query filters by the session user's id.
- `from`, `to`: `YYYY-MM-DD`, both optional (default: first and last day of the current Bangkok month), `from ≤ to`.
- History: `page ≥ 1`, `1 ≤ pageSize ≤ 50` (default 50); order `txn_date DESC, id DESC`.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `GET /api/accounts` (with period totals) | ✔ own | 403 | 401 |
| `GET /api/overview` | ✔ own | 403 | 401 |
| `GET /api/summary` | ✔ own | 403 | 401 |
| `GET /api/transactions` | ✔ own | 403 | 401 |
| `GET /api/transactions/:id` | ✔ own (other's → 404) | 403 | 401 |

## 4 UI
- **Overview** (`/overview`, USER home): cards "Cash" (each CASH account + total), "Debts" (each LOAN_TAKEN + total, labelled "Credit card debt" for cards), "Owed to me" (each LOAN_GIVEN + total), "This month" (income, expense, net; month name). Buttons "Receive money" and "Make a payment".
- **Accounts** (`/accounts`, from F-03): INCOME and EXPENSE rows now show "This month: ฿x".
- **History** (`/transactions`): table Date, Form (Received / Paid), Account, Note, Total; Previous/Next paging; row click → detail.
- **Transaction detail** (`/transactions/:id`): header fields + lines table (account, type, amount).
- Loading: spinners. Empty: "No transactions yet" with buttons to the two forms. Errors: 404 → "Not found"; others → alert.

## 5 API
**`GET /api/accounts?from&to`** — as F-03, and INCOME/EXPENSE items gain `"periodTotal": 3000000` for the period (other types: `null`).

**`GET /api/overview`** → 200
```json
{ "cash":      { "items": [ { "id": 11, "name": "Bank", "balance": 3380000 } ], "total": 3380000 },
  "loanTaken": { "items": [ { "id": 12, "name": "Credit Card", "balance": 0 } ], "total": 0 },
  "loanGiven": { "items": [], "total": 0 },
  "month": { "from": "2026-11-01", "to": "2026-11-30", "income": 3000000, "expense": 120000, "net": 2880000 } }
```

**`GET /api/summary?from=2026-11-01&to=2026-11-30`** → 200 `{ "from", "to", "income", "expense", "net" }`; 422 `VALIDATION_FAILED` for invalid dates or `from > to`.

**`GET /api/transactions?page=1&pageSize=50`** → 200 `{ "items": [ <transaction as in F-04 §5> ], "page", "pageSize", "total" }`; 422 for invalid paging values.

**`GET /api/transactions/:id`** → 200 transaction (F-04 §5 shape); 404 `NOT_FOUND` if missing or not the caller's.

## 6 Data
No change. Uses the index `transactions (user_id, txn_date DESC, id DESC)` from F-04.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F06-01 | After the scenario, `GET /api/accounts` returns alice's accounts ordered by type; Bank/Credit Card carry `balance`, Salary has `periodTotal` 3000000, Dining 70000, Groceries 50000, Electricity 0. |
| AC-F06-02 | After the scenario, `GET /api/overview` returns cash total 3380000 (Bank), loanTaken total 0 (Credit Card), loanGiven total 0. |
| AC-F06-03 | After the scenario, the month summary is income 3000000, expense 120000, net 2880000 — the opening balance (500000) and card repayment (120000) are not counted. |
| AC-F06-04 | With the clock at 2026-11-30 23:30 Asia/Bangkok (2026-11-30 16:30 UTC), the default period is 2026-11-01..2026-11-30, and transactions dated 2026-11-01 and 2026-11-30 are included while one dated 2026-10-31 is not. At 2026-12-01 00:10 Bangkok (2026-11-30 17:10 UTC) the default period is December. |
| AC-F06-05 | With 51 transactions, page 1 has 50 items newest first (by date, then id) and page 2 has 1; `GET /api/transactions/:id` returns the transaction with its lines. |
| AC-F06-06 | Alice requesting bob's transaction id → 404 with no transaction data; alice's history contains none of bob's transactions; ADMIN calling overview, summary, history or detail → 403. |
| AC-F06-07 | In the browser alice completes the Sprint 1 journey (login → set Bank opening ฿5,000 → receive salary ฿30,000 → card purchase Dining ฿700 + Groceries ฿500 → repay card ฿1,200 from Bank) and Overview shows Bank ฿33,800.00, card debt ฿0.00, income ฿30,000.00, expense ฿1,200.00; after a page reload and after logout/login the same values and 3 history rows are shown. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F06-01 | AC-F06-01 | API-DB | Scenario posted via API helpers (dates in current month) | `GET /api/accounts` | Order and values as AC |
| TEST-F06-02 | AC-F06-02 | API-DB | Same | `GET /api/overview` | Totals as AC |
| TEST-F06-03 | AC-F06-03 | API-DB (TDD) | Same | `GET /api/summary` (default period) | income 3000000, expense 120000, net 2880000 |
| TEST-F06-04 | AC-F06-04 | unit | `vi.setSystemTime` at the two instants; transactions on 10-31, 11-01, 11-30 | `currentMonthRange()` and summary period filter | Ranges and inclusions as AC |
| TEST-F06-05 | AC-F06-05 | API-DB | 51 RECEIPTs inserted with spread dates | `GET /api/transactions?page=1`, `?page=2`; detail of first id | 50 + 1 items; strictly newest first; detail has lines |
| TEST-F06-06 | AC-F06-06 | API-DB | bob has a transaction; alice and admin cookies | alice `GET /api/transactions/{bobTxn}`, alice list; admin the four endpoints | 404 body keys `["error"]`; list has only alice's ids; admin 403 ×4 |
| TEST-F06-07 | AC-F06-07 | E2E | Fresh seed; app running | Playwright drives the full journey, reloads, logs out and in | Values and 3 rows as AC each time |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F06-01 | — | NOT RUN | — |
| AC-F06-02 | — | NOT RUN | — |
| AC-F06-03 | — | NOT RUN | — |
| AC-F06-04 | — | NOT RUN | — |
| AC-F06-05 | — | NOT RUN | — |
| AC-F06-06 | — | NOT RUN | — |
| AC-F06-07 | — | NOT RUN | — |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial contract | D1-S4 |
