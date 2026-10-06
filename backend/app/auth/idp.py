from typing import Annotated

from fastapi import Depends, HTTPException, status


def get_idp_verification() -> bool:
    # รองรับ IF-IDP-01 โดยเป็นจุดฉีดผลยืนยันที่ผ่านการตรวจจากระบบ IDP
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Identity verification is required",
    )


def require_verified_identity(
    verified: Annotated[bool, Depends(get_idp_verification)],
) -> None:
    # รองรับ IF-IDP-01 โดยปฏิเสธคำขอที่ไม่มีผลยืนยันตัวตน
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identity verification is required",
        )
