# AI-use log
| Date | Session | Tool | What AI assisted | What we checked |
|---|---|---|---|---|
| 2026-11-07 | D1-S1 | Claude | Drafted SRS v0.1 from the Theme 7 brief | Pending: team review of FR/BR/NFR and decisions |
| 2026-11-07 | D1-S2 | Claude | Drafted feature inventory, traceability and 3-sprint plan; proposed feature split and SR mapping as options | Team chose sprint split, accepted D-01–D-09, chose SR mapping; pending: team review of AC list and plan wording |
| 2026-11-07 | D1-S3 | Claude | Drafted System SDS from SRS/features and the TokTickIT auth design; offered design options with trade-offs | Team chose SD-01–SD-04; pending: team review of data model, permission matrix and deployment plan |
| 2026-11-07 | D1-S4 | Claude | Drafted Sprint 1 contracts F-01–F-06 (behaviour, API, data, AC, STS) and the DoD | Team chose Sprint 1 line-type scope, PR flow and owners; pending: each owner reviews their contracts before implementation |
| 2026-11-07 | Scaffold | Claude | Generated project skeleton (server/client/e2e, compose, README) from TokTickIT patterns | Pending: teammate review in PR #9 |
| 2026-11-07 | D1-S5 (F-01) | Claude | Wrote F-01 tests first (red), then auth API, middleware, seed and Login UI; ran tests and saved red/green output | Sxr1n checks contract match and test assertions; pending: teammate PR review |
| 2026-11-07 | D1-S5b (F-02) | Claude | Wrote F-02 tests first (red), then admin API and Users screen; ran tests and saved output | Sxr1n checks assertions and contract match; pending: teammate PR review |
| 2026-11-07 | L5-S1 | Claude | Wrote Dockerfile, compose app service and entrypoint; ran the fresh build/persistence check; found and fixed the destructive seed with a red/green test | Sxr1n checks the compose check output and Dockerfile; pending: teammate PR review |
| 2026-11-12 | D1-S6a (F-03) | Claude | Wrote F-03 tests first (red), then accounts API, opening balance transaction logic and Accounts UI; ran tests and saved output | Leviathan-c137 verified schema constraints, satang math and permission isolation; pending: teammate PR review |
| 2026-11-12 | Integration + F-06 (part) | Claude | Diagnosed the stale PR conflict and the blocked E2E browser; wrote the Bangkok month-range test first, then the helper | Sxr1n checked merge order, evidence files and month-boundary cases |
| 2026-11-14 | F-06 | Claude | Wrote F-06 API and E2E tests first (red), then overview/summary/history API and screens; ran the full suite and saved output | Sxr1n checks totals against the scenario and the contract revision; pending: teammate PR review |
| 2026-11-14 | D1-S8 (PDF builder) | Claude | Wrote the PDF build script and the Part F outline; built and checked the PDF | Sxr1n checks page ranges and rendering; Part F content is written by the team from real evidence |
| 2026-11-14 | D1-S7 (release prep) | Claude | Ran the full release verification on staging and recorded it | Sxr1n checks counts and tested commit; teammate reviews the release PR |
