# F-09 Transfers between own cash accounts — Sprint 2
Linked: FR-14, FR-17, BR-01, BR-03, BR-04, BR-05, BR-06, BR-07, BR-11, BR-12, NFR-01, NFR-02, NFR-06, NFR-10   Status: TESTED   Owner: Leviathan-c137
Depends on: F-04, F-05 (engine), F-07 (second CASH account). Design references: SRS §4.2–4.3, `docs/system-sds.md` §2.4, F-04 §2 and §5

## 1 Behavior & workflow
No new endpoint. F-09 extends the ledger core's allowed-lines table and balance effects with **CASH lines** on both forms (SRS §4.2).

**Happy path A — transfer out with a PAYMENT**
1. Alice has Bank ฿10,000.00 and Wallet ฿0.00. On Make a payment she picks Bank, total ฿3,000.00, and one line Wallet ฿3,000.00 from the group "Transfer to my cash account".
2. On save, Bank becomes ฿7,000.00 and Wallet ฿3,000.00. Income and expense are unchanged (BR-06).

**Happy path B — transfer in with a RECEIPT**
1. On Receive money she picks Wallet as the receiving account, total ฿2,000.00, and one line Bank ฿2,000.00 from the group "Transfer from my cash account".
2. Bank goes down ฿2,000.00 and Wallet goes up ฿2,000.00. Income is unchanged.

**Happy path C — card cash advance:** a PAYMENT from Credit Card (LOAN_TAKEN) with a Wallet line of ฿1,000.00. Card debt +฿1,000.00, Wallet +฿1,000.00, expense unchanged.

**Happy path D — mixed (FR-17):** a PAYMENT from Bank with lines Dining ฿500.00 + Wallet ฿1,000.00. Bank −฿1,500.00, Wallet +฿1,000.00, and only the ฿500.00 counts as expense.

**Failure and boundary cases**
- A PAYMENT from CASH larger than its balance → rejected (BR-07, unchanged). A RECEIPT whose CASH line is larger than that line account's balance → rejected (BR-07). Exactly equal → accepted, and the account becomes 0.
- A line equal to the primary (Bank → Bank) → rejected (BR-04, unchanged).
- Another user's CASH account → 404. An archived CASH account → 404 (F-07).

## 2 Business rules & validation
Validation order and all F-04/F-05 checks are unchanged. Changes in the ledger core:

| Rule | Change | Error |
|---|---|---|
| BR-03 | PAYMENT line types gain CASH; RECEIPT line types gain CASH | 422 `RULE_VIOLATION` for types still not allowed |
| BR-05 | PAYMENT: each CASH line `balance += amount`. RECEIPT: each CASH line `balance −= amount`. | — |
| BR-07 | RECEIPT: for each CASH line, `amount ≤ current balance` of that line account (locked row) | 422 `RULE_VIOLATION` (`details["lines[i].amount"]` = "Not enough money in Wallet (balance ฿x)") |
| BR-06 | CASH lines are neither INCOME nor EXPENSE, so F-06 sums ignore them. No summary code changes. | — |

Allowed-lines table after F-09. F-10 adds the LOAN rows; the full table is in SRS §4.2.
| Form | Primary | Line types |
|---|---|---|
| RECEIPT | CASH | INCOME, **CASH** |
| PAYMENT | CASH, LOAN_TAKEN | EXPENSE, LOAN_TAKEN, **CASH** |

Effects are applied with the existing locking and posting steps (accounts locked in ascending id order), so atomicity (NFR-06) is unchanged.

## 3 Permissions
| Operation | USER | ADMIN | No session |
|---|---|---|---|
| `POST /api/transactions` with a CASH line | ✔ own accounts only (other's → 404) | 403 | 401 |

## 4 UI
- **Make a payment** (`/pay`): the line account select gains a group "Transfer to my cash account" with own active CASH accounts and their balances. The paying account stays disabled as a line option.
- **Receive money** (`/receive`): the line account select gains a group "Transfer from my cash account" with own active CASH accounts and balances. The receiving account is disabled as a line option.
- Server BR-07 messages for a line are shown under that line's amount. Values are kept (NFR-10).
- History (F-06): no change. The Form column still says Paid / Received, and the detail lines show the CASH account and type.

## 5 API
`POST /api/transactions` as F-04 §5. Example transfer: `{ "form": "PAYMENT", "primaryAccountId": 11, "date": "2026-11-22", "total": 300000, "lines": [ { "accountId": 31, "amount": 300000 } ] }`

## 6 Data
No change.

## 7 Acceptance criteria
| AC | Criterion |
|---|---|
| AC-F09-01 | Given Bank 1000000 and Wallet 0, a PAYMENT from Bank with one Wallet line 300000 → 201, Bank 700000, Wallet 300000, and the month's income and expense are unchanged. |
| AC-F09-02 | Given Bank 700000 and Wallet 300000, a RECEIPT into Wallet with one Bank line 200000 → 201, Bank 500000, Wallet 500000, income and expense unchanged. |
| AC-F09-03 | Given Bank 500000, a RECEIPT into Wallet with a Bank line 500001 → 422 `RULE_VIOLATION` (`details["lines[0].amount"]`), nothing stored and both balances unchanged; with 500000 → 201 and Bank = 0. A PAYMENT transfer from Bank larger than its balance → 422. |
| AC-F09-04 | A PAYMENT from Bank with a Bank line → 422; with bob's Wallet as a line → 404 and bob's Wallet is unchanged; with an archived Wallet → 404. |
| AC-F09-05 | Given card debt 0 and Wallet 0, a PAYMENT from Credit Card with a Wallet line 100000 → 201, debt 100000, Wallet 100000, expense unchanged. |
| AC-F09-06 | A PAYMENT from Bank total 150000 with lines Dining 50000 + Wallet 100000 → 201, Bank −150000, Wallet +100000, and the month's expense increases by exactly 50000. |
| AC-F09-07 | In the browser, alice records a transfer Bank → Wallet on `/pay` using the "Transfer to my cash account" group; a success alert is shown, Overview lists both new balances, and This month's expense is unchanged. |

## 8 STS
| TEST ID | AC | Level | Precondition / Input | Action | Expected |
|---|---|---|---|---|---|
| TEST-F09-01 | AC-F09-01 | unit + API-DB (TDD) | Ledger core; Wallet created in setup | Unit: effects of (PAYMENT, CASH primary, CASH line); API post; read summary before/after | Unit deltas Bank −, Wallet +; 201; balances; summary unchanged |
| TEST-F09-02 | AC-F09-02 | unit + API-DB | as above | Unit: effects of (RECEIPT, CASH primary, CASH line); API post | Unit deltas Wallet +, Bank −; 201; balances; summary unchanged |
| TEST-F09-03 | AC-F09-03 | unit + API-DB (TDD) | Bank 500000 | Unit: BR-07 on a RECEIPT CASH line (500001 / 500000); API posts | Unit reject / accept; 422 with nothing stored, then 201 with Bank 0; PAYMENT overdraft 422 |
| TEST-F09-04 | AC-F09-04 | API-DB | bob's Wallet id; archived Wallet | Three posts | 422; 404 with bob unchanged; 404 |
| TEST-F09-05 | AC-F09-05 | API-DB | card debt 0, Wallet 0 | Post cash advance | 201; debt 100000; Wallet 100000; expense unchanged |
| TEST-F09-06 | AC-F09-06 | API-DB | Bank ≥ 150000 | Post mixed payment; read summary | 201; deltas; expense +50000 |
| TEST-F09-07 | AC-F09-07 | E2E | alice with Bank opening set and Wallet created | Fill `/pay` with a transfer line; save; open Overview | Success alert; Bank and Wallet balances; expense unchanged |

## 9 Done evidence
| AC | Test file::name | Result | Commit |
|---|---|---|---|
| AC-F09-01 | `server/tests/f09-transfers.unit.test.ts::TEST-F09-01`, `server/tests/f09-transfers.api.test.ts::TEST-F09-01` | PASS | c36a003 |
| AC-F09-02 | `server/tests/f09-transfers.unit.test.ts::TEST-F09-02`, `server/tests/f09-transfers.api.test.ts::TEST-F09-02` | PASS | c36a003 |
| AC-F09-03 | `server/tests/f09-transfers.unit.test.ts::TEST-F09-03`, `server/tests/f09-transfers.api.test.ts::TEST-F09-03` | PASS | c36a003 |
| AC-F09-04 | `server/tests/f09-transfers.api.test.ts::TEST-F09-04` | PASS | c36a003 |
| AC-F09-05 | `server/tests/f09-transfers.api.test.ts::TEST-F09-05` | PASS | c36a003 |
| AC-F09-06 | `server/tests/f09-transfers.api.test.ts::TEST-F09-06` | PASS | c36a003 |
| AC-F09-07 | `e2e/f09-transfers.spec.ts::TEST-F09-07` | PASS | c36a003 |

## 10 Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-22 | Initial contract. CASH lines on both forms; BR-07 also applies to RECEIPT CASH lines. | D2-S1 |
| 0.2 | 2026-11-26 | Implemented; all AC PASS (red `769742f`, green `c36a003`, `evidence/d2/F09-*.txt`). Status → TESTED. | D2-S6 |
