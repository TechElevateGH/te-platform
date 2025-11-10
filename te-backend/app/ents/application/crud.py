import os
import tempfile
from datetime import date
from typing import Optional

import app.core.service as service
import app.ents.application.models as application_models
import app.ents.application.schema as application_schema
import app.ents.company.crud as company_crud
import app.ents.company.schema as company_schema
import app.ents.user.crud as user_crud
from app.core.settings import settings
from googleapiclient.http import MediaFileUpload
from pymongo.database import Database


def read_application_by_id(
    db: Database, *, application_id: int
) -> Optional[application_models.Application]:
    """Returns the `Application` with id `application_id`."""

    return (
        db.query(application_models.Application)
        .filter(application_models.Application.id == application_id)
        .first()
    )


def read_application_multi(
    db: Database, *, skip: int = 0, limit: int = 100
) -> list[application_models.Application]:
    """Returns the next `limit` applications after `skip` applications."""
    return db.query(application_models.Application).offset(skip).limit(limit).all()


def create_application(
    db: Database, *, user_id: int, data: application_schema.ApplicationCreate
):
    """Create an `Application` for user `user_id` with `data`."""
    location = None
    company = company_crud.read_company_by_name(db, name=data.company)
    if not company:
        company = company_crud.create_company(
            db,
            data=company_schema.CompanyCreate(
                **{
                    "name": data.company,
                    "location": {
                        "country": data.location.country,
                        "city": data.location.city,
                    },
                    "domain": "",
                }
            ),
        )
        location = company.locations[0]

    if not location:
        for loc in company.locations:
            if loc.country == data.location.country and loc.city == data.location.city:
                location = loc
                break
            if loc.country == data.location.country:
                location = loc

        if not location:
            location = company_crud.add_location(
                db, company=company, data=data.location
            ).locations[-1]

    application = application_models.Application(
        **(data.dict(exclude={"company", "location"}))
    )

    application.company = company
    application.location = location
    application.date = date.today().strftime("%Y-%m-%d")

    application.user_id = user_id

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


def read_user_applications(
    db: Database, *, user_id
) -> list[application_models.Application]:
    """Read all applications of user `user_id`."""
    user = user_crud.read_user_by_id(db, id=user_id)
    if not user:
        raise
    return user.applications


def read_user_application(
    db: Database, *, user_id: int, application_id: int
) -> application_models.Application:
    user = user_crud.read_user_by_id(db, id=user_id)
    if not user:
        ...

    application = read_application_by_id(db, application_id=application_id)
    return application


def read_user_application_files(
    db: Database, *, user_id: str
) -> list[application_models.File]:
    """Read all files for a user from MongoDB"""
    from bson import ObjectId

    files_data = db.files.find({"user_id": ObjectId(user_id)}).sort("date", -1)
    return [application_models.File(**file) for file in files_data]


def update_application(
    db: Database,
    *,
    user_id: int,
    application_id: int,
    data: application_schema.ApplicationUpdate,
) -> application_models.Application:
    user = user_crud.read_user_by_id(db, id=user_id)
    if not user:
        ...

    application = read_application_by_id(db, application_id=application_id)
    if not application:
        ...

    base_app = application_schema.ApplicationUpdateBase(**data.dict())

    location = None
    for loc in application.company.locations:
        if loc.country == data.location.country and loc.city == data.location.city:
            location = loc
            break
        if loc.country == data.location.country:
            location = loc

    if location and not location.city:
        location.city = data.location.city
        db.add(location)

    elif not location:
        location = company_crud.add_location(
            db, company=application.company, data=data.location
        ).locations[-1]

    for key, value in base_app.dict().items():
        setattr(application, key, value)

    application.location = location

    db.add(application)
    db.commit()
    db.refresh(application)
    db.refresh(location)

    return application


def archive_application(
    db: Database, *, user_id: int, application_id: int
) -> application_models.Application:
    application = read_application_by_id(db, application_id=application_id)
    if not application:
        ...

    if application.user_id != user_id:
        return None

    application.archived = True

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


def delete_application(
    db: Database, *, application_id: int
) -> application_models.Application:
    application = read_application_by_id(db, application_id=application_id)
    if not application:
        ...

    application.active = False

    db.add(application)
    db.commit()
    db.refresh(application)

    return application


def read_user_application_file_by_id(
    db: Database, *, file_id: int, file_type: application_schema.FileType
) -> Optional[application_models.Application]:
    return (
        db.query(application_models.File)
        .filter(
            application_models.File.id == file_id,
            application_models.File.type == file_type,
        )
        .first()
    )


def upload_file(file, parent) -> application_schema.FileUpload:
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


def create_file(db, kind, file, user_id, role="", notes=""):
    from app.ents.user import crud as user_crud
    from bson import ObjectId

    uploaded_file = upload_file(
        file=file,
        parent=settings.GDRIVE_RESUMES
        if kind == application_schema.FileType.resume
        else settings.GDRIVE_OTHER_FILES,
    )

    new_file_data = {
        "file_id": uploaded_file.file_id,
        "name": uploaded_file.name,
        "link": uploaded_file.link[: uploaded_file.link.find("&export=download")],
        "date": date.today().strftime("%Y-%m-%d"),
        "user_id": ObjectId(user_id),
        "role": role,
        "notes": notes,
        "type": application_schema.FileType.resume.value
        if kind == application_schema.FileType.resume
        else application_schema.FileType.otherFile.value,
        "reviewed": False,
        "active": True,
    }

    # Insert into MongoDB
    result = db.files.insert_one(new_file_data)
    new_file_data["_id"] = result.inserted_id

    # Convert to File model
    new_file = application_models.File(**new_file_data)

    # If it's a resume, add the file ID to user's profile for fast retrieval
    if kind == application_schema.FileType.resume:
        user_crud.add_resume_file_id(
            db, user_id=user_id, file_id=str(result.inserted_id)
        )

    return new_file


def get_user_files(
    db: Database, user_id: str, file_type: application_schema.FileType
) -> list[application_models.File]:
    """Get user files from MongoDB"""
    from bson import ObjectId

    files_data = db.files.find(
        {"user_id": ObjectId(user_id), "type": file_type.value}
    ).sort("date", -1)

    return [application_models.File(**file) for file in files_data]


def get_user_resumes_by_ids(
    db: Database, file_ids: list[str]
) -> list[application_models.File]:
    """Fast retrieval of resumes by file IDs from MongoDB"""
    from bson import ObjectId

    if not file_ids:
        return []

    object_ids = [ObjectId(fid) for fid in file_ids if ObjectId.is_valid(fid)]
    files_data = db.files.find({"_id": {"$in": object_ids}}).sort("date", -1)

    return [application_models.File(**file) for file in files_data]


def resume_review(db: Database, resume_id: int):
    resume = db.application_models.File
    ...


def delete_file(db: Database, *, file_id: str, user_id: str) -> bool:
    """Delete a file from MongoDB and remove from user's resume_file_ids if it's a resume"""
    from bson import ObjectId
    from app.ents.user import crud as user_crud

    # First, get the file to check if it's a resume
    file_data = db.files.find_one(
        {"_id": ObjectId(file_id), "user_id": ObjectId(user_id)}
    )

    if not file_data:
        return False

    # Delete the file from MongoDB
    result = db.files.delete_one(
        {"_id": ObjectId(file_id), "user_id": ObjectId(user_id)}
    )

    # If it was a resume, remove from user's resume_file_ids
    if (
        result.deleted_count > 0
        and file_data.get("type") == application_schema.FileType.resume.value
    ):
        user_crud.remove_resume_file_id(db, user_id=user_id, file_id=file_id)

    return result.deleted_count > 0


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
