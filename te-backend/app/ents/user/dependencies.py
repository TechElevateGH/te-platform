import app.core.security as security
import app.database.session as session
import app.ents.user.crud as user_crud
import app.ents.user.models as user_models
from app.core.permissions import get_user_role
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
    current_user: user_models.User = Depends(get_current_user),
) -> user_models.User:
    """Get current user if they are at least a Member (role >= 1)"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if get_user_role(current_user) < 1:
        raise HTTPException(status_code=400, detail="Member access required")

    return current_user


def get_current_lead(
    current_user: user_models.User = Depends(get_current_user),
) -> user_models.User:
    """Get current user if they are at least a Lead (role >= 2)"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if get_user_role(current_user) < 2:
        raise HTTPException(status_code=400, detail="Lead access required")

    return current_user


def get_current_admin(
    current_user: user_models.User = Depends(get_current_user),
) -> user_models.User:
    """Get current user if they are an Admin (role = 3)"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if get_user_role(current_user) < 3:
        raise HTTPException(status_code=400, detail="Admin access required")
    return current_user
