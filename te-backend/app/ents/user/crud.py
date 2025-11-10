import app.core.security as security
import app.ents.user.models as user_models
import app.ents.user.schema as user_schema
from typing import Optional
from fastapi import HTTPException, status
from pymongo.database import Database


def read_user_by_email(db: Database, *, email: str) -> Optional[user_models.User]:
    """Read user by email from MongoDB"""
    user_data = db.users.find_one({"email": email})
    if user_data:
        return user_models.User(**user_data)
    return None


def get_user_by_username(db: Database, *, username: str) -> Optional[user_models.User]:
    """Read user by username from MongoDB (for Lead/Admin login)"""
    user_data = db.users.find_one({"username": username})
    if user_data:
        return user_models.User(**user_data)
    return None


def read_user_by_id(db: Database, *, id: str) -> Optional[user_models.User]:
    """Read user by ID from MongoDB"""
    from bson import ObjectId

    try:
        user_data = db.users.find_one({"_id": ObjectId(id)})
        if user_data:
            return user_models.User(**user_data)
        return None
    except Exception:
        return None


def is_user_active(db: Database, *, user: user_models.User) -> bool:
    return user.is_active


def read_users_by_role(
    db: Database, *, role=0, skip: int = 0, limit: int = 100
) -> list[user_models.User]:
    """Read users by role from MongoDB"""
    users_data = db.users.find({"role": role}).skip(skip).limit(limit)
    return [user_models.User(**user) for user in users_data]


def read_users_by_base_role(
    db: Database, *, role=0, skip: int = 0, limit: int = 100
) -> list[user_models.User]:
    """Read users by base role from MongoDB (role >= specified role)"""
    users_data = db.users.find({"role": {"$gte": role}}).skip(skip).limit(limit)
    return [user_models.User(**user) for user in users_data]


def get_user_full_name(first_name, middle_name, last_name) -> str:
    return f"{first_name} {middle_name} {last_name}"


def create_user(db: Database, *, data: user_schema.UserCreate) -> user_models.User:
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
    result = db.users.insert_one(user_dict)

    # Fetch and return the created user
    user_data = db.users.find_one({"_id": result.inserted_id})
    return user_models.User(**user_data)


def create_lead_user(db: Database, *, data: user_schema.LeadCreate) -> dict:
    """Create a new Lead account (Admin only) - generates a secure token"""
    import secrets
    
    # Check if username already exists
    existing_user = get_user_by_username(db, username=data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    existing_email = read_user_by_email(db, email=data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Generate secure token (32 characters alphanumeric)
    lead_token = secrets.token_urlsafe(32)
    
    # Create user data
    user_dict = {
        "username": data.username,
        "email": data.email,
        "first_name": data.first_name,
        "middle_name": "",
        "last_name": data.last_name,
        "full_name": data.full_name or f"{data.first_name} {data.last_name}",
        "password": security.get_password_hash(lead_token),  # Store hashed token as password
        "lead_token": lead_token,  # Store plain token for Lead login
        "role": data.role,
        "is_active": True,
        "image": "",
        "date_of_birth": "",
        "contact": "",
        "address": "",
        "university": "",
        "start_date": "",
        "end_date": "",
        "essay": "",
        "cover_letter": "",
        "resume_file_ids": [],
        "mentor_id": None
    }
    
    # Insert into MongoDB
    result = db.users.insert_one(user_dict)
    
    # Fetch the created user
    user_data = db.users.find_one({"_id": result.inserted_id})
    user = user_models.User(**user_data)
    
    # Return user info with the plain token (only shown once)
    return {
        "user_id": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "full_name": user.full_name,
        "token": lead_token  # Return token only once at creation
    }


def read_user_essay(db: Database, *, user_id: str) -> str:
    """Read user essay from MongoDB"""
    user = read_user_by_id(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user.essay


def add_user_essay(db: Database, *, user_id: str, data: user_schema.Essay) -> str:
    """Add/update user essay in MongoDB"""
    from bson import ObjectId

    result = db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"essay": data.essay}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return data.essay


def update_essay(db: Database, user_id: str, *, data) -> str:
    """Update user essay in MongoDB"""
    from bson import ObjectId

    essay_text = data.get("essay")
    result = db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"essay": essay_text}}
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

    result = db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"cover_letter": data.cover_letter}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return data.cover_letter


def add_resume_file_id(db: Database, *, user_id: str, file_id: str) -> None:
    """Add resume file ID to user's resume_file_ids list in MongoDB"""
    from bson import ObjectId

    result = db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$addToSet": {"resume_file_ids": file_id}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")


def remove_resume_file_id(db: Database, *, user_id: str, file_id: str) -> None:
    """Remove resume file ID from user's resume_file_ids list in MongoDB"""
    from bson import ObjectId

    result = db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$pull": {"resume_file_ids": file_id}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")


def update_user_profile(
    db: Database, *, user_id: str, data: user_schema.UserUpdate
) -> user_models.User:
    """Update user profile in MongoDB"""
    from bson import ObjectId

    # Get only the fields that were actually provided (exclude None values)
    update_data = data.dict(exclude_unset=True, exclude_none=True)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
        )

    # Update the user
    result = db.users.update_one({"_id": ObjectId(user_id)}, {"$set": update_data})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch and return the updated user
    user_data = db.users.find_one({"_id": ObjectId(user_id)})
    return user_models.User(**user_data)


# def update(
#     db: Database,
#     *,
#     db_obj: user_models.User,
#     data: user_schema.UserUpdate | dict[str, Any],
# ) -> user_models.User:
#     if isinstance(data, dict):
#         update_data = data
#     else:
#         update_data = data.dict(exclude_unset=True)
#     if update_data["password"]:
#         hashed_password = security.get_password_hash(update_data["password"])
#         del update_data["password"]
#         update_data["hashed_password"] = hashed_password
#     return super().update(db, db_obj=db_obj, data=update_data)
