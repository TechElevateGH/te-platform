import app.ents.company.models as company_models
import app.ents.company.schema as company_schema
import app.ents.user.crud as user_crud
from typing import Optional
from pymongo.database import Database


def read_company_by_name(
    db: Database, *, name: str
) -> Optional[company_models.Company]:
    return (
        db.query(company_models.Company)
        .filter(company_models.Company.name == name)
        .first()
    )


def read_company_multi(
    db: Database, *, skip: int = 0, limit: int = 100
) -> list[company_models.Company]:
    return db.query(company_models.Company).offset(skip).limit(limit).all()


def create_company(
    db: Database, *, data: company_schema.CompanyCreate
) -> company_models.Company:
    company = company_models.Company(
        **(data.dict(exclude={"location", "referral_materials"}))
    )

    company.image = ("https://logo.clearbit.com/" + data.domain) if data.domain else ""
    # company.image = (
    #     f"https://logo.clearbit.com/{data.domain.replace(r"/\s+/g", '').lower()}?size=20"
    #     if data.domain
    #     else ""
    # )
    location = company_models.Location(**data.location.dict())
    company.locations.append(location)

    referral_materials = company_models.ReferralMaterials()
    if data.referral_materials:
        referral_materials = company_models.ReferralMaterials(
            **data.referral_materials.dict()
        )

    company.referral_materials = referral_materials

    db.add(location)
    db.add(referral_materials)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


def add_location(
    db: Database,
    *,
    company: company_models.Company,
    data: company_schema.LocationBase,
):
    location = company_models.Location(**data.dict())
    company.locations.append(location)

    db.add(location)
    db.add(company)
    db.commit()
    db.refresh(location)
    db.refresh(company)
    return company


def read_referral_companies(
    db: Database, *, skip: int = 0, limit: int = 100
) -> list[company_models.Company]:
    return [
        company
        for company in db.query(company_models.Company).offset(skip).limit(limit).all()
        if company.can_refer
    ]


def read_user_referrals(db: Database, *, user_id: int) -> list[company_models.Referral]:
    user = user_crud.read_user_by_id(db, id=user_id)
    if not user:
        ...

    return (
        db.query(company_models.Referral)
        .filter(company_models.Referral.user_id == user_id)
        .all()
    )


def read_all_referrals(
    db: Database, *, skip: int = 0, limit: int = 100
) -> list[company_models.Referral]:
    """
    Get all referrals in the system (for Lead/Admin users).
    """
    return db.query(company_models.Referral).offset(skip).limit(limit).all()


def request_referral(
    db: Database,
    user_id: int,
    data: company_schema.ReferralRequest,
) -> company_models.Referral:
    user = user_crud.read_user_by_id(db, id=user_id)
    if not user:
        ...

    referral = company_models.Referral(
        user_id=user_id,
        company_id=data.company_id,
        job_title=data.job_title,
        role=data.role,
        request_note=data.request_note,
        resume=data.resume,
        status=company_schema.ReferralStatuses.in_review.value,
        referral_date=data.date,
    )

    db.add(referral)
    db.commit()
    db.refresh(referral)

    return referral


def update_referral_status(
    db: Database,
    *,
    referral_id: int,
    data: company_schema.ReferralUpdateStatus,
) -> company_models.Referral:
    """
    Update referral status and review note (for Lead/Admin users).
    """
    referral = (
        db.query(company_models.Referral)
        .filter(company_models.Referral.id == referral_id)
        .first()
    )

    if not referral:
        return None

    referral.status = data.status.value
    if data.review_note:
        referral.review_note = data.review_note

    db.commit()
    db.refresh(referral)

    return referral


def export_referrals_to_google_sheets(
    db: Database,
    *,
    referral_ids: list[int] = None,
) -> str:
    """
    Export referrals to Google Sheets.
    Returns the URL of the created Google Sheet.
    """
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
    from datetime import datetime

    # Load Google credentials
    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
    SERVICE_ACCOUNT_FILE = "app/core/google_drive_creds.json"

    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )

    service = build("sheets", "v4", credentials=credentials)

    # Get referrals to export
    if referral_ids:
        referrals = (
            db.query(company_models.Referral)
            .filter(company_models.Referral.id.in_(referral_ids))
            .all()
        )
    else:
        referrals = db.query(company_models.Referral).all()

    # Create new spreadsheet
    spreadsheet = {
        "properties": {
            "title": f"TechElevate Referrals Export - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        },
        "sheets": [{"properties": {"title": "Referrals"}}],
    }

    spreadsheet = service.spreadsheets().create(body=spreadsheet).execute()
    spreadsheet_id = spreadsheet["spreadsheetId"]

    # Prepare data
    headers = [
        "Referral ID",
        "Member Name",
        "Member Email",
        "Company",
        "Job Title",
        "Role",
        "Request Note",
        "Resume Link",
        "Date",
        "Status",
        "Review Note",
    ]

    rows = [headers]
    for referral in referrals:
        user = referral.user
        company = referral.company
        rows.append(
            [
                str(referral.id),
                user.full_name if user else "N/A",
                user.email if user else "N/A",
                company.name if company else "N/A",
                referral.job_title,
                referral.role,
                referral.request_note,
                referral.resume,
                referral.referral_date,
                referral.status,
                referral.review_note or "",
            ]
        )

    # Write data to sheet
    body = {"values": rows}

    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="Referrals!A1",
        valueInputOption="RAW",
        body=body,
    ).execute()

    # Format header row
    requests = [
        {
            "repeatCell": {
                "range": {"sheetId": 0, "startRowIndex": 0, "endRowIndex": 1},
                "cell": {
                    "userEnteredFormat": {
                        "backgroundColor": {"red": 0.23, "green": 0.51, "blue": 0.96},
                        "textFormat": {
                            "bold": True,
                            "foregroundColor": {"red": 1, "green": 1, "blue": 1},
                        },
                        "horizontalAlignment": "CENTER",
                    }
                },
                "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
            }
        }
    ]

    service.spreadsheets().batchUpdate(
        spreadsheetId=spreadsheet_id, body={"requests": requests}
    ).execute()

    return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"


# def update(
#     db: Database,
#     *,
#     db_obj: company_models.Company,
#     data: company_schema.CompanyUpdate | dict[str, Any],
# ) -> company_models.Company:
#     if isinstance(data, dict):
#         update_data = data
#     else:
#         update_data = data.dict(exclude_unset=True)
#     if update_data["password"]:
#         hashed_password = security.get_password_hash(update_data["password"])
#         del update_data["password"]
#         update_data["hashed_password"] = hashed_password
#     return super().update(db, db_obj=db_obj, data=update_data)
