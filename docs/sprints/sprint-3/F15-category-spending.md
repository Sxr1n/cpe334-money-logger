# F-15 Category spending — Sprint 3
Linked: FR-26, BR-06, BR-11, BR-12, NFR-01, NFR-02   Status: TESTED   Owner: Sxr1n
Depends on: F-06 (`lib/summary.ts`, `parsePeriod`). Design references: `docs/system-sds.md` §2.4 (INCOME/EXPENSE totals are summed from lines, not stored), §4.3; decision D-16 (this is the Sprint 3 workflow in `v0.3.0-rc1` for D2)

## 1 Behavior & workflow
**Happy path**
1. Alice opens Reports. The Category spending section shows the current Bangkok month by default.
2. Each EXPENSE account with spending in the period gets one row: name, total and percentage of all expenses. For example, Dining ฿700.00 (58.3%) and Groceries ฿500.00 (41.7%), with a total of ฿1,200.00.
3. She changes From/To to another range and clicks Show. The table recalculates for that range.

**Rules visible to the user**
- Only EXPENSE lines of POSTED transactions count (BR-06). A card repayment, a transfer, a loan, an opening balance or a VOID transaction never appears.
- Archived EXPENSE accounts still appear when they have spending in the period (F-07: archived accounts stay in reports).
- Rows are sorted by total (largest first), then by name. Accounts with ฿0.00 in the period are not listed.
- Percentages are rounded to one decimal place for display, so they may add up to 99.9% or 100.1%. The money totals are exact integers.

**Failure and boundary cases**
- No expenses in the period → empty list and total 0; the UI shows "No spending in this period".
- Invalid date, or `from` after `to` → 422 (same validator as `GET /api/summary`).
- Both bounds are inclusive.

## 2 Business rules & validation
| Rule | Check | Error |
|---|---|---|
| period | `from`/`to` optional `YYYY-MM-DD`; a missing bound defaults to the current Bangkok month; `from ≤ to` (`parsePeriod`, F-06) | 422 `VALIDATION_FAILED` (`details.from` / `details.to`) |
| BR-06 | sum `transaction_lines.amount` where the line account type = EXPENSE and the transaction is POSTED, own user, `txn_date` in [from, to] (reuse `periodTotalsByAccount`) | — |
| percent | `percent = round(total × 1000 / expenseTotal) / 10`; integer math on satang, one decimal place; omitted (`null`) when `expenseTotal` = 0 | — |
| BR-11 | only the session user's accounts and transactions | — |

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `GET /api/reports/categories` | ✔ own data | 403 | 401 |

`/api/reports` is added to the financial router mount in `app.ts` (`requireAuth, requireRole('USER')`), the same way as `/api/summary`.

## 4 UI
- **Reports** (`/reports`, new nav link "Reports" for USER):
  - Section "Category spending" with From / To date inputs (defaulting to the current month) and a Show button.
  - Table: Category, Amount, Share, with a footer "Total spending ฿x". Each Share cell has a simple bar whose width is the percentage.
- Loading: spinner. Empty: "No spending in this period". 422: field messages under From/To, with values kept.
- F-16 adds a second section to the same page.

## 5 API
**`GET /api/reports/categories?from=2026-11-01&to=2026-11-30`** (USER) → 200
```json
{ "from": "2026-11-01", "to": "2026-11-30", "total": 120000,
  "items": [ { "accountId": 14, "name": "Dining", "archived": false, "total": 70000, "percent": 58.3 },
             { "accountId": 15, "name": "Groceries", "archived": false, "total": 50000, "percent": 41.7 } ] }
```
Errors: 422 `VALIDATION_FAILED`, 401, 403.

## 6 Data
No schema change.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F15-01 | Given alice's card purchase in November with Dining 70000 + Groceries 50000, `GET /api/reports/categories?from=2026-11-01&to=2026-11-30` returns total 120000 and items Dining 70000 (58.3) then Groceries 50000 (41.7). |
| AC-F15-02 | In the same period alice also records a card repayment from Bank, a Salary receipt and a VOID payment with a Telecom line; the category items and total are unchanged, and Telecom is not listed (BR-06). |
| AC-F15-03 | Lines dated 2026-10-31 and 2026-12-01 are excluded and lines dated 2026-11-01 and 2026-11-30 are included; an archived EXPENSE account with spending in the period is listed with `archived: true`; with no expenses the response is total 0 and an empty list. |
| AC-F15-04 | `from=2026-11-30&to=2026-11-01` or `from=2026-13-01` → 422 `VALIDATION_FAILED` naming the parameter. |
| AC-F15-05 | Without a session → 401; as admin → 403; bob's spending never appears in alice's result. |
| AC-F15-06 | In the browser, alice opens Reports and sees her category rows with amounts and percentages for the current month; choosing a range with no spending shows "No spending in this period". |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F15-01 | AC-F15-01 | unit + API-DB (TDD) | Unit: percent function; alice card purchase (lines inserted for 2026-11) | Unit: percent(70000, 120000), percent(1, 3), percent(x, 0); API request | 58.3, 33.3, null; response as stated, order by total desc |
| TEST-F15-02 | AC-F15-02 | API-DB (TDD) | plus repayment, salary, VOID Telecom payment | Request | Same items and total; no Telecom |
| TEST-F15-03 | AC-F15-03 | API-DB | lines on the boundary dates; archived Transport with spending; empty user | Requests | Boundaries as stated; archived listed; empty result |
| TEST-F15-04 | AC-F15-04 | API-DB | — | Invalid requests | 422 with the named key |
| TEST-F15-05 | AC-F15-05 | API-DB | no cookie; admin; bob with spending | Requests | 401; 403; alice sees only her own |
| TEST-F15-06 | AC-F15-06 | E2E | alice with a payment recorded through the API in the test | Open Reports; set an empty range | Rows and percentages shown; empty message |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F15-01 | `server/tests/f15-categories.api.test.ts::TEST-F15-01`, `server/tests/f15-categories.unit.test.ts::TEST-F15-01` | PASS | 0e291ae |
| AC-F15-02 | `server/tests/f15-categories.api.test.ts::TEST-F15-02` | PASS | 0e291ae |
| AC-F15-03 | `server/tests/f15-categories.api.test.ts::TEST-F15-03` | PASS | 0e291ae |
| AC-F15-04 | `server/tests/f15-categories.api.test.ts::TEST-F15-04` | PASS | 0e291ae |
| AC-F15-05 | `server/tests/f15-categories.api.test.ts::TEST-F15-05` | PASS | 0e291ae |
| AC-F15-06 | `e2e/f15-reports.spec.ts::TEST-F15-06` | PASS | 0e291ae |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-25 | Initial contract. Chosen as the Sprint 3 workflow for `v0.3.0-rc1` (D-16). | D2-S5 |
| 0.2 | 2026-11-25 | Implemented; all AC PASS (red `7f2ea52`, green `0e291ae`, `evidence/d2/F15-*.txt`). Status → TESTED. No behaviour change from v0.1. | D2-S6 |
