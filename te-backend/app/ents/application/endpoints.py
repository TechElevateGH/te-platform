from typing import Any, Union, Dict

import app.database.session as session
import app.ents.application.crud as application_crud
import app.ents.application.dependencies as application_dependencies
import app.ents.application.schema as application_schema
import app.ents.user.dependencies as user_dependencies
from app.utilities.errors import OperationCompleted, UnauthorizedUser
from fastapi import APIRouter, Depends, File, Form, UploadFile, status, HTTPException
from pymongo.database import Database

app_router = APIRouter(prefix="/applications")
user_app_router = APIRouter(prefix="/users/{user_id}/applications")
user_files_router = APIRouter(prefix="/users/{user_id}/files")


def file_to_read(file):
    """Convert File model to FileRead schema by converting ObjectId to string"""
    file_dict = file.model_dump(by_alias=True)
    file_dict["id"] = str(file_dict.pop("_id"))
    return application_schema.FileRead(**file_dict)


@user_app_router.post("", response_model=Dict[str, application_schema.ApplicationRead])
def create_application(
    *,
    db: Database = Depends(session.get_db),
    data: application_schema.ApplicationCreate,
    user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Create an application for `user`.
    """
    application = application_crud.create_application(db, data=data, user_id=user.id)
    return {"application": application_dependencies.parse_application(application)}


@user_app_router.get(
    "", response_model=Dict[str, list[application_schema.ApplicationRead]]
)
def get_user_applications(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
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


@app_router.get("/all")
def get_all_applications(
    db: Database = Depends(session.get_db),
    current_user=Depends(user_dependencies.get_current_user),
) -> Any:
    """Retrieve all applications across members for admin dashboards."""
    import app.ents.user.crud as user_crud

    # Only allow admins/leads (role >= 5)
    if user_dependencies.get_user_role(current_user) < 5:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        applications = application_crud.read_all_applications(db)

        enriched_apps: list[Dict[str, Any]] = []
        for app in applications:
            try:
                parsed = application_dependencies.parse_application(app).model_dump()
                user = user_crud.read_user_by_id(db, id=str(app.user_id))
                parsed["user_name"] = user.full_name if user else "Unknown User"
                parsed["user_email"] = user.email if user else ""
                enriched_apps.append(parsed)
            except Exception as exc:  # pragma: no cover - defensive logging
                print(f"Error processing application {app.id}: {exc}")
                import traceback

                traceback.print_exc()

        return {"applications": enriched_apps}
    except Exception as exc:
        print(f"Error in get_all_applications: {exc}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to load applications")


@app_router.get(
    "/{application_id}",
    response_model=Dict[str, application_schema.ApplicationRead],
)
def get_user_application(
    db: Database = Depends(session.get_db),
    *,
    application_id: str,
    current_user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve application `application_id` of user.
    """
    application = application_crud.read_user_application(
        db, user_id=current_user.id, application_id=application_id
    )

    return {"application": application_dependencies.parse_application(application)}


@app_router.put(
    "/{application_id}",
    response_model=Dict[str, application_schema.ApplicationRead],
)
def update_user_application(
    db: Database = Depends(session.get_db),
    *,
    application_id: str,
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


@app_router.put("/archive", status_code=status.HTTP_202_ACCEPTED)
def archive_user_application(
    db: Database = Depends(session.get_db),
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


@app_router.delete("/delete", status_code=status.HTTP_202_ACCEPTED)
def delete_user_application(
    db: Database = Depends(session.get_db),
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


@user_files_router.get("", response_model=Dict[str, application_schema.FilesRead])
def get_user_application_files(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    _=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve application files (resume and other files)
    """
    files = application_crud.read_user_application_files(db, user_id=user_id)

    return {
        "files": application_schema.FilesRead(
            resumes=[
                file_to_read(file)
                for file in files
                if file.type == application_schema.FileType.resume.value
            ],
            other_files=[
                file_to_read(file)
                for file in files
                if file.type == application_schema.FileType.otherFile.value
            ],
        )
    }


@user_files_router.post("", response_model=Dict[str, application_schema.FileRead])
def add_file(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    kind: application_schema.FileType = Form(
        default=application_schema.FileType.resume
    ),
    file: UploadFile = File(...),
    role: str = Form(default=""),
    notes: str = Form(default=""),
    _=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Upload resume for user `user_id` with role and notes.
    Only PDF files are accepted for resumes.
    """
    # Validate file type - only accept PDFs for resumes
    if kind == application_schema.FileType.resume:
        if not file.filename.lower().endswith(".pdf"):
            from fastapi import HTTPException

            raise HTTPException(
                status_code=400,
                detail="Only PDF files are accepted for resumes. Please upload a PDF file.",
            )

    uploaded_file = application_crud.create_file(db, kind, file, user_id, role, notes)

    # Convert File model to FileRead schema, converting ObjectId to string
    file_dict = uploaded_file.model_dump(by_alias=True)
    file_dict["id"] = str(file_dict.pop("_id"))

    return {"file": application_schema.FileRead(**file_dict)}


@user_files_router.get(
    "/resumes", response_model=Dict[str, list[application_schema.FileRead]]
)
def get_user_resumes(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    _=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all resumes of user `user_id`
    """
    resumes = application_crud.get_user_files(
        db, user_id, application_schema.FileType.resume
    )

    return {"resumes": [file_to_read(resume) for resume in resumes]}


@user_files_router.get(
    ".resumes", response_model=Dict[str, list[application_schema.FileRead]]
)
def resume_review(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    _=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all resumes of user `user_id`
    """
    resumes = application_crud.resume_review(db, user_id)
    return {"resumes": [file_to_read(resume) for resume in resumes]}


@user_files_router.delete("/{file_id}", status_code=status.HTTP_200_OK)
def delete_file(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    file_id: str,
    current_user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Delete a file for user `user_id`
    """
    success = application_crud.delete_file(db, file_id=file_id, user_id=user_id)

    if not success:
        return {"error": "File not found or unauthorized"}

    return {"message": "File deleted successfully"}
