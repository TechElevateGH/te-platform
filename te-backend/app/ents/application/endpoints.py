from typing import Any, Dict
import logging

import app.database.session as session
import app.ents.application.crud as application_crud
import app.ents.application.dependencies as application_dependencies
import app.ents.application.schema as application_schema
import app.ents.user.dependencies as user_dependencies
from fastapi import APIRouter, Depends, status, HTTPException
from pymongo.database import Database

# Routers with clear, RESTful naming
applications_router = APIRouter(prefix="/applications", tags=["Applications"])
user_applications_router = APIRouter(
    prefix="/users/{user_id}/applications", tags=["User Applications"]
)

logger = logging.getLogger(__name__)

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


