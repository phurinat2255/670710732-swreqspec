// รองรับ FR-BKG-04 และ FR-BKG-05 โดยแสดงหมายเลขคิวจากผล API โดยไม่แปลงรูปแบบ
export default function BookingResult({ booking, onNewBooking, notificationFailed = false }) {
  const queueNumber = booking?.queue_no

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-teal-800">ผลการจอง</h1>
      <p role="status" className="mt-4">การจองสำเร็จ</p>

      {queueNumber !== undefined && queueNumber !== null && queueNumber !== '' ? (
        <p className="mt-4 text-lg">
          หมายเลขคิว: <strong>{queueNumber}</strong>
        </p>
      ) : (
        <p className="mt-4">ผลการจองนี้ยังไม่มีหมายเลขคิว</p>
      )}

      {notificationFailed ? (
        <p role="alert" className="mt-4 text-amber-800">
          การจองสำเร็จ แม้ส่งข้อความยืนยันไม่สำเร็จ
        </p>
      ) : (
        <p className="mt-4 text-slate-600">
          การส่งข้อความยืนยันดำเนินการแยกจากการจอง
        </p>
      )}

      {onNewBooking && (
        <button
          type="button"
          onClick={onNewBooking}
          className="mt-6 rounded border px-4 py-2"
        >
          จองคิวใหม่
        </button>
      )}
    </main>
  )
}
