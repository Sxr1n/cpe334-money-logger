# Lab 7 Parts C and D: metrics, release readiness, retrospective

Snapshot time: **2026-11-27 18:58 UTC** (2026-11-28 01:58 Asia/Bangkok). Observation window for the counted metrics: **2026-11-22 00:00 UTC → snapshot**, covering Sprint 2, the Sprint 3 start and Lab 7 up to the CHG-01 code PR. Repository: `Sxr1n/cpe334-money-logger` only. Sources were collected with `gh issue list`, `gh pr list` and `gh run list` at the snapshot time; the queries are listed under each metric.

## C.1 Metrics

| # | Metric | Definition and scope | Window / snapshot | Value | Source / evidence ID |
|---|---|---|---|---|---|
| M-1 | Completed Issues | Issues closed (state reason COMPLETED) in the window; duplicates and cancelled Issues counted separately | window | **0** completed, 0 duplicate, 0 cancelled | `gh issue list --state closed --search "closed:>=2026-11-22"` returned no rows; open feature Issues listed in C.2 |
| M-2 | Merged PRs | PRs merged in the window, by target branch | window | **15** (staging/sprint-2: 14; staging/sprint-1: 1; main: **0**) | `gh pr list --state merged --search "merged:>=2026-11-22"`; list in C.2 |
| M-3 | Automated test results | Passed/failed/skipped for the full CI suite on one commit: PR #74 head `5e5c97c` (CHG-01), CI run 46051342340 | 2026-11-27 18:41 UTC | Server 31 files / **127 passed**, 0 failed, 0 skipped; client **1 passed**; E2E **18 passed**, 0 failed, 0 skipped | Run 46051342340 job logs (excerpt in C.2); local run `evidence/lab7/CHG01-green.txt` gives the same counts |
| M-4 | UAT defect status | DEF entries opened/resolved in the window; *resolved* = fix merged and re-tested by the reporter | snapshot | **0** opened, 0 resolved; the cross-team Lab 6 UAT has **not been executed yet** | `docs/changes.md` DEF register (empty); no Issue labelled `bug` |
| M-5 | CI run outcomes | Runs of workflow **CI** (`ci-docker.yml`) on all branches, push + pull_request | window | **44** runs: 43 success, **1 failure**, 0 cancelled (success 43/44 = 97.7 %). Deploy workflow runs in the window: **0** | `gh run list --created ">=2026-11-22"`; list in C.2 |

## C.2 Embedded source lists

**M-2 merged PRs (UTC):**

| PR | Merged | Target | Author | Title |
|---|---|---|---|---|
| #48 | 2026-11-22 18:41 | staging/sprint-1 | Sxr1n | docs(lab5): Part 0 team number 59 |
| #49 | 2026-11-22 18:41 | staging/sprint-2 | Sxr1n | spec(sprint-2): contracts F-07–F-12 |
| #56 | 2026-11-23 16:23 | staging/sprint-2 | Sxr1n | feat(F07) account management |
| #57 | 2026-11-25 16:05 | staging/sprint-2 | Sxr1n | feat(F08) edit opening balance |
| #58 | 2026-11-25 17:15 | staging/sprint-2 | Sxr1n | feat(F12) search and filters |
| #59 | 2026-11-25 18:39 | staging/sprint-2 | Sxr1n | spec(sprint-3) contracts F-13–F-16 |
| #64 | 2026-11-25 18:47 | staging/sprint-2 | Sxr1n | feat(F15) category spending |
| #65 | 2026-11-25 18:48 | staging/sprint-2 | Sxr1n | feat(F16) monthly report |
| #66 | 2026-11-25 18:48 | staging/sprint-2 | Sxr1n | feat(F13) favourites |
| #67 | 2026-11-25 18:59 | staging/sprint-2 | Leviathan-c137 | feat(F09) transfers |
| #68 | 2026-11-26 15:13 | staging/sprint-2 | Sxr1n | feat(F14) duplicate |
| #69 | 2026-11-26 22:02 | staging/sprint-2 | Leviathan-c137 | feat(F10) loans |
| #70 | 2026-11-27 18:27 | staging/sprint-2 | Sxr1n | chore: merge staging/sprint-1 |
| #71 | 2026-11-27 18:28 | staging/sprint-2 | Sxr1n | docs(d2) PDF builder |
| #73 | 2026-11-27 18:28 | staging/sprint-2 | Sxr1n | spec(CHG-01) credit limit contract |

**M-1 context.** Feature Issues stay open because their PRs target staging and GitHub closing keywords act only on `main`. At the snapshot, these Issues are open with work merged to staging: #50 F-07, #51 F-08, #52 F-09, #53 F-10, #55 F-12, #60 F-14, #61 F-15, #62 F-13, #63 F-16. Also open: #54 F-11 (branch pushed, not merged) and #72 CHG-01 (code PR #74 open).

**M-3 excerpt** (run 46051342340, commit `5e5c97c`; commands: `npm test` in `server/` and `client/`, `npx playwright test`):
```
Server typecheck + unit/API-DB tests   Test Files  31 passed (31)   Tests  127 passed (127)
Client build                           Test Files  1 passed (1)     Tests  1 passed (1)
E2E (Playwright)                       18 passed (30.1s)
```

**M-5 CI runs** (ID, created UTC, event, branch, conclusion). The single failure is run 45667938623 on `feature/F09-transfers`: E2E failed and the required check `test-and-docker` blocked the merge until the F-09 E2E fix.

| Run | Created | Event | Branch | Conclusion |
|---|---|---|---|---|
| 45056505783 | 2026-11-22T18:41 | push | staging/sprint-1 | success |
| 45056529425 | 2026-11-22T18:41 | push | staging/sprint-2 | success |
| 45057874696 | 2026-11-22T18:56 | pull_request | feature/F07-account-management | success |
| 45057890930 | 2026-11-22T18:56 | pull_request | feature/F07-account-management | success |
| 45216040251 | 2026-11-23T16:23 | push | staging/sprint-2 | success |
| 45217654671 | 2026-11-23T16:32 | pull_request | feature/F08-opening-balance-management | success |
| 45217689011 | 2026-11-23T16:32 | pull_request | feature/F08-opening-balance-management | success |
| 45366254276 | 2026-11-24T09:33 | pull_request | feature/F12-search-filter | success |
| 45366284353 | 2026-11-24T09:33 | pull_request | feature/F12-search-filter | success |
| 45650502195 | 2026-11-25T16:01 | pull_request | spec/sprint-3-contracts | success |
| 45650917428 | 2026-11-25T16:05 | push | staging/sprint-2 | success |
| 45651795175 | 2026-11-25T16:12 | pull_request | feature/F15-category-spending | success |
| 45660643673 | 2026-11-25T17:03 | pull_request | feature/F16-period-reports | success |
| 45660684241 | 2026-11-25T17:03 | pull_request | feature/F16-period-reports | success |
| 45662803983 | 2026-11-25T17:15 | push | staging/sprint-2 | success |
| 45665359222 | 2026-11-25T17:29 | pull_request | feature/F13-favourites | success |
| 45665376505 | 2026-11-25T17:29 | pull_request | feature/F13-favourites | success |
| 45667938623 | 2026-11-25T17:44 | pull_request | feature/F09-transfers | failure |
| 45675578567 | 2026-11-25T18:28 | pull_request | feature/F09-transfers | success |
| 45676323288 | 2026-11-25T18:33 | pull_request | spec/sprint-3-contracts | success |
| 45677354437 | 2026-11-25T18:39 | push | staging/sprint-2 | success |
| 45678165223 | 2026-11-25T18:44 | pull_request | feature/F15-category-spending | success |
| 45678750101 | 2026-11-25T18:47 | push | staging/sprint-2 | success |
| 45678822627 | 2026-11-25T18:48 | push | staging/sprint-2 | success |
| 45678898206 | 2026-11-25T18:48 | push | staging/sprint-2 | success |
| 45678989533 | 2026-11-25T18:49 | pull_request | feature/F09-transfers | success |
| 45680735843 | 2026-11-25T18:59 | push | staging/sprint-2 | success |
| 45681626899 | 2026-11-25T19:05 | pull_request | feature/F14-duplicate | success |
| 45681658377 | 2026-11-25T19:05 | pull_request | feature/F14-duplicate | success |
| 45682061859 | 2026-11-25T19:07 | pull_request | feature/F10-loans | success |
| 45683397636 | 2026-11-25T19:15 | pull_request | feature/F14-duplicate | success |
| 45846993911 | 2026-11-26T15:13 | push | staging/sprint-2 | success |
| 45857976730 | 2026-11-26T16:21 | pull_request | feature/F10-loans | success |
| 45902195892 | 2026-11-26T22:02 | push | staging/sprint-2 | success |
| 45902408657 | 2026-11-26T22:04 | pull_request | chore/merge-staging-sprint-1 | success |
| 45902792926 | 2026-11-26T22:08 | pull_request | docs/d2-pdf | success |
| 45902823659 | 2026-11-26T22:08 | pull_request | docs/d2-pdf | success |
| 45903685499 | 2026-11-26T22:16 | pull_request | spec/CHG01-credit-limit | success |
| 45903719651 | 2026-11-26T22:16 | pull_request | docs/d2-pdf | success |
| 46049662806 | 2026-11-27T18:27 | push | staging/sprint-2 | success |
| 46049678490 | 2026-11-27T18:28 | push | staging/sprint-2 | success |
| 46049695482 | 2026-11-27T18:28 | push | staging/sprint-2 | success |
| 46051342340 | 2026-11-27T18:41 | pull_request | feature/CHG01-credit-limit | success |
| 46051417438 | 2026-11-27T18:42 | pull_request | feature/F11-transaction-corrections | success |

## C.3 Interpretation (≤ 100 words)

Staging is healthy (15 PRs merged, 43/44 CI runs green, 146 tests pass on the CHG-01 commit), but nothing has shipped. The window has **0** merges to `main`, **0** deploy runs and **0** closed Issues, so production is still `v0.1.0-sprint1` (`0831d0b`) without CHG-01. **0** UAT defects means "not yet tested", not "no defects". **Action:** after #74 and F-11 are reviewed, Sxr1n opens the staging → `main` release PR (closing the Issues), tags it and deploys through the Lab 5 pipeline by **29 Nov 12:00**; Lab 6 UAT then runs on that revision.

## D.1 Release readiness: maintained Sprint 1 scope (snapshot)

| Item | Status at snapshot | Owner / action |
|---|---|---|
| Submitted / deployed version | Deployed: `0831d0b` = `v0.1.0-sprint1` (Sprint 1 baseline `e1747cb`). CHG-01 (`1660d08`) is on PR #74, **not on main, not deployed** | Sxr1n: release PR + tag + Deploy demo run after #74 is approved |
| Defects by severity / status | Registered DEF: none. Known minor display issue, not yet registered: the Receive page dropdown shows the old Bank balance after Save until reload (seen live 2026-11-21) | Sxr1n: register as DEF-01 (minor) and fix or accept before Final |
| Automated tests | M-3: 127 + 1 + 18 passed, 0 failed, 0 skipped on `5e5c97c`; Sprint 1 suites (TEST-F01..F06) are included in that run | — |
| Selected user tests | Lab 6 UAT cases UAT-01..05 are written (`docs/uat/sprint-1-uat-cases.md`) but **not executed** by the partner team | Both: run UAT with the partner on the released revision |
| Configuration / secrets | Secrets in Secret Manager (`s87ce2df5-app-secret-1`), only `.env.example` in git, secret scan passes in CI (M-5) | — |
| Documentation / run instructions | README + `docs/labs/lab05/deployment.md` current; migration `add_credit_limit` added and applied by the normal migrate step | Check the migration on Cloud Run during the deploy |
| Deployment / smoke | Last deploy: Lab 5 roll-forward (revision `s87ce2df5-00005-cgk`, smoke 4/4). No deploy in the window | Post-deploy checks for CHG-01 (limit rejection) and a preserved path (alice/bob isolation, admin 403) |

**Verdict: NOT READY** for the maintained Sprint 1 scope at the snapshot. The approved change passes all automated checks but is neither released to `main` nor deployed, and partner UAT has not run. The unchanged Sprint 1 behaviour is covered and passing, but it is deployed only at the old revision. This checklist will be updated after the release and deploy.

## D.2 Technical debt

| Item | Impact | Priority | Disposition / action |
|---|---|---|---|
| `getTodayBangkok` (ledger.ts) duplicates `bangkokToday` (period.ts); `formatTHB` exists in 4 client files | Date-cutoff or format rules can drift between screens | Medium | Merge into one helper after Final features are in (Parked in STATUS) |
| `server/prisma/e2e-void.ts` sets VOID without reversing balances | TEST-F14-03 does not exercise the real void path | Medium | Switch to the F-11 void API when F-11 merges (Sxr1n) |
| The CHECK-violation fallback in `POST /api/transactions` always says "Balance cannot be negative" | Misleading message in a race on the credit-limit constraint (still 422) | Low | Map the constraint name to the right message |
| F-11 edits must re-validate BR-18 | An edit could hit the DB backstop instead of a field error | Medium | F-11 owner (Leviathan-c137) adds a BR-18 AC |
| Docker image includes dev dependencies | Larger image, slower deploy | Low | Prune in the Dockerfile before Final |
| Repository working copy lives in OneDrive | OneDrive zeroed `.git` files on 2026-11-26 (recovered from origin) | High (process) | Sxr1n moves the clone out of OneDrive before the release |

## D.3 Retrospective (DRAFT, both students confirm before submission)

- **What helped:** Contract-first plus the required CI check. Run 45667938623 blocked a broken F-09 E2E before merge, and CHG-01 went contract-review (#73) → red `f8a9b70` → green `1660d08` in one day with no regression.
- **What hurt:** Work piled up on staging. Sprint 2 features F-09–F-11 started late (24–27 Nov), and nothing reached `main` for a week (M-2, M-5), so the CHG-01 deploy and the partner UAT are squeezed into the deadline day.
- **What will change for the Final release:** Each finished sprint or change goes to `main` and is deployed within one day of its last merge (owner: Sxr1n). Feature Issues are closed by that release PR. First action: release `v0.2.0-sprint2` / RC before 29 Nov 12:00.
