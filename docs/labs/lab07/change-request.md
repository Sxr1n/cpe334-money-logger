# CHG-01 Credit limit on credit cards (LOAN_TAKEN) — Lab 7 change request

| Item | Value |
|---|---|
| Change ID | CHG-01 |
| Issue | #72 |
| Requested by | Team (Sxr1n, Leviathan-c137) |
| Approval | The instructor's Lab 7 announcement says Sprint 1 change requests need no instructor or TA approval; the team chooses the change. Team approval: Sxr1n (owner) 2026-11-27; Leviathan-c137 approves by reviewing the contract PR (approval date = PR approval date) |
| Owner / reviewer | Sxr1n / Leviathan-c137 |
| Status | SPECIFIED (contract revised, implementation not started) |

## 1 Original Sprint 1 requirement and implemented rule
- **Requirement:** FR-12 (record a charge from a LOAN_TAKEN account) and decision **D-04**, which says repayments cannot exceed the outstanding amount (BR-08) and that credit cards have **no credit limit** in the baseline.
- **Contract:** F-05 v0.4, §1, "Charging a card has no upper limit (D-04: no credit limit) beyond BR-02".
- **Accepted Sprint 1 baseline:** tag `v0.1.0-sprint1` → commit `e1747cb` on `main`.
- **Pre-change implementation (at `e1747cb`):** `server/src/lib/ledger.ts` `calculateTxnEffects`, where a PAYMENT with a LOAN_TAKEN primary always pushes `delta: +total` (lines 234–236) with no upper check. In the current `staging/sprint-2`, F-10 adds a second path: a RECEIPT line from LOAN_TAKEN (borrowing) also pushes `+amount` with no upper check.

## 2 Proposed new rule
**FR-28.** A user can set, change or remove a credit limit on their own LOAN_TAKEN account.

**BR-18.** When a LOAN_TAKEN account has a credit limit, its debt (balance) must never exceed that limit:

| Case | Rule |
|---|---|
| Charge: PAYMENT with a LOAN_TAKEN primary | Rejected with 422 when `balance + total > limit` |
| Borrow: RECEIPT line from a LOAN_TAKEN account | Rejected with 422 when `balance + amount > limit` |
| Opening balance change (F-08) | Rejected with 422 when it would leave `balance > limit` |
| Setting a limit | Rejected with 422 when the limit is below the current debt |
| Equality | `balance = limit` is accepted |
| Repayments | Never blocked by the limit |

**Boundaries:**
- The limit is an integer number of satang from 1 to 99,999,999,999, which is the BR-02 amount range.
- `null` removes the limit.
- An account with no limit (`null`) behaves exactly as in the baseline, with no upper bound.

**Invalid cases:**

| Case | Response |
|---|---|
| A limit on a CASH, LOAN_GIVEN, INCOME or EXPENSE account | 422 |
| A limit on an archived account | 422 |
| A limit of 0, a negative number, a fraction, or above the maximum | 422 |
| A non-number, non-null value | 400 |

**Access:**
- No session → 401.
- Administrator → 403.
- Another user's account → 404, and nothing changes.
- The owner always comes from the session (BR-11, BR-12).

**Reason.** A real credit card has a limit. Today the product lets a user record a charge that the card would have declined, so the logged debt no longer matches the card. The Theme 7 brief lists "does the credit card have a limit?" as an open decision; D-04 answered "no" for Sprint 1. This change answers "optional limit" now that account management (F-07) exists.

**Scope.**
- In scope:
  - the stored limit;
  - a credit-limit field in `PATCH /api/accounts/:id`;
  - `creditLimit` and `availableCredit` in `GET /api/accounts`;
  - the BR-18 checks on posting and on opening-balance change;
  - a DB check constraint as a backstop;
  - Accounts page: "Credit limit" form and the available credit;
  - Pay page: available credit shown, plus the server error.
- Out of scope:
  - a limit when an account is created (set it after creating);
  - interest, statements and due dates;
  - warnings near the limit;
  - limits on other account types.

## 3 Impact

| Requirement | Feature | SRS / Feature SDS / System SDS sections | AC | STS | Code modules |
|---|---|---|---|---|---|
| FR-28 (new) | F-05 (CHG-01 section) | SRS §5 FR-28, §8.2 D-04 (revised), §10; F-05 §3–§7; SDS §2.2, §4.3 | AC-F05-09, AC-F05-10, AC-F05-15 | TEST-F05-09, -10, -15 | `server/src/routes/accounts.ts` (PATCH), `server/src/lib/accounts.ts` (validation), `client/src/pages/AccountsPage.tsx` |
| BR-18 (new) | F-05 (charge) | SRS §6 BR-18; F-05 §1, §2; SDS §2.3 (constraint), §2.4 | AC-F05-11, AC-F05-13 | TEST-F05-11, -13 | `server/src/lib/ledger.ts` `calculateTxnEffects`, `server/src/routes/transactions.ts` (backstop error mapping), `client/src/pages/PayPage.tsx` |
| BR-18 | F-10 (borrow) | F-05 §2 (rule applies to all LOAN_TAKEN increases) | AC-F05-12 | TEST-F05-12 | `server/src/lib/ledger.ts` (RECEIPT LOAN_TAKEN line) |
| BR-18 | F-08 (opening balance change) | F-05 §2 | AC-F05-14 | TEST-F05-14 | `server/src/routes/accounts.ts` (`PATCH /:id/opening-balance`) |
| BR-18 | F-11 (edit) | F-11 contract re-validates BR-01–BR-09 → must also re-validate BR-18 | — (F-11 owner adds the AC when F-11 lands) | — | F-11 code uses `calculateTxnEffects`; the DB check is the backstop until then |
| Data | — | SDS §2.2, §2.3, §2.5 | AC-F05-09 | TEST-F05-09 | Prisma `Account.creditLimit` + migration `add_credit_limit` (nullable column, check constraint) |

**Not applicable, with reasons:**

| Item | Reason |
|---|---|
| F-06 overview and summaries; F-15 and F-16 reports | The limit is not income or expense (BR-06). Summary code reads only INCOME and EXPENSE lines, so nothing changes there. |
| F-01 and F-02 | Not applicable. The new endpoint field sits behind the existing USER guard. |
| Historical data | The migration adds a nullable column, so existing accounts get `NULL` (no limit) and their balances are untouched. |
| F-12 search and F-14 duplicate | Not applicable. Duplicate posts through the same engine, so BR-18 applies there automatically. |

**Behaviour that must stay unchanged, and the regression tests that protect it:**

| Behaviour | Protecting tests |
|---|---|
| Cards without a limit accept any charge up to BR-02 | TEST-F05-01 and the new TEST-F05-13 |
| Repayments (BR-08) | TEST-F05-06 |
| Borrowing without a limit | TEST-F10-* |
| Opening balance rules (D-10) | TEST-F08-* |
| Expense totals | TEST-F05-02, TEST-F06-* |
| Access rules | TEST-F05-07 and the new TEST-F05-15 |

The full server, client and E2E suites run on every PR (CI `test-and-docker`).

## 4 Sequence evidence (filled as it happens)
| Step | Commit / PR | Date |
|---|---|---|
| Change request + revised contract (`spec(CHG-01)`) | Issue #72, commit `d090196` | 2026-11-27 |
| Teammate review of the contract | TO FILL (PR review) | |
| Failing tests (`test(CHG-01): red`) | TO FILL → `evidence/lab7/CHG01-red.txt` | |
| Implementation (`feat(CHG-01)`) | TO FILL → `evidence/lab7/CHG01-green.txt` | |
| Code review, CI, deploy | TO FILL | |
