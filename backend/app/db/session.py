from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker


def create_database_engine(database_url: str) -> Engine:
    # รองรับ CON-TECH-01 โดยเชื่อมต่อฐานข้อมูลตาม DATABASE_URL ที่กำหนด
    return create_engine(database_url)


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    # รองรับ CON-TECH-01 ด้วย session ของ SQLAlchemy
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)
