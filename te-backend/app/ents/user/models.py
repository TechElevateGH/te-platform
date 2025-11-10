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


class User(BaseModel):
    """MongoDB User document model"""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    first_name: str
    middle_name: str = ""
    last_name: str
    full_name: str
    image: str = ""
    date_of_birth: Optional[str] = ""
    contact: str = ""
    address: str = ""
    password: str  # Hashed password
    university: str = ""
    start_date: str = ""
    end_date: str = ""
    is_active: bool = True
    role: int  # UserRoles enum value
    essay: str = ""
    cover_letter: str = ""
    resume_file_ids: list[str] = []  # List of MongoDB ObjectId strings for resume files
    mentor_id: Optional[PyObjectId] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
