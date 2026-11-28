# Lab 6 Part B — our independent UAT of the partner team's Sprint 1

We are the **UAT Team** here. Fill this file while testing; never copy the partner's expected result into "Actual".

## 1 Partner and release under test
| Item | Value |
|---|---|
| Product Team | วอดส์ (TH-018_P9) — {{PARTNER_A}}, {{PARTNER_B}} (names and IDs filled at PDF build time, not committed) · GitHub ⟨TODO⟩ |
| Their repository | ⟨URL⟩ |
| Sprint 1 release tag / commit | ⟨tag⟩ / ⟨full SHA⟩ |
| Deployed URL and revision | ⟨URL⟩ · ⟨how the running version was read, e.g. /api/health or footer⟩ |
| Their UAT case document | ⟨link / version⟩ |
| Accounts received (labels and roles only, no passwords) | ⟨label — role⟩ |
| Testers (both must take part) | Sxr1n (นายศารินทร์ ไชยารัตน์), Leviathan-c137 (นายตันติยวัตร จันทร์ศิริ) |
| Sessions | initial ⟨date time⟩ · re-test ⟨date time⟩ |

Before starting: read the running version and write it in every row. If the version changes during the session, stop and ask the Product Team.

## 2 Execution record (one row per case; add rows for every case they supplied)
| Case | Category | Tester | Date/time (Bangkok) | Version | Inputs used | Actual result (what we saw) | Result | Evidence |
|---|---|---|---|---|---|---|---|---|
| ⟨ID⟩ | normal journey | | | | | | PASS / FAIL / BLOCKED (reason) | E-B-01 |
| ⟨ID⟩ | business rule / boundary | | | | | | | E-B-02 |
| ⟨ID⟩ | forbidden role / ownership | | | | | | | E-B-03 |
| ⟨ID⟩ | state / history / persistence | | | | | | | E-B-04 |

Rules: BLOCKED is not a pass — write the reason (e.g. login fails, URL down). For a rejected operation, also check and record that the protected data was not changed or shown.

## 2b Coverage review of their cases (instructor clarification, Lab 6)
We do not only run their cases: we check whether they cover the important Sprint 1 requirements and acceptance criteria, and add our own cases where they do not. Test beyond the script: boundaries, invalid inputs, access restrictions, unusual user actions (back button, double submit, two tabs, expired session).

| Their Sprint 1 requirement / AC | Covered by their case? | Gap | Extra case we ran (ID) | Result |
|---|---|---|---|---|
| | | | X-01 | |

## 3 Evidence log
| Evidence ID | Case / step | Action | Expected | Actual | Time | Version | File |
|---|---|---|---|---|---|---|---|
| E-B-01 | | | | | | | `submission/lab6/img/E-B-01.png` |

Screenshot rules: browser address bar and time visible; crop to the part that matters; blur any password.

## 4 Outgoing defect reports (one per actual failure, sent to the Product Team)
| Field | Value |
|---|---|
| Issue ID / link | ⟨their Issue or shared sheet row⟩ |
| Product owner / team | |
| Reporter | |
| Tested version | |
| Linked case / requirement | |
| Preconditions / data | |
| Steps to reproduce | 1. … |
| Expected | (from their case or Sprint 1 contract) |
| Actual | |
| Severity and user impact | Critical / Major / Minor — why |
| Evidence | E-B-.. |
| Sent (how, when) and their response | |

Defect vs. feature request: a defect contradicts their Sprint 1 case or contract; anything outside their Sprint 1 scope is a feature request and must be labelled as such.

## 5 Re-test and acceptance decision (filled after their fix)
| Defect | Fixed version | Re-test tester | Date/time | Actual | Result | Evidence |
|---|---|---|---|---|---|---|

**Final Sprint 1 decision for ⟨team⟩, release ⟨SHA⟩:** Accepted / Accepted with minor limitations (list them) / Not Accepted (reasons) — decided by ⟨both testers⟩ on ⟨date⟩.
