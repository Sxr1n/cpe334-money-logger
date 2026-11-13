# F-03 Opening balance — Sprint 1
Linked: FR-07, BR-02, BR-06, BR-10, BR-11, NFR-02, NFR-05   Status: TESTED   Owner: Leviathan-c137
Depends on: F-01. Design references: `docs/system-sds.md` §2.4 (balances, SD-02), §4

This feature also delivers the basic account list (`GET /api/accounts`) because the opening-balance form and the transaction forms of F-04/F-05 need it to pick accounts. F-06 extends the same endpoint with INCOME/EXPENSE period totals (FR-06).

## 1 Behavior & workflow
**Happy path**
1. Alice opens Accounts and sees her seeded accounts.
2. On Bank (CASH), which has no opening balance yet, she clicks "Set opening balance", enters ฿5,000.00 and date 2026-11-01, and saves.
3. Bank now shows balance ฿5,000.00 and "Opening ฿5,000.00 on 01 Nov 2026". No transaction is created and income is unchanged.

**Failure and boundary cases**
- Amount 0 is allowed (≥ 0). Negative, more than 2 decimals (UI) / non-integer satang (API), or above ฿999,999,999.99 → rejected, nothing stored.
- INCOME or EXPENSE account → rejected (BR-10).
- Account already has an opening balance → 409; changing it is F-08 (Sprint 2).
- Another user's account or unknown id → 404, nothing stored.

## 2 Business rules & validation
- BR-10: only CASH, LOAN_TAKEN, LOAN_GIVEN; amount ≥ 0; at most one per account; never income/expense.
- BR-02: `amount` is an integer number of satang, 0 ≤ amount ≤ 99,999,999,999 (= ฿999,999,999.99).
- `date` is a valid `YYYY-MM-DD` calendar date. The SRS sets no range for opening dates; any valid date is accepted.
- BR-05/SD-02: in one DB transaction, lock the account row, check `opening_balance IS NULL`, set `opening_balance`, `opening_date`, and `balance = balance + amount`.
- BR-06: no row is written to `transactions` or `transaction_lines`.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `GET /api/accounts` | ✔ own accounts only | 403 | 401 |
| `PUT /api/accounts/:id/opening-balance` | ✔ own account (other's → 404) | 403 | 401 |

## 4 UI
- **Accounts screen** (`/accounts`): accounts grouped under CASH, LOAN_TAKEN, LOAN_GIVEN, INCOME, EXPENSE headings; each row shows name and balance (CASH/LOAN). Rows without an opening balance on CASH/LOAN types show "Set opening balance".
- **Opening balance form** (inline panel): Amount (THB, up to 2 decimals), Date (default today in Bangkok). Field errors: "Enter an amount of 0 or more", "At most 2 decimal places", "Too large", "Enter a valid date". Values are kept on error. Pending: Save disabled with spinner. 409/422 from the server shown under the form.
- Loading: spinner. Empty (no accounts): "No accounts."

## 5 API
**`GET /api/accounts`** (USER)
- 200: `{ "items": [ { "id": 11, "name": "Bank", "type": "CASH", "balance": 500000, "openingBalance": 500000, "openingDate": "2026-11-01" } ] }` — own accounts, ordered by type (CASH, LOAN_TAKEN, LOAN_GIVEN, INCOME, EXPENSE) then name. `openingBalance`/`openingDate` are null when not set. (F-06 adds `periodTotal` for INCOME/EXPENSE.)

**`PUT /api/accounts/:id/opening-balance`** (USER)
- Request: `{ "amount": 500000, "date": "2026-11-01" }`
- 200: the updated account object (as in the list).
- 400 `BAD_REQUEST`: body not an object, or fields of the wrong JSON type.
- 404 `NOT_FOUND`: account does not exist or is not the caller's.
- 409 `CONFLICT`: opening balance already set.
- 422 `VALIDATION_FAILED`: amount negative, not an integer or > 99,999,999,999; date invalid.
- 422 `RULE_VIOLATION`: account type INCOME or EXPENSE.

## 6 Data
Migration `init_accounts`:
| Field | Type | Constraint |
|---|---|---|
| id | serial | PK |
| user_id | int | NOT NULL, FK → users.id |
| name | varchar(50) | NOT NULL |
| type | enum `AccountType` (CASH, LOAN_TAKEN, LOAN_GIVEN, INCOME, EXPENSE) | NOT NULL |
| balance | bigint | NOT NULL, default 0, `CHECK (balance >= 0)` |
| opening_balance | bigint | NULL, `CHECK (opening_balance IS NULL OR opening_balance >= 0)` |
| opening_date | date | NULL |
| archived_at | timestamptz | NULL (used from Sprint 2) |
| created_at | timestamptz | NOT NULL, default now() |

Also: `CHECK (type IN ('CASH','LOAN_TAKEN','LOAN_GIVEN') OR (opening_balance IS NULL AND balance = 0))`; unique index `(user_id, type, lower(name))`; index `(user_id)`.
Seed per user: Bank (CASH), Credit Card (LOAN_TAKEN), Salary (INCOME), Dining, Groceries, Electricity, Telecom (EXPENSE); no opening balances.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F03-01 | Given alice's Bank has no opening balance, when she sets ฿5,000.00 (500000) on 2026-11-01, then the response is 200 and Bank shows balance 500000, openingBalance 500000, openingDate 2026-11-01, also after a new `GET /api/accounts`. |
| AC-F03-02 | Setting an opening balance creates no row in `transactions` or `transaction_lines` (so it can never be counted as income or expense). |
| AC-F03-03 | Amount −1, 100.5 (non-integer satang) or 100,000,000,000 → 422 `VALIDATION_FAILED`; amount 0 → 200; after each rejection the account is unchanged. |
| AC-F03-04 | Setting an opening balance on Salary (INCOME) → 422 `RULE_VIOLATION`; setting it a second time on Bank → 409 `CONFLICT`; the stored values are unchanged in both cases. |
| AC-F03-05 | Alice setting an opening balance on bob's Bank id → 404 and bob's Bank is unchanged; `GET /api/accounts` as alice contains none of bob's accounts. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F03-01 | AC-F03-01 | API-DB | Seeded; alice cookie | `PUT /api/accounts/{aliceBank}/opening-balance {amount:500000,date:"2026-11-01"}`; `GET /api/accounts` | 200; Bank balance 500000, openingBalance 500000, openingDate "2026-11-01" |
| TEST-F03-02 | AC-F03-02 | API-DB (TDD) | Seeded; counts of transactions/lines = 0 | Set opening balance on Bank | 200; both table counts still 0 |
| TEST-F03-03 | AC-F03-03 | unit + API-DB | alice cookie | Validator unit cases −1, 100.5, 1e11, 0, 99999999999; API with −1, 100.5, 1e11 then 0 on a fresh account | Invalid → 422 `VALIDATION_FAILED` and account unchanged; 0 and max accepted |
| TEST-F03-04 | AC-F03-04 | API-DB | Bank opening already 500000 | PUT on Salary; PUT on Bank again with 100 | 422 `RULE_VIOLATION`; 409 `CONFLICT`; Bank still 500000 |
| TEST-F03-05 | AC-F03-05 | API-DB | alice cookie; bob's Bank id | PUT on bob's Bank; `GET /api/accounts` as alice | 404; bob's Bank opening null, balance 0; alice's list has only alice's ids |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F03-01 | server/tests/f03-accounts.api.test.ts::TEST-F03-01 | PASS | 3f3aae5 |
| AC-F03-02 | server/tests/f03-accounts.api.test.ts::TEST-F03-02 | PASS | b2a4f70 |
| AC-F03-03 | server/tests/f03-accounts.api.test.ts::TEST-F03-03, server/tests/f03-accounts.unit.test.ts | PASS | 3f3aae5 |
| AC-F03-04 | server/tests/f03-accounts.api.test.ts::TEST-F03-04 | PASS | 3f3aae5 |
| AC-F03-05 | server/tests/f03-accounts.api.test.ts::TEST-F03-05 | PASS | 3f3aae5 |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial contract. AC-F03-02 verified at DB level (no transaction rows); the summary-level check is AC-F06-03. | D1-S4 |
| 0.2 | 2026-11-07 | Owner set to Leviathan-c137 (teammate joined the repository). No behaviour change. | Team |
| 0.3 | 2026-11-12 | Record done evidence for AC-F03-01..05 after implementation. | D1-S6a |
| 0.4 | 2026-11-13 | Mark AC-F03-02 as INCOMPLETE pending F-04; add case-insensitive unique test (PR #16 review) | Team review |
| 0.5 | 2026-11-13 | Re-enable TEST-F03-02 and verify PASS now that F-04 tables exist | D1-S6b |
