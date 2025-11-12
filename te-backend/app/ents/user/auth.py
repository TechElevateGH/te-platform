"""
Authentication endpoints for the TE Platform.

This module provides three distinct authentication flows:

1. **Member Login** (POST /auth/login)
   - For regular members (role=1)
   - Requires: email + password
   - Returns: Access token

2. **Lead/Admin Login** (POST /auth/lead-login)
   - For Leads (role=4) and Admins (role=5)
   - Requires: username + token
   - Returns: Access token + user info

3. **Referrer Login** (POST /auth/referrer-login)
   - For Referrers (role=2)
   - Requires: token ONLY (no username)
   - Returns: Access token + user info + company info
   - Note: Referrers are assigned to a specific company
"""

from datetime import timedelta
from typing import Any
import logging

import app.core.security as security
import app.database.session as session
import app.ents.user.crud as user_crud
import app.ents.user.models as user_models
import app.ents.user.schema as user_schema
from app.core.settings import settings
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

# Professional auth router without prefix - will be mounted at /auth
auth_router = APIRouter(tags=["Authentication"])
logger = logging.getLogger(__name__)


@auth_router.post("/login")
def login_access_token(
    data: user_schema.UserLogin,
    db: Database = Depends(session.get_db),
) -> Any:
    """
    Member user login with email and password.

    OAuth2 compatible token login for regular members.

    - **username**: Member's email address
    - **password**: Member's password
    - Returns: Access token for authenticated requests

    Note: Users must verify their email before they can log in.
    """
    logger.info(f"Login attempt for user: {data.username}")

    user = security.authenticate(db, email=data.username, password=data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user_crud.is_user_active(db, user=user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    # Check if email is verified
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your inbox for the verification code.",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Convert ObjectId to string for JSON serialization
    user_id_str = str(user.id)

    return {
        "sub": user_id_str,
        "role": user.role,
        "type": "bearer",
        "access_token": security.create_access_token(
            user_id_str, expires_delta=access_token_expires
        ),
    }


@auth_router.post("/lead-login")
def lead_login_access_token(
    data: user_schema.LeadLogin,
    db: Database = Depends(session.get_db),
) -> Any:
    """
    Lead/Admin login with username and token.

    For Lead (role=4) and Admin (role=5) users only.

    - **username**: Lead/Admin username
    - **token**: Secure token provided during account creation
    - Returns: Access token and user information
    """
    logger.info(f"Lead login attempt for user: {data.username}")

    # Find user in privileged_users collection
    user_data = db.privileged_users.find_one({"username": data.username})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid username or token"
        )

    user = user_models.PrivilegedUser(**user_data)

    # Only allow Lead (4) and Admin (5) to use this endpoint
    if user.role not in [user_schema.UserRoles.lead, user_schema.UserRoles.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for Lead/Admin users only. Referrers should use /auth/referrer-login",
        )

    # Verify token matches
    if not user.lead_token or user.lead_token != data.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid username or token"
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    user_id_str = str(user.id)

    return {
        "access_token": security.create_access_token(
            user_id_str, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user": {
            "id": user_id_str,
            "username": user.username,
            "role": user.role,
        },
    }


@auth_router.post("/referrer-login")
def referrer_login_access_token(
    data: user_schema.ReferrerLogin,
    db: Database = Depends(session.get_db),
) -> Any:
    """
    Referrer login with token only (no username required).

    Referrers authenticate using only their secure token.
    The token uniquely identifies the referrer and their assigned company.

    - **token**: Secure token provided during account creation
    - Returns: Access token and user information including assigned company
    """
    logger.info("Referrer login attempt")

    # Find user by token in privileged_users collection
    user_data = db.privileged_users.find_one({"lead_token": data.token})
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token"
        )

    user = user_models.PrivilegedUser(**user_data)

    # Only allow Referrers (role=2) to use this endpoint
    if user.role != user_schema.UserRoles.referrer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for Referrer users only. Lead/Admin should use /auth/lead-login",
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    # Get company information
    company_name = None
    if user.company_id:
        company = db.companies.find_one({"_id": user.company_id})
        if company:
            company_name = company.get("name", "")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    user_id_str = str(user.id)

    return {
        "access_token": security.create_access_token(
            user_id_str, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
        "user": {
            "id": user_id_str,
            "username": user.username,
            "role": user.role,
            "company_id": str(user.company_id) if user.company_id else None,
            "company_name": company_name,
        },
    }


# @router.post("/login/test-token", response_model=user_schema.MemberUserRead)
# def test_token(
#     current_user: user_models.MemberUser = Depends(
#         base_dependencies.get_current_user
#     ),
# ) -> Any:
#     """
#     Test access token
#     """
#     return current_user


# @router.post("/password-recovery/{email}")
# def recover_password(email: str, db: Database = Depends(session.get_db)) -> Any:
#     user = user_crud.read_user_by_email(db=db, email=email)
#     if not user:
#         raise HTTPException(
#             status_code=404,
#             detail="The user with this username does not exist in the system.",
#         )

#     password_reset_token = utils.generate_password_reset_token(email=email)
#     utils.send_reset_password_email(
#         email_to=user.email, email=email, token=password_reset_token
#     )
#     return {"schemas.Msg": "Password recovery email sent"}


# @router.post("/reset-password/", response_model=schemas.Msg)
# def reset_password(
#     token: str = Body(...),
#     new_password: str = Body(...),
#     db: Database = Depends(session.get_db),
# ) -> Any:
#     """
#     Reset password
#     """
#     email = utils.verify_password_reset_token(token)
#     if not email:
#         raise HTTPException(status_code=400, detail="Invalid token")
#     user = user.crud.read_user_by_email(db, email=email)
#     if not user:
#         raise HTTPException(
#             status_code=404,
#             detail="The user with this username does not exist in the system.",
#         )
#     elif not user.crud.is_user_active(user):
#         raise HTTPException(status_code=400, detail="Inactive user")
#     hashed_password = get_password_hash(new_password)
#     user.hashed_password = hashed_password  # type: ignore  Column--warning
#     db.add(user)
#     db.commit()
#     return {"schemas.Msg": "Password updated successfully"}
