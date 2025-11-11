import os
import tempfile
from datetime import date
from uuid import uuid4

import app.core.service as service
import app.ents.application.models as application_models
import app.ents.application.schema as application_schema
from fastapi import HTTPException
from app.core.settings import settings
from googleapiclient.http import MediaFileUpload
from pymongo.database import Database


# ============= Application CRUD Operations (Embedded in member_users) =============


def create_application(
    db: Database, *, user_id: str, data: application_schema.ApplicationCreate
) -> application_models.Application:
    """Create an Application for user (embedded in member_users document)"""
    from bson import ObjectId

    # Create application data (embedded document with UUID)
    application_data = {
        "id": str(uuid4()),  # Generate unique ID
        "company": data.company,
        "location": {
            "country": data.location.country,
            "city": data.location.city,
        },
        "date": date.today().strftime("%Y-%m-%d"),
        "title": data.title,
        "notes": data.notes,
        "recruiter_name": data.recruiter_name,
        "recruiter_email": data.recruiter_email,
        "role": data.role,
        "status": data.status,
        "referred": data.referred,
        "active": True,
        "archived": False,
    }

    # Add to user's applications array using $push
    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$push": {"applications": application_data}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return application_models.Application(**application_data)


def read_user_applications(
    db: Database, *, user_id: str
) -> list[application_models.Application]:
    """Read all applications for a user from their embedded applications array"""
    from bson import ObjectId

    user = db.member_users.find_one({"_id": ObjectId(user_id)}, {"applications": 1})

    if not user or "applications" not in user:
        return []

    return [
        application_models.Application(**app) for app in user.get("applications", [])
    ]


def read_user_application(
    db: Database, *, user_id: str, application_id: str
) -> application_models.Application | None:
    """Read a single application by UUID from user's applications array"""
    from bson import ObjectId

    user = db.member_users.find_one(
        {"_id": ObjectId(user_id)},
        {"applications": {"$elemMatch": {"id": application_id}}},
    )

    if not user or "applications" not in user or not user["applications"]:
        return None

    return application_models.Application(**user["applications"][0])


def read_all_applications(db: Database) -> list[dict]:
    """Read all applications from all users (Admin/Lead only) - uses aggregation"""
    # Use aggregation to unwind applications from all users with user info
    pipeline = [
        {"$match": {"role": 1}},  # Only members
        {"$unwind": {"path": "$applications", "preserveNullAndEmptyArrays": False}},
        {
            "$project": {
                "user_id": "$_id",
                "user_name": "$full_name",
                "user_email": "$email",
                "company": "$applications.company",
                "location": "$applications.location",
                "date": "$applications.date",
                "title": "$applications.title",
                "notes": "$applications.notes",
                "recruiter_name": "$applications.recruiter_name",
                "recruiter_email": "$applications.recruiter_email",
                "role": "$applications.role",
                "status": "$applications.status",
                "referred": "$applications.referred",
                "active": "$applications.active",
                "archived": "$applications.archived",
            }
        },
    ]

    results = list(db.member_users.aggregate(pipeline))
    return results


def update_application(
    db: Database,
    *,
    user_id: str,
    application_id: str,  # UUID
    data: application_schema.ApplicationUpdate,
) -> bool:
    """Update an application using array filters with UUID"""
    from bson import ObjectId

    # Prepare update data
    update_fields = {}
    if data.status is not None:
        update_fields["applications.$[app].status"] = data.status
    if data.referred is not None:
        update_fields["applications.$[app].referred"] = data.referred
    if data.notes is not None:
        update_fields["applications.$[app].notes"] = data.notes
    if data.recruiter_name is not None:
        update_fields["applications.$[app].recruiter_name"] = data.recruiter_name
    if data.recruiter_email is not None:
        update_fields["applications.$[app].recruiter_email"] = data.recruiter_email
    if data.location is not None:
        update_fields["applications.$[app].location"] = {
            "country": data.location.country,
            "city": data.location.city,
        }

    # Update using array filter to target specific application by UUID
    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields},
        array_filters=[{"app.id": application_id}],
    )

    return result.modified_count > 0


def archive_application(db: Database, *, user_id: str, application_id: str) -> bool:
    """Archive an application using array filter with UUID"""
    from bson import ObjectId

    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"applications.$[app].archived": True}},
        array_filters=[{"app.id": application_id}],
    )

    return result.modified_count > 0


def delete_application(db: Database, *, user_id: str, application_id: str) -> bool:
    """Delete an application from user's applications array by UUID"""
    from bson import ObjectId

    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$pull": {"applications": {"id": application_id}}}
    )

    return result.modified_count > 0


# ============= Resume CRUD Operations (Embedded in member_users) =============


def read_resumes(db: Database, *, user_id: str) -> list[application_models.Resume]:
    """Read all resumes for a user from their embedded resumes array"""
    from bson import ObjectId

    user = db.member_users.find_one({"_id": ObjectId(user_id)}, {"resumes": 1})

    if not user or "resumes" not in user:
        return []

    return [application_models.Resume(**resume) for resume in user.get("resumes", [])]


def upload_file(file, parent) -> application_schema.FileUpload:
    """Upload a file to Google Drive"""
    drive_service = service.get_drive_service()
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(file.file.read())

    file_metadata = {
        "name": file.filename,
        "parents": [parent],
    }

    media = MediaFileUpload(temp_file.name, resumable=True)
    uploaded_file = (
        drive_service.files()
        .create(
            body=file_metadata,
            media_body=media,
            fields="id,name,webContentLink",
        )
        .execute()
    )

    os.remove(temp_file.name)
    return application_schema.FileUpload(
        file_id=uploaded_file.get("id"),
        name=uploaded_file.get("name"),
        link=uploaded_file.get("webContentLink"),
    )


def create_resume(
    db: Database, file, user_id: str, role: str = "", notes: str = ""
) -> application_models.Resume:
    """Upload and create a new resume for a member (embedded in user document)"""
    from bson import ObjectId

    # Upload to Google Drive
    uploaded_file = upload_file(file=file, parent=settings.GDRIVE_RESUMES)

    new_resume = {
        "id": str(uuid4()),  # Generate unique ID
        "file_id": uploaded_file.file_id,
        "name": uploaded_file.name,
        "link": uploaded_file.link[: uploaded_file.link.find("&export=download")]
        if "&export=download" in uploaded_file.link
        else uploaded_file.link,
        "date": date.today().strftime("%Y-%m-%d"),
        "role": role,
        "notes": notes,
    }

    # Add to user's resumes array using $push
    db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$push": {"resumes": new_resume}}
    )

    return application_models.Resume(**new_resume)


def delete_resume(db: Database, *, resume_id: str, user_id: str) -> bool:
    """Delete a resume by UUID from user's embedded resumes array"""
    from bson import ObjectId

    # Remove from user's resumes array using $pull
    result = db.member_users.update_one(
        {"_id": ObjectId(user_id)}, {"$pull": {"resumes": {"id": resume_id}}}
    )

    return result.modified_count > 0


# ============= Helper Functions =============


def upload_member_file(file, parent) -> application_schema.FileUpload:
    drive_service = service.get_drive_service()
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(file.file.read())

    file_metadata = {
        "name": file.filename,
        "parents": [parent],
    }

    media = MediaFileUpload(temp_file.name, resumable=True)
    uploaded_file = (
        drive_service.files()
        .create(
            body=file_metadata,
            media_body=media,
            fields="id,name,webContentLink",
        )
        .execute()
    )

    os.remove(temp_file.name)
    return application_schema.FileUpload(
        file_id=uploaded_file.get("id"),
        name=uploaded_file.get("name"),
        link=uploaded_file.get("webContentLink"),
    )


# def update(
#     db: Database,
#     *,
#     db_obj: company_models.Company,
#     data: referral_company_schema.CompanyUpdate | dict[str, Any],
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
