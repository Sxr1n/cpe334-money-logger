# Software Requirements Specification — Personal Money and Expense Logging System

| Item | Value |
|---|---|
| Course | CPE334, Semester 1/2026 — Group Project, Theme 7 |
| Team | นายศารินทร์ ไชยารัตน์ (GitHub `Sxr1n`); นายตันติยวัตร จันทร์ศิริ (GitHub `Leviathan-c137`) — student IDs are given in the submitted PDF only |
| Repository | https://github.com/Sxr1n/cpe334-money-logger |
| Document version | 0.4 (decisions accepted by team) |
| Source brief | `docs/course/group_work_specs_v1.pdf` §6 Theme 7 |

> **Status:** decisions D-01–D-09 in §8.2 were accepted by the team on 2026-11-07 (v0.2). D-03 still awaits TA confirmation (Q-01); a different TA answer will be handled as a CHG.

---

## 1. Stakeholder problem and context

### 1.1 Problem
A person who earns a salary, spends with a credit card and occasionally lends or borrows money from friends cannot easily answer simple questions: *How much is in my bank account? How much do I owe on my card? How much did I spend on food this month? Who still owes me money?* Spreadsheets break when one payment covers several categories, when a card bill is repaid from a bank account, or when money moves between the user's own accounts — these movements are wrongly counted as income or expense.

### 1.2 Chosen context
Young adults in Thailand (university students and first-jobbers) who manage a few bank/wallet accounts, one or two credit cards and informal personal loans, in Thai baht. Each person keeps a private ledger on a web application. A platform administrator operates the service but must never see anyone's financial data.

### 1.3 Product goal
Provide a private, multi-user web ledger in which every money movement is recorded once, split across one or more allocation lines, and immediately reflected in correct account balances, outstanding debts and income/expense summaries.

---

## 2. Actors and responsibilities

| Actor | Description | Responsibilities | Must not |
|---|---|---|---|
| **User** | A person tracking their own money | Maintain own accounts and opening balances; record payments/charges and money received; review balances, debts, summaries and history; correct own transactions; manage favourites | Access any other user's records; perform administration |
| **Administrator** | Platform operator (seeded account) | List platform users; enable or disable user accounts | View, create or modify any financial account, transaction, favourite or summary |
| Course instructor / TA | Acceptance stakeholder | Approve scope changes and the alternative-slice decisions in §8 | — |

One role per login account (specs §5.2). Self-registration is out of scope; users and administrators are created by the seed procedure.

---

## 3. Product scope

### 3.1 In scope (whole product, Sprints 1–3)
- Authentication (login, logout, current user) and two roles with backend enforcement.
- Administrator management of user access (enable/disable).
- Five account types: **CASH, LOAN_GIVEN, LOAN_TAKEN, INCOME, EXPENSE**; creation, renaming and archiving.
- Opening balances for CASH, LOAN_GIVEN and LOAN_TAKEN accounts.
- Two transaction forms with one or more allocation lines: **Make a payment or record a charge** (PAYMENT) and **Receive money** (RECEIPT), covering expenses, income, transfers, lending, borrowing and loan repayments.
- Account balances, outstanding loans (taken and given), credit-card debt, income and expense summaries, category spending and transaction history.
- Transaction corrections (edit and void), search and filtering.
- Favourite transactions and **Duplicate** to start a new editable transaction.
- Period reports.

### 3.2 Explicit exclusions
Period budgets; shared budgets; automatic recurring transactions; bank or card integration and statement import; real payments; multiple currencies; self-registration, password recovery and email verification; multiple roles per account; receipt/photo attachments; native mobile apps; data export beyond what an approved change adds.

---

## 4. Domain model (conceptual)

### 4.1 Account types
| Type | Examples | Balance means | Normal sign |
|---|---|---|---|
| CASH | Wallet, savings account, bank account | Money the user holds | ≥ 0 (BR-07) |
| LOAN_TAKEN | Credit card, loan from a friend | Amount the user still owes | ≥ 0 (BR-08) |
| LOAN_GIVEN | Money lent to a friend | Amount still owed to the user | ≥ 0 (BR-08) |
| INCOME | Salary, interest earned | Total received in a period | reporting only |
| EXPENSE | Dining, groceries, electricity, telecom | Total spent in a period | reporting only |

### 4.2 Transaction forms
A transaction has a **form**, a **date**, an optional **note**, a **total amount**, one **primary account** and **one or more allocation lines** (each line = account + positive amount).

| Form | Primary account (money comes from / goes to) | Allowed line account types and meaning |
|---|---|---|
| PAYMENT | CASH or LOAN_TAKEN (the account used to pay) | EXPENSE (spending) · LOAN_TAKEN (repaying a debt) · LOAN_GIVEN (lending) · CASH (transfer to another own cash account) |
| RECEIPT | CASH (the account receiving money) | INCOME (earning) · LOAN_GIVEN (a debtor repays the user) · LOAN_TAKEN (new borrowing) · CASH (transfer from another own cash account) |

### 4.3 Balance effects (normative, see BR-05)
| Form | Primary account effect | Line effect by line type |
|---|---|---|
| PAYMENT from CASH | CASH − total | EXPENSE +x · LOAN_TAKEN debt −x · LOAN_GIVEN receivable +x · CASH (other) +x |
| PAYMENT from LOAN_TAKEN (a charge) | debt + total | same as above |
| RECEIPT into CASH | CASH + total | INCOME +x · LOAN_GIVEN receivable −x · LOAN_TAKEN debt +x · CASH (other) −x |

Example (Sprint 1 scenario): a ฿1,200 card purchase with lines Dining ฿700 + Groceries ฿500 increases card debt by ฿1,200 and expenses by ฿1,200; a later ฿1,200 PAYMENT from Bank with one LOAN_TAKEN line to the card reduces Bank by ฿1,200 and card debt by ฿1,200 and **does not** change expenses.

---

## 5. Functional requirements

Planned sprint is the baseline allocation; the authoritative allocation and feature mapping are in `docs/features.md` and `docs/traceability.md`.

| ID | Requirement (observable behaviour) | Actor | Sprint |
|---|---|---|---|
| **Authentication and access** ||||
| FR-01 | The system shall let a seeded user or administrator log in with username and password and start a server-side session; invalid credentials are rejected with a generic message. | All | 1 |
| FR-02 | The system shall let a logged-in actor log out, after which the previous session token is rejected. | All | 1 |
| FR-03 | The system shall return the current actor's identity (id, username, display name, role) for a valid session. | All | 1 |
| FR-04 | An administrator shall be able to list platform users with username, display name, role, status (ACTIVE/DISABLED) and creation date — and no financial data. | Admin | 1 |
| FR-05 | An administrator shall be able to disable and re-enable a user account. | Admin | 1 |
| **Accounts and opening balances** ||||
| FR-06 | A user shall see their own accounts grouped by type with current balance (CASH, LOAN_TAKEN, LOAN_GIVEN) or period total (INCOME, EXPENSE). | User | 1 |
| FR-07 | A user shall be able to set the opening balance and opening date of a CASH, LOAN_TAKEN or LOAN_GIVEN account. | User | 1 |
| FR-08 | A user shall be able to create accounts of any of the five types. | User | 2 |
| FR-09 | A user shall be able to rename and archive an account; archived accounts are hidden from new-transaction choices but remain in history and reports. | User | 2 |
| FR-10 | A user shall be able to change an existing opening balance or opening date, with balances recomputed. | User | 2 |
| **Recording transactions** ||||
| FR-11 | A user shall be able to record **Receive money** into a CASH account with one or more INCOME lines. | User | 1 |
| FR-12 | A user shall be able to record **Make a payment or record a charge** from a CASH or LOAN_TAKEN account with one or more EXPENSE lines. | User | 1 |
| FR-13 | A user shall be able to repay a LOAN_TAKEN account (e.g. a credit card) through a PAYMENT line from a CASH account. | User | 1 |
| FR-14 | A user shall be able to transfer money between their own CASH accounts (PAYMENT line to CASH, or RECEIPT line from CASH). | User | 2 |
| FR-15 | A user shall be able to record lending (PAYMENT line to LOAN_GIVEN) and receiving a repayment of money lent (RECEIPT line from LOAN_GIVEN). | User | 2 |
| FR-16 | A user shall be able to record new borrowing (RECEIPT line from LOAN_TAKEN). | User | 2 |
| FR-17 | A single transaction shall be able to mix any allowed line types for its form (e.g. salary + loan repayment received in one RECEIPT). | User | 2 |
| **History, corrections and favourites** ||||
| FR-18 | A user shall see their transaction history (newest first, paginated) with date, form, primary account, total, note and lines, and open a transaction's detail. | User | 1 |
| FR-19 | A user shall be able to search and filter history by date range, account, form, amount range and note text. | User | 2 |
| FR-20 | A user shall be able to correct (edit) a transaction's date, note, primary account and lines, with all affected balances recomputed. | User | 2 |
| FR-21 | A user shall be able to void a transaction; it stays visible in history marked VOID and no longer affects balances or summaries. | User | 2 |
| FR-22 | A user shall be able to mark and unmark a transaction as favourite and view the list of favourites. | User | 3 |
| FR-23 | A user shall be able to **Duplicate** a transaction, opening a new editable form pre-filled with its form, accounts, lines and note; nothing is saved until submitted. | User | 3 |
| **Balances, summaries and reports** ||||
| FR-24 | A user shall see an overview with total CASH balance per account, outstanding LOAN_TAKEN balances (credit-card debt and other borrowing) and outstanding LOAN_GIVEN balances. | User | 1 |
| FR-25 | A user shall see an income and expense summary (totals and net) for a selected period, defaulting to the current calendar month. | User | 1 |
| FR-26 | A user shall see category spending for a period: each EXPENSE account's total and percentage of all expenses. | User | 3 |
| FR-27 | A user shall see a period report with monthly income, expense and net for a selected range of months. | User | 3 |

---

## 6. Business rules

| ID | Rule | Applies to |
|---|---|---|
| BR-01 | A transaction must have at least one allocation line; every line amount must be > 0; the sum of line amounts must equal the transaction total exactly (to the satang). Otherwise the transaction is rejected and nothing is stored. | FR-11–17, FR-20 |
| BR-02 | Amounts are THB, positive, with at most 2 decimal places, and at most 999,999,999.99. | All amounts |
| BR-03 | Account types must match the form (§4.2): PAYMENT primary ∈ {CASH, LOAN_TAKEN}; RECEIPT primary = CASH; line types restricted as in §4.2. | FR-11–17 |
| BR-04 | Every account in a transaction must belong to the acting user and be active (not archived). A line must not use the primary account, and the same account must not appear in two lines of one transaction. | FR-11–17, FR-20 |
| BR-05 | Recording, editing or voiding a transaction must update every affected account balance according to §4.3 within one atomic database transaction. | FR-11–21 |
| BR-06 | Only INCOME lines count as income and only EXPENSE lines count as expense. Transfers, lending, borrowing, loan repayments and opening balances are never counted as income or expense. | FR-24–27 |
| BR-07 | A CASH account's balance must not become negative: a PAYMENT from CASH, or a RECEIPT line transferring from CASH, is rejected if the resulting current balance would be < 0. *(D-03)* | FR-12–17, FR-20 |
| BR-08 | A repayment cannot exceed what is outstanding: a LOAN_TAKEN repayment line cannot exceed that account's current debt, and a LOAN_GIVEN repayment line cannot exceed that account's current receivable. *(D-04)* | FR-13, FR-15, FR-20 |
| BR-09 | A transaction date must not be later than today in Asia/Bangkok and not earlier than 2000-01-01. *(D-05)* | FR-11–20 |
| BR-10 | An opening balance is allowed only for CASH, LOAN_TAKEN and LOAN_GIVEN accounts, must be ≥ 0, is at most one per account, and is never counted as income or expense. | FR-07, FR-10 |
| BR-11 | A user may read or change only their own accounts, transactions, favourites and summaries. A request for another user's record returns **404 Not Found** without revealing whether it exists. | All user features |
| BR-12 | An administrator may not call any financial endpoint (**403 Forbidden**); a user may not call any administration endpoint (**403**). Role and identity come only from the server session, never from client input. | All |
| BR-13 | A disabled user cannot log in, and their existing sessions are rejected from the next request. An administrator cannot disable their own account. | FR-01, FR-05 |
| BR-14 | Account names are 1–50 characters and unique per user and type (case-insensitive). | FR-08, FR-09 |
| BR-15 | An account that has transactions cannot be deleted, only archived. A CASH, LOAN_TAKEN or LOAN_GIVEN account can be archived only when its balance is 0. *(D-07)* | FR-09 |
| BR-16 | A voided transaction cannot be edited; it remains in history marked VOID and is excluded from balances and summaries. Edits re-validate BR-01–BR-09 against the corrected values. | FR-20, FR-21 |
| BR-17 | Duplicate copies form, primary account, lines and note, sets the date to today, does not copy the favourite flag, and stores nothing until the user submits (which then applies all rules). | FR-23 |

---

## 7. Non-functional requirements

| ID | Requirement and measurable target | Verification method | Sprint established / verified |
|---|---|---|---|
| NFR-01 | **Authentication required.** 100% of protected API endpoints return 401 for requests without a valid session and return no private data in the body. | API test per protected endpoint (unauthenticated request) | 1 / every sprint (regression) |
| NFR-02 | **Backend authorization and ownership.** For 100% of protected endpoints: cross-user record access returns 404 and wrong-role access returns 403. | API/DB integration tests: user A vs user B records; admin → financial; user → admin | 1 / every sprint |
| NFR-03 | **Password storage.** Passwords are stored only as bcrypt (cost ≥ 10) or argon2id hashes; no plaintext password appears in the database, logs or API responses. | Integration test reading the stored user row; code review of logging | 1 |
| NFR-04 | **Session lifecycle.** Sessions expire after at most 8 hours; logout invalidates the session on the server so the old token is rejected (401). | API test: logout then reuse token; expiry test with clock control | 1 |
| NFR-05 | **Monetary accuracy.** Money is stored as integer satang; after a seeded run of 1,000 random valid transactions, every account balance equals an independent recomputation from the lines with 0 satang difference. | Automated property/regression test | 1 (integer storage) / 2 (1,000-transaction test) |
| NFR-06 | **Atomicity.** A failure while saving a transaction leaves no partial transaction, lines or balance change. | Integration test with an injected failure after the first line insert | 1 |
| NFR-07 | **Durability.** Recorded data is still retrievable after an application container restart and a redeployment. | Post-deployment check: record → restart/redeploy → retrieve | 2 (Lab 5 deployment) |
| NFR-08 | **Responsiveness.** With 5,000 transactions for one user, the overview and the first history page (50 rows) respond in ≤ 500 ms at the 95th percentile on the deployed environment. | Scripted measurement (20 requests each) on the deployed release | 3 |
| NFR-09 | **Configuration and secrets.** No secret or real password is committed; all secrets and database settings come from environment variables; `.env.example` documents every variable. | CI secret scan + review of `.env.example` | 2 (Lab 5 CI) |
| NFR-10 | **Usable validation.** On invalid input every transaction and account form shows a field-level message and keeps the user's entered values; the line-total mismatch is shown before submit. | E2E tests on the transaction form (S1) and account form (S2) | 1 / 2 |
| NFR-11 | **Reproducible setup.** A fresh clone reaches a running app with seeded demo data using the README commands (migrate, seed, run) without manual database edits. | Fresh-clone check recorded per release | 1 / every release |

---

## 8. Assumptions, decisions and open questions

### 8.1 Assumptions
- A-01 Single currency (THB); no exchange rates.
- A-02 Transaction dates are calendar dates (no time of day); "today" and month boundaries use Asia/Bangkok.
- A-03 Users access the product through a desktop or mobile web browser; no offline mode.
- A-04 All demo data is synthetic; seeded accounts follow the Sprint 1 example in the specs (bank account, credit card, several income and expense accounts per user).
- A-05 One role per login account; administrators are created only by seeding.

### 8.2 Decisions
| ID | Decision | Rationale | Status |
|---|---|---|---|
| D-01 | Store money as integer satang (BIGINT); format as THB only at the UI. | Avoids floating-point error (NFR-05). | Accepted (team, 2026-11-07) |
| D-02 | Identity and role come only from a server-side session; cross-user access returns 404, wrong role 403. | Specs §5.2; avoids leaking record existence. | Accepted (team, 2026-11-07) |
| D-03 | CASH accounts may not go negative (BR-07); overdraft is not modelled. | Target users rarely have overdraft; gives a clear, testable rule. Simplification: checks the current balance, not the balance on the transaction date. | Accepted (team, 2026-11-07); TA confirmation pending (Q-01) |
| D-04 | Repayments cannot exceed the outstanding amount (BR-08); credit cards have no credit limit in the baseline. | Prevents meaningless negative debts; a credit limit is not in the brief. | Accepted (team, 2026-11-07) |
| D-05 | Future-dated transactions are rejected (BR-09). | The product logs what happened; scheduled/recurring items are excluded. | Accepted (team, 2026-11-07) |
| D-06 | Corrections use edit and void (FR-20, FR-21); a voided transaction remains visible. | Keeps history auditable while allowing fixes. | Accepted (team, 2026-11-07) |
| D-07 | Accounts with transactions are archived, never deleted (BR-15). | Preserves history and report totals. | Accepted (team, 2026-11-07) |
| D-08 | Disabling a user revokes their sessions on the next request (BR-13). | Administrator control must take effect immediately. | Accepted (team, 2026-11-07) |
| D-09 | Sprint 1 uses seeded accounts; account creation UI arrives in Sprint 2 (FR-08). | Matches the specs' Sprint 1 example and keeps the slice feasible. | Accepted (team, 2026-11-07) |

### 8.3 Open questions
| ID | Question | Owner | Resolution |
|---|---|---|---|
| Q-01 | Is the cash non-negative rule (D-03) acceptable as the Sprint 1 rule, or should negative bank balances be allowed? | Team → TA | Open |
| Q-02 | Should an administrator be able to see aggregate, non-identifying platform statistics (e.g. user count)? Current answer: no financial aggregates at all. | Team | Open |
| Q-03 | Should editing an opening balance (FR-10) be allowed after transactions exist on that account? | Team | Open |

---

## 9. Glossary
- **Allocation line** — one part of a transaction: an account and a positive amount.
- **Primary account** — the account used to pay (PAYMENT) or receiving money (RECEIPT).
- **Outstanding debt** — current balance of a LOAN_TAKEN account.
- **Receivable** — current balance of a LOAN_GIVEN account.
- **Void** — mark a transaction as cancelled without deleting it.

## 10. Revision history
| Version | Date | Change | Author |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial draft from Theme 7 brief (AI-assisted draft, pending team review) | `<Student>` + Claude |
| 0.2 | 2026-11-07 | D-01–D-09 changed from Proposed to Accepted (team); removed "Proposed" markers from BR-07/08/09/15. No FR/BR/NFR text changed. Reason: freeze rules before Sprint 1 contracts (D1-S2). | Team + Claude |
| 0.3 | 2026-11-07 | Team names and student IDs filled in. No requirement changed. | Team |
| 0.4 | 2026-11-14 | Student IDs removed from the repository before it becomes public (Lab 5 R-12); they appear only in submitted PDFs. No requirement changed. | Team |
