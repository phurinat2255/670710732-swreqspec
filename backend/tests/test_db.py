from sqlalchemy import inspect
from sqlalchemy.engine import Engine


def test_migration_creates_booking_tables_without_national_id(db_engine: Engine) -> None:
    # ตรวจ schema ที่รองรับ FR-BKG-01, FR-BKG-02, FR-BKG-04, DOM-PDPA-01 และ IF-HIS-01
    inspector = inspect(db_engine)
    assert set(inspector.get_table_names()) == {"slots", "bookings", "audit_logs"}

    booking_columns = {column["name"] for column in inspector.get_columns("bookings")}
    assert {
        "id",
        "hn",
        "slot_id",
        "booking_date",
        "queue_no",
        "status",
        "created_at",
    } <= booking_columns
    assert "national_id" not in booking_columns

    slot_columns = {column["name"] for column in inspector.get_columns("slots")}
    assert {
        "id",
        "slot_date",
        "start_time",
        "package_code",
        "capacity",
        "remaining",
    } <= slot_columns

    audit_columns = {column["name"] for column in inspector.get_columns("audit_logs")}
    assert {"id", "actor_id", "action", "hn", "accessed_at"} <= audit_columns
