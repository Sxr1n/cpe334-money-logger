
> Results below are real runs; the Lab 6 rows in A.2 are completed after the partner UAT.

## A.1 Accepted Sprint 1 release
- Tag `v0.1.0-sprint1` → commit `e1747cb` on `main` (CI run 43585303434).
- Sprint 1 behaviour is kept in the candidate: the full regression (Part E.2) runs every Sprint 1 test, and the Sprint 1 critical journey was re-run on its own on the candidate code.

| Item | Value |
|---|---|
| Test | TEST-F06-07 (`e2e/f06-journey.spec.ts`), E2E, user bob: opening balance → receive → pay → Overview totals → History → detail |
| Version | candidate `v0.3.0-rc1` (`a56ebe5`); run on staging `bd49b09`, whose application code is identical (`git diff a56ebe5 bd49b09 -- server client e2e Dockerfile playwright.config.ts package.json deploy .github` is empty) |
| Command | `npx playwright test --grep "TEST-F06-07" --reporter=list` (local, fresh seeded DB) |
| Result | **1 passed**, 0 failed, 0 skipped (`evidence/d2/A1-critical-journey-rc1.txt`) |

<!-- code: evidence/d2/A1-critical-journey-rc1.txt -->

## A.2 Change and defect register
The full register follows on the next pages (`docs/changes.md`). Summary by source:

| Source | ID | Affected | Decision | Status / release | Re-test |
|---|---|---|---|---|---|
| Lab 5 (deployment work, L5-S1) | DEF-02 seed reset user status on restart | F-02 | accepted defect, major | CLOSED, fixed in `v0.1.0-sprint1` (PR #13) | developer re-test PASS (compose restart, before any UAT) |
| Exploratory check on the live URL (21 Nov) | DEF-01 Receive page stale balance | F-04 (AC-F04-08) | accepted defect, minor | FIXED, released in `v0.3.0-rc1` (PR #82 → #85) | UAT partner re-test pending (UAT-01 step 3) |
| Lab 7 maintenance change | CHG-01 credit limit on LOAN_TAKEN | FR-28, BR-18, D-04; F-05, F-08, F-10, F-11 | approved by the team (no TA approval needed, instructor announcement) | released in `v0.2.0-sprint2`, deployed | post-deploy checks 11/11 PASS on `v0.2.0-sprint2` and on `v0.3.0-rc1` |
| Lab 6 partner UAT | — | Sprint 1 scope | UAT of `v0.3.0-rc1` in progress | — | Findings are added to the register when received |

Lab 5's other items were process demonstrations, not product findings: the failing-check demo (PR #42, closed unmerged), rollback and roll forward (C-05). The E2E cold-start timeout (PR #76) was a test-configuration fix and changed no product behaviour.

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
