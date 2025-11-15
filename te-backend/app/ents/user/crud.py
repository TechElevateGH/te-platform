import random
import string
from datetime import datetime, timedelta
from typing import Optional, Tuple

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.database import Database

import app.core.security as security
import app.ents.user.models as user_models
import app.ents.user.schema as user_schema


PASSWORD_RESET_CODE_EXP_MINUTES = 15
PASSWORD_RESET_SESSION_EXP_MINUTES = 15
PASSWORD_RESET_REQUEST_COOLDOWN_SECONDS = 90
PASSWORD_RESET_MAX_ATTEMPTS = 5


def read_user_by_email(db: Database, *, email: str) -> Optional[user_models.MemberUser]:
    """Read user by email from MongoDB"""
    user_data = db.member_users.find_one({"email": email})
    if user_data:
        return user_models.MemberUser(**user_data)
    return None


def get_user_by_username(
    db: Database, *, username: str
) -> Optional[user_models.MemberUser]:
    """Read user by username from MongoDB (for Lead/Admin login)"""
    user_data = db.member_users.find_one({"username": username})
    if user_data:
        return user_models.MemberUser(**user_data)
    return None


def read_user_by_id(db: Database, *, id: str) -> Optional[user_models.MemberUser]:
    """Read user by ID from MongoDB"""

    try:
        user_data = db.member_users.find_one({"_id": ObjectId(id)})
        if user_data:
            return user_models.MemberUser(**user_data)
        return None
    except Exception:
        return None


def is_user_active(db: Database, *, user: user_models.MemberUser) -> bool:
    return user.is_active


def read_users_by_role(
    db: Database, *, role=0, skip: int = 0, limit: int = 100
) -> list[user_models.MemberUser]:
    """Read users by role from MongoDB"""
    users_data = db.member_users.find({"role": role}).skip(skip).limit(limit)
    return [user_models.MemberUser(**user) for user in users_data]


def read_all_member_users(db: Database) -> list[user_models.MemberUser]:
    """Read all member users from MongoDB (Admin only)"""
    users_data = db.member_users.find({})
    return [user_models.MemberUser(**user) for user in users_data]


def read_all_privileged_users(db: Database) -> list[dict]:
    """Read all privileged users from MongoDB (Admin only)"""
    users_data = db.privileged_users.find({"is_active": True}).sort("full_name", 1)

    result = []
    for user in users_data:
        result.append(
            {
                "id": str(user["_id"]),
                "_id": str(user["_id"]),
                "full_name": user.get("full_name", ""),
                "email": user.get("email", ""),
                "username": user.get("username"),
                "role": user.get("role"),
                "is_active": user.get("is_active", True),
            }
        )
    return result


def read_users_by_base_role(
    db: Database, *, role=0, skip: int = 0, limit: int = 100
) -> list[user_models.MemberUser]:
    """Read users by base role from MongoDB (role >= specified role)"""
    users_data = db.member_users.find({"role": {"$gte": role}}).skip(skip).limit(limit)
    return [user_models.MemberUser(**user) for user in users_data]


def get_user_full_name(first_name, middle_name, last_name) -> str:
    return f"{first_name} {middle_name} {last_name}"


def create_user(
    db: Database, *, data: user_schema.MemberUserCreate
) -> user_models.MemberUser:
    """Create a new user in MongoDB"""
    user = read_user_by_email(db, email=data.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email {data.email} already exists. Please sign in instead.",
        )

    # Hash the password
    hashed_password = security.get_password_hash(data.password)

    # Create user data dict
    user_dict = data.dict()
    user_dict["password"] = hashed_password
    user_dict["full_name"] = get_user_full_name(
        data.first_name, data.middle_name, data.last_name
    )
    user_dict["email_verified"] = False  # Start as unverified

    # Insert into MongoDB
    result = db.member_users.insert_one(user_dict)

    # Fetch and return the created user
    user_data = db.member_users.find_one({"_id": result.inserted_id})
    return user_models.MemberUser(**user_data)


def create_lead_user(db: Database, *, data: user_schema.LeadCreate) -> dict:
    """Create a new Lead/Admin account (Admin only) - uses provided token"""

    # Check if username already exists in privileged_users
    existing_user = db.privileged_users.find_one({"username": data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists"
        )

    # Create minimal privileged user data for Lead/Admin
    user_dict = {
        "username": data.username,
        "password": security.get_password_hash(data.token),  # Hash token as password
        "lead_token": data.token,  # Store plain token for Lead login
        "role": data.role,
        "is_active": True,
        "company_id": None,  # Not needed for Lead/Admin
    }

    # Insert into privileged_users collection
    result = db.privileged_users.insert_one(user_dict)

    # Fetch the created user
    user_data = db.privileged_users.find_one({"_id": result.inserted_id})
    user = user_models.PrivilegedUser(**user_data)

    # Return user info with credentials
    return {
        "user_id": str(user.id),
        "username": user.username,
        "role": user.role,
        "token": data.token,  # Return provided token for reference
    }


def create_referrer_user(db: Database, *, data: user_schema.ReferrerCreate) -> dict:
    """Create a new Referrer account (Admin only) - uses provided token and company"""
    # Check if username already exists in privileged_users
    existing_user = db.privileged_users.find_one({"username": data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists"
        )

    # Validate company_id exists
    if not ObjectId.is_valid(data.company_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid company ID"
        )

    company = db.companies.find_one({"_id": ObjectId(data.company_id)})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Company not found"
        )

    # Create privileged user data for Referrer
    user_dict = {
        "username": data.username,
        "password": security.get_password_hash(data.token),  # Hash token as password
        "lead_token": data.token,  # Store plain token for Referrer login
        "company_id": ObjectId(data.company_id),  # Store company they manage
        "company_name": data.company_name,  # Store company name from request
        "role": user_schema.UserRoles.referrer,  # Always Referrer role
        "is_active": True,
    }

    # Insert into privileged_users collection
    result = db.privileged_users.insert_one(user_dict)

    # Fetch the created user
    user_data = db.privileged_users.find_one({"_id": result.inserted_id})
    user = user_models.PrivilegedUser(**user_data)

    # Return user info with credentials
    return {
        "user_id": str(user.id),
        "username": user.username,
        "role": user.role,
        "company_id": data.company_id,
        "company_name": user.company_name,  # Use company_name from user object
        "token": data.token,  # Return provided token for reference
    }


def read_user_essay(db: Database, *, user_id: str) -> str:
    """Read user referral essay from MongoDB"""
    user = read_user_by_id(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user.referral_essay


def add_user_essay(db: Database, *, user_id: str, data: user_schema.Essay) -> str:
    """Add/update user referral essay in MongoDB"""

    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"referral_essay": data.essay}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return data.essay


def update_essay(db: Database, user_id: str, *, data) -> str:
    """Update user referral essay in MongoDB"""

    essay_text = data.get("essay")
    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"referral_essay": essay_text}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return essay_text


def read_user_cover_letter(db: Database, *, user_id: str) -> str:
    """Read user cover letter from MongoDB"""
    user = read_user_by_id(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user.cover_letter


def add_user_cover_letter(
    db: Database, *, user_id: str, data: user_schema.CoverLetter
) -> str:
    """Add/update user cover letter in MongoDB"""

    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"cover_letter": data.cover_letter}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return data.cover_letter


def update_user_profile(
    db: Database, *, user_id: str, data: user_schema.MemberUserUpdate
) -> user_models.MemberUser:
    """Update user profile in MongoDB"""

    # Get only the fields that were actually provided (exclude None values)
    update_data = data.dict(exclude_unset=True, exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
        )

    # Update the user
    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch and return the updated user
    user_data = db.member_users.find_one({"_id": ObjectId(user_id)})
    return user_models.MemberUser(**user_data)


def update_privileged_user(
    db: Database, *, user_id: str, data: user_schema.PrivilegedUserUpdate
) -> dict:
    """Update privileged user account (Admin only)"""

    # Validate user_id
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID"
        )

    # Check if user exists
    existing_user = db.privileged_users.find_one({"_id": ObjectId(user_id)})
    if not existing_user:
        raise HTTPException(status_code=404, detail="Privileged user not found")

    # Build update dictionary
    update_data = {}

    # Check username uniqueness if updating username
    if data.username is not None:
        username_exists = db.privileged_users.find_one(
            {"username": data.username, "_id": {"$ne": ObjectId(user_id)}}
        )
        if username_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists",
            )
        update_data["username"] = data.username

    # Hash and update token if provided
    if data.token is not None:
        update_data["password"] = security.get_password_hash(data.token)
        update_data["lead_token"] = data.token

    # Update is_active if provided
    if data.is_active is not None:
        update_data["is_active"] = data.is_active

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
        )

    # Update the privileged user
    result = db.privileged_users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Privileged user not found")

    # Fetch and return the updated user
    user_data = db.privileged_users.find_one({"_id": ObjectId(user_id)})
    user = user_models.PrivilegedUser(**user_data)

    return {
        "user_id": str(user.id),
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
        "company_id": str(user.company_id) if user.company_id else None,
    }


# ============= Password Reset Helpers =============


def _generate_reset_code() -> str:
    return "".join(random.choices(string.digits, k=6))


def _ensure_request_cooldown(db: Database, email: str) -> None:
    recent = db.password_resets.find_one(
        {
            "email": email,
            "created_at": {
                "$gt": datetime.utcnow()
                - timedelta(seconds=PASSWORD_RESET_REQUEST_COOLDOWN_SECONDS)
            },
            "status": {"$in": ["requested", "verified"]},
        }
    )
    if recent:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="A reset code was just sent. Please check your email before requesting another.",
        )


def create_password_reset_request(
    db: Database, *, user: user_models.MemberUser
) -> Tuple[user_models.PasswordReset, str]:
    email = user.email.lower()
    _ensure_request_cooldown(db, email)

    # Remove previous pending resets for this email
    db.password_resets.delete_many({"email": email, "status": {"$ne": "completed"}})

    now = datetime.utcnow()
    reset_data = {
        "email": email,
        "user_id": ObjectId(str(user.id)),
        "code": _generate_reset_code(),
        "status": "requested",
        "attempts": 0,
        "created_at": now,
        "expires_at": now + timedelta(minutes=PASSWORD_RESET_CODE_EXP_MINUTES),
    }

    result = db.password_resets.insert_one(reset_data)
    reset_doc = db.password_resets.find_one({"_id": result.inserted_id})
    reset_model = user_models.PasswordReset(**reset_doc)

    token = security.generate_password_reset_token(
        email=email,
        reset_id=str(reset_model.id),
        stage="request",
        expires_minutes=PASSWORD_RESET_CODE_EXP_MINUTES,
    )

    return reset_model, token


def verify_password_reset_code(
    db: Database,
    *,
    email: str,
    code: str,
    token: str,
) -> str:
    token_payload = security.verify_password_reset_token(token)
    if not token_payload or token_payload.get("stage") != "request":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if token_payload.get("email") != email:
        raise HTTPException(
            status_code=400, detail="Token does not match the provided email."
        )

    reset_id = token_payload.get("reset_id")
    if not reset_id or not ObjectId.is_valid(reset_id):
        raise HTTPException(status_code=400, detail="Invalid password reset request.")

    reset_doc = db.password_resets.find_one({"_id": ObjectId(reset_id)})
    if not reset_doc:
        raise HTTPException(status_code=404, detail="Password reset request not found.")

    reset = user_models.PasswordReset(**reset_doc)
    now = datetime.utcnow()

    if reset.status != "requested":
        raise HTTPException(
            status_code=400,
            detail="This reset code has already been used. Please request a new one.",
        )

    if now > reset.expires_at:
        db.password_resets.update_one(
            {"_id": reset.id}, {"$set": {"status": "expired", "completed_at": now}}
        )
        raise HTTPException(
            status_code=400, detail="Reset code expired. Please request a new code."
        )

    if reset.attempts >= PASSWORD_RESET_MAX_ATTEMPTS:
        db.password_resets.update_one(
            {"_id": reset.id}, {"$set": {"status": "locked", "completed_at": now}}
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed attempts. Please request a new reset code.",
        )

    if reset.code != code:
        remaining = max(0, PASSWORD_RESET_MAX_ATTEMPTS - (reset.attempts + 1))
        db.password_resets.update_one({"_id": reset.id}, {"$inc": {"attempts": 1}})
        raise HTTPException(
            status_code=400,
            detail=f"Invalid verification code. {remaining} attempts remaining.",
        )

    session_token = security.generate_password_reset_token(
        email=email,
        reset_id=str(reset.id),
        stage="verified",
        expires_minutes=PASSWORD_RESET_SESSION_EXP_MINUTES,
    )

    db.password_resets.update_one(
        {"_id": reset.id},
        {
            "$set": {
                "status": "verified",
                "verified_at": now,
                "session_expires_at": now
                + timedelta(minutes=PASSWORD_RESET_SESSION_EXP_MINUTES),
            }
        },
    )

    return session_token


def complete_password_reset(
    db: Database,
    *,
    token: str,
    new_password: str,
) -> None:
    token_payload = security.verify_password_reset_token(token)
    if not token_payload or token_payload.get("stage") != "verified":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    reset_id = token_payload.get("reset_id")
    if not reset_id or not ObjectId.is_valid(reset_id):
        raise HTTPException(status_code=400, detail="Invalid password reset request.")

    reset_doc = db.password_resets.find_one({"_id": ObjectId(reset_id)})
    if not reset_doc:
        raise HTTPException(status_code=404, detail="Password reset request not found.")

    reset = user_models.PasswordReset(**reset_doc)
    now = datetime.utcnow()

    if reset.status != "verified":
        raise HTTPException(status_code=400, detail="Reset request is no longer valid.")

    if reset.session_expires_at and now > reset.session_expires_at:
        db.password_resets.update_one(
            {"_id": reset.id}, {"$set": {"status": "expired", "completed_at": now}}
        )
        raise HTTPException(
            status_code=400, detail="Reset session expired. Please restart."
        )

    user_doc = db.member_users.find_one({"_id": reset.user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User account not found.")

    hashed_password = security.get_password_hash(new_password)
    db.member_users.update_one(
        {"_id": reset.user_id},
        {"$set": {"password": hashed_password, "email_verified": True}},
    )

    db.password_resets.update_one(
        {"_id": reset.id},
        {
            "$set": {
                "status": "completed",
                "completed_at": now,
            }
        },
    )


# def update(
#     db: Database,
#     *,
#     db_obj: user_models.MemberUser,
#     data: user_schema.MemberUserUpdate | dict[str, Any],
# ) -> user_models.MemberUser:
#     if isinstance(data, dict):
#         update_data = data
#     else:
#         update_data = data.dict(exclude_unset=True)
#     if update_data["password"]:
#         hashed_password = security.get_password_hash(update_data["password"])
#         del update_data["password"]
#         update_data["hashed_password"] = hashed_password
#     return super().update(db, db_obj=db_obj, data=update_data)
