# Change and defect register

## Changes (CHG)
| ID | Date | Source | Change | Decision / approver | Status | Release | Re-test |
|---|---|---|---|---|---|---|---|
| CHG-01 | 2026-11-27 | Lab 7 maintenance change (team-chosen; instructor announcement: no TA approval needed) | Optional credit limit on LOAN_TAKEN accounts: FR-28, BR-18, revises D-04. Details: `docs/labs/lab07/change-request.md` | Approved by the team; contract PR #73 approved by Leviathan-c137 2026-11-27 before code; owner Sxr1n | RELEASED + DEPLOYED (red `f8a9b70`, green `1660d08`, AC-F05-09..16 PASS) | `v0.2.0-sprint2` (`76aaabc`), revision `s87ce2df5-00006-bbr` | Post-deploy 11/11 PASS (Sxr1n, 2026-11-27, `evidence/lab7/post-deploy-v0.2.0-sprint2.txt`) |

## Defects (DEF) — includes every finding received from Lab 6 UAT
| ID | Date | Source (reporter, case, version) | Finding | Classification | Reason (Sprint 1 contract / evidence) | Severity (user impact) | Owner | Fix (Issue → PR → release) | Re-test (tester, version, result) | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| DEF-01 | 2026-11-28 | Sxr1n, exploratory check on the live URL 2026-11-21, `0831d0b` | Receive money: after Save, the Receiving account select still shows the old balance (e.g. `Bank (฿0.00)`) until reload; stored balance is correct | accepted defect | F-04 §4 success state shows the stored result; `PayPage` reloads accounts after a save, `ReceiveMoneyPage` does not | minor (display only) | Sxr1n | Issue #81 → red `85d87d1`, fix `5fa7f24` (`evidence/d2/DEF01-red.txt`, `DEF01-green.txt`) → PR (to `staging/sprint-2`) → next release | Pending: UAT partner re-test on the deployed release | FIXED (not released) |

Classification: accepted defect · duplicate (link the original) · not-defect · enhancement (outside Sprint 1 scope). Critical and major accepted defects block Sprint 1 acceptance; minor ones are fixed or accepted by the UAT Team as known limitations. A failing requirement is never relabelled as an enhancement.
