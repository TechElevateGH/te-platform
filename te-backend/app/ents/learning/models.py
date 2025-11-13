from typing import Optional, Any, List, Dict
from pydantic import BaseModel, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from bson import ObjectId
from datetime import datetime


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


class Lesson(BaseModel):
    """MongoDB Lesson document model for DSA learning content"""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")

    # Core Identification
    title: str  # Lesson title
    category: str  # Main category (e.g., "Arrays & Strings", "Recursion")
    topic: str  # Specific topic (e.g., "Two Pointers", "Sliding Window")

    # Content
    description: str = ""  # Lesson description/summary
    video_id: Optional[str] = None  # YouTube video ID
    content_type: str = "video"  # video, article, interactive, mixed

    # Additional Resources
    resources: List[Dict[str, str]] = Field(
        default_factory=list
    )  # [{"title": "...", "url": "..."}]
    code_examples: List[Dict[str, str]] = Field(
        default_factory=list
    )  # [{"language": "python", "code": "..."}]

    # Classification
    difficulty: str = "Beginner"  # Beginner, Easy, Medium, Hard, Advanced
    tags: List[str] = Field(default_factory=list)  # ["sliding-window", "two-pointers"]
    duration_minutes: Optional[int] = None  # Estimated completion time

    # Metadata
    created_by: int = 0  # User ID of creator
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_published: bool = True  # Draft vs Published
    view_count: int = 0

    # Legacy fields (for backwards compatibility)
    instructor: str = ""
    year: int = 2024

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserProgress(BaseModel):
    """MongoDB UserProgress document model for tracking learning progress"""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId  # Reference to user ID (MongoDB ObjectId)

    # New structure: List of dicts with topic_key, completed_at, and count
    completed_topics: List[Dict[str, Any]] = Field(
        default_factory=list
    )  # [{"topic_key": "category::topic", "completed_at": datetime, "count": 1}]

    bookmarked_topics: List[str] = Field(
        default_factory=list
    )  # List of "category::topic" strings
    topic_notes: Dict[str, str] = Field(
        default_factory=dict
    )  # {"category::topic": "note text"}
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
