from sqlalchemy import Engine

from app.db.models import Base


def upgrade(engine: Engine) -> None:
    # รองรับ CON-TECH-01 และสร้างตารางตาม FR-BKG-01, FR-BKG-02, FR-BKG-04, DOM-PDPA-01 และ IF-HIS-01
    Base.metadata.create_all(bind=engine)
