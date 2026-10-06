// test ตรวจว่าโครงหน้าจอพร้อมใช้ (ไม่ใช่ test ของ AC ใด)
import { render, screen } from '@testing-library/react'
import App from '../App.jsx'

test('โครงหน้าจอเปิดได้', async () => {
  render(<App />)
  expect(screen.getByText('ระบบจองคิวตรวจสุขภาพ')).toBeTruthy()
  expect(await screen.findByText('09:00')).toBeTruthy()
})
