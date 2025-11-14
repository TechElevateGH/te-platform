from typing import Any, Dict, Optional, Union

import app.database.session as session
import app.ents.referral.crud as referral_crud
import app.ents.referral.dependencies as referral_dependencies
import app.ents.referral.schema as referral_schema
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
from app.core.permissions import require_lead
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

referral_router = APIRouter(prefix="/referrals")


@referral_router.get(
    "/companies/list",
    response_model=Dict[str, list[Dict[str, Any]]],
)
def get_companies_list(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 1000,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_lead),
) -> Any:
    """
    Get simplified list of company names and IDs (Lead+ only).
    Returns trimmed down list for dropdown selection when creating referrer accounts.
    """
    companies_cursor = (
        db.companies.find({}, {"_id": 1, "name": 1}).skip(skip).limit(limit)
    )
    companies = []
    for company in companies_cursor:
        companies.append(
            {
                "id": str(company["_id"]),
                "name": company.get("name", ""),
            }
        )
    return {"companies": companies}


@referral_router.get(
    "/mine",
    response_model=Dict[str, list[referral_schema.ReferralRead]],
)
def get_my_referrals(
    db: Database = Depends(session.get_db),
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """Retrieve all referral requests belonging to the authenticated member."""
    referrals = referral_crud.read_user_referrals(db, user_id=str(user.id))
    return {
        "referrals": [
            referral_dependencies.parse_referral(referral) for referral in referrals
        ]
    }


@referral_router.get(
    "/companies",
    response_model=Dict[str, list[referral_schema.CompanyReadForReferrals]],
)
def get_companies_for_referrals(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get list of companies available for referrals.
    Returns companies with their referral status for the authenticated user.
    """
    companies = referral_crud.read_referral_companies(db, skip=skip, limit=limit)
    return {
        "companies": [
            referral_dependencies.parse_company_for_referrals(user.id, company)
            for company in companies
        ]
    }


@referral_router.post(
    "/companies",
    response_model=Dict[str, referral_schema.CompanyReadBase],
    status_code=status.HTTP_201_CREATED,
)
def add_referral_company(
    db: Database = Depends(session.get_db),
    *,
    data: referral_schema.ReferralCompanyCreate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """Create a referral company (Volunteer+ required)."""
    company = referral_crud.create_referral_company(db, data=data)
    return {"company": referral_dependencies.parse_company_basic(company)}


@referral_router.patch(
    "/companies/{company_id}",
    response_model=Dict[str, referral_schema.CompanyReadBase],
)
def update_referral_company(
    company_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: referral_schema.ReferralCompanyUpdate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """Update a referral company (Lead+ required)."""
    company = referral_crud.update_referral_company(
        db, company_id=company_id, data=data
    )
    return {"company": referral_dependencies.parse_company_basic(company)}


@referral_router.post(
    "",
    response_model=Dict[str, referral_schema.ReferralRead],
)
def request_referral(
    db: Database = Depends(session.get_db),
    *,
    data: referral_schema.ReferralRequest,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_member_only),
) -> Any:
    """
    Request a referral for `user`.
    Only available for Members (role=1).
    """
    referral = referral_crud.request_referral(
        db,
        user_id=user.id,
        data=data,
    )
    return {"referral": referral_dependencies.parse_referral(referral)}


@referral_router.get(
    "",
    response_model=Dict[str, list[referral_schema.ReferralReadWithUser]],
)
def get_referrals(
    db: Database = Depends(session.get_db),
    *,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None,  # Filter by user
    company_id: Optional[str] = None,  # Filter by company
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get referrals with optional filtering.

    Query Parameters:
    - user_id: Filter by specific user's referrals
    - company_id: Filter by company ID
      * Referrers: Can only use their assigned company_id (validated)
      * Lead/Admin: Can use any company_id
    - skip: Number of records to skip for pagination
    - limit: Maximum number of records to return

    Access Control:
    - Members (role=1): Can only see their own referrals (user_id must match)
    - Referrers (role=2): Automatically filtered to their assigned company (can optionally provide company_id but must match)
    - Volunteers/Lead/Admin (role≥3): Can see all referrals or filter by user_id/company_id
    """
    from app.core.permissions import is_referrer, is_member, require_referrer

    # If filtering by specific user
    if user_id:
        # Members can only view their own referrals
        if is_member(current_user) and str(current_user.id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Members can only view their own referrals",
            )

        referrals = referral_crud.read_user_referrals(db, user_id=user_id)
        return {
            "referrals": [
                referral_dependencies.parse_referral_with_user(referral)
                for referral in referrals
            ]
        }

    # For viewing all referrals (requires at least Referrer role)
    require_referrer(current_user)

    # Determine which company to filter by
    filter_company_id = None

    # If user is a Referrer, they can only see their assigned company
    if is_referrer(current_user):
        if not current_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referrer account has no assigned company",
            )

        # If referrer provided company_id, verify it matches their assigned company
        if company_id:
            # Ensure both are ObjectIds for comparison
            from bson import ObjectId

            provided_id = (
                ObjectId(company_id) if isinstance(company_id, str) else company_id
            )
            assigned_id = (
                current_user.company_id
                if not isinstance(current_user.company_id, str)
                else ObjectId(current_user.company_id)
            )

            if provided_id != assigned_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Referrers can only view referrals for their assigned company",
                )

        filter_company_id = current_user.company_id
    # If user is Lead/Admin and provided company_id, use it for filtering
    elif company_id:
        filter_company_id = company_id

    # Fetch referrals based on filter
    if filter_company_id:
        # Get company name from company_id for filtering
        from bson import ObjectId

        # Ensure filter_company_id is an ObjectId
        if isinstance(filter_company_id, str):
            filter_company_id = ObjectId(filter_company_id)

        company = db.companies.find_one({"_id": filter_company_id})
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found",
            )
        company_name = company.get("name", "")

        # Get referrals filtered by company (using company name)
        referrals = referral_crud.read_company_referrals(
            db, company_id=company_name, skip=skip, limit=limit
        )
    else:
        # No filter - get all referrals (Lead/Admin only)
        referrals = referral_crud.read_all_referrals(db, skip=skip, limit=limit)

    return {
        "referrals": [
            referral_dependencies.parse_referral_with_user(referral)
            for referral in referrals
        ]
    }


@referral_router.get(
    "/company/{company_id}",
    response_model=Dict[str, Any],
)
def get_company_referrals(
    db: Database = Depends(session.get_db),
    *,
    company_id: str,
    skip: int = 0,
    limit: int = 100,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all referrals for a specific company (for Lead/Admin users only).
    Returns referrals with user details and total count.
    """
    # Check if user has elevated privileges
    require_lead(user)

    referrals = referral_crud.read_company_referrals(
        db, company_id=company_id, skip=skip, limit=limit
    )
    total = referral_crud.count_referrals_by_company(db, company_id=company_id)

    return {
        "referrals": [
            referral_dependencies.parse_referral_with_user(referral)
            for referral in referrals
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@referral_router.get(
    "/status/{status}",
    response_model=Dict[str, Any],
)
def get_referrals_by_status(
    db: Database = Depends(session.get_db),
    *,
    status: str,
    skip: int = 0,
    limit: int = 100,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all referrals with a specific status (for Lead/Admin users only).
    Returns referrals with user details and total count.
    Status values: 'in_review', 'completed', 'declined', etc.
    """
    # Check if user has elevated privileges
    require_lead(user)

    referrals = referral_crud.read_referrals_by_status(
        db, status=status, skip=skip, limit=limit
    )
    total = referral_crud.count_referrals_by_status(db, status=status)

    return {
        "referrals": [
            referral_dependencies.parse_referral_with_user(referral)
            for referral in referrals
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@referral_router.get(
    "/user/{user_id}/company/{company_id}",
    response_model=Dict[str, list[referral_schema.ReferralRead]],
)
def get_user_company_referrals(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    company_id: str,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all referrals for a specific user at a specific company.
    Useful for checking if user already requested referral at this company.
    Users can only access their own referrals, Lead/Admin can access any.
    """
    # Check authorization: user can only see their own, Lead/Admin can see any
    if str(current_user.id) != user_id and current_user.role < 2:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access these referrals",
        )

    referrals = referral_crud.read_user_company_referrals(
        db, user_id=user_id, company_id=company_id
    )
    return {
        "referrals": [
            referral_dependencies.parse_referral(referral) for referral in referrals
        ]
    }


@referral_router.patch(
    "/{referral_id}",
    response_model=Dict[str, referral_schema.ReferralReadWithUser],
)
def update_referral(
    *,
    db: Database = Depends(session.get_db),
    referral_id: str,
    data: referral_schema.ReferralUpdateStatus,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Update referral status and review note.
    - Referrers (role=2): Can only update referrals for their assigned company
    - Lead/Admin (role>=4): Can update any referral
    """
    from app.core.permissions import is_referrer, require_referrer
    from bson import ObjectId

    # Require at least Referrer level access
    require_referrer(user)

    # Get the referral first to check access
    referral_data = db.referrals.find_one({"_id": ObjectId(referral_id)})
    if not referral_data:
        raise HTTPException(status_code=404, detail="Referral not found")

    # If user is a Referrer, verify they have access to this referral
    if is_referrer(user):
        if not user.company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referrer account has no assigned company",
            )
        # Get company name from company_id
        company = db.companies.find_one({"_id": ObjectId(user.company_id)})
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned company not found",
            )
        company_name = company.get("name", "")

        # Verify referral belongs to this referrer's company
        if referral_data.get("company_name") != company_name:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this referral",
            )

    # Update the referral, passing user role for feedback_date tracking
    from app.core.permissions import get_user_role

    referral = referral_crud.update_referral_status(
        db, referral_id=referral_id, data=data, user_role=get_user_role(user)
    )

    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    return {"referral": referral_dependencies.parse_referral_with_user(referral)}


@referral_router.post(
    "/{referral_id}/review",
    response_model=Dict[str, referral_schema.ReferralReadWithUser],
)
def review_referral(
    *,
    db: Database = Depends(session.get_db),
    referral_id: str,
    data: referral_schema.ReferralUpdateStatus,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Update referral status and review note (Lead/Admin only).
    DEPRECATED: Use PATCH /{referral_id} instead.
    """
    from app.core.permissions import get_user_role

    # Check if user has elevated privileges
    require_lead(user)

    referral = referral_crud.update_referral_status(
        db, referral_id=referral_id, data=data, user_role=get_user_role(user)
    )

    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    return {"referral": referral_dependencies.parse_referral_with_user(referral)}


@referral_router.post(
    "/export/google-sheets",
    response_model=Dict[str, str],
)
def export_referrals_to_sheets(
    db: Database = Depends(session.get_db),
    *,
    referral_ids: list[int] = None,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Export referrals to Google Sheets (Lead/Admin only).
    If referral_ids is provided, export only those referrals.
    Otherwise, export all referrals.
    """
    # Check if user has elevated privileges
    require_lead(user)

    try:
        sheet_url = referral_crud.export_referrals_to_google_sheets(
            db, referral_ids=referral_ids
        )
        return {"sheet_url": sheet_url, "message": "Referrals exported successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to export to Google Sheets: {str(e)}"
        )
