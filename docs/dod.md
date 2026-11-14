# Product Definition of Done

| Item | Value |
|---|---|
| Applies to | Every feature (F-xx), defect fix (DEF-xx), change (CHG-xx) and release |
| Document version | 0.1 |

Completion is claimed only with evidence that points to a commit, a test name or a file in `evidence/`. A statement by an AI tool is not evidence.

## 1. Feature / fix / change is Done when
| # | Criterion | Evidence |
|---|---|---|
| 1 | **Contract first.** The feature contract (or DEF/CHG entry) with AC and STS was committed (`spec(...)`) before the implementation commit. | Commit history: `spec` → `test … red` → `feat`/`fix` |
| 2 | **Behaviour implemented.** Every AC of the contract works through UI → API → DB where the contract says those layers change. | Done-evidence table (§9 of the contract) |
| 3 | **Planned verification executed.** Every STS row has a test at the planned level (unit / API-DB / E2E) or a recorded manual check marked as manual. | Test file::name per AC |
| 4 | **TDD for rules, defects and changes.** The rule/defect test was run and failed before the fix, then passed after. | `evidence/<cp>/<id>-red.txt` and `-green.txt` with commit SHAs |
| 5 | **Meaningful tests pass.** The full suite passes on the branch; no test was deleted, skipped or weakened to get there. Any failing or skipped test is reported. | Test run output with pass/fail/skip counts and commit |
| 6 | **Access rules tested.** Each new protected endpoint has the unauthenticated (401), wrong-role (403) and cross-user (404) tests (SR-01). | Test names |
| 7 | **Reviewed.** A PR into `staging/sprint-N` is reviewed and approved by the teammate (not the author), with a specific check, question or finding written in the review. | PR link, reviewer, review comment |
| 8 | **Integrated.** Merged into `staging/sprint-N`; the staging suite passes after the merge. | Merge commit, test run |
| 9 | **Documents current.** Contract updated (status, done-evidence, revision history if behaviour changed); `docs/traceability.md` row updated; README updated if setup changed; no secret committed. | Diff of docs in the PR |
| 10 | **Incomplete work disclosed.** Any AC not met is marked `INCOMPLETE` in the contract and traceability with the reason; it is not hidden as technical debt. | Contract status |

## 2. Release is Done when
| # | Criterion | Evidence |
|---|---|---|
| R1 | All features planned for the sprint meet §1, or are marked `INCOMPLETE` with reason. | Feature board in `docs/sessions/STATUS.md` |
| R2 | Build and full test suite (unit, API-DB, E2E) run on the release commit; counts recorded. | `evidence/<cp>/release-<tag>.txt` |
| R3 | Acceptance check of the sprint's main journey done on the integrated build. | E2E result / screenshots with captions |
| R4 | Release PR `staging/sprint-N → main` reviewed by the teammate and merged; tag created and never moved. | PR, tag |
| R5 | README lets a fresh clone migrate, seed, run and test (NFR-11). | Fresh-clone check note with commit |
| R6 | Known limitations, failed and skipped tests listed. | Release notes / PDF Part F |
| R7 | From Lab 5 on: CI is green on the release commit and the deployed version shows the release tag. | CI run, `/api/health` version |

## 3. Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial DoD | D1-S4 |
