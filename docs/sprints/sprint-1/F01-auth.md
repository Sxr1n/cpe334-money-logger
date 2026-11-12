# F-01 Authentication and session — Sprint 1
Linked: FR-01, FR-02, FR-03, BR-12, BR-13, NFR-01, NFR-03, NFR-04   Status: SPECIFIED   Owner: Sxr1n
Design references: `docs/system-sds.md` §5 (permissions), §6 (auth and session)

## 1 Behavior & workflow
**Happy path**
1. A seeded user or administrator opens the app and sees the Login screen.
2. They enter username and password and submit.
3. The server checks the credentials, issues a session cookie and returns the identity. The UI goes to Overview (USER) or Users (ADMIN).
4. On any later page load the UI calls `GET /api/auth/me` to restore the identity.
5. Logout ends the session on the server; the UI returns to Login.

**Failure and boundary cases**
- Unknown username, wrong password or DISABLED account → the same generic error; no hint which part was wrong.
- Missing username or password → 400; the UI blocks submit with field messages.
- A request with no cookie, a tampered/expired token, a token from before logout, or a token of a now-disabled user → 401.
- Session lifetime is 8 hours from login; there is no refresh.

## 2 Business rules & validation
- Username is compared case-insensitively (stored lower-case). Password is compared with bcrypt (`bcryptjs`, cost 10).
- BR-13: a DISABLED user cannot log in; existing sessions are rejected from the next request (`requireAuth` checks `status` and `token_version`).
- BR-12: role and identity come only from the verified session; the server ignores any `userId` or `role` sent by the client.
- NFR-03: the password hash never appears in any response or log line.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `POST /api/auth/login` | ✔ | ✔ | ✔ |
| `POST /api/auth/logout` | ✔ own session | ✔ own session | 401 |
| `GET /api/auth/me` | ✔ own identity | ✔ own identity | 401 |

This feature also provides the shared middleware used by every other protected endpoint: `requireAuth` (401) and `requireRole(role)` (403).

## 4 UI
- **Login screen** (`/login`): username, password, Login button. Empty field → "Required" under the field, submit blocked. Pending → button disabled with spinner. 401 → alert "Invalid username or password." and the username stays filled, the password is cleared.
- **Navigation bar** (all logged-in screens): display name, role badge, Logout button. Logout pending → button disabled.
- **Route guard:** any screen except Login calls `/api/auth/me` first; 401 → redirect to `/login` with "Please log in." Logged-in user opening `/login` → redirected to their home.

## 5 API
**`POST /api/auth/login`**
- Request: `{ "username": "alice", "password": "<password>" }`
- 200: `{ "id": 2, "username": "alice", "displayName": "Alice Example", "role": "USER" }` + `Set-Cookie: ml_session=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800` (+ `Secure` in production)
- 400 `BAD_REQUEST`: username or password missing or not a string.
- 401 `INVALID_CREDENTIALS`, message `"Invalid username or password."` — for unknown user, wrong password and DISABLED user alike.

**`POST /api/auth/logout`** (requires session)
- 200: `{ "ok": true }`; increments `users.token_version`; clears the cookie.
- 401 `UNAUTHENTICATED`: no valid session.

**`GET /api/auth/me`** (requires session)
- 200: `{ "id", "username", "displayName", "role" }`
- 401 `UNAUTHENTICATED`.

All errors use `{ "error": { "code", "message", "details"? } }` (SDS §4.2).

## 6 Data
Migration `init_users`:
| Field | Type | Constraint |
|---|---|---|
| id | serial | PK |
| username | varchar(30) | NOT NULL, UNIQUE, stored lower-case |
| display_name | varchar(60) | NOT NULL |
| password_hash | varchar(100) | NOT NULL |
| role | enum `Role` (USER, ADMIN) | NOT NULL |
| status | enum `UserStatus` (ACTIVE, DISABLED) | NOT NULL, default ACTIVE |
| token_version | int | NOT NULL, default 0 |
| created_at | timestamptz | NOT NULL, default now() |

Seed: `alice` (USER), `bob` (USER), `admin` (ADMIN); passwords from `SEED_USER_PASSWORD` / `SEED_ADMIN_PASSWORD`.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F01-01 | Given seeded user alice, when she logs in with the correct password, then the response is 200 with her id, username, display name and role USER, a `ml_session` httpOnly cookie is set, and `GET /api/auth/me` with that cookie returns the same identity. |
| AC-F01-02 | Login with a wrong password, and login with an unknown username, both return 401 `INVALID_CREDENTIALS` with the identical message and no cookie. |
| AC-F01-03 | Given alice is DISABLED, login with her correct password returns the same 401 as AC-F01-02 and no cookie. |
| AC-F01-04 | After alice logs out (200), a request to `GET /api/auth/me` that replays her old cookie returns 401. |
| AC-F01-05 | Every protected Sprint 1 endpoint (list in TEST-F01-05) called without a cookie returns 401 `UNAUTHENTICATED` and the body contains only the error object. |
| AC-F01-06 | The stored `password_hash` of every seeded user is a bcrypt hash with cost ≥ 10 and differs from the password; no response of login or `/me` contains `password` or `passwordHash`. |
| AC-F01-07 | A session token whose 8-hour expiry has passed is rejected (401). |
| AC-F01-08 | In the browser, alice logs in, sees her display name in the navigation bar, logs out and is back on Login; reloading a protected page then redirects to Login. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F01-01 | AC-F01-01 | API-DB | Seeded alice, correct password | `POST /api/auth/login`, then `GET /api/auth/me` with returned cookie | 200 + identity, cookie has HttpOnly; `/me` 200 with same id/role |
| TEST-F01-02 | AC-F01-02 | API-DB | (a) alice + wrong password (b) username `nobody` | `POST /api/auth/login` | Both 401 `INVALID_CREDENTIALS`, identical message, no `Set-Cookie` |
| TEST-F01-03 | AC-F01-03 | API-DB | alice status set to DISABLED in DB | Login with correct password | 401 `INVALID_CREDENTIALS`, same message, no cookie |
| TEST-F01-04 | AC-F01-04 | API-DB | alice logged in, cookie saved | `POST /api/auth/logout`, then `GET /api/auth/me` with the saved cookie | Logout 200; `/me` 401 |
| TEST-F01-05 | AC-F01-05 | API-DB | No cookie | Call each: `GET /api/auth/me`, `POST /api/auth/logout`, `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `GET /api/accounts`, `PUT /api/accounts/:id/opening-balance`, `POST /api/transactions`, `GET /api/transactions`, `GET /api/transactions/:id`, `GET /api/overview`, `GET /api/summary` | Each 401 `UNAUTHENTICATED`; body keys = `["error"]` |
| TEST-F01-06 | AC-F01-06 | API-DB | Seeded DB | Read `users.password_hash`; log in; call `/me` | Hash matches `/^\$2[aby]\$(1[0-9]|[2-9][0-9])\$/`, ≠ password; response bodies have no `password`/`passwordHash` key |
| TEST-F01-07 | AC-F01-07 | unit | Token signed for alice with `exp` in the past | `verifySessionToken(token)` | Returns null (→ 401 in `requireAuth`) |
| TEST-F01-08 | AC-F01-08 | E2E | Seeded DB, app running | Log in as alice via UI, check navbar, click Logout, open `/overview` | Navbar shows display name; after logout Login screen; `/overview` redirects to Login |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F01-01 | — | NOT RUN | — |
| AC-F01-02 | — | NOT RUN | — |
| AC-F01-03 | — | NOT RUN | — |
| AC-F01-04 | — | NOT RUN | — |
| AC-F01-05 | — | NOT RUN | — |
| AC-F01-06 | — | NOT RUN | — |
| AC-F01-07 | — | NOT RUN | — |
| AC-F01-08 | — | NOT RUN | — |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial contract | D1-S4 |
