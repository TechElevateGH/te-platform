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
    company_base = company_schema.CompanyReadBase(**vars(referral.company))
    referral_base = company_schema.ReferralReadBase(**vars(referral))
    return company_schema.ReferralRead(**referral_base.dict(), company=company_base)


def parse_referral_with_user(referral):
    """Parse referral including user information for Lead/Admin view"""
    company_base = company_schema.CompanyReadBase(**vars(referral.company))
    referral_base = company_schema.ReferralReadBase(**vars(referral))
    return company_schema.ReferralReadWithUser(
        **referral_base.dict(),
        company=company_base,
        user_name=referral.user.full_name,
        user_email=referral.user.email,
    )
