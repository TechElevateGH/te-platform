from typing import Union

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

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_STR}/auth/login", auto_error=False
)


def get_current_user(
    db: Database = Depends(session.get_db),
    token=Depends(reusable_oauth2),
) -> Union[user_models.MemberUser, user_models.PrivilegedUser]:
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

    # First try to find in regular users collection
    user = user_crud.read_user_by_id(db, id=token_data.sub)
    if user:
        return user

    # If not found, try privileged_users collection
    from bson import ObjectId

    if ObjectId.is_valid(token_data.sub):
        priv_user_data = db.privileged_users.find_one({"_id": ObjectId(token_data.sub)})
        if priv_user_data:
            return user_models.PrivilegedUser(**priv_user_data)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
    )


def get_current_active_user(
    current_user: user_models.MemberUser = Depends(get_current_user),
) -> user_models.MemberUser:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_user_by_role(
    current_user: user_models.MemberUser = Depends(get_current_user),
) -> user_models.MemberUser:
    """Get current user if they are at least a Member (role >= 1)"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if get_user_role(current_user) < 1:
        raise HTTPException(status_code=400, detail="Member access required")

    return current_user


def get_current_lead(
    current_user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(get_current_user),
) -> Union[user_models.MemberUser, user_models.PrivilegedUser]:
    """Get current user if they are at least a Lead (role >= 4)"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if get_user_role(current_user) < 4:
        raise HTTPException(status_code=400, detail="Lead access required")

    return current_user


def get_current_admin(
    current_user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(get_current_user),
) -> Union[user_models.MemberUser, user_models.PrivilegedUser]:
    """Get current user if they are an Admin (role >= 5)"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if get_user_role(current_user) < 5:
        raise HTTPException(status_code=400, detail="Admin access required")
    return current_user


def get_current_member_only(
    current_user: user_models.MemberUser = Depends(get_current_user),
) -> user_models.MemberUser:
    """Get current user if they are ONLY a Member (role == 1)"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    user_role = get_user_role(current_user)
    if user_role != 1:
        raise HTTPException(
            status_code=403, detail="This feature is only available for Members"
        )

    return current_user


def get_current_volunteer_or_above(
    current_user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(get_current_user),
) -> Union[user_models.MemberUser, user_models.PrivilegedUser]:
    """Get current user if they are at least a Volunteer (role >= 3)"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    if get_user_role(current_user) < 3:
        raise HTTPException(
            status_code=403, detail="Volunteer access or higher required"
        )

    return current_user


def get_learning_content_access(
    db: Database = Depends(session.get_db),
    token: str = Depends(reusable_oauth2),
) -> Union[user_models.MemberUser, user_models.PrivilegedUser, None]:
    """
    Check learning content access. Allows everyone except Referrers (role=2).
    Returns user if authenticated, None if guest.
    Raises 403 for Referrers.
    """
    if not token:
        # Guest user - allowed to view content
        return None

    try:
        payload = jwt.decode(
            token=token,
            key=settings.SECRET_KEY,
            algorithms=["HS256"],
        )
        token_data = security.TokenPayload(**payload)
    except (JWTError, ValidationError):
        # Invalid token - treat as guest
        return None

    # Try to find user
    user = user_crud.read_user_by_id(db, id=token_data.sub)
    if not user:
        from bson import ObjectId

        if ObjectId.is_valid(token_data.sub):
            priv_user_data = db.privileged_users.find_one(
                {"_id": ObjectId(token_data.sub)}
            )
            if priv_user_data:
                user = user_models.PrivilegedUser(**priv_user_data)

    if not user:
        # User not found - treat as guest
        return None

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    user_role = get_user_role(user)
    # Block only Referrers (role=2)
    if user_role == 2:
        raise HTTPException(
            status_code=403, detail="Learning content is not available for Referrers"
        )

    return user


def get_optional_learning_content_access(
    db: Database = Depends(session.get_db),
    token: str = Depends(reusable_oauth2),
) -> Union[user_models.MemberUser, user_models.PrivilegedUser, None]:
    """
    Get current user for learning content access, or None for guests.
    Blocks Referrers (role=2).
    """
    if not token:
        return None

    try:
        current_user = get_current_user(db, token)
        if not current_user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")

        user_role = get_user_role(current_user)
        # Block only Referrers (role=2)
        if user_role == 2:
            raise HTTPException(
                status_code=403,
                detail="Learning content is not available for Referrers",
            )

        return current_user
    except HTTPException:
        # Allow guests (unauthenticated users) to view content
        return None
