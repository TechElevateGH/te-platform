import app.core.security as security
import app.database.session as session
import app.ents.user.crud as user_crud
import app.ents.user.models as user_models
import app.ents.user.schema as user_schema
from app.core.settings import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose.exceptions import JWTError
from pydantic import ValidationError
from pymongo.database import Database

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl=f"{settings.API_STR}/auth/login")


def get_current_user(
    db: Database = Depends(session.get_db),
    token=Depends(reusable_oauth2),
) -> user_models.User:
    try:
        payload = jwt.decode(
            token=token,
            key=settings.SECRET_KEY,
            algorithms=["HS256"],
        )
        token_data = security.TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    user = user_crud.read_user_by_id(db, id=token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user


def get_current_active_user(
    current_user: user_models.User = Depends(get_current_user),
) -> user_models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_user_by_role(
    # role: user_schema.UserRoles ,
    current_user: user_models.User = Depends(get_current_user),
) -> user_models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if current_user.role != 1:
        raise HTTPException(status_code=400, detail="Unauthorized access")

    return current_user


def get_current_mentor(
    current_user: user_models.User = Depends(get_current_user),
) -> user_models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if current_user.role < user_schema.UserRoles.mentor:
        raise HTTPException(status_code=400, detail="Unauthorized access")

    return current_user


def get_current_user_contributor(
    current_user: user_models.User = Depends(get_current_user),
) -> user_models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if current_user.role < user_schema.UserRoles.contributor:
        raise HTTPException(status_code=400, detail="Unauthorized access")

    return current_user


def get_current_user_team(
    current_user: user_models.User = Depends(get_current_user),
) -> user_models.User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if current_user.role < user_schema.UserRoles.contributor:
        raise HTTPException(status_code=400, detail="Unauthorized access")

    return current_user


def get_current_user_admin(
    current_user: user_models.User = Depends(get_current_user),
) -> user_models.User:
    if not current_user.role == user_schema.UserRoles.admin:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user
