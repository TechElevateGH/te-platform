import app.ents.company.schema as company_schema


def parse_company(company):
    company_base = company_schema.CompanyReadBase(**vars(company))
    new_company = company_schema.CompanyRead(
        **company_base.dict(),
        locations=[
            company_schema.LocationRead(**vars(loc)) for loc in company.locations
        ],
        referral_materials=company_schema.ReferralMaterials(
            **vars(company.referral_materials)
        ),
    )
    return new_company


def parse_company_for_referrals(user_id, company):
    company_base = company_schema.CompanyReadBase(**vars(company))
    return company_schema.CompanyReadForReferrals(
        **company_base.dict(),
        referral_materials=company_schema.ReferralMaterials(
            **vars(company.referral_materials)
        ),
    )


def parse_referral(referral):
    """Parse referral with company name only (no company object)"""
    # Create a minimal company object with just the name
    company_base = company_schema.CompanyBase(
        name=referral.company_name,
        image=""
    )
    
    referral_dict = {
        "id": str(referral.id),
        "user_id": str(referral.user_id),
        "job_title": referral.job_title,
        "job_id": referral.job_id,
        "role": referral.role,
        "request_note": referral.request_note,
        "review_note": referral.review_note,
        "date": referral.referral_date,
        "status": referral.status,
        "resume": referral.resume,
    }
    
    return company_schema.ReferralRead(**referral_dict, company=company_base)


def parse_referral_with_user(referral):
    """Parse referral including user information for Lead/Admin view"""
    from app.ents.user import crud as user_crud
    from app.database import session
    
    # Get user info
    db = next(session.get_db())
    user = user_crud.read_user_by_id(db, id=str(referral.user_id))
    
    # Create minimal company object
    company_base = company_schema.CompanyBase(
        name=referral.company_name,
        image=""
    )
    
    referral_dict = {
        "id": str(referral.id),
        "user_id": str(referral.user_id),
        "job_title": referral.job_title,
        "job_id": referral.job_id,
        "role": referral.role,
        "request_note": referral.request_note,
        "review_note": referral.review_note,
        "date": referral.referral_date,
        "status": referral.status,
        "resume": referral.resume,
    }
    
    return company_schema.ReferralReadWithUser(
        **referral_dict,
        company=company_base,
        user_name=user.full_name if user else "Unknown",
        user_email=user.email if user else "Unknown",
    )
