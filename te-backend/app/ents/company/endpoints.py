from typing import Any, Dict, List

import app.database.session as session
import app.ents.company.crud as company_crud
import app.ents.company.dependencies as company_dependencies
import app.ents.company.schema as company_schema
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
from fastapi import APIRouter, Depends
from pymongo.database import Database

company_router = APIRouter(prefix="/companies")
referral_router = APIRouter(prefix="/referrals")


# @router.get(".list", response_model=List[company_schema.CompanyRead])
# def get_companies(
#     db: Database = Depends(dependencies.get_db),
#     skip: int = 0,
#     limit: int = 100,
#     # _: str = Depends(dependencies.get_current_user),
# ) -> Any:
#     """
#     Retrieve Companies.
#     """
#     companies = crud.company.read_multi(db, skip=skip, limit=limit)
#     return companies


@company_router.post("/create", response_model=Dict[str, company_schema.CompanyRead])
def create_company(
    *,
    db: Database = Depends(session.get_db),
    data: company_schema.CompanyCreate,
    # _=Depends(get_current_user),
) -> Any:
    """
    Create an Company.
    """
    if company := company_crud.read_company_by_name(db, name=data.name):
        if not (
            any(
                data.location.city == location.city
                and data.location.country == location.country
                for location in company.locations
            )
        ):
            company = company_crud.add_location(db, company=company, data=data.location)
            return company_dependencies.parse_company(company)
        else:
            #! Update company data
            ...

    company = company_crud.create_company(db, data=data)
    return {"company": company_dependencies.parse_company(company)}


@company_router.get("/list", response_model=Dict[str, list[company_schema.CompanyRead]])
def get_companies(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    # _: str = Depends(dependencies.get_current_user),
) -> Any:
    """
    Retrieve all companies.
    """
    companies = company_crud.read_company_multi(db, skip=skip, limit=limit)
    return {
        "companies": [
            company_dependencies.parse_company(company) for company in companies
        ]
    }


@company_router.post(
    "/{company_id}/update", response_model=Dict[str, company_schema.CompanyRead]
)
def update_company(
    db: Database = Depends(session.get_db),
    *,
    company_id: int,
    _: str = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve Companies.
    """
    ...


@company_router.get(
    "/referrals/list",
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
    "/create",
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
    "/list",
    response_model=Dict[str, list[company_schema.ReferralRead]],
)
def get_user_referrals(
    db: Database = Depends(session.get_db),
    *,
    user_id: int,
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
    Requires user role to be mentor, team, or admin (role >= 3).
    """
    # Check if user has elevated privileges (Lead = mentor/team, Admin = admin)
    # UserRoles: guest=0, mentee=1, contributor=2, mentor=3, team=4, admin=5
    if user.role.value < 3:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=403,
            detail="Only Lead and Admin users can view all referral requests",
        )

    referrals = company_crud.read_all_referrals(db, skip=skip, limit=limit)
    return {
        "referrals": [
            company_dependencies.parse_referral_with_user(referral)
            for referral in referrals
        ]
    }


@referral_router.post(
    "/{referral_id}/review",
    response_model=Dict[str, list[company_schema.CompanyRead]],
)
def review_referral(
    *,
    db: Database = Depends(session.get_db),
    referral_id: int,
    data: str,
    user: user_models.User = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve Companies.
    """
    ...


# @router.put(".info/{company_id}", response_model=company_schema.CompanyRead)
# def update_company(
#     *,
#     db: Database = Depends(dependencies.get_db),
#     data: company_schema.CompanyUpdate,
#     user: models.Company = Depends(dependencies.get_current_user),
# ) -> Any:
#     """
#     Update Company.
#     """
#     company = company.crud.read_user_by_id(db, id=company.id)
#     if not company:
#         raise HTTPException(
#             status_code=404,
#             detail={
#                 "error": {
#                     "email": company.email,
#                     "message": "The company with this name does not exist in the system",
#                 }
#             },
#         )
#     company = crud.company.update(db, db_obj=company, data=data)
#     return user
