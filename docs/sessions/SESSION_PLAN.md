# Session Plan — CPE334 Group Project

วิธีใช้: เปิด chat หรือ session ใหม่ 1 อันต่อ 1 Session ID แล้ววาง **Kickoff** ของ session นั้น
Session ที่มีเครื่องหมาย ∥ ทำพร้อมกันได้ (คนละคน คนละ branch)
ถ้า session ไหนยาวเกินไป ให้ปิดที่จุดที่ commit ได้ อัปเดต STATUS.md แล้วเปิด session ต่อด้วย ID เดิมพร้อมเติม `-b`

---

## Template ที่ใช้ซ้ำ

### T-FEAT — Implement 1 feature ด้วย TDD
- **Inputs:** STATUS.md, contract ของ feature, `docs/system-sds.md` และโค้ดส่วนที่เกี่ยวข้อง
- **ขั้นตอน:**
  1. เปิด Issue โดยลิงก์ F-ID และไฟล์ contract
  2. สร้าง branch `feature/F0X-<slug>` จาก `staging/sprint-N`
  3. เขียน test ตาม STS → รันให้เห็นว่าล้ม → commit `test(F0X): red ...` และเก็บ output ไว้ที่ `evidence/<cp>/F0X-red.txt`
  4. Implement → รันจนผ่าน → commit `feat(F0X): ...` และเก็บ output ไว้ที่ `evidence/<cp>/F0X-green.txt`
  5. รัน suite ทั้งหมดเพื่อดู regression
  6. เปิด PR เข้า `staging/sprint-N` พร้อม review checklist ให้เพื่อนตรวจ
  7. กรอกตาราง "Done evidence" ใน contract
- **Done เมื่อ:** AC ทุกข้อมี test ที่ผ่าน, PR เปิดแล้วและรอเพื่อน review, STATUS.md อัปเดตแล้ว
- **Kickoff:** `Session <ID> (T-FEAT): implement F-0X ตาม docs/sprints/sprint-N/F0X-*.md อ่าน STATUS.md ก่อน`

### T-FIX — แก้ defect หรือ change
- ต้องมี `DEF-xx` หรือ `CHG-xx` ใน `docs/changes.md` ก่อน
- branch ชื่อ `fix/DEFxx-<slug>` → เขียน test ที่จำลอง defect (red) → แก้ (green) → PR → บันทึก fix release และผล re-test
- **Kickoff:** `Session <ID> (T-FIX): แก้ DEF-xx อ่าน STATUS.md และ docs/changes.md ก่อน`

### T-RELEASE — Integrate และออก release
- ตรวจว่า PR ของ feature ทุกตัว merge เข้า staging แล้ว → รัน build และ suite เต็มบน staging → acceptance check ตาม AC สำคัญ
- เปิด release PR `staging/sprint-N → main` ให้เพื่อน review → merge → tag
- เก็บคำสั่ง, commit SHA และจำนวน pass/fail/skip ไว้ที่ `evidence/<cp>/release-<tag>.txt` และอัปเดต README
- **Kickoff:** `Session <ID> (T-RELEASE): ออก release <tag> จาก staging/sprint-N`

### T-EVIDENCE — เก็บหลักฐานสำหรับ PDF
- ทำ shot list ตามเกณฑ์ของ checkpoint นั้น โดยแต่ละภาพมี caption: feature/AC IDs, role, starting conditions, ขั้นตอน, expected, actual, version
- ใส่หลักฐานจากฝั่ง API ด้วย (เช่น output ของ curl หรือ API test) ไม่ใช่แค่ภาพหน้า UI
- เลือก test excerpt 2 ท่อน (domain rule 1 และ access 1) พร้อมคู่ red/green
- ตาราง Issue/PR 2 ชุด: branch, author, reviewer, สาระของ review, merge เข้า staging และ main

### T-PDF — รวม PDF
- **Inputs:** docs ทั้งหมด, `evidence/<cp>/` และเกณฑ์ใน PDF ของ checkpoint นั้น
- หน้าแรกมีชื่อ–รหัสทั้งสองคน, ธีม, repo URL, tag/commit (D2 และ Final เพิ่ม URL ที่ deploy และ version) ต่อด้วยสารบัญพร้อมเลขหน้า และตาราง navigation ของแต่ละ Part (ช่วงหน้า + IDs)
- เรียง Part ตามหัวข้อของเกณฑ์**ทุกตัว** และใส่เอกสารเต็มลงใน PDF (ลิงก์อย่างเดียวไม่นับ)
- ท้ายเล่ม: ตาราง contribution, AI-use declaration, known limitations และ test ที่ fail/skip
- สุดท้ายเดินตาม Submission checklist ทีละข้อ แล้วรายงานข้อที่ยังขาด

---

## Phase 1 — Deliverable 1 (ส่ง 8 Nov 23:59)

| ID | เป้าหมาย | Inputs | Outputs | Done เมื่อ |
|---|---|---|---|---|
| D1-S1 | SRS (Part A) | group_work_specs_v1.pdf §5, §6.7 | `docs/srs.md` | มี actors, scope/exclusions, FR/BR ที่ test ได้, NFR ที่วัดผลได้พร้อมวิธีตรวจและ sprint ที่ตรวจ, assumptions/decisions |
| D1-S2 | Features + traceability + sprint plan (B, D) | srs.md | `features.md`, `traceability.md`, `sprints/plan.md` | FR/BR/NFR ทุกข้อมี feature + sprint, Sprint 1 เล็กแต่มี auth + 2 roles + rule 1 ข้อ, ระบุ coverage gap |
| D1-S3 | System SDS (C) | srs, features, repo/stack | `system-sds.md` | stack, data model + ER, migration/seed, UI/API conventions, ตาราง permission, auth/session, env/secrets, แผน GCP |
| D1-S4 | Sprint 1 contracts + DoD (E) | ข้างบนทั้งหมด | `sprints/sprint-1/F0X-*.md`, `dod.md`, GitHub Issues, branch `staging/sprint-1` | **commit `spec(...)` แล้วก่อนเริ่มเขียนโค้ด** |
| D1-S5 | Auth + roles (T-FEAT) | contract ของ auth | login/logout/current-user, seed accounts, test ของ valid/invalid login, unauth และ forbidden | PR เข้า staging |
| D1-S6 ∥ | Domain workflow + rule (T-FEAT) | contract ของ domain | journey ผ่าน UI→API→DB, rule rejection ที่เป็น TDD, E2E 1 journey | PR เข้า staging |
| D1-S7 | Release (T-RELEASE) + evidence (T-EVIDENCE) | ทุก PR ที่ review แล้ว | tag `v0.1.0-sprint1`, test log, screenshots, README | ทุกข้อใน shot list ของ D1 §4.2 ครบ |
| D1-S8 | PDF (T-PDF) | ทั้งหมด | `submission/d1/` → PDF | checklist ของ D1 §5 ครบทุกข้อ |

หมายเหตุ: D1-S6 ทำคู่กับ S5 ได้ ถ้าเขียน domain logic และ unit test ก่อนแล้วค่อยต่อ auth ทีหลัง ส่วน D1-S1 ถึง S3 ถ้าเวลาไม่พอให้เขียนแบบกระชับแต่ต้องครบทุกหัวข้อของเกณฑ์

### Sprint 1 ของธีม 7 (ขั้นต่ำตาม group_work_specs §6.7)
ใช้ร่างนี้เป็นจุดตั้งต้นของ D1-S2 และ D1-S4 (ปรับได้ แต่ห้ามบางกว่าตัวอย่างในสเปก)
- **Seed:** ผู้ใช้ 2 คนขึ้นไป, admin 1 คน และแต่ละคนมี bank account (CASH), บัตรเครดิต (LOAN_TAKEN), INCOME (Salary) และ EXPENSE (Dining, Groceries ฯลฯ)
- **F-01 Auth:** login/logout/me, ผู้ใช้ที่ถูกปิดบัญชี login ไม่ได้
- **F-02 Admin user access:** ดูรายชื่อผู้ใช้และเปิด/ปิดบัญชีได้ แต่เรียก API การเงินใดๆ แล้วต้องได้ 403
- **F-03 Opening balance:** ตั้งยอดเริ่มต้นของ bank และไม่นับเป็นรายรับ
- **F-04 Receive money:** บันทึกเงินเดือนเข้า bank → income เพิ่ม
- **F-05 Make payment/charge:** ใช้บัตรเครดิตจ่าย 1 รายการแบ่งเป็น line Dining + Groceries → หนี้บัตรเพิ่ม, และจ่ายคืนบัตรจาก bank → bank ลดและหนี้ลด โดยไม่นับเป็นรายจ่าย
- **F-06 Overview:** bank balance, หนี้บัตรคงค้าง, สรุป income/expense และประวัติรายการ
- **Rule ที่ต้องทำแบบ TDD:**
  - ผลรวมของ lines ≠ total → ถูกปฏิเสธ
  - จ่ายคืนหนี้หรือโอนต้องไม่เข้าสรุป income/expense
  - ชนิดของ account ต้องผิดกติกาของ form ไม่ได้ (เช่น RECEIPT เข้าบัตรเครดิตต้องถูกปฏิเสธ)
- **Access tests:**
  - ไม่ได้ login → 401
  - User A เปิด account หรือ transaction ของ B → 403/404
  - Admin เรียก API การเงิน → 403
  - User เรียก API ของ admin → 403
- Sprint 2 และ 3 (ตาม "Later sprints" ในสเปก): สร้าง/จัดการ account ครบ 5 ชนิด, ยืมและให้ยืมพร้อมการชำระคืน, transfer, จัดการ opening balance, แก้ไขรายการ, search/filter, favorite + duplicate, สรุปการใช้จ่ายตามหมวด และ reports

## Phase 2 — Lab 5 (ส่ง 15 Nov) Docker / CI/CD / GCP
ใช้ release ของ Sprint 1 เป็นตั้งต้น และเก็บหลักฐานไว้ที่ `docs/labs/lab5/`

| ID | เป้าหมาย | Done เมื่อ |
|---|---|---|
| L5-S1 | Dockerfile + compose (app + DB) และ config ทั้งหมดอยู่ใน env | fresh build แล้ว `docker compose up` รัน migration/seed ได้ |
| L5-S2 | CI: build + test ทุก PR และตั้ง branch protection | pipeline เขียว **และสาธิต check ที่ fail แล้วบล็อก merge ได้บน branch ชั่วคราว** (ห้ามทำ app ที่ release แล้วพัง) |
| L5-S3 | CD → GCP + DB ที่เก็บข้อมูลถาวร + secrets | URL ใช้งานได้, domain workflow วิ่งผ่าน UI/API/DB ได้, ข้อมูลยังอยู่หลัง restart/redeploy, แสดง version ที่ deploy |
| L5-S4 | ทดลองเส้นทางเต็ม: change ที่ review แล้ว → CI → merge → deploy | release commit ระบุตัวได้ และขั้นตอนทำซ้ำได้ |

## Phase 2b — Lab 6 (ส่ง 22 Nov) UAT ข้ามทีม
| ID | เป้าหมาย | Done เมื่อ |
|---|---|---|
| L6-S1 | เขียน UAT case ของระบบเรา ≥ 4 case: normal journey, domain rule/boundary, role/ownership, state/persistence + ส่งต่อบัญชีทดสอบและ version ให้ทีม partner | case แต่ละข้อมี ID, goal, precondition, steps, expected |
| L6-S2 | ทดสอบระบบของทีม partner บน version ที่ระบุ | มีผล PASS/FAIL, ชื่อ tester, version และหลักฐาน |
| L6-S3 | Triage findings ของระบบเรา → DEF register | ทุก finding มี severity และ decision พร้อมเหตุผล (accepted/duplicate/not-defect/enhancement) |
| L6-S4 | แก้ defect อย่างน้อย 1 ตัว (T-FIX) → CI → deploy → partner re-test | ครบ chain: regression test (red) → fix → PR review → deploy → re-test PASS |

## Phase 2c — Lab 7 (ส่ง 29 Nov) Maintenance
| ID | เป้าหมาย | Done เมื่อ |
|---|---|---|
| L7-S1 | ขอ change จาก TA → impact analysis → แก้ contract (เป็น revision ใหม่) | change request ชี้ไปที่ REQ/F/SDS/AC/test/code ที่กระทบ |
| L7-S2 | Implement change (T-FIX หรือ T-FEAT): test ที่เปลี่ยนต้องล้มก่อน → implement → regression → review → deploy | มีหลักฐาน red/green และ CI กับ deploy เขียว |
| L7-S3 | Metrics 5 ตัวพร้อมวันที่และแหล่งข้อมูล + release readiness + retrospective 3 ข้อ | ตีความไม่เกิน 100 คำ |

## Phase 3 — Deliverable 2 (ส่ง 29 Nov 23:59)

| ID | เป้าหมาย | Outputs | Done เมื่อ |
|---|---|---|---|
| D2-S1 | Sprint 2 contracts ทุก feature | `sprints/sprint-2/*.md`, Issues, `staging/sprint-2` | commit spec แล้วก่อนเขียนโค้ด |
| D2-S2…Sn ∥ | Sprint 2 features (T-FEAT ทีละ feature) | 1 session ต่อ 1 feature | AC ผ่านครบ และ PR ได้รับ review |
| D2-R1 | Sprint 2 release (T-RELEASE) | tag `v0.2.0-sprint2` + ตาราง completion ของ Sprint 2 | ทุก feature ของ Sprint 2 อยู่ในสถานะ ACCEPTED หรือมี CHG ที่อนุมัติแล้ว |
| D2-C1 | Lab 5–7 findings → CHG/DEF register | `docs/changes.md` | ทุก finding มีครบ: source, decision, status, fix release, re-test |
| D2-S3c | Sprint 3 contracts ของ feature ที่เหลือ**ทุกตัว** | `sprints/sprint-3/*.md` | มี UI/API/data ละเอียดพอจะคุม implementation |
| D2-S3i | Sprint 3 workflow แรก (T-FEAT) | 1 workflow หรือ rule ที่มีความหมาย | implement และ test ผ่านจริงใน RC |
| D2-T1 | อัปเดต SRS/features/SDS + traceability ฉบับเต็ม | `traceability.md` ทุกคอลัมน์ | ทุก AC บอกได้ว่า implemented หรือยัง และ test รันแล้วผ่านหรือยัง ห้ามใช้ test ที่ไม่เกี่ยวมานับเป็น coverage |
| D2-RC | RC + deploy + readiness | tag `v0.3.0-rc1`, CI run, post-deploy check, แผนงานที่เหลือพร้อม owner และวันที่ | version ที่ deploy ตรงกับ tag, ผ่าน regression ข้าม feature, Sprint 1 journey ยังใช้ได้ |
| D2-P | Evidence + PDF (T-EVIDENCE, T-PDF) | PDF ของ D2 | checklist ของ D2 §5 ครบ |

เป้าหมายของ phase นี้: ภายใน 29 Nov product ต้อง**เกือบเสร็จ** เพราะ 1–11 Dec เป็นช่วงสอบ

## Phase 4 — Final (ส่ง 13 Dec 23:59)

| ID | เป้าหมาย | Done เมื่อ |
|---|---|---|
| FN-S1…Sn ∥ | Sprint 3 features ที่เหลือ (T-FEAT) | ทุก feature อยู่ในสถานะ ACCEPTED หรือ INCOMPLETE ที่เปิดเผยตรงๆ |
| FN-U1 | UAT re-test (ใช้ case จาก Lab 6) + แก้ defect (T-FIX) | defect ระดับ critical ปิดแล้ว, ทุก re-test มีชื่อ tester, expected/actual และ version |
| FN-Q1 | Final regression + วัด NFR + access checks บน final commit | มี output ของ final commit พร้อมจำนวน pass/fail/skip และ NFR เทียบกับ target ที่ตั้งไว้ |
| FN-R1 | Final release + deploy (T-RELEASE) | tag `v1.0.0` ตรงกับ GCP, ข้อมูลยังอยู่หลัง restart/redeploy, post-deploy check |
| FN-T1 | Final traceability + DoD review + defect/debt register | ทุก requirement มีผลลัพธ์และ commit, debt แยกจากงานที่ยังไม่เสร็จ |
| FN-V1 | Script วิดีโอ + timestamps | demo ของจริงบน version ที่ deploy, มีทั้งสองคนในภาพ, มี rule rejection + failure case |
| FN-P | Evidence + PDF (T-EVIDENCE, T-PDF) | checklist ของ Final §5 ครบ + ลิงก์ YouTube (unlisted หรือเปิดให้ดูได้ด้วยลิงก์) |

⚠ **เอกสารขัดกันเรื่องวิดีโอ:**
- group_work_specs §9 ระบุไม่เกิน 10 นาที (8 คะแนน) + final release summary 1 หน้า (2 คะแนน)
- handout ของ Final §2 ระบุไม่เกิน 10 นาที แต่ §3.5 ระบุ**ไม่เกิน 4 นาที** (10 คะแนน)

ให้วางแผนไว้ที่ **≤ 4 นาที** ครอบคลุม workflow หลัก, business rule, failure/access case, architecture สั้นๆ และตัวอย่าง requirement → test 1 chain และใส่ **release summary 1 หน้า** ไว้หน้าแรกของ PDF ด้วย ทั้งหมดนี้ควรถามอาจารย์ให้ชัด
