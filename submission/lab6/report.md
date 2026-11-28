# CPE334 Lab 6 — Independent user acceptance testing and defect management

<!-- Build: STUDENT_IDS="<id A>,<id B>" PARTNER_STUDENTS="<name A> <id A>;<name B> <id B>" python submission/build_report.py submission/lab6/report.md submission/lab6/lab6.pdf
     Replace every ⟨TODO⟩ with real evidence. Fill the page column of the contents table after the first build. -->

| Item | Value |
|---|---|
| Students | นายศารินทร์ ไชยารัตน์ — {{ID_A}} — `Sxr1n` · นายตันติยวัตร จันทร์ศิริ — {{ID_B}} — `Leviathan-c137` |
| Theme | 7 — Personal Money and Expense Logging System (Money Logger) |
| Sprint 1 scope | F-01 Authentication and session, F-02 Administrator user access, F-03 Opening balance, F-04 Receive money, F-05 Make a payment or record a charge, F-06 Overview, summary and history |
| Repository | https://github.com/Sxr1n/cpe334-money-logger |
| Tested release | baseline `v0.1.0-sprint1` (`e1747cb`); deployed `v0.3.0-rc1` (`a56ebe5`) — a later main release with the approved changes D-10, CHG-01, DEF-01 (UAT cases v0.6) |
| Deployed URL / version | https://s87ce2df5-4d7hbszvwq-as.a.run.app — `/api/health` version `a56ebe5…`, Cloud Run revision `s87ce2df5-00007-lk8` |
| Partner team (both roles) | วอดส์ (TH-018_P9) — {{PARTNER_A}}, {{PARTNER_B}} |
| Independent UAT testers of our product | ⟨TODO: names⟩ |
| **Final UAT decision on our Sprint 1** | ⟨TODO: Accepted / Accepted with minor limitations / Not Accepted — by whom, date, version⟩ |

## Contents
| Part | Title | Pages | Evidence IDs |
|---|---|---|---|
| A | UAT preparation and handoff (our product) | ⟨⟩ | UAT-01–UAT-05 |
| B | Independent execution (partner's product) | ⟨⟩ | E-B-.. |
| C | Defect reporting and triage | ⟨⟩ | DEF-.., outgoing reports |
| D | Resolution and independent retest | ⟨⟩ | DEF-.. red/green, PR, deploy, re-test |

## Version table
| Role | Version | Note |
|---|---|---|
| Sprint 1 baseline | `v0.1.0-sprint1` / `e1747cb` | Deliverable 1 release |
| Deployed for UAT | `v0.3.0-rc1` / `a56ebe5`, revision `s87ce2df5-00007-lk8` | Sprint 1 + approved changes + Sprint 2–3 (out of UAT scope); see UAT cases v0.4 header |
| Defective commit(s) | ⟨TODO or none⟩ | |
| Regression test (red) | ⟨TODO⟩ | |
| Fix (green), release to main | ⟨TODO⟩ | merge commits explained |
| Deployed corrected revision | ⟨TODO⟩ | smoke test run ⟨link⟩ |

# Part A — UAT preparation and handoff (we are the Product Team)

Credentials were sent privately to the UAT Team through ⟨TODO: channel⟩ on ⟨date⟩; this PDF names only account labels and roles.

<!-- include: docs/uat/sprint-1-uat-cases.md -->

# Part B — Independent execution (we are the UAT Team)

<!-- include: docs/uat/partner-uat-execution.md -->

# Part C — Defect reporting and triage

### Findings received about our product
⟨TODO: copy of the DEF rows from docs/changes.md, or "No findings received" with the UAT Team's confirmation⟩

### Outgoing reports
See Part B §4.

# Part D — Resolution and independent retest

⟨TODO for each accepted defect (or the TA-approved controlled exercise, §3.5):
- Issue → `fix/DEFnn-…` branch from staging
- regression test excerpt, command, RED output (commit) → GREEN output (commit) + full suite counts
- code diff excerpt
- PR review text (teammate), CI run, release PR to main, Deploy demo run, deployed revision, smoke check
- UAT Team re-test: tester, version, actual, evidence⟩

### Independent Sprint 1 acceptance record (written by the UAT Team)
| Field | Value |
|---|---|
| Decision | ⟨⟩ |
| Release tested | ⟨⟩ |
| Testers | ⟨⟩ |
| Date | ⟨⟩ |
| Conditions / accepted minor limitations | ⟨⟩ |
| Evidence | ⟨⟩ |

## Contributions
| Task | Sxr1n | Leviathan-c137 |
|---|---|---|
| UAT cases and handoff | drafted cases (with Claude), local rehearsal | review of expected values ⟨TODO⟩ |
| Testing the partner | ⟨⟩ | ⟨⟩ |
| Triage / fixes | ⟨⟩ | ⟨⟩ |

## AI use
Claude Code helped with the following:
- drafted the UAT cases from the Sprint 1 contracts
- rehearsed them on a local build with a temporary Playwright script, which is not UAT evidence
- prepared the recording templates and this report

The team reviewed every expected value. All partner test results are entered by the testers themselves.

## Known limitations
⟨TODO⟩
