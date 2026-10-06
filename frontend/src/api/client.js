// จุดเดียวที่หน้าจอใช้เรียก API หลังบ้าน (ตามสัญญา API ใน plan.md ข้อ 4)
// รองรับ FR-BKG-01 และ FR-BKG-06 ผ่าน GET /slots
const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export const api = {
  async getSlots({ dateFrom, packageCode }) {
    const q = new URLSearchParams({ date_from: dateFrom, package_code: packageCode })
    const res = await fetch(`${BASE}/slots?${q}`)
    if (!res.ok) throw new Error(`โหลดช่วงเวลาว่างไม่สำเร็จ (${res.status})`)
    return res.json()
  },
  async createBooking({ slotId }) {
    const res = await fetch(`${BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot_id: slotId }),
    })
    return { status: res.status, body: await res.json() }
  },
}

export const packages = [
  { code: 'general', name: 'แพ็กเกจตรวจสุขภาพทั่วไป' },
  { code: 'annual', name: 'แพ็กเกจตรวจสุขภาพประจำปี' },
]

function toDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTodayDateString() {
  return toDateString(new Date())
}

function getMockSlots({ dateFrom, packageCode }) {
  // รองรับ FR-BKG-01 และ FR-BKG-06 โดยจำลองช่วงเวลาของแพ็กเกจที่เลือก
  if (!dateFrom || !packages.some((item) => item.code === packageCode)) {
    throw new Error('ต้องระบุวันเริ่มต้นและแพ็กเกจที่ถูกต้อง')
  }

  const firstDate = new Date(`${dateFrom}T00:00:00`)
  if (Number.isNaN(firstDate.getTime())) {
    throw new Error('รูปแบบวันเริ่มต้นไม่ถูกต้อง')
  }

  return Array.from({ length: 30 }, (_, dayOffset) => {
    const slotDate = new Date(firstDate)
    slotDate.setDate(firstDate.getDate() + dayOffset)
    const slotDateString = toDateString(slotDate)

    return [
      {
        id: `${packageCode}-${slotDateString}-0900`,
        slot_date: slotDateString,
        start_time: '09:00',
        package_code: packageCode,
        remaining: 5,
      },
      {
        id: `${packageCode}-${slotDateString}-1000`,
        slot_date: slotDateString,
        start_time: '10:00',
        package_code: packageCode,
        remaining: 3,
      },
    ]
  }).flat()
}

// รองรับ FR-BKG-01 และ FR-BKG-06 เมื่อ Backend API ยังไม่พร้อม
export const mockApi = {
  getSlots: async (filters) => getMockSlots(filters),
  async createBooking({ slotId }) {
    const packageCode = packages.find(({ code }) => slotId.startsWith(`${code}-`))?.code
    const slotMatch = packageCode && slotId.match(
      new RegExp(`^${packageCode}-(\\d{4}-\\d{2}-\\d{2})-(\\d{4})$`),
    )
    if (!slotMatch) {
      throw new Error('ไม่พบช่วงเวลาที่เลือก')
    }
    const [, slotDate, timeCode] = slotMatch
    const selectedSlot = getMockSlots({
      dateFrom: slotDate,
      packageCode,
    }).find((slot) => slot.id === slotId)

    if (!selectedSlot) {
      throw new Error('ไม่พบช่วงเวลาที่เลือก')
    }

    if (timeCode === '0900') {
      const nextDate = new Date(`${selectedSlot.slot_date}T00:00:00`)
      nextDate.setDate(nextDate.getDate() + 1)
      const lastDate = toDateString(nextDate)
      const alternativeSlots = getMockSlots({
        dateFrom: selectedSlot.slot_date,
        packageCode: selectedSlot.package_code,
      })
        .filter((slot) =>
          slot.id !== slotId &&
          slot.slot_date <= lastDate &&
          slot.remaining > 0
        )
        .sort((left, right) => {
          const selectedAt = new Date(
            `${selectedSlot.slot_date}T${selectedSlot.start_time}:00`,
          ).getTime()
          const leftDistance = Math.abs(
            new Date(`${left.slot_date}T${left.start_time}:00`).getTime() - selectedAt,
          )
          const rightDistance = Math.abs(
            new Date(`${right.slot_date}T${right.start_time}:00`).getTime() - selectedAt,
          )
          return leftDistance - rightDistance ||
            left.slot_date.localeCompare(right.slot_date) ||
            left.start_time.localeCompare(right.start_time)
        })
        .slice(0, 3)

      return {
        status: 409,
        body: { detail: 'ช่วงเวลาเต็ม', alternatives: alternativeSlots },
      }
    }

    return { status: 201, body: { booking_id: `demo-${slotId}` } }
  },
}
