> The Sprint 3 contracts are on the previous pages.

## C.1 Status of Sprint 3 features
All four Sprint 3 features are implemented and their AC pass. They become ACCEPTED only after the final release and UAT re-test (13 December).

| Feature | Status | Passing AC | Red → green | PR → staging merge | Evidence |
|---|---|---|---|---|---|
| F-13 Favourite transactions | TESTED | AC-F13-01–05 | `c4b8f42` → `748556f` | #66 → `982a93e` | `evidence/d2/F13-*.txt` |
| F-14 Duplicate transaction | TESTED | AC-F14-01–04 | `255be65` → `b5cc4a3` (AC-F14-03 re-run on the F-11 void API, `ced1120`) | #68 → `b2c57ee` | `evidence/d2/F14-*.txt` |
| F-15 Category spending | TESTED | AC-F15-01–06 | `7f2ea52` → `0e291ae` | #64 → `c10c9b0` | `evidence/d2/F15-*.txt` |
| F-16 Period reports | TESTED | AC-F16-01–06 | `a82b171` → `c5d7c81` | #65 → `1b90e1f` | `evidence/d2/F16-*.txt` |

All were reviewed by Leviathan-c137 (author Sxr1n, owner of F-13–F-16 by decision of 2026-11-25). F-13–F-16 are already in `v0.2.0-sprint2` and are part of `v0.3.0-rc1`.

## C.2 Implemented Sprint 3 workflow (D-16: F-15 Category spending)
The workflow chosen for the candidate (D-16) is F-15: a user sees their spending per EXPENSE category for a period, with percentages, and transfers, loans and repayments are not counted (BR-06).

Test excerpt (`server/tests/f15-categories.api.test.ts`) and its output on the candidate: TO FILL (D2-RC), with a screenshot of the Reports page from the deployed candidate.

## C.3 Remaining-work plan to 13 December
Plan proposed on 2026-11-28; the dates fit around the exam period.

| Feature or defect | Current status | Remaining action | Owner and target |
|---|---|---|---|
| DEF-01 Receive page stale balance (#81) | FIXED on staging (PR #82), not released | Release in `v0.3.0-rc1`; UAT partner re-test on the deployed candidate | Sxr1n — 29 Nov |
| Lab 6 partner UAT findings | UAT not yet run | Triage each finding into the DEF register; fix accepted defects with red → green → review → deploy; partner re-test | Both — by 30 Nov |
| F-01–F-16 | TESTED (all AC PASS) | Final regression on the `v1.0.0` commit; move to ACCEPTED after UAT re-test | Both — 12 Dec |
| Traceability and DoD | Traceability v0.23 | Final pass (every REQ → AC → TEST → result → version) and DoD review | Sxr1n — 12 Dec |
| Final video and Final PDF | Not started | Record the end-to-end journey on the deployed `v1.0.0` | Leviathan-c137 — 12 Dec |
| Release `v1.0.0` | — | Release PR to `main`, tag, deploy, post-deploy checks | Both — 12 Dec |

The exam period runs 1–11 December, so only bounded completion, defects and final verification are planned after 29 November. No new feature work is planned.
