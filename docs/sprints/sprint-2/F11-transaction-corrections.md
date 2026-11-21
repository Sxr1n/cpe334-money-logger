# F-11 Transaction corrections (edit and void) — Sprint 2
Linked: FR-20, FR-21, BR-01–BR-09, BR-11, BR-12, BR-16, NFR-01, NFR-02, NFR-06, NFR-10   Status: SPECIFIED   Owner: Leviathan-c137
Depends on: F-04, F-05, F-06; uses the full allowed-lines table from F-09/F-10 when merged. Design references: `docs/system-sds.md` §2.4 ("Edit and void reverse the old deltas and apply the new ones"); decisions D-06, D-12

## 1 Behavior & workflow
**Happy path A — edit (FR-20)**
1. Alice opens a card purchase in History: total ฿1,200.00 with lines Dining ฿700.00 + Groceries ฿500.00. She clicks Edit.
2. The Make a payment form opens pre-filled (`/transactions/:id/edit`). She changes it to total ฿1,000.00 with one line Dining ฿1,000.00, changes the note, and saves.
3. In one DB transaction the old effects are reversed and the new ones applied: card debt −฿200.00 net. The lines are replaced, so Groceries no longer counts this month. The detail page shows the corrected transaction.

The form (PAYMENT or RECEIPT) cannot change. Date, note, primary account, total and lines can.

**Happy path B — void (FR-21)**
1. On a transaction's detail page, Alice clicks Void, and an in-page confirmation panel asks "Void this transaction? Balances will be restored." She confirms.
2. Its effects are reversed and the status becomes VOID. It stays in History with a "Void" badge and is excluded from balances and summaries (BR-16). Edit and Void are no longer offered.

**Decision D-12:** an edit or void is rejected if the result would make any CASH, LOAN_TAKEN or LOAN_GIVEN balance negative. These are the same invariants as BR-07/BR-08. Example: voiding a ฿10,000.00 receipt after ฿8,000.00 of it was spent leaves Bank at −฿8,000.00 → rejected.

**Failure and boundary cases**
- Any BR-01–BR-04 or BR-09 violation in the corrected values → rejected, and the original transaction and balances are unchanged (BR-16 re-validation).
- Changing the form → rejected.
- Editing or voiding a VOID transaction → rejected.
- An account whose stored balance the edit or void would change (CASH / LOAN_TAKEN / LOAN_GIVEN, old or new) is archived → rejected with "Unarchive <name> first". New accounts are loaded like `POST` does, so an archived or foreign new account → 404.
- Another user's transaction id → 404.

## 2 Business rules & validation
**Edit** — `PUT /api/transactions/:id`, same body as `POST` (F-04 §5). Validation order:
1. JSON shape → 400.
2. Load the transaction with `userId = session user` → 404.
3. Load the new accounts with `userId` and `archived_at IS NULL` → 404.
4. Field and rule checks (BR-01–BR-04, BR-09, note) and `form = original form` → 422.
5. Post: in one DB transaction:
   - lock the transaction row `FOR UPDATE` and re-check `status = POSTED` (else 422)
   - lock the union of old and new accounts in ascending id order
   - compute `net delta = −(old effects) + (new effects)` per account with the ledger core
   - reject if any affected stored-balance account is archived, or would end below 0
   - replace the lines; update date, note, primary account and total; apply the net deltas; commit

**Void** — `POST /api/transactions/:id/void`, no body. In one DB transaction:
- lock the transaction row and re-check `status = POSTED`
- lock the affected accounts in ascending id order
- apply `−(old effects)`; reject if a balance would go below 0 or an affected stored-balance account is archived
- set `status = VOID`; commit

| Rule | Check | Error |
|---|---|---|
| BR-16 | status is POSTED | 422 `RULE_VIOLATION` ("This transaction is void") |
| form | body `form` = stored form | 422 `RULE_VIOLATION` (`details.form` = "The form cannot be changed; void and record a new transaction") |
| BR-01–04, BR-09, note | as F-04/F-05/F-09/F-10 | 400 / 404 / 422 as there |
| BR-07/BR-08, D-12 | after the net deltas, every affected CASH, LOAN_TAKEN and LOAN_GIVEN balance ≥ 0 | 422 `RULE_VIOLATION` (`details.total` = "<account> would go below ฿0.00 (−฿x)") |
| archived | no affected stored-balance account is archived | 422 `RULE_VIOLATION` ("Unarchive <name> first") |
| BR-05 / NFR-06 | all writes in one DB transaction; any failure rolls back everything | — |

Summaries (F-06) already read only POSTED transactions, so a voided transaction drops out of income and expense without summary changes. `updated_at` records the last edit or void.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `PUT /api/transactions/:id` | ✔ own transaction, own accounts (other's → 404) | 403 | 401 |
| `POST /api/transactions/:id/void` | ✔ own transaction (other's → 404) | 403 | 401 |

## 4 UI
- **Transaction detail** (`/transactions/:id`) for a POSTED transaction:
  - Edit button → `/transactions/:id/edit`.
  - Void button → in-page confirmation panel (not a browser dialog) with Confirm void / Cancel.
  - VOID transactions show a "Void" badge and no buttons.
- **Edit screen:** the Receive money or Make a payment form component, pre-filled with date, note, primary, total and lines; the title is "Edit payment" / "Edit receipt" and the button "Save changes".
  - In the account selects, the transaction's own accounts are shown with their balance before this transaction (current balance minus its effect). Other accounts show their current balance.
  - Same live footer, field errors and kept values as F-04/F-05 (NFR-10).
  - On success it returns to the detail page with "Transaction updated".
- **History:** VOID rows have a "Void" badge and their total struck through.
- Errors: 422 messages under the related field, or as an alert above the form for `details.total`; 404 → "Not found".

## 5 API
**`PUT /api/transactions/:id`** (USER) — body as `POST /api/transactions`.
- 200: the updated transaction (F-04 §5 shape, `status: "POSTED"`)
- Errors: 400, 404, 422 `VALIDATION_FAILED` / `RULE_VIOLATION`, 401, 403

**`POST /api/transactions/:id/void`** (USER)
- 200: the transaction with `"status": "VOID"`
- Errors: 404, 422 `RULE_VIOLATION`, 401, 403

## 6 Data
No schema change (`transactions.status` POSTED/VOID and `updated_at` exist). Lines of an edited transaction are deleted and re-inserted in the same DB transaction; line ids change.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F11-01 | Given a PAYMENT from Credit Card total 120000 (Dining 70000 + Groceries 50000) and debt 120000, editing it to total 100000 with one Dining line 100000 → 200, debt 100000, the transaction has exactly one line, and the month's expense for Dining is 100000 and for Groceries 0. |
| AC-F11-02 | Given a RECEIPT of 500000 into Bank (Salary line), editing the primary to Wallet and the date and note → 200, Bank −500000, Wallet +500000, and the detail shows the new date and note. |
| AC-F11-03 | Editing with lines ≠ total, a future date, a changed form, or a line equal to the primary → 422; the transaction, its lines and all balances are unchanged. |
| AC-F11-04 | Given Bank opening 0, a RECEIPT 500000 into Bank, then a PAYMENT 400000 from Bank (Bank 100000): editing the receipt to 399999 → 422 with nothing changed; editing it to 400000 → 200 and Bank = 0. |
| AC-F11-05 | Voiding a PAYMENT of 120000 from Bank → 200 `status: "VOID"`, Bank +120000, the month's expense drops by 120000, the transaction is still returned by history and detail with status VOID. |
| AC-F11-06 | Given a RECEIPT 1000000 into Bank and a PAYMENT 800000 from Bank, voiding the receipt → 422 (`details.total` names Bank), nothing changes; voiding a VOID transaction → 422; editing a VOID transaction → 422. |
| AC-F11-07 | Given a PAYMENT from Wallet that was later balanced to 0 and archived, voiding that payment → 422 "Unarchive Wallet first", nothing changes. |
| AC-F11-08 | Without a session `PUT` and void → 401; as admin → 403; alice editing or voiding bob's transaction → 404 and bob's transaction and balances are unchanged; alice editing her transaction to use bob's account → 404. |
| AC-F11-09 | (NFR-06) When the balance update step throws during an edit (test spy on `postingSteps`), the response is 500 and the transaction, its lines and every balance equal their values before the request. |
| AC-F11-10 | In the browser, alice opens a payment's detail, edits the amount, sees the updated detail and Overview balance; then voids it through the confirmation panel and sees the "Void" badge in detail and History. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F11-01 | AC-F11-01 | unit + API-DB (TDD) | card purchase posted | Unit: net-delta function (old vs new effects); API `PUT`; summary by account | Unit card −20000; 200; debt 100000; one line; Dining 100000, Groceries 0 |
| TEST-F11-02 | AC-F11-02 | API-DB | receipt into Bank; Wallet | `PUT` with Wallet primary, new date and note | 200; balances moved; detail fields |
| TEST-F11-03 | AC-F11-03 | API-DB | a posted payment | Four invalid `PUT`s | 422 each; snapshot of txn, lines and balances equal before/after |
| TEST-F11-04 | AC-F11-04 | API-DB (TDD) | as stated | `PUT` 399999 then 400000 | 422 with nothing changed; 200 and Bank 0 |
| TEST-F11-05 | AC-F11-05 | API-DB (TDD) | payment 120000 from Bank | void; read Bank, summary, history, detail | 200 VOID; Bank +120000; expense −120000; listed as VOID |
| TEST-F11-06 | AC-F11-06 | API-DB (TDD) | as stated | void receipt; void twice; `PUT` on VOID | 422 naming Bank, unchanged; 422; 422 |
| TEST-F11-07 | AC-F11-07 | API-DB | Wallet archived after balancing to 0 | void the payment | 422 and nothing changed |
| TEST-F11-08 | AC-F11-08 | API-DB | no cookie; admin; bob's transaction; bob's account | Each request | 401; 403; 404 with bob unchanged; 404 |
| TEST-F11-09 | AC-F11-09 | API-DB | spy makes `postingSteps.updateAccountBalance` throw on the 2nd call | `PUT` | 500; snapshot unchanged |
| TEST-F11-10 | AC-F11-10 | E2E | alice with a payment recorded | Detail → Edit → change amount → save → Overview → detail → Void → Confirm → History | Updated detail and balance; Void badge on detail and History |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F11-01 … AC-F11-10 | — | NOT RUN | — |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-22 | Initial contract. Edit keeps the form; edit/void rejected when a balance would go negative (D-12) or an affected stored-balance account is archived. | D2-S1 |
