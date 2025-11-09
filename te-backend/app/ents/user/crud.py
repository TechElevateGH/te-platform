import app.core.security as security
import app.ents.user.models as user_models
import app.ents.user.schema as user_schema
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session


def read_user_by_email(db: Session, *, email: str) -> Optional[user_models.User]:
    return db.query(user_models.User).filter(user_models.User.email == email).first()


def read_user_by_id(db: Session, *, id: int) -> Optional[user_models.User]:
    return db.query(user_models.User).filter(user_models.User.id == id).first()


def is_user_active(db: Session, *, user: user_models.User) -> bool:
    return user.is_active


def read_users_by_role(
    db: Session, *, role=0, skip: int = 0, limit: int = 100
) -> list[user_models.User]:
    return (
        db.query(user_models.User)
        .filter(user_models.User.role == role)
        .offset(skip)
        .limit(limit)
        .all()
    )


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
