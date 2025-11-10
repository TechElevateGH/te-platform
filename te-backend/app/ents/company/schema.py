from datetime import date
from enum import Enum

from typing import Optional

from pydantic import BaseModel


class JobRoles(Enum):
    intern: str = "Intern"
    new_grad: str = "New Grad"


class LocationBase(BaseModel):
    country: str
    city: str = ""


class ReferralMaterials(BaseModel):
    resume: bool = True
    essay: bool = True
    contact: bool = True


class CompanyBase(BaseModel):
    name: str
    image: str = ""


class CompanyCreate(CompanyBase):
    domain: str
    location: LocationBase
    can_refer: bool = True
    referral_materials: ReferralMaterials = None


class AdminCompanyCreate(BaseModel):
    """Simplified schema for admin to add referral companies"""

    name: str
    image: str = ""
    description: str = ""
    website: str = ""
    industry: str = ""
    size: str = ""
    headquarters: str = ""


class CompanyReadBase(CompanyBase):
    id: str  # MongoDB ObjectId as string
    domain: str
    can_refer: bool = True


class LocationRead(LocationBase):
    id: str  # MongoDB ObjectId as string


class CompanyRead(CompanyReadBase):
    locations: list[LocationRead]
    referral_materials: ReferralMaterials = None


class ReferralRequest(BaseModel):
    company_id: str  # Company name from frontend
    job_title: str
    job_id: Optional[str] = ""
    role: str
    request_note: str
    resume: str
    contact: str = ""  # User's contact (phone/email)
    essay: str = ""  # Referral essay/cover letter URL
    date: str = date.today().strftime("%d-%m-%Y")


class ReferralStatuses(Enum):
    completed = "Completed"
    pending = "Pending"
    cancelled = "Cancelled"
    declined = "Declined"


class ReferralReadBase(BaseModel):
    id: str  # MongoDB ObjectId as string
    user_id: str  # MongoDB ObjectId as string
    job_title: str
    job_id: Optional[str] = ""
    role: str
    request_note: str = ""
    review_note: Optional[str] = ""
    date: str
    status: ReferralStatuses
    resume: str = ""
    contact: str = ""  # User's contact info
    essay: str = ""  # Referral essay/cover letter URL


class ReferralRead(ReferralReadBase):
    company: CompanyBase


class ReferralReadWithUser(ReferralReadBase):
    """Referral with user information for Lead/Admin view"""

    company: CompanyBase
    user_name: str
    user_email: str


class ReferralUpdateStatus(BaseModel):
    """Schema for updating referral status"""

    status: ReferralStatuses
    review_note: Optional[str] = ""


class CompanyReadForReferrals(CompanyReadBase):
    referral_materials: ReferralMaterials
