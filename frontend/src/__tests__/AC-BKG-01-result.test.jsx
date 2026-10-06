import { render, screen } from '@testing-library/react'
import BookingResult from '../pages/BookingResult'

test('AC-BKG-01: แสดงหมายเลขคิวที่ได้รับจาก API โดยไม่เปลี่ยนรูปแบบ', () => {
  const queueNumber = 'queue-value-from-api'
  render(<BookingResult booking={{ booking_id: 'booking-1', queue_no: queueNumber }} />)

  expect(screen.getByText(queueNumber)).toBeTruthy()
})

test('AC-BKG-04: ยังแสดงหมายเลขคิวเมื่อส่งข้อความยืนยันไม่สำเร็จ', () => {
  const queueNumber = 'queue-value-from-api'
  render(
    <BookingResult
      booking={{ booking_id: 'booking-1', queue_no: queueNumber }}
      notificationFailed
    />,
  )

  expect(screen.getByText(queueNumber)).toBeTruthy()
  expect(screen.getByRole('alert').textContent).toContain('การจองสำเร็จ')
})
