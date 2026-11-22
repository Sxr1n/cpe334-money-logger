# F-08 Opening balance management — Sprint 2
Linked: FR-10, BR-02, BR-05, BR-06, BR-07, BR-08, BR-10, BR-11, BR-12, NFR-01, NFR-02, NFR-05, NFR-10   Status: SPECIFIED   Owner: Sxr1n
Depends on: F-03. NFR-05 check also needs F-09, F-10 and F-11 merged. Design references: `docs/system-sds.md` §2.4 (opening balance, SD-02); decision D-10 (Q-03)

## 1 Behavior & workflow
**Happy path — correct a wrong opening balance (FR-10)**
1. Alice set Bank's opening balance to ฿10,000.00 on 01 Nov. Since then she received ฿5,000.00, so Bank shows ฿15,000.00.
2. She notices the real opening amount was ฿20,000.00. On Accounts she clicks "Edit opening balance" on Bank. The form opens with ฿10,000.00 and 01 Nov 2026 filled in. She changes the amount to ฿20,000.00 and saves.
3. Bank now shows ฿25,000.00: the balance changes by new − old = +฿10,000.00. No transaction is created, and income and expense do not change (BR-06).

**Decision D-10 (Q-03):** an opening balance may be edited at any time, also after the account has transactions. The edit is rejected if the recomputed current balance would be negative.

**Failure and boundary cases**
- Lowering the opening amount so that the current balance would go below 0 → rejected, nothing changes. This means later transactions already used that money (CASH, BR-07), or later repayments already reduced the debt or receivable (LOAN_TAKEN / LOAN_GIVEN, BR-08). Lowering it to make the balance exactly 0 → accepted.
- Amount 0 is allowed. Negative, non-integer satang or above 99,999,999,999 → rejected (BR-02, BR-10).
- The opening date may change. The date is informational: it does not move balances and is not compared with transaction dates. This is the same "current balance" simplification as D-03.
- Account without an opening balance yet → 409. The first one is set with F-03 `PUT`.
- INCOME or EXPENSE account → 422 (BR-10). Archived account → 422 (F-07).
- Another user's account or unknown id → 404.

## 2 Business rules & validation
Validation order: (1) JSON shape → 400; (2) load the account with `userId = session user` → 404; (3) field validation → 422 `VALIDATION_FAILED`; (4) rules → 422 `RULE_VIOLATION` / 409; (5) write.

| Rule | Check | Error |
|---|---|---|
| shape | `amount` number, `date` string (same validator as F-03) | 400 `BAD_REQUEST` |
| BR-02 / BR-10 | `amount` integer, 0 ≤ amount ≤ 99,999,999,999; `date` valid `YYYY-MM-DD` | 422 `VALIDATION_FAILED` (`details.amount` / `details.date`) |
| BR-10 | account type ∈ {CASH, LOAN_TAKEN, LOAN_GIVEN} | 422 `RULE_VIOLATION` |
| F-07 | account not archived | 422 `RULE_VIOLATION` ("Account is archived") |
| BR-10 | `opening_balance IS NOT NULL` (there is something to change) | 409 `CONFLICT` ("Opening balance not set yet") |
| BR-05 / D-10 | In one DB transaction: lock the account row (`FOR UPDATE`) and compute `newBalance = balance + (amount − opening_balance)`. If `newBalance < 0`, reject. Otherwise set `opening_balance = amount`, `opening_date = date`, `balance = newBalance`. | 422 `RULE_VIOLATION` (`details.amount` = "Too low: the balance would be −฿x because of later transactions") |
| BR-06 | no row is written to `transactions` or `transaction_lines` | — |

DB backstop: `CHECK (balance >= 0)` maps to 422, never 500.

**NFR-05 (SR-02), delivered in this contract.** A seeded pseudo-random run of 1,000 valid operations (receipts, payments, transfers, loans, opening-balance edits, transaction edits and voids) on one user. After the run, every stored `accounts.balance` equals an independent recomputation from opening balances and POSTED lines (SRS §4.3), with 0 satang difference.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `PATCH /api/accounts/:id/opening-balance` | ✔ own account (other's → 404) | 403 | 401 |

## 4 UI
- **Accounts screen:** rows with an opening balance show "Opening ฿x on DD MMM YYYY" and an "Edit opening balance" link. It opens the same inline panel as F-03, pre-filled with the current amount and date, and saves with `PATCH`.
- Field messages are the same as F-03. The server's `details.amount` (for example "Too low: the balance would be −฿2,000.00 because of later transactions") is shown under Amount. Values are kept on error (NFR-10). Save is disabled while pending.
- On success the row shows the new balance and opening line.

## 5 API
**`PATCH /api/accounts/:id/opening-balance`** (USER)
- Request: `{ "amount": 2000000, "date": "2026-11-01" }`
- 200: the account as in F-07 §5 (`balance`, `openingBalance`, `openingDate`, `archived`)
- Errors: 400 `BAD_REQUEST`; 404 `NOT_FOUND`; 422 `VALIDATION_FAILED`; 422 `RULE_VIOLATION` (type, archived, negative result); 409 `CONFLICT` (not set yet); 401; 403.

`PUT /api/accounts/:id/opening-balance` (F-03) is unchanged: first set only, 409 if already set.

## 6 Data
No schema change.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F08-01 | Given Bank opening 1000000 and a RECEIPT of 500000 (Bank 1500000), when alice patches the opening balance to 2000000 with date 2026-11-02, then 200, Bank balance 2500000, `openingBalance` 2000000, `openingDate` 2026-11-02, the transaction count is unchanged, and the month's income is unchanged. |
| AC-F08-02 | Given Bank opening 1000000 and a PAYMENT of 800000 (Bank 200000), patching the opening balance to 799999 → 422 `RULE_VIOLATION` (`details.amount`) and Bank stays 200000 with opening 1000000; patching it to 800000 → 200 and Bank = 0. |
| AC-F08-03 | Given Credit Card opening debt 500000 and a repayment of 300000 (debt 200000), patching the opening to 299999 → 422 and nothing changes; patching it to 300000 → 200 and debt = 0. |
| AC-F08-04 | Amount −1, 1.5 or 100000000000, or date "2026-02-30" → 422 `VALIDATION_FAILED`; Salary (INCOME) → 422 `RULE_VIOLATION`; an archived CASH account → 422 `RULE_VIOLATION`; a CASH account with no opening balance → 409. In each case the account row is unchanged. |
| AC-F08-05 | Without a session → 401; as admin → 403; alice patching bob's Bank → 404 and bob's Bank is unchanged. |
| AC-F08-06 | In the browser on `/accounts`, "Edit opening balance" on Bank opens the form with the current amount and date; entering an amount that is too low shows the server message under Amount and keeps the value; a valid amount saves and the row shows the new balance. |
| AC-F08-07 | (NFR-05) After a seeded run of 1,000 random valid operations covering every form, every allowed line type, opening-balance edits, transaction edits and voids, every CASH, LOAN_TAKEN and LOAN_GIVEN balance equals the recomputation from opening balances and POSTED lines with 0 satang difference. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F08-01 | AC-F08-01 | API-DB | Bank opening 1000000, RECEIPT 500000 | `PATCH` 2000000 / 2026-11-02; read account, transaction count, `GET /api/summary` | 200; balance 2500000; opening fields updated; counts and income unchanged |
| TEST-F08-02 | AC-F08-02 | unit + API-DB (TDD) | Bank opening 1000000, PAYMENT 800000 | Unit: new-balance function with (200000, 1000000 → 799999 / 800000); API: `PATCH` 799999 then 800000 | Unit −1 rejected / 0 accepted; API 422 then 200; Bank 200000 then 0 |
| TEST-F08-03 | AC-F08-03 | API-DB (TDD) | Card opening 500000, repayment 300000 | `PATCH` 299999 then 300000 | 422 with debt 200000; then 200 with debt 0 |
| TEST-F08-04 | AC-F08-04 | API-DB | Bank with opening; Salary; archived CASH with opening 0; Wallet without opening | Each invalid request | Expected status per case; account rows unchanged |
| TEST-F08-05 | AC-F08-05 | API-DB | no cookie; admin; alice + bob's Bank id | `PATCH` as each | 401; 403; 404 and bob unchanged |
| TEST-F08-06 | AC-F08-06 | E2E | alice, Bank opening set and a payment recorded | Open edit form; enter too-low amount; save; enter valid amount; save | Pre-filled values; server message, value kept; new balance shown |
| TEST-NFR05-01 | AC-F08-07 | API-DB (property) | fixed PRNG seed; one user with 3 CASH, 2 LOAN_TAKEN, 2 LOAN_GIVEN, INCOME and EXPENSE accounts | 1,000 random operations through the HTTP API. An operation rejected by a rule (422) is allowed and counted. Then recompute every balance in SQL from `opening_balance` and POSTED lines. | Every stored balance = recomputation (0 difference); test prints the number of posted, rejected, edited and voided operations |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F08-01 … AC-F08-07 | — | NOT RUN | — |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-22 | Initial contract. Q-03 resolved as D-10 (edit allowed after transactions, rejected if the balance would go negative). New `PATCH` endpoint so the F-03 `PUT` contract (409 when already set) stays unchanged. NFR-05 property test placed here. | D2-S1 |
