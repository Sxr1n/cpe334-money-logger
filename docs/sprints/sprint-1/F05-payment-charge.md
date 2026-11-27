# F-05 Make a payment or record a charge — Sprint 1
Linked: FR-12, FR-13, FR-28 (CHG-01), BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, BR-09, BR-11, BR-18 (CHG-01), NFR-02, NFR-05, NFR-06, NFR-10   Status: TESTED (AC-F05-01..08 Sprint 1; AC-F05-09..16 CHG-01)   Owner: Leviathan-c137 (CHG-01: Sxr1n)
Depends on: F-04 (transaction engine). Design references: `docs/system-sds.md` §2.4, F-04 contract §2 and §5

## 1 Behavior & workflow
**Happy path A — card purchase split into categories (FR-12)**
1. Alice opens "Make a payment", picks Credit Card (LOAN_TAKEN) as the paying account, date today, total ฿1,200.00, lines Dining ฿700.00 + Groceries ฿500.00.
2. On save: card debt +120000, Dining and Groceries period totals +70000 / +50000 (from lines). Expense for the month +120000.

**Happy path B — repay the card from Bank (FR-13)**
1. Alice picks Bank (CASH) as the paying account, total ฿1,200.00, one line Credit Card (LOAN_TAKEN) ฿1,200.00.
2. On save: Bank −120000, card debt −120000. Expense is unchanged (BR-06): the line is a repayment, not an EXPENSE line.

**Failure and boundary cases** (in addition to all F-04 engine checks)
- Paying account of type INCOME, EXPENSE or LOAN_GIVEN → rejected (BR-03).
- A line of type CASH, LOAN_GIVEN or INCOME → rejected in Sprint 1 (transfers/lending arrive with F-09/F-10).
- PAYMENT from CASH larger than its current balance → rejected (BR-07); equal to the balance → accepted (balance becomes 0).
- A LOAN_TAKEN line larger than that account's current debt → rejected (BR-08); equal → accepted (debt becomes 0).
- ~~Charging a card has no upper limit (D-04: no credit limit) beyond BR-02.~~ Superseded by CHG-01 (v0.6). A card **without** a credit limit still has no upper limit beyond BR-02. A card **with** a limit rejects a charge that would take its debt above the limit (BR-18); a charge that brings the debt exactly to the limit is accepted.

**CHG-01 workflow — credit limit (FR-28, BR-18)**
1. On Accounts, alice opens "Credit limit" on Credit Card (debt ฿1,200.00), enters ฿5,000.00 and saves. The row shows "Limit ฿5,000.00 · Available ฿3,800.00".
2. On Make a payment, the Credit Card option shows its available credit.
   - A charge of ฿3,800.01 is rejected with "Over the credit limit of Credit Card (available ฿3,800.00)" under Total, and the entered values are kept.
   - A charge of ฿3,800.00 is saved (debt = limit).
3. A repayment from Bank is never blocked by the limit.
4. Removing the limit (Remove limit) restores the baseline behaviour.

## 2 Business rules & validation
Same validation order and BR-01, BR-02, BR-04, BR-09 and note checks as F-04 §2, plus:
| Rule | Check (PAYMENT) | Error |
|---|---|---|
| BR-03 | primary type ∈ {CASH, LOAN_TAKEN}; Sprint 1 line types ∈ {EXPENSE, LOAN_TAKEN} | 422 `RULE_VIOLATION` |
| BR-05 | Effects (SRS §4.3): primary CASH `balance −= total`, or primary LOAN_TAKEN `balance += total`; each LOAN_TAKEN line `balance −= amount`; EXPENSE lines change no stored balance | — |
| BR-07 | after effects, a CASH primary balance must be ≥ 0 (checked on the locked row) | 422 `RULE_VIOLATION` (`details.total`) |
| BR-08 | for each LOAN_TAKEN line, `amount ≤ current balance` of that account (locked row) | 422 `RULE_VIOLATION` (`details.lines[i].amount`) |
| BR-06 | only EXPENSE lines count as expense (enforced by F-06 summary reading only EXPENSE lines) | — |
| BR-18 (CHG-01) | Applies only to a LOAN_TAKEN account with `credit_limit` set (no check when it is NULL), on the locked row. PAYMENT primary: `balance + total ≤ credit_limit`. RECEIPT line from the account (F-10 borrow): `balance + amount ≤ credit_limit`. Repayments are not checked. | 422 `RULE_VIOLATION` (`details.total` for the primary, `details.lines[i].amount` for a line) |
| BR-18 (CHG-01) | `PATCH /api/accounts/:id/opening-balance` (F-08) is rejected if the new balance would exceed the limit | 422 `RULE_VIOLATION` (`details.amount`) |
| FR-28 (CHG-01) | `creditLimit` is integer satang 1..99999999999, or `null`. Only on LOAN_TAKEN accounts that are not archived. Not below the current balance (checked on the locked row). | 400 if not an integer or null. 422 with `details.creditLimit`: `VALIDATION_FAILED` for range; `RULE_VIOLATION` for wrong type, archived, or below the debt. |

Database backstop: `CHECK (balance >= 0)` on accounts; a violation that slips past the service maps to 422, never 500.
CHG-01 backstop: `CHECK (credit_limit IS NULL OR (type = 'LOAN_TAKEN' AND credit_limit > 0 AND balance <= credit_limit))`; a violation maps to 422 `RULE_VIOLATION`, never 500.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `POST /api/transactions` with `form: "PAYMENT"` | ✔ with own accounts only (other's → 404) | 403 | 401 |
| `PATCH /api/accounts/:id` with `creditLimit` (CHG-01) | ✔ own LOAN_TAKEN account only (other's → 404, unchanged) | 403 | 401 |

## 4 UI
- **Make a payment screen** (`/pay`): Paying account (select: own CASH and LOAN_TAKEN accounts, each with its current balance), Date, Total, Note, Lines (account select: own EXPENSE and LOAN_TAKEN accounts, grouped "Spending" / "Repay a debt"; amount).
- Same live line-total footer, field errors, kept values, pending and success behaviour as F-04 §4.
- Extra field messages from the server: "Not enough money in Bank (balance ฿x)" (BR-07) and "More than the outstanding debt ฿x" (BR-08).
- The paying account cannot be chosen again as a line (option disabled).
- CHG-01: a Credit Card option with a limit reads "Credit Card (debt ฿x · available ฿y)". The BR-18 server message shows under Total for a charge, or under the line amount for a borrow (Receive page).
- CHG-01 **Accounts screen**:
  - Each active LOAN_TAKEN row shows "Limit ฿x · Available ฿y", or "No limit".
  - A "Credit limit" button opens an inline form: amount, Save, Remove limit and Cancel.
  - Server errors show under the amount.
  - Archived rows have no Credit limit button.

## 5 API
`POST /api/transactions` as in F-04 §5 with `"form": "PAYMENT"`.
- Example (card purchase):
```json
{ "form": "PAYMENT", "primaryAccountId": 12, "date": "2026-11-06", "total": 120000, "note": "Weekend shopping",
  "lines": [ { "accountId": 14, "amount": 70000 }, { "accountId": 15, "amount": 50000 } ] }
```
- Example (card repayment): `{ "form": "PAYMENT", "primaryAccountId": 11, "date": "2026-11-07", "total": 120000, "lines": [ { "accountId": 12, "amount": 120000 } ] }`
- Responses and error codes as F-04 §5.

**CHG-01**: `PATCH /api/accounts/:id` (the F-07 endpoint) accepts `creditLimit`, alone or together with `name`/`archived`:
```json
{ "creditLimit": 500000 }
{ "creditLimit": null }
```
The first body sets or changes the limit (satang); the second removes it.
- 200 → the account shape. This shape, also returned by `GET /api/accounts`, now includes:
  - `creditLimit`: satang, or `null`;
  - `availableCredit`: `creditLimit − balance`, or `null` when there is no limit or the account is not LOAN_TAKEN.
- Errors: 400 `BAD_REQUEST` (not an integer or null), 401, 403, 404, and 422 as in §2. Example 422: `{ "error": { "code": "RULE_VIOLATION", "message": "Business rule violation.", "details": { "creditLimit": "Limit is below the current debt ฿1,200.00" } } }`.
- BR-18 posting error example: `details.total = "Over the credit limit of Credit Card (available ฿3,800.00)"`.

## 6 Data
Sprint 1: no change (uses tables from F-03 and F-04).

CHG-01: migration `add_credit_limit` adds `accounts.credit_limit BIGINT NULL` (satang) and the check constraint in §2. Existing rows get NULL (no limit), so stored balances and history are unchanged. There is no data backfill.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F05-01 | Given Credit Card debt 0, when alice posts PAYMENT from Credit Card total 120000 with lines Dining 70000 + Groceries 50000, then 201, card balance = 120000 exactly, and the stored lines are Dining 70000 and Groceries 50000. |
| AC-F05-02 | Given Bank 3500000 and card debt 120000, when alice posts PAYMENT from Bank total 120000 with one Credit Card line 120000, then 201, Bank = 3380000, card debt = 0, and the month's expense total (summed from EXPENSE lines) is unchanged by this transaction. |
| AC-F05-03 | A PAYMENT whose lines sum to 1 satang more than the total → 422 `RULE_VIOLATION`; nothing stored; balances unchanged. |
| AC-F05-04 | PAYMENT with primary Salary (INCOME), Dining (EXPENSE) or a LOAN_GIVEN account; a line equal to the primary; the same account in two lines; or a line to another CASH account → each 422 `RULE_VIOLATION`, nothing stored. |
| AC-F05-05 | Given Bank 1000000, a PAYMENT from Bank of 1000001 → 422 `RULE_VIOLATION` and Bank stays 1000000; a PAYMENT of exactly 1000000 → 201 and Bank = 0. |
| AC-F05-06 | Given card debt 120000, a repayment line of 120001 → 422 `RULE_VIOLATION`, nothing changes; a repayment of exactly 120000 → 201 and debt = 0. |
| AC-F05-07 | A PAYMENT by alice using bob's Credit Card as primary, or bob's Dining as a line → 404; nothing stored; bob's balances unchanged. |
| AC-F05-08 | In the browser on `/pay`, when total and line amount do not match the form shows "Lines must add up to the total" and Save is disabled; after a server 422 (e.g. overspending balance) the field message is shown and all entered values remain; on valid submission the payment is saved and a success alert is shown. |
| AC-F05-09 | (CHG-01) Given alice's Credit Card with debt 120000 and no limit: PATCH `creditLimit: 500000` → 200, and `GET /api/accounts` shows `creditLimit` 500000 and `availableCredit` 380000. `creditLimit: 120000` (equal to the debt) → 200. `creditLimit: null` → 200, and both fields are `null`. |
| AC-F05-10 | (CHG-01) Each of these is rejected and the stored limit is unchanged: `creditLimit` 119999 when the debt is 120000 → 422 `RULE_VIOLATION`; 0, −1 or 100000000000 → 422; 1.5 or `"5000"` → 400; a limit on Bank (CASH), Salary (INCOME) or an archived LOAN_TAKEN account → 422. |
| AC-F05-11 | (CHG-01, BR-18) Given limit 500000 and debt 120000: a PAYMENT from Credit Card of 380001 → 422 `RULE_VIOLATION` (`details.total`), nothing stored, debt stays 120000. A PAYMENT of 380000 → 201, and the debt = 500000 exactly. |
| AC-F05-12 | (CHG-01, BR-18 × F-10) Given limit 500000 and debt 500000: a RECEIPT into Bank with one line from Credit Card of 1 → 422 (`details.lines[0].amount`), Bank and debt unchanged. A repayment of 100000 from Bank → 201 (not blocked). Then a borrow of 100000 → 201, and the debt = 500000. |
| AC-F05-13 | (CHG-01 regression) A Credit Card with no limit accepts a PAYMENT of 99999999999 (201). The month's expense total rises by the EXPENSE lines only, and setting a limit never changes income or expense totals. |
| AC-F05-14 | (CHG-01, BR-18 × F-08) Given a LOAN_TAKEN account with opening balance 100000, no transactions and limit 150000: changing the opening balance to 150001 → 422, and nothing changes. Changing it to 150000 → 200. |
| AC-F05-15 | (CHG-01 access) `PATCH /api/accounts/:id` with `creditLimit`: no session → 401; admin → 403; alice on bob's Credit Card → 404, and bob's limit is unchanged. A PAYMENT by alice can never use bob's limit (bob's card → 404, as in AC-F05-07). |
| AC-F05-16 | (CHG-01 UI) In the browser, alice sets a ฿5,000.00 limit on Accounts and sees "Available". On `/pay`, a charge over the available credit shows the server message under Total and keeps all values. A charge equal to the available credit is saved, and a success alert is shown. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F05-01 | AC-F05-01 | unit + API-DB | Ledger core; alice card debt 0 | Unit: effects of (PAYMENT, LOAN_TAKEN primary, EXPENSE lines); API post the purchase | Unit delta card +120000; API 201; DB card balance 120000; lines 70000/50000 |
| TEST-F05-02 | AC-F05-02 | unit + API-DB (TDD) | Bank 3500000, card 120000 after purchase | Unit: effects of (PAYMENT, CASH primary, LOAN_TAKEN line); API post repayment; read `SUM(EXPENSE lines)` for the month before/after | Unit deltas Bank −120000, card −120000; API 201; Bank 3380000; card 0; expense sum before = after |
| TEST-F05-03 | AC-F05-03 | API-DB | alice; card | Post PAYMENT total 120000 lines 70000 + 50001 | 422 `RULE_VIOLATION`; counts and balances unchanged |
| TEST-F05-04 | AC-F05-04 | unit + API-DB | Ledger core allowed-lines table; second CASH account created in test setup | Unit + API for each invalid combination listed | Each rejected (unit) / 422 (API); nothing stored |
| TEST-F05-05 | AC-F05-05 | unit + API-DB (TDD) | Bank balance 1000000 | Post 1000001; post 1000000 | 422 then 201; Bank 1000000 then 0 |
| TEST-F05-06 | AC-F05-06 | API-DB | Card debt 120000 | Post repayment 120001; post 120000 | 422 then 201; debt 120000 then 0 |
| TEST-F05-07 | AC-F05-07 | API-DB | alice cookie; bob's ids | Post with bob's card as primary; with bob's Dining as line | Both 404; nothing stored; bob unchanged |
| TEST-F05-08 | AC-F05-08 | E2E | alice logged in; Credit Card debt 0 | Fill total 1200.00, line 1000.00; check Save; fix line to 1200.00; intercept POST with 422 overspend; submit; clear intercept; switch primary to Credit Card and submit | Mismatch message + Save disabled; after 422 error shown and values kept; success alert shown on submit |
| TEST-F05-09 | AC-F05-09 | API-DB (TDD) | alice card debt 120000 | PATCH 500000; GET; PATCH 120000; PATCH null; GET | 200s; fields 500000/380000, then null/null |
| TEST-F05-10 | AC-F05-10 | unit + API-DB (TDD) | debt 120000; Bank, Salary, archived LOAN_TAKEN | Unit: limit input validation; API: each invalid value/account | 422 / 400 as listed; DB limit unchanged |
| TEST-F05-11 | AC-F05-11 | unit + API-DB (TDD) | limit 500000, debt 120000 | Unit: `calculateTxnEffects` with a limit; API: post 380001, then 380000 | 422 and nothing stored; then 201, debt 500000 |
| TEST-F05-12 | AC-F05-12 | API-DB (TDD) | limit 500000, debt 500000, Bank funded | Borrow 1; repay 100000; borrow 100000 | 422; 201; 201; debt 500000 |
| TEST-F05-13 | AC-F05-13 | API-DB | card without a limit | Post a 99999999999 PAYMENT with an EXPENSE line; set a limit; read the summary before and after | 201; expense +99999999999 only; summary unchanged by the limit |
| TEST-F05-14 | AC-F05-14 | API-DB (TDD) | new LOAN_TAKEN with opening 100000, limit 150000 | PATCH opening balance 150001, then 150000 | 422, unchanged; 200 |
| TEST-F05-15 | AC-F05-15 | API-DB | no cookie; admin; alice + bob's card | PATCH creditLimit | 401; 403; 404, bob unchanged |
| TEST-F05-16 | AC-F05-16 | E2E | alice; Credit Card | Set a limit on Accounts; on /pay submit an over-limit charge, then an exact charge | Available shown; error under Total, values kept; success alert |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F05-01 | `server/tests/f05-transactions.api.test.ts::TEST-F05-01`, `server/tests/f05-ledger.unit.test.ts::TEST-F05-01` | PASS | 6f52657 |
| AC-F05-02 | `server/tests/f05-transactions.api.test.ts::TEST-F05-02`, `server/tests/f05-ledger.unit.test.ts::TEST-F05-02` | PASS | 6f52657 |
| AC-F05-03 | `server/tests/f05-transactions.api.test.ts::TEST-F05-03` | PASS | 6f52657 |
| AC-F05-04 | `server/tests/f05-transactions.api.test.ts::TEST-F05-04`, `server/tests/f05-ledger.unit.test.ts::TEST-F05-04` | PASS | 6f52657 |
| AC-F05-05 | `server/tests/f05-transactions.api.test.ts::TEST-F05-05`, `server/tests/f05-ledger.unit.test.ts::TEST-F05-05` | PASS | 6f52657 |
| AC-F05-06 | `server/tests/f05-transactions.api.test.ts::TEST-F05-06`, `server/tests/f05-ledger.unit.test.ts::TEST-F05-06` | PASS | 6f52657 |
| AC-F05-07 | `server/tests/f05-transactions.api.test.ts::TEST-F05-07` | PASS | 6f52657 |
| AC-F05-08 | `e2e/f05-pay.spec.ts::TEST-F05-08` | PASS | 6f52657 |
| AC-F05-09 | `server/tests/chg01-credit-limit.api.test.ts::TEST-F05-09` | PASS | 1660d08 |
| AC-F05-10 | `server/tests/chg01-credit-limit.api.test.ts::TEST-F05-10`, `server/tests/chg01-credit-limit.unit.test.ts::TEST-F05-10` | PASS | 1660d08 |
| AC-F05-11 | `server/tests/chg01-credit-limit.api.test.ts::TEST-F05-11`, `server/tests/chg01-credit-limit.unit.test.ts::TEST-F05-11` | PASS | 1660d08 |
| AC-F05-12 | `server/tests/chg01-credit-limit.api.test.ts::TEST-F05-12`, `server/tests/chg01-credit-limit.unit.test.ts::TEST-F05-12` | PASS | 1660d08 |
| AC-F05-13 | `server/tests/chg01-credit-limit.api.test.ts::TEST-F05-13` | PASS | 1660d08 |
| AC-F05-14 | `server/tests/chg01-credit-limit.api.test.ts::TEST-F05-14` | PASS | 1660d08 |
| AC-F05-15 | `server/tests/chg01-credit-limit.api.test.ts::TEST-F05-15` | PASS | 1660d08 |
| AC-F05-16 | `e2e/chg01-credit-limit.spec.ts::TEST-F05-16` | PASS | 1660d08 |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial contract. Sprint 1 PAYMENT lines limited to EXPENSE and LOAN_TAKEN (team decision D1-S4). BR-07 per D-03, TA confirmation pending (Q-01). | D1-S4 |
| 0.2 | 2026-11-07 | Owner set to Leviathan-c137 (teammate joined the repository). No behaviour change. | Team |
| 0.3 | 2026-11-14 | Completed implementation and verified tests (TEST-F05-01..07 + E2E TEST-F05-08). Status -> TESTED. | F-05 |
| 0.4 | 2026-11-14 | Address PR #18 review: add AC-F05-08 + TEST-F05-08 to contract, record commit SHA 6f52657 in §9. | PR #18 review |
| 0.5 | 2026-11-26 | F-09 supersedes the "a line to another CASH account → 422" part of AC-F05-04 (CASH lines are now valid transfers; TEST-F05-04 checks INCOME line instead). | F-09 / PR #67 review |
| 0.6 | 2026-11-27 | CHG-01 credit limit. FR-28 and BR-18 linked. §1: "no credit limit" superseded for cards that have a limit. §2: rules + DB backstop. §3: PATCH permission. §4: Accounts/Pay UI. §5: `creditLimit`/`availableCredit`. §6: migration. AC-F05-09..16 + TEST-F05-09..16 added (SPECIFIED). Change owner: Sxr1n; Leviathan-c137 reviews this contract before any code. | CHG-01 (Lab 7) |
| 0.7 | 2026-11-28 | CHG-01 implemented: AC-F05-09..16 PASS on `1660d08` (red `f8a9b70`). TEST-F05-12 also has a unit check of the borrow path; TEST-F05-16 uses a fresh card "Card CHG01" so it does not depend on other specs. No AC changed. | CHG-01 |
