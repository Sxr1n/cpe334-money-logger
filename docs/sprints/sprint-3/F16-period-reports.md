# F-16 Period reports — Sprint 3
Linked: FR-27, BR-06, BR-11, BR-12, NFR-01, NFR-02   Status: TESTED   Owner: Sxr1n
Depends on: F-06 (`summarize`), F-15 (Reports page and `/api/reports` mount). Design references: `docs/system-sds.md` §2.4, §4.3; decision D-14

## 1 Behavior & workflow
**Happy path**
1. On Reports, the section "Monthly report" shows the last 6 Bangkok months up to the current month by default (for example Jun–Nov 2026).
2. Each month gets one row with Income, Expense and Net (income − expense), followed by a total row for the whole range. Months with no transactions show ฿0.00 and are still listed, so the timeline has no gaps.
3. Alice picks From month 2026-01 and To month 2026-11 and clicks Show. The table shows 11 rows.

**Decision D-14:** at most 12 months per request; the default is the last 6 months up to the current Bangkok month.

**Failure and boundary cases**
- 12 months (for example 2025-12 … 2026-11) → accepted. 13 months → 422.
- `fromMonth` after `toMonth`, or an invalid `YYYY-MM` such as 2026-13 → 422.
- Future months are allowed and show 0 (dates are never in the future, BR-09).
- Month boundaries follow Asia/Bangkok calendar dates (A-02). A transaction dated 2026-10-31 belongs to October and one dated 2026-11-01 to November.

## 2 Business rules & validation
| Rule | Check | Error |
|---|---|---|
| format | `fromMonth`, `toMonth` optional `YYYY-MM` with month 01–12; a missing `toMonth` defaults to the current Bangkok month, a missing `fromMonth` to 5 months before `toMonth` | 422 `VALIDATION_FAILED` (`details.fromMonth` / `details.toMonth`) |
| D-14 | `fromMonth ≤ toMonth` and the range covers ≤ 12 months | 422 (`details.fromMonth` = "Must not be after toMonth" / "At most 12 months") |
| BR-06 | each month = `summarize(userId, {first day, last day})`: only INCOME/EXPENSE lines of POSTED transactions | — |
| BR-11 | own data only | — |

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `GET /api/reports/monthly` | ✔ own data | 403 | 401 |

## 4 UI
- **Reports** (`/reports`), section "Monthly report": From month / To month (`<input type="month">`) and a Show button.
  - Table: Month ("Nov 2026"), Income, Expense, Net, plus a total row. A negative Net is shown in red with a minus sign.
- Loading: spinner. 422: field messages, with values kept.

## 5 API
**`GET /api/reports/monthly?fromMonth=2026-10&toMonth=2026-11`** (USER) → 200
```json
{ "fromMonth": "2026-10", "toMonth": "2026-11",
  "items": [ { "month": "2026-10", "income": 0, "expense": 0, "net": 0 },
             { "month": "2026-11", "income": 3000000, "expense": 120000, "net": 2880000 } ],
  "total": { "income": 3000000, "expense": 120000, "net": 2880000 } }
```
Errors: 422 `VALIDATION_FAILED`, 401, 403.

## 6 Data
No schema change. At most 12 `summarize` calls per request.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F16-01 | Given a Salary receipt 3000000 on 2026-11-05 and a card purchase 120000 on 2026-11-06, `fromMonth=2026-10&toMonth=2026-11` returns October 0/0/0 and November income 3000000, expense 120000, net 2880000, with the same total row. |
| AC-F16-02 | A card repayment, a transfer, an opening balance and a VOID transaction in November do not change November's figures (BR-06). |
| AC-F16-03 | A transaction dated 2026-10-31 counts in October and one dated 2026-11-01 counts in November. |
| AC-F16-04 | `fromMonth=2025-12&toMonth=2026-11` (12 months) → 200 with 12 items; `fromMonth=2025-11&toMonth=2026-11` (13) → 422; `fromMonth=2026-11&toMonth=2026-10` → 422; `fromMonth=2026-13` → 422. Without parameters → 6 items ending at the current Bangkok month. |
| AC-F16-05 | Without a session → 401; as admin → 403; bob's transactions never change alice's figures. |
| AC-F16-06 | In the browser, alice opens Reports and sees the default 6-month table with the current month's income and expense; choosing 13 months shows the "At most 12 months" message and keeps the inputs. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F16-01 | AC-F16-01 | API-DB (TDD) | rows inserted as stated | Request | Items and total as stated |
| TEST-F16-02 | AC-F16-02 | API-DB (TDD) | plus repayment, transfer, opening balance, VOID | Request | November unchanged |
| TEST-F16-03 | AC-F16-03 | API-DB | boundary dates | Request | Month assignment as stated |
| TEST-F16-04 | AC-F16-04 | unit + API-DB | Unit: month-range parser with a fixed "now"; API requests | Parse and request each case | 12 → ok, 13 → error, reversed → error, bad month → error; default 6 months |
| TEST-F16-05 | AC-F16-05 | API-DB | no cookie; admin; bob with data | Requests | 401; 403; alice unaffected |
| TEST-F16-06 | AC-F16-06 | E2E | alice with a receipt recorded through the API in the test | Open Reports; set a 13-month range | Default table; error message, inputs kept |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F16-01 | `server/tests/f16-monthly.api.test.ts::TEST-F16-01` | PASS | c5d7c81 |
| AC-F16-02 | `server/tests/f16-monthly.api.test.ts::TEST-F16-02` | PASS | c5d7c81 |
| AC-F16-03 | `server/tests/f16-monthly.api.test.ts::TEST-F16-03` | PASS | c5d7c81 |
| AC-F16-04 | `server/tests/f16-monthly.api.test.ts::TEST-F16-04`, `server/tests/f16-monthly.unit.test.ts::TEST-F16-04` | PASS | c5d7c81 |
| AC-F16-05 | `server/tests/f16-monthly.api.test.ts::TEST-F16-05` | PASS | c5d7c81 |
| AC-F16-06 | `e2e/f16-monthly.spec.ts::TEST-F16-06` | PASS | c5d7c81 |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-25 | Initial contract (D-14: at most 12 months, default last 6). | D2-S5 |
| 0.2 | 2026-11-26 | Implemented; all AC PASS (red `a82b171`, green `c5d7c81`, `evidence/d2/F16-*.txt`). Status → TESTED. No behaviour change from v0.1. | D2-S7 |
