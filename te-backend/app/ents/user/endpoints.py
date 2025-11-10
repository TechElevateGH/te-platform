from typing import Any, Dict
import app.database.session as session
import app.ents.user.crud as user_crud
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
import app.ents.user.schema as user_schema
from fastapi import APIRouter, Depends
from pymongo.database import Database

router = APIRouter(prefix="/users")


@router.get("/{user_id}", response_model=Dict[str, user_schema.UserRead])
def get_user_by_id(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    _: user_models.User = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get user with id `user_id`
    """
    user = user_crud.read_user_by_id(db, id=user_id)
    return {"user": user_schema.UserRead(**vars(user))}


@router.patch("/{user_id}", response_model=Dict[str, user_schema.UserRead])
def update_user_profile(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    data: user_schema.UserUpdate,
    _: user_models.User = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Update user profile information
    """
    updated_user = user_crud.update_user_profile(db, user_id=user_id, data=data)
    return {"user": user_schema.UserRead(**vars(updated_user))}


@router.post("", response_model=Dict[str, user_schema.UserRead])
def create_user(
    *,
    db: Database = Depends(session.get_db),
    data: user_schema.UserCreate,
) -> Any:
    """
    Create a User.
    """
    new_user = user_crud.create_user(db, data=data)
    return {"user": user_schema.UserRead(**vars(new_user))}


@router.post("/leads", response_model=Dict[str, Any])
def create_lead_account(
    *,
    db: Database = Depends(session.get_db),
    data: user_schema.LeadCreate,
    _: user_models.User = Depends(user_dependencies.get_current_admin),
) -> Any:
    """
    Create a Lead account (Admin only).
    Returns user info and a secure token that should be shared with the Lead user.
    This token can only be viewed once at creation.
    """
    result = user_crud.create_lead_user(db, data=data)
    return {
        "lead": result,
        "message": "Lead account created successfully. Please share the token securely with the user."
    }


@router.get("/{user_id}/essay", response_model=user_schema.Essay)
def get_essay(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    _: user_models.User = Depends(user_dependencies.get_current_user),
):
    essay = user_crud.read_user_essay(db, user_id=user_id)
    return user_schema.Essay(essay=essay)


@router.post("/{user_id}/essay", response_model=user_schema.Essay)
def update_essay(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    data: user_schema.Essay,
    _: user_models.User = Depends(user_dependencies.get_current_user),
):
    essay = user_crud.add_user_essay(db, user_id=user_id, data=data)
    return user_schema.Essay(essay=essay)


@router.get("/{user_id}/cover-letter", response_model=user_schema.CoverLetter)
def get_cover_letter(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    _: user_models.User = Depends(user_dependencies.get_current_user),
):
    cover_letter = user_crud.read_user_cover_letter(db, user_id=user_id)
    return user_schema.CoverLetter(cover_letter=cover_letter)


@router.post("/{user_id}/cover-letter", response_model=user_schema.CoverLetter)
def update_cover_letter(
    db: Database = Depends(session.get_db),
    *,
    user_id: str,
    data: user_schema.CoverLetter,
    _: user_models.User = Depends(user_dependencies.get_current_user),
):
    cover_letter = user_crud.add_user_cover_letter(db, user_id=user_id, data=data)
    return user_schema.CoverLetter(cover_letter=cover_letter)
