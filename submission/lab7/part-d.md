<!-- include: docs/labs/lab07/metrics-readiness.md | ## D.1 Release readiness: maintained Sprint 1 scope (snapshot) -->

## D.5 Contributions

| Work | Sxr1n | Leviathan-c137 |
|---|---|---|
| Choosing CHG-01 and owning the change | Owner; picked the credit limit from three candidates | Agreed the change |
| Change request, impact table, contract F-05 v0.6 (#72, #73) | Author | Reviewed and approved the contract before any code (2026-11-27 18:27 UTC) |
| Tests (red), implementation, regression (#74) | Author | Code review and approval |
| F-11 re-validates BR-18 in edits (AC-F11-12, #75) | Review: asked for the BR-18 check and the race fix | Author |
| Release `v0.2.0-sprint2` (#77) and deploy | Release PR, tag, deploy follow-up, post-deploy checks run on the live service | Release review and approval |
| Metrics, readiness, retrospective | Collected and drafted | Confirms the retrospective |

Pair work: the retrospective answers (D.3) are a draft until both students confirm them.

## D.6 AI-use declaration

Claude (Claude Code) was used as an assistant. The rows below come from `docs/ai-use.md`, the project's AI-use log. A student reviewed every output before it was committed, and every AI-assisted commit carries a `Co-Authored-By` trailer. Claude did not approve or review pull requests: all approvals above are the teammate's.

| Date | Session | What Claude did | What the students checked |
|---|---|---|---|
| 2026-11-27 | L7-S1 | Proposed three candidate changes; drafted the change request, impact table, F-05 v0.6 contract revision and the SRS/SDS/traceability rows | Sxr1n chose the change and owner; Leviathan-c137 reviewed the contract before code |
| 2026-11-28 | L7-S2 | Wrote the CHG-01 tests (red first), migration, limit validation, BR-18 checks and UI; ran the full regression | Sxr1n checked the evidence; Leviathan-c137 reviewed the code PR |
| 2026-11-28 | L7-S3 | Collected the five metrics from GitHub at a stated snapshot; drafted the readiness checklist, debt table and retrospective | Both students confirm the retrospective and the verdict |
| 2026-11-28 | Release | Merged the approved release PR, tagged it, followed the deploy, wrote `deploy/post_deploy_checks.py` | Leviathan-c137 approved #77; Sxr1n ran the post-deploy checks |

## D.7 Known limitations

- The metrics (Part C) are a snapshot taken before the release. They are not refreshed, so that M-2/M-5 stay reconcilable with their embedded lists.
- The post-deploy checks are a script run by hand with passwords typed at the prompt, not a pipeline step. The Lab 5 smoke test is the automated part.
- The red TEST-F05-10 unit failure is a missing-function error, not an assertion (B.3). The behavioural red comes from the API tests.
- The cross-team UAT re-test of the maintained Sprint 1 scope (Lab 6) has not run yet.
- If a CHECK constraint fires in `POST /api/transactions` in a race, the fallback message is "Balance cannot be negative" for any constraint. The status is still a correct 422 (debt table D.2).
