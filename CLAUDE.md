# CPE334 Group Project — Project Instructions

> ใช้เป็น Custom Instructions ของ Claude Project หรือบันทึกเป็น `CLAUDE.md` ที่ root ของ repo
> เติมค่าใน `<...>` ให้ครบก่อนใช้

## 0. ไฟล์ที่โหลดอัตโนมัติ (Claude Code)
สถานะล่าสุดและ handoff: @docs/sessions/STATUS.md
แผน session ทั้งหมดอยู่ที่ `docs/sessions/SESSION_PLAN.md` ให้เปิดอ่านเฉพาะหัวข้อของ session ที่ทำอยู่
เอกสารของวิชาอยู่ที่ `docs/course/` (group_work_specs_v1.pdf และ handout ของแต่ละ checkpoint) ให้อ่านเมื่อต้องเช็กเกณฑ์

## 1. บริบท
- วิชา CPE334 ภาคเรียน 1/2026 งานกลุ่ม 2 คน: `<ชื่อ–รหัส นศ. A>`, `<ชื่อ–รหัส นศ. B>`
- ธีม/บริบท: **Personal Money and Expense Logging System** (ระบบบันทึกรายรับ-รายจ่ายส่วนตัว)
- Repo: https://github.com/Sxr1n/cpe334-money-logger
- Stack (reused from TokTickIT): React 19 + Vite + TypeScript + Bootstrap / Express 5 + TypeScript + Prisma 7 / PostgreSQL 16 (docker compose) / auth: bcryptjs + JWT in cookie, session and user status checked on the server every request / tests: Vitest (unit), Vitest + Supertest (API/integration), Playwright (E2E)
- Source of truth ของ scope: `group_work_specs_v1.pdf` (§5 ข้อกำหนดร่วม, §6 ข้อ 7 ธีมของเรา, §8 workflow, §10 labs) + CHG ที่อนุมัติแล้วใน `docs/changes.md`
- เกณฑ์ของแต่ละ checkpoint: `project_deliverable_1_v1.pdf`, `project_deliverable_2_v1.pdf`, `project_final_delivery_v1.pdf`
- ภาษา: คุยกับผู้ใช้เป็นภาษาไทย แต่ทุกอย่างที่ส่งอาจารย์ (docs/, PDF, Issue, PR, commit message) ให้เขียนเป็นภาษาอังกฤษ

## 2. Checkpoints
| Checkpoint | ส่ง (23:59) | คะแนน | แก่นของงาน |
|---|---|---|---|
| D1 | 8 Nov | 80 | SRS, features/traceability, System SDS, แผน 3 sprint, contracts ของ Sprint 1 และ Sprint 1 ที่ทำงานได้จริงบน `main` |
| Lab 5 | 15 Nov | 100 lab | Docker, CI ที่เป็น quality gate (ต้องสาธิต check ที่ fail แล้วบล็อกได้), CD → GCP, ข้อมูลยังอยู่หลัง redeploy |
| Lab 6 | 22 Nov | 100 lab | UAT ข้ามทีม (อย่างน้อย 4 case), triage, แก้ defect และให้ partner re-test |
| Lab 7 | 29 Nov | 100 lab | change ที่ TA อนุมัติ (TDD + regression), metrics 5 ตัว, release readiness และ retrospective |
| D2 | 29 Nov | 70 | Sprint 2 ครบ, contracts ของ Sprint 3 ทุกตัว, มีงาน Sprint 3 ที่ทำงานได้จริงอย่างน้อย 1 workflow และ RC ที่ deploy บน GCP |
| Final | 13 Dec | 100 | product ครบ, regression + UAT re-test, traceability ฉบับสุดท้าย, DoD review และวิดีโอ |

ช่วง 1–11 Dec เป็นช่วงสอบ ดังนั้น product ต้อง**เกือบเสร็จภายใน 29 Nov** และห้ามทิ้ง workflow หลักไว้ทำ 2 วันสุดท้าย

## 3. Session protocol
ทำงานเป็น session สั้นๆ ที่มีขอบเขตชัด ตามรายการใน `docs/sessions/SESSION_PLAN.md` และ**ไม่มีความจำข้าม session** ทุกอย่างที่ต้องส่งต่อจึงต้องอยู่ใน repo

**เริ่ม session**
1. อ่าน `docs/sessions/STATUS.md` และไฟล์ Inputs ของ session นั้นตาม SESSION_PLAN
2. บอกผู้ใช้ใน 3 บรรทัด: Session ID, output ที่จะได้ และเกณฑ์เสร็จ
3. ถ้า input ขาด (เช่น ยังไม่มี SRS หรือยังไม่รู้ stack) ให้แจ้งและถามผู้ใช้ ห้ามเดาเนื้อหาทาง domain หรือคิด requirement ขึ้นเอง

**ระหว่าง session**
- ทำเฉพาะงานใน scope ของ session นั้น
- สิ่งที่เจอแต่อยู่นอก scope ให้จดไว้ในหัวข้อ *Parked* ของ STATUS.md
- เมื่อต้องตัดสินใจเรื่อง design ให้เสนอทางเลือกพร้อมข้อดีข้อเสียสั้นๆ ให้ผู้ใช้เลือก แล้วบันทึก decision ลง `docs/srs.md` (Decisions) หรือ `docs/system-sds.md`

**จบ session** (ต้องทำทุกครั้ง)
1. อัปเดต `docs/sessions/STATUS.md` โดยเพิ่ม log ไว้บนสุด ระบุ Done, Evidence (commit SHA, ชื่อ test, ไฟล์ output), Decisions, Open issues และ Next session
2. เพิ่มบรรทัดใน `docs/ai-use.md` ว่า AI ช่วยส่วนไหน และคนตรวจอะไร
3. บอกคำสั่ง git ที่ผู้ใช้ต้องรัน (ถ้ามี) และสรุป design/test ที่เพิ่งทำให้ทั้งสองคนเข้าใจตรงกันใน 3–5 บรรทัด

## 4. กฎที่ห้ามละเมิด (มาจากเกณฑ์ให้คะแนน)
1. **Contract ก่อนโค้ด:** feature SDS, AC และ STS ต้อง commit ก่อน implementation โดย commit message ใช้ลำดับ `spec(F03): ...` → `test(F03): red ...` → `feat(F03): ...`
2. **TDD สำหรับ rule, defect และ change:** commit test ที่ล้มก่อน แล้วเก็บ output จริงไว้ที่ `evidence/<checkpoint>/` จากนั้นจึง implement และเก็บ output ที่ผ่าน
3. **ห้ามแต่งผลลัพธ์:** ใช้เฉพาะ output ที่รันจริง (คนรันหรือ Claude รันเองก็ได้) และห้ามรายงานว่า "PASS" หรือ "done" ถ้าไม่มี evidence ชี้กลับไปได้
4. **Authorization อยู่ที่ backend:** identity และ role ต้องมาจาก session/token เท่านั้น ห้ามรับ user ID หรือ role จาก client ทุก endpoint ที่มีการป้องกันต้องมี test 3 กรณี คือ unauthenticated, forbidden role และ cross-user record
5. **ห้าม disable, skip หรือลด assertion** เพื่อทำให้ test ผ่าน ถ้ามี test fail หรือ skip ต้องรายงานตรงๆ
6. **Secrets:** ใน git ให้มีแค่ `.env.example` ใช้ seed ที่เป็นข้อมูลสังเคราะห์ และห้ามมีรหัสผ่านหรือ token จริงใน repo หรือ PDF
7. **Review ต้องเป็นของเพื่อนร่วมทีม:** Claude ช่วยทำ checklist สำหรับ review ได้ แต่ห้ามเขียนคอมเมนต์ review หรือ approve PR แทนเพื่อน และผู้เขียนห้าม approve PR ของตัวเอง
8. **ห้ามเขียน history ใหม่:** ห้าม force-push หรือ rebase บน `staging/*` และ `main` ส่วน tag ที่ส่งไปแล้วห้ามย้าย
9. **เอกสารต้องตรงกับโค้ด:** ถ้า implementation ต่างจาก contract ให้แก้ contract พร้อมบรรทัดใน Revision history (วันที่, เหตุผล, CHG-ID) ห้ามแก้เงียบๆ และห้ามลบ requirement ทิ้ง ถ้าเลิกใช้ให้ mark เป็น `WITHDRAWN (CHG-xx)`
10. **Technical debt ไม่ใช่ข้ออ้างของ feature ที่ยังไม่เสร็จ:** feature ที่ยังไม่ครบให้ใช้สถานะ `INCOMPLETE`

## 5. รูปแบบ ID และสถานะ
- Requirements: `FR-01`, `BR-01`, `NFR-01` (ใช้ ID เดิมตลอด ห้ามเรียงเลขใหม่)
- Features: `F-01` · AC: `AC-F01-01` · Tests: `TEST-F01-01` · NFR checks: `TEST-NFR01-01`
- Changes: `CHG-01` · Defects: `DEF-01` · UAT: `UAT-01`
- System responsibilities (cross-cutting NFR/BR): `SR-01`
- Branches: `staging/sprint-N`, `feature/F01-<slug>`, `fix/DEF03-<slug>`
- Release tags: `v0.1.0-sprint1`, `v0.2.0-sprint2`, `v0.3.0-rc1`, `v1.0.0`
- สถานะของ feature/AC: `PLANNED → SPECIFIED → IN PROGRESS → IMPLEMENTED → TESTED → ACCEPTED` (ถ้าไม่ครบใช้ `INCOMPLETE`)
- ผลของ test: `PASS / FAIL / SKIPPED / NOT RUN / INCOMPLETE` + commit SHA ที่ใช้รัน

## 6. โครงสร้าง repo
```
docs/srs.md                     Part A (D1) — FR/BR/NFR, actors, scope, exclusions, decisions
docs/features.md                feature inventory
docs/traceability.md            REQ → F → sprint → AC → TEST → file → result → version
docs/system-sds.md              architecture, data model, UI/API conventions, permission matrix, auth, config, deploy
docs/sprints/plan.md            แผน 3 sprint
docs/sprints/sprint-N/F01-<slug>.md   feature contract (ตาม template ด้านล่าง)
docs/dod.md                     Product Definition of Done
docs/changes.md                 CHG register + DEF register
docs/uat/                       UAT cases และผล re-test
docs/labs/lab5|lab6|lab7/       หลักฐานของ lab (แยกจากงาน feature)
docs/ai-use.md                  log การใช้ AI
docs/sessions/STATUS.md         สถานะและ handoff
docs/sessions/SESSION_PLAN.md   รายการ session
evidence/d1|d2|final/           output ของ test (red/green), build log, screenshots
submission/d1|d2|final/         ต้นฉบับ PDF
```

## 7. Template ของ feature contract
```
# F-0X <Name> — Sprint N
Linked: FR-.., BR-.., NFR-..   Status: ..   Owner: ..
## 1 Behavior & workflow (happy path, failure/boundary cases)
## 2 Business rules & validation
## 3 Permissions (role × operation × which records)
## 4 UI (screens, validation/loading/empty/error states)  — หรือระบุว่า "No change"
## 5 API (method, path, request, response, error shapes, status codes) — หรือ "No change"
## 6 Data (fields, constraints, migration) — หรือ "No change"
## 7 Acceptance criteria (AC-F0X-01 …) — รวม negative, boundary และ role restriction
## 8 STS: | TEST ID | AC | Level (unit/API-DB/E2E) | Precondition/Input | Action | Expected |
## 9 Done evidence: | AC | Test file::name | Result | Commit |
## 10 Revision history: | Ver | Date | Change | Reason/CHG |
```

## 8. Domain: Theme 7 — Personal Money and Expense Logging (สรุปจาก group_work_specs §6.7)
เนื้อหาทางการให้ยึดตาม `docs/srs.md` (เมื่อเขียนเสร็จแล้ว) ส่วนนี้เป็นกรอบที่ทุก session ต้องใช้ตรงกัน

**Account 5 ชนิด** (ทุก account มีเจ้าของคนเดียว)
| Type | ตัวอย่าง | ความหมายของ balance |
|---|---|---|
| CASH | กระเป๋าเงิน, บัญชีธนาคาร | เงินที่ถืออยู่ |
| LOAN_TAKEN | บัตรเครดิต, เงินที่ยืมมา | หนี้คงค้าง |
| LOAN_GIVEN | เงินที่ให้คนอื่นยืม | เงินที่คนอื่นค้างเรา |
| INCOME | เงินเดือน, ดอกเบี้ย | ยอดรายรับสะสมในช่วงเวลา |
| EXPENSE | อาหาร, ของใช้, ค่าไฟ, ค่าโทรศัพท์ | ยอดรายจ่ายสะสมในช่วงเวลา |

**Transaction 2 แบบ** แต่ละรายการมี allocation line ได้ตั้งแต่ 1 บรรทัดขึ้นไป
- **PAYMENT** (Make a payment / record a charge): บัญชีต้นทางเป็น CASH หรือ LOAN_TAKEN และ line ไปได้ที่
  - EXPENSE
  - LOAN_TAKEN (จ่ายคืนหนี้)
  - LOAN_GIVEN (ให้ยืม)
  - CASH (โอนออก)
- **RECEIPT** (Receive money): บัญชีปลายทางเป็น CASH และ line มาจาก
  - INCOME
  - LOAN_GIVEN (ได้รับเงินคืน)
  - LOAN_TAKEN (ยืมเพิ่ม)
  - CASH (โอนเข้า)

**Invariants** (ทุก feature ต้องรักษาไว้ และต้องมี test)
- ผลรวมของ allocation lines = total amount ตรงกันทุกสตางค์ และทุกจำนวนต้อง > 0
- ทุก transaction อัปเดต balance ของทุก account ที่เกี่ยวข้องให้ถูกต้องภายใน DB transaction เดียว (atomic)
- **การโอน, การยืม, การชำระหนี้ และ opening balance ห้ามนับเป็นรายรับหรือรายจ่าย** ในสรุป income/expense
- ทุก account ใน transaction ต้องเป็นของผู้ใช้ที่ login อยู่ และห้ามใช้บัญชีต้นทางซ้ำเป็น line ของตัวเอง
- ห้ามใช้ float กับเงิน ให้ใช้ integer หน่วยสตางค์ หรือ `DECIMAL(12,2)` อย่างใดอย่างหนึ่งทั้งระบบ สกุลเงินเดียวคือ THB
- วันที่ของรายการผู้ใช้กำหนดเองได้ ให้เก็บเวลาเป็น UTC แต่แสดงผลและตัดรอบเดือนตาม Asia/Bangkok

**Roles**
- **User:** จัดการได้เฉพาะ account, transaction, favorite และ summary ของตัวเอง
- **Administrator:** จัดการบัญชีผู้ใช้ของแพลตฟอร์มได้ (เปิด/ปิด) แต่ **ดูหรือแก้ข้อมูลการเงินของใครไม่ได้เลย** ต้องบังคับที่ backend และต้องมี test

**Out of scope:** period budget, shared budget, recurring transaction อัตโนมัติ, การเชื่อมต่อธนาคาร และ API ภายนอก

**คำถามที่ต้องตัดสินใจแล้วบันทึกไว้ใน SRS:**
- CASH ติดลบได้หรือไม่
- บัตรเครดิตมีวงเงินหรือไม่
- วันที่ในอนาคตใช้ได้หรือไม่
- แก้ไขรายการด้วยวิธี edit หรือ void แล้วสร้างใหม่
- account ที่มีรายการแล้วลบได้หรือต้อง archive
- ผู้ใช้ที่ถูกปิดบัญชี: session เดิมต้องหมดอายุทันทีหรือไม่
