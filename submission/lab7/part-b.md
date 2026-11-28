## B.1 Version table

| Role | Version / commit | Notes |
|---|---|---|
| Accepted Sprint 1 baseline (old behaviour) | `v0.1.0-sprint1` → `e1747cb` on `main` | Deployed before this change as `0831d0b` (same application code plus Lab 5 docs), revision `s87ce2df5-00005-cgk` |
| Intervening development | `staging/sprint-2` up to `7832344` | Sprint 2/3 features F-07–F-10, F-12–F-16 (PRs #56–#69). These are unrelated to CHG-01 but sit on top of the Sprint 1 code that CHG-01 changes |
| Approved contract | `d090196` (spec), merged as `7832344` (PR #73) | Pre-change implementation = `7832344` |
| Changed-behaviour tests (red) | `f8a9b70` = `7832344` + tests only | `evidence/lab7/CHG01-red.txt` |
| Implementation (green) | `1660d08`; docs `5e5c97c`; merged as `3f8e176` (PR #74) | `evidence/lab7/CHG01-green.txt` |
| Unrelated work in the same release | F-11 transaction corrections (PR #75, `22acd51`) | Kept apart from CHG-01; F-11 re-validates BR-18 in edits (AC-F11-12) |
| Accepted main release | `v0.2.0-sprint2` → `76aaabc` (PR #77) | Merge commit of `release/v0.2.0-sprint2` (`22acd51` + evidence commit `cb2b614`) |
| Deployed revision | `s87ce2df5-00006-bbr` (Deploy demo run 46064946596) | `/api/health` version `76aaabc…` |

## B.2 Changed-behaviour tests: setup and assertions

The red/green suite is `server/tests/chg01-credit-limit.api.test.ts` (API-DB, real PostgreSQL). Every test starts from the shared setup shown first: Bank opening ฿30,000 and Credit Card debt ฿1,200. The boundary test TEST-F05-11 follows it.

<!-- code: server/tests/chg01-credit-limit.api.test.ts:21-45 -->

<!-- code: server/tests/chg01-credit-limit.api.test.ts:102-115 -->

Unit-level boundary on the pure rule (`server/tests/chg01-credit-limit.unit.test.ts`):

<!-- code: server/tests/chg01-credit-limit.unit.test.ts:22-37 -->

## B.3 Red on the pre-change implementation, then green

**Red:** `f8a9b70` = the pre-change implementation `7832344` + the new tests. Command: `cd server && npx vitest run tests/chg01-credit-limit.unit.test.ts tests/chg01-credit-limit.api.test.ts`, then `npx playwright test e2e/chg01-credit-limit.spec.ts`.

The new behaviour is missing, so the failures are assertion failures. For example, TEST-F05-11 expects 422 and gets 201 (the old code accepts any charge), and TEST-F05-11/12 unit expect `valid: false` and get `true`. One failure is not behavioural: the unit TEST-F05-10 fails with `validateCreditLimit is not a function` because the validator did not exist yet. We do not count it as red evidence. The behavioural red is the 7 API assertions and the TEST-F05-11/12 unit assertions. Full output:

<!-- code: evidence/lab7/CHG01-red.txt -->

**Green:** `1660d08`, full regression, the same commands plus the complete suites:

<!-- code: evidence/lab7/CHG01-green.txt -->

## B.4 Code diff of the implementation (`7832344` → `1660d08`, application code only)

<!-- gitdiff: 7832344 1660d08 server/src server/prisma client/src -->

## B.5 Existing regression suite and why it is relevant

| Suite | Why it is relevant to CHG-01 |
|---|---|
| `f05-*` (TEST-F05-01..08, Sprint 1 payments) | Charges and repayments go through the same `calculateTxnEffects`. Cards without a limit must behave exactly as before |
| `f04-*`, `f10-*` (receipts, borrowing) | A RECEIPT line from LOAN_TAKEN now runs the limit check |
| `f03-*`, `f08-*` (opening balance) | The opening-balance change now checks the limit |
| `f07-*` (accounts PATCH) | The same endpoint now accepts `creditLimit` |
| `f01-*`, `f02-*` (auth, admin) | The access rules (401/403/404) must still hold for the new field |
| `f06-*`, `f15-*`, `f16-*` (summaries, reports) | A limit must never count as income or expense (BR-06) |
| E2E `f04`/`f05`/`f06`/`f07` journeys | Pay, Receive and Accounts screens changed |

No existing test was changed, weakened or skipped: `git diff 7832344 1660d08 -- server/tests e2e` shows only the three new files.

Release regression on the release tree `22acd51`: `evidence/d2/release-v0.2.0-sprint2.txt`.

<!-- code: evidence/d2/release-v0.2.0-sprint2.txt -->

| Command | Passed | Failed | Skipped |
|---|---|---|---|
| `server: npx tsc --noEmit` | exit 0 | — | — |
| `server: npm test` (33 files) | 139 | 0 | 0 |
| `client: npm test` + `npm run build` | 1 + build OK | 0 | 0 |
| `npx playwright test` | 19 | 0 | 0 |
| `docker build` | OK | — | — |

## B.6 Issue → contract → tests → code → review → CI → staging → release → deploy

| Step | ID | Result |
|---|---|---|
| Change request | Issue #72 | Closed by the release PR #77 |
| Contract review | PR #73 (A.4) | Approved by Leviathan-c137 before the code |
| Code review + CI | PR #74, CI run 46051342340 | 6/6 checks pass (server 127 / client 1 / E2E 18 on `5e5c97c`); approved by Leviathan-c137; merged to `staging/sprint-2` `3f8e176` |
| Staging integration | `staging/sprint-2` CI after #74 and #75 | Release regression above |
| Main release | PR #77 → `76aaabc`, tag `v0.2.0-sprint2` | Approved by Leviathan-c137 |
| Deployment | Deploy demo run 46064946596 | CI 6/6; migration job `s87ce2df5-migrate-89jqv` applied `add_credit_limit`; revision `s87ce2df5-00006-bbr` at 100 % traffic; smoke 4/4 PASS |

PR #74 review (verbatim):

> Approved (CHG-01 Credit limit on credit cards). Verified: (1) migration 20261128000000_add_credit_limit adds credit_limit BIGINT and DB check constraint safely (NULL for existing rows); (2) BR-18 is enforced on locked rows across POST /api/transactions (both PAYMENT LOAN_TAKEN primary and RECEIPT LOAN_TAKEN borrow line), PATCH /api/accounts/:id, and PATCH /api/accounts/:id/opening-balance; (3) no existing tests were modified or weakened (only new chg01 tests added); (4) TDD red/green evidence (f8a9b70 / 1660d08), 6/6 CI checks pass, and zero student IDs committed. Note: after F-11 (#75) merges, we will add the explicit BR-18 application check to PUT /api/transactions/:id as well (DB check already acts as backstop).

PR #77 release review (verbatim, abridged to its first and last lines):

> LGTM! Ready to release 0.2.0-sprint2 to main: … Approved to merge and tag 0.2.0-sprint2.

## B.7 Post-deployment checks on the live service

`deploy/post_deploy_checks.py` was run by Sxr1n against the deployed revision. It is a manual run of a script: passwords were typed at the prompt and never stored. Synthetic data only: bob gets a new card, and alice is only read. Check IDs PD-01..PD-11:

- changed behaviour: PD-02..06;
- preserved Sprint 1 domain rule: PD-07 (BR-07);
- preserved access paths: PD-08 (401), PD-09/10 (administrator denied financial data), PD-11 (user isolation, cross-user 404).

<!-- code: evidence/lab7/post-deploy-v0.2.0-sprint2.txt -->
