import app.core.storage as storage
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
        metadata=getattr(company, "metadata", {}) or {},
    )


def _referral_dict(referral, request=None):
    resume_file_id = getattr(referral, "resume_file_id", "")
    return {
        "id": str(referral.id),
        "user_id": str(referral.user_id),
        "job_title": referral.job_title,
        "job_id": referral.job_id,
        "role": referral.role,
        "request_note": referral.request_note,
        "review_note": referral.review_note,
        "date": referral.referral_date,
        "feedback_date": getattr(referral, "feedback_date", None),
        "status": referral.status,
        "resume": storage.private_file_link(
            request, resume_file_id, getattr(referral, "resume", "")
        ),
        "resume_file_id": resume_file_id,
        "resume_name": getattr(referral, "resume_name", ""),
        "resume_content_type": getattr(referral, "resume_content_type", ""),
        "phone_number": referral.phone_number,
        "email": getattr(referral, "email", ""),
        "essay": referral.essay,
        "country": getattr(referral, "country", ""),
    }


def parse_referral(referral, request=None):
    """Parse referral with company name only (no company object)."""
    company_base = referral_schema.ReferralCompanyBase(
        name=referral.company_name or "Unknown Company",
        image="",
    )
    return referral_schema.ReferralRead(
        **_referral_dict(referral, request),
        company=company_base,
    )


def parse_referral_with_user(referral, request=None):
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

    return referral_schema.ReferralReadWithUser(
        **_referral_dict(referral, request),
        company=company_base,
        user_name=user.full_name if user else "Unknown",
        user_email=user.email if user else "Unknown",
    )
