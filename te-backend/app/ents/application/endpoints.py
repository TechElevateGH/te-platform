from typing import Any, Dict
import logging

import app.database.session as session
import app.ents.application.crud as application_crud
import app.ents.application.dependencies as application_dependencies
import app.ents.application.schema as application_schema
import app.ents.user.dependencies as user_dependencies
from fastapi import APIRouter, Depends, File, Form, UploadFile, status, HTTPException
from pymongo.database import Database

# Routers with clear, RESTful naming
applications_router = APIRouter(prefix="/applications", tags=["Applications"])
user_applications_router = APIRouter(
    prefix="/users/{user_id}/applications", tags=["User Applications"]
)
user_resumes_router = APIRouter(
    prefix="/users/{user_id}/resumes", tags=["User Resumes"]
)

logger = logging.getLogger(__name__)


def resume_to_read(resume):
    """Convert Resume model to ResumeRead schema"""
    resume_dict = resume.model_dump()
    return application_schema.ResumeRead(**resume_dict)


# ============= User Applications Endpoints =============


@user_applications_router.post(
    "",
    response_model=Dict[str, application_schema.ApplicationRead],
    status_code=status.HTTP_201_CREATED,
)
def create_user_application(
    *,
    db: Database = Depends(session.get_db),
    user_id: str,
    data: application_schema.ApplicationCreate,
    current_user=Depends(user_dependencies.get_current_member_only),
) -> Any:
    """
    Create a new job application for the authenticated member.

    - **user_id**: Member's user ID (must match authenticated user)
    - **data**: Application details (company, role, status, etc.)
    - Returns: Created application with generated UUID

    Only available for Members (role=1).
    """
    # Ensure user can only create applications for themselves
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=403, detail="Can only create applications for yourself"
        )

    application = application_crud.create_application(db, data=data, user_id=user_id)
    return {"application": application_dependencies.parse_application(application)}


@user_applications_router.get(
    "", response_model=Dict[str, list[application_schema.ApplicationRead]]
)
def get_user_applications(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    current_user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve all active applications for a specific user.

    - **user_id**: User's ID
    - Returns: List of active, non-archived applications

    Members can only view their own applications.
    Leads/Admins can view any user's applications.
    """
    # Authorization: Members can only view their own
    user_role = user_dependencies.get_user_role(current_user)
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=403, detail="Can only view your own applications"
        )

    applications = application_crud.read_user_applications(db, user_id=user_id)

    return {
        "applications": [
            application_dependencies.parse_application(app)
            for app in applications
            if (app.active and not app.archived)
        ]
    }


@user_applications_router.get(
    "/{application_id}", response_model=Dict[str, application_schema.ApplicationRead]
)
def get_user_application(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    application_id: str,
    current_user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve a specific application by UUID.

    - **user_id**: User's ID
    - **application_id**: Application UUID
    - Returns: Application details
    """
    # Authorization check
    user_role = user_dependencies.get_user_role(current_user)
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=403, detail="Can only view your own applications"
        )

    application = application_crud.read_user_application(
        db, user_id=user_id, application_id=application_id
    )

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    return {"application": application_dependencies.parse_application(application)}


@user_applications_router.patch("/{application_id}", response_model=Dict[str, str])
def update_user_application(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    application_id: str,
    data: application_schema.ApplicationUpdate,
    current_user=Depends(user_dependencies.get_current_user),
):
    """
    Update an existing application.

    - **user_id**: User's ID
    - **application_id**: Application UUID
    - **data**: Fields to update (status, notes, recruiter info, etc.)
    - Returns: Success message

    Members can only update their own applications.
    """
    # Authorization check
    user_role = user_dependencies.get_user_role(current_user)
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=403, detail="Can only update your own applications"
        )

    success = application_crud.update_application(
        db, user_id=user_id, application_id=application_id, data=data
    )

    if not success:
        raise HTTPException(
            status_code=404, detail="Application not found or no changes made"
        )

    return {"message": "Application updated successfully"}


@user_applications_router.delete("/{application_id}", status_code=status.HTTP_200_OK)
def delete_user_application(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    application_id: str,
    current_user=Depends(user_dependencies.get_current_user),
):
    """
    Delete an application permanently.

    - **user_id**: User's ID
    - **application_id**: Application UUID
    - Returns: Success message

    Members can only delete their own applications.
    """
    # Authorization check
    user_role = user_dependencies.get_user_role(current_user)
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=403, detail="Can only delete your own applications"
        )

    success = application_crud.delete_application(
        db, user_id=user_id, application_id=application_id
    )

    if not success:
        raise HTTPException(status_code=404, detail="Application not found")

    return {"message": "Application deleted successfully"}


# ============= Admin/Lead Applications Endpoints =============


@applications_router.get("", response_model=Dict[str, list])
def list_all_applications(
    db: Database = Depends(session.get_db),
    current_user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve all applications across all members (Lead/Admin only).

    Uses MongoDB aggregation pipeline to efficiently fetch applications
    from embedded documents with user information.

    - Returns: List of all applications with user details
    - **Requires**: Lead (role >= 4) or Admin (role >= 5) access
    """
    # Authorization: Lead or Admin only
    user_role = user_dependencies.get_user_role(current_user)
    if user_role < 4:
        raise HTTPException(status_code=403, detail="Lead or Admin access required")

    try:
        applications = application_crud.read_all_applications(db)
        return {"applications": applications}
    except Exception as exc:
        logger.error(f"Error retrieving all applications: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve applications")


@applications_router.patch("/archive", status_code=status.HTTP_200_OK)
def archive_applications(
    db: Database = Depends(session.get_db),
    *,
    application_ids: list[str],  # List of application UUIDs
    current_user=Depends(user_dependencies.get_current_member_only),
):
    """
    Archive multiple applications (soft delete).

    - **application_ids**: List of application UUIDs to archive
    - Returns: Success message

    Archived applications are hidden from default views but not deleted.
    Members can only archive their own applications.
    """
    user_id = str(current_user.id)

    for app_id in application_ids:
        if not application_crud.archive_application(
            db, user_id=user_id, application_id=app_id
        ):
            raise HTTPException(
                status_code=404, detail=f"Application {app_id} not found"
            )

    return {"message": f"Successfully archived {len(application_ids)} application(s)"}


# ============= User Resumes Endpoints =============


@user_resumes_router.get("", response_model=Dict[str, application_schema.ResumesRead])
def list_user_resumes(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    current_user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Retrieve all resumes for a specific user.

    - **user_id**: User's ID
    - Returns: List of resume files with metadata

    Members can only view their own resumes.
    Leads/Admins can view any user's resumes.
    """
    # Authorization check
    user_role = user_dependencies.get_user_role(current_user)
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Can only view your own resumes")

    resumes = application_crud.read_resumes(db, user_id=user_id)

    return {
        "resumes": application_schema.ResumesRead(
            resumes=[resume_to_read(resume) for resume in resumes]
        )
    }


@user_resumes_router.post(
    "",
    response_model=Dict[str, application_schema.ResumeRead],
    status_code=status.HTTP_201_CREATED,
)
def upload_user_resume(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    file: UploadFile = File(...),
    role: str = Form(default="", description="Target role for this resume"),
    notes: str = Form(default="", description="Additional notes about this resume"),
    current_user=Depends(user_dependencies.get_current_member_only),
) -> Any:
    """
    Upload a new resume PDF for the authenticated member.

    - **user_id**: Member's user ID (must match authenticated user)
    - **file**: PDF file to upload
    - **role**: Target job role/position for this resume (optional)
    - **notes**: Additional context or notes (optional)
    - Returns: Created resume with UUID and Google Drive link

    **File Requirements:**
    - Format: PDF only
    - Uploaded to Google Drive
    - Automatically assigned a unique UUID

    Only available for Members (role=1).
    """
    # Ensure user can only upload for themselves
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=403, detail="Can only upload resumes for yourself"
        )

    # Validate file type - only accept PDFs
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are accepted. Please upload a PDF file.",
        )

    uploaded_resume = application_crud.create_resume(db, file, user_id, role, notes)

    return {"resume": resume_to_read(uploaded_resume)}


@user_resumes_router.patch("/{resume_id}", response_model=Dict[str, application_schema.ResumeRead])
def update_user_resume(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    resume_id: str,
    data: application_schema.ResumeUpdate,
    current_user=Depends(user_dependencies.get_current_user),
) -> Any:
    """Update resume metadata such as display name, notes, role, or archived status."""
    from app.core.permissions import get_user_role

    user_role = get_user_role(current_user)

    # Only Member (1), Lead (4), or Admin (5) can update resumes
    if user_role not in [1, 4, 5]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update resumes",
        )

    # Members can only update their own resumes
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update your own resumes",
        )

    updated_resume = application_crud.update_resume(
        db, resume_id=resume_id, user_id=user_id, data=data
    )

    if not updated_resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or no changes made",
        )

    return {"resume": resume_to_read(updated_resume)}


@user_resumes_router.delete("/{resume_id}", status_code=status.HTTP_200_OK)
def delete_user_resume(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    resume_id: str,
    current_user=Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Delete a resume by UUID.

    - **user_id**: User's ID
    - **resume_id**: Resume UUID
    - Returns: Success message

    **Permissions:**
    - Members (role=1): Can only delete their own resumes
    - Leads (role>=4): Can delete any member's resumes
    - Admins (role>=5): Can delete any resumes
    """
    from app.core.permissions import get_user_role

    user_role = get_user_role(current_user)

    # Only Member (1), Lead (4), or Admin (5) can delete resumes
    if user_role not in [1, 4, 5]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete resumes",
        )

    # Members can only delete their own resumes
    if user_role == 1 and str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only delete your own resumes",
        )

    success = application_crud.delete_resume(db, resume_id=resume_id, user_id=user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found"
        )

    return {"message": "Resume deleted successfully"}
