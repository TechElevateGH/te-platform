from typing import Any, Dict
import app.database.session as session
import app.ents.user.crud as user_crud
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
import app.ents.user.schema as user_schema
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

router = APIRouter(prefix="/users", tags=["Users"])


# ============= Privileged User Management (Admin Only) =============


@router.get("/privileged", response_model=list[Dict[str, Any]])
def list_privileged_users(
    db: Database = Depends(session.get_db),
    _: user_models.MemberUser = Depends(user_dependencies.get_current_lead),
) -> Any:
    """
    List all privileged users (Volunteers and Leads) for assignment purposes.

    Returns all active users with role 3 (Volunteer) or role 4 (Lead).
    These users can be assigned resume review requests.
    Includes full_name and email for display purposes.

    **Requires**: Lead (role=4) or Admin (role=5) access
    """
    users = user_crud.read_all_privileged_users(db)
    return users


@router.post(
    "/privileged/leads",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
)
def create_lead_account(
    *,
    db: Database = Depends(session.get_db),
    data: user_schema.LeadCreate,
    _: user_models.MemberUser = Depends(user_dependencies.get_current_admin),
) -> Any:
    """
    Create a new Management account (Admin only).

    For Volunteers (role=3), Leads (role=4), and Admins (role=5).
    These users authenticate using their username and token.

    - **username**: Username for login
    - **token**: Secure token for authentication
    - **role**: Volunteer (3), Lead (4), or Admin (5)
    - Returns: User info and token (visible only once)

    **Authentication**: Management users log in at `/auth/management-login` with username + token.

    **Important**: The token should be shared securely with the user.
    It cannot be retrieved again after creation.

    **Requires**: Admin (role=5) access
    """
    result = user_crud.create_lead_user(db, data=data)
    return {
        "lead": result,
        "message": "Management account created successfully. Please share the token securely with the user.",
    }


@router.post(
    "/privileged/referrers",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
)
def create_referrer_account(
    *,
    db: Database = Depends(session.get_db),
    data: user_schema.ReferrerCreate,
    _: user_models.MemberUser = Depends(user_dependencies.get_current_admin),
) -> Any:
    """
    Create a new Referrer account (Admin only).

    Referrers authenticate using ONLY their token (no username required).
    The username is stored for admin reference only.

    - **username**: Internal identifier for admin reference (not used for login)
    - **token**: Secure token for authentication (referrers log in with this only)
    - **company_id**: Assigned company that the referrer manages
    - Returns: User info and token (visible only once)

    **Authentication**: Referrer users log in at `/auth/referrer-login` with token only.

    **Important**: The token should be shared securely with the Referrer.
    It cannot be retrieved again after creation.

    **Requires**: Admin (role=5) access
    """
    result = user_crud.create_referrer_user(db, data=data)
    return {
        "referrer": result,
        "message": "Referrer account created successfully. Please share the token securely with the user.",
    }


@router.post(
    "/privileged/volunteers",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
)
def create_volunteer_account(
    *,
    db: Database = Depends(session.get_db),
    data: user_schema.LeadCreate,
    _: user_models.MemberUser = Depends(user_dependencies.get_current_lead),
) -> Any:
    """
    Create a new Volunteer account (Lead+ access).

    Volunteers authenticate using their username and token.
    Leads and Admins can create Volunteer accounts.

    - **username**: Volunteer's username for login
    - **token**: Secure token for authentication
    - **role**: Must be Volunteer (3)
    - Returns: User info and token (visible only once)

    **Authentication**: Volunteers log in at `/auth/management-login` with username + token.

    **Important**: The token should be shared securely with the Volunteer.
    It cannot be retrieved again after creation.

    **Requires**: Lead (role=4) or Admin (role=5) access
    """
    # Force role to be Volunteer
    data.role = user_schema.UserRoles.volunteer

    result = user_crud.create_lead_user(db, data=data)
    return {
        "volunteer": result,
        "message": "Volunteer account created successfully. Please share the token securely with the user.",
    }


@router.patch("/privileged/{user_id}", response_model=Dict[str, Any])
def update_privileged_user(
    *,
    db: Database = Depends(session.get_db),
    user_id: str,
    data: user_schema.PrivilegedUserUpdate,
    _: user_models.MemberUser = Depends(user_dependencies.get_current_admin),
) -> Any:
    """
    Update a privileged user account (Admin only).

    Can update username, token, and active status.

    - **user_id**: Privileged user's ID
    - **data**: Fields to update
    - Returns: Updated user information

    **Requires**: Admin (role=5) access
    """
    result = user_crud.update_privileged_user(db, user_id=user_id, data=data)
    return {
        "user": result,
        "message": "Privileged account updated successfully.",
    }


# ============= Member User Management =============


@router.get("", response_model=list[Dict[str, Any]])
def list_member_users(
    db: Database = Depends(session.get_db),
    _: user_models.MemberUser = Depends(user_dependencies.get_current_admin),
) -> Any:
    """
    List all member users (Admin only).

    Returns all users with role = 1 (Members).

    **Requires**: Admin (role=5) access
    """
    users = user_crud.read_all_member_users(db)
    # Convert to dict format for JSON serialization
    result = []
    for user in users:
        user_dict = vars(user).copy()
        # Convert ObjectId to string
        if "_id" in user_dict:
            user_dict["id"] = str(user_dict["_id"])
            user_dict["_id"] = str(user_dict["_id"])
        result.append(user_dict)
    return result


@router.post(
    "",
    response_model=Dict[str, user_schema.MemberUserRead],
    status_code=status.HTTP_201_CREATED,
)
def create_member_user(
    *,
    db: Database = Depends(session.get_db),
    data: user_schema.MemberUserCreate,
) -> Any:
    """
    Create a new Member user account (public registration).

    - **data**: Member account details (email, password, name, etc.)
    - Returns: Created user information

    **Note**: This is a public endpoint for member self-registration.
    Password is automatically hashed before storage.
    A verification email will be sent to the provided email address.
    """
    import app.ents.verification.crud as verification_crud
    from app.utilities.email import send_verification_email

    new_user = user_crud.create_user(db, data=data)

    # Create and send verification code
    try:
        verification = verification_crud.create_verification_code(
            db,
            email=new_user.email,
            verification_type="registration",
            user_id=str(new_user.id),
        )
        send_verification_email(new_user.email, verification.code, "registration")
    except Exception as e:
        # Log error but don't fail registration
        # User can request verification code later
        print(f"Failed to send verification email: {e}")

    return {"user": user_schema.MemberUserRead(**vars(new_user))}


@router.get("/{user_id}", response_model=Dict[str, user_schema.MemberUserRead])
def get_user_by_id(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve user details by ID.

    - **user_id**: User's ID
    - Returns: User information

    **Authorization**:
    - Members (role=1): Can only view their own profile
    - Leads/Admins: Can view any user's profile
    """
    # Authorization check
    user_role = user_dependencies.get_user_role(current_user)
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own profile",
        )

    user = user_crud.read_user_by_id(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return {"user": user_schema.MemberUserRead(**vars(user))}


@router.patch("/{user_id}", response_model=Dict[str, user_schema.MemberUserRead])
def update_member_profile(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    data: user_schema.MemberUserUpdate,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Update member user profile information.

    - **user_id**: User's ID
    - **data**: Fields to update (name, contact, university, etc.)
    - Returns: Updated user information

    **Note**: Email changes are NOT allowed through this endpoint.
    To change email, use the /verification/request-email-change endpoint.

    **Authorization**:
    - Members (role=1): Can only update their own profile
    - Admins: Can update any member's profile
    """
    # Authorization check
    user_role = user_dependencies.get_user_role(current_user)
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update your own profile",
        )

    # Block email changes through this endpoint
    if data.email is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email cannot be changed through this endpoint. Please use the email verification process to change your email.",
        )

    updated_user = user_crud.update_user_profile(db, user_id=user_id, data=data)
    return {"user": user_schema.MemberUserRead(**vars(updated_user))}


# ============= Resume Management =============


@router.get("/{user_id}/resumes", response_model=Dict[str, Any])
def get_user_resumes(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve user's resumes.

    - **user_id**: User's ID
    - Returns: List of user's resumes

    **Authorization**:
    - Members (role=1): Can only view their own resumes
    - Leads/Admins: Can view any user's resumes
    """
    # Authorization check
    user_role = user_dependencies.get_user_role(current_user)
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own resumes",
        )

    user = user_crud.read_user_by_id(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Format resumes to match expected frontend structure
    resumes = [
        {
            "id": r.get("id", ""),  # UUID
            "file_id": r.get("file_id", ""),
            "name": r.get("name", ""),
            "link": r.get("link", ""),  # Frontend expects 'link' not 'url'
            "date": r.get("date", ""),
            "role": r.get("role", ""),
            "notes": r.get("notes", ""),
            "archived": r.get("archived", False),
        }
        for r in (user.resumes or [])
    ]

    return {"resumes": resumes}


# ============= Essay Management (Text stored in user document) =============


@router.get("/{user_id}/essay", response_model=user_schema.Essay)
def get_referral_essay(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
):
    """
    Retrieve user's referral essay.

    - **user_id**: User's ID
    - Returns: Referral essay text

    **Authorization**:
    - Members: Can view their own essay
    - Leads/Admins: Can view any member's essay
    """
    # Authorization check
    user_role = user_dependencies.get_user_role(current_user)
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Can only view your own essay"
        )

    essay = user_crud.read_user_essay(db, user_id=user_id)
    return user_schema.Essay(essay=essay)


@router.post("/{user_id}/essay", response_model=user_schema.Essay)
def update_referral_essay(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    data: user_schema.Essay,
    current_user: user_models.MemberUser = Depends(
        user_dependencies.get_current_member_only
    ),
):
    """
    Update user's referral essay.

    - **user_id**: User's ID (must match authenticated user)
    - **data**: Essay text content
    - Returns: Updated essay text

    **Note**: Essay is stored as text in the user's MongoDB document.
    Only available for Members (role=1).
    """
    # Ensure user can only update their own essay
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update your own essay",
        )

    essay = user_crud.add_user_essay(db, user_id=user_id, data=data)
    return user_schema.Essay(essay=essay)


@router.get("/{user_id}/cover-letter", response_model=user_schema.CoverLetter)
def get_cover_letter(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
):
    """
    Retrieve user's cover letter.

    - **user_id**: User's ID
    - Returns: Cover letter text

    **Authorization**:
    - Members: Can view their own cover letter
    - Leads/Admins: Can view any member's cover letter
    """
    # Authorization check
    user_role = user_dependencies.get_user_role(current_user)
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own cover letter",
        )

    cover_letter = user_crud.read_user_cover_letter(db, user_id=user_id)
    return user_schema.CoverLetter(cover_letter=cover_letter)


@router.post("/{user_id}/cover-letter", response_model=user_schema.CoverLetter)
def update_cover_letter(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    data: user_schema.CoverLetter,
    current_user: user_models.MemberUser = Depends(
        user_dependencies.get_current_member_only
    ),
):
    """
    Update user's cover letter.

    - **user_id**: User's ID (must match authenticated user)
    - **data**: Cover letter text content
    - Returns: Updated cover letter text

    **Note**: Cover letter is stored as text in the user's MongoDB document.
    Only available for Members (role=1).
    """
    # Ensure user can only update their own cover letter
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update your own cover letter",
        )

    cover_letter = user_crud.add_user_cover_letter(db, user_id=user_id, data=data)
    return user_schema.CoverLetter(cover_letter=cover_letter)


# ============= Admin Dashboard - All User Files =============


@router.get("/files/all", response_model=Dict[str, Any])
def list_all_user_files(
    db: Database = Depends(session.get_db),
    *,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve all members' files and essays (Lead/Admin dashboard).

    Returns aggregated view of:
    - All resumes (PDFs in Google Drive)
    - Referral essays (text)
    - Cover letters (text)

    Uses MongoDB projection for efficient queries.

    **Requires**: Lead (role >= 4) or Admin (role >= 5) access
    """
    from app.core.permissions import require_lead

    # Require at least Lead access
    require_lead(current_user)

    # Use projection to fetch only needed fields from member_users
    users_data = db.member_users.find(
        {"role": user_schema.UserRoles.member.value},
        {
            "_id": 1,
            "full_name": 1,
            "email": 1,
            "resumes": 1,
            "referral_essay": 1,
            "cover_letter": 1,
        },
    )

    users_with_files = []
    for user in users_data:
        user_data = {
            "id": str(user["_id"]),
            "full_name": user.get("full_name", ""),
            "email": user.get("email", ""),
            "resumes": [
                {
                    "id": r.get("id", ""),  # UUID
                    "file_id": r.get("file_id", ""),
                    "name": r.get("name", ""),
                    "url": r.get("link", ""),
                    "uploaded_at": r.get("date", ""),
                    "role": r.get("role", ""),
                    "notes": r.get("notes", ""),
                }
                for r in user.get("resumes", [])
            ],
            "referral_essay": user.get("referral_essay", ""),
            "cover_letter": user.get("cover_letter", ""),
        }
        users_with_files.append(user_data)

    return {"users": users_with_files}
