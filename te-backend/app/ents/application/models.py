from typing import Any
from pydantic import BaseModel, GetJsonSchemaHandler
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


class Application(BaseModel):
    """Embedded Application document - stored in MemberUser.applications array"""

    id: str  # UUID for identifying this application
    company: str  # Just store company name as string
    location: dict  # Store location as {"country": "...", "city": "..."}
    date: str
    notes: str = ""
    recruiter_name: str = ""
    recruiter_email: str = ""
    role: str
    title: str
    status: str
    referred: bool = False
    active: bool = True
    archived: bool = False

    class Config:
        arbitrary_types_allowed = True
