from fastapi import FastAPI, APIRouter, Depends
from fastapi.testclient import TestClient

from app.auth.idp import get_idp_verification, require_verified_identity


def create_test_client(verified: bool | None) -> TestClient:
    # รองรับ IF-IDP-01 โดยจำลอง endpoint ที่เข้าถึงข้อมูลผู้รับบริการ
    router = APIRouter(dependencies=[Depends(require_verified_identity)])
    router.add_api_route("/patient-data", lambda: {"ok": True}, methods=["GET"])
    test_app = FastAPI()
    test_app.include_router(router)

    if verified is not None:
        test_app.dependency_overrides[get_idp_verification] = lambda: verified

    return TestClient(test_app)


def test_endpoint_rejects_missing_identity_verification() -> None:
    response = create_test_client(None).get("/patient-data")

    assert response.status_code == 401


def test_endpoint_rejects_failed_identity_verification() -> None:
    response = create_test_client(False).get("/patient-data")

    assert response.status_code == 401


def test_endpoint_accepts_verified_identity() -> None:
    response = create_test_client(True).get("/patient-data")

    assert response.status_code == 200
    assert response.json() == {"ok": True}
