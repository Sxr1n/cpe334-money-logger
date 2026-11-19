# Sprint 1 UAT cases and handoff — Money Logger (Lab 6, Part A)

| Item | Value |
|---|---|
| Product Team | Sxr1n (นายศารินทร์ ไชยารัตน์), Leviathan-c137 (นายตันติยวัตร จันทร์ศิริ) |
| UAT Team | `<partner team name, students>` |
| Product | Personal Money and Expense Logging System (Theme 7) |
| Sprint 1 baseline | tag `v0.1.0-sprint1`, commit `e1747cb` (application code) |
| Deployed release under test | `<main commit SHA>` — application code identical to `v0.1.0-sprint1` (`git diff v0.1.0-sprint1 <SHA> -- server client Dockerfile` is empty; the release only adds Lab 5 deployment files) |
| URL | `<Cloud Run URL>` · running version: open `<URL>/api/health` → `version` must equal the SHA above |
| Accepted-for-test scope | F-01 Authentication and session, F-02 Administrator user access, F-03 Opening balance, F-04 Receive money, F-05 Make a payment or record a charge, F-06 Overview, summary and history (contracts in `docs/sprints/sprint-1/`) |
| Not in scope | Sprint 2–3 features (account management, transfers, loans given, corrections, search, favourites, reports). Their absence is not a defect |

## 1 Accounts (credentials are sent privately, never in this document)
| Label | Role | Used in |
|---|---|---|
| `alice` | USER | UAT-01, UAT-02, UAT-03, UAT-04 |
| `bob` | USER | UAT-03, UAT-05 |
| `admin` | ADMIN | UAT-03, UAT-05 |

Each USER starts with seven synthetic accounts and no money: Bank (Cash), Credit Card (Loan taken), Salary (Income), Dining, Groceries, Electricity, Telecom (Expense).

## 2 Data setup, sequence and cleanup
- The Product Team does not use `alice` or `bob` on the deployed release before the UAT session, so both start with ฿0.00 everywhere. Before starting, check on Overview that `alice` shows Cash ฿0.00. If not, stop and tell the Product Team (do not continue with other values).
- **Run the cases in order UAT-01 → UAT-05.** UAT-02 and UAT-04 use the balances left by UAT-01. UAT-03 and UAT-05 do not depend on alice's balances.
- An opening balance can be set only once per account (BR-11), and Sprint 1 has no edit or delete, so the data cannot be reset from the UI. For a re-test the Product Team tells you the expected starting values, or asks the TA to reset the database. Data is synthetic; nothing needs to be cleaned up.
- Dates: "today" means today's date in Thailand (Asia/Bangkok). Amounts are typed in baht with two decimals.
- After a failure, write down the URL, what you typed, what the screen showed, and take a screenshot. Do not retry with different values before recording it.

## 3 Cases

### UAT-01 — Normal journey: opening balance, salary, card purchase, card repayment (normal domain journey)
- **References:** FR-06, FR-07, FR-11, FR-12, FR-13, FR-18, FR-24, FR-25; BR-01, BR-05, BR-06, BR-10; AC-F03-01, AC-F04-01, AC-F05-01, AC-F05-02, AC-F06-02, AC-F06-03, AC-F06-07
- **Purpose:** money moves correctly through Cash, Income, Expense and Loan-taken accounts, and only salary and spending count as income and expense.
- **Role / precondition:** `alice` (USER), all balances ฿0.00 (section 2).

| # | Action | Expected result |
|---|---|---|
| 1 | Open the URL, log in as `alice` | Overview page; navigation shows "Alice Example"; Cash ฿0.00 |
| 2 | Accounts → Bank → **Set opening balance**: amount `5000.00`, date = the 1st of the current month → Save | Bank balance ฿5,000.00; Bank shows "Opening ฿5,000.00 on …" and no longer has a Set opening balance button (once per account, BR-10) |
| 3 | Receive money: account Bank, date today, total `30000.00`, one line Salary `30000.00` → Save | "Saved" message. Bank = 5,000.00 + 30,000.00 = **฿35,000.00** |
| 4 | Make a payment: from Credit Card, date today, total `1200.00`, lines Spending → Dining `700.00` and Spending → Groceries `500.00` → Save | "Saved". Credit Card debt = 0 + 1,200.00 = **฿1,200.00**; Bank unchanged ฿35,000.00 |
| 5 | Make a payment: from Bank, date today, total `1200.00`, one line Repay a debt → Credit Card `1200.00` → Save | "Saved". Bank = 35,000.00 − 1,200.00 = **฿33,800.00**; Credit Card debt = 1,200.00 − 1,200.00 = **฿0.00** |
| 6 | Open Overview | Cash ฿33,800.00; card debt ฿0.00; this month: Income **฿30,000.00**, Expense **฿1,200.00** (700 + 500), Net **฿28,800.00**. The opening balance (5,000) and the card repayment (1,200) are **not** counted as income or expense |
| 7 | Open History | Exactly 3 rows, newest first: the Bank payment ฿1,200.00, the card payment ฿1,200.00, the salary receipt ฿30,000.00 (the opening balance is not a transaction) |

### UAT-02 — Business rules and boundaries (business-rule / boundary case)
- **References:** FR-11, FR-12, FR-13; BR-01, BR-05, BR-07, BR-08; AC-F04-07, AC-F05-05, AC-F05-06, AC-F05-08
- **Purpose:** invalid money movements are refused and change nothing.
- **Role / precondition:** `alice` after UAT-01 (Bank ฿33,800.00, Credit Card debt ฿0.00).

| # | Action | Expected result |
|---|---|---|
| 1 | Receive money: Bank, today, total `1000.00`, one Salary line `900.00` | Message "Lines must add up to the total"; Save is disabled |
| 2 | Make a payment: from Bank, today, total `33800.01`, line Dining `33800.01` → Save | Rejected with an error message at the form (not enough money in Bank); typed values stay in the form |
| 3 | Make a payment: from Bank, today, total `0.01`, line Repay a debt → Credit Card `0.01` → Save | Rejected with an error message (repayment larger than the debt ฿0.00) |
| 4 | Open Overview and History | Still Cash ฿33,800.00, card debt ฿0.00, Income ฿30,000.00, Expense ฿1,200.00, and still 3 history rows — nothing from steps 1–3 was saved |

### UAT-03 — Other users' records and Administrator denial (forbidden role / ownership case)
- **References:** FR-04; BR-11, BR-12; NFR-01, NFR-02; AC-F03-05, AC-F04-05, AC-F06-06, AC-F02-04, AC-F02-05
- **Purpose:** a user sees only their own money; the Administrator cannot see anyone's financial data; a user cannot use admin functions.
- **Role / precondition:** `bob`, `alice`, `admin`. Use a private/incognito window, or log out between users.

| # | Action | Expected result |
|---|---|---|
| 1 | Log in as `bob`. Receive money: Bank, today, total `100.00`, line Salary `100.00` → Save. Open History → open that row. **Write down the address**, e.g. `<URL>/transactions/42`. Log out | Bob's Bank ฿100.00; the detail page shows Salary ฿100.00 |
| 2 | Log in as `alice`. Open the address from step 1 | "Not found." — no amount, account or note of bob is shown |
| 3 | As `alice`, open History and Accounts | No ฿100.00 receipt; only alice's seven accounts with her balances (Bank ฿33,800.00 if UAT-01 ran) |
| 4 | As `alice`, open `<URL>/admin/users` | "Not allowed." — no user list |
| 5 | Log out. Log in as `admin` | Users page listing alice, bob, admin with role and status. No balances or transactions anywhere |
| 6 | As `admin`, open `<URL>/overview` | "Not allowed." |
| 7 | As `admin`, type each address in the browser bar: `<URL>/api/overview`, `<URL>/api/accounts`, `<URL>/api/transactions` | Each shows `{"error":{"code":"FORBIDDEN","message":"You do not have access to this resource."}}` and nothing else — no balances, accounts or transactions |
| 8 | Log out, then type `<URL>/api/accounts` | `{"error":{"code":"UNAUTHENTICATED", ...}}` — no data without login |

### UAT-04 — History, state and persistence (state / history / persistence case)
- **References:** FR-02, FR-18, FR-24, FR-25; NFR-04; AC-F01-04, AC-F01-08, AC-F06-05, AC-F06-07
- **Purpose:** saved money and history stay correct across reloads, logout/login and redeployment; a logged-out session cannot be reused.
- **Role / precondition:** `alice` after UAT-01 and UAT-02.

| # | Action | Expected result |
|---|---|---|
| 1 | Open Overview and press the browser reload button | Same values as UAT-01 step 6 (Cash ฿33,800.00, Income ฿30,000.00, Expense ฿1,200.00, Net ฿28,800.00) |
| 2 | History → open the card payment of ฿1,200.00 | Detail shows from Credit Card, total ฿1,200.00, lines Dining ฿700.00 and Groceries ฿500.00 |
| 3 | Log out. Press the browser Back button or open `<URL>/overview` | Login page; no balances are shown |
| 4 | Log in as `alice` again | Same Overview values and the same 3 history rows |
| 5 | On a later day, or after the Product Team announces a redeployment, log in as `alice` and repeat step 1 | Same values (data survives a redeploy). Record the version from `<URL>/api/health` |

### UAT-05 — Administrator disables and re-enables a user (role case, F-02)
- **References:** FR-01, FR-05; BR-13; AC-F01-02, AC-F01-03, AC-F02-02, AC-F02-03
- **Purpose:** a disabled user is locked out at once, including an already open session, and can log in again after being enabled.
- **Role / precondition:** two browsers or one normal and one incognito window: window A `bob`, window B `admin`.

| # | Action | Expected result |
|---|---|---|
| 1 | Window A: log in as `bob`, stay on Overview | Bob's Overview |
| 2 | Window B: log in as `admin` → Users → **Disable** on bob | bob's status becomes DISABLED |
| 3 | Window A: reload the page | Bob is sent to the Login page (old session no longer works) |
| 4 | Window A: log in as `bob` with his correct password | "Invalid username or password." — the same message as step 5 |
| 5 | Window A: log in as `bob` with password `wrong-password` | "Invalid username or password." |
| 6 | Window B: **Enable** bob. Window A: log in as `bob` | bob logs in; his Bank still shows ฿100.00 from UAT-03 |
| 7 | Window B: look at the Users page row of `admin` | No Disable button on the admin's own row (an administrator cannot disable their own account, BR-13); admin stays ACTIVE |

## 4 Result record (filled in by the UAT Team)
| Case | Tester (name, team) | Date/time | Version (`/api/health`) | Actual result (what you saw) | PASS / FAIL / BLOCKED | Evidence ID |
|---|---|---|---|---|---|---|
| UAT-01 | | | | | | |
| UAT-02 | | | | | | |
| UAT-03 | | | | | | |
| UAT-04 | | | | | | |
| UAT-05 | | | | | | |

Report every finding as a GitHub Issue in this repository (label `uat`) or in the shared handoff sheet, with: case/step, version, what you typed, expected, actual, screenshot.

## 5 Revision history
| Ver | Date | Change | Reason |
|---|---|---|---|
| 0.1 | 2026-11-20 | Initial UAT cases UAT-01–UAT-05 and handoff | Lab 6 Part A |
