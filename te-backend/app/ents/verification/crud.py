import random
import string
from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status
from pymongo.database import Database
from bson import ObjectId

import app.ents.verification.models as verification_models


def generate_verification_code() -> str:
    """Generate a random 6-digit verification code"""
    return "".join(random.choices(string.digits, k=6))


def create_verification_code(
    db: Database,
    *,
    email: str,
    verification_type: str,
    user_id: Optional[str] = None,
    new_email: Optional[str] = None,
) -> verification_models.EmailVerification:
    """
    Create a new verification code for an email address.

    Args:
        db: Database instance
        email: Email address to verify (or current email for email_change)
        verification_type: "registration" or "email_change"
        user_id: User ID if for existing user (email change)
        new_email: New email address if verification_type is "email_change"

    Returns:
        EmailVerification model instance
    """
    # Delete any existing unused codes for this email and type
    db.email_verifications.delete_many(
        {"email": email, "verification_type": verification_type, "is_used": False}
    )

    # If it's an email change, also delete codes for the new email
    if verification_type == "email_change" and new_email:
        db.email_verifications.delete_many(
            {
                "new_email": new_email,
                "verification_type": verification_type,
                "is_used": False,
            }
        )

    # Generate new code
    code = generate_verification_code()
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=15)  # Code expires in 15 minutes

    verification_data = {
        "email": email,
        "code": code,
        "user_id": ObjectId(user_id) if user_id else None,
        "verification_type": verification_type,
        "new_email": new_email,
        "created_at": now,
        "expires_at": expires_at,
        "is_used": False,
        "attempts": 0,
    }

    # Insert into MongoDB
    result = db.email_verifications.insert_one(verification_data)

    # Fetch and return the created verification
    verification_doc = db.email_verifications.find_one({"_id": result.inserted_id})
    return verification_models.EmailVerification(**verification_doc)


def verify_code(
    db: Database,
    *,
    email: str,
    code: str,
    verification_type: str,
    new_email: Optional[str] = None,
) -> bool:
    """
    Verify a code for an email address.

    Args:
        db: Database instance
        email: Email address being verified (or current email for email_change)
        code: 6-digit verification code
        verification_type: "registration" or "email_change"
        new_email: New email address if verification_type is "email_change"

    Returns:
        True if code is valid and not expired

    Raises:
        HTTPException if code is invalid, expired, or too many attempts
    """
    # Build query
    query = {
        "email": email,
        "verification_type": verification_type,
        "is_used": False,
    }

    if verification_type == "email_change" and new_email:
        query["new_email"] = new_email

    # Find the verification record
    verification_doc = db.email_verifications.find_one(query)

    if not verification_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No verification code found. Please request a new code.",
        )

    verification = verification_models.EmailVerification(**verification_doc)

    # Check if code has expired
    if datetime.utcnow() > verification.expires_at:
        # Mark as used so it can't be reused
        db.email_verifications.update_one(
            {"_id": verification.id}, {"$set": {"is_used": True}}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code.",
        )

    # Check attempts (max 5 attempts)
    if verification.attempts >= 5:
        # Mark as used after too many attempts
        db.email_verifications.update_one(
            {"_id": verification.id}, {"$set": {"is_used": True}}
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please request a new code.",
        )

    # Check if code matches
    if verification.code != code:
        # Increment attempts
        db.email_verifications.update_one(
            {"_id": verification.id}, {"$inc": {"attempts": 1}}
        )

        remaining_attempts = 5 - (verification.attempts + 1)
        if remaining_attempts > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {remaining_attempts} attempts remaining.",
            )
        else:
            # Mark as used after last attempt
            db.email_verifications.update_one(
                {"_id": verification.id}, {"$set": {"is_used": True}}
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code. Maximum attempts exceeded. Please request a new code.",
            )

    # Code is valid - mark as used
    db.email_verifications.update_one(
        {"_id": verification.id}, {"$set": {"is_used": True}}
    )

    return True


def get_active_verification(
    db: Database,
    *,
    email: str,
    verification_type: str,
) -> Optional[verification_models.EmailVerification]:
    """
    Get active (unused, not expired) verification code for an email.

    Args:
        db: Database instance
        email: Email address
        verification_type: "registration" or "email_change"

    Returns:
        EmailVerification if exists and valid, None otherwise
    """
    verification_doc = db.email_verifications.find_one(
        {
            "email": email,
            "verification_type": verification_type,
            "is_used": False,
            "expires_at": {"$gt": datetime.utcnow()},
        }
    )

    if verification_doc:
        return verification_models.EmailVerification(**verification_doc)
    return None


def cleanup_expired_codes(db: Database) -> int:
    """
    Delete all expired verification codes.

    Returns:
        Number of deleted records
    """
    result = db.email_verifications.delete_many(
        {"expires_at": {"$lt": datetime.utcnow()}}
    )
    return result.deleted_count
