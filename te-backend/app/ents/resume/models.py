from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field

from app.ents.user.models import PyObjectId


class Resume(BaseModel):
    """Embedded Resume document stored on the member user record."""

    id: str  # UUID for identifying this resume
    file_id: str  # Google Drive file ID
    date: str
    link: str  # Google Drive link
    name: str
    role: str = ""  # Target role for this resume
    notes: str = ""  # Additional notes about this resume
    archived: bool = False

    class Config:
        arbitrary_types_allowed = True


class ResumeReview(BaseModel):
    """MongoDB ResumeReview document model."""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    user_name: str
    user_email: str
    resume_link: str
    job_title: str
    level: str
    status: str = "Pending"
    submitted_date: str
    reviewed_by: Optional[PyObjectId] = None
    reviewer_name: Optional[str] = None
    assigned_date: Optional[str] = None
    review_date: Optional[str] = None
    feedback: str = ""
    notes: str = ""
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
