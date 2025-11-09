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
    db: Session, *, role=0, skip: int = 0, limit: int = 100
) -> list[user_models.User]:
    return (
        db.query(user_models.User)
        .filter(user_models.User.role >= role)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_user_full_name(first_name, middle_name, last_name) -> str:
    return f"{first_name} {middle_name} {last_name}"


def create_user(db: Session, *, data: user_schema.UserCreate) -> user_models.User:
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

    data.password = security.get_password_hash(data.password)
    user = user_models.User(**(data.dict()))
    user.full_name = get_user_full_name(
        data.first_name, data.middle_name, data.last_name
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def read_user_essay(db: Session, *, user_id) -> str:
    user = read_user_by_id(db, id=user_id)
    if not user:
        ...

    return user.essay


def add_user_essay(db: Session, *, user_id, data: user_schema.Essay) -> str:
    user = read_user_by_id(db, id=user_id)
    if not user:
        ...

    user.essay = data.essay

    db.commit()
    db.refresh(user)
    return str(user.essay)


def update_essay(db: Session, user_id, *, data) -> str:
    user = read_user_by_id(db, id=user_id)
    if not user:
        ...

    user.essay = data.get("essay")

    db.add(user)
    db.commit()
    db.refresh(user)
    return user.essay


# def update(
#     db: Session,
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
