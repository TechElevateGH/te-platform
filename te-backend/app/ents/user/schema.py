from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserLogin(BaseModel):
    """Schema for Member user login with email and password"""

    username: str
    password: str


class LeadLogin(BaseModel):
    """Schema for Lead/Admin login with username and token"""

    username: str
    token: str


class ReferrerLogin(BaseModel):
    """Schema for Referrer login with token only (no username required)"""

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
    """
    Schema for creating a Management account (Admin only).

    Management users (Volunteers, Leads, Admins) authenticate with username + token at /auth/management-login.
    """

    username: str  # Used for login
    token: str  # Used for login
    role: UserRoles = UserRoles.lead


class ReferrerCreate(BaseModel):
    """
    Schema for creating a Referrer account (Admin only).

    Referrers authenticate with ONLY token at /auth/referrer-login.
    Username is stored for admin reference only, not used for authentication.
    """

    username: str  # For admin reference only (not used for login)
    token: str  # Used for login (referrers authenticate with token only)
    company_id: str  # MongoDB ObjectId as string - assigned company


class PrivilegedUserUpdate(BaseModel):
    """Schema for updating a privileged user account (Admin only)"""

    username: Optional[str] = None
    token: Optional[str] = None
    is_active: Optional[bool] = None


class MemberUserBase(BaseModel):
    email: EmailStr
    first_name: str
    middle_name: str = ""
    last_name: str
    full_name: str = ""
    image: str = ""
    contact: str = ""
    address: str = ""
    university: str = ""
    referral_essay: str = ""  # Referral essay text
    cover_letter: str = ""  # Cover letter text
    resumes: list = []  # List of embedded Resume objects
    applications: list = []  # List of embedded Application objects
    mentor_id: Optional[int] = None
    is_active: bool = True
    email_verified: bool = False  # Email verification status
    role: UserRoles = UserRoles.member
    start_date: str = date.today().strftime("%d-%m-%Y")
    end_date: str = ""


class MemberUserCreate(MemberUserBase):
    password: str


class MemberUserUpdate(BaseModel):
    """Schema for updating member user profile information"""

    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    contact: Optional[str] = None
    address: Optional[str] = None
    university: Optional[str] = None
    image: Optional[str] = None


class MemberUserRead(MemberUserBase): ...


class Essay(BaseModel):
    essay: str


class CoverLetter(BaseModel):
    cover_letter: str
