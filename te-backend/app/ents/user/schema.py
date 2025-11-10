from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserLogin(BaseModel):
    username: str
    password: str


class UserRoles(int, Enum):
    """
    User hierarchy levels:
    - Guest (0): Unsigned/unauthenticated users
    - Member (1): Regular signed-in users (mentees)
    - Lead (2): Elevated privileges (mentors, team members)
    - Admin (3): Full system access
    - SuperAdmin (5): Legacy super admin role
    """

    guest = 0
    member = 1
    lead = 2
    admin = 3
    super_admin = 5


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    middle_name: str = ""
    last_name: str
    full_name: str = ""
    image: str = ""
    date_of_birth: Optional[str] = ""
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


class UserRead(UserBase): ...


class Essay(BaseModel):
    essay: str


class CoverLetter(BaseModel):
    cover_letter: str
