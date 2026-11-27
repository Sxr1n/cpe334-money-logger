## A.1 Old → new behaviour (approved change CHG-01)

The rule being changed was delivered in Sprint 1. It is in the accepted baseline `v0.1.0-sprint1` = `e1747cb` (F-05, D-04): charging a credit card has **no upper limit**. CHG-01 replaces that rule with an **optional credit limit**. Approval: the instructor's Lab 7 announcement says Sprint 1 change requests need no instructor/TA approval and that the team chooses the change. The team approved CHG-01 on 2026-11-27 (owner Sxr1n). Leviathan-c137 approved the revised contract in PR #73 before any code was written (A.4).

| Item | Old (Sprint 1, `e1747cb`) | New (CHG-01, SRS v0.7 / F-05 v0.6) |
|---|---|---|
| Decision | D-04: "Repayments cannot exceed the outstanding amount (BR-08); credit cards have no credit limit in the baseline." | D-04 revised by CHG-01: the "no credit limit" part is replaced by an optional limit (FR-28, BR-18); BR-08 is unchanged |
| Contract F-05 §1 | "Charging a card has no upper limit (D-04: no credit limit) beyond BR-02." | A card **without** a limit keeps no upper limit. A card **with** a limit rejects a charge that would take its debt above the limit; reaching the limit exactly is accepted |
| Requirement | — | **FR-28** A user shall be able to set, change or remove a credit limit on their own LOAN_TAKEN account and see the available credit |
| Business rule | — | **BR-18** When a LOAN_TAKEN account has a credit limit, its debt must never exceed it. A charge (PAYMENT from it), a borrow (RECEIPT line from it) or an opening-balance change that would take the balance above the limit is rejected; equal is accepted; repayments are never blocked. A limit is a positive amount (BR-02 range) and cannot be set below the current debt. An account without a limit has no upper bound |
| Pre-change code | `calculateTxnEffects` (`server/src/lib/ledger.ts`): a LOAN_TAKEN primary always gets `delta: +total`, with no upper check | The same function checks `balance + amount ≤ creditLimit` on the locked row for the primary (charge) and for LOAN_TAKEN lines (borrow) |
| Data | `accounts` has no limit column | `accounts.credit_limit BIGINT NULL` + `CHECK (credit_limit IS NULL OR (type = 'LOAN_TAKEN' AND credit_limit > 0 AND balance <= credit_limit))` (SDS v0.9 §2.2–2.3) |
| API | `PATCH /api/accounts/:id` accepts `name`, `archived` | It also accepts `creditLimit` (integer satang or `null`); the account shape adds `creditLimit` and `availableCredit` (SDS v0.9 §4.3) |

## A.2 Change request, impact table and unchanged behaviour (Issue #72)

<!-- include: docs/labs/lab07/change-request.md -->

## A.3 Revised engineering contract (F-05 v0.6 → v0.7)

These are the revised sections of the Sprint 1 contract. §1–§8 and §10 are shown; §9 (done evidence) is in Part B. The rows marked "CHG-01" are new, and the revision history records the order of the changes.

<!-- include: docs/sprints/sprint-1/F05-payment-charge.md | ## 1 Behavior & workflow | ## 9 Done evidence -->

<!-- include: docs/sprints/sprint-1/F05-payment-charge.md | ## 10 Revision history -->

## A.4 Teammate review before implementation

| Step | ID | Time (UTC) |
|---|---|---|
| Contract and impact committed (`spec(CHG-01)`) | `d090196` | 2026-11-26 22:15 |
| Contract PR opened | PR #73 (Sxr1n, `spec/CHG01-credit-limit` → `staging/sprint-2`) | 2026-11-26 22:16 |
| **Teammate approval of the contract** | PR #73 review by Leviathan-c137, APPROVED | **2026-11-27 18:27:33** |
| Contract merged | `7832344` | 2026-11-27 18:28 |
| First test commit (`test(CHG-01): red`) | `f8a9b70` | 2026-11-27 18:36 |
| Implementation (`feat(CHG-01)`) | `1660d08` | 2026-11-27 18:40 |

Review text of PR #73 (verbatim):

> Approved CHG-01 contract before implementation. Verified: (1) docs/labs/lab07/change-request.md accurately records Sprint 1 baseline (v0.1.0-sprint1 e1747cb), pre-change calculateTxnEffects behavior, FR-28 and BR-18 rules/boundaries (null = unlimited, 1..99,999,999,999 satang, debt <= limit); (2) F-05 v0.6 adds AC-F05-09..16 and matching STS rows TEST-F05-09..16 covering 400/401/403/404/422, F-10 borrow, F-08 opening-balance edit, and null-limit regression; (3) Impact table correctly identifies F-05, F-08, F-10, F-11, and DB check backstop; (4) 6/6 CI checks pass and zero student IDs committed.
