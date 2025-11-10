import app.ents.company.models as company_models
import app.ents.company.schema as company_schema
import app.ents.user.crud as user_crud
from typing import Optional
from pymongo.database import Database
from fastapi import HTTPException


def read_company_by_id(
    db: Database, *, company_id: int
) -> Optional[company_models.Company]:
    """Get company by integer ID from MongoDB"""
    company_data = db.companies.find_one({"id": company_id})
    if not company_data:
        return None
    return company_models.Company(**company_data)


def read_user_referrals(db: Database, *, user_id: str) -> list[company_models.Referral]:
    """
    Get all referrals for a specific user from MongoDB.
    """
    from bson import ObjectId

    user = user_crud.read_user_by_id(db, id=user_id)
    if not user:
        return []

    referrals_data = db.referrals.find({"user_id": ObjectId(user_id)})
    return [company_models.Referral(**ref) for ref in referrals_data]


def read_all_referrals(
    db: Database, *, skip: int = 0, limit: int = 100
) -> list[company_models.Referral]:
    """
    Get all referrals in the system (for Lead/Admin users) from MongoDB.
    """
    referrals_data = db.referrals.find().skip(skip).limit(limit)
    return [company_models.Referral(**ref) for ref in referrals_data]


def read_company_referrals(
    db: Database, *, company_id: str, skip: int = 0, limit: int = 100
) -> list[company_models.Referral]:
    """
    Get all referrals for a specific company from MongoDB.
    Useful for seeing all referral requests to a particular company.
    company_id is actually the company name (string).
    """
    referrals_data = (
        db.referrals.find({"company_name": company_id}).skip(skip).limit(limit)
    )
    return [company_models.Referral(**ref) for ref in referrals_data]


def read_referrals_by_status(
    db: Database, *, status: str, skip: int = 0, limit: int = 100
) -> list[company_models.Referral]:
    """
    Get all referrals with a specific status from MongoDB.
    Useful for filtering by 'in_review', 'completed', 'declined', etc.
    """
    referrals_data = db.referrals.find({"status": status}).skip(skip).limit(limit)
    return [company_models.Referral(**ref) for ref in referrals_data]


def read_user_company_referrals(
    db: Database, *, user_id: str, company_id: str
) -> list[company_models.Referral]:
    """
    Get all referrals for a specific user at a specific company from MongoDB.
    Useful for checking if user already requested referral at this company.
    company_id is actually the company name (string).
    """
    from bson import ObjectId

    referrals_data = db.referrals.find(
        {"user_id": ObjectId(user_id), "company_name": company_id}
    )
    return [company_models.Referral(**ref) for ref in referrals_data]


def count_referrals_by_company(db: Database, *, company_id: str) -> int:
    """
    Count total referrals for a specific company.
    company_id is actually the company name (string).
    """
    return db.referrals.count_documents({"company_name": company_id})


def count_referrals_by_status(db: Database, *, status: str) -> int:
    """
    Count total referrals with a specific status.
    """
    return db.referrals.count_documents({"status": status})


def request_referral(
    db: Database,
    user_id: str,
    data: company_schema.ReferralRequest,
) -> company_models.Referral:
    """Create a new referral request in MongoDB"""
    from bson import ObjectId

    user = user_crud.read_user_by_id(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create referral document with company_name (string from frontend)
    referral_dict = {
        "user_id": ObjectId(user_id),
        "company_name": data.company_id,  # Store company name as string
        "job_title": data.job_title,
        "job_id": data.job_id or "",
        "role": data.role,
        "request_note": data.request_note,
        "resume": data.resume,
        "contact": data.contact or "",
        "essay": data.essay or "",
        "status": company_schema.ReferralStatuses.pending.value,
        "referral_date": data.date,
    }

    # Insert into MongoDB
    result = db.referrals.insert_one(referral_dict)

    # Fetch and return the created referral
    referral_data = db.referrals.find_one({"_id": result.inserted_id})
    return company_models.Referral(**referral_data)


def update_referral_status(
    db: Database,
    *,
    referral_id: str,
    data: company_schema.ReferralUpdateStatus,
) -> company_models.Referral:
    """
    Update referral status and review note (for Lead/Admin users) in MongoDB.
    """
    from bson import ObjectId

    # Build update data
    update_data = {"status": data.status.value}
    if data.review_note:
        update_data["review_note"] = data.review_note

    # Update in MongoDB
    result = db.referrals.update_one(
        {"_id": ObjectId(referral_id)}, {"$set": update_data}
    )

    if result.matched_count == 0:
        return None

    # Fetch and return updated referral
    referral_data = db.referrals.find_one({"_id": ObjectId(referral_id)})
    return company_models.Referral(**referral_data)


def export_referrals_to_google_sheets(
    db: Database,
    *,
    referral_ids: list[str] = None,
) -> str:
    """
    Export referrals to Google Sheets from MongoDB.
    Returns the URL of the created Google Sheet.
    """
    from googleapiclient.discovery import build
    from google.oauth2 import service_account
    from datetime import datetime
    from bson import ObjectId

    # Load Google credentials
    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
    SERVICE_ACCOUNT_FILE = "app/core/google_drive_creds.json"

    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )

    service = build("sheets", "v4", credentials=credentials)

    # Get referrals to export from MongoDB
    if referral_ids:
        object_ids = [ObjectId(ref_id) for ref_id in referral_ids]
        referrals_data = db.referrals.find({"_id": {"$in": object_ids}})
    else:
        referrals_data = db.referrals.find()

    referrals = [company_models.Referral(**ref) for ref in referrals_data]

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
