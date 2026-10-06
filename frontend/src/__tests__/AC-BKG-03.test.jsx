import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'
import ConfirmBooking from '../pages/ConfirmBooking'

const selectedSlot = {
  id: 'general-2026-10-06-0900',
  slot_date: '2026-10-06',
  start_time: '09:00',
  package_code: 'general',
  remaining: 1,
}

const alternatives = [
  {
    id: 'same-day-1000',
    slot_date: '2026-10-06',
    start_time: '10:00',
    remaining: 2,
  },
  {
    id: 'next-day-0900',
    slot_date: '2026-10-07',
    start_time: '09:00',
    remaining: 3,
  },
  {
    id: 'next-day-1000',
    slot_date: '2026-10-07',
    start_time: '10:00',
    remaining: 4,
  },
]

test('AC-BKG-03: เมื่อ slot เต็ม แจ้งเตือนและแสดง 3 ทางเลือกโดยไม่สร้าง booking', async () => {
  const client = {
    getSlots: vi.fn().mockResolvedValue([selectedSlot]),
    createBooking: vi.fn().mockResolvedValue({
      status: 409,
      body: { detail: 'slot full', alternatives },
    }),
  }

  render(<ConfirmBooking slot={selectedSlot} client={client} />)
  fireEvent.click(screen.getByRole('button', { name: 'ยืนยันการจอง' }))

  expect((await screen.findByRole('alert')).textContent).toContain('ช่วงเวลาเต็ม')
  const options = await screen.findByRole('region', { name: 'ช่วงเวลาใกล้เคียง' })
  expect(options.querySelectorAll('li')).toHaveLength(3)
  expect(client.createBooking).toHaveBeenCalledTimes(1)
  expect(screen.queryByText('ระบบบันทึกคำขอจองแล้ว')).toBeNull()

  await waitFor(() => {
    const buttons = [...options.querySelectorAll('li button')]
    expect(buttons.map((button) => button.textContent)).toEqual([
      expect.stringContaining('2026-10-06 10:00'),
      expect.stringContaining('2026-10-07 09:00'),
      expect.stringContaining('2026-10-07 10:00'),
    ])
  })
})

test('App พาผู้ใช้จากการเลือก slot ไปหน้ายืนยัน', async () => {
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: /09:00/ }))
  expect(await screen.findByRole('heading', { name: 'ยืนยันการจอง' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'ยืนยันการจอง' }))

  expect((await screen.findByRole('alert')).textContent).toContain('ช่วงเวลาเต็ม')
  expect(
    await screen.findByRole('region', { name: 'ช่วงเวลาใกล้เคียง' }),
  ).toBeTruthy()
})

test('App แสดงผลสำเร็จด้วยหมายเลขคิวที่ API ส่งกลับมาโดยตรง', async () => {
  const queueNumber = 'queue-value-from-api'
  const client = {
    getSlots: vi.fn(async ({ dateFrom, packageCode }) => [{
      id: `${packageCode}-${dateFrom}-1000`,
      slot_date: dateFrom,
      start_time: '10:00',
      package_code: packageCode,
      remaining: 1,
    }]),
    createBooking: vi.fn().mockResolvedValue({
      status: 201,
      body: { booking_id: 'booking-1', queue_no: queueNumber },
    }),
  }
  render(<App client={client} />)
  fireEvent.click(await screen.findByRole('button', { name: /10:00/ }))
  fireEvent.click(screen.getByRole('button', { name: 'ยืนยันการจอง' }))

  expect(await screen.findByText(queueNumber)).toBeTruthy()
})
