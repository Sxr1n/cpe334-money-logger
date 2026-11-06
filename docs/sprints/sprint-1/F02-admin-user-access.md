# F-02 Administrator user access — Sprint 1
Linked: FR-04, FR-05, BR-12, BR-13, NFR-01, NFR-02   Status: SPECIFIED   Owner: Sxr1n
Depends on: F-01. Design references: `docs/system-sds.md` §5, §6

## 1 Behavior & workflow
**Happy path**
1. The administrator logs in and lands on the Users screen.
2. The list shows every platform account with username, display name, role, status and creation date — and no financial data.
3. The administrator clicks Disable on a user. The status changes to DISABLED; that user's open sessions stop working on their next request and they cannot log in.
4. The administrator clicks Enable; the user can log in again (old sessions stay invalid).

**Failure and boundary cases**
- Administrator tries to disable their own account → 403, status unchanged.
- Unknown user id → 404. Invalid status value → 422.
- Setting the status it already has → 200, no change (idempotent; token version is not bumped).
- Administrator calls any financial endpoint → 403. A USER calls any admin endpoint → 403.

## 2 Business rules & validation
- BR-12: `/api/admin/*` is mounted behind `requireAuth, requireRole('ADMIN')`; every financial router behind `requireAuth, requireRole('USER')`.
- BR-13: disabling sets `status = DISABLED` and increments `token_version` in one update; an administrator cannot disable their own account.
- FR-04: the user list response is built from an explicit field list (no account, transaction or balance data).
- `status` must be `ACTIVE` or `DISABLED`.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| List users | 403 | ✔ all users | 401 |
| Disable / enable a user | 403 | ✔ any user except disabling self (403) | 401 |
| Any financial endpoint (`/api/accounts*`, `/api/transactions*`, `/api/overview`, `/api/summary`) | ✔ own data (other features) | 403 | 401 |

## 4 UI
- **Users screen** (`/admin/users`, ADMIN home): table with Username, Display name, Role, Status badge, Created (Bangkok date), and a Disable/Enable button per row. The admin's own row has no Disable button (the API still refuses).
- Loading: table spinner. Empty: "No users." Button pending: disabled with spinner. Error: alert with the server message; row unchanged.
- A USER opening `/admin/users` sees "Not allowed"; an ADMIN opening a financial screen sees "Not allowed" (UI convenience only — the API returns 403).

## 5 API
**`GET /api/admin/users?page=1&pageSize=50`** (ADMIN)
- 200: `{ "items": [ { "id": 2, "username": "alice", "displayName": "Alice Example", "role": "USER", "status": "ACTIVE", "createdAt": "2026-11-07T03:00:00.000Z" } ], "page": 1, "pageSize": 50, "total": 3 }` — ordered by username.
- 401 / 403 as in §3.

**`PATCH /api/admin/users/:id`** (ADMIN)
- Request: `{ "status": "DISABLED" }` or `{ "status": "ACTIVE" }`
- 200: the updated user object (same fields as the list item).
- 403 `FORBIDDEN`: target is the acting administrator and status is DISABLED.
- 404 `NOT_FOUND`: no user with this id.
- 422 `VALIDATION_FAILED`: status missing or not one of the two values.

## 6 Data
No change (uses `users.status` and `users.token_version` from F-01).

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F02-01 | Logged in as admin, `GET /api/admin/users` returns 200 with all seeded users; each item has exactly the keys id, username, displayName, role, status, createdAt. |
| AC-F02-02 | Given alice is logged in, when admin disables her, then her next request with the existing cookie returns 401 and her login is rejected; after admin re-enables her, she can log in again. |
| AC-F02-03 | Admin `PATCH`es their own id to DISABLED → 403 and their status stays ACTIVE (admin can still call `/me`). |
| AC-F02-04 | Logged in as admin, every Sprint 1 financial endpoint (list in TEST-F02-04) returns 403 `FORBIDDEN` with no financial data. |
| AC-F02-05 | Logged in as alice (USER), `GET /api/admin/users` and `PATCH /api/admin/users/:id` return 403 and bob's status is unchanged. |
| AC-F02-06 | Without a session, both admin endpoints return 401. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F02-01 | AC-F02-01 | API-DB | Seeded DB; admin cookie | `GET /api/admin/users` | 200; `total` = 3; item keys exactly the six listed; no `balance`/`accounts` keys |
| TEST-F02-02 | AC-F02-02 | API-DB | alice and admin logged in | Admin `PATCH /api/admin/users/{alice} {status:"DISABLED"}`; alice `GET /api/auth/me`; alice login; admin sets ACTIVE; alice login | PATCH 200; `/me` 401; login 401; after enable login 200 |
| TEST-F02-03 | AC-F02-03 | API-DB | admin logged in | `PATCH /api/admin/users/{admin} {status:"DISABLED"}`; then `GET /api/auth/me` | 403; `/me` 200; DB status ACTIVE |
| TEST-F02-04 | AC-F02-04 | API-DB | admin cookie; alice's account and transaction ids exist | Call `GET /api/accounts`, `PUT /api/accounts/:id/opening-balance`, `POST /api/transactions`, `GET /api/transactions`, `GET /api/transactions/:id`, `GET /api/overview`, `GET /api/summary` | Each 403 `FORBIDDEN`; body keys = `["error"]`; no DB change |
| TEST-F02-05 | AC-F02-05 | API-DB | alice cookie | `GET /api/admin/users`; `PATCH /api/admin/users/{bob} {status:"DISABLED"}` | Both 403; bob still ACTIVE |
| TEST-F02-06 | AC-F02-06 | API-DB | No cookie | Both admin endpoints | 401 (also covered in TEST-F01-05) |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F02-01 | — | NOT RUN | — |
| AC-F02-02 | — | NOT RUN | — |
| AC-F02-03 | — | NOT RUN | — |
| AC-F02-04 | — | NOT RUN | — |
| AC-F02-05 | — | NOT RUN | — |
| AC-F02-06 | — | NOT RUN | — |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial contract | D1-S4 |
