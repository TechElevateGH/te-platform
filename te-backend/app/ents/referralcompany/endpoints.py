from typing import Any, Dict

import app.database.session as session
import app.ents.referralcompany.crud as referralcompany_crud
import app.ents.referralcompany.dependencies as referralcompany_dependencies
import app.ents.referralcompany.schema as referralcompany_schema
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
from app.core.permissions import require_lead
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

company_router = APIRouter(prefix="/companies")
referral_router = APIRouter(prefix="/referrals")


@company_router.post(
    "",
    response_model=Dict[str, referralcompany_schema.CompanyReadBase],
    status_code=status.HTTP_201_CREATED,
)
def add_company(
    db: Database = Depends(session.get_db),
    *,
    data: referralcompany_schema.AdminCompanyCreate,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Add a new referral company to the system.
    Requires role: Volunteer (3), Lead (4), or Admin (5).
    """
    from app.core.permissions import require_volunteer

    # Require at least Volunteer level to add companies
    require_volunteer(user)

    company = referralcompany_crud.create_admin_company(db, data=data)
    return {"company": referralcompany_dependencies.parse_company_basic(company)}


@company_router.get(
    "/referrals",
    response_model=Dict[str, list[referralcompany_schema.CompanyReadForReferrals]],
)
def get_referral_companies(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve Companies.
    """
    companies = referralcompany_crud.read_referral_companies(db, skip=skip, limit=limit)
    return {
        "companies": [
            referralcompany_dependencies.parse_company_for_referrals(user.id, company)
            for company in companies
        ]
    }


@referral_router.post(
    "",
    response_model=Dict[str, referralcompany_schema.ReferralRead],
)
def request_referral(
    db: Database = Depends(session.get_db),
    *,
    data: referralcompany_schema.ReferralRequest,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Request a referral for `user`
    """
    referral = referralcompany_crud.request_referral(
        db,
        user_id=user.id,
        data=data,
    )
    return {"referral": referralcompany_dependencies.parse_referral(referral)}


@referral_router.get(
    "",
    response_model=Dict[str, list[referralcompany_schema.ReferralRead]],
)
def get_user_referrals(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    _: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all referrals of `user`.
    """
    referrals = referralcompany_crud.read_user_referrals(db, user_id=user_id)
    return {
        "referrals": [
            referralcompany_dependencies.parse_referral(referral)
            for referral in referrals
        ]
    }


@referral_router.get(
    "/all",
    response_model=Dict[str, list[referralcompany_schema.ReferralReadWithUser]],
)
def get_all_referrals(
    db: Database = Depends(session.get_db),
    *,
    skip: int = 0,
    limit: int = 100,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all referrals in the system.
    - Referrers (role=2): Only see referrals for their assigned company
    - Lead/Admin (role>=3): See all referrals
    """
    from app.core.permissions import is_referrer, require_referrer

    # Require at least Referrer level access
    require_referrer(user)

    # If user is a Referrer, filter by their company
    if is_referrer(user):
        if not user.company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referrer account has no assigned company",
            )
        # Get company name from company_id
        from bson import ObjectId

        company = db.companies.find_one({"_id": ObjectId(user.company_id)})
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned company not found",
            )
        company_name = company.get("name", "")

        # Get only referrals for this referrer's company (by company name)
        referrals = referralcompany_crud.read_company_referrals(
            db, company_id=company_name, skip=skip, limit=limit
        )
    else:
        # Lead/Admin can see all referrals
        referrals = referralcompany_crud.read_all_referrals(db, skip=skip, limit=limit)

    return {
        "referrals": [
            referralcompany_dependencies.parse_referral_with_user(referral)
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

    referrals = referralcompany_crud.read_company_referrals(
        db, company_id=company_id, skip=skip, limit=limit
    )
    total = referralcompany_crud.count_referrals_by_company(db, company_id=company_id)

    return {
        "referrals": [
            referralcompany_dependencies.parse_referral_with_user(referral)
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

    referrals = referralcompany_crud.read_referrals_by_status(
        db, status=status, skip=skip, limit=limit
    )
    total = referralcompany_crud.count_referrals_by_status(db, status=status)

    return {
        "referrals": [
            referralcompany_dependencies.parse_referral_with_user(referral)
            for referral in referrals
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@referral_router.get(
    "/user/{user_id}/company/{company_id}",
    response_model=Dict[str, list[referralcompany_schema.ReferralRead]],
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

    referrals = referralcompany_crud.read_user_company_referrals(
        db, user_id=user_id, company_id=company_id
    )
    return {
        "referrals": [
            referralcompany_dependencies.parse_referral(referral)
            for referral in referrals
        ]
    }


@referral_router.post(
    "/{referral_id}/review",
    response_model=Dict[str, referralcompany_schema.ReferralReadWithUser],
)
def review_referral(
    *,
    db: Database = Depends(session.get_db),
    referral_id: int,
    data: referralcompany_schema.ReferralUpdateStatus,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Update referral status and review note (Lead/Admin only).
    """
    # Check if user has elevated privileges
    require_lead(user)

    referral = referralcompany_crud.update_referral_status(
        db, referral_id=referral_id, data=data
    )

    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    return {"referral": referralcompany_dependencies.parse_referral_with_user(referral)}


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
        sheet_url = referralcompany_crud.export_referrals_to_google_sheets(
            db, referral_ids=referral_ids
        )
        return {"sheet_url": sheet_url, "message": "Referrals exported successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to export to Google Sheets: {str(e)}"
        )
