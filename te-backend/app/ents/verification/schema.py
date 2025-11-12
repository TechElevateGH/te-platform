from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class VerificationCodeRequest(BaseModel):
    """Schema for requesting verification code resend"""

    email: EmailStr


class VerificationCodeVerify(BaseModel):
    """Schema for verifying email with code"""

    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern="^[0-9]{6}$")


class EmailChangeRequest(BaseModel):
    """Schema for requesting email change"""

    new_email: EmailStr
    password: str  # User must confirm with password


class EmailChangeVerify(BaseModel):
    """Schema for verifying email change with code"""

    new_email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern="^[0-9]{6}$")


class VerificationResponse(BaseModel):
    """Schema for verification responses"""

    success: bool
    message: str
    email_verified: Optional[bool] = None
