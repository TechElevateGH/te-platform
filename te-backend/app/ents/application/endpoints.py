from typing import Any, Union, Dict
import logging

import app.database.session as session
import app.ents.application.crud as application_crud
import app.ents.application.dependencies as application_dependencies
import app.ents.application.schema as application_schema
import app.ents.user.dependencies as user_dependencies
from app.utilities.errors import OperationCompleted, UnauthorizedUser
from fastapi import APIRouter, Depends, File, Form, UploadFile, status, HTTPException
from pymongo.database import Database

apps_router = APIRouter(prefix="/applications")
user_apps_router = APIRouter(prefix="/users/{user_id}/applications")
resumes_router = APIRouter(prefix="/users/{user_id}/resumes")

logger = logging.getLogger(__name__)


def resume_to_read(resume):
    """Convert Resume model to ResumeRead schema by converting ObjectId to string"""
    resume_dict = resume.model_dump(by_alias=True)
    resume_dict["id"] = str(resume_dict.pop("_id"))
    return application_schema.ResumeRead(**resume_dict)


@user_apps_router.post("", response_model=Dict[str, application_schema.ApplicationRead])
def create_application(
    *,
    db: Database = Depends(session.get_db),
    data: application_schema.ApplicationCreate,
    user=Depends(user_dependencies.get_current_member_only),
) -> Any:
    """
    Create an application for `user`.
    Only available for Members (role=1).
    """
    application = application_crud.create_application(db, data=data, user_id=user.id)
    return {"application": application_dependencies.parse_application(application)}


@user_apps_router.get(
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


@apps_router.get("/all")
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
            except Exception as exc:
                logger.error(
                    f"Error processing application {app.id}: {exc}", exc_info=True
                )

        return {"applications": enriched_apps}
    except Exception as exc:
        logger.error(f"Error in get_all_applications: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load applications")


@apps_router.get(
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


@apps_router.put(
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


@apps_router.put("/archive", status_code=status.HTTP_202_ACCEPTED)
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


@apps_router.delete("/delete", status_code=status.HTTP_202_ACCEPTED)
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


# ============= Resume Endpoints (Multiple resumes allowed per member) =============


@resumes_router.get("", response_model=Dict[str, application_schema.ResumesRead])
def get_resumes(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    _=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve all resumes for user `user_id`
    """
    resumes = application_crud.read_resumes(db, user_id=user_id)

    return {
        "resumes": application_schema.ResumesRead(
            resumes=[resume_to_read(resume) for resume in resumes]
        )
    }


@resumes_router.post("", response_model=Dict[str, application_schema.ResumeRead])
def add_resume(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    file: UploadFile = File(...),
    role: str = Form(default=""),
    notes: str = Form(default=""),
    _=Depends(user_dependencies.get_current_member_only),
) -> Any:
    """
    Upload a new resume for user `user_id`.
    Only PDF files are accepted.
    Only available for Members (role=1).
    """
    # Validate file type - only accept PDFs
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted. Please upload a PDF file.",
        )

    uploaded_resume = application_crud.create_resume(db, file, user_id, role, notes)

    return {"resume": resume_to_read(uploaded_resume)}


@resumes_router.delete("/{file_id}", status_code=status.HTTP_200_OK)
def delete_resume(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    file_id: str,
    current_user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Delete a resume for user `user_id` (Only Member, Lead, or Admin)
    - Members can only delete their own resumes
    - Lead and Admin can delete any resumes
    """
    from app.core.permissions import get_user_role

    user_role = get_user_role(current_user)

    # Only Member (1), Lead (4), or Admin (5) can delete resumes
    if user_role not in [1, 4, 5]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Members, Leads, or Admins can delete resumes",
        )

    # Members can only delete their own resumes
    if user_role == 1 and str(current_user.id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own resumes",
        )

    success = application_crud.delete_resume(db, file_id=file_id, user_id=user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )

    return {"message": "Resume deleted successfully"}
