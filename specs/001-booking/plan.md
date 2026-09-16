# Plan: จองคิวตรวจสุขภาพ (Booking)

อ้างอิง: `specs/001-booking/spec.md` (SPEC-BKG-001)

1. สรุปแนวทาง
- ฟีเจอร์นี้ให้ผู้รับบริการที่ยืนยันตัวตนแล้ว เลือกแพ็กเกจ วัน และช่วงเวลาตรวจสุขภาพ และได้รับหมายเลขคิวพร้อมข้อความยืนยัน
- ผู้ใช้: ผู้รับบริการ (patient) และระบบแจ้งเตือนภายนอก (SMS/LINE)
- แนวทาง: Backend ให้บริการ API สำหรับค้น availability และสร้าง booking แบบ transactional; worker แยกสำหรับส่งข้อความแบบ asynchronous และ retry; UI เรียก API เพื่อแสดงผลและยืนยันการจอง
- เน้นความปลอดภัยตาม DOM-PDPA-01 และประสิทธิภาพตาม NFR-PERF-01
- ทุกการตัดสินใจเชิงนโยบายต้องเป็น ASM หรือ Q หากทีมตัดสินใจ

2. เทคโนโลยีที่ใช้

สิ่งที่เลือก | มาจาก | หมายเหตุ
---|---|---
MySQL | CON-TECH-01 | ถูกบังคับโดย Constraint
Python (FastAPI) | ทีมเลือกเอง ไม่ได้มาจาก spec | Backend API, เหมาะกับการสร้างบริการ REST และ worker
React (Vite) | ทีมเลือกเอง ไม่ได้มาจาก spec | Frontend สำหรับหน้าจอการจอง (ถ้าต้องการ UI web)
Redis (cache/lock) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้สำหรับ caching availability และ distributed lock ของ queue-number

3. โมเดลข้อมูล (entity หลัก)

- `time_slots` — รองรับ: FR-BKG-01
  - id, date, start_time, end_time, capacity, remaining_seats, created_at, updated_at

- `bookings` — รองรับ: FR-BKG-04, FR-BKG-02, FR-BKG-06
  - id, hn (อ้างอิงจาก IF-HIS-01), user_id (internal), package_id, time_slot_id, queue_number, status(enum: pending, confirmed, cancelled), created_at
  - หมายเหตุ: ห้ามเก็บเลขบัตรประชาชน ตาม IF-HIS-01

- `notification_queue` — รองรับ: IF-NOT-01, FR-BKG-05, NFR-REL-02
  - id, booking_id, channel(enum: sms,line), payload, attempts, next_attempt_at, status(enum: pending, sent, failed), created_at

- `audit_logs` — รองรับ: DOM-PDPA-01, AC-BKG-06
  - id, actor, action, resource_type, resource_id, hn(optional), timestamp, metadata

- `packages` — รองรับ: FR-BKG-06
  - id, name, allowed_time_slots (nullable/criteria), created_at

4. API / หน้าจอ (หลัก)

- `GET /availability?start=YYYY-MM-DD&days=30` — คืนรายการวันที่และช่วงเวลาพร้อม `remaining_seats` (FR-BKG-01, NFR-PERF-01)
- `POST /bookings` {hn, package_id, time_slot_id} — สร้างการจองแบบ transactional คืน `queue_number` หรือ error (FR-BKG-04, FR-BKG-02, FR-BKG-03, FR-BKG-06)
- `GET /bookings/{id}` — คืนข้อมูลการจองและสถานะ (FR-BKG-04)
- `GET /users/{user_id}/bookings?date=` — ตรวจสอบคิวที่ยังไม่ได้ใช้ในวันเดียวกัน (FR-BKG-02)

5. ตารางตรวจ Constraints

Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ
---|---|---
CON-TECH-01 | Database: MySQL, migrations, schema | ใช้แล้ว
DOM-PDPA-01 | `audit_logs` และไม่เก็บเลขบัตรประชาชนใน `bookings` | ใช้แล้ว
IF-IDP-01 | Precondition ก่อนสร้าง booking — ตรวจ token จาก IDP | ใช้แล้ว
IF-HIS-01 | ค้น HN จาก HIS ก่อน mapping user; ห้ามเก็บเลขบัตรประชาชน | ใช้แล้ว
IF-NOT-01 | `notification_queue` + worker ส่งแบบ async; booking ไม่รอผลการส่ง | ใช้แล้ว

6. แผนทดสอบจาก Acceptance Criteria

AC ID | ชื่อ test | ทดสอบอย่างไร
---|---|---
AC-BKG-01 | test_AC_BKG_01_successful_booking | setup: time_slot 09:00 remaining_seats=1, ทำ POST /bookings -> assert booking persisted, queue_number returned, remaining_seats==0
AC-BKG-02 | test_AC_BKG_02_reject_duplicate_same_day | create existing booking for user same-day, POST /bookings -> assert 409/ปฏิเสธ และ response มีหมายเลขคิวเดิม
AC-BKG-03 | test_AC_BKG_03_slot_full_concurrent | simulate 2 concurrent confirmations for last seat -> assert one success and other receives "ช่วงเวลาเต็ม" พร้อม 3 ตัวเลือก (ASM-03)
AC-BKG-04 | test_AC_BKG_04_notification_retry_queue | simulate notification system down -> POST /bookings persists booking, notification_queue entry created with next_attempt_at within 5 minutes (ตาม NFR)
AC-BKG-05 | test_AC_BKG_05_performance_availability | load test `GET /availability` with 200 concurrent users -> measure p95 <= 2s
AC-BKG-06 | test_AC_BKG_06_audit_log | access booking info -> assert audit_logs entryมี actor, timestamp, hn

7. ลำดับงาน (5-10 ขั้น)

1. ออกแบบ schema และ migration (`time_slots`, `bookings`, `notification_queue`, `audit_logs`) — (FR-BKG-01, FR-BKG-04, DOM-PDPA-01)
2. สร้าง adapter mock สำหรับ HIS/IDP/Notification และ contract tests — (IF-HIS-01, IF-IDP-01, IF-NOT-01)
3. พัฒนา `GET /availability` พร้อม cache และ unit tests — (FR-BKG-01, NFR-PERF-01)
4. พัฒนา `POST /bookings` transactional flow พร้อม queue-number generator และ concurrency tests — (FR-BKG-04, FR-BKG-02, FR-BKG-03)
5. พัฒนา worker สำหรับ `notification_queue` และ retry logic — (FR-BKG-05, NFR-REL-02)
6. เขียน integration tests ครอบ AC-BKG-01..06 และแก้บั๊กที่พบ — (ACs)
7. ทำ load test และปรับ tuning (DB indexes, caching) — (AC-BKG-05)
8. เตรียม docs, runbook และ PR สำหรับ review — (ทั่วไป)

8. สิ่งที่ยังไม่ทำ (Open Questions)

- Q-02 หมายเลขคิวรีเซ็ตรายวัน หรือนับต่อเนื่อง? — ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ (ถาม: เจ้าหน้าที่เวชระเบียน)
