from fastapi import APIRouter, Depends, FastAPI

from app.auth.idp import require_verified_identity

app = FastAPI()

# รองรับ IF-IDP-01 โดยคุม router สำหรับ endpoint ที่เข้าถึงข้อมูลผู้รับบริการ
protected_router = APIRouter(dependencies=[Depends(require_verified_identity)])

app.include_router(protected_router)
