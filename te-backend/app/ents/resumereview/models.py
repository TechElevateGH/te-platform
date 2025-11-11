from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from app.ents.user.models import PyObjectId


class ResumeReview(BaseModel):
    """MongoDB ResumeReview document model"""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId  # Member who submitted the request
    user_name: str  # Member's full name
    user_email: str  # Member's email
    resume_link: str  # Google Docs link to resume
    job_title: str  # Target job title
    level: str  # Entry, Mid, Senior, etc.
    status: str = "Pending"  # Pending, In Review, Completed, Declined, Cancelled
    submitted_date: str  # Date when request was submitted
    reviewed_by: Optional[PyObjectId] = None  # Volunteer/Lead/Admin who reviews
    reviewer_name: Optional[str] = None  # Reviewer's name
    assigned_date: Optional[str] = None  # Date when assigned to reviewer
    review_date: Optional[str] = None  # Date when reviewed
    feedback: str = ""  # Reviewer's feedback/comments
    notes: str = ""  # Additional notes
    updated_at: Optional[str] = None  # Last update timestamp

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
