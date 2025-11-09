from datetime import date
from enum import Enum

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


class ReferralReadBase(BaseModel):
    user_id: int
    job_title: str
    role: str
    review_note: str | None = ""
    date: str
    status: ReferralStatuses


class ReferralRead(ReferralReadBase):
    company: CompanyBase


class ReferralReadWithUser(ReferralReadBase):
    """Referral with user information for Lead/Admin view"""

    company: CompanyBase
    user_name: str
    user_email: str


class CompanyReadForReferrals(CompanyReadBase):
    referral_materials: ReferralMaterials
