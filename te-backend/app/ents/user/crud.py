import app.core.security as security
import app.ents.user.models as user_models
import app.ents.user.schema as user_schema
from typing import Optional
from fastapi import HTTPException, status
from pymongo.database import Database


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
    from bson import ObjectId

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


def read_all_users(db: Database) -> list[user_models.MemberUser]:
    """Read all users from MongoDB (Admin only)"""
    users_data = db.member_users.find({})
    return [user_models.MemberUser(**user) for user in users_data]


def read_all_privileged_users(db: Database) -> list[dict]:
    """Read all privileged users from MongoDB (Admin only)"""
    users_data = db.privileged_users.find({})
    result = []
    for user in users_data:
        result.append(
            {
                "id": str(user["_id"]),
                "_id": str(user["_id"]),
                "username": user.get("username"),
                "role": user.get("role"),
                "is_active": user.get("is_active", True),
                "company_id": str(user["company_id"])
                if user.get("company_id")
                else None,
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
            detail={
                "error": {
                    "email": data.email,
                    "message": "The user with this email already exists!",
                }
            },
        )

    # Hash the password
    hashed_password = security.get_password_hash(data.password)

    # Create user data dict
    user_dict = data.dict()
    user_dict["password"] = hashed_password
    user_dict["full_name"] = get_user_full_name(
        data.first_name, data.middle_name, data.last_name
    )

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
    from bson import ObjectId

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
        "company_name": company.get("name", ""),
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
    from bson import ObjectId

    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"referral_essay": data.essay}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return data.essay


def update_essay(db: Database, user_id: str, *, data) -> str:
    """Update user referral essay in MongoDB"""
    from bson import ObjectId

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
    from bson import ObjectId

    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"cover_letter": data.cover_letter}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return data.cover_letter


def add_resume_file_id(db: Database, *, user_id: str, file_id: str) -> None:
    """Add resume file ID to user's resume_file_ids list in MongoDB"""
    from bson import ObjectId

    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$addToSet": {"resume_file_ids": file_id}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")


def remove_resume_file_id(db: Database, *, user_id: str, file_id: str) -> None:
    """Remove resume file ID from user's resume_file_ids list in MongoDB"""
    from bson import ObjectId

    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$pull": {"resume_file_ids": file_id}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")


def update_user_profile(
    db: Database, *, user_id: str, data: user_schema.MemberUserUpdate
) -> user_models.MemberUser:
    """Update user profile in MongoDB"""
    from bson import ObjectId

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
    from bson import ObjectId

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
