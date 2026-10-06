import { useState } from 'react'
import { api as defaultApi } from '../api/client'

function sortAlternatives(alternatives, selectedSlot) {
  const selectedAt = new Date(
    `${selectedSlot.slot_date}T${selectedSlot.start_time}:00`,
  ).getTime()

  return [...alternatives]
    .sort((left, right) => {
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
}

// รองรับ FR-BKG-03 และ FR-BKG-04
export default function ConfirmBooking({
  slot,
  client = defaultApi,
  onBack,
  onBookingCreated,
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [alternatives, setAlternatives] = useState([])
  const [booking, setBooking] = useState(null)
  const [currentSlot, setCurrentSlot] = useState(slot)

  async function confirmBooking() {
    setSubmitting(true)
    setError('')
    setAlternatives([])

    try {
      const response = await client.createBooking({ slotId: currentSlot.id })
      if (response.status === 409) {
        const candidates =
          response.body.alternatives ??
          response.body.nearby_slots ??
          response.body.slots ??
          []
        setAlternatives(sortAlternatives(candidates, currentSlot))
        setError('ช่วงเวลาเต็ม')
        return
      }
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.body.detail || `ยืนยันการจองไม่สำเร็จ (${response.status})`)
      }
      setBooking(response.body)
      onBookingCreated?.(response.body)
    } catch (requestError) {
      setError(requestError.message || 'ยืนยันการจองไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  if (booking) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-teal-800">ส่งคำขอจองสำเร็จ</h1>
        <p role="status" className="mt-4">ระบบบันทึกคำขอจองแล้ว</p>
        <button type="button" onClick={onBack} className="mt-6 rounded border px-4 py-2">
          กลับไปเลือกช่วงเวลา
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-teal-800">ยืนยันการจอง</h1>
      <section className="mt-6 rounded border p-4" aria-label="รายละเอียดการจอง">
        <p>วันที่: {currentSlot.slot_date}</p>
        <p>เวลา: {currentSlot.start_time}</p>
        <p>แพ็กเกจ: {currentSlot.package_code}</p>
        <p>ที่นั่งคงเหลือ: {currentSlot.remaining}</p>
      </section>

      {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}

      {alternatives.length > 0 && (
        <section className="mt-6" aria-label="ช่วงเวลาใกล้เคียง">
          <h2 className="font-semibold">ช่วงเวลาว่างใกล้เคียง</h2>
          <ol className="mt-3 space-y-2">
            {alternatives.map((alternative) => (
              <li key={alternative.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSlot(alternative)
                    setAlternatives([])
                    setError('')
                  }}
                  className="w-full rounded border p-3 text-left"
                >
                  {alternative.slot_date} {alternative.start_time}
                  {' — '}เหลือ {alternative.remaining} ที่นั่ง
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded border px-4 py-2"
          disabled={submitting}
        >
          กลับ
        </button>
        <button
          type="button"
          onClick={confirmBooking}
          className="rounded bg-teal-700 px-4 py-2 text-white"
          disabled={submitting}
        >
          {submitting ? 'กำลังยืนยัน…' : 'ยืนยันการจอง'}
        </button>
      </div>
    </main>
  )
}
