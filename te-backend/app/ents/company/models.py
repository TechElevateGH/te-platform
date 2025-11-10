from typing import Optional, List, Any
from pydantic import BaseModel, Field, GetJsonSchemaHandler
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


class Location(BaseModel):
    """MongoDB Location subdocument"""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    country: str
    city: str = ""

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Company(BaseModel):
    """MongoDB Company document model"""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    domain: str
    image: str = ""
    can_refer: bool = True
    locations: List[Location] = []
    referral_materials: dict = {}

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class Referral(BaseModel):
    """MongoDB Referral document model"""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    company_name: Optional[str] = ""  # Company name from frontend static data
    job_title: str
    job_id: Optional[str] = ""
    role: str  # JobRoles enum value
    request_note: str = ""
    review_note: Optional[str] = ""
    resume: str = ""  # Google Drive link
    contact: str = ""  # User's contact info
    essay: str = ""  # Referral essay/cover letter URL
    referral_date: str
    status: str  # ReferralStatuses enum value

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
