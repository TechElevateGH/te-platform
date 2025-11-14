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
    phone_number: bool = True


class ReferralCompanyBase(BaseModel):
    name: str
    image: str = ""
    referral_link: str = ""


class ReferralCompanyCreate(BaseModel):
    """Schema for creating referral companies"""

    name: str
    image: str = ""
    referral_link: str = ""
    description: str = ""
    website: str = ""
    industry: str = ""
    size: str = ""
    headquarters: str = ""
    # Referral requirements
    requires_resume: bool = True
    requires_phone_number: bool = True
    requires_essay: bool = True


class ReferralCompanyUpdate(BaseModel):
    """Schema for updating referral companies"""

    name: Optional[str] = None
    image: Optional[str] = None
    referral_link: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    headquarters: Optional[str] = None
    # Referral requirements
    requires_resume: Optional[bool] = None
    requires_phone_number: Optional[bool] = None
    requires_essay: Optional[bool] = None


class CompanyReadBase(ReferralCompanyBase):
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
    phone_number: str = ""  # User's phone number
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
    feedback_date: Optional[str] = None
    status: ReferralStatuses
    resume: str = ""
    phone_number: str = ""  # User's phone number
    essay: str = ""  # Referral essay/cover letter URL


class ReferralRead(ReferralReadBase):
    company: ReferralCompanyBase


class ReferralReadWithUser(ReferralReadBase):
    """Referral with user information for Lead/Admin view"""

    company: ReferralCompanyBase
    user_name: str
    user_email: str


class ReferralUpdateStatus(BaseModel):
    """Schema for updating referral status"""

    status: ReferralStatuses
    review_note: Optional[str] = ""


class CompanyReadForReferrals(CompanyReadBase):
    referral_materials: ReferralMaterials
