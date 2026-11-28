
> TO FILL (D2-RC): replace every "TO FILL" line with real output. Never write a result that was not run.

## A.1 Accepted Sprint 1 release
- Tag `v0.1.0-sprint1` → commit `e1747cb` on `main` (CI run 43585303434).
- TO FILL: the Sprint 1 critical journey (TEST-F06-07, bob: opening balance → receive → pay → overview/history) run on the candidate commit, with the command, commit and Playwright output.

## A.2 Change and defect register
The full register follows on the next pages (`docs/changes.md`). TO FILL: every Lab 5, Lab 6 and Lab 7 finding has an ID, source, affected requirement/feature, decision, status, fix release and re-test result.

## A.3 Approved baseline revisions
Revisions since D1 (`v0.1.0-sprint1`, 15 Nov) to the requirements, the design and the Sprint 1 contracts, taken from their revision-history tables. Rows that only record test results are left out (they are in the traceability matrix, Part D). New Sprint 2 and Sprint 3 contracts are in Parts B and C.

| Document | Ver | Date | Change | Reason / ID |
|---|---|---|---|---|
| SRS | 0.5 | 2026-11-22 | Decisions D-10–D-13 for the Sprint 2 contracts (Q-03 resolved by D-10). No FR/BR/NFR text changed | D2-S1 (team) |
| SRS | 0.6 | 2026-11-25 | Decisions D-14–D-16 for the Sprint 3 contracts. No FR/BR/NFR text changed | D2-S5 (team) |
| SRS | 0.7 | 2026-11-27 | FR-28 and BR-18 added; D-04 revised (optional credit limit on LOAN_TAKEN) | CHG-01 (Lab 7) |
| System SDS | 0.6 | 2026-11-20 | Deployment target is the shared course cloud project (prefix `s87ce2df5`) | Instructor announcement (Lab 5) |
| System SDS | 0.7 | 2026-11-22 | Sprint 2 endpoints; opening-balance change and edit/void rules (D-10, D-12); 409 when the opening balance is not set yet | D2-S1 |
| System SDS | 0.8 | 2026-11-25 | Sprint 3 endpoints (favourite, reports) | D2-S5 |
| System SDS | 0.9 | 2026-11-27 | `accounts.credit_limit` column and check constraint; `creditLimit` on `PATCH /api/accounts/:id` | CHG-01 |
| F-04 Receive money | 0.4 | 2026-11-28 | Success state shows the updated balance; AC-F04-08 / TEST-F04-08 (defect regression) | DEF-01 (Issue #81) |
| F-04 Receive money | 0.5 | 2026-11-28 | TEST-F04-08 precondition uses a new account of alice (test-data isolation); behaviour unchanged | DEF-01 |
| F-05 Payment/charge | 0.5 | 2026-11-26 | F-09 supersedes "a line to another CASH account → 422" in AC-F05-04 (CASH lines are now transfers) | F-09 / PR #67 review |
| F-05 Payment/charge | 0.6 | 2026-11-27 | Credit limit: §1, §2 rules + DB backstop, §3 permission, §4 UI; AC-F05-09–16 / TEST-F05-09–16 | CHG-01 |
| F-11 Corrections | 0.3 | 2026-11-28 | Deltas computed from the locked row (concurrency); BR-18 on edit; AC-F11-11/12 | PR #75 review, CHG-01 |
| F-14 Duplicate | 0.2 | 2026-11-26 | Client Vitest added; TEST-F14-03 sets VOID through a script until F-11 exists | D2-S9 |
| F-14 Duplicate | 0.4 | 2026-11-28 | TEST-F14-03 voids through the F-11 API; the script was removed | D2-RC |

No requirement was deleted or renumbered. No contract changed silently: each change above has its row in the document's revision history.
