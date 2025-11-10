from typing import Any, Dict

import app.database.session as session
import app.ents.company.crud as company_crud
import app.ents.company.dependencies as company_dependencies
import app.ents.company.schema as company_schema
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
from app.core.permissions import require_lead
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database

company_router = APIRouter(prefix="/companies")
referral_router = APIRouter(prefix="/referrals")


@company_router.get(
    "/referrals",
    response_model=Dict[str, list[company_schema.CompanyReadForReferrals]],
)
def get_referral_companies(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    user: user_models.User = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve Companies.
    """
    companies = company_crud.read_referral_companies(db, skip=skip, limit=limit)
    return {
        "companies": [
            company_dependencies.parse_company_for_referrals(user.id, company)
            for company in companies
        ]
    }


@referral_router.post(
    "",
    response_model=Dict[str, company_schema.ReferralRead],
)
def request_referral(
    db: Database = Depends(session.get_db),
    *,
    data: company_schema.ReferralRequest,
    user: user_models.User = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Request a referral for `user`
    """
    referral = company_crud.request_referral(
        db,
        user_id=user.id,
        data=data,
    )
    return {"referral": company_dependencies.parse_referral(referral)}


@referral_router.get(
    "",
    response_model=Dict[str, list[company_schema.ReferralRead]],
)
def get_user_referrals(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    _: user_models.User = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all referrals of `user`.
    """
    referrals = company_crud.read_user_referrals(db, user_id=user_id)
    return {
        "referrals": [
            company_dependencies.parse_referral(referral) for referral in referrals
        ]
    }


@referral_router.get(
    "/all",
    response_model=Dict[str, list[company_schema.ReferralReadWithUser]],
)
def get_all_referrals(
    db: Database = Depends(session.get_db),
    *,
    skip: int = 0,
    limit: int = 100,
    user: user_models.User = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all referrals in the system (for Lead/Admin users only).
    Requires user role to be Lead or Admin (role >= 2).
    """
    # Check if user has elevated privileges (Lead or Admin)
    require_lead(user)

    referrals = company_crud.read_all_referrals(db, skip=skip, limit=limit)
    return {
        "referrals": [
            company_dependencies.parse_referral_with_user(referral)
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
    user: user_models.User = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all referrals for a specific company (for Lead/Admin users only).
    Returns referrals with user details and total count.
    """
    # Check if user has elevated privileges
    require_lead(user)

    referrals = company_crud.read_company_referrals(
        db, company_id=company_id, skip=skip, limit=limit
    )
    total = company_crud.count_referrals_by_company(db, company_id=company_id)

    return {
        "referrals": [
            company_dependencies.parse_referral_with_user(referral)
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
    user: user_models.User = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all referrals with a specific status (for Lead/Admin users only).
    Returns referrals with user details and total count.
    Status values: 'in_review', 'completed', 'declined', etc.
    """
    # Check if user has elevated privileges
    require_lead(user)

    referrals = company_crud.read_referrals_by_status(
        db, status=status, skip=skip, limit=limit
    )
    total = company_crud.count_referrals_by_status(db, status=status)

    return {
        "referrals": [
            company_dependencies.parse_referral_with_user(referral)
            for referral in referrals
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@referral_router.get(
    "/user/{user_id}/company/{company_id}",
    response_model=Dict[str, list[company_schema.ReferralRead]],
)
def get_user_company_referrals(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    company_id: str,
    current_user: user_models.User = Depends(user_dependencies.get_current_user),
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

    referrals = company_crud.read_user_company_referrals(
        db, user_id=user_id, company_id=company_id
    )
    return {
        "referrals": [
            company_dependencies.parse_referral(referral) for referral in referrals
        ]
    }


@referral_router.post(
    "/{referral_id}/review",
    response_model=Dict[str, company_schema.ReferralReadWithUser],
)
def review_referral(
    *,
    db: Database = Depends(session.get_db),
    referral_id: int,
    data: company_schema.ReferralUpdateStatus,
    user: user_models.User = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Update referral status and review note (Lead/Admin only).
    """
    # Check if user has elevated privileges
    require_lead(user)

    referral = company_crud.update_referral_status(
        db, referral_id=referral_id, data=data
    )

    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")

    return {"referral": company_dependencies.parse_referral_with_user(referral)}


@referral_router.post(
    "/export/google-sheets",
    response_model=Dict[str, str],
)
def export_referrals_to_sheets(
    db: Database = Depends(session.get_db),
    *,
    referral_ids: list[int] = None,
    user: user_models.User = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Export referrals to Google Sheets (Lead/Admin only).
    If referral_ids is provided, export only those referrals.
    Otherwise, export all referrals.
    """
    # Check if user has elevated privileges
    require_lead(user)

    try:
        sheet_url = company_crud.export_referrals_to_google_sheets(
            db, referral_ids=referral_ids
        )
        return {"sheet_url": sheet_url, "message": "Referrals exported successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to export to Google Sheets: {str(e)}"
        )
