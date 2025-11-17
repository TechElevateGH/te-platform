"""
Authentication endpoints for the TE Platform.

This module provides three distinct authentication flows:

1. **Member Login** (POST /auth/login)
   - For regular members (role=1)
   - Requires: email + password
   - Returns: Access token

2. **Management Login** (POST /auth/management-login)
   - For Volunteers (role=3), Leads (role=4), and Admins (role=5)
   - Requires: username + token
   - Returns: Access token + user info

3. **Referrer Login** (POST /auth/referrer-login)
   - For Referrers (role=2)
   - Requires: token ONLY (no username)
   - Returns: Access token + user info + company info
   - Note: Referrers are assigned to a specific company

4. **Google OAuth Login** (GET /auth/google/login)
   - Initiates Google OAuth flow
   - Redirects to Google for authentication

5. **Google OAuth Callback** (GET /auth/google/callback)
   - Handles callback from Google
   - Creates or authenticates user
   - Returns: Access token
"""

from datetime import timedelta
from typing import Any
import secrets
import logging

import app.core.security as security
import app.database.session as session
import app.ents.user.crud as user_crud
import app.ents.user.models as user_models
import app.ents.user.schema as user_schema
from app.core.settings import settings
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from pymongo.database import Database
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from urllib.parse import urlencode

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


@auth_router.post(
    "/password/reset-request", response_model=user_schema.PasswordResetRequestResponse
)
def request_password_reset(
    data: user_schema.PasswordResetRequest,
    db: Database = Depends(session.get_db),
) -> Any:
    """
    Request a password reset code.

    Sends a 6-digit verification code to the user's email address.

    **Note**: Users who signed up with Google OAuth and never set a password
    can use this to create their first password and enable email/password login.

    - **email**: User's email address
    - Returns: Success message (code sent to email)
    """
    from app.utilities.email import send_password_reset_email

    # Check if user exists
    user = user_crud.read_user_by_email(db, email=data.email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    # For OAuth users without password, allow them to set one
    # No special handling needed - they can reset/set a password

    # Create password reset request
    reset, token = user_crud.create_password_reset_request(db, user=user)

    # Send email with reset code
    try:
        frontend_url = settings.DOMAIN
        reset_link = f"{frontend_url}/reset-password?token={token}"
        send_password_reset_email(user.email, reset.code, reset_link)
    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset code. Please try again.",
        )

    return user_schema.PasswordResetRequestResponse(
        success=True,
        message="Password reset code sent to your email. Please check your inbox.",
    )


@auth_router.post(
    "/password/verify-code", response_model=user_schema.PasswordResetVerifyResponse
)
def verify_password_reset_code(
    data: user_schema.PasswordResetVerify,
    db: Database = Depends(session.get_db),
) -> Any:
    """
    Verify password reset code.

    Validates the 6-digit code and returns a session token for password reset.

    - **email**: User's email address
    - **code**: 6-digit verification code
    - **token**: Token from reset request
    - Returns: Session token for completing password reset
    """
    try:
        session_token = user_crud.verify_password_reset_code(
            db,
            email=data.email,
            code=data.code,
            token=data.token,
        )
    except HTTPException:
        raise

    return user_schema.PasswordResetVerifyResponse(
        success=True,
        message="Code verified successfully. You can now reset your password.",
        session_token=session_token,
    )


@auth_router.post(
    "/password/complete-reset", response_model=user_schema.PasswordResetCompleteResponse
)
def complete_password_reset(
    data: user_schema.PasswordResetComplete,
    db: Database = Depends(session.get_db),
) -> Any:
    """
    Complete password reset with new password.

    Sets the new password for the user account.

    - **session_token**: Token from verified code step
    - **new_password**: New password (min 8 characters)
    - Returns: Success message
    """
    # Validate password strength
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long.",
        )

    try:
        user_crud.complete_password_reset(
            db,
            token=data.session_token,
            new_password=data.new_password,
        )
    except HTTPException:
        raise

    return user_schema.PasswordResetCompleteResponse(
        success=True,
        message="Password reset successfully! You can now log in with your new password.",
    )


@auth_router.post("/management-login")
def management_login_access_token(
    data: user_schema.LeadLogin,
    db: Database = Depends(session.get_db),
) -> Any:
    """
    Management login with username and token.

    For Volunteer (role=3), Lead (role=4), and Admin (role=5) users.

    - **username**: Management user's username
    - **token**: Secure token provided during account creation
    - Returns: Access token and user information
    """
    logger.info(f"Management login attempt for user: {data.username}")

    # Find user in privileged_users collection (case-insensitive)
    user_data = db.privileged_users.find_one(
        {"username": {"$regex": f"^{data.username}$", "$options": "i"}}
    )
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid username or token"
        )

    user = user_models.PrivilegedUser(**user_data)
    print(user)

    # Only allow Volunteer (3), Lead (4), and Admin (5) to use this endpoint
    if user.role not in [
        user_schema.UserRoles.volunteer,
        user_schema.UserRoles.lead,
        user_schema.UserRoles.admin,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for management users only. Referrers should use /auth/referrer-login",
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
            detail="This endpoint is for Referrer users only. Management users should use /auth/management-login",
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    # Get company information
    company_name = None
    if user.company_id:
        company = db.referral_companies.find_one({"_id": user.company_id})
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


@auth_router.get("/google/login")
def google_login() -> Any:
    """
    Initiate Google OAuth login flow.

    Redirects user to Google's OAuth consent screen.
    """
    if not settings.GOOGLE_OAUTH_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )

    # Build Google OAuth authorization URL
    # Generate anti-CSRF state token
    state = secrets.token_urlsafe(24)
    params = {
        "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    # Set secure cookie with state for verification in callback (5 min expiry)
    response = RedirectResponse(url=auth_url)
    response.set_cookie(
        key="oauth_state",
        value=state,
        max_age=300,
        httponly=True,
        secure=False,  # Set True in production with HTTPS
        samesite="lax",
    )
    return response


@auth_router.get("/google/callback")
async def google_callback(code: str, db: Database = Depends(session.get_db)) -> Any:
    """
    Handle Google OAuth callback.

    Exchanges authorization code for user info and creates/authenticates user.
    """
    if not settings.GOOGLE_OAUTH_CLIENT_ID or not settings.GOOGLE_OAUTH_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )

    try:
        # Exchange authorization code for tokens
        import requests

        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": settings.GOOGLE_OAUTH_CLIENT_ID,
            "client_secret": settings.GOOGLE_OAUTH_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        logger.info("Exchanging authorization code for tokens...")
        token_response = requests.post(token_url, data=token_data)

        if token_response.status_code != 200:
            logger.error(
                f"Google token exchange failed: {token_response.status_code} - {token_response.text}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to exchange authorization code: {token_response.text}",
            )

        tokens = token_response.json()
        logger.info("Successfully received tokens from Google")

        # Verify ID token and extract user info
        logger.info("Verifying ID token...")
        idinfo = id_token.verify_oauth2_token(
            tokens["id_token"],
            google_requests.Request(),
            settings.GOOGLE_OAUTH_CLIENT_ID,
        )

        # Extract user information
        google_user_id = idinfo["sub"]
        email = idinfo.get("email")
        first_name = idinfo.get("given_name", "")
        last_name = idinfo.get("family_name", "")
        picture = idinfo.get("picture", "")

        logger.info(f"Google user authenticated: {email}")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by Google",
            )

        # Check if user exists with this Google ID in member_users collection
        existing_user = db.member_users.find_one({"google_id": google_user_id})

        if not existing_user:
            # Check if user exists with this email (case-insensitive for legacy users)
            existing_user = db.member_users.find_one(
                {"email": {"$regex": f"^{email}$", "$options": "i"}}
            )

            if existing_user:
                # Link Google account to existing user
                db.member_users.update_one(
                    {"_id": existing_user["_id"]},
                    {
                        "$set": {
                            "google_id": google_user_id,
                            "oauth_provider": "google",
                            "email_verified": True,  # Google verified the email
                            "image": picture
                            if not existing_user.get("image")
                            else existing_user.get("image"),
                        }
                    },
                )
                user = user_models.MemberUser(**existing_user)
            else:
                # Create new user
                new_user_data = {
                    "email": email.lower(),  # Normalize email to lowercase
                    "first_name": first_name,
                    "last_name": last_name,
                    "full_name": f"{first_name} {last_name}".strip(),
                    "image": picture,
                    "google_id": google_user_id,
                    "oauth_provider": "google",
                    "email_verified": True,  # Google verified the email
                    "is_active": True,
                    "role": 1,  # Member role
                    "password": None,  # No password for OAuth users
                    "middle_name": "",
                    "phone_number": "",
                    "address": "",
                    "date_of_birth": "",
                    "university": "",
                    "start_date": "",
                    "end_date": "",
                    "slack_joined": False,  # New user hasn't joined Slack yet
                    "referral_essay": "",
                    "cover_letter": "",
                    "resumes": [],
                    "applications": [],
                    "mentor_id": None,
                }

                result = db.member_users.insert_one(new_user_data)
                new_user_data["_id"] = result.inserted_id
                user = user_models.MemberUser(**new_user_data)
        else:
            # Update existing OAuth user
            db.member_users.update_one(
                {"_id": existing_user["_id"]},
                {
                    "$set": {
                        "image": picture,
                        "first_name": first_name,
                        "last_name": last_name,
                        "full_name": f"{first_name} {last_name}".strip(),
                    }
                },
            )
            user = user_models.MemberUser(**existing_user)

        # Generate access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        user_id_str = str(user.id)
        access_token = security.create_access_token(
            user_id_str, expires_delta=access_token_expires
        )

        # Redirect to frontend with token
        frontend_url = settings.DOMAIN
        redirect_url = f"{frontend_url}/auth/callback?token={access_token}&user_id={user_id_str}&role={user.role}"

        logger.info(f"Redirecting to: {redirect_url}")
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}")
        # Redirect to frontend with error
        frontend_url = settings.DOMAIN
        error_url = f"{frontend_url}/login?error=oauth_failed"
        return RedirectResponse(url=error_url)


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
