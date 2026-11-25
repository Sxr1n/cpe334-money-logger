# Traceability — Requirement → Feature → Sprint → AC → Test

| Item | Value |
|---|---|
| Sources | `docs/srs.md` v0.2, `docs/features.md` v0.1 |
| Document version | 0.3 |
| Tested release | — (no release yet; Sprint 1 results are per feature commit until v0.1.0-sprint1) |

Sprint 1 AC and TEST IDs below are **planned**; their full text, STS rows and results live in the Sprint 1 contracts (`docs/sprints/sprint-1/`). Sprint 2–3 requirements are allocated to a feature and sprint; their AC/TEST are written with the sprint's contracts. Test results use `PASS / FAIL / SKIPPED / NOT RUN / INCOMPLETE` with the commit SHA.

## 1. Requirements to features and sprints

### 1.1 Functional requirements
| REQ | Feature / responsibility | Sprint | AC | TEST |
|---|---|---|---|---|
| FR-01 | F-01 Authentication and session | 1 | AC-F01-01, AC-F01-02, AC-F01-03 | TEST-F01-01, TEST-F01-02, TEST-F01-03 |
| FR-02 | F-01 Authentication and session | 1 | AC-F01-04, AC-F01-08 | TEST-F01-04, TEST-F01-08 |
| FR-03 | F-01 Authentication and session | 1 | AC-F01-01 | TEST-F01-01 |
| FR-04 | F-02 Administrator user access | 1 | AC-F02-01 | TEST-F02-01 |
| FR-05 | F-02 Administrator user access | 1 | AC-F02-02, AC-F02-03 | TEST-F02-02, TEST-F02-03 |
| FR-06 | F-06 Overview, summary and history | 1 | AC-F06-01 | TEST-F06-01 |
| FR-07 | F-03 Opening balance | 1 | AC-F03-01, AC-F03-04 | TEST-F03-01, TEST-F03-04 |
| FR-08 | F-07 Account management | 2 | AC-F07-01, AC-F07-02, AC-F07-03, AC-F07-08 | TEST-F07-01, TEST-F07-02, TEST-F07-03, TEST-F07-08 |
| FR-09 | F-07 Account management | 2 | AC-F07-04, AC-F07-05, AC-F07-06, AC-F07-08 | TEST-F07-04, TEST-F07-05, TEST-F07-06, TEST-F07-08 |
| FR-10 | F-08 Opening balance management | 2 | AC-F08-01, AC-F08-02, AC-F08-03, AC-F08-04, AC-F08-06 | TEST-F08-01, TEST-F08-02, TEST-F08-03, TEST-F08-04, TEST-F08-06 |
| FR-11 | F-04 Receive money | 1 | AC-F04-01 | TEST-F04-01 |
| FR-12 | F-05 Make a payment or record a charge | 1 | AC-F05-01 | TEST-F05-01 |
| FR-13 | F-05 Make a payment or record a charge | 1 | AC-F05-02, AC-F05-06 | TEST-F05-02, TEST-F05-06 |
| FR-14 | F-09 Transfers | 2 | AC-F09-01, AC-F09-02, AC-F09-03, AC-F09-05, AC-F09-07 | TEST-F09-01, TEST-F09-02, TEST-F09-03, TEST-F09-05, TEST-F09-07 |
| FR-15 | F-10 Loans given and taken | 2 | AC-F10-01, AC-F10-02 | TEST-F10-01, TEST-F10-02 |
| FR-16 | F-10 Loans given and taken | 2 | AC-F10-03 | TEST-F10-03 |
| FR-17 | F-10 Loans given and taken | 2 | AC-F10-04, AC-F10-05, AC-F10-08 | TEST-F10-04, TEST-F10-05, TEST-F10-08 |
| FR-18 | F-06 Overview, summary and history | 1 | AC-F06-05 | TEST-F06-05 |
| FR-19 | F-12 Search and filter history | 2 | AC-F12-01, AC-F12-02, AC-F12-03, AC-F12-04, AC-F12-07 | TEST-F12-01, TEST-F12-02, TEST-F12-03, TEST-F12-04, TEST-F12-07 |
| FR-20 | F-11 Transaction corrections | 2 | AC-F11-01, AC-F11-02, AC-F11-03, AC-F11-04, AC-F11-10 | TEST-F11-01, TEST-F11-02, TEST-F11-03, TEST-F11-04, TEST-F11-10 |
| FR-21 | F-11 Transaction corrections | 2 | AC-F11-05, AC-F11-06, AC-F11-10 | TEST-F11-05, TEST-F11-06, TEST-F11-10 |
| FR-22 | F-13 Favourite transactions | 3 | AC-F13-01, AC-F13-02, AC-F13-05 | TEST-F13-01, TEST-F13-02, TEST-F13-05 |
| FR-23 | F-14 Duplicate transaction | 3 | AC-F14-01, AC-F14-02, AC-F14-03 | TEST-F14-01, TEST-F14-02, TEST-F14-03 |
| FR-24 | F-06 Overview, summary and history | 1 | AC-F06-02, AC-F06-07 | TEST-F06-02, TEST-F06-07 |
| FR-25 | F-06 Overview, summary and history | 1 | AC-F06-03, AC-F06-04 | TEST-F06-03, TEST-F06-04 |
| FR-26 | F-15 Category spending | 3 | AC-F15-01, AC-F15-02, AC-F15-03, AC-F15-06 | TEST-F15-01, TEST-F15-02, TEST-F15-03, TEST-F15-06 |
| FR-27 | F-16 Period reports | 3 | AC-F16-01, AC-F16-03, AC-F16-04, AC-F16-06 | TEST-F16-01, TEST-F16-03, TEST-F16-04, TEST-F16-06 |

### 1.2 Business rules
A rule shared by several features is verified in Sprint 1 where it first applies; later features that reuse it add their own AC in their sprint ("planned").

| REQ | Feature / responsibility | Sprint (establish / later verification) | AC (Sprint 1) | TEST (Sprint 1) |
|---|---|---|---|---|
| BR-01 | SR-02; F-04, F-05 (S1); F-11 (S2) | 1 / 2 | AC-F04-02, AC-F05-03 | TEST-F04-02, TEST-F05-03 |
| BR-02 | SR-02; F-03, F-04 (S1) | 1 | AC-F03-03, AC-F04-04 | TEST-F03-03, TEST-F04-04 |
| BR-03 | F-04, F-05 (S1); F-09, F-10 (S2) | 1 / 2 | AC-F04-03, AC-F05-04 | TEST-F04-03, TEST-F05-04 |
| BR-04 | F-04, F-05 (S1); F-07 archived accounts, F-09, F-10, F-11 (S2) | 1 / 2 | AC-F04-05, AC-F05-04, AC-F05-07 | TEST-F04-05, TEST-F05-04, TEST-F05-07 |
| BR-05 | SR-02; F-04, F-05 (S1); F-08, F-11 (S2) | 1 / 2 | AC-F04-01, AC-F04-06, AC-F05-01, AC-F05-02 | TEST-F04-01, TEST-F04-06, TEST-F05-01, TEST-F05-02 |
| BR-06 | F-03, F-05, F-06 (S1); F-09, F-10 (S2); F-15, F-16 (S3) | 1 / 2 / 3 | AC-F03-02, AC-F05-02, AC-F06-03 | TEST-F03-02, TEST-F05-02, TEST-F06-03 |
| BR-07 | F-05 (S1); F-09, F-11 (S2) | 1 / 2 | AC-F05-05 | TEST-F05-05 |
| BR-08 | F-05 card repayment (S1); F-10, F-11 (S2) | 1 / 2 | AC-F05-06 | TEST-F05-06 |
| BR-09 | F-04, F-05 (S1); F-11 (S2) | 1 / 2 | AC-F04-04 | TEST-F04-04 |
| BR-10 | F-03 (S1); F-08 (S2) | 1 / 2 | AC-F03-02, AC-F03-03, AC-F03-04 | TEST-F03-02, TEST-F03-03, TEST-F03-04 |
| BR-11 | SR-01; every user feature | 1 / every sprint | AC-F03-05, AC-F04-05, AC-F05-07, AC-F06-06 | TEST-F03-05, TEST-F04-05, TEST-F05-07, TEST-F06-06 |
| BR-12 | SR-01; F-01, F-02 | 1 / every sprint | AC-F02-04, AC-F02-05, AC-F06-06 | TEST-F02-04, TEST-F02-05, TEST-F06-06 |
| BR-13 | F-01, F-02 | 1 | AC-F01-03, AC-F02-02, AC-F02-03 | TEST-F01-03, TEST-F02-02, TEST-F02-03 |
| BR-14 | F-07 Account management | 2 | AC-F07-02, AC-F07-03 | TEST-F07-02, TEST-F07-03 (Sprint 2) |
| BR-15 | F-07 Account management | 2 | AC-F07-05, AC-F07-06 | TEST-F07-05, TEST-F07-06 (Sprint 2) |
| BR-16 | F-11 Transaction corrections | 2 | AC-F11-03, AC-F11-05, AC-F11-06 | TEST-F11-03, TEST-F11-05, TEST-F11-06 (Sprint 2) |
| BR-17 | F-14 Duplicate transaction | 3 | AC-F14-01, AC-F14-02 | TEST-F14-01, TEST-F14-02 |

### 1.3 Non-functional requirements
| REQ | Feature / responsibility | Sprint (establish / verify) | AC | TEST |
|---|---|---|---|---|
| NFR-01 | SR-01; F-01, F-02 | 1 / every sprint | AC-F01-05, AC-F02-06 | TEST-F01-05, TEST-F02-06 |
| NFR-02 | SR-01; all user features | 1 / every sprint | AC-F02-04, AC-F02-05, AC-F03-05, AC-F04-05, AC-F05-07, AC-F06-06 | (same IDs as AC) |
| NFR-03 | F-01 | 1 / 1 | AC-F01-06 | TEST-F01-06 |
| NFR-04 | F-01 | 1 / 1 | AC-F01-04, AC-F01-07 | TEST-F01-04, TEST-F01-07 |
| NFR-05 | SR-02 | 1 (integer satang) / 2 (1,000-transaction test) | AC-F05-01 (exact satang balances) | TEST-F05-01; Sprint 2: AC-F08-07 / TEST-NFR05-01 |
| NFR-06 | SR-02; F-04 | 1 / 1 | AC-F04-06 | TEST-F04-06 |
| NFR-07 | SR-03 | 2 (Lab 5) | planned | TEST-NFR07-01 (planned) |
| NFR-08 | SR-04 | 3 | planned | TEST-NFR08-01 (planned) |
| NFR-09 | SR-03 | 2 (Lab 5) | planned | TEST-NFR09-01 (planned) |
| NFR-10 | F-04, F-05 (S1); F-07 (S2) | 1 / 2 | AC-F04-07, AC-F05-08 | TEST-F04-07, TEST-F05-08 |
| NFR-11 | SR-03 | 1 / every release | Fresh-clone check (manual, recorded per release) | TEST-NFR11-01 |

## 2. Sprint 1 planned AC and tests
Short descriptions only; the contracts in `docs/sprints/sprint-1/` hold the full wording and may refine it (with revision history). Levels: unit, API-DB (Supertest against a real PostgreSQL test database), E2E (Playwright). "TDD" marks rule tests whose failing run must be kept in `evidence/d1/`.

| AC | Short description | TEST | Level | TDD | Test file::name | Result | Commit |
|---|---|---|---|---|---|---|---|
| AC-F01-01 | Valid login sets session cookie; `/me` returns id, username, display name, role | TEST-F01-01 | API-DB | | `server/tests/f01-auth.api.test.ts` | PASS | 56ac71d |
| AC-F01-02 | Wrong password or unknown username → 401 with the same generic message | TEST-F01-02 | API-DB | | `server/tests/f01-auth.api.test.ts` | PASS | 56ac71d |
| AC-F01-03 | Disabled user cannot log in (same generic 401) | TEST-F01-03 | API-DB | | `server/tests/f01-auth.api.test.ts` | PASS | 56ac71d |
| AC-F01-04 | After logout the old session token → 401 | TEST-F01-04 | API-DB | | `server/tests/f01-auth.api.test.ts` | PASS | 56ac71d |
| AC-F01-05 | Every protected endpoint without a session → 401, no private data in body | TEST-F01-05 | API-DB | | `server/tests/f01-auth.api.test.ts` | PASS | 56ac71d |
| AC-F01-06 | Stored password is a bcrypt hash (cost ≥ 10); no password/hash in any response | TEST-F01-06 | API-DB | | `server/tests/f01-auth.api.test.ts` | PASS | 56ac71d |
| AC-F01-07 | Session older than 8 hours → 401 | TEST-F01-07 | unit | | `server/tests/f01-session.unit.test.ts` | PASS | 56ac71d |
| AC-F01-08 | User logs in and out through the UI | TEST-F01-08 | E2E | | `e2e/f01-auth.spec.ts` | PASS | 56ac71d |
| AC-F02-01 | Admin lists users with username, display name, role, status, created date and no financial fields | TEST-F02-01 | API-DB | | `server/tests/f02-admin.api.test.ts` | PASS | 1090928 |
| AC-F02-02 | Admin disables a user → that user's existing session → 401 on next request; re-enable restores login | TEST-F02-02 | API-DB | | `server/tests/f02-admin.api.test.ts` | PASS | 1090928 |
| AC-F02-03 | Admin cannot disable own account → rejected, status unchanged | TEST-F02-03 | API-DB | | `server/tests/f02-admin.api.test.ts` | PASS | 1090928 |
| AC-F02-04 | Admin calls any financial endpoint → 403 | TEST-F02-04 | API-DB | | `server/tests/f02-admin.api.test.ts` | PASS | 1090928 |
| AC-F02-05 | User calls any admin endpoint → 403 | TEST-F02-05 | API-DB | | `server/tests/f02-admin.api.test.ts` | PASS | 1090928 |
| AC-F02-06 | Admin endpoints without a session → 401 | TEST-F02-06 | API-DB | | `server/tests/f02-admin.api.test.ts` | PASS | 1090928 |
| AC-F03-01 | Set opening balance and date on seeded Bank → balance shows the amount | TEST-F03-01 | API-DB | | `server/tests/f03-accounts.api.test.ts` | PASS | 3f3aae5 |
| AC-F03-02 | Setting an opening balance creates no transaction/line row (summary-level check: AC-F06-03) | TEST-F03-02 | API-DB | TDD | `server/tests/f03-accounts.api.test.ts` | PASS | b2a4f70 |
| AC-F03-03 | Negative, > 2 decimals or > 999,999,999.99 → 422, nothing stored | TEST-F03-03 | unit + API-DB | | `server/tests/f03-accounts.api.test.ts`, `server/tests/f03-accounts.unit.test.ts` | PASS | 3f3aae5 |
| AC-F03-04 | Opening balance on INCOME/EXPENSE account, or a second opening balance → rejected | TEST-F03-04 | API-DB | | `server/tests/f03-accounts.api.test.ts` | PASS | 3f3aae5 |
| AC-F03-05 | Opening balance on another user's account → 404, nothing stored | TEST-F03-05 | API-DB | | `server/tests/f03-accounts.api.test.ts` | PASS | 3f3aae5 |
| AC-F04-01 | RECEIPT Bank ← Salary → Bank +x, Salary period total +x, transaction stored with its line | TEST-F04-01 | API-DB | | `server/tests/f04-transactions.api.test.ts` | PASS | b2a4f70 |
| AC-F04-02 | Line sum ≠ total → 422, nothing stored | TEST-F04-02 | unit + API-DB | TDD | `server/tests/f04-transactions.api.test.ts`, `server/tests/f04-ledger.unit.test.ts` | PASS | b2a4f70 |
| AC-F04-03 | RECEIPT into a LOAN_TAKEN (credit card) account → 422 | TEST-F04-03 | unit + API-DB | TDD | `server/tests/f04-transactions.api.test.ts`, `server/tests/f04-ledger.unit.test.ts` | PASS | b2a4f70 |
| AC-F04-04 | Line amount ≤ 0, > 2 decimals, future date or date before 2000-01-01 → 422 | TEST-F04-04 | unit + API-DB | | `server/tests/f04-transactions.api.test.ts`, `server/tests/f04-ledger.unit.test.ts` | PASS | b2a4f70 |
| AC-F04-05 | Primary or line account belongs to another user → 404, nothing stored | TEST-F04-05 | API-DB | | `server/tests/f04-transactions.api.test.ts` | PASS | b2a4f70 |
| AC-F04-06 | Injected failure after first line insert → no transaction, lines or balance change | TEST-F04-06 | API-DB | | `server/tests/f04-transactions.api.test.ts` | PASS | b2a4f70 |
| AC-F04-07 | Receive-money form shows field errors and the line-total mismatch before submit, keeping entered values | TEST-F04-07 | E2E | | `e2e/f04-receive.spec.ts` | PASS | b2a4f70 |
| AC-F05-01 | Card charge ฿1,200 = Dining ฿700 + Groceries ฿500 → card debt +1,200.00, Dining +700.00, Groceries +500.00 | TEST-F05-01 | unit + API-DB | | `server/tests/f05-transactions.api.test.ts`, `server/tests/f05-ledger.unit.test.ts` | PASS | 6f52657 |
| AC-F05-02 | PAYMENT Bank → card ฿1,200 → Bank −1,200, card debt −1,200, expense total unchanged | TEST-F05-02 | unit + API-DB | TDD | `server/tests/f05-transactions.api.test.ts`, `server/tests/f05-ledger.unit.test.ts` | PASS | 6f52657 |
| AC-F05-03 | PAYMENT with line sum ≠ total → 422, nothing stored | TEST-F05-03 | API-DB | | `server/tests/f05-transactions.api.test.ts` | PASS | 6f52657 |
| AC-F05-04 | PAYMENT primary of type INCOME/EXPENSE/LOAN_GIVEN, line equal to primary, or same account in two lines → 422 | TEST-F05-04 | unit + API-DB | | `server/tests/f05-transactions.api.test.ts`, `server/tests/f05-ledger.unit.test.ts` | PASS | 6f52657 |
| AC-F05-05 | PAYMENT from Bank larger than Bank balance → 422 (BR-07) | TEST-F05-05 | unit + API-DB | TDD | `server/tests/f05-transactions.api.test.ts`, `server/tests/f05-ledger.unit.test.ts` | PASS | 6f52657 |
| AC-F05-06 | Card repayment larger than card debt → 422 (BR-08) | TEST-F05-06 | API-DB | | `server/tests/f05-transactions.api.test.ts`, `server/tests/f05-ledger.unit.test.ts` | PASS | 6f52657 |
| AC-F05-07 | PAYMENT using another user's account → 404, nothing stored | TEST-F05-07 | API-DB | | `server/tests/f05-transactions.api.test.ts` | PASS | 6f52657 |
| AC-F05-08 | Payment form shows field errors and the line-total mismatch before submit, keeping entered values | TEST-F05-08 | E2E | | `e2e/f05-pay.spec.ts` | PASS | 6f52657 |
| AC-F06-01 | Own accounts grouped by type with balance (CASH/LOAN) or period total (INCOME/EXPENSE) | TEST-F06-01 | API-DB | | `server/tests/f06-overview.api.test.ts` | PASS | 7850d4e |
| AC-F06-02 | Overview shows each CASH balance, outstanding LOAN_TAKEN (card debt) and LOAN_GIVEN | TEST-F06-02 | API-DB | | `server/tests/f06-overview.api.test.ts` | PASS | 7850d4e |
| AC-F06-03 | Month summary after the Sprint 1 scenario: income = salary, expense = 1,200, opening and card repayment excluded | TEST-F06-03 | API-DB | TDD | `server/tests/f06-overview.api.test.ts` | PASS | 7850d4e |
| AC-F06-04 | Month boundary uses Asia/Bangkok (a transaction dated the 1st is in that month) | TEST-F06-04 | unit | | `server/tests/f06-period.unit.test.ts, server/tests/f06-overview.api.test.ts` | PASS | 7850d4e |
| AC-F06-05 | History newest first, 50 per page; detail shows lines | TEST-F06-05 | API-DB | | `server/tests/f06-overview.api.test.ts` | PASS | 7850d4e |
| AC-F06-06 | User A requests B's transaction → 404; admin requests overview/history → 403 | TEST-F06-06 | API-DB | | `server/tests/f06-overview.api.test.ts` | PASS | 7850d4e |
| AC-F06-07 | Full Sprint 1 journey in the UI (login → opening balance → salary → card purchase → card repayment → overview), still shown after reload | TEST-F06-07 | E2E | | `e2e/f06-journey.spec.ts` | PASS | 7850d4e |

## 2b. Sprint 2 AC and tests
Short descriptions; full wording in `docs/sprints/sprint-2/` (v0.1, D2-S1). Evidence folder: `evidence/d2/`.

| AC | Short description | TEST | Level | TDD | Test file::name | Result | Commit |
|---|---|---|---|---|---|---|---|
| AC-F07-01 | When alice posts each of the five types (Wallet CASH, Loan to Ken LOAN_GIVEN, Loan from Mom LOAN_TAKEN, Interest … | TEST-F07-01 | API-DB |  | `server/tests/f07-accounts.api.test.ts::TEST-F07-01` | PASS | 3a75c2f |
| AC-F07-02 | Name "" , "   " or 51 characters → 422 VALIDATION_FAILED (details.name) and no account is created; a 50-character … | TEST-F07-02 | unit + API-DB |  | `server/tests/f07-accounts.api.test.ts::TEST-F07-02`, `server/tests/f07-accounts.unit.test.ts::TEST-F07-02` | PASS | 3a75c2f |
| AC-F07-03 | Given alice has Bank (CASH), creating "bank" CASH → 409 and no account is created; creating "Bank" EXPENSE → 201; … | TEST-F07-03 | API-DB | yes | `server/tests/f07-accounts.api.test.ts::TEST-F07-03` | PASS | 3a75c2f |
| AC-F07-04 | When alice renames Dining to "Food & drinks", then 200, and GET /api/transactions/:id of an earlier card purchase … | TEST-F07-04 | API-DB |  | `server/tests/f07-accounts.api.test.ts::TEST-F07-04` | PASS | 3a75c2f |
| AC-F07-05 | Given Bank balance 0, archiving Bank → 200 archived: true; given Bank balance 1, archiving → 422 RULE_VIOLATION … | TEST-F07-05 | API-DB | yes | `server/tests/f07-accounts.api.test.ts::TEST-F07-05` | PASS | 3a75c2f |
| AC-F07-06 | Given Telecom is archived, a PAYMENT with a Telecom line, or a RECEIPT into an archived Wallet, → 404 and nothing … | TEST-F07-06 | API-DB |  | `server/tests/f07-accounts.api.test.ts::TEST-F07-06` | PASS | 3a75c2f |
| AC-F07-07 | Without a session POST /api/accounts and PATCH /api/accounts/:id → 401; as admin → 403; alice PATCH on bob's Bank … | TEST-F07-07 | API-DB |  | `server/tests/f07-accounts.api.test.ts::TEST-F07-07` | PASS | 3a75c2f |
| AC-F07-08 | In the browser on /accounts, alice creates "Wallet" (Cash) and sees it under Cash; creating "wallet" again shows … | TEST-F07-08 | E2E |  | `e2e/f07-accounts.spec.ts::TEST-F07-08` | PASS | 3a75c2f |
| AC-F08-01 | Given Bank opening 1000000 and a RECEIPT of 500000 (Bank 1500000), when alice patches the opening balance to … | TEST-F08-01 | API-DB |  | `server/tests/f08-opening-balance.api.test.ts::TEST-F08-01` | PASS | c341d6d |
| AC-F08-02 | Given Bank opening 1000000 and a PAYMENT of 800000 (Bank 200000), patching the opening balance to 799999 → 422 … | TEST-F08-02 | unit + API-DB | yes | `server/tests/f08-opening-balance.api.test.ts::TEST-F08-02`, `server/tests/f08-opening-balance.unit.test.ts::TEST-F08-02` | PASS | c341d6d |
| AC-F08-03 | Given Credit Card opening debt 500000 and a repayment of 300000 (debt 200000), patching the opening to 299999 → … | TEST-F08-03 | API-DB | yes | `server/tests/f08-opening-balance.api.test.ts::TEST-F08-03` | PASS | c341d6d |
| AC-F08-04 | Amount −1, 1.5 or 100000000000, or date "2026-02-30" → 422 VALIDATION_FAILED; Salary (INCOME) → 422 … | TEST-F08-04 | API-DB |  | `server/tests/f08-opening-balance.api.test.ts::TEST-F08-04` | PASS | c341d6d |
| AC-F08-05 | Without a session → 401; as admin → 403; alice patching bob's Bank → 404 and bob's Bank is unchanged. | TEST-F08-05 | API-DB |  | `server/tests/f08-opening-balance.api.test.ts::TEST-F08-05` | PASS | c341d6d |
| AC-F08-06 | In the browser on /accounts, "Edit opening balance" on Bank opens the form with the current amount and date; … | TEST-F08-06 | E2E |  | `e2e/f08-opening-balance.spec.ts::TEST-F08-06` | PASS | c341d6d |
| AC-F08-07 | (NFR-05) After a seeded run of 1,000 random valid operations covering every form, every allowed line type, … | TEST-NFR05-01 | API-DB |  | — | NOT RUN | — |
| AC-F09-01 | Given Bank 1000000 and Wallet 0, a PAYMENT from Bank with one Wallet line 300000 → 201, Bank 700000, Wallet … | TEST-F09-01 | unit + API-DB | yes | — | NOT RUN | — |
| AC-F09-02 | Given Bank 700000 and Wallet 300000, a RECEIPT into Wallet with one Bank line 200000 → 201, Bank 500000, Wallet … | TEST-F09-02 | unit + API-DB |  | — | NOT RUN | — |
| AC-F09-03 | Given Bank 500000, a RECEIPT into Wallet with a Bank line 500001 → 422 RULE_VIOLATION … | TEST-F09-03 | unit + API-DB | yes | — | NOT RUN | — |
| AC-F09-04 | A PAYMENT from Bank with a Bank line → 422; with bob's Wallet as a line → 404 and bob's Wallet is unchanged; with … | TEST-F09-04 | API-DB |  | — | NOT RUN | — |
| AC-F09-05 | Given card debt 0 and Wallet 0, a PAYMENT from Credit Card with a Wallet line 100000 → 201, debt 100000, Wallet … | TEST-F09-05 | API-DB |  | — | NOT RUN | — |
| AC-F09-06 | A PAYMENT from Bank total 150000 with lines Dining 50000 + Wallet 100000 → 201, Bank −150000, Wallet +100000, and … | TEST-F09-06 | API-DB |  | — | NOT RUN | — |
| AC-F09-07 | In the browser, alice records a transfer Bank → Wallet on /pay using the "Transfer to my cash account" group; a … | TEST-F09-07 | E2E |  | — | NOT RUN | — |
| AC-F10-01 | Given Bank 1000000 and "Loan to Ken" 0, a PAYMENT from Bank with a Ken line 200000 → 201, Bank 800000, Ken 200000, … | TEST-F10-01 | unit + API-DB |  | — | NOT RUN | — |
| AC-F10-02 | Given Ken 200000, a RECEIPT into Bank with a Ken line 150000 → 201, Ken 50000, income unchanged; then a Ken line … | TEST-F10-02 | unit + API-DB | yes | — | NOT RUN | — |
| AC-F10-03 | Given "Loan from Mom" 0, a RECEIPT into Bank with a Mom line 500000 → 201, Mom debt 500000, Bank +500000, income … | TEST-F10-03 | API-DB |  | — | NOT RUN | — |
| AC-F10-04 | A RECEIPT into Bank total 3050000 with Salary 3000000 + Ken 50000 (Ken owes 50000) → 201, income +3000000 exactly, … | TEST-F10-04 | API-DB | yes | — | NOT RUN | — |
| AC-F10-05 | A PAYMENT from Bank total 100000 with lines Dining 10000 + Credit Card 20000 (debt ≥ 20000) + Ken 30000 + Wallet … | TEST-F10-05 | API-DB |  | — | NOT RUN | — |
| AC-F10-06 | Every (form, primary type, line type) combination outside SRS §4.2 → 422 RULE_VIOLATION, including RECEIPT with an … | TEST-F10-06 | unit + API-DB |  | — | NOT RUN | — |
| AC-F10-07 | After AC-F10-01 and AC-F10-03, GET /api/overview shows loanGiven.total = 200000 and loanTaken includes Loan from … | TEST-F10-07 | API-DB |  | — | NOT RUN | — |
| AC-F10-08 | In the browser, on /receive alice records Salary + a repayment from Ken in one transaction; the footer shows the … | TEST-F10-08 | E2E |  | — | NOT RUN | — |
| AC-F11-01 | Given a PAYMENT from Credit Card total 120000 (Dining 70000 + Groceries 50000) and debt 120000, editing it to … | TEST-F11-01 | unit + API-DB | yes | — | NOT RUN | — |
| AC-F11-02 | Given a RECEIPT of 500000 into Bank (Salary line), editing the primary to Wallet and the date and note → 200, Bank … | TEST-F11-02 | API-DB |  | — | NOT RUN | — |
| AC-F11-03 | Editing with lines ≠ total, a future date, a changed form, or a line equal to the primary → 422; the transaction, … | TEST-F11-03 | API-DB |  | — | NOT RUN | — |
| AC-F11-04 | Given Bank opening 0, a RECEIPT 500000 into Bank, then a PAYMENT 400000 from Bank (Bank 100000): editing the … | TEST-F11-04 | API-DB | yes | — | NOT RUN | — |
| AC-F11-05 | Voiding a PAYMENT of 120000 from Bank → 200 status: "VOID", Bank +120000, the month's expense drops by 120000, the … | TEST-F11-05 | API-DB | yes | — | NOT RUN | — |
| AC-F11-06 | Given a RECEIPT 1000000 into Bank and a PAYMENT 800000 from Bank, voiding the receipt → 422 (details.total names … | TEST-F11-06 | API-DB | yes | — | NOT RUN | — |
| AC-F11-07 | Given a PAYMENT from Wallet that was later balanced to 0 and archived, voiding that payment → 422 "Unarchive … | TEST-F11-07 | API-DB |  | — | NOT RUN | — |
| AC-F11-08 | Without a session PUT and void → 401; as admin → 403; alice editing or voiding bob's transaction → 404 and bob's … | TEST-F11-08 | API-DB |  | — | NOT RUN | — |
| AC-F11-09 | (NFR-06) When the balance update step throws during an edit (test spy on postingSteps), the response is 500 and … | TEST-F11-09 | API-DB |  | — | NOT RUN | — |
| AC-F11-10 | In the browser, alice opens a payment's detail, edits the amount, sees the updated detail and Overview balance; … | TEST-F11-10 | E2E |  | — | NOT RUN | — |
| AC-F12-01 | Given alice's transactions dated 2026-10-31, 2026-11-01, 2026-11-15 and 2026-11-30, from=2026-11-01&to=2026-11-30 … | TEST-F12-01 | API-DB |  | `server/tests/f12-search.api.test.ts::TEST-F12-01` | PASS | 63d377b |
| AC-F12-02 | accountId = Dining returns the card purchases that have a Dining line although their primary is Credit Card; … | TEST-F12-02 | API-DB | yes | `server/tests/f12-search.api.test.ts::TEST-F12-02` | PASS | 63d377b |
| AC-F12-03 | form=RECEIPT returns only receipts; status=VOID returns only voided transactions; minAmount=50000&maxAmount=120000 … | TEST-F12-03 | API-DB |  | `server/tests/f12-search.api.test.ts::TEST-F12-03` | PASS | 63d377b |
| AC-F12-04 | q=LUNCH matches notes "Team lunch" and "lunch with Ken" but not "Launch"; q=% matches only notes containing a … | TEST-F12-04 | unit + API-DB |  | `server/tests/f12-search.api.test.ts::TEST-F12-04`, `server/tests/f12-search.unit.test.ts::TEST-F12-04` | PASS | 63d377b |
| AC-F12-05 | from=2026-11-30&to=2026-11-01, from=2026-13-01, minAmount=-1, minAmount=10&maxAmount=5, accountId=abc, … | TEST-F12-05 | unit + API-DB |  | `server/tests/f12-search.api.test.ts::TEST-F12-05`, `server/tests/f12-search.unit.test.ts::TEST-F12-05` | PASS | 63d377b |
| AC-F12-06 | Without a session → 401; as admin → 403; when bob has a transaction with note "secret lunch", alice's q=secret … | TEST-F12-06 | API-DB |  | `server/tests/f12-search.api.test.ts::TEST-F12-06` | PASS | 63d377b |
| AC-F12-07 | In the browser, alice filters History by Account Dining and Text "lunch"; only matching rows show; after reloading … | TEST-F12-07 | E2E |  | `e2e/f12-search.spec.ts::TEST-F12-07` | PASS | 63d377b |

## 2c. Sprint 3 AC and tests
Short descriptions; full wording in `docs/sprints/sprint-3/` (v0.1, D2-S5). F-15 is delivered first (D-16).

| AC | Short description | TEST | Level | TDD | Test file::name | Result | Commit |
|---|---|---|---|---|---|---|---|
| AC-F13-01 | When alice marks her payment as favourite → 200 isFavorite: true; GET /api/transactions?favorite=true returns … | TEST-F13-01 | API-DB |  | — | NOT RUN | — |
| AC-F13-02 | Marking a VOID transaction → 422 RULE_VIOLATION and the flag stays false; a favourite that is then voided is no … | TEST-F13-02 | API-DB | yes | — | NOT RUN | — |
| AC-F13-03 | favorite=yes → 422 naming favorite; body { "favorite": "true" } → 400. | TEST-F13-03 | unit + API-DB |  | — | NOT RUN | — |
| AC-F13-04 | Without a session → 401; as admin → 403; alice marking bob's transaction → 404 and bob's flag is unchanged; bob's … | TEST-F13-04 | API-DB |  | — | NOT RUN | — |
| AC-F13-05 | In the browser, alice adds a transaction to favourites from its detail page, sees it on Favourites, removes it, … | TEST-F13-05 | E2E |  | — | NOT RUN | — |
| AC-F14-01 | toDuplicateDraft of a PAYMENT dated 2026-11-01 with lines Dining 70000 + Groceries 50000, note "Weekend" and … | TEST-F14-01 | unit | yes | — | NOT RUN | — |
| AC-F14-02 | In the browser, Duplicate on a payment opens /pay?duplicate=:id with the values pre-filled and today's date; … | TEST-F14-02 | E2E |  | — | NOT RUN | — |
| AC-F14-03 | Duplicate of a VOID receipt opens /receive pre-filled and saves as a new POSTED transaction. | TEST-F14-03 | E2E |  | — | NOT RUN | — |
| AC-F14-04 | When the source uses an archived account, the form leaves that field empty and lists the archived name in the … | TEST-F14-04 | E2E |  | — | NOT RUN | — |
| AC-F15-01 | Given alice's card purchase in November with Dining 70000 + Groceries 50000, GET … | TEST-F15-01 | unit + API-DB | yes | `server/tests/f15-categories.api.test.ts::TEST-F15-01`, `server/tests/f15-categories.unit.test.ts::TEST-F15-01` | PASS | 0e291ae |
| AC-F15-02 | In the same period alice also records a card repayment from Bank, a Salary receipt and a VOID payment with a … | TEST-F15-02 | API-DB | yes | `server/tests/f15-categories.api.test.ts::TEST-F15-02` | PASS | 0e291ae |
| AC-F15-03 | Lines dated 2026-10-31 and 2026-12-01 are excluded and lines dated 2026-11-01 and 2026-11-30 are included; an … | TEST-F15-03 | API-DB |  | `server/tests/f15-categories.api.test.ts::TEST-F15-03` | PASS | 0e291ae |
| AC-F15-04 | from=2026-11-30&to=2026-11-01 or from=2026-13-01 → 422 VALIDATION_FAILED naming the parameter. | TEST-F15-04 | API-DB |  | `server/tests/f15-categories.api.test.ts::TEST-F15-04` | PASS | 0e291ae |
| AC-F15-05 | Without a session → 401; as admin → 403; bob's spending never appears in alice's result. | TEST-F15-05 | API-DB |  | `server/tests/f15-categories.api.test.ts::TEST-F15-05` | PASS | 0e291ae |
| AC-F15-06 | In the browser, alice opens Reports and sees her category rows with amounts and percentages for the current month; … | TEST-F15-06 | E2E |  | `e2e/f15-reports.spec.ts::TEST-F15-06` | PASS | 0e291ae |
| AC-F16-01 | Given a Salary receipt 3000000 on 2026-11-05 and a card purchase 120000 on 2026-11-06, … | TEST-F16-01 | API-DB | yes | — | NOT RUN | — |
| AC-F16-02 | A card repayment, a transfer, an opening balance and a VOID transaction in November do not change November's … | TEST-F16-02 | API-DB | yes | — | NOT RUN | — |
| AC-F16-03 | A transaction dated 2026-10-31 counts in October and one dated 2026-11-01 counts in November. | TEST-F16-03 | API-DB |  | — | NOT RUN | — |
| AC-F16-04 | fromMonth=2025-12&toMonth=2026-11 (12 months) → 200 with 12 items; fromMonth=2025-11&toMonth=2026-11 (13) → 422; … | TEST-F16-04 | unit + API-DB |  | — | NOT RUN | — |
| AC-F16-05 | Without a session → 401; as admin → 403; bob's transactions never change alice's figures. | TEST-F16-05 | API-DB |  | — | NOT RUN | — |
| AC-F16-06 | In the browser, alice opens Reports and sees the default 6-month table with the current month's income and … | TEST-F16-06 | E2E |  | — | NOT RUN | — |

## 3. Coverage gaps
| Gap | Affects | Plan |
|---|---|---|
| No requirement is without a feature/responsibility and sprint. | — | — |
| D-03 (CASH cannot go negative, BR-07) accepted by team but not yet confirmed by TA (Q-01). | BR-07, AC-F05-05 | Ask TA before D1-S4 freezes F-05; a different answer becomes a CHG. |
| ~~Q-03~~ resolved as D-10 (SRS v0.5): editing allowed after transactions, rejected if the balance would go negative. | FR-10, F-08 | AC-F08-02, AC-F08-03. |
| Q-02: administrator aggregate statistics — no requirement exists; current answer is "none". | — | Close as "no" unless the team adds an FR. |
| Sprint 1 accepts only RECEIPT←INCOME and PAYMENT→EXPENSE/LOAN_TAKEN lines; other §4.2 line types return 422 until F-09/F-10 (decided D1-S4). | BR-03, FR-14–17 | Resolved by the Sprint 2 contracts: F-09 (CASH lines), F-10 (LOAN lines, full table, AC-F10-06). |
| NFR-07 and NFR-09 cannot be verified before Lab 5 deployment/CI. | SR-03 | Verified in Sprint 2 (Lab 5 evidence). |
| NFR-08 is verified only in Sprint 3. | SR-04 | Scripted measurement on the deployed RC. |

## 4. Approved changes
None yet. Changes approved by the TA are listed here with their CHG-ID (details in `docs/changes.md`).

| CHG | Summary | Affected REQ / F / AC | Approved | Version |
|---|---|---|---|---|

## 5. Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial traceability for SRS v0.2 and features v0.1 | D1-S2 baseline |
| 0.2 | 2026-11-07 | Aligned with Sprint 1 contracts: AC-F03-02 wording; Sprint 1 line-type gap resolved | D1-S4 |
| 0.3 | 2026-11-12 | Record test results for F-03 (AC-F03-01..05) on commit 3f3aae5 | D1-S6a |
| 0.4 | 2026-11-13 | Mark AC-F03-02 INCOMPLETE pending F-04 tables per PR #16 review | Team review |
| 0.5 | 2026-11-13 | Record test results for F-04 (AC-F04-01..07) and close AC-F03-02 as PASS | D1-S6b |
| 0.6 | 2026-11-14 | Add AC-F05-08 / TEST-F05-08 to NFR-10 and Sprint 1 table; record commit 6f52657 for F-05 | PR #18 review |
| 0.7 | 2026-11-22 | Sprint 2 contracts (F-07–F-12): AC/TEST IDs for FR-08–10, FR-14–17, FR-19–21, BR-14–16, NFR-05; new §2b; Q-03 and line-type gaps closed | D2-S1 |
| 0.8 | 2026-11-23 | F-07 results: AC-F07-01..08 PASS on `3a75c2f` | D2-S2 |
| 0.9 | 2026-11-23 | F-08 results: AC-F08-01..06 PASS on `c341d6d`; AC-F08-07 NOT RUN (needs F-09–F-11) | D2-S3 |
| 0.10 | 2026-11-24 | F-12 results: AC-F12-01..07 PASS on `63d377b` | D2-S4 |
| 0.11 | 2026-11-25 | Sprint 3 contracts (F-13–F-16): AC/TEST IDs for FR-22, FR-23, FR-26, FR-27, BR-17; new §2c (21 rows) | D2-S5 |
| 0.12 | 2026-11-25 | F-15 results: AC-F15-01..06 PASS on `0e291ae` | D2-S6 |
