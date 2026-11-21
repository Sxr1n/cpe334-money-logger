# Deployment — Money Logger on Google Cloud (Lab 5)

| Item | Value |
|---|---|
| Repository | https://github.com/Sxr1n/cpe334-money-logger (public, Lab 5 R-12) |
| GCP project ID | `cpe-se-course-2026` (shared course project) · region `asia-southeast1` · team prefix `s87ce2df5` |
| Public URL | `<fill in after Episode 5>` |
| Access | Course Student Cloud Portal; resources are created by the portal/TA, the team can only update its own `s87ce2df5*` resources. Teammates are added by a TA |

## 1. Stack and changes from the reference
We follow the Lab 5 reference stack and the Starter Kit **adapted for our team by the course portal** (2026-11-20 announcement: the course project replaces each team's Free Trial project): **Artifact Registry → Cloud Run (service + migration job) → Cloud SQL for PostgreSQL 16 → Secret Manager**, deployed by **GitHub Actions with Workload Identity Federation** (no key files).

| Kit default | Money Logger | Why |
|---|---|---|
| Own project; `deploy/deploy.sh` creates every resource; `teardown.sh` deletes them | Shared project; the portal creates every resource with prefix `s87ce2df5`; `deploy/deploy.sh` only builds, migrates and updates; `teardown.sh` removed | Course rule: never create, change IAM of or delete shared resources (ask a TA to pause/clean up) |
| Separate server/client images + nginx | One image: Express serves the API and the built React app (`Dockerfile`, SDS SD-05) | Same origin, no CORS; already built in L5-S1 |
| CI workflow `ci-docker.yml`, single job `test-and-docker` | Same file name; five jobs (server tests, client build, E2E, Docker build, secret scan) plus `test-and-docker`, which passes only if all five passed. `deploy.yml` reuses it (`workflow_call`) | Five separate checks show which gate failed; the portal checks for `ci-docker.yml` |
| Secrets: DB URL, admin password, optional demo password | DB URL, admin password, demo password (used as the password of `alice` and `bob`) from the portal, plus **JWT secret** in team slot `s87ce2df5-app-secret-1` (typed once with the portal kit, never printed) | Our session is a signed cookie; our seed always creates `admin`, `alice`, `bob` |
| Migration job: `prisma migrate deploy && npm run prisma:seed` | `npx prisma migrate deploy && npx prisma db seed` | Our seed only creates missing users, so it is safe to run on every release |
| Service port 3000, max 1 instance | Port 4000; `COOKIE_SECURE=true`; `RUN_MIGRATIONS=false` (the job migrates); max 1 instance | Our server port; Cloud Run is HTTPS; credits are shared |
| Smoke test: `/api/health`, `/api/ready`, `/`, `/api/categories`, optional login | `/api/health` (+ running version = release commit), `/api/ready`, `/`, `/api/accounts` must be 401 | Our endpoints; the kit login check expects a bearer token and we use a cookie |
| Our earlier SDS plan (SD-03): one VM with docker compose | Replaced by Cloud Run + Cloud SQL (SDS v0.4) | Reference stack, scripts and rollback come with the kit |

## 2. Environment variables
| Variable | Purpose | Secret? | Local value from | Cloud value from |
|---|---|---|---|---|
| `DATABASE_URL` | PostgreSQL connection (Cloud SQL via `/cloudsql/` socket in the cloud) | **Yes** | `server/.env` / compose | Secret Manager `s87ce2df5-database-url` (made by the portal) |
| `JWT_SECRET` | Signs the session cookie | **Yes** | `server/.env` | Secret Manager `s87ce2df5-app-secret-1` |
| `SEED_ADMIN_PASSWORD` | Password of seeded `admin` | **Yes** | `server/.env` | Secret Manager `s87ce2df5-admin-password` (migration job only) |
| `SEED_USER_PASSWORD` | Password of seeded `alice`, `bob` | **Yes** | `server/.env` | Secret Manager `s87ce2df5-demo-password` (migration job only) |
| `NODE_ENV` | `production` in the cloud | No | `.env.example` | `deploy/deploy.sh` (service and job) |
| `PORT` | Listening port | No | `server/.env` (4000) | Set by Cloud Run (`--port 4000`) |
| `APP_VERSION` | Version shown by `/api/health` and the UI footer | No | `dev` | Docker build argument = full commit SHA (`deploy.yml`) |
| `COOKIE_SECURE` | `Secure` flag on the session cookie | No | `false` (plain HTTP) | `true` |
| `RUN_MIGRATIONS` | Container start runs `prisma migrate deploy` unless `false` | No | unset (runs) | `false` on the service |
| `SEED_ON_START` | Container start runs the seed (compose only) | No | `.env` | not used (migration job seeds) |
| `CLIENT_DIST` | Folder of the built React app | No | unset in dev | Set in the `Dockerfile` |
| `TZ` | Process time zone | No | — | `Asia/Bangkok` |
| `TEST_DATABASE_URL` | API-DB tests only | No | `server/.env` | CI placeholder |

Every variable is listed in `server/.env.example` or the root `.env.example` with placeholders only. GitHub environment `demo` holds only non-secret variables: `GCP_PROJECT_ID`, `GCP_REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`.

## 3. Commands
```bash
# Local, with Docker
cp .env.example .env && docker compose up -d --build        # app on http://localhost:8080
# Tests (same as CI)
cd server && npx tsc --noEmit && npm test                    # unit + API-DB
cd client && npm run build
npx playwright test                                          # E2E (PW_CHANNEL=chrome on Windows with Smart App Control)
# Migrate and seed (local)
cd server && npx prisma migrate deploy && npx prisma db seed
# First cloud release (Cloud Shell, on main, after the portal shows Resources ready)
gcloud config set project cpe-se-course-2026
DRY_RUN=1 bash deploy/deploy.sh          # read the plan first
DRY_RUN=0 bash deploy/deploy.sh
python3 deploy/smoke_test.py "$(gcloud run services describe s87ce2df5 --region asia-southeast1 --format='value(status.url)')"
```

## 4. GCP resources
| Resource | Name |
|---|---|
All created by the course portal in `cpe-se-course-2026` (names from the team Starter Kit; confirm against the portal's *Team resources* tab).

| Resource | Name |
|---|---|
| Artifact Registry repository | `s87ce2df5` (image `s87ce2df5`, tag = full commit SHA) |
| Cloud SQL instance / database / user | `s87ce2df5-pg` (PostgreSQL) / `s87ce2df5` / `s87ce2df5` |
| Cloud Run service | `s87ce2df5` (min 0, max 1 instance, 512 Mi) |
| Cloud Run job | `s87ce2df5-migrate` |
| Runtime service account | `s87ce2df5-runner` |
| Secrets | `s87ce2df5-database-url`, `s87ce2df5-admin-password`, `s87ce2df5-demo-password`, `s87ce2df5-app-secret-1` (JWT) |
| GitHub variables / Workload Identity | from the portal when the repository is connected |

## 5. Release procedure
1. Every change: Issue → branch from `staging/sprint-N` → PR into staging → CI green → teammate review (specific comment) → merge.
2. Release: PR `staging/sprint-N → main` → CI green → teammate approval → merge (ruleset `protect-main` blocks merging otherwise).
3. The merge to `main` starts **Deploy demo** (its deploy job runs only when the repository variable `DEPLOY_ENABLED` is `true`; until the GCP project exists it is skipped, not failed) (`.github/workflows/deploy.yml`): CI again → build image tagged with the full commit SHA → `deploy/release.sh` (resolve digest → migration job → update service → 100% traffic) → smoke test (also checks `/api/health` version = commit) → run summary.
4. **Which commit is running:** open `<URL>/api/health` (`version` = full commit SHA), the UI footer, the Deploy demo run summary (commit tag + digest), or Cloud Run → `money-logger` → Revisions (image digest).
5. **Rollback:** Actions → Deploy demo → Run workflow on `main` with `image_tag` = full SHA of an earlier release (tests, build and migration are skipped); roll forward the same way with the newer SHA. Migrations are additive only, so an older image still works.
6. **Cost:** credits are shared by all teams; ask a TA to pause or clean up (the old `teardown.sh` must not be used).

## 6. Revision history
| Ver | Date | Change |
|---|---|---|
| 0.1 | 2026-11-14 | Initial version: kit adapted to Money Logger, before the first cloud deployment |
| 0.2 | 2026-11-14 | Deploy job gated by repository variable `DEPLOY_ENABLED` (Lab 5 paused by the instructor's announcement; releases to `main` must not fail while GCP is not set up) |
| 0.3 | 2026-11-20 | Moved to the shared course project `cpe-se-course-2026` (portal, team prefix `s87ce2df5`): resource and secret names, `deploy.sh` from the team Starter Kit (no resource creation), `teardown.sh` removed, CI file renamed `ci-docker.yml` with job `test-and-docker` |
