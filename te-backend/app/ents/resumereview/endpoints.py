from typing import Any, Dict
from fastapi import APIRouter, Depends
from pymongo.database import Database
import app.database.session as session
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
import app.ents.resumereview.crud as review_crud
import app.ents.resumereview.schema as review_schema
from app.core.permissions import require_volunteer

router = APIRouter()


@router.post("", response_model=Dict[str, Any])
def create_resume_review_request(
    *,
    db: Database = Depends(session.get_db),
    data: review_schema.ResumeReviewCreate,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Create a new resume review request (Members only)
    """
    review = review_crud.create_review_request(
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


@router.get("/all", response_model=Dict[str, Any])
def get_all_resume_review_requests(
    db: Database = Depends(session.get_db),
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get all resume review requests (Volunteers and above only)
    """
    # Check if user is at least a Volunteer (role >= 3)
    require_volunteer(current_user)

    reviews = review_crud.read_all_review_requests(db)
    return {"reviews": reviews}


@router.get("/my-requests", response_model=Dict[str, Any])
def get_my_resume_review_requests(
    db: Database = Depends(session.get_db),
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get resume review requests for the current user
    """
    reviews = review_crud.read_user_review_requests(db, user_id=str(current_user.id))
    return {"reviews": reviews}


@router.patch("/{review_id}", response_model=Dict[str, Any])
def update_resume_review_request(
    *,
    db: Database = Depends(session.get_db),
    review_id: str,
    data: review_schema.ResumeReviewUpdate,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Update a resume review request (Volunteers and above only)
    """
    # Check if user is at least a Volunteer (role >= 3)
    require_volunteer(current_user)

    updated_review = review_crud.update_review_request(
        db,
        review_id=review_id,
        reviewer_id=str(current_user.id),
        reviewer_name=current_user.full_name
        if hasattr(current_user, "full_name")
        else current_user.username,
        data=data,
    )
    return {
        "message": "Resume review request updated successfully",
        "review": updated_review,
    }


@router.delete("/{review_id}", response_model=Dict[str, Any])
def delete_resume_review_request(
    *,
    db: Database = Depends(session.get_db),
    review_id: str,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Delete a resume review request (User can delete their own, Volunteers+ can delete any)
    """
    review_crud.delete_review_request(db, review_id=review_id)
    return {"message": "Resume review request deleted successfully"}
