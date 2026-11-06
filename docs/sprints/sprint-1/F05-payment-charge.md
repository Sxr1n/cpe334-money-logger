# F-05 Make a payment or record a charge — Sprint 1
Linked: FR-12, FR-13, BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, BR-09, BR-11, NFR-02, NFR-05, NFR-06, NFR-10   Status: SPECIFIED   Owner: `<Student B>`
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
- Charging a card has no upper limit (D-04: no credit limit) beyond BR-02.

## 2 Business rules & validation
Same validation order and BR-01, BR-02, BR-04, BR-09 and note checks as F-04 §2, plus:
| Rule | Check (PAYMENT) | Error |
|---|---|---|
| BR-03 | primary type ∈ {CASH, LOAN_TAKEN}; Sprint 1 line types ∈ {EXPENSE, LOAN_TAKEN} | 422 `RULE_VIOLATION` |
| BR-05 | Effects (SRS §4.3): primary CASH `balance −= total`, or primary LOAN_TAKEN `balance += total`; each LOAN_TAKEN line `balance −= amount`; EXPENSE lines change no stored balance | — |
| BR-07 | after effects, a CASH primary balance must be ≥ 0 (checked on the locked row) | 422 `RULE_VIOLATION` (`details.total`) |
| BR-08 | for each LOAN_TAKEN line, `amount ≤ current balance` of that account (locked row) | 422 `RULE_VIOLATION` (`details.lines[i].amount`) |
| BR-06 | only EXPENSE lines count as expense (enforced by F-06 summary reading only EXPENSE lines) | — |

Database backstop: `CHECK (balance >= 0)` on accounts; a violation that slips past the service maps to 422, never 500.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `POST /api/transactions` with `form: "PAYMENT"` | ✔ with own accounts only (other's → 404) | 403 | 401 |

## 4 UI
- **Make a payment screen** (`/pay`): Paying account (select: own CASH and LOAN_TAKEN accounts, each with its current balance), Date, Total, Note, Lines (account select: own EXPENSE and LOAN_TAKEN accounts, grouped "Spending" / "Repay a debt"; amount).
- Same live line-total footer, field errors, kept values, pending and success behaviour as F-04 §4.
- Extra field messages from the server: "Not enough money in Bank (balance ฿x)" (BR-07) and "More than the outstanding debt ฿x" (BR-08).
- The paying account cannot be chosen again as a line (option disabled).

## 5 API
`POST /api/transactions` as in F-04 §5 with `"form": "PAYMENT"`.
- Example (card purchase):
```json
{ "form": "PAYMENT", "primaryAccountId": 12, "date": "2026-11-06", "total": 120000, "note": "Weekend shopping",
  "lines": [ { "accountId": 14, "amount": 70000 }, { "accountId": 15, "amount": 50000 } ] }
```
- Example (card repayment): `{ "form": "PAYMENT", "primaryAccountId": 11, "date": "2026-11-07", "total": 120000, "lines": [ { "accountId": 12, "amount": 120000 } ] }`
- Responses and error codes as F-04 §5.

## 6 Data
No change (uses tables from F-03 and F-04).

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

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F05-01 | — | NOT RUN | — |
| AC-F05-02 | — | NOT RUN | — |
| AC-F05-03 | — | NOT RUN | — |
| AC-F05-04 | — | NOT RUN | — |
| AC-F05-05 | — | NOT RUN | — |
| AC-F05-06 | — | NOT RUN | — |
| AC-F05-07 | — | NOT RUN | — |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial contract. Sprint 1 PAYMENT lines limited to EXPENSE and LOAN_TAKEN (team decision D1-S4). BR-07 per D-03, TA confirmation pending (Q-01). | D1-S4 |
