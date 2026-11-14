# Working Sprint 1 and verification

> Owner: Leviathan-c137 (Part D–F split, docs/sessions/STATUS.md). Fill every section from real runs only; each claim must point to a commit, test name or file in `evidence/d1/`. Screenshots go in `submission/d1/img/` and are referenced as `img/<name>.png`. Delete this note when done.

Release under test: `v0.1.0-sprint1` — commit `<sha>` · Local setup summary: README "Local setup" (Docker PostgreSQL on 5434, `prisma migrate deploy`, `prisma db seed`, `npm run dev`).

## F.1 Program demonstrations
For each scenario: feature/AC IDs, role, starting conditions, steps, expected, actual (+ screenshot).

### F.1.1 Normal domain journey and persisted result (AC-F06-07, AC-F03-01, AC-F04-01, AC-F05-01, AC-F05-02)

### F.1.2 Business-rule rejection (e.g. AC-F04-02 line sum ≠ total, AC-F05-05 CASH cannot go negative)

### F.1.3 Login/logout and forbidden operations (AC-F01-01, AC-F01-04, AC-F02-04, AC-F06-06) — include API test evidence

## F.2 Build and automated test results
Commands, tested commit and pass/fail/skip counts: `evidence/d1/release-v0.1.0-sprint1.txt`.

| AC | TEST ID | Level | Test file::name | Result | Commit |
|---|---|---|---|---|---|

Automated vs manual: all Sprint 1 AC are automated (unit / API-DB / E2E); list any manual check separately.

### F.2.1 Test excerpt — domain rule (with red → green)

### F.2.2 Test excerpt — role/ownership restriction (with result)

## F.3 Engineering workflow and history
### F.3.1 Two completed Issues and their PRs (feature/contract IDs, branch, author, reviewer, substantive review, merge into staging and main)

### F.3.2 History sequence: contract → test (red) → implementation, with commit IDs and dates

### F.3.3 Final board status and release reference

## F.4 Contributions
| Student | Main work | Reviews |
|---|---|---|

## F.5 AI-use declaration
Summary of `docs/ai-use.md`.

## F.6 Known limitations, failed and skipped tests
