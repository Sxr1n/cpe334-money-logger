# F-04 Receive money — Sprint 1
Linked: FR-11, BR-01, BR-02, BR-03, BR-04, BR-05, BR-09, BR-11, NFR-02, NFR-05, NFR-06, NFR-10   Status: SPECIFIED   Owner: `<Student B>`
Depends on: F-01, F-03 (account list). Design references: `docs/system-sds.md` §1.3, §2.4 (posting algorithm), §4

This feature builds the **shared transaction engine** (`POST /api/transactions`, ledger core, posting service). F-05 adds the PAYMENT form to the same engine.

## 1 Behavior & workflow
**Happy path**
1. Alice opens "Receive money".
2. She picks the receiving account Bank (CASH), date 2026-11-05, total ฿30,000.00, optional note "November salary", and one line: Salary (INCOME) ฿30,000.00.
3. The form shows "Lines total ฿30,000.00 of ฿30,000.00" and enables Save.
4. On save the server validates, locks the accounts, inserts the transaction and line and adds 3,000,000 satang to Bank in one DB transaction, then returns the stored transaction. The UI shows it and links to History.

**Failure and boundary cases**
- Lines do not add up to the total (any satang difference) → rejected, nothing stored.
- No lines, a line amount ≤ 0, an amount with more than 2 decimals (UI) / non-integer satang (API), or a total above ฿999,999,999.99 → rejected.
- Receiving account not CASH (e.g. Credit Card) → rejected. A line that is not INCOME → rejected in Sprint 1 (other RECEIPT line types arrive with F-09/F-10).
- Date later than today (Asia/Bangkok) or before 2000-01-01 → rejected. Today is accepted.
- Any account not owned by alice or not existing → 404, nothing stored.
- The same account in two lines, or a line using the primary account → rejected.
- A failure during posting → whole transaction rolled back.

## 2 Business rules & validation
Validation order: (1) JSON shape → 400; (2) load all referenced accounts with `userId = session user` → 404 if any missing; (3) rules → 422; (4) post.
| Rule | Check (RECEIPT) | Error |
|---|---|---|
| BR-01 | `lines.length ≥ 1`; every `amount > 0`; `Σ amount = total` exactly | 422 `RULE_VIOLATION` (`details.lines`) |
| BR-02 | `total` and every `amount` integer satang, 1 ≤ x ≤ 99,999,999,999 | 422 `VALIDATION_FAILED` |
| BR-03 | primary type = CASH; Sprint 1 line types for RECEIPT = {INCOME} | 422 `RULE_VIOLATION` (`details.primaryAccountId` / `details.lines[i]`) |
| BR-04 | all accounts owned by the user and not archived; no line uses the primary; no account twice in lines | 404 (ownership) / 422 `RULE_VIOLATION` |
| BR-09 | `2000-01-01 ≤ date ≤ today(Asia/Bangkok)` | 422 `VALIDATION_FAILED` (`details.date`) |
| note | optional string, at most 200 characters (contract-level limit for the `varchar(200)` column) | 422 `VALIDATION_FAILED` (`details.note`) |
| BR-05 | RECEIPT effect: primary CASH `balance += total`; INCOME lines change no stored balance (period totals are summed from lines) | — |

Sprint 1 allowed-lines table in the ledger core (Sprint 2 extends it to the full SRS §4.2 table):
| Form | Primary | Line types accepted in Sprint 1 |
|---|---|---|
| RECEIPT | CASH | INCOME |
| PAYMENT (F-05) | CASH, LOAN_TAKEN | EXPENSE, LOAN_TAKEN |

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `POST /api/transactions` | ✔ with own accounts only (other's → 404) | 403 | 401 |

## 4 UI
- **Receive money screen** (`/receive`): Receiving account (select: own CASH accounts), Date (default today), Total (THB), Note, Lines table (account select: own INCOME accounts; amount), "Add line" / remove-line buttons (at least one line).
- Live footer "Lines total ฿x of ฿y"; red with "Lines must add up to the total" while they differ; Save disabled until equal and all fields valid (NFR-10).
- Field errors under each input: "Required", "Must be more than 0", "At most 2 decimal places", "Date cannot be in the future", "Choose a different account for each line". Entered values are kept on any error, including server 422 (mapped from `details`).
- Pending: Save disabled with spinner. Success: toast "Saved" and the stored transaction detail. Empty: no INCOME account → "No income accounts available."

## 5 API
**`POST /api/transactions`** (USER)
- Request:
```json
{ "form": "RECEIPT", "primaryAccountId": 11, "date": "2026-11-05", "total": 3000000,
  "note": "November salary", "lines": [ { "accountId": 13, "amount": 3000000 } ] }
```
- 201: the stored transaction
```json
{ "id": 1, "form": "RECEIPT", "date": "2026-11-05", "total": 3000000, "note": "November salary", "status": "POSTED",
  "primaryAccount": { "id": 11, "name": "Bank", "type": "CASH" },
  "lines": [ { "id": 1, "account": { "id": 13, "name": "Salary", "type": "INCOME" }, "amount": 3000000 } ],
  "createdAt": "2026-11-07T04:00:00.000Z" }
```
- 400 `BAD_REQUEST` (shape/types, unknown `form`), 401, 403 (ADMIN), 404 `NOT_FOUND` (any account not the caller's), 422 `VALIDATION_FAILED` / `RULE_VIOLATION` with `details` keyed by field (`total`, `date`, `note`, `primaryAccountId`, `lines`, `lines[0].amount`, …).

## 6 Data
Migration `init_transactions`:
| Table / field | Type | Constraint |
|---|---|---|
| transactions.id | serial | PK |
| transactions.user_id | int | NOT NULL, FK → users.id |
| transactions.form | enum `TxnForm` (PAYMENT, RECEIPT) | NOT NULL |
| transactions.primary_account_id | int | NOT NULL, FK → accounts.id |
| transactions.txn_date | date | NOT NULL |
| transactions.total | bigint | NOT NULL, `CHECK (total > 0)` |
| transactions.note | varchar(200) | NULL |
| transactions.status | enum `TxnStatus` (POSTED, VOID) | NOT NULL, default POSTED |
| transactions.is_favorite | boolean | NOT NULL, default false (used in Sprint 3) |
| transactions.created_at / updated_at | timestamptz | NOT NULL |
| transaction_lines.id | serial | PK |
| transaction_lines.txn_id | int | NOT NULL, FK → transactions.id ON DELETE CASCADE |
| transaction_lines.account_id | int | NOT NULL, FK → accounts.id |
| transaction_lines.amount | bigint | NOT NULL, `CHECK (amount > 0)` |

Indexes: `transactions (user_id, txn_date DESC, id DESC)`; `transaction_lines (account_id)`; unique `transaction_lines (txn_id, account_id)`.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F04-01 | Given alice's Bank balance is 500000, when she posts RECEIPT Bank ← Salary 3000000 dated today, then the response is 201 with the transaction and one line, Bank balance becomes 3500000, and the transaction is stored with status POSTED. |
| AC-F04-02 | A RECEIPT with total 3000000 and lines 2000000 + 999999 (1 satang short) → 422 `RULE_VIOLATION`; no transaction or line is stored and Bank balance is unchanged. Same for zero lines. |
| AC-F04-03 | A RECEIPT whose primary account is Credit Card (LOAN_TAKEN) → 422 `RULE_VIOLATION`; a RECEIPT into Bank with a Dining (EXPENSE) line → 422; nothing stored. |
| AC-F04-04 | Line amount 0 or −100, total 100.5 or 100,000,000,000, date tomorrow (Bangkok) or 1999-12-31 → 422; date today → 201. |
| AC-F04-05 | A RECEIPT by alice using bob's Bank as primary, or bob's Salary as a line → 404; nothing stored; bob's balances unchanged. |
| AC-F04-06 | If posting fails after the transaction and line rows are inserted (balance update made to throw), no transaction, line or balance change remains. |
| AC-F04-07 | In the browser, with total ฿1,000.00 and one line of ฿900.00 the form shows "Lines must add up to the total" and Save is disabled; after a server 422 (future date entered by bypassing the picker) the field message is shown and all entered values remain. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F04-01 | AC-F04-01 | API-DB | alice; Bank opening 500000 | `POST /api/transactions` RECEIPT Bank←Salary 3000000, today | 201 body matches; DB: 1 transaction POSTED, 1 line; Bank balance 3500000 |
| TEST-F04-02 | AC-F04-02 | unit + API-DB (TDD) | Ledger core: lines [2000000, 999999] vs total 3000000; `[]` | Unit `validateLines`; API post both | Unit returns line-sum error; API 422 `RULE_VIOLATION`; tables empty; Bank unchanged |
| TEST-F04-03 | AC-F04-03 | unit + API-DB (TDD) | Ledger core allowed-lines table | Unit (RECEIPT, LOAN_TAKEN primary), (RECEIPT, EXPENSE line); API posts both | Unit rejects; API 422 `RULE_VIOLATION`; nothing stored |
| TEST-F04-04 | AC-F04-04 | unit + API-DB | Clock fixed to 2026-11-07 Bangkok | Post each invalid value; then valid today | Each invalid → 422 with matching `details` key; today → 201 |
| TEST-F04-05 | AC-F04-05 | API-DB | alice cookie; bob's account ids | Post with bob's Bank as primary; post with bob's Salary as line | Both 404; counts unchanged; bob balances unchanged |
| TEST-F04-06 | AC-F04-06 | API-DB | `vi.spyOn` balance-update step to throw | Post a valid RECEIPT | 500 `INTERNAL`; transactions/lines count 0; Bank balance unchanged |
| TEST-F04-07 | AC-F04-07 | E2E | alice logged in; Bank, Salary exist | Fill total 1000.00, line 900.00; check Save; fix to 1000.00, set date via request intercept to tomorrow, submit | Mismatch message + Save disabled; after 422 date error shown and total/line/note values kept |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F04-01 | — | NOT RUN | — |
| AC-F04-02 | — | NOT RUN | — |
| AC-F04-03 | — | NOT RUN | — |
| AC-F04-04 | — | NOT RUN | — |
| AC-F04-05 | — | NOT RUN | — |
| AC-F04-06 | — | NOT RUN | — |
| AC-F04-07 | — | NOT RUN | — |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial contract. Sprint 1 accepts only INCOME lines for RECEIPT (team decision D1-S4). | D1-S4 |
