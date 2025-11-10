from typing import Optional
from pydantic import BaseModel


class ResumeReviewCreate(BaseModel):
    """Schema for creating a resume review request"""

    resume_link: str
    job_title: str
    level: str  # Entry Level, Mid Level, Senior Level, etc.
    notes: str = ""


class ResumeReviewUpdate(BaseModel):
    """Schema for updating a resume review request"""

    status: Optional[str] = None
    feedback: Optional[str] = None
    notes: Optional[str] = None


class ResumeReviewRead(BaseModel):
    """Schema for reading resume review data"""

    id: str
    user_id: str
    user_name: str
    user_email: str
    resume_link: str
    job_title: str
    level: str
    status: str
    submitted_date: str
    reviewed_by: Optional[str] = None
    reviewer_name: Optional[str] = None
    assigned_date: Optional[str] = None
    review_date: Optional[str] = None
    feedback: str = ""
    notes: str = ""
