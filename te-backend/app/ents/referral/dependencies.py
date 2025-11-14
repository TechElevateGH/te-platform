import app.ents.referral.schema as referral_schema


def parse_company_basic(company):
    """Parse company to basic read format"""
    return referral_schema.CompanyReadBase(
        id=str(company.id),
        name=company.name,
        domain=getattr(company, "domain", ""),
        image=getattr(company, "image", ""),
        referral_link=getattr(company, "referral_link", ""),
        can_refer=getattr(company, "can_refer", True),
    )


def parse_company(company):
    company_base = parse_company_basic(company)
    materials = company.referral_materials or {}
    locations = getattr(company, "locations", [])
    return referral_schema.CompanyRead(
        **company_base.dict(),
        locations=[referral_schema.LocationRead(**vars(loc)) for loc in locations],
        referral_materials=referral_schema.ReferralMaterials(**materials),
    )


def parse_company_for_referrals(user_id, company):
    company_base = parse_company_basic(company)
    materials = company.referral_materials or {}
    return referral_schema.CompanyReadForReferrals(
        **company_base.dict(),
        referral_materials=referral_schema.ReferralMaterials(**materials),
    )


def parse_referral(referral):
    """Parse referral with company name only (no company object)"""
    # Use company_name or default to "Unknown Company"
    company_name = referral.company_name or "Unknown Company"

    # Create a minimal company object with just the name
    company_base = referral_schema.ReferralCompanyBase(name=company_name, image="")

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
        "phone_number": referral.phone_number,
        "essay": referral.essay,
    }

    return referral_schema.ReferralRead(**referral_dict, company=company_base)


def parse_referral_with_user(referral):
    """Parse referral including user information for Lead/Admin view"""
    from app.ents.user import crud as user_crud
    from app.database import session

    # Get user info
    db = next(session.get_db())
    user = user_crud.read_user_by_id(db, id=str(referral.user_id))

    # Use company_name or default to "Unknown Company"
    company_name = referral.company_name or "Unknown Company"

    # Create minimal company object
    company_base = referral_schema.ReferralCompanyBase(name=company_name, image="")

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
        "phone_number": referral.phone_number,
        "essay": referral.essay,
    }

    return referral_schema.ReferralReadWithUser(
        **referral_dict,
        company=company_base,
        user_name=user.full_name if user else "Unknown",
        user_email=user.email if user else "Unknown",
    )
