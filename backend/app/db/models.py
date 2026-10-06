from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Time
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    # รองรับ CON-TECH-01 ผ่าน metadata ของ SQLAlchemy
    pass


class Slot(Base):
    # รองรับ FR-BKG-01 และ FR-BKG-06
    __tablename__ = "slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slot_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    package_code: Mapped[str] = mapped_column(String, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    remaining: Mapped[int] = mapped_column(Integer, nullable=False)


class Booking(Base):
    # รองรับ FR-BKG-02, FR-BKG-04 และ IF-HIS-01
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    hn: Mapped[str] = mapped_column(String, nullable=False)
    slot_id: Mapped[int] = mapped_column(ForeignKey("slots.id"), nullable=False)
    booking_date: Mapped[date] = mapped_column(Date, nullable=False)
    queue_no: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class AuditLog(Base):
    # รองรับ DOM-PDPA-01
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    actor_id: Mapped[str] = mapped_column(String, nullable=False)
    action: Mapped[str] = mapped_column(String, nullable=False)
    hn: Mapped[str] = mapped_column(String, nullable=False)
    accessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
