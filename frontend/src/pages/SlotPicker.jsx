import { useEffect, useState } from 'react'
import { api, getTodayDateString, mockApi, packages } from '../api/client'

function getLastAvailableDate() {
  const lastDate = new Date(`${getTodayDateString()}T00:00:00`)
  lastDate.setDate(lastDate.getDate() + 29)
  const year = lastDate.getFullYear()
  const month = String(lastDate.getMonth() + 1).padStart(2, '0')
  const day = String(lastDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// รองรับ FR-BKG-01 และ FR-BKG-06
export default function SlotPicker({ client, onSlotSelect }) {
  const useMockApi =
    import.meta.env.VITE_USE_MOCK_API !== 'false' || import.meta.env.MODE === 'test'
  const defaultClient = useMockApi ? mockApi : api
  const slotsApi = client ?? defaultClient
  const [packageCode, setPackageCode] = useState(packages[0].code)
  const [dateFrom, setDateFrom] = useState(getTodayDateString)
  const [slots, setSlots] = useState([])
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    slotsApi.getSlots({ dateFrom, packageCode })
      .then((availableSlots) => {
        if (active) setSlots(availableSlots)
      })
      .catch((requestError) => {
        if (active) {
          setSlots([])
          setError(requestError.message || 'ไม่สามารถโหลดช่วงเวลาว่างได้')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slotsApi, dateFrom, packageCode])

  const daySlots = slots.filter((slot) => slot.slot_date === dateFrom)

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-teal-800">
        ระบบจองคิวตรวจสุขภาพ
      </h1>

      <div className="mt-6">
        <label htmlFor="package" className="block font-medium">
          เลือกแพ็กเกจตรวจสุขภาพ
        </label>
        <select
          id="package"
          value={packageCode}
          onChange={(event) => {
            setPackageCode(event.target.value)
            setSelectedSlotId(null)
          }}
          className="mt-2 w-full rounded border p-2"
        >
          {packages.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        <label htmlFor="booking-date" className="block font-medium">
          เลือกวันที่ตรวจสุขภาพ
        </label>
        <input
          id="booking-date"
          type="date"
          min={getTodayDateString()}
          max={getLastAvailableDate()}
          value={dateFrom}
          onChange={(event) => {
            setDateFrom(event.target.value)
            setSelectedSlotId(null)
          }}
          className="mt-2 w-full rounded border p-2"
        />
      </div>

      <section className="mt-6" aria-labelledby="available-slots">
        <h2 id="available-slots" className="font-semibold">
          ช่วงเวลาที่ว่าง
        </h2>
        {loading && <p role="status" className="mt-3">กำลังโหลดช่วงเวลาว่าง…</p>}
        {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
        {!loading && !error && daySlots.length === 0 && (
          <p className="mt-3">ไม่มีช่วงเวลาว่างในวันที่เลือก</p>
        )}
        {!loading && !error && daySlots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            aria-pressed={selectedSlotId === slot.id}
            onClick={() => {
              setSelectedSlotId(slot.id)
              onSlotSelect?.(slot)
            }}
            className={`mt-3 block w-full rounded border p-4 text-left ${
              selectedSlotId === slot.id ? 'border-teal-700 bg-teal-50' : ''
            }`}
          >
            <span className="block">{slot.start_time}</span>
            <span className="block text-sm text-slate-600">
              เหลือ {slot.remaining} ที่นั่ง
            </span>
          </button>
        ))}
      </section>
    </main>
  )
}
