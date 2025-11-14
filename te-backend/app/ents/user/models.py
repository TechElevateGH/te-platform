from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from bson import ObjectId


# Custom type for MongoDB ObjectId compatible with Pydantic v2
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.union_schema(
            [
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema(
                    [
                        core_schema.str_schema(),
                        core_schema.no_info_plain_validator_function(cls.validate),
                    ]
                ),
            ]
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_json_schema__(
        cls, schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {"type": "string"}


class MemberUser(BaseModel):
    """MongoDB MemberUser document model for Members (role=1)"""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    first_name: str
    middle_name: str = ""
    last_name: str
    full_name: str
    image: str = ""
    phone_number: str = ""
    address: str = ""
    password: Optional[str] = None  # Hashed password (optional for OAuth users)
    date_of_birth: str = ""
    university: str = ""
    start_date: str = ""
    end_date: str = ""
    is_active: bool = True
    email_verified: bool = False  # Email verification status
    role: int = 1  # Always Member (1) for this collection
    referral_essay: str = ""  # Referral essay text (stored in MongoDB)
    cover_letter: str = ""  # Cover letter text (stored in MongoDB)
    resumes: list = []  # List of embedded Resume objects
    applications: list = []  # List of embedded Application objects
    mentor_id: Optional[PyObjectId] = None
    google_id: Optional[str] = None  # Google OAuth user ID
    oauth_provider: Optional[str] = None  # OAuth provider (e.g., "google")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PrivilegedUser(BaseModel):
    """MongoDB PrivilegedUser document model for Referrer/Lead/Admin (role>=2)"""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    username: str  # Required for privileged users
    password: str  # Hashed token
    lead_token: str  # Plain token for login
    role: int  # UserRoles enum value (2=Referrer, 3=Lead, 5=Admin)
    company_id: Optional[PyObjectId] = None  # For Referrer users only
    company_name: Optional[str] = (
        None  # Company name for Referrer users (denormalized for quick access)
    )
    is_active: bool = True

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PasswordReset(BaseModel):
    """MongoDB password reset request model."""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    user_id: PyObjectId
    code: str
    status: str = "requested"  # requested -> verified -> completed/expired
    attempts: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    verified_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    session_token_hash: Optional[str] = None
    session_expires_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
