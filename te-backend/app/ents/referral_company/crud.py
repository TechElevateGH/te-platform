import app.ents.referral_company.models as referral_company_models
import app.ents.referral_company.schema as referral_company_schema
import app.ents.user.crud as user_crud
from typing import Optional
from pymongo.database import Database
from fastapi import HTTPException


def create_referral_company(
    db: Database, *, data: referral_company_schema.ReferralCompanyCreate
) -> referral_company_models.Company:
    """
    Create a new company for referrals (Volunteer/Lead/Admin only).
    Simplified creation with basic company information and referral requirements.
    """
    # Check if company with this name already exists
    existing = db.companies.find_one({"name": data.name})
    if existing:
        raise HTTPException(
            status_code=400, detail=f"Company '{data.name}' already exists"
        )

    # Create company document
    company_dict = {
        "name": data.name,
        "domain": data.website if data.website else "",
        "image": data.image if data.image else "",
        "can_refer": True,
        "locations": [],  # Can be added later if needed
        "referral_materials": {
            "resume": data.requires_resume,
            "essay": data.requires_essay,
            "contact": data.requires_contact,
        },
        # Store additional info in a metadata field
        "metadata": {
            "description": data.description if data.description else "",
            "industry": data.industry if data.industry else "",
            "size": data.size if data.size else "",
            "headquarters": data.headquarters if data.headquarters else "",
        },
    }

    # Insert into MongoDB
    result = db.companies.insert_one(company_dict)

    # Fetch and return the created company
    company_data = db.companies.find_one({"_id": result.inserted_id})
    return referral_company_models.Company(**company_data)


def read_company_by_id(
    db: Database, *, company_id: int
) -> Optional[referral_company_models.Company]:
    """Get company by integer ID from MongoDB"""
    company_data = db.companies.find_one({"id": company_id})
    if not company_data:
        return None
    return referral_company_models.Company(**company_data)


def read_user_referrals(
    db: Database, *, user_id: str
) -> list[referral_company_models.Referral]:
    """
    Get all referrals for a specific user from MongoDB.
    """
    from bson import ObjectId

    user = user_crud.read_user_by_id(db, id=user_id)
    if not user:
        return []

    referrals_data = db.referrals.find({"user_id": ObjectId(user_id)})
    return [referral_company_models.Referral(**ref) for ref in referrals_data]


def read_all_referrals(
    db: Database, *, skip: int = 0, limit: int = 100
) -> list[referral_company_models.Referral]:
    """
    Get all referrals in the system (for Lead/Admin users) from MongoDB.
    """
    referrals_data = db.referrals.find().skip(skip).limit(limit)
    return [referral_company_models.Referral(**ref) for ref in referrals_data]


def read_company_referrals(
    db: Database, *, company_id: str, skip: int = 0, limit: int = 100
) -> list[referral_company_models.Referral]:
    """
    Get all referrals for a specific company from MongoDB.
    Useful for seeing all referral requests to a particular company.
    company_id is actually the company name (string).
    """
    referrals_data = (
        db.referrals.find({"company_name": company_id}).skip(skip).limit(limit)
    )
    return [referral_company_models.Referral(**ref) for ref in referrals_data]


def read_referrals_by_status(
    db: Database, *, status: str, skip: int = 0, limit: int = 100
) -> list[referral_company_models.Referral]:
    """
    Get all referrals with a specific status from MongoDB.
    Useful for filtering by 'in_review', 'completed', 'declined', etc.
    """
    referrals_data = db.referrals.find({"status": status}).skip(skip).limit(limit)
    return [referral_company_models.Referral(**ref) for ref in referrals_data]


def read_user_company_referrals(
    db: Database, *, user_id: str, company_id: str
) -> list[referral_company_models.Referral]:
    """
    Get all referrals for a specific user at a specific company from MongoDB.
    Useful for checking if user already requested referral at this company.
    company_id is actually the company name (string).
    """
    from bson import ObjectId

    referrals_data = db.referrals.find(
        {"user_id": ObjectId(user_id), "company_name": company_id}
    )
    return [referral_company_models.Referral(**ref) for ref in referrals_data]


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
    data: referral_company_schema.ReferralRequest,
) -> referral_company_models.Referral:
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
        "status": referral_company_schema.ReferralStatuses.pending.value,
        "referral_date": data.date,
    }

    # Insert into MongoDB
    result = db.referrals.insert_one(referral_dict)

    # Fetch and return the created referral
    referral_data = db.referrals.find_one({"_id": result.inserted_id})
    return referral_company_models.Referral(**referral_data)


def update_referral_status(
    db: Database,
    *,
    referral_id: str,
    data: referral_company_schema.ReferralUpdateStatus,
    user_role: int = None,
) -> referral_company_models.Referral:
    """
    Update referral status and review note in MongoDB.
    Sets feedback_date when a Referrer (role=2) provides feedback.
    """
    from bson import ObjectId
    from datetime import datetime

    # Build update data
    update_data = {"status": data.status.value}
    if data.review_note:
        update_data["review_note"] = data.review_note

    # Set feedback_date when Referrer provides feedback (only if not already set)
    if user_role == 2:  # Referrer role
        # Check if feedback_date is already set
        existing = db.referrals.find_one({"_id": ObjectId(referral_id)})
        if existing and not existing.get("feedback_date"):
            update_data["feedback_date"] = datetime.now().strftime("%d-%m-%Y")

    # Update in MongoDB
    result = db.referrals.update_one(
        {"_id": ObjectId(referral_id)}, {"$set": update_data}
    )

    if result.matched_count == 0:
        return None

    # Fetch and return updated referral
    referral_data = db.referrals.find_one({"_id": ObjectId(referral_id)})
    return referral_company_models.Referral(**referral_data)


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
    from app.core.settings import settings

    # Load Google credentials from environment variables
    SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
    
    credentials_info = {
        "type": settings.GOOGLE_TYPE,
        "project_id": settings.GOOGLE_PROJECT_ID,
        "private_key_id": settings.GOOGLE_PRIVATE_KEY_ID,
        "private_key": settings.GOOGLE_PRIVATE_KEY.replace('\\n', '\n'),
        "client_email": settings.GOOGLE_CLIENT_EMAIL,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "auth_uri": settings.GOOGLE_AUTH_URI,
        "token_uri": settings.GOOGLE_TOKEN_URI,
        "auth_provider_x509_cert_url": settings.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
        "client_x509_cert_url": settings.GOOGLE_CLIENT_X509_CERT_URL,
        "universe_domain": settings.GOOGLE_UNIVERSE_DOMAIN
    }

    credentials = service_account.Credentials.from_service_account_info(
        credentials_info, scopes=SCOPES
    )

    service = build("sheets", "v4", credentials=credentials)

    # Get referrals to export from MongoDB
    if referral_ids:
        object_ids = [ObjectId(ref_id) for ref_id in referral_ids]
        referrals_data = db.referrals.find({"_id": {"$in": object_ids}})
    else:
        referrals_data = db.referrals.find()

    referrals = [referral_company_models.Referral(**ref) for ref in referrals_data]

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
#     db_obj: referral_company_models.Company,
#     data: referral_company_schema.CompanyUpdate | dict[str, Any],
# ) -> referral_company_models.Company:
#     if isinstance(data, dict):
#         update_data = data
#     else:
#         update_data = data.dict(exclude_unset=True)
#     if update_data["password"]:
#         hashed_password = security.get_password_hash(update_data["password"])
#         del update_data["password"]
#         update_data["hashed_password"] = hashed_password
#     return super().update(db, db_obj=db_obj, data=update_data)
