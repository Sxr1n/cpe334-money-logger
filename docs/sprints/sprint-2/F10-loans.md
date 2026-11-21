# F-10 Loans given and taken — Sprint 2
Linked: FR-15, FR-16, FR-17, FR-24, BR-01, BR-03, BR-04, BR-05, BR-06, BR-08, BR-11, BR-12, NFR-01, NFR-02, NFR-06, NFR-10   Status: SPECIFIED   Owner: Leviathan-c137
Depends on: F-04, F-05, F-07 (LOAN_GIVEN accounts); merges after F-09 (same allowed-lines table). Design references: SRS §4.2–4.3, `docs/system-sds.md` §2.4

## 1 Behavior & workflow
No new endpoint. F-10 completes the allowed-lines table of SRS §4.2 with **LOAN_GIVEN lines on both forms** and **LOAN_TAKEN lines on RECEIPT**. After F-10, one transaction may mix any allowed line types for its form (FR-17).

**Happy path A — lend money (FR-15).** Alice creates "Loan to Ken" (LOAN_GIVEN, F-07). She records a PAYMENT from Bank of ฿2,000.00 with one line "Loan to Ken" ฿2,000.00. Bank −฿2,000.00, Ken's receivable +฿2,000.00, and expense is unchanged.

**Happy path B — Ken repays part (FR-15).** A RECEIPT into Bank of ฿1,500.00 with one line "Loan to Ken" ฿1,500.00. Receivable −฿1,500.00 (now ฿500.00), Bank +฿1,500.00, and income is unchanged.

**Happy path C — borrow (FR-16).** Alice creates "Loan from Mom" (LOAN_TAKEN). She records a RECEIPT into Bank of ฿5,000.00 with one line "Loan from Mom". Debt +฿5,000.00, Bank +฿5,000.00, and income is unchanged. She repays later with a PAYMENT LOAN_TAKEN line, which already exists from F-05.

**Happy path D — mixed RECEIPT (FR-17).** Salary ฿30,000.00 + "Loan to Ken" ฿500.00 = total ฿30,500.00 into Bank. Income +฿30,000.00 only, and Ken's receivable becomes 0.

**Failure and boundary cases**
- A RECEIPT line from LOAN_GIVEN larger than that receivable → rejected (BR-08). Exactly equal → accepted, and the receivable becomes 0.
- Borrowing has no upper limit beyond BR-02 (D-04: no credit limit).
- Still rejected (BR-03): LOAN_GIVEN as primary on either form; LOAN_TAKEN as RECEIPT primary; EXPENSE lines on a RECEIPT; INCOME lines on a PAYMENT.
- Another user's loan account → 404. Archived → 404.

## 2 Business rules & validation
| Rule | Change | Error |
|---|---|---|
| BR-03 | PAYMENT line types gain LOAN_GIVEN; RECEIPT line types gain LOAN_GIVEN and LOAN_TAKEN | 422 `RULE_VIOLATION` for the remaining disallowed types |
| BR-05 | PAYMENT: LOAN_GIVEN line `balance += amount`. RECEIPT: LOAN_GIVEN line `balance −= amount`; LOAN_TAKEN line `balance += amount`. | — |
| BR-08 | RECEIPT: LOAN_GIVEN line `amount ≤ current receivable` (locked row) | 422 `RULE_VIOLATION` (`details["lines[i].amount"]` = "More than the amount owed to you ฿x") |
| BR-06 | LOAN lines are never income or expense (F-06 sums read only INCOME/EXPENSE lines) | — |

Full allowed-lines table after F-10, equal to SRS §4.2:
| Form | Primary | Line types |
|---|---|---|
| RECEIPT | CASH | INCOME, LOAN_GIVEN, LOAN_TAKEN, CASH |
| PAYMENT | CASH, LOAN_TAKEN | EXPENSE, LOAN_TAKEN, LOAN_GIVEN, CASH |

The ledger-core unit test checks every (form, primary type, line type) combination against this table: 2 forms × 5 primary types × 5 line types = 50 cases.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `POST /api/transactions` with LOAN lines | ✔ own accounts only (other's → 404) | 403 | 401 |

## 4 UI
- **Make a payment:** line select gains the group "Lend money" (own active LOAN_GIVEN accounts with the amount owed to the user).
- **Receive money:** line select gains the groups "Repayment to me" (LOAN_GIVEN with the amount owed) and "Borrow" (LOAN_TAKEN with the current debt).
- BR-08 server messages are shown under the line amount; values are kept.
- **Overview** (F-06): the "Owed to me" and "Debts" cards already list LOAN_GIVEN and LOAN_TAKEN accounts. No layout change.

## 5 API
`POST /api/transactions` as F-04 §5. Example mixed receipt: `{ "form": "RECEIPT", "primaryAccountId": 11, "date": "2026-11-22", "total": 3050000, "lines": [ { "accountId": 13, "amount": 3000000 }, { "accountId": 32, "amount": 50000 } ] }`

## 6 Data
No change.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F10-01 | Given Bank 1000000 and "Loan to Ken" 0, a PAYMENT from Bank with a Ken line 200000 → 201, Bank 800000, Ken 200000, and the month's expense is unchanged. |
| AC-F10-02 | Given Ken 200000, a RECEIPT into Bank with a Ken line 150000 → 201, Ken 50000, income unchanged; then a Ken line 50001 → 422 `RULE_VIOLATION`, nothing stored; then 50000 → 201 and Ken = 0. |
| AC-F10-03 | Given "Loan from Mom" 0, a RECEIPT into Bank with a Mom line 500000 → 201, Mom debt 500000, Bank +500000, income unchanged. |
| AC-F10-04 | A RECEIPT into Bank total 3050000 with Salary 3000000 + Ken 50000 (Ken owes 50000) → 201, income +3000000 exactly, Ken 0, Bank +3050000. |
| AC-F10-05 | A PAYMENT from Bank total 100000 with lines Dining 10000 + Credit Card 20000 (debt ≥ 20000) + Ken 30000 + Wallet 40000 → 201 with each SRS §4.3 effect applied; the month's expense increases by exactly 10000. |
| AC-F10-06 | Every (form, primary type, line type) combination outside SRS §4.2 → 422 `RULE_VIOLATION`, including RECEIPT with an EXPENSE line, RECEIPT into a LOAN_TAKEN primary, and PAYMENT from a LOAN_GIVEN primary; a line using bob's "Loan to Ken" → 404 and bob's account is unchanged. |
| AC-F10-07 | After AC-F10-01 and AC-F10-03, `GET /api/overview` shows `loanGiven.total` = 200000 and `loanTaken` includes Loan from Mom 500000. |
| AC-F10-08 | In the browser, on `/receive` alice records Salary + a repayment from Ken in one transaction; the footer shows the matching total, the save succeeds, and Overview shows the reduced "Owed to me" total. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F10-01 | AC-F10-01 | unit + API-DB | Ken created in setup | Unit effects of (PAYMENT, CASH, LOAN_GIVEN); API post; summary | Deltas; 201; balances; expense unchanged |
| TEST-F10-02 | AC-F10-02 | unit + API-DB (TDD) | Ken 200000 | Unit BR-08 on RECEIPT LOAN_GIVEN line; API posts 150000, 50001, 50000 | 201 / 422 nothing stored / 201; Ken 50000 → 50000 → 0 |
| TEST-F10-03 | AC-F10-03 | API-DB | Mom created | Post borrowing | 201; debt; Bank; income unchanged |
| TEST-F10-04 | AC-F10-04 | API-DB (TDD) | Ken 50000 | Post mixed receipt; summary before/after | 201; income +3000000 only |
| TEST-F10-05 | AC-F10-05 | API-DB | card debt ≥ 20000, Ken, Wallet | Post 4-line payment | 201; all deltas; expense +10000 |
| TEST-F10-06 | AC-F10-06 | unit + API-DB | — | Unit: 50-case table; API: representative invalid posts; bob's Ken as line | Unit matches SRS §4.2; 422s; 404 with bob unchanged |
| TEST-F10-07 | AC-F10-07 | API-DB | after 01 and 03 | `GET /api/overview` | Totals as stated |
| TEST-F10-08 | AC-F10-08 | E2E | alice, Ken with receivable (set up through the API in the test) | Fill mixed receipt; save; open Overview | Success alert; "Owed to me" reduced |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F10-01 … AC-F10-08 | — | NOT RUN | — |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-22 | Initial contract. Completes the SRS §4.2 allowed-lines table; BR-08 applies to RECEIPT LOAN_GIVEN lines. | D2-S1 |
