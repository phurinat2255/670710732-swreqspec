import { useState } from 'react'
import { api, mockApi } from './api/client'
import ConfirmBooking from './pages/ConfirmBooking'
import BookingResult from './pages/BookingResult'
import SlotPicker from './pages/SlotPicker'

// รองรับ FR-BKG-01, FR-BKG-03, FR-BKG-04 และ FR-BKG-05
export default function App({ client: providedClient }) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const defaultClient =
    import.meta.env.VITE_USE_MOCK_API !== 'false' || import.meta.env.MODE === 'test'
      ? mockApi
      : api
  const client = providedClient ?? defaultClient
  const [booking, setBooking] = useState(null)

  if (booking) {
    return (
      <BookingResult
        booking={booking}
        onNewBooking={() => {
          setBooking(null)
          setSelectedSlot(null)
        }}
      />
    )
  }

  if (selectedSlot) {
    return (
      <ConfirmBooking
        slot={selectedSlot}
        client={client}
        onBack={() => setSelectedSlot(null)}
        onBookingCreated={setBooking}
      />
    )
  }

  return <SlotPicker client={client} onSlotSelect={setSelectedSlot} />
}