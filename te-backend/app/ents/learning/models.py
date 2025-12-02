from typing import Optional, Any, List, Dict
from pydantic import BaseModel, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from bson import ObjectId
from datetime import datetime
from enum import Enum


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


class LearningActivityType(str, Enum):
    """Types of learning activities that can be tracked"""

    TOPIC_STARTED = "topic_started"
    TOPIC_COMPLETED = "topic_completed"
    TOPIC_REVISITED = "topic_revisited"
    VIDEO_WATCHED = "video_watched"
    RESOURCE_ACCESSED = "resource_accessed"
    NOTE_ADDED = "note_added"
    BOOKMARK_ADDED = "bookmark_added"
    BOOKMARK_REMOVED = "bookmark_removed"
    SESSION_STARTED = "session_started"
    SESSION_ENDED = "session_ended"


class LearningActivity(BaseModel):
    """Individual learning activity event"""

    activity_type: str  # LearningActivityType value
    topic_key: Optional[str] = None  # Format: "category::topic"
    category: Optional[str] = None
    topic_name: Optional[str] = None
    resource_url: Optional[str] = None
    duration_seconds: Optional[int] = None  # Time spent on this activity
    metadata: Dict[str, Any] = Field(default_factory=dict)  # Additional context
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TopicProgress(BaseModel):
    """Detailed progress for a single topic"""

    topic_key: str  # Format: "category::topic"
    category: str
    topic_name: str

    # Completion tracking
    is_completed: bool = False
    completion_count: int = 0  # Times marked complete (allows re-completion)
    first_completed_at: Optional[datetime] = None
    last_completed_at: Optional[datetime] = None

    # Time tracking
    total_time_seconds: int = 0  # Total time spent on this topic
    session_count: int = 0  # Number of learning sessions
    last_session_at: Optional[datetime] = None

    # Engagement metrics
    video_views: int = 0
    resource_clicks: int = 0
    notes_updated_count: int = 0

    # Status
    started_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None


class CategoryProgress(BaseModel):
    """Aggregated progress for a category"""

    category: str
    total_topics: int = 0
    completed_topics: int = 0
    in_progress_topics: int = 0
    total_time_seconds: int = 0
    last_activity_at: Optional[datetime] = None


class LearningStreak(BaseModel):
    """Track learning streak data"""

    current_streak: int = 0  # Current consecutive days
    longest_streak: int = 0  # Best streak ever
    last_activity_date: Optional[str] = None  # YYYY-MM-DD format
    streak_dates: List[str] = Field(default_factory=list)  # Recent activity dates
    weekly_goals_met: int = 0  # Weeks where daily goal was met


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

    # Topic-level progress (detailed tracking per topic)
    topic_progress: Dict[str, Dict[str, Any]] = Field(
        default_factory=dict
    )  # {"category::topic": TopicProgress dict}

    # Legacy: List of dicts with topic_key, completed_at, and count (for backward compat)
    completed_topics: List[Dict[str, Any]] = Field(
        default_factory=list
    )  # [{"topic_key": "category::topic", "completed_at": datetime, "count": 1}]

    bookmarked_topics: List[str] = Field(
        default_factory=list
    )  # List of "category::topic" strings
    topic_notes: Dict[str, str] = Field(
        default_factory=dict
    )  # {"category::topic": "note text"}

    # Streak tracking
    streak_data: Dict[str, Any] = Field(
        default_factory=lambda: {
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity_date": None,
            "streak_dates": [],
            "weekly_goals_met": 0,
        }
    )

    # Activity log (recent activities for analytics)
    recent_activities: List[Dict[str, Any]] = Field(
        default_factory=list
    )  # Last 100 activities

    # Session tracking
    current_session_start: Optional[datetime] = None
    total_learning_time_seconds: int = 0
    session_count: int = 0

    # Summary statistics (cached for performance)
    stats_cache: Dict[str, Any] = Field(
        default_factory=lambda: {
            "total_completed": 0,
            "total_in_progress": 0,
            "categories_started": 0,
            "categories_completed": 0,
            "average_completion_time": 0,
            "last_calculated": None,
        }
    )

    last_updated: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
