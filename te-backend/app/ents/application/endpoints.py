from typing import Any, Union, Dict, List

import app.database.session as session
import app.ents.application.crud as application_crud
import app.ents.application.dependencies as application_dependencies
import app.ents.application.schema as application_schema
import app.ents.user.dependencies as user_dependencies
from app.utilities.errors import OperationCompleted, UnauthorizedUser
from fastapi import APIRouter, Depends, Form, UploadFile, status
from sqlalchemy.orm import Session

app_router = APIRouter(prefix="/applications")
user_app_router = APIRouter(prefix="/users.{user_id}.applications")
user_files_router = APIRouter(prefix="/users.{user_id}.files")


@user_app_router.post(
    ".create", response_model=Dict[str, application_schema.ApplicationRead]
)
def create_application(
    *,
    db: Session = Depends(session.get_db),
    data: application_schema.ApplicationCreate,
    user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Create an application for  `user`.
    """
    application = application_crud.create_application(db, data=data, user_id=user.id)
    return {"application": application_dependencies.parse_application(application)}


@user_app_router.get(
    ".list", response_model=Dict[str, list[application_schema.ApplicationRead]]
)
def get_user_applications(
    db: Session = Depends(session.get_db),
    *,
    user_id: int,
    user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve applications of user `user_id`.
    """
    applications = application_crud.read_user_applications(db, user_id=user_id)

    return {
        "applications": [
            application_dependencies.parse_application(application)
            for application in applications
            if (application.active and not application.archived)
        ]
    }


@app_router.get(
    ".{application_id}.info",
    response_model=Dict[str, application_schema.ApplicationRead],
)
def get_user_application(
    db: Session = Depends(session.get_db),
    *,
    application_id: int,
    current_user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve application `application_id` of user `user_id`.
    """
    application = application_crud.read_user_application(
        db, user_id=current_user.id, application_id=application_id
    )

    return {"application": application_dependencies.parse_application(application)}


@app_router.put(
    ".{application_id}.update",
    response_model=Dict[str, application_schema.ApplicationRead],
)
def update_user_application(
    db: Session = Depends(session.get_db),
    *,
    application_id: int,
    data: application_schema.ApplicationUpdate,
    current_user=Depends(user_dependencies.get_current_user),
):
    """
    Update user application
    """

    application = application_crud.update_application(
        db, user_id=current_user.id, application_id=application_id, data=data
    )

    return {"application": application_dependencies.parse_application(application)}


@app_router.put(".archive", status_code=status.HTTP_202_ACCEPTED)
def archive_user_application(
    db: Session = Depends(session.get_db),
    *,
    applications: list[int],
    current_user=Depends(user_dependencies.get_current_user),
):
    """
    Archive user applications
    """
    for app_id in applications:
        if not application_crud.archive_application(
            db, user_id=current_user.id, application_id=app_id
        ):
            return {"error": UnauthorizedUser()}

    return {"data": OperationCompleted()}


@app_router.delete(".delete", status_code=status.HTTP_202_ACCEPTED)
def delete_user_application(
    db: Session = Depends(session.get_db),
    *,
    applications: Union[int, list[int]],
    current_user=Depends(user_dependencies.get_current_user),
):
    """
    Delete user applications
    """
    if isinstance(applications, int):
        applications = [applications]

    for app_id in applications:
        if not application_crud.delete_application(
            db, user_id=current_user.id, application_id=app_id
        ):
            return {"error": UnauthorizedUser()}

    return {"data": OperationCompleted()}


@user_files_router.get(".list", response_model=Dict[str, application_schema.FilesRead])
def get_user_application_files(
    db: Session = Depends(session.get_db),
    *,
    user_id: int,
    _=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve application files (resume and other files)
    """
    files = application_crud.read_user_application_files(db, user_id=user_id)
    return {
        "files": application_schema.FilesRead(
            resumes=[
                application_schema.FileRead(**vars(file))
                for file in files
                if file.type == application_schema.FileType.resume
            ],
            other_files=[
                application_schema.FileRead(**vars(file))
                for file in files
                if file.type == application_schema.FileType.resume
            ],
        )
    }


@user_files_router.post(
    ".create", response_model=Dict[str, application_schema.FileRead]
)
def add_file(
    db: Session = Depends(session.get_db),
    *,
    user_id: int,
    kind: application_schema.FileType = Form(),
    file: UploadFile = Form(),
    _=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Upload resume for user `user_id`.
    """
    file = application_crud.create_file(db, kind, file, user_id)
    return {"file": application_schema.FileRead(**vars(file))}


@user_files_router.get(
    ".resumes.list", response_model=Dict[str, list[application_schema.FileRead]]
)
def get_user_resumes(
    db: Session = Depends(session.get_db),
    *,
    user_id: int,
    _=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all resumes of user `user_id`
    """
    resumes = application_crud.get_user_files(
        db, user_id, application_schema.FileType.resume
    )
    return {
        "resumes": [application_schema.FileRead(**vars(resume)) for resume in resumes]
    }


@user_files_router.get(
    ".resumes.list", response_model=Dict[str, list[application_schema.FileRead]]
)
def resume_review(
    db: Session = Depends(session.get_db),
    *,
    user_id: int,
    _=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all resumes of user `user_id`
    """
    resumes = application_crud.resume_review(db, user_id)
    return {
        "resumes": [application_schema.FileRead(**vars(resume)) for resume in resumes]
    }


# @router.put(".info/{company_id}", response_model=company_schema.CompanyRead)
# def update_company(
#     *,
#     db: Session = Depends(application_dependencies.get_current_user_db),
#     data: company_schema.CompanyUpdate,
#     user: models.Company = Depends(application_dependencies.get_current_user),
# ) -> Any:
#     """
#     Update Company.
#     """
#     company = company.crud.read_user_by_id(db, id=company.id)
#     if not company:
#         raise HTTPException(
#             status_code=404,
#             detail={
#                 "error": {
#                     "email": company.email,
#                     "message": "The company with this name does not exist in the system",
#                 }
#             },
#         )
#     company = crud.company.update(db, db_obj=company, data=data)
#     return user
