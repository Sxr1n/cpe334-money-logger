# F-07 Account management — Sprint 2
Linked: FR-08, FR-09, BR-04, BR-11, BR-12, BR-14, BR-15, NFR-01, NFR-02, NFR-10   Status: SPECIFIED   Owner: Sxr1n
Depends on: F-01, F-03 (account list), F-06. Design references: `docs/system-sds.md` §2.3 (case-insensitive name index), §4; decisions D-07, D-11

## 1 Behavior & workflow
**Happy path A — create an account (FR-08)**
1. Alice opens Accounts and clicks "New account". She enters name "Wallet" and type Cash, then saves.
2. Wallet appears under Cash with balance ฿0.00 and "Set opening balance". It can be chosen at once on Receive money and Make a payment.
3. Any of the five types can be created the same way. Examples: "Loan to Ken" (LOAN_GIVEN), "Loan from Mom" (LOAN_TAKEN), "Interest" (INCOME), "Transport" (EXPENSE).

**Happy path B — rename (FR-09)**
1. Alice renames Dining to "Food & drinks".
2. The new name is shown everywhere, including history rows recorded before the rename. History shows the account's current name.

**Happy path C — archive and unarchive (FR-09, BR-15, D-11)**
1. Alice archives Telecom (EXPENSE). It moves to a collapsed "Archived" section on Accounts and is no longer offered on the transaction forms.
2. Old transactions that use Telecom stay in history, and its lines still count in summaries for their period.
3. She clicks "Unarchive" and Telecom becomes usable again.

**Failure and boundary cases**
- Name empty or only spaces, or longer than 50 characters after trimming → rejected. Exactly 50 characters → accepted.
- Same name and type as another own account, ignoring case (for example "bank" when "Bank" exists) → 409. This includes archived accounts. The same name with a different type, or in another user's accounts, is allowed.
- Archive a CASH, LOAN_TAKEN or LOAN_GIVEN account whose balance is not 0 → rejected, nothing changes (BR-15). INCOME and EXPENSE accounts can always be archived.
- Archiving an archived account, or unarchiving an active one, → 200 with no change.
- An archived account used in a new transaction (as primary or line) → 404 nothing stored. This is the existing loader in F-04 §2, which loads only `archived_at IS NULL` accounts.
- Setting an opening balance (F-03) or changing it (F-08) on an archived account → 422.
- Accounts are never deleted (D-07). There is no delete endpoint.

## 2 Business rules & validation
Validation order: (1) JSON shape → 400; (2) for `PATCH`, load the account with `userId = session user` → 404; (3) field validation → 422 `VALIDATION_FAILED`; (4) rules → 409 / 422 `RULE_VIOLATION`; (5) write.

| Rule | Check | Error |
|---|---|---|
| shape | `POST`: `name` string, `type` string. `PATCH`: at least one of `name` (string) and `archived` (boolean); no other fields. Unknown fields such as `userId` or `balance` are ignored, never used. | 400 `BAD_REQUEST` |
| BR-14 | `name.trim()` has 1–50 characters | 422 `VALIDATION_FAILED` (`details.name`) |
| type | `type` ∈ {CASH, LOAN_TAKEN, LOAN_GIVEN, INCOME, EXPENSE} | 422 `VALIDATION_FAILED` (`details.type`) |
| BR-14 | no other own account with the same type and `lower(name)`, archived accounts included. The DB unique index `(user_id, type, lower(name))` is the backstop: a unique violation maps to 409, never 500. | 409 `CONFLICT` (`details.name` = "You already have a <type> account with this name") |
| BR-15 | `archived: true` on CASH, LOAN_TAKEN or LOAN_GIVEN requires `balance = 0`. The check runs on the row locked with `SELECT … FOR UPDATE` in the same DB transaction as the update, so a concurrent posting cannot slip in. | 422 `RULE_VIOLATION` (`details.archived` = "Balance must be ฿0.00 to archive (now ฿x)") |
| BR-04 | The posting lock query in `POST /api/transactions` also requires `archived_at IS NULL`. This is a change to the F-04 engine: an account archived between loading and locking makes the posting return 404. | 404 |
| BR-11 | other user's account id, or unknown id | 404 `NOT_FOUND` |

New accounts start with `balance = 0`, `opening_balance = NULL` and `archived_at = NULL`. Archive sets `archived_at = now()`; unarchive sets it back to `NULL`.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `GET /api/accounts` (now includes `archived`) | ✔ own only | 403 | 401 |
| `POST /api/accounts` | ✔ creates for the session user only | 403 | 401 |
| `PATCH /api/accounts/:id` | ✔ own account (other's → 404) | 403 | 401 |

## 4 UI
- **Accounts screen** (`/accounts`):
  - A "New account" button opens an inline form with Name (text) and Type (select with the five types, labelled Cash / Debt (credit card or loan taken) / Owed to me (loan given) / Income / Expense). Buttons: Save and Cancel.
  - Each active row gets Rename (inline text input with Save/Cancel) and Archive.
  - Archived accounts are listed in a collapsed "Archived (n)" section at the bottom. Each archived row has Unarchive.
- **Validation:** client checks name length before sending. Server `details.name` / `details.type` / `details.archived` messages are shown under the field or row, and the entered values are kept (NFR-10). Save is disabled while a request is pending.
- **Transaction forms** (`/receive`, `/pay`): account selects list only active accounts (`archived = false`).
- **Overview:** archived accounts are not listed. Their balance is 0, so the totals do not change.
- **History and detail:** they show archived accounts by name like any other account.
- Empty: unchanged from F-03.

## 5 API
**`GET /api/accounts?from&to`** — as F-03/F-06. Each item gains `"archived": false|true`. Archived accounts are included; clients filter.

**`POST /api/accounts`** (USER)
- Request: `{ "name": "Wallet", "type": "CASH" }`
- 201: `{ "id": 31, "name": "Wallet", "type": "CASH", "balance": 0, "openingBalance": null, "openingDate": null, "archived": false }`
- Errors: 400 `BAD_REQUEST`, 422 `VALIDATION_FAILED`, 409 `CONFLICT`, 401, 403.

**`PATCH /api/accounts/:id`** (USER)
- Request: `{ "name": "Food & drinks" }` or `{ "archived": true }` or both.
- 200: the updated account (same shape as `POST`).
- Errors: 400, 404 `NOT_FOUND`, 422 `VALIDATION_FAILED`, 409 `CONFLICT`, 422 `RULE_VIOLATION` (archive with non-zero balance), 401, 403.

**`PUT /api/accounts/:id/opening-balance`** (F-03): archived account → 422 `RULE_VIOLATION` ("Account is archived").

## 6 Data
No schema change. `accounts.archived_at` and the unique index `accounts_user_id_type_lower_name_key` on `(user_id, type, lower(name))` already exist (migration `20261112230000_init_accounts`). No migration.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F07-01 | When alice posts each of the five types (Wallet CASH, Loan to Ken LOAN_GIVEN, Loan from Mom LOAN_TAKEN, Interest INCOME, Transport EXPENSE), then each returns 201 with balance 0, `archived: false`, and appears in her `GET /api/accounts`; a RECEIPT into the new Wallet with an Interest line of 10000 returns 201. |
| AC-F07-02 | Name "" , "   " or 51 characters → 422 `VALIDATION_FAILED` (`details.name`) and no account is created; a 50-character name → 201; "  Wallet  " is stored as "Wallet". Type "SAVINGS" → 422 (`details.type`). |
| AC-F07-03 | Given alice has Bank (CASH), creating "bank" CASH → 409 and no account is created; creating "Bank" EXPENSE → 201; bob creating "Wallet" CASH after alice has one → 201. Renaming Dining to "groceries" (alice has Groceries EXPENSE) → 409 and Dining keeps its name. |
| AC-F07-04 | When alice renames Dining to "Food & drinks", then 200, and `GET /api/transactions/:id` of an earlier card purchase shows its line account name as "Food & drinks". |
| AC-F07-05 | Given Bank balance 0, archiving Bank → 200 `archived: true`; given Bank balance 1, archiving → 422 `RULE_VIOLATION` (`details.archived`) and Bank stays active with balance 1; archiving Telecom (EXPENSE, with lines this month) → 200, the month summary still includes Telecom's lines, and the history still lists those transactions. |
| AC-F07-06 | Given Telecom is archived, a PAYMENT with a Telecom line, or a RECEIPT into an archived Wallet, → 404 and nothing is stored; after unarchiving Telecom (`archived: false` → 200) the same PAYMENT → 201. Setting an opening balance on an archived CASH account → 422. |
| AC-F07-07 | Without a session `POST /api/accounts` and `PATCH /api/accounts/:id` → 401; as admin → 403; alice `PATCH` on bob's Bank (rename or archive) → 404 and bob's account is unchanged; `POST` with `"userId": <bob's id>` creates the account for alice, not bob. |
| AC-F07-08 | In the browser on `/accounts`, alice creates "Wallet" (Cash) and sees it under Cash; creating "wallet" again shows "You already have a CASH account with this name" under Name and keeps the typed name; archiving an account with a non-zero balance shows the balance message; archiving a zero-balance account moves it to "Archived" and it is no longer offered on `/pay`. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F07-01 | AC-F07-01 | API-DB | alice session; seeded accounts | `POST` five accounts; `GET /api/accounts`; post RECEIPT into Wallet with Interest line | five 201s with balance 0; all listed with `archived: false`; RECEIPT 201 |
| TEST-F07-02 | AC-F07-02 | unit + API-DB | — | Unit: name/type validator with "", "   ", 50 and 51 chars, padded name, bad type; API: same inputs | Unit results match; API 422 with `details.name` / `details.type`, 201 for 50 chars, stored name trimmed; account count unchanged after each 422 |
| TEST-F07-03 | AC-F07-03 | API-DB (TDD) | alice has Bank, Dining, Groceries; bob seeded | `POST` "bank" CASH; "Bank" EXPENSE; bob "Wallet"; `PATCH` Dining name "groceries" | 409; 201; 201; 409 and Dining unchanged |
| TEST-F07-04 | AC-F07-04 | API-DB | alice card purchase with a Dining line | `PATCH` Dining name; `GET /api/transactions/:id` | 200; line account name "Food & drinks" |
| TEST-F07-05 | AC-F07-05 | API-DB (TDD) | Bank balance 0, then 1 (set in test setup); Telecom line this month | Archive Bank at 0; reset; archive at 1; archive Telecom; `GET /api/summary`; `GET /api/transactions` | 200 archived; 422 and balance 1, not archived; 200; summary expense still includes Telecom; history unchanged |
| TEST-F07-06 | AC-F07-06 | API-DB | Telecom archived; archived Wallet | PAYMENT with Telecom line; RECEIPT into Wallet; unarchive Telecom; PAYMENT again; opening balance on archived CASH | 404, 404 with transaction count unchanged; 200; 201; 422 |
| TEST-F07-07 | AC-F07-07 | API-DB | no cookie; admin cookie; alice cookie; bob's Bank id | `POST` / `PATCH` as each; alice `PATCH` bob's Bank; alice `POST` with `userId` of bob | 401; 403; 404 and bob's row unchanged; account owned by alice |
| TEST-F07-08 | AC-F07-08 | E2E | alice logged in (E2E DB reset) | Create Wallet; create "wallet"; archive Bank with balance; archive a zero-balance account; open `/pay` | Wallet listed; duplicate message and value kept; balance message; account under Archived and absent from `/pay` selects |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F07-01 … AC-F07-08 | — | NOT RUN | — |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-22 | Initial contract. Archive and unarchive with no delete (D-07, D-11); archived accounts give 404 on posting (existing F-04 loader) and the posting lock re-checks `archived_at`. | D2-S1 |
