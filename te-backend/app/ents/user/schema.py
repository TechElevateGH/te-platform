from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserLogin(BaseModel):
    username: str
    password: str


class LeadLogin(BaseModel):
    """Schema for Lead/Admin login with username and token"""

    username: str
    token: str


class UserRoles(int, Enum):
    """
    User hierarchy levels:
    - Guest (0): Unsigned/unauthenticated users
    - Member (1): Regular signed-in users (mentees)
    - Referrer (2): Company-specific referral managers (can only see their company's referrals)
    - Volunteer (3): Can add referral companies but cannot see member data
    - Lead (4): Elevated privileges (mentors, team members) - full access
    - Admin (5): Full system access
    """

    guest = 0
    member = 1
    referrer = 2
    volunteer = 3
    lead = 4
    admin = 5


class LeadCreate(BaseModel):
    """Schema for creating a Lead/Admin account (Admin only)"""

    username: str
    token: str
    role: UserRoles = UserRoles.lead


class ReferrerCreate(BaseModel):
    """Schema for creating a Referrer account (Admin only)"""

    username: str
    token: str
    company_id: str  # MongoDB ObjectId as string


class PrivilegedUserUpdate(BaseModel):
    """Schema for updating a privileged user account (Admin only)"""

    username: Optional[str] = None
    token: Optional[str] = None
    is_active: Optional[bool] = None


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    middle_name: str = ""
    last_name: str
    full_name: str = ""
    image: str = ""
    contact: str = ""
    address: str = ""
    university: str = ""
    essay: str = ""
    cover_letter: str = ""
    resume_file_ids: list[str] = []  # List of MongoDB ObjectId strings for resume files
    mentor_id: Optional[int] = None
    is_active: bool = True
    role: UserRoles = UserRoles.member
    start_date: str = date.today().strftime("%d-%m-%Y")
    end_date: str = ""


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile information"""

    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    contact: Optional[str] = None
    address: Optional[str] = None
    university: Optional[str] = None
    image: Optional[str] = None


class UserRead(UserBase): ...


class Essay(BaseModel):
    essay: str


class CoverLetter(BaseModel):
    cover_letter: str
