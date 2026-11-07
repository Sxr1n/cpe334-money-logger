# Traceability — Requirement → Feature → Sprint → AC → Test

| Item | Value |
|---|---|
| Sources | `docs/srs.md` v0.2, `docs/features.md` v0.1 |
| Document version | 0.2 |
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
| FR-08 | F-07 Account management | 2 | planned | planned |
| FR-09 | F-07 Account management | 2 | planned | planned |
| FR-10 | F-08 Opening balance management | 2 | planned | planned |
| FR-11 | F-04 Receive money | 1 | AC-F04-01 | TEST-F04-01 |
| FR-12 | F-05 Make a payment or record a charge | 1 | AC-F05-01 | TEST-F05-01 |
| FR-13 | F-05 Make a payment or record a charge | 1 | AC-F05-02, AC-F05-06 | TEST-F05-02, TEST-F05-06 |
| FR-14 | F-09 Transfers | 2 | planned | planned |
| FR-15 | F-10 Loans given and taken | 2 | planned | planned |
| FR-16 | F-10 Loans given and taken | 2 | planned | planned |
| FR-17 | F-10 Loans given and taken | 2 | planned | planned |
| FR-18 | F-06 Overview, summary and history | 1 | AC-F06-05 | TEST-F06-05 |
| FR-19 | F-12 Search and filter history | 2 | planned | planned |
| FR-20 | F-11 Transaction corrections | 2 | planned | planned |
| FR-21 | F-11 Transaction corrections | 2 | planned | planned |
| FR-22 | F-13 Favourite transactions | 3 | planned | planned |
| FR-23 | F-14 Duplicate transaction | 3 | planned | planned |
| FR-24 | F-06 Overview, summary and history | 1 | AC-F06-02, AC-F06-07 | TEST-F06-02, TEST-F06-07 |
| FR-25 | F-06 Overview, summary and history | 1 | AC-F06-03, AC-F06-04 | TEST-F06-03, TEST-F06-04 |
| FR-26 | F-15 Category spending | 3 | planned | planned |
| FR-27 | F-16 Period reports | 3 | planned | planned |

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
| BR-14 | F-07 Account management | 2 | planned | planned |
| BR-15 | F-07 Account management | 2 | planned | planned |
| BR-16 | F-11 Transaction corrections | 2 | planned | planned |
| BR-17 | F-14 Duplicate transaction | 3 | planned | planned |

### 1.3 Non-functional requirements
| REQ | Feature / responsibility | Sprint (establish / verify) | AC | TEST |
|---|---|---|---|---|
| NFR-01 | SR-01; F-01, F-02 | 1 / every sprint | AC-F01-05, AC-F02-06 | TEST-F01-05, TEST-F02-06 |
| NFR-02 | SR-01; all user features | 1 / every sprint | AC-F02-04, AC-F02-05, AC-F03-05, AC-F04-05, AC-F05-07, AC-F06-06 | (same IDs as AC) |
| NFR-03 | F-01 | 1 / 1 | AC-F01-06 | TEST-F01-06 |
| NFR-04 | F-01 | 1 / 1 | AC-F01-04, AC-F01-07 | TEST-F01-04, TEST-F01-07 |
| NFR-05 | SR-02 | 1 (integer satang) / 2 (1,000-transaction test) | AC-F05-01 (exact satang balances) | TEST-F05-01; Sprint 2: TEST-NFR05-01 (planned) |
| NFR-06 | SR-02; F-04 | 1 / 1 | AC-F04-06 | TEST-F04-06 |
| NFR-07 | SR-03 | 2 (Lab 5) | planned | TEST-NFR07-01 (planned) |
| NFR-08 | SR-04 | 3 | planned | TEST-NFR08-01 (planned) |
| NFR-09 | SR-03 | 2 (Lab 5) | planned | TEST-NFR09-01 (planned) |
| NFR-10 | F-04, F-05 (S1); F-07 (S2) | 1 / 2 | AC-F04-07 | TEST-F04-07 |
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
| AC-F03-01 | Set opening balance and date on seeded Bank → balance shows the amount | TEST-F03-01 | API-DB | | — | NOT RUN | — |
| AC-F03-02 | Setting an opening balance creates no transaction/line row (summary-level check: AC-F06-03) | TEST-F03-02 | API-DB | TDD | — | NOT RUN | — |
| AC-F03-03 | Negative, > 2 decimals or > 999,999,999.99 → 422, nothing stored | TEST-F03-03 | unit + API-DB | | — | NOT RUN | — |
| AC-F03-04 | Opening balance on INCOME/EXPENSE account, or a second opening balance → rejected | TEST-F03-04 | API-DB | | — | NOT RUN | — |
| AC-F03-05 | Opening balance on another user's account → 404, nothing stored | TEST-F03-05 | API-DB | | — | NOT RUN | — |
| AC-F04-01 | RECEIPT Bank ← Salary → Bank +x, Salary period total +x, transaction stored with its line | TEST-F04-01 | API-DB | | — | NOT RUN | — |
| AC-F04-02 | Line sum ≠ total → 422, nothing stored | TEST-F04-02 | unit + API-DB | TDD | — | NOT RUN | — |
| AC-F04-03 | RECEIPT into a LOAN_TAKEN (credit card) account → 422 | TEST-F04-03 | unit + API-DB | TDD | — | NOT RUN | — |
| AC-F04-04 | Line amount ≤ 0, > 2 decimals, future date or date before 2000-01-01 → 422 | TEST-F04-04 | unit + API-DB | | — | NOT RUN | — |
| AC-F04-05 | Primary or line account belongs to another user → 404, nothing stored | TEST-F04-05 | API-DB | | — | NOT RUN | — |
| AC-F04-06 | Injected failure after first line insert → no transaction, lines or balance change | TEST-F04-06 | API-DB | | — | NOT RUN | — |
| AC-F04-07 | Receive-money form shows field errors and the line-total mismatch before submit, keeping entered values | TEST-F04-07 | E2E | | — | NOT RUN | — |
| AC-F05-01 | Card charge ฿1,200 = Dining ฿700 + Groceries ฿500 → card debt +1,200.00, Dining +700.00, Groceries +500.00 | TEST-F05-01 | unit + API-DB | | — | NOT RUN | — |
| AC-F05-02 | PAYMENT Bank → card ฿1,200 → Bank −1,200, card debt −1,200, expense total unchanged | TEST-F05-02 | unit + API-DB | TDD | — | NOT RUN | — |
| AC-F05-03 | PAYMENT with line sum ≠ total → 422, nothing stored | TEST-F05-03 | API-DB | | — | NOT RUN | — |
| AC-F05-04 | PAYMENT primary of type INCOME/EXPENSE/LOAN_GIVEN, line equal to primary, or same account in two lines → 422 | TEST-F05-04 | unit + API-DB | | — | NOT RUN | — |
| AC-F05-05 | PAYMENT from Bank larger than Bank balance → 422 (BR-07) | TEST-F05-05 | unit + API-DB | TDD | — | NOT RUN | — |
| AC-F05-06 | Card repayment larger than card debt → 422 (BR-08) | TEST-F05-06 | API-DB | | — | NOT RUN | — |
| AC-F05-07 | PAYMENT using another user's account → 404, nothing stored | TEST-F05-07 | API-DB | | — | NOT RUN | — |
| AC-F06-01 | Own accounts grouped by type with balance (CASH/LOAN) or period total (INCOME/EXPENSE) | TEST-F06-01 | API-DB | | — | NOT RUN | — |
| AC-F06-02 | Overview shows each CASH balance, outstanding LOAN_TAKEN (card debt) and LOAN_GIVEN | TEST-F06-02 | API-DB | | — | NOT RUN | — |
| AC-F06-03 | Month summary after the Sprint 1 scenario: income = salary, expense = 1,200, opening and card repayment excluded | TEST-F06-03 | API-DB | TDD | — | NOT RUN | — |
| AC-F06-04 | Month boundary uses Asia/Bangkok (a transaction dated the 1st is in that month) | TEST-F06-04 | unit | | — | NOT RUN | — |
| AC-F06-05 | History newest first, 50 per page; detail shows lines | TEST-F06-05 | API-DB | | — | NOT RUN | — |
| AC-F06-06 | User A requests B's transaction → 404; admin requests overview/history → 403 | TEST-F06-06 | API-DB | | — | NOT RUN | — |
| AC-F06-07 | Full Sprint 1 journey in the UI (login → opening balance → salary → card purchase → card repayment → overview), still shown after reload | TEST-F06-07 | E2E | | — | NOT RUN | — |

## 3. Coverage gaps
| Gap | Affects | Plan |
|---|---|---|
| No requirement is without a feature/responsibility and sprint. | — | — |
| D-03 (CASH cannot go negative, BR-07) accepted by team but not yet confirmed by TA (Q-01). | BR-07, AC-F05-05 | Ask TA before D1-S4 freezes F-05; a different answer becomes a CHG. |
| Q-03: may an opening balance be edited after transactions exist? | FR-10, F-08 | Decide before the Sprint 2 contract of F-08. |
| Q-02: administrator aggregate statistics — no requirement exists; current answer is "none". | — | Close as "no" unless the team adds an FR. |
| Sprint 1 accepts only RECEIPT←INCOME and PAYMENT→EXPENSE/LOAN_TAKEN lines; other §4.2 line types return 422 until F-09/F-10 (decided D1-S4). | BR-03, FR-14–17 | Sprint 2 contracts of F-09/F-10 extend the allowed-lines table. |
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
