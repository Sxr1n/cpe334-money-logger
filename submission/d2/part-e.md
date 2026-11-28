## E.1 Candidate on main
| Item | Value |
|---|---|
| Tag | `v0.3.0-rc1` (annotated), on merge commit `a56ebe5112242ab3217f02b6ecea2c27defdccdd` on `main` |
| Release PR | #85 `release/v0.3.0-rc1` → `main`, author Sxr1n, approved by Leviathan-c137 on head `73f3e96`, merged 2026-11-28 |
| CI on the tag commit | run 46158159937 (CI, `a56ebe5`): server typecheck + unit/API-DB tests, client build, E2E (Playwright), Docker image build, secret scan (NFR-09), `test-and-docker` — all success |
| Deploy | Deploy demo run 46158159954 (E.4) |

**Contents of the candidate**
- Sprint 1: F-01–F-06 (released in `v0.1.0-sprint1`, accepted in D1)
- Sprint 2: F-07–F-12, all TESTED. F-08 includes AC-F08-07 (TEST-NFR05-01, PR #79)
- Sprint 3: F-13–F-16, all TESTED. F-15 is the Sprint 3 workflow (D-16, Part C.2)
- Approved change: CHG-01 credit limit (Lab 7, in `v0.2.0-sprint2`)
- Defect fix: DEF-01 (PR #82)

Since `v0.2.0-sprint2`, the release adds only F-08's AC-F08-07, test fixes (#76, #79), DEF-01 and documentation. It adds no migration.

## E.2 Build and regression on the candidate commit
The release verification ran on staging `d9fa4c8`, the commit that release PR #85 brought to `main`. The merge commit `a56ebe5` adds only documents and this evidence file (`git diff --stat d9fa4c8 a56ebe5`: `docs/ai-use.md`, `docs/sessions/STATUS.md`, `docs/traceability.md`, `evidence/d2/release-v0.3.0-rc1.txt`), so the tested code is the tagged code. CI then ran the same suites on `a56ebe5` itself (E.1).

| Check | Command | Result |
|---|---|---|
| Server type check | `cd server && npx tsc --noEmit` | exit 0 |
| Server unit + API-DB | `cd server && npm test` | 34 files, **140 passed**, 0 failed, 0 skipped |
| Client unit | `cd client && npm test` | 1 file, **1 passed** |
| Client build | `cd client && npm run build` | built OK |
| E2E | `npx playwright test` (all specs, fresh seeded DB) | **20 passed**, 0 failed, 0 skipped |
| Docker image | `docker build -t money-logger:release-check .` | exit 0 |

No failures or skips. Full output (`evidence/d2/release-v0.3.0-rc1.txt`):

<!-- code: evidence/d2/release-v0.3.0-rc1.txt -->

## E.3 Cross-feature checks
These tests check places where Sprint 2–3 work touches older behaviour. All of them ran in the full suite above. They were also re-run on their own on the candidate code, staging `bd49b09`, whose application code is identical to `a56ebe5`. That run selected them with `-t`, so the other tests in the same files show as skipped (`evidence/d2/E3-cross-feature-rc1.txt`, **8 passed**, 0 failed).

| Interaction | Test | What it proves | Result |
|---|---|---|---|
| F-11 edit × balances and category totals (F-06, F-15) | TEST-F11-01 | Editing a card payment replaces its lines, changes the debt by the net difference and moves the category totals | PASS |
| F-11 void × balances and summary (F-06) | TEST-F11-05 | Voiding a payment restores Bank, removes the expense from the month and keeps the transaction in history as VOID | PASS |
| F-11 void × archived account (F-07) | TEST-F11-07 | A payment from an archived Wallet cannot be voided until the Wallet is unarchived (422) | PASS |
| F-07 archive × posting (F-04, F-05) | TEST-F07-05, TEST-F07-06 | Archiving needs a zero balance for CASH/LOAN accounts; an archived account cannot be used in a receipt or payment until it is unarchived | PASS |
| VOID and non-spending × reports (F-11 × F-15, F-16; BR-06) | TEST-F15-02, TEST-F16-02 | Repayments, transfers, opening balances, income and VOID transactions are never counted as spending or expense | PASS |
| All money paths × stored balances (NFR-05) | TEST-NFR05-01 | 1,000 seeded random operations (seed 3342026: 464 posted, 121 edited, 73 voided, 126 opening-balance edits, 216 rejected); every stored balance equals the SQL recomputation to the satang | PASS |

<!-- code: evidence/d2/E3-cross-feature-rc1.txt -->

## E.4 Deployment and post-deploy checks
| Item | Value |
|---|---|
| Pipeline | Deploy demo run 46158159954, started by the push of `a56ebe5` to `main`: the six CI jobs, then `deploy` — all success |
| Deployed revision | Cloud Run `s87ce2df5-00007-lk8`, project `cpe-se-course-2026`, region `asia-southeast1` |
| URL | https://s87ce2df5-4d7hbszvwq-as.a.run.app |
| Running version | `GET /api/health` → `{"status":"ok","version":"a56ebe5112242ab3217f02b6ecea2c27defdccdd"}` = tag commit; `/api/ready` → 200 (both read on 2026-11-28 after the deploy) |
| Smoke test (in the pipeline) | PASS `/api/health` (version), PASS `/api/ready` (DB), PASS `/` (HTML), PASS `/api/accounts` (401 without a session) |
| Migration | no new migration in this release; the migrate job execution `s87ce2df5-migrate-6vh8m` completed successfully before the new revision was created (its output is not shown in the Actions log) |

**Post-deploy checks on the deployed candidate.** `deploy/post_deploy_checks.py` was run by Sxr1n in Cloud Shell on 2026-11-28 16:11 UTC. Passwords came from Secret Manager into environment variables, were never printed and were unset afterwards. Result: **11/11 PASS**, exit 0. The checks cover a critical money path on the live system, run through the API:
- bob creates a credit card, sets a ฿5,000.00 limit, and is rejected 1 satang over the limit (422);
- the exact limit is accepted (201) and persisted;
- a cash overspend is rejected with Bank unchanged (BR-07);
- no session → 401; administrator → 403 on financial data;
- cross-user change → 404.

<!-- code: evidence/d2/post-deploy-v0.3.0-rc1.txt -->

**Data still present after redeploy.** The Lab 5 live demo (C-04, 2026-11-21) left a ฿1,500.00 receipt in bob's Bank account. Check PD-07 read bob's Bank as 150000 satang (฿1,500.00) twice:
- after the `v0.2.0-sprint2` deploy, revision `s87ce2df5-00006-bbr` (`evidence/lab7/post-deploy-v0.2.0-sprint2.txt`);
- after this deploy, revision `s87ce2df5-00007-lk8`.

The data survived both redeploys. The Lab 5 restart and rollback evidence is in `docs/labs/lab05/C-05-rollback.txt`.

The Sprint 1 user-interface journey (TEST-F06-07) on the candidate code is in Part A.1. We kept UI demonstrations off the cloud while the Lab 6 partner team tests it, because their UAT cases depend on alice's and bob's starting data.

## E.5 Setup summary
Full instructions: `README.md` (local setup, tests, Docker) and `docs/labs/lab05/deployment.md` (cloud deployment).

- **Dependencies:** Node.js 24 with npm, Docker Desktop (PostgreSQL 16 container). Stack: React 19 + Vite + TypeScript + Bootstrap; Express 5 + TypeScript + Prisma 7; PostgreSQL 16.
- **Environment variables** (names only; values are never committed; the examples are in `server/.env.example` and `.env.example`):
  - `server/.env`: `PORT`, `NODE_ENV`, `APP_VERSION`, `DATABASE_URL`, `TEST_DATABASE_URL`, `JWT_SECRET`, `SEED_USER_PASSWORD`, `SEED_ADMIN_PASSWORD`;
  - Docker compose (`.env`): `APP_VERSION`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `COOKIE_SECURE`, `SEED_ON_START`, `SEED_USER_PASSWORD`, `SEED_ADMIN_PASSWORD`.
- **Run locally:**
  - `docker compose up -d postgres` (port 5434)
  - `cd server && npm install && npx prisma migrate deploy && npx prisma generate && npx prisma db seed && npm run dev` (API on :4000)
  - `cd client && npm install && npm run dev` (UI on :5173)
- **Run with Docker:** `cp .env.example .env` (set the secrets), then `docker compose up -d --build`. This builds one image (Express serves the React build) and starts it at http://localhost:8080. The entrypoint runs `prisma migrate deploy`, then the seed when `SEED_ON_START=true`. The seed only creates missing users (DEF-02).
- **Tests:**
  - `cd server && npm test` (unit + API-DB on `TEST_DATABASE_URL`)
  - `cd client && npm test && npm run build`
  - `npx playwright test` at the repo root (E2E on the seeded dev DB; starts both servers)
- **Seed data:** synthetic users alice and bob (USER) and admin (ADMIN), with default accounts. Their passwords come from the environment.
- **Deployment:**
  1. A release PR to `main` (one approval, required check `test-and-docker`) runs the "Deploy demo" workflow.
  2. The workflow builds and pushes the image, then runs the migration job `s87ce2df5-migrate`.
  3. It deploys Cloud Run service `s87ce2df5`, authenticating through Workload Identity Federation. Secrets come from Secret Manager (`s87ce2df5-database-url`, `s87ce2df5-app-secret-1`, `s87ce2df5-admin-password`, `s87ce2df5-demo-password`).
  4. It runs the smoke test.
  5. After that, `deploy/post_deploy_checks.py URL SHA` runs from Cloud Shell.

No real passwords or tokens appear in this document or the repository.

## E.6 Readiness review and plan to 13 December
**Known defects and open items**
| Item | Status | Blocks `v1.0.0`? |
|---|---|---|
| DEF-01 Receive page stale balance | Fixed and released in `v0.3.0-rc1`; UAT partner re-test pending | Yes, until re-tested |
| Lab 6 partner UAT of `v0.3.0-rc1` | In progress (handoff: `docs/uat/sprint-1-uat-cases.md` v0.6) | Yes: critical/major findings must be fixed and re-tested; minor ones fixed or accepted by the UAT team |
| F-01–F-16 status | TESTED (all AC PASS) | Become ACCEPTED after the final regression and UAT re-test |

**Technical debt** (from the Lab 7 readiness review, `docs/labs/lab07/metrics-readiness.md` §D.2). Items resolved since then:
- TEST-F14-03 now uses the F-11 void API.
- F-11 edits re-validate BR-18 (AC-F11-12).

| Item | Priority | Action before `v1.0.0` |
|---|---|---|
| Duplicate date helper (`getTodayBangkok` / `bangkokToday`) and four copies of `formatTHB` in the client | Medium | Merge into one helper each, behind the existing tests |
| The CHECK-violation fallback in `POST /api/transactions` always says "Balance cannot be negative" | Low | Map the constraint name to the right message |
| Docker image includes dev dependencies | Low | Prune in the Dockerfile |
| Working copy in OneDrive (zeroed `.git` files on 2026-11-26) | High (process) | Move the clone out of OneDrive after the 29 Nov submissions |

**What blocks `v1.0.0`:**
- the Lab 6 UAT decision and any accepted-defect fixes with partner re-test;
- the final full regression on the release commit;
- the DoD review (`docs/dod.md`);
- the final traceability pass;
- the final video.

The dated steps and owners are in Part C.3. Because of the exam period (1–11 December), no new feature work is planned after 29 November.
