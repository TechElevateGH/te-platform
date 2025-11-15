from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

import app.database.session as session
import app.ents.verification.crud as verification_crud
import app.ents.verification.schema as verification_schema
import app.ents.user.crud as user_crud
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
from app.utilities.email import send_verification_email
from app.core.security import verify_password

router = APIRouter(prefix="/verification", tags=["Email Verification"])


@router.post("/send-code", response_model=verification_schema.VerificationResponse)
def send_verification_code(
    *,
    db: Database = Depends(session.get_db),
    data: verification_schema.VerificationCodeRequest,
) -> Any:
    """
    Send or resend verification code to email address.

    This endpoint can be used:
    - During registration (if user hasn't verified yet)
    - To resend expired codes

    **Public endpoint** - no authentication required
    """
    # Check if user exists
    user = user_crud.read_user_by_email(db, email=data.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    # Check if already verified
    if user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already verified."
        )

    # Create new verification code
    verification = verification_crud.create_verification_code(
        db,
        email=data.email,
        verification_type="registration",
        user_id=str(user.id),
    )

    # Send email
    try:
        send_verification_email(data.email, verification.code, "registration")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}",
        )

    return verification_schema.VerificationResponse(
        success=True,
        message="Verification code sent to your email. Please check your inbox.",
    )


@router.post("/verify-email", response_model=verification_schema.VerificationResponse)
def verify_email(
    *,
    db: Database = Depends(session.get_db),
    data: verification_schema.VerificationCodeVerify,
) -> Any:
    """
    Verify email address with code.

    Validates the 6-digit code and marks the user's email as verified.

    **Public endpoint** - no authentication required
    """
    # Check if user exists
    user = user_crud.read_user_by_email(db, email=data.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    # Check if already verified
    if user.email_verified:
        return verification_schema.VerificationResponse(
            success=True, message="Email is already verified.", email_verified=True
        )

    # Verify the code
    try:
        verification_crud.verify_code(
            db,
            email=data.email,
            code=data.code,
            verification_type="registration",
        )
    except HTTPException:
        raise

    # Mark user as verified
    db.member_users.update_one({"_id": user.id}, {"$set": {"email_verified": True}})

    return verification_schema.VerificationResponse(
        success=True,
        message="Email verified successfully! You can now log in.",
        email_verified=True,
    )


@router.post(
    "/request-email-change", response_model=verification_schema.VerificationResponse
)
def request_email_change(
    *,
    db: Database = Depends(session.get_db),
    data: verification_schema.EmailChangeRequest,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Request email change by sending verification code to new email.

    User must provide their password to confirm the change request.

    **Requires authentication**
    """
    # Verify password
    if not verify_password(data.password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password."
        )

    # Check if new email is already in use
    existing_user = user_crud.read_user_by_email(db, email=data.new_email)
    if existing_user and str(existing_user.id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email address is already in use.",
        )

    # Don't allow changing to same email
    if data.new_email.lower() == current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New email must be different from current email.",
        )

    # Create verification code for email change
    verification = verification_crud.create_verification_code(
        db,
        email=current_user.email,  # Current email
        verification_type="email_change",
        user_id=str(current_user.id),
        new_email=data.new_email,  # New email
    )

    # Send verification code to NEW email address
    try:
        send_verification_email(data.new_email, verification.code, "email_change")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}",
        )

    return verification_schema.VerificationResponse(
        success=True,
        message=f"Verification code sent to {data.new_email}. Please check your inbox.",
    )


@router.post(
    "/verify-email-change", response_model=verification_schema.VerificationResponse
)
def verify_email_change(
    *,
    db: Database = Depends(session.get_db),
    data: verification_schema.EmailChangeVerify,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Verify email change with code and update user's email.

    Validates the code sent to the new email address and updates the user's email.

    **Requires authentication**
    """
    # Verify the code
    try:
        verification_crud.verify_code(
            db,
            email=current_user.email,
            code=data.code,
            verification_type="email_change",
            new_email=data.new_email,
        )
    except HTTPException:
        raise

    # Update user's email (normalize to lowercase)
    db.member_users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "email": data.new_email.lower(),  # Normalize email to lowercase
                "email_verified": True,  # New email is now verified
            }
        },
    )

    return verification_schema.VerificationResponse(
        success=True, message="Email updated successfully!", email_verified=True
    )
