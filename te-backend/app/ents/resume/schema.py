from typing import Optional

from pydantic import BaseModel


class ResumeBase(BaseModel):
    name: str
    date: str
    role: str = ""
    notes: str = ""
    archived: bool = False


class Resume(ResumeBase):
    file_id: str


class ResumeRead(ResumeBase):
    id: str
    file_id: str
    link: str


class ResumesRead(BaseModel):
    """Response container for multiple resumes."""

    resumes: list[ResumeRead]


class ResumeUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    notes: str | None = None
    archived: bool | None = None


class FileUpload(BaseModel):
    file_id: str
    name: str
    link: str


class ResumeReviewCreate(BaseModel):
    """Payload for creating a resume review request."""

    resume_link: str
    job_title: str
    level: str
    notes: str = ""


class ResumeReviewUpdate(BaseModel):
    """Payload for updating resume review request details."""

    status: Optional[str] = None
    feedback: Optional[str] = None
    notes: Optional[str] = None


class ResumeReviewAssign(BaseModel):
    """Payload for assigning a resume review to a reviewer."""

    reviewer_id: str
    reviewer_name: str


class BulkResumeReviewAssign(BaseModel):
    """Payload for bulk assigning resume reviews."""

    review_ids: list[str]
    reviewer_id: str
    reviewer_name: str


class ResumeReviewRead(BaseModel):
    """Response model for resume review data."""

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
