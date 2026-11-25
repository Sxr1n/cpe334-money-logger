# F-13 Favourite transactions — Sprint 3
Linked: FR-22, BR-11, BR-12, NFR-01, NFR-02   Status: SPECIFIED   Owner: Sxr1n
Depends on: F-06 (detail, history), F-12 (list filters), F-11 (VOID status). Design references: `docs/system-sds.md` §2.2 (`transactions.is_favorite` already exists), §4.3; decision D-15

## 1 Behavior & workflow
**Happy path**
1. On a transaction's detail page, Alice clicks "☆ Add to favourites". The button becomes "★ Favourite" (click again to remove).
2. A new nav link "Favourites" lists her favourite transactions, newest first, with the same columns as History. Each row has a Duplicate button (F-14).

**Decision D-15:** a VOID transaction cannot be marked as favourite (422). If a favourite is voided later, it disappears from the Favourites list: the list shows only POSTED transactions. The flag itself stays in the database, so voiding (F-11) does not need to change anything.

**Failure and boundary cases**
- Marking an already-favourite transaction again, or unmarking one that is not a favourite → 200 with no change.
- Unmarking a VOID transaction → allowed (it cleans up the flag).
- Another user's transaction or an unknown id → 404.

## 2 Business rules & validation
| Rule | Check | Error |
|---|---|---|
| shape | body `{ "favorite": boolean }` | 400 `BAD_REQUEST` |
| BR-11 | transaction loaded with `userId = session user` | 404 `NOT_FOUND` |
| D-15 | `favorite: true` requires `status = POSTED` | 422 `RULE_VIOLATION` ("A void transaction cannot be a favourite") |
| list | `GET /api/transactions?favorite=true` adds `is_favorite = true AND status = POSTED` to the F-12 filters; `favorite` accepts only `true` | 422 `VALIDATION_FAILED` (`details.favorite`) |

The transaction shape (F-04 §5) gains `"isFavorite": true|false`.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `PUT /api/transactions/:id/favorite` | ✔ own transaction (other's → 404) | 403 | 401 |
| `GET /api/transactions?favorite=true` | ✔ own only | 403 | 401 |

## 4 UI
- **Transaction detail:** a toggle button "☆ Add to favourites" / "★ Favourite" (with `aria-pressed`). It is hidden for VOID transactions. A pending request disables the button; an error shows an alert.
- **Favourites** (`/favorites`, nav link): the History table without the filter bar, plus a Duplicate button per row (F-14). Empty: "No favourites yet — open a transaction and click Add to favourites."

## 5 API
**`PUT /api/transactions/:id/favorite`** (USER) — body `{ "favorite": true }` → 200 the transaction with `isFavorite`. Errors: 400, 404, 422, 401, 403.
**`GET /api/transactions?favorite=true`** — as F-12 §5.

## 6 Data
No schema change (`transactions.is_favorite BOOLEAN NOT NULL DEFAULT false` exists since `init_transactions`).

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F13-01 | When alice marks her payment as favourite → 200 `isFavorite: true`; `GET /api/transactions?favorite=true` returns exactly that transaction; unmarking → 200 `isFavorite: false` and the list is empty. Marking twice keeps one favourite. |
| AC-F13-02 | Marking a VOID transaction → 422 `RULE_VIOLATION` and the flag stays false; a favourite that is then voided is no longer returned by `favorite=true`; unmarking a VOID transaction → 200. |
| AC-F13-03 | `favorite=yes` → 422 naming `favorite`; body `{ "favorite": "true" }` → 400. |
| AC-F13-04 | Without a session → 401; as admin → 403; alice marking bob's transaction → 404 and bob's flag is unchanged; bob's favourites never appear in alice's list. |
| AC-F13-05 | In the browser, alice adds a transaction to favourites from its detail page, sees it on Favourites, removes it, and sees the empty message. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F13-01 | AC-F13-01 | API-DB | alice payment | PUT true, list, PUT true again, PUT false, list | As stated |
| TEST-F13-02 | AC-F13-02 | API-DB (TDD) | VOID transaction; POSTED favourite then set to VOID in setup | PUT true on VOID; list; PUT false on VOID | 422 and unchanged; not listed; 200 |
| TEST-F13-03 | AC-F13-03 | unit + API-DB | — | Parser and requests | 422 / 400 |
| TEST-F13-04 | AC-F13-04 | API-DB | no cookie; admin; bob's transaction | Requests | 401; 403; 404 with bob unchanged; lists separate |
| TEST-F13-05 | AC-F13-05 | E2E | alice with a payment recorded through the API in the test | Detail → Add → Favourites → detail → Remove → Favourites | Listed, then empty message |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F13-01 … AC-F13-05 | — | NOT RUN | — |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-25 | Initial contract (D-15: VOID cannot be marked; the list shows only POSTED favourites). | D2-S5 |
