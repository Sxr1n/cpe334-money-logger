# Feature Inventory — Personal Money and Expense Logging System

| Item | Value |
|---|---|
| Source | `docs/srs.md` v0.2 |
| Document version | 0.1 |
| Related | `docs/traceability.md` (requirement → feature → sprint → AC/TEST), `docs/sprints/plan.md` |

Feature IDs are stable. A feature that is dropped is marked `WITHDRAWN (CHG-xx)`, never renumbered. Status follows `PLANNED → SPECIFIED → IN PROGRESS → IMPLEMENTED → TESTED → ACCEPTED` (`INCOMPLETE` if not finished).

## 1. Features

| F-ID | Name | Description | FR | BR | NFR | Depends on | Sprint | Status |
|---|---|---|---|---|---|---|---|---|
| F-01 | Authentication and session | Login with username/password, logout, current user (`/me`). Seeded users and administrators only. Disabled users cannot log in. | FR-01, FR-02, FR-03 | BR-12, BR-13 | NFR-01, NFR-03, NFR-04 | — | 1 | PLANNED |
| F-02 | Administrator user access | Administrator lists platform users (no financial data) and disables/re-enables them; disabling revokes the user's sessions on the next request. Administrators get 403 on every financial endpoint; users get 403 on every admin endpoint. | FR-04, FR-05 | BR-12, BR-13 | NFR-01, NFR-02 | F-01 | 1 | PLANNED |
| F-03 | Opening balance | Set the opening balance and opening date of a seeded CASH, LOAN_TAKEN or LOAN_GIVEN account (once per account). Never counted as income or expense. | FR-07 | BR-02, BR-06, BR-10, BR-11 | NFR-02, NFR-05 | F-01 | 1 | PLANNED |
| F-04 | Receive money | Record a RECEIPT into a CASH account with one or more INCOME lines (e.g. salary into Bank). Establishes the shared transaction engine: line validation, form/account-type rules and atomic balance posting. | FR-11 | BR-01, BR-02, BR-03, BR-04, BR-05, BR-09, BR-11 | NFR-02, NFR-05, NFR-06, NFR-10 | F-01, F-03 | 1 | PLANNED |
| F-05 | Make a payment or record a charge | Record a PAYMENT from a CASH or LOAN_TAKEN account with one or more EXPENSE lines (e.g. card purchase split Dining + Groceries), and repay a LOAN_TAKEN account from a CASH account (e.g. pay the card bill from Bank). | FR-12, FR-13 | BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07, BR-08, BR-09, BR-11 | NFR-02, NFR-05, NFR-06, NFR-10 | F-04 | 1 | PLANNED |
| F-06 | Overview, summary and history | Accounts grouped by type with balances/period totals; overview of CASH balances, outstanding LOAN_TAKEN (card debt) and LOAN_GIVEN; income/expense summary for a period (default: current Bangkok month); paginated transaction history and detail. | FR-06, FR-18, FR-24, FR-25 | BR-06, BR-11 | NFR-02, NFR-08 | F-03, F-04, F-05 | 1 | PLANNED |
| F-07 | Account management | Create accounts of all five types; rename; archive (accounts with transactions are never deleted; balance must be 0 to archive). Archived accounts are hidden from new transactions but kept in history and reports. | FR-08, FR-09 | BR-04, BR-14, BR-15 | NFR-02, NFR-10 | F-01, F-06 | 2 | PLANNED |
| F-08 | Opening balance management | Change an existing opening balance or opening date, with balances recomputed. | FR-10 | BR-05, BR-10 | NFR-02, NFR-05 | F-03 | 2 | PLANNED |
| F-09 | Transfers between own cash accounts | PAYMENT line to another CASH account, or RECEIPT line from another CASH account. Not counted as income or expense. | FR-14 | BR-03, BR-04, BR-06, BR-07 | NFR-02 | F-04, F-05, F-07 | 2 | PLANNED |
| F-10 | Loans given and taken | Lend (PAYMENT line to LOAN_GIVEN), receive repayment (RECEIPT line from LOAN_GIVEN), borrow (RECEIPT line from LOAN_TAKEN); one transaction may mix any allowed line types for its form. Not counted as income or expense. | FR-15, FR-16, FR-17 | BR-03, BR-04, BR-06, BR-08 | NFR-02 | F-04, F-05, F-07 | 2 | PLANNED |
| F-11 | Transaction corrections | Edit a transaction's date, note, primary account and lines (all rules re-validated, balances recomputed); void a transaction (kept in history marked VOID, excluded from balances and summaries). | FR-20, FR-21 | BR-01–BR-09, BR-16 | NFR-02, NFR-06 | F-04, F-05, F-06 | 2 | PLANNED |
| F-12 | Search and filter history | Filter history by date range, account, form, amount range and note text. | FR-19 | BR-11 | NFR-02, NFR-08 | F-06 | 2 | PLANNED |
| F-13 | Favourite transactions | Mark/unmark a transaction as favourite and list favourites. | FR-22 | BR-11 | NFR-02 | F-06 | 3 | PLANNED |
| F-14 | Duplicate transaction | Open a new editable form pre-filled from an existing transaction (date = today, favourite not copied); nothing stored until submitted. | FR-23 | BR-17 | NFR-02 | F-04, F-05, F-13 | 3 | PLANNED |
| F-15 | Category spending | Per-EXPENSE-account totals and percentage of all expenses for a period. | FR-26 | BR-06, BR-11 | NFR-02 | F-06 | 3 | PLANNED |
| F-16 | Period reports | Monthly income, expense and net for a selected range of months (Asia/Bangkok month boundaries). | FR-27 | BR-06, BR-11 | NFR-02 | F-06 | 3 | PLANNED |

Note on F-14 → F-13: Duplicate is reachable from any transaction detail; the dependency on F-13 is only for the "Duplicate from favourites" entry point.

## 2. System responsibilities (cross-cutting)

Requirements that apply to every feature are owned by a named system responsibility. Each new feature must pass the responsibility's checks before it is accepted.

| SR-ID | Responsibility | Requirements | Established in | Verified in |
|---|---|---|---|---|
| SR-01 | Access control: identity and role only from the server session; 401 without session; 403 for wrong role; 404 for another user's record | BR-11, BR-12, NFR-01, NFR-02 | Sprint 1 (F-01, F-02) | Every sprint: each new protected endpoint gets unauthenticated, forbidden-role and cross-user tests |
| SR-02 | Ledger integrity: money as integer satang; line-sum and amount rules; atomic posting of balances | BR-01, BR-02, BR-05, NFR-05, NFR-06 | Sprint 1 (F-04, F-05) | Sprint 1 (rule + atomicity tests); Sprint 2 (1,000-transaction recomputation test) |
| SR-03 | Delivery and configuration: reproducible setup and seed, env-based secrets, durable deployed storage | NFR-07, NFR-09, NFR-11 | Sprint 1 (README + seed, NFR-11) | Sprint 1 fresh-clone check; Sprint 2 / Lab 5 (CI secret scan, redeploy durability); every release (fresh-clone check) |
| SR-04 | Performance at realistic data size | NFR-08 | Sprint 3 | Sprint 3 scripted measurement on the deployed release |

## 3. Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial inventory F-01–F-16, SR-01–SR-04 | D1-S2 baseline |
