# Project Status — อัปเดตทุกครั้งที่จบ session

## Current
- Phase / next checkpoint: Phase 1 — D1 **and Lab 5** both due 15 Nov 23:59 (LEB2, checked 2026-11-07); D2 29 Nov, Final 13 Dec unchanged
- Next session: Leviathan-c137 → review F-06 PR · both → release `v0.1.0-sprint1` (staging → main) · Lab 5 L5-S3 GCP + protection demo · PDFs
- Latest release on main: —
- Active staging branch: `staging/sprint-1` (PRs #7–#17 merged)
- Deployed URL / version: —

## Feature board
| F-ID | Name | Sprint | Status | Owner | Contract | Issue/PR | Evidence |
|---|---|---|---|---|---|---|---|
| F-01 | Authentication and session | 1 | TESTED | Sxr1n | sprint-1/F01-auth.md | #1 | red `e9f9653`, green `56ac71d` (evidence/d1/F01-*.txt) |
| F-02 | Administrator user access | 1 | TESTED | Sxr1n | sprint-1/F02-admin-user-access.md | #2 | red `50c09ff`, green `1090928` (evidence/d1/F02-*.txt) |
| F-03 | Opening balance | 1 | TESTED | Leviathan-c137 | sprint-1/F03-opening-balance.md | #3 / PR #16 | red `0849955`, green `3f3aae5`, closed `b2a4f70` (evidence/d1/F03-*.txt) |
| F-04 | Receive money | 1 | TESTED | Leviathan-c137 | sprint-1/F04-receive-money.md | #4 / PR #17 | red `295c90b`, green `b2a4f70` (evidence/d1/F04-*.txt) |
| F-05 | Make a payment or record a charge | 1 | TESTED | Leviathan-c137 | sprint-1/F05-payment-charge.md | #5 / PR #18 | red `f615c47`, green `6f52657` (evidence/d1/F05-*.txt) |
| F-06 | Overview, summary and history | 1 | TESTED | Sxr1n | sprint-1/F06-overview-history.md | #6 | red `c5848da`, green `7850d4e` (evidence/d1/F06-*.txt) |
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
### 2026-11-14 — F-06 Overview, summary and history — Claude + Sxr1n
- Done: `GET /api/overview`, `GET /api/summary?from&to`, `GET /api/transactions` (paged), `GET /api/transactions/:id`, `periodTotal` ใน `GET /api/accounts`; `lib/query.ts` (paging/period ใช้ร่วมกับ admin), `lib/summary.ts` (นับเฉพาะ INCOME/EXPENSE line ของ POSTED — BR-06); หน้า Overview, History, Transaction detail, nav Overview/History, คอลัมน์ This month ในหน้า Accounts; E2E global setup reset + seed DB dev
- Evidence: red `c5848da` → `evidence/d1/F06-red.txt` (API 6 fail), `F06-e2e-red.txt` (journey ล้มที่หน้า Overview); green `7850d4e` → `evidence/d1/F06-green.txt` (server 56/56, tsc OK, client build OK, E2E 6/6)
- Decisions: journey E2E ใช้ bob (spec F-04/F-05 แก้ข้อมูลของ alice ในรอบเดียวกัน); ไม่ใส่ปุ่มซ้ำบน Overview (ชื่อลิงก์ซ้ำทำให้ selector ของ E2E F-04/F-05 พัง) — contract v0.3
- Open issues: `getTodayBangkok` (ledger.ts) ซ้ำกับ `bangkokToday` (period.ts) และ `formatTHB` มี 4 ชุด → Parked; branch protection; L5-S3 GCP ยังไม่เริ่ม
- Next session: release `v0.1.0-sprint1` และ Lab 5

### 2026-11-12 — Integration + F-06 (part) — Claude + Sxr1n
- Done: #7–#12 merged; #10 CONFLICTING ค้าง → `git merge-tree` สะอาด → merge staging เข้า F-01 (`729b1ce`); integration run staging `2770873`; E2E ในเครื่องโดน Windows Smart App Control → `PW_CHANNEL=chrome` (#15); F-06 helper ตัดรอบเดือน Bangkok
- Evidence: `evidence/d1/staging-integration-2770873.txt` (server 17/17, E2E 3/3); F-06 range red `87b22b5` → green `59cbd08`

### 2026-11-14 — D1-S6c (F-05) — Claude + Leviathan-c137
- Done: F-05 ครบ AC-F05-01–07 + E2E TEST-F05-08 — ฟังก์ชัน `calculateTxnEffects` บน shared ledger core (`server/src/lib/ledger.ts`), จัดการ transaction form `PAYMENT` ใน `POST /api/transactions` (atomic balance updates, BR-05 effects, BR-07 cash overspending check, BR-08 card overpayment check, check constraint backstop), หน้า Make a payment (`/pay`) พร้อม dynamic lines, spending/repayment categories, live footer comparison, inline field error mapping, Playwright E2E `e2e/f05-pay.spec.ts`
- Evidence: red `f615c47` → `evidence/d1/F05-red.txt` (8 failed); green `6f52657` → `evidence/d1/F05-green.txt` (server 47/47 passed, client build OK, E2E 5/5 passed; CI run 43489199561)
- Decisions: PAYMENT updates balance using `calculateTxnEffects` with locked rows; CASH balance cannot be negative (BR-07); repayments cannot exceed debt (BR-08); repayments do not affect expense sum (BR-06)
- Open issues: —
- Next session: Sxr1n รีวิว F-05 PR; Leviathan-c137 ตรวจสอบ F-06 และเตรียมรายงาน Lab 5

### 2026-11-13 — D1-S6b (F-04) — Claude + Leviathan-c137
- Done: F-04 ครบ AC-F04-01–07 — model Txn/TxnLine, migration `init_transactions`, shared ledger core (`server/src/lib/ledger.ts`), `POST /api/transactions` (atomic posting algorithm พร้อม SELECT FOR UPDATE, balance updates, validation BR-01..04, BR-09), หน้า Receive money (`/receive`) พร้อม live footer calculation, client-side validation และ field error mapping, E2E test `e2e/f04-receive.spec.ts`; unskipped และ verified PASS สำหรับ `TEST-F03-02`
- Evidence: red `295c90b` → `evidence/d1/F04-red.txt` (5 failed API-DB); green `b2a4f70` → `evidence/d1/F04-green.txt` (server 34/34 passed, client build OK, E2E 4/4 passed)
- Decisions: shared transaction engine ใช้ schema model `Txn` และตาราง `transactions` / `transaction_lines`; posting algorithm ล็อก accounts เรียงตาม id ascending ป้องกัน deadlock
- Open issues: —
- Next session: Sxr1n รีวิว F-04 PR; Leviathan-c137 เริ่ม F-05 Make a payment or record a charge

### 2026-11-12 — D1-S6a (F-03) — Claude + Leviathan-c137
- Done: F-03 ครบ AC-F03-01–05 — enum AccountType, model Account, migration `init_accounts`, seed default accounts, `GET /api/accounts`, `PUT /api/accounts/:id/opening-balance`, หน้า Accounts (`/accounts`) พร้อมแบบฟอร์มตั้งยอดเริ่มต้น
- Evidence: red `0849955` → `evidence/d1/F03-red.txt` (5 failed API-DB, unit failed); green `3f3aae5` → `evidence/d1/F03-green.txt` (server 24/24 passed, client build OK, E2E 3/3 regression passed)
- Decisions: opening balance เก็บ satang เป็น bigint บน accounts; validation เช็ก 400 -> 404 -> 422 -> 409
- Open issues: —
- Next session: Sxr1n รีวิว F-03 PR; Leviathan-c137 เริ่ม F-04 Receive money (transaction engine)

### 2026-11-07 — L5-S1 (Docker + compose) — Claude + Sxr1n
- Done: `Dockerfile` (multi-stage, image เดียว Express serve React — SD-05 Accepted), service `app` ใน compose (port 8080), `server/docker-entrypoint.sh` (migrate deploy + seed ถ้า `SEED_ON_START=true`), root `.env.example`, env `COOKIE_SECURE`/`CLIENT_DIST`; README มีหัวข้อ Docker; SDS v0.3
- Defect ที่เจอระหว่างทำ: seed reset status ของ user ทุกครั้งที่ container start (admin disable หายหลัง restart) → red `7785f76` (`evidence/d1/seed-nondestructive-red.txt`) → fix `b5154a9` → green (server 18/18)
- Evidence: `docs/labs/lab5/L5-S1-compose-check.txt` — fresh volume + `build --no-cache` → migration applied, seed, `/` และ `/overview` 200 HTML, `/api/accounts` 401, bob DISABLED คงอยู่หลัง restart และหลัง down/up; full suite server 18/18, E2E 3/3
- Open issues: ยังไม่ได้อ่านไฟล์แนบ Lab 5 (วิธีเข้า GCP); HTTPS ยังไม่มี → ใช้ `COOKIE_SECURE=false`; image มี dev dependencies (shortcut ใน Dockerfile)
- Next session: L5-S2 CI quality gate

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
- รวม `getTodayBangkok()` (server/src/lib/ledger.ts) กับ `bangkokToday()` (server/src/lib/period.ts) และ `formatTHB` ใน AccountsPage/PayPage/ReceiveMoneyPage ให้ใช้ `client/src/format.ts`
-
