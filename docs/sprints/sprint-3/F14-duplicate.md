# F-14 Duplicate transaction — Sprint 3
Linked: FR-23, BR-01–BR-09, BR-11, BR-17, NFR-02, NFR-10   Status: TESTED   Owner: Sxr1n
Depends on: F-04, F-05 (forms), F-06 (detail), F-13 (Favourites entry point). Design references: SRS BR-17; decision D-15 (VOID may be duplicated)

## 1 Behavior & workflow
**Happy path**
1. On a transaction's detail page (or a Favourites row), Alice clicks Duplicate.
2. The matching form opens (`/pay?duplicate=:id` for a PAYMENT, `/receive?duplicate=:id` for a RECEIPT). It is pre-filled with the primary account, total, lines and note. The date is today (Bangkok) and the favourite flag is not copied (BR-17). A banner says "Duplicated from the transaction of DD MMM YYYY — nothing is saved until you click Save".
3. She may change anything, then Save. The normal POST runs with every rule (BR-01–BR-09). The result is a new transaction; the original is unchanged.

**Decision D-15:** a VOID transaction can be duplicated. This is useful for re-recording it correctly.

**Failure and boundary cases**
- Leaving the form without saving stores nothing.
- A source account that is now archived (F-07) is not offered in the selects. Its field is left empty and the banner adds "Archived accounts were left empty: <names>".
- An unknown or foreign `duplicate` id → the form shows "Transaction to duplicate was not found" and stays empty (the API answers 404).
- A source transaction whose rules no longer pass, for example because the cash balance is now too low, is rejected on Save with the usual field messages (BR-07), and the values are kept.

## 2 Business rules & validation
No new endpoint. The form reads `GET /api/transactions/:id` (F-06, own only → 404 otherwise) and submits `POST /api/transactions` (F-04/F-05/F-09/F-10), so every server rule applies unchanged.
| Rule | Where | Check |
|---|---|---|
| BR-17 | client mapping `toDuplicateDraft(txn, today)` | copies form, primary, total, lines, note; sets date = today; never copies `isFavorite`, id or status |
| BR-11 | `GET /api/transactions/:id` | foreign id → 404 |
| BR-01–09 | `POST /api/transactions` | unchanged |

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| Read the source (`GET /api/transactions/:id`) | ✔ own (other's → 404) | 403 | 401 |
| Save (`POST /api/transactions`) | as F-04/F-05 | 403 | 401 |

## 4 UI
- Duplicate button on the transaction detail page (POSTED and VOID) and on each Favourites row.
- Pay/Receive forms read `?duplicate=:id`, show the banner, and pre-fill. Save, validation and success messages are the same as F-04/F-05 (NFR-10).

## 5 API
No change.

## 6 Data
No change.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F14-01 | `toDuplicateDraft` of a PAYMENT dated 2026-11-01 with lines Dining 70000 + Groceries 50000, note "Weekend" and `isFavorite: true` gives form PAYMENT, the same primary, total and lines, note "Weekend", date = the given today, and no favourite, id or status field. |
| AC-F14-02 | In the browser, Duplicate on a payment opens `/pay?duplicate=:id` with the values pre-filled and today's date; before Save the transaction count (read through the API) is unchanged; after Save a new transaction exists with the duplicated lines and `isFavorite: false`, and the original is unchanged. |
| AC-F14-03 | Duplicate of a VOID receipt opens `/receive` pre-filled and saves as a new POSTED transaction. |
| AC-F14-04 | When the source uses an archived account, the form leaves that field empty and lists the archived name in the banner; `?duplicate=` with bob's transaction id shows "Transaction to duplicate was not found" and pre-fills nothing. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F14-01 | AC-F14-01 | unit (TDD) | Pure function in `client/src/duplicate.ts` (no React), run with Vitest | Call `toDuplicateDraft` | Draft as stated |
| TEST-F14-02 | AC-F14-02 | E2E | alice payment created through the API in the test, marked favourite | Detail → Duplicate → check fields → count → Save → read new and original | As stated |
| TEST-F14-03 | AC-F14-03 | E2E | VOID receipt (created and voided through the API) | Duplicate → Save | New POSTED receipt |
| TEST-F14-04 | AC-F14-04 | E2E | source uses an archived account; bob's transaction id read through the API in setup | Open both duplicate URLs | Empty field + banner; not-found message |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F14-01 | `client/src/duplicate.test.ts::TEST-F14-01` | PASS | b5cc4a3 |
| AC-F14-02 | `e2e/f14-duplicate.spec.ts::TEST-F14-02` | PASS | b5cc4a3 |
| AC-F14-03 | `e2e/f14-duplicate.spec.ts::TEST-F14-03` | PASS | b5cc4a3; re-run on the F-11 void API `ced1120` |
| AC-F14-04 | `e2e/f14-duplicate.spec.ts::TEST-F14-04` | PASS | b5cc4a3 |

Red `255be65` → `evidence/d2/F14-red.txt` (unit: module missing; E2E 3 fail: no Duplicate link / banner). Green `b5cc4a3` → `evidence/d2/F14-green.txt` (server tsc OK, 25 files / 98 tests; client 1 test, build OK; E2E 15/15). The feat commit also raised TEST-F14-02's starting receipt from ฿2,000 to ฿3,000: the duplicate was correctly rejected by BR-07 because the test had not funded both payments; no assertion changed.

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-25 | Initial contract. No new endpoint; BR-17 in a client mapping function with a client unit test. VOID can be duplicated (D-15). | D2-S5 |
| 0.2 | 2026-11-26 | TEST-F14-01 runs with Vitest added to `client/` (`npm test`, also in the CI job "Client build"). TEST-F14-03 sets the source receipt to VOID through `server/prisma/e2e-void.ts` because the void endpoint (F-11) does not exist yet; switch to the F-11 API once it merges. A `?duplicate=` id of the other form (e.g. a receipt on `/pay`) is treated as not found. | D2-S9 (Sxr1n): F-11 not started |
| 0.3 | 2026-11-26 | Status TESTED; done evidence filled. Archived/empty account selects show "Choose an account" and block Save. | D2-S9 |
| 0.4 | 2026-11-28 | TEST-F14-03 now voids the source through `POST /api/transactions/:id/void` (F-11), as the STS precondition says; `server/prisma/e2e-void.ts` removed. PASS on `ced1120`. No AC changed. | D2-RC (F-11 merged) |
