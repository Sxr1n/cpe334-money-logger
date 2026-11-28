# Project Status — อัปเดตทุกครั้งที่จบ session

## Current
- Phase / next checkpoint: D1 submitted; Lab 5 submitted on LEB2 2026-11-22 (`lab5_sec131_Help_me.pdf`, team 59). **D2, Lab 6 and Lab 7 due 29 Nov 23:59**; Final 13 Dec
- Next session: RC `v0.3.0-rc1` (release PR → tag → deploy → post-deploy checks) · Lab 7 PDF · D2 PDF parts · Lab 6 partner UAT (cloud test accounts through the private handoff) · due 29 Nov 23:59
- Latest release on main: `v0.2.0-sprint2` (commit `76aaabc`, tagged on `main`, 2026-11-27); previous `v0.1.0-sprint1` (`e1747cb`)
- Active staging branch: `staging/sprint-2` (from `staging/sprint-1` `3fd73fe`; contracts PR #49 merged)
- Deployed URL / version: https://s87ce2df5-4d7hbszvwq-as.a.run.app — `76aaabc` = `v0.2.0-sprint2` (revision `s87ce2df5-00006-bbr`, Deploy demo run 46064946596)

## Feature board
| F-ID | Name | Sprint | Status | Owner | Contract | Issue/PR | Evidence |
|---|---|---|---|---|---|---|---|
| F-01 | Authentication and session | 1 | TESTED | Sxr1n | sprint-1/F01-auth.md | #1 | red `e9f9653`, green `56ac71d` (evidence/d1/F01-*.txt) |
| F-02 | Administrator user access | 1 | TESTED | Sxr1n | sprint-1/F02-admin-user-access.md | #2 | red `50c09ff`, green `1090928` (evidence/d1/F02-*.txt) |
| F-03 | Opening balance | 1 | TESTED | Leviathan-c137 | sprint-1/F03-opening-balance.md | #3 / PR #16 | red `0849955`, green `3f3aae5`, closed `b2a4f70` (evidence/d1/F03-*.txt) |
| F-04 | Receive money | 1 | TESTED | Leviathan-c137 | sprint-1/F04-receive-money.md | #4 / PR #17 | red `295c90b`, green `b2a4f70` (evidence/d1/F04-*.txt) |
| F-05 | Make a payment or record a charge | 1 | TESTED | Leviathan-c137 | sprint-1/F05-payment-charge.md | #5 / PR #18 | red `f615c47`, green `6f52657` (evidence/d1/F05-*.txt) |
| F-06 | Overview, summary and history | 1 | TESTED | Sxr1n | sprint-1/F06-overview-history.md | #6 | red `c5848da`, green `7850d4e` (evidence/d1/F06-*.txt) |
| F-07 | Account management | 2 | TESTED | Sxr1n | sprint-2/F07-account-management.md | #50 / PR #56 | red `e25946a`, green `3a75c2f` (evidence/d2/F07-*.txt) |
| F-08 | Opening balance management | 2 | TESTED | Sxr1n | sprint-2/F08-opening-balance-management.md | #51 / PR #57 | red `51eeffc`, green `c341d6d`, NFR-05 `ced1120` (evidence/d2/F08-*.txt, NFR05-*.txt) |
| F-09 | Transfers | 2 | TESTED | Leviathan-c137 | sprint-2/F09-transfers.md | #52 | red `769742f`, green `c36a003` (evidence/d2/F09-*.txt) |
| F-10 | Loans given and taken | 2 | TESTED | Leviathan-c137 | sprint-2/F10-loans.md | #53 | red `cbf9735`, green `e98d37d` (evidence/d2/F10-*.txt) |
| F-11 | Transaction corrections | 2 | TESTED | Leviathan-c137 | sprint-2/F11-transaction-corrections.md | #54 | red `7888ac1`, green `fb0336f` (evidence/d2/F11-*.txt) |
| F-12 | Search and filter | 2 | TESTED | Sxr1n | sprint-2/F12-search-filter.md | #55 / PR #58 | red `37675b2`, green `63d377b` (evidence/d2/F12-*.txt) |
| F-13 | Favourite transactions | 3 | TESTED | Sxr1n | sprint-3/F13-favourites.md | #62 / PR #66 | red `c4b8f42`, green `748556f` (evidence/d2/F13-*.txt) |
| F-14 | Duplicate transaction | 3 | TESTED | Sxr1n | sprint-3/F14-duplicate.md | #60 | red `255be65`, green `b5cc4a3` (evidence/d2/F14-*.txt) |
| F-15 | Category spending | 3 | TESTED | Sxr1n | sprint-3/F15-category-spending.md | #61 / PR #64 | red `7f2ea52`, green `0e291ae` (evidence/d2/F15-*.txt) |
| F-16 | Period reports | 3 | TESTED | Sxr1n | sprint-3/F16-period-reports.md | #63 / PR #65 | red `a82b171`, green `c5d7c81` (evidence/d2/F16-*.txt) |

## Work split (ตกลง 2026-11-07, แก้ตามวันส่ง LEB2: D1 + Lab 5 ส่ง 15 Nov)
| วันที่ | Sxr1n (ศารินทร์) | Leviathan-c137 (ตันติยวัตร) |
|---|---|---|
| 8 Nov | push, assign Issue, project board, ส่ง Q-01 ถาม TA · อ่านไฟล์แนบ 3 ไฟล์ของ Lab 5 (วิธีเข้า GCP) | Review + merge PR #7–#11 และ PR เรื่องวันส่ง (finding อย่างน้อย 1 ข้อต่อ PR) |
| 9 Nov | L5-S1 Dockerfile + compose | F-03 Opening balance (TDD) |
| 10 Nov | L5-S2 CI quality gate + สาธิต check ที่ fail แล้วบล็อก merge · review F-03 | F-04 Receive money + transaction engine |
| 11 Nov | L5-S3 CD → GCP + DB ถาวร + secrets | F-04 (ต่อ) → merge ภายในวันนี้ |
| 12 Nov | review F-04 · F-06 backend | F-05 Payment/charge |
| 13 Nov | F-06 UI + E2E journey (TEST-F06-07) | review F-06 · `docs/labs/lab5/` (หลักฐาน redeploy แล้วข้อมูลยังอยู่) |
| 14 Nov | ทำคู่: release `v0.1.0-sprint1` → deploy GCP (L5-S4) | ทำคู่ |
| 14–15 Nov | PDF D1 Part A–C · รายงาน Lab 5 | PDF D1 Part D–F |

กติกา: ต่างคนต่าง review PR ของอีกฝ่าย; commit ด้วยบัญชีตัวเอง; ถ้าโค้ดต่างจาก contract ให้แก้ contract + revision history ใน PR เดียวกัน; F-04 ต้อง merge ภายใน 11 Nov; ถ้า Sxr1n ไม่ทัน ให้ย้าย L5-S3 มาทำคู่วันที่ 13

## Open defects / changes (สรุป รายละเอียดอยู่ใน docs/changes.md)
| ID | Summary | Severity | Status |
|---|---|---|---|

## Session log (ใหม่สุดอยู่บนสุด)
### 2026-11-28 — D2-P D2 PDF parts (before RC) — Claude + Sxr1n
- Done: #78, #79, #80 merged (approved by Leviathan-c137, CI 6/6) → staging `0ce1c5f`; D2 Part A.3 (baseline revisions), B.1/B.3/B.4/B.5, C.1/C.3 filled; directives (include/code/gitdiff) moved to `submission/directives.py`, shared by the D2 and Lab 7 builders
- Evidence: `evidence/d2/B3-excerpts-run.txt` (TEST-F11-04 and TEST-F11-08, 2 passed, 9 filtered by `-t`); test builds: D2 77 pages, Lab 7 39 pages (unchanged)
- Decisions: C.3 owners and dates are a proposal — both students confirm
- Open issues: TO FILL (D2-RC): A.1, A.2, B.2, C.2, Part E; PR #82 (DEF-01) awaits approval
- Next session: #82 merge → RC `v0.3.0-rc1` → fill the D2-RC items
### 2026-11-28 — D2-RC TEST-NFR05-01 + TEST-F14-03 — Claude + Sxr1n
- Done: TEST-NFR05-01 (AC-F08-07): 1,000 seeded HTTP operations, then stored balances compared with an SQL recomputation → F-08 TESTED. TEST-F14-03 now voids through the F-11 API; `server/prisma/e2e-void.ts` removed. #76 (E2E cold start) merged
- Evidence: `ced1120`. `evidence/d2/NFR05-green.txt`: server 34 files / 140 passed; client 1 passed + build OK; E2E 19 passed; 0 failed, 0 skipped. Counts: seed 3342026 → 464 posted, 121 edited, 73 voided, 126 opening edits, 216 rejections. `evidence/d2/NFR05-mutation-check.txt`: the test fails when a delta is dropped
- Decisions: none new. The first run of the test failed on a test-side type error (SQL SUM returns numeric), fixed with a `::bigint` cast before committing
- Open issues: #78's traceability row renumbered to 0.22 (`d34780d`) and #78 merged into this branch. DEF-01 not registered. Lab 6 UAT not run
- Next session: RC `v0.3.0-rc1` release PR → tag → deploy → post-deploy checks
### 2026-11-28 — D2-R1 release v0.2.0-sprint2 + deploy — Claude + Sxr1n
- Done:
  - PR #77 approved by Leviathan-c137 and merged to `main` (`76aaabc`); tag `v0.2.0-sprint2` pushed.
  - Deploy demo run 46064946596: migration `add_credit_limit` applied, revision `s87ce2df5-00006-bbr`, smoke 4/4.
  - Post-deploy checks 11/11 PASS (`deploy/post_deploy_checks.py`, run by Sxr1n with the cloud passwords from Secret Manager via Cloud Shell).
  - Lab 7 change request §4, readiness D.4 (READY for the maintained Sprint 1 scope), CHG register and traceability updated.
  - `main` merged back into `staging/sprint-2`.
- Evidence: `evidence/lab7/post-deploy-v0.2.0-sprint2.txt` (converted from UTF-16; 3 mis-decoded `฿` restored, noted in its header); `/api/health` = `76aaabc…`.
- Decisions: the cloud passwords stay out of the repo and the chat; the script prompts for them.
- Open issues:
  - F-08 AC-F08-07 (TEST-NFR05-01);
  - TEST-F14-03 still uses `e2e-void.ts`;
  - #76 is open;
  - DEF-01 (Receive-page stale balance) is not registered;
  - Lab 6 UAT has not run;
  - the retrospective draft needs confirmation from both students.
- Next session: RC `v0.3.0-rc1` work, then the Lab 7 and D2 PDFs
### 2026-11-28 — D2-R1 release v0.2.0-sprint2 (prep) — Claude + Sxr1n
- Done: #74 (CHG-01) and #75 (F-11, after the race/BR-18 fixes and verbatim evidence) merged into `staging/sprint-2` (`22acd51`); E2E cold-start flake fixed in PR #76 (open); release branch `release/v0.2.0-sprint2` from `22acd51` with release evidence
- Evidence: `evidence/d2/release-v0.2.0-sprint2.txt` on `22acd51`: server tsc OK, 33 files / 139 tests passed; client 1 test + build OK; E2E 19 passed; Docker image build OK; 0 failed, 0 skipped
- Decisions: release now (Lab 7 needs the CHG-01 deploy) with F-08 still IN PROGRESS — AC-F08-07 (TEST-NFR05-01) is not written yet and is disclosed in the release PR; #76 joins the RC
- Open issues: TEST-NFR05-01; TEST-F14-03 still uses `e2e-void.ts`; Issues #50–#55, #60–#63, #72 close with the release PR; Lab 6 UAT not run
- Next session: tag + deploy + post-deploy checks after the release PR is approved
### 2026-11-28 — L7-S3 metrics, readiness, retrospective — Claude + Sxr1n
- Done: read the Lab 7 handout (`docs/course/Lab_7_Sprint_1_Maintenance.pdf`, not committed). `docs/labs/lab07/metrics-readiness.md` contains:
  - five metrics M-1..M-5 (the handout's recommended set), with embedded source lists;
  - an interpretation of 92 words (limit 100);
  - the readiness checklist (verdict **NOT READY** at the snapshot: CHG-01 not on main or deployed, partner UAT not run);
  - the technical debt table and a DRAFT retrospective.
- Evidence: snapshot 2026-11-27 18:58 UTC, window from 2026-11-22.
  - M-1: 0 Issues closed.
  - M-2: 15 PRs merged, 0 of them to main.
  - M-3: run 46051342340 on `5e5c97c`: 127 + 1 + 18 passed, 0 failed, 0 skipped.
  - M-4: 0 UAT defects (UAT not run).
  - M-5: 44 CI runs, 43 success, 1 failure (45667938623, F-09 E2E); 0 deploy runs.
- Decisions: none.
- Open issues:
  - The retrospective must be confirmed by both students.
  - Readiness and the version table must be updated after the release and deploy.
  - Handout: the red for the TEST-F05-10 unit test is a missing function (`validateCreditLimit is not a function`). The behavioural red evidence is the 7 API assertions and the TEST-F05-11/12 unit assertions; say so in the PDF.
  - The Receive-page stale-balance display issue should be registered as DEF-01.
  - Leviathan-c137 pushed `feature/F11-transaction-corrections` on 2026-11-27.
- Next session: release + deploy (Lab 7 action) · Lab 7 PDF · D2 PDF parts
### 2026-11-28 — L7-S2 CHG-01 credit limit (TDD) — Claude + Sxr1n
- Done:
  - Leviathan-c137 approved the contract (#73) on 2026-11-27, before any code; #70, #71 and #73 are merged.
  - Migration `add_credit_limit` adds a nullable `credit_limit` column and a check constraint.
  - `validateCreditLimit` and the `creditLimit` field on `PATCH /api/accounts/:id` (checked under a row lock; cannot be set below the debt).
  - The account shape now includes `creditLimit` and `availableCredit`.
  - BR-18 in `calculateTxnEffects` covers charges and borrows; the F-08 opening-balance change also checks the limit.
  - Accounts page: limit text and a Credit limit form. Pay page: the card option shows the available credit.
- Evidence:
  - red `f8a9b70` → `evidence/lab7/CHG01-red.txt` (unit 3 fail, API 7 fail, E2E 1 fail). Before committing the red, one test expectation was corrected (PUT opening balance returns 200, not 201); every failure in the committed red is real.
  - green `1660d08` → `evidence/lab7/CHG01-green.txt` (server tsc OK, 31 files / 127 tests; client 1 test + build OK; E2E 18/18; 0 failed, 0 skipped).
- Decisions: none new (contract v0.6 → v0.7 records the results only).
- Open issues:
  - The code PR needs Leviathan-c137's review.
  - Deploy waits for the next release to main.
  - The CHECK violation fallback in `POST /api/transactions` still says "Balance cannot be negative" for every constraint; it is reached only in a race.
  - F-11 edits must re-validate BR-18.
- Next session: L7-S3 metrics, readiness and retrospective · release `v0.2.0-sprint2` / RC · D2 PDF parts
### 2026-11-27 — L7-S1 CHG-01 change request — Claude + Sxr1n
- Done: change request Issue #72 and contract PR #73. Credit limit on LOAN_TAKEN accounts: FR-28, BR-18, D-04 revised. Docs: `docs/labs/lab07/change-request.md` (baseline `e1747cb`, pre-change code, impact table, regression protection); F-05 contract v0.6 with AC-F05-09..16 and TEST-F05-09..16; SRS v0.7; SDS v0.9; features v0.6; traceability v0.18; CHG-01 in `docs/changes.md`
- Evidence: spec commit `d090196` on `spec/CHG01-credit-limit`
- Decisions (Sxr1n, 2026-11-27):
  - Instructor announcement: Lab 7 changes need no TA approval; the team picks one that is not trivial.
  - The team picked the credit limit; Sxr1n owns it and Leviathan-c137 reviews.
  - `null` = no limit.
  - A limit cannot be set below the current debt.
  - BR-18 also covers borrowing (F-10) and opening-balance changes (F-08).
  - The limit is set through the existing `PATCH /api/accounts/:id`.
- Open issues:
  - F-11 must re-validate BR-18 in its edits (DB check is the backstop until then).
  - The F-05 contract still has no revision row for F-10 (#69 review finding).
  - The code waits for the #73 review (Lab 7 requires review before code).
- Next session: after #73 is approved, CHG-01 red → green; then metrics, readiness and retrospective (L7-S3)
### 2026-11-27 — D2-P (start) PDF builder — Claude + Sxr1n
- Done: #68 (F-14) approved and merged by Leviathan-c137 (`b2c57ee`, CI success); #69 (F-10) merged; PR #70 merges `staging/sprint-1` (#48, Lab 5 Part 0) into `staging/sprint-2` (STATUS conflict resolved); `submission/d2/build_pdf.py` (reuses the D1 renderer; cover reads the deployed version from `/api/health` and flags a mismatch with the tag) + `part-a/b/c/e.md` skeletons following D2 §4.1 (all results marked TO FILL)
- Evidence: test build `D2-v0.3.0-rc1.pdf` 69 pages = cover 1 + [1, 25, 12, 29, 1]; cover shows deployed `0831d0b` flagged as not matching (no RC tag yet)
- Decisions (Sxr1n, 2026-11-27): F-11 stays with Leviathan-c137; Lab 6 partner team is known (details to be added); Lab 7 change waits for the instructor's announcement
- Open issues: PR #70 and the D2 PDF PR need review; F-11 not started; Lab 6 partner details and Lab 7 change not in the repo yet
- Next session: Lab 6 partner UAT / Lab 7 change once the details arrive · F-11 → release `v0.2.0-sprint2` → RC `v0.3.0-rc1` → fill Parts A–E
### 2026-11-26 — D2-S9 F-14 Duplicate transaction — Claude + Sxr1n
- Done: local `.git` repaired (OneDrive zeroed HEAD, index, the `spec/sprint-3-contracts` ref and 4 working files; restored from origin, nothing lost); PR #64 head was stuck after the GitHub outage → empty commit `d2eefa8`; #64, #65, #66 merged into `staging/sprint-2` (`982a93e`, CI success). F-14: `toDuplicateDraft`/`loadDuplicate` in `client/src/duplicate.ts`, `DuplicateBanner`, `?duplicate=` on Pay/Receive, Duplicate link on the detail page (POSTED and VOID) and Favourites rows; empty account selects show "Choose an account"
- Evidence: red `255be65` → `evidence/d2/F14-red.txt` (unit module missing, E2E 3 fail); green `b5cc4a3` → `evidence/d2/F14-green.txt` (server tsc OK, 25 files / 98 tests; client 1 test + build OK; E2E 15/15)
- Decisions (Sxr1n, 2026-11-26): Vitest added to `client/` (+ `npm test` in CI "Client build"); TEST-F14-03 sets VOID through `server/prisma/e2e-void.ts` until F-11 (contract v0.2)
- Open issues: replace `e2e-void.ts` with the F-11 void API when F-11 merges; F-09 (#67) merged during this session → merged into the F-14 branch (`00bcb2f`), full regression green (`evidence/d2/F14-green-after-F09.txt`: server 27 files / 107 tests, E2E 16/16); the repo lives in OneDrive — move it out or pause sync
- Next session: Leviathan-c137 F-10 → F-11 (F-09 merged in #67); after F-11: TEST-NFR05-01 (AC-F08-07) and switch TEST-F14-03 to the F-11 void API; release prep for D2
### 2026-11-26 — D2-S8 F-13 Favourite transactions — Claude + Sxr1n
- Done: `PUT /api/transactions/:id/favorite` (VOID → 422, D-15); `favorite=true` filter (POSTED favourites only); `isFavorite` in the transaction shape; detail-page toggle (`aria-pressed`), Favourites page + nav link
- Evidence: red `c4b8f42` → `evidence/d2/F13-red.txt` (5 fail); green `748556f` → `evidence/d2/F13-green.txt` (tsc OK, server 25 files / 98 tests, client build OK, E2E 12/12)
- Decisions: none new; the check-then-update for VOID is not locked, which is harmless because the list itself filters POSTED
- Open issues: PR chain #58 → #59 → #64 → #65 → this one
- Next session: F-14 Duplicate
### 2026-11-26 — D2-S7 F-16 Period reports — Claude + Sxr1n
- Done: `GET /api/reports/monthly` (income/expense/net per Bangkok month via `summarize`, empty months listed, total row); `parseMonthRange` + `monthBounds` in `lib/period.ts` (≤ 12 months, default last 6, D-14); Reports page Monthly report section
- Evidence: red `a82b171` → `evidence/d2/F16-red.txt` (6 fail); green `c5d7c81` → `evidence/d2/F16-green.txt` (tsc OK, server 23 files / 93 tests, client build OK, E2E 11/11)
- Decisions: none new
- Open issues: PR chain #58 → #59 → #64 → this one; F-09–F-11 still not started
- Next session: F-13 Favourites
### 2026-11-25 — D2-S6 F-15 Category spending — Claude + Sxr1n
- Done: `GET /api/reports/categories` (`routes/reports.ts`, `percentOf` in `lib/summary.ts`, `/api/reports` behind the USER guard); Reports page + nav link with the Category spending section
- Evidence: red `7f2ea52` → `evidence/d2/F15-red.txt` (6 fail, no route); green `0e291ae` → `evidence/d2/F15-green.txt` (tsc OK, server 21 files / 87 tests, client build OK, E2E 10/10)
- Decisions: none new; E2E uses bob and reads expected amounts back through the API (alice's data changes in other specs)
- Open issues: PRs #58 → #59 → this one must merge in order; F-09–F-11 still not started
- Next session: F-16 (shares the Reports page) or F-13
### 2026-11-25 — D2-S5 Sprint 3 contracts — Claude + Sxr1n
- Done: contracts F-13–F-16 in `docs/sprints/sprint-3/` (21 AC, 21 STS rows, SPECIFIED); SRS v0.6 (D-14–D-16); features v0.4; plan v0.4 (F-15 first, Sxr1n owns F-13–F-16); traceability v0.11 (§2c); SDS v0.8
- Evidence: branch `spec/sprint-3-contracts` (spec commits per feature), PR #59; Issues #60–#63
- Decisions (Sxr1n, 2026-11-25): D-14 period report ≤ 12 months, default last 6; D-15 VOID cannot be favourited (hidden from list) but can be duplicated; D-16 F-15 is the Sprint 3 workflow in `v0.3.0-rc1`; Sxr1n owns all Sprint 3 features
- Open issues: PR #57 approved but merging from this session was blocked by the permission classifier → Sxr1n merges; F-14 unit test needs Vitest for a pure client module (decide in F-14: client dev dependency or server Vitest include)
- Next session: F-15 Category spending
### 2026-11-24 — D2-S4 F-12 Search and filter history — Claude + Sxr1n
- Done: `GET /api/transactions` filters (from, to, accountId = primary or line, form, status, minAmount, maxAmount, q case-insensitive and literal); `parseTxnFilter` (422 per parameter) and `escapeLike` in `lib/query.ts`; History filter bar kept in the URL, Clear filters, filtered empty state
- Evidence: red `37675b2` → `evidence/d2/F12-red.txt` (6 fail; TEST-F12-06 already passed through F-06 scoping); green `63d377b` → `evidence/d2/F12-green.txt` (tsc OK, server 19 files / 81 tests, client build OK, E2E 9/9)
- Decisions: none new; branch based on the F-08 branch (PR #57 open) to avoid doc conflicts
- Open issues: Prisma `contains` does not escape `%`/`_` (found by TEST-F12-04) — other `contains` queries must use `escapeLike`; F-09–F-11 not started by Leviathan-c137 as of 2026-11-24
- Next session: Sprint 3 contracts F-13–F-16 (D2 requirement)
### 2026-11-23 — D2-S3 F-08 Opening balance management — Claude + Sxr1n
- Done: `PATCH /api/accounts/:id/opening-balance` (balance += new − old under a row lock; 422 if negative, INCOME/EXPENSE or archived; 409 if not set yet); Accounts page "Edit opening balance" pre-filled, server field errors under Amount
- Evidence: red `51eeffc` → `evidence/d2/F08-red.txt` (5 fail; TEST-F08-05 already passed via middleware); green `c341d6d` → `evidence/d2/F08-green.txt` (tsc OK, server 17 files / 72 tests, client build OK, E2E 8/8)
- Decisions: none new; F-08 status IN PROGRESS until AC-F08-07 (TEST-NFR05-01) runs after F-09–F-11
- Open issues: Leviathan-c137 has not started F-09 yet (no branch on 2026-11-23); `staging/sprint-1` (#48) still to merge into `staging/sprint-2`
- Next session: F-12 (Sxr1n)
### 2026-11-23 — D2-S2 F-07 Account management — Claude + Sxr1n
- Done: `POST /api/accounts`, `PATCH /api/accounts/:id` (rename, archive at balance 0 under row lock, unarchive); archived accounts hidden from Overview and Pay/Receive selects; posting lock re-checks `archived_at` (404); opening balance on archived → 422; Accounts page New account / Rename / Archive / Archived section
- Evidence: red `e25946a` → `evidence/d2/F07-red.txt` (API 7 fail, unit module missing, E2E no button); green `3a75c2f` → `evidence/d2/F07-green.txt` (tsc OK, server 15 files / 66 tests, client build OK, E2E 7/7)
- Decisions: none new (contract v0.1 unchanged); E2E heading selector needed `exact: true` (matched "Cash & Bank Accounts")
- Open issues: PR #48 (Lab 5 team number) is on `staging/sprint-1` only → merge `staging/sprint-1` into `staging/sprint-2` with the next release PR
- Next session: F-08 (Sxr1n) · Leviathan-c137 F-09 · review the F-07 PR
### 2026-11-22 — D2-S1 Sprint 2 contracts — Claude + Sxr1n
- Done: contracts F-07–F-12 in `docs/sprints/sprint-2/` (47 AC, 47 STS rows incl. TEST-NFR05-01, status SPECIFIED); SRS v0.5 (D-10–D-13, Q-03 resolved); features v0.3 (F-01–F-06 TESTED, F-07–F-12 SPECIFIED); traceability v0.7 (§2b Sprint 2 table, FR/BR rows filled); SDS v0.7 (Sprint 2 endpoints)
- Evidence: branch `spec/sprint-2-contracts` (spec commits per feature); PR to `staging/sprint-2`
- Decisions (Sxr1n, 2026-11-22): D-10 opening balance editable after transactions, rejected if balance < 0; D-11 unarchive allowed, no delete; D-12 edit/void rejected if a balance would go negative; D-13 account filter = primary or line. Owners: Sxr1n F-07/F-08/F-12, Leviathan-c137 F-09/F-10/F-11. F-08 uses a new `PATCH` so the F-03 `PUT` contract is unchanged; NFR-05 1,000-operation test in F-08 (runs after F-09–F-11 merge)
- Open issues: `staging/sprint-2` created from `staging/sprint-1` `3fd73fe` (Sprint 1 code = `v0.1.0-sprint1`; Lab 5 docs since); Issues #50–#55 (F-07–F-12, label `sprint-2`, assigned); F-09 and F-10 both edit `validateAllowedAccountTypes` → merge F-09 first
- Next session: Sprint 2 T-FEAT sessions in parallel
### 2026-11-22 — Lab 5 C-05 rollback evidence — Claude + Sxr1n (+ Leviathan-c137)
- Done: Leviathan-c137 merged #45 (`bc4f367`), ran rollback (image `b903e00`, revision `s87ce2df5-00004-c6v`) and roll forward (image `0831d0b`, revision `s87ce2df5-00005-cgk`) via Deploy demo, closed #30; bob's data unchanged on all three screenshots; Lab 5 report C-05 + limitations filled; `build_report.py` embeds `img/` PNGs (headless Chrome printed only the first 4 file:// images)
- Evidence: runs 44926378340 and 44927793262 (deploy success, smoke 4/4 PASS each); `docs/labs/lab05/C-05-rollback.txt`; Figures 9–11 `submission/lab5/img/c05-rb-*.png`; live `/api/health` version `0831d0b7…` after roll forward
- Open issues: Lab 5 Part 0 team number and PDF file name (section, group); Leviathan-c137 has no Cloud Console access to the shared project (not needed: deploys via Actions/WIF)
- Next session: build + submit Lab 5 PDF → Lab 6 partner UAT → Sprint 2 contracts
### 2026-11-21 — Lab 5 deploy on the course cloud — Claude + Sxr1n (+ Leviathan-c137 reviews)
- Done: #37–#41 merged (#41 release → main `b903e00`); portal "Connect to Google Cloud" → resources ready (prefix `s87ce2df5`, URL https://s87ce2df5-4d7hbszvwq-as.a.run.app); GitHub environment `demo` + WIF variables, `DEPLOY_ENABLED=true`; JWT secret in `s87ce2df5-app-secret-1` and first deploy by `deploy/deploy.sh` (Sxr1n, Cloud Shell; 2SV had to be enabled first); C-02 PR #42 (failing test, blocked, closed unmerged); C-04 live demo as bob (sign-in, ฿1,500 receipt, BR-07 rejection); #43 → staging, release #44 → main `0831d0b` deployed automatically (revision `s87ce2df5-00003-xnd`); C-05 after-redeploy; PR #45 with C-05/C-06 evidence
- Evidence: `docs/labs/lab05/C-02-failing-check.txt`, `C-03-fresh-clone.txt`, `first-deploy-smoke.txt`, `C-06-release-deploy.txt`; Deploy demo run 44918889759 (CI 6/6, deploy, smoke 4/4); `submission/lab5/img/` Figures 1–8
- Decisions: alice untouched for Lab 6 UAT-01; bob used for Lab 5 demos (UAT cases v0.3 make bob's values relative); first deploy by script, later releases by Actions
- Open issues: C-05 restart/rollback (Leviathan-c137, #30); Lab 5 Part 0 needs team number, section, group name; report limitations; build + submit Lab 5 PDF by 22 Nov 23:59; Lab 6 partner unknown
- Next session: rollback evidence → Lab 5 PDF → Lab 6 partner UAT → Sprint 2 contracts (D2 29 Nov)

### 2026-11-20 — Lab 5 shared cloud + Lab 6 Part A — Claude + Sxr1n
- Done: course portal sign-in (team prefix `s87ce2df5`, project `cpe-se-course-2026`); portal review said our repo lacked `ci-docker.yml` → team kit zip merged into our setup (PR #38: `deploy.sh` without resource creation, names `s87ce2df5*`, `ci.yml` → `ci-docker.yml` + job `test-and-docker`, `teardown.sh` removed, deployment.md v0.3, SDS v0.6); Lab 6 UAT cases UAT-01–05 + handoff (PR #39, v0.2 after a local rehearsal); ruleset `protect-main` (id 27680785) on `main` + `staging/**`: no deletion/force-push, PR with 1 approval, merge commits only, required check `test-and-docker`
- Evidence: PR #38 CI all 6 checks pass (run 44623254181); `DRY_RUN=1 bash deploy/deploy.sh` touches only `s87ce2df5*`; UAT rehearsal 5/5 on local dev servers (temporary Playwright script, not committed; not UAT evidence)
- Decisions: JWT secret in team slot `s87ce2df5-app-secret-1`; alice/bob on the cloud stay untouched until the UAT team runs the cases
- Open issues: resources not activated yet (Recheck needs `ci-docker.yml` on main); secret names and DATABASE_URL format unverified until activation; PRs #37/#39 must "Update branch" after #38 merges (required check `test-and-docker` only exists from #38); failing-check demo after #38; Lab 6 partner team unknown; ask TA early about a controlled defect exercise (§3.5)
- Next session: merge #38 → release PR → portal Recheck + Activate → secret + first deploy → fill UAT URL/SHA → partner UAT

### 2026-11-15 — D1-S10b SDS consistency fix — Claude + Sxr1n
- Done: PR #36 (SDS v0.5: §1.1 Packaging no longer says "on the VM", Sources list current doc versions) approved + merged by Leviathan-c137 (`b43f9f5`); final PDF rebuilt from staging `b43f9f5`
- Evidence: `submission/d1/D1-v0.1.0-sprint1.pdf` 76 pages = cover 1 + [8, 10, 9, 4, 23, 21]; text check: student IDs only on the cover, tag commit `e1747cb` on cover, "on the VM" only in the v0.5 revision row
- Next session: submit D1 on LEB2

### 2026-11-15 — D1-S10 Final PDF check — Claude + Sxr1n
- Done: PR #34 approved + merged (`c597032`); final PDF built from staging and checked: IDs + tag commit on cover, Part A–F start pages match the contents table (2/10/20/29/33/56), 11 figures, no placeholders, seed passwords/JWT secret not in the PDF; rendered Part F showed Figure F-1 as a loading spinner → retaken after data loads (PR #35)
- Evidence: `submission/d1/D1-v0.1.0-sprint1.pdf` 76 pages = cover 1 + [8, 10, 9, 4, 23, 21]
- Next session: submit D1 → Lab 5 when GCP works

### 2026-11-14 — D1-S9 Release + Part F check — Claude + Sxr1n
- Done: #31 → staging (`f6a9b8b`), #32 → main (`e1747cb`, merge commits, both approved by Leviathan-c137); tag `v0.1.0-sprint1` → `e1747cb` pushed; Part F (#33) checked claim by claim against the code at the tag, evidence files, PR reviews and CI; PR #34: 5 factual fixes (reset-e2e author, unrecorded npm/Docker versions, 401 test IDs, 403 message text, who caught the selector clash) + 11 captioned screenshots (D1 §4.2/§5 require them; Part F had none); `build_pdf.py` resolves `img/` links
- Evidence: CI on main run 43585303434 (13 files / 58 server tests, 6 E2E) and Deploy demo 43585303548 (tests pass, `deploy` skipped); screenshots `submission/d1/img/` captured from dev servers on code identical to the tag (`git diff v0.1.0-sprint1` = docs + .gitignore only), no mocks; PDF 76 pages = cover 1 + [8, 10, 9, 4, 23, 21], 11 images in Part F
- Decisions: screenshots taken by a temporary Playwright script (not committed); API access restrictions shown as a screen dump of real responses
- Open issues: PR #34 needs review; PDF must be rebuilt from staging after merge (`D1_STUDENT_IDS=... python submission/d1/build_pdf.py v0.1.0-sprint1`); Lab 5 issues #23, #27–#30 open
- Next session: submit D1 → Lab 5 when GCP works

### 2026-11-14 — D1-S8b (Part F & PDF) — Claude + Leviathan-c137
- Done: เติมเนื้อหา `submission/d1/part-f.md` (Working Sprint 1 and verification) ครบทุกหัวข้อตามข้อกำหนด D1 §4.2 — Program demonstrations (normal journey, rule rejections, role/forbidden ops), Automated test results (41/41 ACs PASS), Test excerpts (BR-07/BR-08 และ BR-11/BR-12), Workflow history (PR #17 F-04 และ PR #19 F-06), Contributions split, AI-use declaration, Known limitations; ประกอบเล่ม PDF ด้วย `submission/d1/build_pdf.py` ได้เอกสารสมบูรณ์ 65 หน้า
- Evidence: `submission/d1/part-f.md`, `submission/d1/D1-v0.1.0-sprint1.pdf` (65 pages = cover 1 + parts [8, 10, 9, 4, 23, 10])
- Next session: Sxr1n ตรวจสอบเล่ม PDF D1 และเตรียมส่ง LEB2

### 2026-11-14 — Lab 5 paused + deploy guard — Claude + Sxr1n
- Done: บันทึกประกาศอาจารย์ (Lab 5 ไม่มีกำหนดส่ง, D1 ยังส่ง 15 Nov); job `deploy` ใน `deploy.yml` รันเฉพาะเมื่อ repo variable `DEPLOY_ENABLED == 'true'` เพื่อไม่ให้ release เข้า main ล้มขณะยังไม่มี GCP; repo เป็น public + secret scanning/push protection เปิดแล้ว (ตรวจผ่าน API)
- Decisions: ใช้ repo variable แทน `vars.GCP_PROJECT_ID` เพราะตัวแปรระดับ environment ใช้ใน job-level `if` ไม่ได้
- Next session: release PR staging → main → tag `v0.1.0-sprint1` → Part F + PDF

### 2026-11-14 — Lab 5: starter kit adapted for Cloud Run — Claude + Sxr1n
- Done: `deploy/deploy.sh`, `release.sh`, `teardown.sh`, `smoke_test.py`, `.github/workflows/deploy.yml` จาก starter kit ปรับเป็นชื่อ `money-logger*`, secret (DB URL, JWT, seed admin/user), migration job `prisma migrate deploy && prisma db seed`, service port 4000 + `COOKIE_SECURE=true` + `RUN_MIGRATIONS=false`; `ci.yml` เพิ่ม `workflow_call`; `/api/ready` (+2 test); entrypoint ข้าม migrate ได้; `docs/labs/lab05/deployment.md`; SDS v0.4 (SD-03 → Cloud Run)
- Evidence: `/api/ready` red (2 fail, 404) → green: server 58/58, tsc OK; smoke test กับ container ในเครื่อง PASS ทั้ง 4 check และล้มเมื่อ version ไม่ตรง; `bash -n` ผ่านทั้ง 3 script
- Decisions: ตัด login smoke check ของ kit (kit ใช้ bearer token, เราใช้ cookie); ไม่ใส่ `deploy/tests/` ของ kit
- Open issues: งานที่ต้องให้คนทำ — GCP Free Trial + project + IAM + budget (Sxr1n), รัน `deploy.sh` ใน Cloud Shell, WIF + environment `demo`, เปิด repo เป็น public + ruleset `protect-main`, สาธิต PR ที่ CI fail; ยังไม่เคยรันกับ GCP จริง
- Next session: Ep. 5 first deploy (Cloud Shell) → Ep. 6 → release v0.1.0-sprint1 ผ่าน pipeline
### 2026-11-14 — Public-repo prep (Lab 5 R-12) — Claude + Sxr1n
- Done: ลบรหัสนักศึกษาออกจาก `CLAUDE.md`, `docs/srs.md` (v0.4) และ `submission/d1/build_pdf.py` (อ่านจาก env `D1_STUDENT_IDS` ตอน build); เลิก track `docs/course/` (ไฟล์ยังอยู่ในเครื่อง, ใส่ใน .gitignore)
- Decisions: deploy บน Cloud Run + Cloud SQL ตาม starter kit (แทน SD-03 VM — แก้ SDS ใน PR ของ Lab 5); Sxr1n เป็น owner ของ GCP project; รหัสนักศึกษาใส่เฉพาะใน PDF
- Open issues: ข้อมูลเก่ายังอยู่ใน git history (ห้ามเขียน history ใหม่) และใน email ของ commit
- Next session: Lab 5 — ปรับ starter kit (Cloud Run)

### 2026-11-14 — D1-S8 PDF builder — Claude + Sxr1n
- Done: `submission/d1/build_pdf.py` — สร้าง PDF ของ D1 จากเอกสารใน `docs/` โดยตรง (Part A–E) + `submission/d1/part-f.md` (โครง Part F ตาม D1 §4.2 ให้ Leviathan-c137 เติม); ปก + สารบัญ + navigation table พร้อมช่วงหน้า; Chrome headless render Markdown/mermaid, `pypdf` รวมไฟล์
- Evidence: build ในเครื่องได้ 57 หน้า (ปก 1 + A 8, B 10, C 9, D 4, E 23, F 2); ตรวจด้วย pdftotext ว่าแต่ละ Part เริ่มหน้าตรงกับตาราง; ตรวจภาพหน้าปก (ชื่อไทยแสดงถูก) และ ER/flowchart diagram
- Decisions: ไม่ใช้ poppler ใน script (Smart App Control บล็อก exe ของ poppler เมื่อเรียกจาก Python) → นับหน้าจาก PDF เอง + `pypdf`
- Open issues: ต้อง build ใหม่หลังสร้าง tag `v0.1.0-sprint1` (หน้าปกแสดง commit ของ tag) และหลังเพื่อนเติม Part F + ภาพหน้าจอ
- Next session: Part F (Leviathan-c137) · release PR · Lab 5

### 2026-11-14 — D1-S7 Release v0.1.0-sprint1 (prep) — Claude + Sxr1n
- Done: #19 (F-06) merged by Leviathan-c137; F-01–F-06 TESTED (40/40 + AC-F05-08 PASS); release verification on staging `2f8dd76`
- Evidence: `evidence/d1/release-v0.1.0-sprint1.txt` — tsc OK, server 13 files / 56 tests passed, client build OK, E2E 6 passed, Docker image build OK; 0 failed, 0 skipped; CI on `2f8dd76` success 5/5
- Open issues: Issue #6 closes when the release reaches main; tag after main merge; Lab 5 L5-S3 + protection demo
- Next session: release PR staging → main, tag

### 2026-11-14 — F-06 Overview, summary and history — Claude + Sxr1n
- Done: `GET /api/overview`, `GET /api/summary?from&to`, `GET /api/transactions` (paged), `GET /api/transactions/:id`, `periodTotal` ใน `GET /api/accounts`; `lib/query.ts` (paging/period ใช้ร่วมกับ admin), `lib/summary.ts` (นับเฉพาะ INCOME/EXPENSE line ของ POSTED — BR-06); หน้า Overview, History, Transaction detail, nav Overview/History, คอลัมน์ This month ในหน้า Accounts; E2E global setup reset + seed DB dev
- Evidence: red `c5848da` → `evidence/d1/F06-red.txt` (API 6 fail), `F06-e2e-red.txt` (journey ล้มที่หน้า Overview); green `7850d4e` → `evidence/d1/F06-green.txt` (server 56/56, tsc OK, client build OK, E2E 6/6)
- Decisions: journey E2E ใช้ bob (spec F-04/F-05 แก้ข้อมูลของ alice ในรอบเดียวกัน); ไม่ใส่ปุ่มซ้ำบน Overview (ชื่อลิงก์ซ้ำทำให้ selector ของ E2E F-04/F-05 พัง) — contract v0.3
- Open issues: `getTodayBangkok` (ledger.ts) ซ้ำกับ `bangkokToday` (period.ts) และ `formatTHB` มี 4 ชุด → Parked; branch protection; L5-S3 GCP ยังไม่เริ่ม
- Next session: release `v0.1.0-sprint1` และ Lab 5

### 2026-11-12 — Integration + F-06 (part) — Claude + Sxr1n
- Done: #7–#12 merged; #10 CONFLICTING ค้าง → `git merge-tree` สะอาด → merge staging เข้า F-01 (`729b1ce`); integration run staging `2770873`; E2E ในเครื่องโดน Windows Smart App Control → `PW_CHANNEL=chrome` (#15); F-06 helper ตัดรอบเดือน Bangkok
- Evidence: `evidence/d1/staging-integration-2770873.txt` (server 17/17, E2E 3/3); F-06 range red `87b22b5` → green `59cbd08`

### 2026-11-14 — D1-S6c (F-05) — Claude + Leviathan-c137
- Done: F-05 ครบ AC-F05-01–07 + E2E TEST-F05-08 — ฟังก์ชัน `calculateTxnEffects` บน shared ledger core (`server/src/lib/ledger.ts`), จัดการ transaction form `PAYMENT` ใน `POST /api/transactions` (atomic balance updates, BR-05 effects, BR-07 cash overspending check, BR-08 card overpayment check, check constraint backstop), หน้า Make a payment (`/pay`) พร้อม dynamic lines, spending/repayment categories, live footer comparison, inline field error mapping, Playwright E2E `e2e/f05-pay.spec.ts`
- Evidence: red `f615c47` → `evidence/d1/F05-red.txt` (8 failed); green `6f52657` → `evidence/d1/F05-green.txt` (server 47/47 passed, client build OK, E2E 5/5 passed; CI run 43489199561)
- Decisions: PAYMENT updates balance using `calculateTxnEffects` with locked rows; CASH balance cannot be negative (BR-07); repayments cannot exceed debt (BR-08); repayments do not affect expense sum (BR-06)
- Open issues: —
- Next session: Sxr1n รีวิว F-05 PR; Leviathan-c137 ตรวจสอบ F-06 และเตรียมรายงาน Lab 5

### 2026-11-13 — D1-S6b (F-04) — Claude + Leviathan-c137
- Done: F-04 ครบ AC-F04-01–07 — model Txn/TxnLine, migration `init_transactions`, shared ledger core (`server/src/lib/ledger.ts`), `POST /api/transactions` (atomic posting algorithm พร้อม SELECT FOR UPDATE, balance updates, validation BR-01..04, BR-09), หน้า Receive money (`/receive`) พร้อม live footer calculation, client-side validation และ field error mapping, E2E test `e2e/f04-receive.spec.ts`; unskipped และ verified PASS สำหรับ `TEST-F03-02`
- Evidence: red `295c90b` → `evidence/d1/F04-red.txt` (5 failed API-DB); green `b2a4f70` → `evidence/d1/F04-green.txt` (server 34/34 passed, client build OK, E2E 4/4 passed)
- Decisions: shared transaction engine ใช้ schema model `Txn` และตาราง `transactions` / `transaction_lines`; posting algorithm ล็อก accounts เรียงตาม id ascending ป้องกัน deadlock
- Open issues: —
- Next session: Sxr1n รีวิว F-04 PR; Leviathan-c137 เริ่ม F-05 Make a payment or record a charge

### 2026-11-12 — D1-S6a (F-03) — Claude + Leviathan-c137
- Done: F-03 ครบ AC-F03-01–05 — enum AccountType, model Account, migration `init_accounts`, seed default accounts, `GET /api/accounts`, `PUT /api/accounts/:id/opening-balance`, หน้า Accounts (`/accounts`) พร้อมแบบฟอร์มตั้งยอดเริ่มต้น
- Evidence: red `0849955` → `evidence/d1/F03-red.txt` (5 failed API-DB, unit failed); green `3f3aae5` → `evidence/d1/F03-green.txt` (server 24/24 passed, client build OK, E2E 3/3 regression passed)
- Decisions: opening balance เก็บ satang เป็น bigint บน accounts; validation เช็ก 400 -> 404 -> 422 -> 409
- Open issues: —
- Next session: Sxr1n รีวิว F-03 PR; Leviathan-c137 เริ่ม F-04 Receive money (transaction engine)

### 2026-11-07 — L5-S1 (Docker + compose) — Claude + Sxr1n
- Done: `Dockerfile` (multi-stage, image เดียว Express serve React — SD-05 Accepted), service `app` ใน compose (port 8080), `server/docker-entrypoint.sh` (migrate deploy + seed ถ้า `SEED_ON_START=true`), root `.env.example`, env `COOKIE_SECURE`/`CLIENT_DIST`; README มีหัวข้อ Docker; SDS v0.3
- Defect ที่เจอระหว่างทำ: seed reset status ของ user ทุกครั้งที่ container start (admin disable หายหลัง restart) → red `7785f76` (`evidence/d1/seed-nondestructive-red.txt`) → fix `b5154a9` → green (server 18/18)
- Evidence: `docs/labs/lab5/L5-S1-compose-check.txt` — fresh volume + `build --no-cache` → migration applied, seed, `/` และ `/overview` 200 HTML, `/api/accounts` 401, bob DISABLED คงอยู่หลัง restart และหลัง down/up; full suite server 18/18, E2E 3/3
- Open issues: ยังไม่ได้อ่านไฟล์แนบ Lab 5 (วิธีเข้า GCP); HTTPS ยังไม่มี → ใช้ `COOKIE_SECURE=false`; image มี dev dependencies (shortcut ใน Dockerfile)
- Next session: L5-S2 CI quality gate

### 2026-11-07 — D1-S5b (F-02) — Claude + Sxr1n
- Done: F-02 ครบ AC-F02-01–06 — `GET /api/admin/users`, `PATCH /api/admin/users/:id` (disable เพิ่ม token_version, ห้าม disable ตัวเอง), หน้า Users
- Evidence: red `50c09ff` → `evidence/d1/F02-red.txt` (4 fail, 3 pass เพราะ guard จาก F-01); green `1090928` → `evidence/d1/F02-green.txt` (server 17/17, client build OK, E2E 3/3 regression)
- Decisions: branch `feature/F02-admin-user-access` แตกจาก `feature/F01-auth` → PR ต้อง merge หลัง #10
- Open issues: หน้า Users ไม่มี E2E (STS ไม่ได้กำหนด) — ตรวจผ่าน API test เท่านั้น
- Next session: F-03–F-05 (เพื่อน) แล้ว F-06

### 2026-11-07 — D1-S5 (F-01) — Claude + Sxr1n
- Done: F-01 Auth ครบ AC-F01-01–08 — migration `init_users`, seed (alice, bob, admin), login/logout/me, `requireAuth`/`requireRole` mount ที่ `/api/admin` และกลุ่ม route การเงิน, หน้า Login + navbar + route guard; README มีขั้นตอน test DB/generate/seed; ย้าย port DB ในเครื่องเป็น 5434 (SDS v0.2)
- Evidence: red `e9f9653` → `evidence/d1/F01-red.txt` (API 6 fail, unit fail), `F01-e2e-red.txt` (2 fail); green `56ac71d` → `evidence/d1/F01-green.txt` (server 10/10 passed, client build OK, E2E 3/3 passed)
- Decisions: branch `feature/F01-auth` แตกจาก `spec/sprint-1-contracts` + merge `chore/scaffold` (ผู้ใช้อนุมัติ เพราะ #7–#9 รอ review) — PR ของ F-01 ต้อง merge หลัง #8 และ #9
- Open issues: เพื่อนยังไม่ได้เป็น collaborator; Prisma 7 ไม่ generate client หลัง `migrate dev` (ใส่ใน README แล้ว)
- Next session: F-02 Admin (D1-S5b) บน branch ที่แตกจาก F-01; เพื่อนเริ่ม F-03–F-05

### 2026-11-07 — Scaffold (ระหว่าง D1-S4 → D1-S5) — Claude + Sxr1n
- Done: โครง server/client/e2e, health endpoint, error shape, docker-compose, `.env.example`, README
- Evidence: commit `a91af97` (PR #9) — server 3/3 passed, client build OK, smoke E2E 1/1 passed
- Next session: D1-S5

### 2026-11-07 — D1-S4 — Claude + Sxr1n
- Done: contracts `docs/sprints/sprint-1/F01–F06-*.md` (40 AC, 40 STS rows, status SPECIFIED), `docs/dod.md` v0.1; traceability v0.2 (sync AC-F03-02 + test levels, ปิด gap line type), features v0.2 (F-03 มี account list)
- Evidence: `7dbc7ec` (spec), `1dbaac0` (docs) บน `spec/sprint-1-contracts` (pushed); Issues #1–#6
- Decisions: Sprint 1 รับ line เฉพาะ RECEIPT←INCOME และ PAYMENT→EXPENSE/LOAN_TAKEN; ใช้ 2 PR (docs/d1-baseline → staging แล้วตามด้วย contracts → staging); owner: Sxr1n = F-01/F-02/F-06, <Student B> = F-03/F-04/F-05; note ≤ 200 ตัวอักษร (ขีดจำกัดระดับ contract)
- Open issues: **เพื่อนยังไม่ได้เป็น collaborator ของ repo** (review PR ไม่ได้); ยังไม่รู้ GitHub username ของเพื่อน; Issue ของ F-03/04/05 ยังไม่ได้ assign (รอ username ของเพื่อน); ถาม TA เรื่อง Q-01
- Next session: เปิด PR 2 ตัวให้เพื่อน review → D1-S5 ∥ D1-S6

### 2026-11-07 — D1-S3 — Claude + Sxr1n
- Done: `docs/system-sds.md` v0.1 — stack + component diagram, ตำแหน่งที่บังคับใช้ rule, ER + constraints + ownership, การเก็บ balance/posting algorithm, migration/seed, หน้าจอ UI + shared states, API conventions + error shape, permission matrix, auth/session, env vars, แผน GCP
- Evidence: commit `af4bdaf` (pushed)
- Decisions: SD-01 เก็บ balance เป็น column (row lock); SD-02 opening balance เป็น field บน account; SD-03 VM + docker compose; SD-04 session ด้วย tokenVersion (แบบ TokTickIT); SD-05 1 app image (Proposed); SD-06 422/404/403
- Open issues: HTTPS/VM size/การเข้า GCP (Lab 5); line type ของ engine ใน Sprint 1 (D1-S4); Q-01 ถาม TA
- Next session: D1-S4 Sprint 1 contracts + DoD

### 2026-11-07 — D1-S2 — Claude + Sxr1n
- Done: `docs/features.md` v0.1 (F-01–F-16 + SR-01–SR-04), `docs/traceability.md` v0.1 (FR/BR/NFR ครบทุกข้อ, 40 planned AC/TEST ของ Sprint 1, coverage gaps, approved changes), `docs/sprints/plan.md` v0.1; `docs/srs.md` → v0.2 (D-01–D-09 Accepted); `CLAUDE.md` ใส่ stack + รูปแบบ ID `SR-`
- Evidence: commits `e2d8413`, `cc2efa9` (pushed to `origin/docs/d1-baseline`) · ตรวจด้วยสคริปต์แล้วว่า FR-01–27, BR-01–17, NFR-01–11 อยู่ครบทั้งใน features.md และ traceability.md และ AC ทุกตัวผูกกับ REQ อย่างน้อย 1 ข้อ
- Decisions: แบ่ง sprint ตาม SRS (option A); ยืนยัน D-01–D-09 (team); NFR ที่ข้ามหลาย feature ใช้ system responsibility SR-xx; traceability Sprint 1 ใช้ ID + คำอธิบายสั้น
- Open issues: Q-01 (ถาม TA เรื่อง D-03 ก่อน freeze F-05), Q-03 (ก่อน contract ของ F-08), ขอบเขต line type ของ engine ใน Sprint 1 (ตัดสินใน D1-S4), ชื่อ–รหัสนักศึกษายังว่าง
- Next session: D1-S3 System SDS

### 2026-11-07 04:00 — D1-S1 (draft) — Claude + Sxr1n
- Done: ร่าง `docs/srs.md` v0.1 — context, actors, scope/exclusions, domain model, FR-01–27, BR-01–17, NFR-01–11, assumptions, decisions D-01–09, questions Q-01–03
- Evidence: ยังไม่ commit (รอทีมรีวิว)
- Decisions: ทุกข้อใน §8.2 ยังเป็น Proposed ต้องให้ทั้งสองคนยืนยันก่อน
- Open issues: Q-01–Q-03; ชื่อ–รหัสนักศึกษาและ stack ใน CLAUDE.md ยังว่าง
- Next session: ทีมรีวิว SRS → commit ผ่าน branch `docs/d1-baseline` → D1-S2 (features + traceability + sprint plan)

### YYYY-MM-DD HH:MM — <Session ID> — <ชื่อคนที่ทำ>
- Done:
- Evidence: <commit SHA / test::name / evidence/... file>
- Decisions:
- Open issues / blockers:
- Next session:

## Parked (เจอระหว่างทางแต่อยู่นอก scope)
- Receive money: after Save, the Receiving account dropdown still shows the old balance (`Bank (฿0.00)`) until the page is reloaded — display only (seen on the live URL 2026-11-21)
- รวม `getTodayBangkok()` (server/src/lib/ledger.ts) กับ `bangkokToday()` (server/src/lib/period.ts) และ `formatTHB` ใน AccountsPage/PayPage/ReceiveMoneyPage ให้ใช้ `client/src/format.ts`
-
