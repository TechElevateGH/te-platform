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
