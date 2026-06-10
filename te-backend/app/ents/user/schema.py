from enum import Enum
from typing import Annotated, Optional

from pydantic import BaseModel, EmailStr, Field


class UserLogin(BaseModel):
    """Schema for Member user login with email and password"""

    username: str
    password: str


class LeadLogin(BaseModel):
    """Schema for Lead/Admin login with username and token"""

    username: str
    token: str


class ReferrerLogin(BaseModel):
    """Schema for Referrer login with username and token"""

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
    """
    Schema for creating a Management account (Admin only).

    Management users (Volunteers, Leads, Admins) authenticate with username + token at /auth/management-login.
    """

    username: str  # Used for login
    token: str  # Used for login
    email: Optional[EmailStr] = None  # Optional email for notifications
    role: UserRoles = UserRoles.lead


class ReferrerCreate(BaseModel):
    """
    Schema for creating a Referrer account (Admin only).

    Referrers authenticate with ONLY token at /auth/referrer-login.
    Username is stored for admin reference only, not used for authentication.
    """

    username: str  # For admin reference only (not used for login)
    token: str  # Used for login (referrers authenticate with token only)
    email: Optional[EmailStr] = None  # Optional email for notifications
    company_id: str  # MongoDB ObjectId as string - assigned company
    company_name: str  # Company name for quick access (denormalized)


class PrivilegedUserUpdate(BaseModel):
    """Schema for updating a privileged user account (Admin only)"""

    username: Optional[str] = None
    token: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class MemberUserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(max_length=100)
    middle_name: str = Field(default="", max_length=100)
    last_name: str = Field(max_length=100)
    full_name: str = Field(default="", max_length=300)
    image: str = ""
    phone_number: str = Field(default="", max_length=30)
    address: str = Field(default="", max_length=500)
    university: str = Field(default="", max_length=200)
    referral_essay: str = Field(default="", max_length=10000)
    cover_letter: str = Field(default="", max_length=10000)
    resumes: list = []
    applications: list = []
    mentor_id: Optional[int] = None
    is_active: bool = True
    email_verified: bool = False
    slack_joined: bool = False
    role: UserRoles = UserRoles.member
    start_date: str = ""
    end_date: str = ""


class MemberUserCreate(MemberUserBase):
    password: str = Field(min_length=8, max_length=128)


class MemberUserUpdate(BaseModel):
    """Schema for updating member user profile information"""

    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    university: Optional[str] = None
    image: Optional[str] = None
    slack_joined: Optional[bool] = None  # Allow updating Slack join status


class MemberUserRead(MemberUserBase): ...


class Essay(BaseModel):
    essay: str = Field(max_length=10000)


class CoverLetter(BaseModel):
    cover_letter: str = Field(max_length=10000)


class PasswordResetRequest(BaseModel):
    email: EmailStr


PasswordCode = Annotated[str, Field(min_length=6, max_length=6, pattern=r"^[0-9]{6}$")]
PasswordStr = Annotated[str, Field(min_length=8, max_length=128)]


class PasswordResetVerify(BaseModel):
    email: EmailStr
    code: PasswordCode
    token: str


class PasswordResetComplete(BaseModel):
    token: str
    new_password: PasswordStr


class PasswordResetVerifyResponse(BaseModel):
    success: bool
    token: str


class PasswordResetCompleteResponse(BaseModel):
    success: bool
    message: str


class PasswordResetRequestResponse(BaseModel):
    success: bool
    message: str
