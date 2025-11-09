from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserLogin(BaseModel):
    username: str
    password: str


class UserRoles(int, Enum):
    guest = 0
    mentee = 1
    contributor = 2
    mentor = 3
    team = 4
    admin = 5


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
    mentor_id: Optional[int] = None
    is_active: bool = True
    role: UserRoles = UserRoles.mentee
    start_date: str = date.today().strftime("%d-%m-%Y")
    end_date: str = ""


class UserCreate(UserBase):
    password: str


class UserRead(UserBase): ...


class Essay(BaseModel):
    essay: str
