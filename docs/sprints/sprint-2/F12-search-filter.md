# F-12 Search and filter history — Sprint 2
Linked: FR-19, BR-11, BR-12, NFR-01, NFR-02, NFR-08   Status: TESTED   Owner: Sxr1n
Depends on: F-06 (history list), F-11 (status VOID, for the status filter). Design references: `docs/system-sds.md` §4.1, index `(user_id, txn_date DESC, id DESC)`; decision D-13

## 1 Behavior & workflow
**Happy path**
1. On History, Alice opens the filter bar. She sets From 2026-11-01, To 2026-11-30, Account Dining, and Text "lunch", then clicks Apply.
2. The list shows only her transactions in November whose primary account or any line uses Dining (D-13) and whose note contains "lunch" (case-insensitive). Results are newest first and paged by 50. The total count matches.
3. The filters are kept in the URL (`/transactions?from=…&accountId=…&q=…`), so reload, the back button and a shared link show the same results. "Clear filters" returns to the full list.

Available filters (all optional, combined with AND):
- date range (`from`, `to`, inclusive)
- account (primary or line, D-13)
- form (PAYMENT / RECEIPT)
- total amount range (`minAmount`, `maxAmount` in satang, inclusive)
- note text (`q`)
- status (POSTED / VOID, from F-11)

**Failure and boundary cases**
- No filters → same result as F-06. Only `from` → from that date onward. Only `to` → up to that date.
- `from` > `to`, an invalid date, `minAmount` > `maxAmount`, a negative or non-integer amount, a non-integer `accountId`, an unknown `form` or `status`, or `q` longer than 100 characters → 422 with the field name. No results are returned.
- `accountId` of another user's account, or an unknown one → 200 with no items. Every query is restricted to the session user, so no foreign record can match and nothing reveals that the id exists (BR-11).
- `q` is matched literally. `%` and `_` are not wildcards.

## 2 Business rules & validation
| Param | Rule | Error (422 `VALIDATION_FAILED`, `details.<param>`) |
|---|---|---|
| `from`, `to` | `YYYY-MM-DD` calendar date (existing `isCalendarDate`); `from ≤ to` when both are given | "Enter a valid date (YYYY-MM-DD)" / "Must not be after \"to\"" |
| `accountId` | positive integer | "Must be an account id" |
| `form` | PAYMENT or RECEIPT | "Must be PAYMENT or RECEIPT" |
| `status` | POSTED or VOID | "Must be POSTED or VOID" |
| `minAmount`, `maxAmount` | integer satang 0 … 99,999,999,999; `min ≤ max` when both are given | "Enter an amount in satang" / "Must not be more than maxAmount" |
| `q` | trimmed; 1–100 characters (empty after trim = no text filter) | "At most 100 characters" |
| `page`, `pageSize` | as F-06 (`parsePaging`) | as F-06 |

Query: `where userId = session user AND txnDate in range AND form AND status AND total in range AND note ILIKE '%q%' (q escaped) AND (primaryAccountId = accountId OR some line.accountId = accountId)`. Order: `txnDate DESC, id DESC`. `total` in the response is the count of matching rows. The dates are calendar dates, so the range is inclusive without time-zone conversion (A-02).

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `GET /api/transactions` with filters | ✔ own transactions only | 403 | 401 |

## 4 UI
- **History** (`/transactions`): a filter bar above the table:
  - From / To (date inputs), Account (select of all own accounts, archived ones included and marked "(archived)"), Form (Any / Received / Paid), Status (Any / Posted / Void), Min / Max amount (THB), Text.
  - Buttons Apply and Clear filters.
- Filter state lives in the URL query string; Apply updates the URL and resets to page 1.
- Client checks (from ≤ to, min ≤ max, amounts ≥ 0 with at most 2 decimals) show field messages. Server 422 `details` are shown under the matching field. Values are kept.
- Empty result with filters: "No transactions match these filters" with a Clear filters button. Empty without filters: F-06's empty state.
- Loading: spinner over the table; Apply disabled while pending.

## 5 API
**`GET /api/transactions?from&to&accountId&form&status&minAmount&maxAmount&q&page&pageSize`** (USER)
- 200: `{ "items": [ <transaction as F-04 §5, with status> ], "page": 1, "pageSize": 50, "total": 3 }`
- 422 `VALIDATION_FAILED` with `details` per invalid parameter; 401; 403.

## 6 Data
No schema change. Existing indexes: `transactions (user_id, txn_date DESC, id DESC)` and `transaction_lines (account_id)`. NFR-08 (5,000 transactions, ≤ 500 ms p95) is measured in Sprint 3 (SR-04); an index for note search is added only if that measurement needs it.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F12-01 | Given alice's transactions dated 2026-10-31, 2026-11-01, 2026-11-15 and 2026-11-30, `from=2026-11-01&to=2026-11-30` returns exactly the three November ones (both bounds inclusive) with `total` 3; only `from=2026-11-15` returns two. |
| AC-F12-02 | `accountId` = Dining returns the card purchases that have a Dining line although their primary is Credit Card; `accountId` = Bank returns transactions with Bank as primary or as a line; `accountId` of bob's Dining → 200 with no items. |
| AC-F12-03 | `form=RECEIPT` returns only receipts; `status=VOID` returns only voided transactions; `minAmount=50000&maxAmount=120000` returns only totals in [50000, 120000] inclusive. |
| AC-F12-04 | `q=LUNCH` matches notes "Team lunch" and "lunch with Ken" but not "Launch"; `q=%` matches only notes containing a literal "%". Combined `accountId` + `q` + date range returns their intersection, and `page`/`total` reflect the filtered set. |
| AC-F12-05 | `from=2026-11-30&to=2026-11-01`, `from=2026-13-01`, `minAmount=-1`, `minAmount=10&maxAmount=5`, `accountId=abc`, `form=TRANSFER`, `status=DELETED`, or a 101-character `q` → 422 with `details` naming that parameter. |
| AC-F12-06 | Without a session → 401; as admin → 403; when bob has a transaction with note "secret lunch", alice's `q=secret` returns no items. |
| AC-F12-07 | In the browser, alice filters History by Account Dining and Text "lunch"; only matching rows show; after reloading the page the same filters and rows are shown; Clear filters shows the full list. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F12-01 | AC-F12-01 | API-DB | four transactions on the stated dates | Two queries | 3 items / total 3; 2 items |
| TEST-F12-02 | AC-F12-02 | API-DB (TDD) | card purchases with Dining lines; bob's Dining id | Three queries | Line matches included; Bank primary + line; empty for bob's id |
| TEST-F12-03 | AC-F12-03 | API-DB | mixed forms, one voided transaction, totals around the bounds | Three queries | Only matching rows; bounds inclusive |
| TEST-F12-04 | AC-F12-04 | unit + API-DB | notes as stated | Unit: LIKE-escape helper; API: `q` queries, combined filter with `pageSize=1` | Matches as stated; intersection; `total` = filtered count |
| TEST-F12-05 | AC-F12-05 | unit + API-DB | — | Unit: filter parser per invalid input; API: same | 422 with the named `details` key each |
| TEST-F12-06 | AC-F12-06 | API-DB | no cookie; admin; bob's "secret lunch" | Requests | 401; 403; empty for alice |
| TEST-F12-07 | AC-F12-07 | E2E | alice with matching and non-matching transactions | Apply filters; reload; Clear | Filtered rows; same after reload (URL kept); full list |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F12-01 | `server/tests/f12-search.api.test.ts::TEST-F12-01` | PASS | 63d377b |
| AC-F12-02 | `server/tests/f12-search.api.test.ts::TEST-F12-02` | PASS | 63d377b |
| AC-F12-03 | `server/tests/f12-search.api.test.ts::TEST-F12-03` | PASS | 63d377b |
| AC-F12-04 | `server/tests/f12-search.api.test.ts::TEST-F12-04`, `server/tests/f12-search.unit.test.ts::TEST-F12-04` | PASS | 63d377b |
| AC-F12-05 | `server/tests/f12-search.api.test.ts::TEST-F12-05`, `server/tests/f12-search.unit.test.ts::TEST-F12-05` | PASS | 63d377b |
| AC-F12-06 | `server/tests/f12-search.api.test.ts::TEST-F12-06` | PASS | 63d377b |
| AC-F12-07 | `e2e/f12-search.spec.ts::TEST-F12-07` | PASS | 63d377b |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-22 | Initial contract. Account filter matches primary or line account (D-13); foreign `accountId` gives an empty list; `q` is matched literally. | D2-S1 |
| 0.2 | 2026-11-24 | Implemented; all AC PASS (red `37675b2`, green `63d377b`, `evidence/d2/F12-*.txt`). Prisma `contains` does not escape `%`/`_`, so `escapeLike` is used as planned in TEST-F12-04. Status → TESTED. No behaviour change from v0.1. | D2-S4 |
