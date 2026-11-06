# Project Status — อัปเดตทุกครั้งที่จบ session

## Current
- Phase / next checkpoint: Phase 1 — D1 (8 Nov 23:59)
- Next session: D1-S3 (System SDS)
- Latest release on main: —
- Active staging branch: —
- Deployed URL / version: —

## Feature board
| F-ID | Name | Sprint | Status | Owner | Contract | Issue/PR | Evidence |
|---|---|---|---|---|---|---|---|
| F-01 | Authentication and session | 1 | PLANNED | — | — | — | — |
| F-02 | Administrator user access | 1 | PLANNED | — | — | — | — |
| F-03 | Opening balance | 1 | PLANNED | — | — | — | — |
| F-04 | Receive money | 1 | PLANNED | — | — | — | — |
| F-05 | Make a payment or record a charge | 1 | PLANNED | — | — | — | — |
| F-06 | Overview, summary and history | 1 | PLANNED | — | — | — | — |
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

## Open defects / changes (สรุป รายละเอียดอยู่ใน docs/changes.md)
| ID | Summary | Severity | Status |
|---|---|---|---|

## Session log (ใหม่สุดอยู่บนสุด)
### 2026-11-07 — D1-S2 — Claude + Sxr1n
- Done: `docs/features.md` v0.1 (F-01–F-16 + SR-01–SR-04), `docs/traceability.md` v0.1 (FR/BR/NFR ครบทุกข้อ, 40 planned AC/TEST ของ Sprint 1, coverage gaps, approved changes), `docs/sprints/plan.md` v0.1; `docs/srs.md` → v0.2 (D-01–D-09 Accepted); `CLAUDE.md` ใส่ stack + รูปแบบ ID `SR-`
- Evidence: ยังไม่ commit (รอผู้ใช้อนุมัติ) · ตรวจด้วยสคริปต์แล้วว่า FR-01–27, BR-01–17, NFR-01–11 อยู่ครบทั้งใน features.md และ traceability.md และ AC ทุกตัวผูกกับ REQ อย่างน้อย 1 ข้อ
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
