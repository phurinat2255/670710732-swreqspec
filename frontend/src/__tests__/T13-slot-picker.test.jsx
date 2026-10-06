import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import SlotPicker from '../pages/SlotPicker'

const availableSlot = {
  id: 'general-0900',
  slot_date: '2026-10-06',
  start_time: '09:00',
  package_code: 'general',
  remaining: 5,
}

test('เปลี่ยนแพ็กเกจแล้วโหลดช่วงเวลาว่างใหม่และเลือกช่วงเวลาได้', async () => {
  const client = {
    getSlots: vi.fn(async ({ packageCode, dateFrom }) => [
      {
        ...availableSlot,
        id: `${packageCode}-0900`,
        package_code: packageCode,
        slot_date: dateFrom,
      },
    ]),
  }
  const onSlotSelect = vi.fn()

  render(<SlotPicker client={client} onSlotSelect={onSlotSelect} />)

  expect(await screen.findByText('09:00')).toBeTruthy()
  expect(client.getSlots).toHaveBeenLastCalledWith({
    dateFrom: expect.any(String),
    packageCode: 'general',
  })

  fireEvent.change(screen.getByLabelText('เลือกแพ็กเกจตรวจสุขภาพ'), {
    target: { value: 'annual' },
  })

  await waitFor(() => {
    expect(client.getSlots).toHaveBeenLastCalledWith({
      dateFrom: expect.any(String),
      packageCode: 'annual',
    })
  })

  fireEvent.click(screen.getByRole('button', { name: /09:00/ }))
  expect(onSlotSelect).toHaveBeenCalledWith(
    expect.objectContaining({ package_code: 'annual', remaining: 5 }),
  )
})

test('แสดงข้อผิดพลาดเมื่อโหลด API ไม่สำเร็จ', async () => {
  const client = {
    getSlots: vi.fn().mockRejectedValue(new Error('Backend ยังไม่พร้อม')),
  }

  render(<SlotPicker client={client} />)

  expect((await screen.findByRole('alert')).textContent).toContain('Backend ยังไม่พร้อม')
})
