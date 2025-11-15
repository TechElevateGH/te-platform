from typing import Any, Dict

import app.database.session as session
import app.ents.resume.crud as resume_crud
import app.ents.resume.models as resume_models
import app.ents.resume.schema as resume_schema
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
from app.core.permissions import get_user_role, require_volunteer
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from pymongo.database import Database

resumes_router = APIRouter(prefix="/resumes", tags=["Resumes"])
user_resumes_router = APIRouter(
    prefix="/users/{user_id}/resumes", tags=["User Resumes"]
)
resume_reviews_router = APIRouter(prefix="/resumes/reviews", tags=["Resume Reviews"])


def resume_to_read(resume: resume_models.Resume) -> resume_schema.ResumeRead:
    """Convert a Resume model instance into the API response schema."""

    return resume_schema.ResumeRead(**resume.model_dump())


def _require_target_user(current_user, target_user_id: str) -> int:
    """Ensure the caller can act on the provided user and return their role."""

    user_role = user_dependencies.get_user_role(current_user)
    if user_role == 1 and str(current_user.id) != target_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only manage your own resumes",
        )
    return user_role


def _resolve_user_id(current_user, user_id_override: str | None) -> tuple[str, int]:
    target_user_id = user_id_override or str(current_user.id)
    role = _require_target_user(current_user, target_user_id)
    return target_user_id, role


def _reviewer_name(user: user_models.MemberUser) -> str:
    """Best-effort display name for review assignments."""
    if hasattr(user, "full_name") and user.full_name:
        return user.full_name
    if hasattr(user, "username") and user.username:
        return user.username
    return user.email


@resumes_router.get("", response_model=Dict[str, resume_schema.ResumesRead])
def list_resumes(
    *,
    db: Database = Depends(session.get_db),
    current_user=Depends(user_dependencies.get_current_user),
    user_id: str | None = Query(
        default=None,
        description="Target user ID (Leads/Admins may supply to view other members)",
    ),
) -> Dict[str, resume_schema.ResumesRead]:
    target_user_id, _ = _resolve_user_id(current_user, user_id)
    resumes = resume_crud.read_resumes(db, user_id=target_user_id)

    return {
        "resumes": resume_schema.ResumesRead(
            resumes=[resume_to_read(resume) for resume in resumes]
        )
    }


@resumes_router.post(
    "",
    response_model=Dict[str, resume_schema.ResumeRead],
    status_code=status.HTTP_201_CREATED,
)
def upload_resume(
    *,
    db: Database = Depends(session.get_db),
    file: UploadFile = File(...),
    role: str = Form(default="", description="Target role for this resume"),
    notes: str = Form(default="", description="Additional notes about this resume"),
    current_user=Depends(user_dependencies.get_current_member_only),
) -> Dict[str, resume_schema.ResumeRead]:
    target_user_id = str(current_user.id)

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted. Please upload a PDF file.",
        )

    uploaded_resume = resume_crud.create_resume(
        db, file=file, user_id=target_user_id, role=role, notes=notes
    )

    return {"resume": resume_to_read(uploaded_resume)}


@resumes_router.patch(
    "/{resume_id}", response_model=Dict[str, resume_schema.ResumeRead]
)
def update_resume(
    *,
    db: Database = Depends(session.get_db),
    resume_id: str,
    data: resume_schema.ResumeUpdate,
    current_user=Depends(user_dependencies.get_current_user),
    user_id: str | None = Query(
        default=None,
        description="Target user ID (required when updating another member)",
    ),
) -> Dict[str, resume_schema.ResumeRead]:
    target_user_id, user_role = _resolve_user_id(current_user, user_id)

    # Only Member (1), Lead (4), or Admin (5) can update resumes
    if user_role not in [1, 4, 5]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update resumes",
        )

    updated_resume = resume_crud.update_resume(
        db, resume_id=resume_id, user_id=target_user_id, data=data
    )

    if not updated_resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or no changes made",
        )

    return {"resume": resume_to_read(updated_resume)}


@resumes_router.delete("/{resume_id}", status_code=status.HTTP_200_OK)
def delete_resume(
    *,
    db: Database = Depends(session.get_db),
    resume_id: str,
    current_user=Depends(user_dependencies.get_current_user),
    user_id: str | None = Query(
        default=None,
        description="Target user ID (required when deleting another member)",
    ),
) -> Dict[str, str]:
    target_user_id, user_role = _resolve_user_id(current_user, user_id)

    if user_role not in [1, 4, 5]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete resumes",
        )

    success = resume_crud.delete_resume(db, resume_id=resume_id, user_id=target_user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    return {"message": "Resume deleted successfully"}


@user_resumes_router.get("", response_model=Dict[str, resume_schema.ResumesRead])
def list_user_resumes(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    current_user=Depends(user_dependencies.get_current_user),
) -> Dict[str, resume_schema.ResumesRead]:
    _require_target_user(current_user, user_id)
    resumes = resume_crud.read_resumes(db, user_id=user_id)

    return {
        "resumes": resume_schema.ResumesRead(
            resumes=[resume_to_read(resume) for resume in resumes]
        )
    }


@user_resumes_router.post(
    "",
    response_model=Dict[str, resume_schema.ResumeRead],
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
) -> Dict[str, resume_schema.ResumeRead]:
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only upload resumes for yourself",
        )

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted. Please upload a PDF file.",
        )

    uploaded_resume = resume_crud.create_resume(
        db, file=file, user_id=user_id, role=role, notes=notes
    )

    return {"resume": resume_to_read(uploaded_resume)}


@user_resumes_router.patch(
    "/{resume_id}", response_model=Dict[str, resume_schema.ResumeRead]
)
def update_user_resume(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    resume_id: str,
    data: resume_schema.ResumeUpdate,
    current_user=Depends(user_dependencies.get_current_user),
) -> Dict[str, resume_schema.ResumeRead]:
    user_role = _require_target_user(current_user, user_id)

    if user_role not in [1, 4, 5]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update resumes",
        )

    updated_resume = resume_crud.update_resume(
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
) -> Dict[str, str]:
    user_role = _require_target_user(current_user, user_id)

    if user_role not in [1, 4, 5]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete resumes",
        )

    success = resume_crud.delete_resume(db, resume_id=resume_id, user_id=user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )

    return {"message": "Resume deleted successfully"}


@resume_reviews_router.post("", response_model=Dict[str, Any])
def create_resume_review_request(
    *,
    db: Database = Depends(session.get_db),
    data: resume_schema.ResumeReviewCreate,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Dict[str, Any]:
    """Create a new resume review request (members only)."""
    review = resume_crud.create_review_request(
        db,
        user_id=str(current_user.id),
        user_name=current_user.full_name,
        user_email=current_user.email,
        data=data,
    )
    return {
        "message": "Resume review request submitted successfully",
        "review_id": str(review.id),
    }


@resume_reviews_router.get("", response_model=Dict[str, Any])
def get_resume_review_requests(
    db: Database = Depends(session.get_db),
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
    user_id: str | None = Query(
        default=None,
        description="Filter by user ID. If not provided, returns all reviews (Volunteers+ only).",
    ),
) -> Dict[str, Any]:
    """
    Get resume review requests.
    - If user_id is provided: Returns reviews for that specific user
    - If user_id is not provided: Returns all reviews (requires Volunteer+ role)

    Members can only view their own reviews.
    Volunteers and above can view all reviews or filter by user_id.
    """
    user_role = get_user_role(current_user)

    # If filtering by specific user
    if user_id:
        # Members can only view their own reviews
        if user_role == 1 and str(current_user.id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Members can only view their own resume review requests",
            )
        reviews = resume_crud.read_user_review_requests(db, user_id=user_id)
    else:
        # Viewing all reviews requires Volunteer+ role
        require_volunteer(current_user)
        reviews = resume_crud.read_all_review_requests(db)

    return {"reviews": reviews}


@resume_reviews_router.patch("", response_model=Dict[str, Any])
def update_resume_review_request(
    *,
    db: Database = Depends(session.get_db),
    review_id: str = Query(..., description="ID of the review to update"),
    data: resume_schema.ResumeReviewUpdate,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Dict[str, Any]:
    """Update a resume review request (Volunteers and above only)."""
    require_volunteer(current_user)

    updated_review = resume_crud.update_review_request(
        db,
        review_id=review_id,
        reviewer_id=str(current_user.id),
        reviewer_name=_reviewer_name(current_user),
        data=data,
    )
    return {
        "message": "Resume review request updated successfully",
        "review": updated_review,
    }


@resume_reviews_router.patch("/cancel", response_model=Dict[str, Any])
def cancel_resume_review_request(
    *,
    db: Database = Depends(session.get_db),
    review_id: str = Query(..., description="ID of the review to cancel"),
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Dict[str, Any]:
    """Cancel a resume review request (members can cancel their own)."""
    review = resume_crud.get_review_by_id(db, review_id=review_id)
    if str(review.user_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own resume review requests",
        )

    updated_review = resume_crud.update_review_request(
        db,
        review_id=review_id,
        reviewer_id=str(current_user.id),
        reviewer_name=_reviewer_name(current_user),
        data=resume_schema.ResumeReviewUpdate(status="Cancelled"),
    )

    return {
        "message": "Resume review request cancelled successfully",
        "review": updated_review,
    }


@resume_reviews_router.delete("", response_model=Dict[str, Any])
def delete_resume_review_request(
    *,
    db: Database = Depends(session.get_db),
    review_id: str = Query(..., description="ID of the review to delete"),
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Dict[str, Any]:
    """Delete a resume review request (Admin only - hard delete)."""
    user_role = get_user_role(current_user)
    if user_role != 5:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can permanently delete resume review requests",
        )

    resume_crud.get_review_by_id(db, review_id=review_id)

    resume_crud.delete_review_request(db, review_id=review_id)
    return {"message": "Resume review request permanently deleted successfully"}


@resume_reviews_router.post("/assign", response_model=Dict[str, Any])
def assign_resume_review(
    *,
    db: Database = Depends(session.get_db),
    review_id: str = Query(..., description="ID of the review to assign"),
    data: resume_schema.ResumeReviewAssign,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Dict[str, Any]:
    """Assign a resume review to a specific reviewer (Lead and above only)."""
    user_role = get_user_role(current_user)
    if user_role < 4:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Leads and Admins can assign resume reviews",
        )

    assigned_review = resume_crud.assign_review_to_reviewer(
        db,
        review_id=review_id,
        reviewer_id=data.reviewer_id,
        reviewer_name=data.reviewer_name,
    )

    return {
        "message": "Resume review assigned successfully",
        "review": assigned_review,
    }


@resume_reviews_router.post("/bulk-assign", response_model=Dict[str, Any])
def bulk_assign_resume_reviews(
    *,
    db: Database = Depends(session.get_db),
    data: resume_schema.BulkResumeReviewAssign,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Dict[str, Any]:
    """Bulk assign multiple resume reviews to a specific reviewer (Lead and above only)."""
    user_role = get_user_role(current_user)
    if user_role < 4:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Leads and Admins can assign resume reviews",
        )

    result = resume_crud.bulk_assign_reviews_to_reviewer(
        db,
        review_ids=data.review_ids,
        reviewer_id=data.reviewer_id,
        reviewer_name=data.reviewer_name,
    )

    return result


@resume_reviews_router.get("/assignments", response_model=Dict[str, Any])
def get_review_assignments(
    *,
    db: Database = Depends(session.get_db),
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
    user_id: str | None = Query(
        default=None,
        description="Filter by assigned user ID. If not provided, returns all assignments (Admin only).",
    ),
) -> Dict[str, Any]:
    """
    Get resume review assignments.
    - If user_id is provided: Returns reviews assigned to that user (Volunteers+ can view their own)
    - If user_id is not provided: Returns all assignments (Admin only)
    """
    user_role = get_user_role(current_user)

    # If filtering by specific user
    if user_id:
        # Volunteers and above can view their own assignments
        if user_role >= 3 and str(current_user.id) != user_id:
            # Only admins can view other users' assignments
            if user_role < 5:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Can only view your own assignments unless you're an admin",
                )
        elif user_role < 3:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Volunteers and above only",
            )

        reviews = resume_crud.get_reviews_assigned_to_user(db, user_id=user_id)
        return {"reviews": reviews}
    else:
        # Viewing all assignments requires Admin role
        if user_role < 5:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required",
            )

        assignments = resume_crud.get_all_assigned_reviews(db)
        return {"assignments": assignments}
