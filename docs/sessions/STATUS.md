# Project Status — อัปเดตทุกครั้งที่จบ session

## Current
- Phase / next checkpoint: Phase 1 — D1 **and Lab 5** both due 15 Nov 23:59 (LEB2, checked 2026-11-07); D2 29 Nov, Final 13 Dec unchanged
- Next session: Leviathan-c137 → review PRs, then D1-S6 (F-03–F-05) · Sxr1n → L5-S1 (Docker), L5-S2 (CI), L5-S3 (GCP), then F-06
- Latest release on main: —
- Active staging branch: `staging/sprint-1` (PRs #7 docs, #8 contracts, #9 scaffold awaiting teammate review)
- Deployed URL / version: —

## Feature board
| F-ID | Name | Sprint | Status | Owner | Contract | Issue/PR | Evidence |
|---|---|---|---|---|---|---|---|
| F-01 | Authentication and session | 1 | TESTED | Sxr1n | sprint-1/F01-auth.md | #1 | red `e9f9653`, green `56ac71d` (evidence/d1/F01-*.txt) |
| F-02 | Administrator user access | 1 | TESTED | Sxr1n | sprint-1/F02-admin-user-access.md | #2 | red `50c09ff`, green `1090928` (evidence/d1/F02-*.txt) |
| F-03 | Opening balance | 1 | SPECIFIED | Leviathan-c137 | sprint-1/F03-opening-balance.md | #3 | — |
| F-04 | Receive money | 1 | SPECIFIED | Leviathan-c137 | sprint-1/F04-receive-money.md | #4 | — |
| F-05 | Make a payment or record a charge | 1 | SPECIFIED | Leviathan-c137 | sprint-1/F05-payment-charge.md | #5 | — |
| F-06 | Overview, summary and history | 1 | SPECIFIED | Sxr1n | sprint-1/F06-overview-history.md | #6 | — |
| F-07 | Account management | 2 | PLANNED | — | — | — | — |
| F-08 | Opening balance management | 2 | PLANNED | — | — | — | — |
| F-09 | Transfers | 2 | PLANNED | — | — | — | — |
| F-10 | Loans given and taken | 2 | PLANNED | — | — | — | — |
| F-11 | Transaction corrections | 2 | PLANNED | — | — | — | — |
| F-12 | Search and filter | 2 | PLANNED | — | — | — | — |
| F-13 | Favourite transactions | 3 | PLANNED | — | — | — | — |
| F-14 | Duplicate transaction | 3 | PLANNED | — | — | — | — |
| F-15 | Category spending | 3 | PLANNED | — | — | — | — |
| F-16 | Period reports | 3 | PLANNED | — | — | — | — |

## Work split (ตกลง 2026-11-07, แก้ตามวันส่ง LEB2: D1 + Lab 5 ส่ง 15 Nov)
| วันที่ | Sxr1n (ศารินทร์) | Leviathan-c137 (ตันติยวัตร) |
|---|---|---|
| 8 Nov | push, assign Issue, project board, ส่ง Q-01 ถาม TA · อ่านไฟล์แนบ 3 ไฟล์ของ Lab 5 (วิธีเข้า GCP) | Review + merge PR #7–#11 และ PR เรื่องวันส่ง (finding อย่างน้อย 1 ข้อต่อ PR) |
| 9 Nov | L5-S1 Dockerfile + compose | F-03 Opening balance (TDD) |
| 10 Nov | L5-S2 CI quality gate + สาธิต check ที่ fail แล้วบล็อก merge · review F-03 | F-04 Receive money + transaction engine |
| 11 Nov | L5-S3 CD → GCP + DB ถาวร + secrets | F-04 (ต่อ) → merge ภายในวันนี้ |
| 12 Nov | review F-04 · F-06 backend | F-05 Payment/charge |
| 13 Nov | F-06 UI + E2E journey (TEST-F06-07) | review F-06 · `docs/labs/lab5/` (หลักฐาน redeploy แล้วข้อมูลยังอยู่) |
| 14 Nov | ทำคู่: release `v0.1.0-sprint1` → deploy GCP (L5-S4) | ทำคู่ |
| 14–15 Nov | PDF D1 Part A–C · รายงาน Lab 5 | PDF D1 Part D–F |

กติกา: ต่างคนต่าง review PR ของอีกฝ่าย; commit ด้วยบัญชีตัวเอง; ถ้าโค้ดต่างจาก contract ให้แก้ contract + revision history ใน PR เดียวกัน; F-04 ต้อง merge ภายใน 11 Nov; ถ้า Sxr1n ไม่ทัน ให้ย้าย L5-S3 มาทำคู่วันที่ 13

## Open defects / changes (สรุป รายละเอียดอยู่ใน docs/changes.md)
| ID | Summary | Severity | Status |
|---|---|---|---|

## Session log (ใหม่สุดอยู่บนสุด)
### 2026-11-07 — D1-S5b (F-02) — Claude + Sxr1n
- Done: F-02 ครบ AC-F02-01–06 — `GET /api/admin/users`, `PATCH /api/admin/users/:id` (disable เพิ่ม token_version, ห้าม disable ตัวเอง), หน้า Users
- Evidence: red `50c09ff` → `evidence/d1/F02-red.txt` (4 fail, 3 pass เพราะ guard จาก F-01); green `1090928` → `evidence/d1/F02-green.txt` (server 17/17, client build OK, E2E 3/3 regression)
- Decisions: branch `feature/F02-admin-user-access` แตกจาก `feature/F01-auth` → PR ต้อง merge หลัง #10
- Open issues: หน้า Users ไม่มี E2E (STS ไม่ได้กำหนด) — ตรวจผ่าน API test เท่านั้น
- Next session: F-03–F-05 (เพื่อน) แล้ว F-06

### 2026-11-07 — D1-S5 (F-01) — Claude + Sxr1n
- Done: F-01 Auth ครบ AC-F01-01–08 — migration `init_users`, seed (alice, bob, admin), login/logout/me, `requireAuth`/`requireRole` mount ที่ `/api/admin` และกลุ่ม route การเงิน, หน้า Login + navbar + route guard; README มีขั้นตอน test DB/generate/seed; ย้าย port DB ในเครื่องเป็น 5434 (SDS v0.2)
- Evidence: red `e9f9653` → `evidence/d1/F01-red.txt` (API 6 fail, unit fail), `F01-e2e-red.txt` (2 fail); green `56ac71d` → `evidence/d1/F01-green.txt` (server 10/10 passed, client build OK, E2E 3/3 passed)
- Decisions: branch `feature/F01-auth` แตกจาก `spec/sprint-1-contracts` + merge `chore/scaffold` (ผู้ใช้อนุมัติ เพราะ #7–#9 รอ review) — PR ของ F-01 ต้อง merge หลัง #8 และ #9
- Open issues: เพื่อนยังไม่ได้เป็น collaborator; Prisma 7 ไม่ generate client หลัง `migrate dev` (ใส่ใน README แล้ว)
- Next session: F-02 Admin (D1-S5b) บน branch ที่แตกจาก F-01; เพื่อนเริ่ม F-03–F-05

### 2026-11-07 — Scaffold (ระหว่าง D1-S4 → D1-S5) — Claude + Sxr1n
- Done: โครง server/client/e2e, health endpoint, error shape, docker-compose, `.env.example`, README
- Evidence: commit `a91af97` (PR #9) — server 3/3 passed, client build OK, smoke E2E 1/1 passed
- Next session: D1-S5

### 2026-11-07 — D1-S4 — Claude + Sxr1n
- Done: contracts `docs/sprints/sprint-1/F01–F06-*.md` (40 AC, 40 STS rows, status SPECIFIED), `docs/dod.md` v0.1; traceability v0.2 (sync AC-F03-02 + test levels, ปิด gap line type), features v0.2 (F-03 มี account list)
- Evidence: `7dbc7ec` (spec), `1dbaac0` (docs) บน `spec/sprint-1-contracts` (pushed); Issues #1–#6
- Decisions: Sprint 1 รับ line เฉพาะ RECEIPT←INCOME และ PAYMENT→EXPENSE/LOAN_TAKEN; ใช้ 2 PR (docs/d1-baseline → staging แล้วตามด้วย contracts → staging); owner: Sxr1n = F-01/F-02/F-06, <Student B> = F-03/F-04/F-05; note ≤ 200 ตัวอักษร (ขีดจำกัดระดับ contract)
- Open issues: **เพื่อนยังไม่ได้เป็น collaborator ของ repo** (review PR ไม่ได้); ยังไม่รู้ GitHub username ของเพื่อน; Issue ของ F-03/04/05 ยังไม่ได้ assign (รอ username ของเพื่อน); ถาม TA เรื่อง Q-01
- Next session: เปิด PR 2 ตัวให้เพื่อน review → D1-S5 ∥ D1-S6

### 2026-11-07 — D1-S3 — Claude + Sxr1n
- Done: `docs/system-sds.md` v0.1 — stack + component diagram, ตำแหน่งที่บังคับใช้ rule, ER + constraints + ownership, การเก็บ balance/posting algorithm, migration/seed, หน้าจอ UI + shared states, API conventions + error shape, permission matrix, auth/session, env vars, แผน GCP
- Evidence: commit `af4bdaf` (pushed)
- Decisions: SD-01 เก็บ balance เป็น column (row lock); SD-02 opening balance เป็น field บน account; SD-03 VM + docker compose; SD-04 session ด้วย tokenVersion (แบบ TokTickIT); SD-05 1 app image (Proposed); SD-06 422/404/403
- Open issues: HTTPS/VM size/การเข้า GCP (Lab 5); line type ของ engine ใน Sprint 1 (D1-S4); Q-01 ถาม TA
- Next session: D1-S4 Sprint 1 contracts + DoD

### 2026-11-07 — D1-S2 — Claude + Sxr1n
- Done: `docs/features.md` v0.1 (F-01–F-16 + SR-01–SR-04), `docs/traceability.md` v0.1 (FR/BR/NFR ครบทุกข้อ, 40 planned AC/TEST ของ Sprint 1, coverage gaps, approved changes), `docs/sprints/plan.md` v0.1; `docs/srs.md` → v0.2 (D-01–D-09 Accepted); `CLAUDE.md` ใส่ stack + รูปแบบ ID `SR-`
- Evidence: commits `e2d8413`, `cc2efa9` (pushed to `origin/docs/d1-baseline`) · ตรวจด้วยสคริปต์แล้วว่า FR-01–27, BR-01–17, NFR-01–11 อยู่ครบทั้งใน features.md และ traceability.md และ AC ทุกตัวผูกกับ REQ อย่างน้อย 1 ข้อ
- Decisions: แบ่ง sprint ตาม SRS (option A); ยืนยัน D-01–D-09 (team); NFR ที่ข้ามหลาย feature ใช้ system responsibility SR-xx; traceability Sprint 1 ใช้ ID + คำอธิบายสั้น
- Open issues: Q-01 (ถาม TA เรื่อง D-03 ก่อน freeze F-05), Q-03 (ก่อน contract ของ F-08), ขอบเขต line type ของ engine ใน Sprint 1 (ตัดสินใน D1-S4), ชื่อ–รหัสนักศึกษายังว่าง
- Next session: D1-S3 System SDS

### 2026-11-07 04:00 — D1-S1 (draft) — Claude + Sxr1n
- Done: ร่าง `docs/srs.md` v0.1 — context, actors, scope/exclusions, domain model, FR-01–27, BR-01–17, NFR-01–11, assumptions, decisions D-01–09, questions Q-01–03
- Evidence: ยังไม่ commit (รอทีมรีวิว)
- Decisions: ทุกข้อใน §8.2 ยังเป็น Proposed ต้องให้ทั้งสองคนยืนยันก่อน
- Open issues: Q-01–Q-03; ชื่อ–รหัสนักศึกษาและ stack ใน CLAUDE.md ยังว่าง
- Next session: ทีมรีวิว SRS → commit ผ่าน branch `docs/d1-baseline` → D1-S2 (features + traceability + sprint plan)

### YYYY-MM-DD HH:MM — <Session ID> — <ชื่อคนที่ทำ>
- Done:
- Evidence: <commit SHA / test::name / evidence/... file>
- Decisions:
- Open issues / blockers:
- Next session:

## Parked (เจอระหว่างทางแต่อยู่นอก scope)
-
