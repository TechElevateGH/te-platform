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
    db: Database, *, user_id
) -> tuple[application_models.File]:
    user = user_crud.read_user_by_id(db, id=user_id)
    if not user:
        ...

    return user.files


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
    uploaded_file = upload_file(
        file=file,
        parent=settings.GDRIVE_RESUMES
        if kind == application_schema.FileType.Resume
        else settings.GDRIVE_OTHER_FILES,
    )

    new_file = application_models.File(
        file_id=uploaded_file.file_id,
        name=uploaded_file.name,
        link=uploaded_file.link[: uploaded_file.link.find("&export=download")],
        date=date.today().strftime("%Y-%m-%d"),
        user_id=user_id,
        role=role,
        notes=notes,
        type=application_schema.FileType.resume
        if kind == "Resume"
        else application_schema.FileType.otherFile,
    )

    db.add(new_file)
    db.commit()
    db.refresh(new_file)

    return new_file


def get_user_files(
    db: Database, user_id: int, file_type: application_schema.FileType
) -> list[application_models.File]:
    files = (
        db.query(application_models.File)
        .filter(
            application_models.File.user_id == user_id,
            application_models.File.type == file_type,
        )
        .all()
    )
    return [file for file in files if file.active]


def resume_review(db: Database, resume_id: int):
    resume = db.application_models.File
    ...


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
