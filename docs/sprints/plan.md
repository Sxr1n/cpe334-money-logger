# Three-Sprint Plan — Personal Money and Expense Logging System

| Item | Value |
|---|---|
| Sources | `docs/srs.md` v0.2, `docs/features.md` v0.1, `docs/traceability.md` v0.1 |
| Document version | 0.3 |

## 1. Overview

| Sprint | Window | Checkpoint | Goal | Features | Release tag |
|---|---|---|---|---|---|
| 1 | to 15 Nov | Deliverable 1 (15 Nov) | Small working ledger slice with authentication, two roles, backend permissions and persistence | F-01–F-06 | `v0.1.0-sprint1` |
| 2 | 16–29 Nov | Deliverable 2 (29 Nov) | Complete the core ledger: all account types, every line type of both forms, corrections and search | F-07–F-12 | `v0.2.0-sprint2` |
| 3 | 23 Nov–13 Dec | D2 progress (29 Nov) → Final (13 Dec) | Remaining user features, reports, performance and product hardening | F-13–F-16 | `v0.3.0-rc1` (29 Nov), `v1.0.0` (13 Dec) |

Sprint 3 starts before Sprint 2 ends because Deliverable 2 requires at least one working Sprint 3 workflow and an RC on GCP by 29 Nov, and 1–11 Dec is the exam period. Lab 5–7 work (Docker, CI/CD, GCP, UAT, maintenance) runs in parallel on the Sprint 1/2 releases.

## 2. Sprint 1 — Working ledger slice (Deliverable 1)

**Goal.** A seeded user can log in and complete the Theme 7 Sprint 1 scenario end to end (UI → API → PostgreSQL): set an opening Bank balance, receive salary into Bank, charge a card purchase split into Dining and Groceries, repay the card from Bank, and see the resulting Bank balance, card debt, income/expense summary and history. An administrator can list, disable and re-enable users but is refused every financial endpoint.

**Features**
| F-ID | Name | Depends on |
|---|---|---|
| F-01 | Authentication and session | — |
| F-02 | Administrator user access | F-01 |
| F-03 | Opening balance | F-01 |
| F-04 | Receive money (establishes the shared transaction engine) | F-01, F-03 |
| F-05 | Make a payment or record a charge (incl. card repayment) | F-04 |
| F-06 | Overview, summary and history | F-03, F-04, F-05 |

Also established: SR-01 access control, SR-02 ledger integrity (integer satang, atomic posting), SR-03 reproducible setup (README, migrate, seed).

**Seed data (synthetic).** At least two users and one administrator. Each user has a Bank account (CASH), a Credit Card (LOAN_TAKEN), Salary (INCOME), and Dining, Groceries, Electricity and Telecom (EXPENSE).

**Rules built with TDD** (failing test kept in `evidence/d1/` before implementation)
- Line sum ≠ total → rejected (BR-01; AC-F04-02).
- Account type must fit the form, e.g. RECEIPT into a credit card is rejected (BR-03; AC-F04-03).
- Card repayment and opening balance are not counted as expense/income (BR-06; AC-F05-02, AC-F03-02, AC-F06-03).
- CASH cannot go negative (BR-07; AC-F05-05).

**Access tests.** No session → 401; user A requests user B's record → 404; administrator calls a financial endpoint → 403; user calls an admin endpoint → 403.

**Completion outcome.** `v0.1.0-sprint1` merged to `main` through reviewed feature PRs into `staging/sprint-1`; every Sprint 1 AC has an executed test with its result and commit in `docs/traceability.md` §2; README lets a fresh clone migrate, seed and run.

### 2.1 Why Sprint 1 has this scope
- **It is the course minimum, no less.** It covers every step of the Theme 7 Sprint 1 example and the required identity/access cases (specs §6.7, D1 §2): real login/logout/current user, two roles, a domain transaction with allocation lines, a tested business rule and backend enforcement.
- **It builds the parts everything else depends on.** The transaction engine (line validation, form/type rules, atomic balance posting) and the access-control layer are reused by every later feature. Getting them right and tested first lowers the risk of Sprints 2–3.
- **It leaves out what the scenario does not need.** Accounts are seeded (D-09), so account creation/archiving (F-07) moves to Sprint 2. Transfers, loans, corrections, search, favourites, duplicate and reports are not in the example and would double the size of the slice without adding a new engineering risk.
- **It fits the time.** Sprint 1 ends on 15 Nov and must also produce Parts A–E of the documentation. Six small features (40 planned AC, most of them API-DB tests) keep the slice reviewable by two students in that time.

## 3. Sprint 2 — Core ledger complete (Deliverable 2)

**Goal.** Users manage their own accounts of all five types and record every money movement the brief describes, including transfers, lending, borrowing and repayments, mixed in one transaction. They can correct mistakes with edit or void and search their history. Balances stay exact under a 1,000-transaction check.

**Features**
| F-ID | Name | Depends on |
|---|---|---|
| F-07 | Account management (create five types, rename, archive) | F-01, F-06 |
| F-08 | Opening balance management | F-03 |
| F-09 | Transfers between own cash accounts | F-04, F-05, F-07 |
| F-10 | Loans given and taken (incl. mixed lines) | F-04, F-05, F-07 |
| F-11 | Transaction corrections (edit, void) | F-04, F-05, F-06 |
| F-12 | Search and filter history | F-06 |

Also verified: NFR-05 1,000-transaction recomputation (SR-02); NFR-07 durability and NFR-09 secrets through the Lab 5 deployment and CI (SR-03).

**Before contracts:** resolve Q-03 (editing an opening balance after transactions exist) for F-08.

**Completion outcome.** `v0.2.0-sprint2` on `main` and deployed to GCP; all Sprint 2 AC tested with evidence; Sprint 1 regression still green.

## 4. Sprint 3 — Remaining features and hardening (Final)

**Goal.** Add the convenience and insight features (favourites, duplicate, category spending, period reports), meet the performance target, and harden the product for the final release.

**Features**
| F-ID | Name | Depends on |
|---|---|---|
| F-13 | Favourite transactions | F-06 |
| F-14 | Duplicate transaction | F-04, F-05, F-13 |
| F-15 | Category spending | F-06 |
| F-16 | Period reports | F-06 |

Also verified: NFR-08 responsiveness with 5,000 transactions (SR-04); full regression and UAT re-test.

**Order.** F-13 and F-15 are planned first. At least one of them must be working in `v0.3.0-rc1` on GCP by 29 Nov (Deliverable 2). F-14 and F-16 follow, and the product must be nearly complete by 29 Nov because of the 1–11 Dec exams.

**Completion outcome.** `v1.0.0` on `main` and GCP by 13 Dec; every FR/BR/NFR has a final result in `docs/traceability.md`; DoD review done; known limitations disclosed.

## 5. Cross-sprint dependencies and risks
| Risk / dependency | Impact | Mitigation |
|---|---|---|
| Transaction engine (F-04) is on the critical path for F-05, F-09, F-10, F-11, F-14 | A design flaw delays everything later | Write the balance-effect table (SRS §4.3) as a unit-tested pure function in Sprint 1 |
| TA rejects D-03 (Q-01) | BR-07 and AC-F05-05 change | Ask the TA before freezing F-05; handle the answer as a CHG |
| Lab 7 approved change lands in Sprint 2/3 | Unplanned scope | Keep Sprint 3 order flexible; record as CHG with impact analysis |
| Exam period 1–11 Dec | Little work possible before Final | Product nearly complete by 29 Nov; only regression, UAT re-test and video after |

## 6. Revision history
| Ver | Date | Change | Reason/CHG |
|---|---|---|---|
| 0.1 | 2026-11-07 | Initial three-sprint plan | D1-S2 baseline |
| 0.2 | 2026-11-07 | All checkpoint dates +7 days (D1 15 Nov, Lab 5 22 Nov, Lab 6 29 Nov, Lab 7 and D2 6 Dec, Final 20 Dec) per the instructor's LEB2 announcement; internal target for near-complete product stays before the 1–11 Dec exams (30 Nov) | Course schedule change |
| 0.3 | 2026-11-07 | Correction of v0.2 after checking LEB2: only D1 moved (8 → 15 Nov, same day as Lab 5); D2 29 Nov and Final 13 Dec unchanged; Sprint 2/3 windows restored | LEB2 schedule |
