from enum import Enum

import app.ents.referral_company.schema as referral_company_schema
from pydantic import BaseModel


# Resume Schemas (Members can have multiple resumes - PDFs in Google Drive)
class ResumeBase(BaseModel):
    name: str
    date: str
    role: str = ""  # Target role for this resume
    notes: str = ""


class Resume(ResumeBase):
    file_id: str


class ResumeRead(ResumeBase):
    id: str  # MongoDB ObjectId as string
    file_id: str
    link: str


class ResumesRead(BaseModel):
    """Response containing all resumes for a member"""
    resumes: list[ResumeRead]


# File Upload Response
class FileUpload(BaseModel):
    file_id: str
    name: str
    link: str


class ApplicationStatuses(Enum):
    submitted: str = "Submitted"
    oa: str = "OA"
    phone_interview: str = "Phone interview"
    final_interview: str = "Final interview"
    hr: str = "HR"
    recruiter_call: str = "Recruiter call"
    offer: str = "Offer"
    not_now: str = "Not now"


class ApplicationBase(BaseModel):
    title: str
    notes: str = ""
    recruiter_name: str = ""
    recruiter_email: str = ""
    active: bool = True
    archived: bool = False
    date: str = None
    role: str
    status: str
    referred: bool = False


class ApplicationCreate(ApplicationBase):
    company: str
    location: referral_company_schema.LocationBase


class ApplicationReadBase(ApplicationBase):
    id: str  # MongoDB ObjectId as string
    company: str
    location: dict  # {"country": "...", "city": "..."}


class ApplicationRead(ApplicationReadBase):
    pass


class ApplicationAdminRead(ApplicationReadBase):
    """Application with user info for admin dashboard"""

    user_name: str = ""
    user_email: str = ""


class ApplicationUpdateBase(BaseModel):
    status: str
    referred: bool
    notes: str
    recruiter_name: str
    recruiter_email: str


class ApplicationUpdate(ApplicationUpdateBase):
    location: referral_company_schema.LocationBase
