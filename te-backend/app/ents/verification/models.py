from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
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
        cls, schema: core_schema.CoreSchema, handler: Any
    ) -> JsonSchemaValue:
        return {"type": "string"}


class EmailVerification(BaseModel):
    """MongoDB EmailVerification document model for email verification codes"""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr  # The email address being verified
    code: str  # 6-digit verification code
    user_id: Optional[PyObjectId] = None  # User ID if for existing user (email change)
    verification_type: str  # "registration" or "email_change"
    new_email: Optional[EmailStr] = None  # For email change requests, the new email
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime  # Expiration time (15 minutes from creation)
    is_used: bool = False  # Whether code has been used
    attempts: int = 0  # Number of failed verification attempts

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
