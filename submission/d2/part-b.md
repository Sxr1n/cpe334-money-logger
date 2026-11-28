> The Sprint 2 contracts and the DoD are on the previous pages. Lines marked TO FILL (D2-RC) are completed from the release candidate run; no result is written before it was run.

## B.1 Sprint 2 feature completion
Every Sprint 2 feature went through contract → red test → implementation → teammate review → `staging/sprint-2`. Test files are under `server/tests/` (API-DB and unit, real PostgreSQL) and `e2e/` (Playwright).

| Feature | AC | Implementation (PR, merge commit) | Executed verification (test files) | Result (commit) | Accepted release |
|---|---|---|---|---|---|
| F-07 Account management | AC-F07-01–08 | PR #56 (Sxr1n, reviewed by Leviathan-c137) → `bca9352` | `f07-accounts.api.test.ts`, `f07-accounts.unit.test.ts`, `e2e/f07-accounts.spec.ts` | 8/8 PASS on `3a75c2f` | `v0.2.0-sprint2` |
| F-08 Opening balance management | AC-F08-01–07 | PR #57 → `10e90d8` (AC-01–06); PR #79 → `1300344` (AC-07) (Sxr1n, reviewed by Leviathan-c137) | `f08-opening-balance.api.test.ts`, `f08-opening-balance.unit.test.ts`, `e2e/f08-opening-balance.spec.ts`, `nfr05-recompute.api.test.ts` | AC-01–06 PASS on `c341d6d`; AC-07 (TEST-NFR05-01) PASS on `ced1120` | AC-01–06 `v0.2.0-sprint2`; AC-07 `v0.3.0-rc1` |
| F-09 Transfers | AC-F09-01–07 | PR #67 (Leviathan-c137, reviewed by Sxr1n) → `71e02c4` | `f09-transfers.api.test.ts`, `f09-transfers.unit.test.ts`, `e2e/f09-transfers.spec.ts` | 7/7 PASS on `c36a003` | `v0.2.0-sprint2` |
| F-10 Loans | AC-F10-01–08 | PR #69 (Leviathan-c137, reviewed by Sxr1n) → `6a0e4eb` | `f10-loans.api.test.ts`, `f10-loans.unit.test.ts` (50-case allowed-lines matrix), `e2e/f10-loans.spec.ts` | 8/8 PASS on `e98d37d` | `v0.2.0-sprint2` |
| F-11 Transaction corrections | AC-F11-01–12 | PR #75 (Leviathan-c137, reviewed by Sxr1n) → `22acd51` | `f11-corrections.api.test.ts`, `f11-corrections.unit.test.ts`, `e2e/f11-corrections.spec.ts` | AC-01–10 PASS on `fb0336f`; AC-11/12 (concurrency, BR-18 on edit) PASS on `ce2ae73` | `v0.2.0-sprint2` |
| F-12 Search and filter | AC-F12-01–07 | PR #58 (Sxr1n, reviewed by Leviathan-c137) → `a5ebd48` | `f12-search.api.test.ts`, `f12-search.unit.test.ts`, `e2e/f12-search.spec.ts` | 7/7 PASS on `63d377b` | `v0.2.0-sprint2` |

`v0.2.0-sprint2` = `76aaabc` on `main` (PR #77, approved by Leviathan-c137). Release regression on its tree `22acd51`: server 33 files / 139 tests, client 1 test + build, E2E 19, Docker build; 0 failed, 0 skipped (`evidence/d2/release-v0.2.0-sprint2.txt`). Re-run on the candidate: Part E.

## B.2 Program demonstrations (two Sprint 2 features)
TO FILL (D2-RC): captioned screenshots from the candidate version for F-11 (edit and void a payment; a rejected edit under D-12) and F-12 (filter History; the filter survives a reload), each with the role, starting data, steps, expected and actual results.

## B.3 Test excerpts
Both excerpts are from `server/tests/f11-corrections.api.test.ts` (API-DB on PostgreSQL). Shared setup: a fresh database with alice and bob (each with the default accounts), an administrator, and a Wallet for alice.

<!-- code: server/tests/f11-corrections.api.test.ts:38-53 -->

**(1) Cross-feature domain rule (F-11 × F-04/F-05, D-12).** An edit may not leave a cash account negative; an edit that brings it to exactly ฿0.00 is accepted.

<!-- code: server/tests/f11-corrections.api.test.ts:148-181 -->

**(2) Access restriction (401 / 403 administrator / 404 cross-user).** Identity comes from the session cookie only; bob's transaction and bob's account are invisible to alice.

<!-- code: server/tests/f11-corrections.api.test.ts:258-289 -->

Run output (the 9 skipped are the other tests of the file, filtered out with `-t` for this excerpt; the full file passes in every regression run):

<!-- code: evidence/d2/B3-excerpts-run.txt -->

## B.4 TDD red/green
The red commit holds only the new tests on top of the previous code; its output was saved before the implementation commit.

| Feature | Red commit → evidence | Green commit → evidence |
|---|---|---|
| F-07 | `e25946a` → `evidence/d2/F07-red.txt` | `3a75c2f` → `evidence/d2/F07-green.txt` |
| F-08 | `51eeffc` → `evidence/d2/F08-red.txt` | `c341d6d` → `evidence/d2/F08-green.txt`; AC-F08-07 `ced1120` → `evidence/d2/NFR05-green.txt` (+ `NFR05-mutation-check.txt`: the test fails when a balance delta is dropped) |
| F-09 | `769742f` → `evidence/d2/F09-red.txt` | `c36a003` → `evidence/d2/F09-green.txt` |
| F-10 | `cbf9735` → `evidence/d2/F10-red.txt` | `e98d37d` → `evidence/d2/F10-green.txt` |
| F-11 | `7888ac1` → `evidence/d2/F11-red.txt`; review fix `8de8d03` (TEST-F11-11/12 red) | `fb0336f` → `evidence/d2/F11-green.txt`; review fix `ce2ae73` |
| F-12 | `37675b2` → `evidence/d2/F12-red.txt` | `63d377b` → `evidence/d2/F12-green.txt` |

TEST-NFR05-01 (AC-F08-07) is a property test written after F-09–F-11 merged, so it has no red commit; its sensitivity was shown instead by breaking the code on purpose (`NFR05-mutation-check.txt`).

Example red (F-11, excerpt of `evidence/d2/F11-red.txt`):

<!-- code: evidence/d2/F11-red.txt:1-40 -->

## B.5 Issue/PR chains

**Chain 1 — F-07 Account management (author Sxr1n, reviewer Leviathan-c137)**

| Step | ID | Date (UTC) |
|---|---|---|
| Issue | #50 "F-07 Account management", assigned Sxr1n | 2026-11-21 |
| Contract | `docs/sprints/sprint-2/F07-account-management.md` v0.1 in contracts PR #49 | 2026-11-22 |
| Branch / PR | `feature/F07-account-management` → PR #56 to `staging/sprint-2` | opened 2026-11-22 18:56 |
| Review | Leviathan-c137 APPROVED: checked trimmed 1–50 character names, case-insensitive uniqueness per user and type (409 with a DB unique index backstop), the row lock before the zero-balance archive check (BR-15), and the archived re-check in posting | 2026-11-23 16:23 |
| Staging merge | `bca9352` | 2026-11-23 |
| Release | PR #77 → `main` `76aaabc`, tag `v0.2.0-sprint2`; Issue #50 closed by it | 2026-11-27 20:37 |

**Chain 2 — F-11 Transaction corrections (author Leviathan-c137, reviewer Sxr1n)**

| Step | ID | Date (UTC) |
|---|---|---|
| Issue | #54 "F-11 Transaction corrections (edit and void)", assigned Leviathan-c137 | 2026-11-21 |
| Contract | `docs/sprints/sprint-2/F11-transaction-corrections.md` v0.1 in PR #49 | 2026-11-22 |
| Branch / PR | `feature/F11-transaction-corrections` → PR #75 | opened 2026-11-27 18:42 |
| Review 1 (changes needed) | Sxr1n: "Must fix before merge — net deltas are computed from a snapshot read outside the transaction (race condition)": two identical PUTs at once would both apply the delta. Asked for a re-read under the row lock and a concurrency test with `Promise.all` | 2026-11-27 19:13 |
| Fix | Leviathan-c137: TEST-F11-11 (concurrency) and TEST-F11-12 (BR-18 credit limit on edit, which he had noted in his own review of the CHG-01 PR #74) red `8de8d03`, fix `ce2ae73` | 2026-11-27 |
| Review 2 / approval | Sxr1n: race-condition fix verified (lock txn → re-read lines in the transaction → compute deltas → lock accounts in id order) and BR-18 on edit checked; asked for AC-F11-11/12 and STS rows in the contract (v0.3); then APPROVED | 20:04 → 20:20 |
| Staging merge | `22acd51` | 2026-11-27 20:20 |
| Release | PR #77 → `76aaabc`, tag `v0.2.0-sprint2`; Issue #54 closed by it | 2026-11-27 20:37 |
