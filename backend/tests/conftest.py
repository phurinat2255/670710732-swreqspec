from pathlib import Path
from runpy import run_path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine


@pytest.fixture
def db_engine() -> Engine:
    # รองรับ CON-TECH-01 ด้วยฐานข้อมูล SQLite ในหน่วยความจำสำหรับการทดสอบ
    engine = create_engine("sqlite:///:memory:")
    migration_path = (
        Path(__file__).parents[1] / "app" / "db" / "migrations" / "001_init.py"
    )
    run_path(str(migration_path))["upgrade"](engine)
    yield engine
    engine.dispose()
