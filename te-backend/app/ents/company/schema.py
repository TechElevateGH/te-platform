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


class CompanyReadBase(CompanyBase):
    id: int
    domain: str
    can_refer: bool = True


class LocationRead(LocationBase):
    id: int


class CompanyRead(CompanyReadBase):
    locations: list[LocationRead]


class ReferralRequest(BaseModel):
    company_id: int
    job_title: str
    role: str
    request_note: str
    resume: str
    date: str = date.today().strftime("%d-%m-%Y")


class ReferralStatuses(Enum):
    completed = "Completed"
    in_review = "In review"
    cancelled = "Cancelled"
    declined = "Declined"


class ReferralReadBase(BaseModel):
    id: int
    user_id: int
    job_title: str
    role: str
    request_note: str = ""
    review_note: Optional[str] = ""
    date: str
    status: ReferralStatuses
    resume: str = ""


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

    company: CompanyBase
    user_name: str
    user_email: str


class CompanyReadForReferrals(CompanyReadBase):
    referral_materials: ReferralMaterials
