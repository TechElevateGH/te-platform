from enum import Enum

from typing import Optional, List, Dict, Any
from datetime import datetime

from pydantic import BaseModel, Field


# ============================================
# LEARNING ACTIVITY SCHEMAS
# ============================================


class LearningActivityType(str, Enum):
    """Types of learning activities"""

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


class LogActivityRequest(BaseModel):
    """Request to log a learning activity"""

    activity_type: LearningActivityType
    topic_key: Optional[str] = None  # Format: "category::topic"
    resource_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TopicProgressRead(BaseModel):
    """Read schema for topic progress"""

    topic_key: str
    category: str
    topic_name: str
    is_completed: bool = False
    completion_count: int = 0
    first_completed_at: Optional[datetime] = None
    last_completed_at: Optional[datetime] = None
    total_time_seconds: int = 0
    session_count: int = 0
    last_session_at: Optional[datetime] = None
    video_views: int = 0
    resource_clicks: int = 0
    started_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None


class StreakDataRead(BaseModel):
    """Read schema for streak data"""

    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[str] = None
    streak_dates: List[str] = []
    weekly_goals_met: int = 0


class CategoryProgressRead(BaseModel):
    """Read schema for category progress"""

    category: str
    total_topics: int = 0
    completed_topics: int = 0
    in_progress_topics: int = 0
    completion_percentage: float = 0.0
    total_time_seconds: int = 0
    last_activity_at: Optional[datetime] = None


class LearningStatsRead(BaseModel):
    """Detailed learning statistics"""

    total_completed: int = 0
    total_in_progress: int = 0
    total_bookmarked: int = 0
    total_notes: int = 0
    total_learning_time_seconds: int = 0
    session_count: int = 0
    average_session_duration: int = 0
    streak: StreakDataRead = Field(default_factory=StreakDataRead)
    categories: List[CategoryProgressRead] = []
    recent_completions: List[Dict[str, Any]] = []
    learning_velocity: float = 0.0  # Topics completed per week
    weekly_time_trend: List[Dict[str, Any]] = []  # Last 4 weeks of time data


class StartSessionRequest(BaseModel):
    """Request to start a learning session"""

    topic_key: Optional[str] = None


class EndSessionRequest(BaseModel):
    """Request to end a learning session"""

    topic_key: Optional[str] = None
    duration_seconds: Optional[int] = None


class TrackTimeRequest(BaseModel):
    """Request to track time spent on a topic"""

    topic_key: str
    duration_seconds: int


# ============================================
# LESSON SCHEMAS
# ============================================
class LessonBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    topic: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    video_id: Optional[str] = None
    content_type: str = "video"  # video, article, interactive, mixed
    resources: List[Dict[str, str]] = []
    code_examples: List[Dict[str, str]] = []
    difficulty: str = "Beginner"  # Beginner, Easy, Medium, Hard, Advanced
    tags: List[str] = []
    duration_minutes: Optional[int] = None
    instructor: str = ""
    is_published: bool = True


class LessonCreate(LessonBase):
    """Schema for creating a new lesson"""

    pass


class LessonUpdate(BaseModel):
    """Schema for updating a lesson - all fields optional"""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = None
    topic: Optional[str] = None
    description: Optional[str] = None
    video_id: Optional[str] = None
    content_type: Optional[str] = None
    resources: Optional[List[Dict[str, str]]] = None
    code_examples: Optional[List[Dict[str, str]]] = None
    difficulty: Optional[str] = None
    tags: Optional[List[str]] = None
    duration_minutes: Optional[int] = None
    instructor: Optional[str] = None
    is_published: Optional[bool] = None


class LessonRead(LessonBase):
    """Schema for reading a lesson"""

    id: str  # MongoDB ObjectId as string
    created_by: int
    created_at: datetime
    updated_at: datetime
    view_count: int = 0

    class Config:
        from_attributes = True


# Legacy enum support (kept for backwards compatibility)
class LessonFormat(Enum):
    video = "video"
    document = "document"
    html = "html"


class LessonCategory(Enum):
    workshop = "Workshops"
    dsa = "Data Structures and Algorithms"
    system_design = "System Design"


# User Progress Schemas
class ProgressBase(BaseModel):
    completed_topics: List[str] = []
    bookmarked_topics: List[str] = []
    topic_notes: Dict[str, str] = {}


class ProgressCreate(ProgressBase):
    """Schema for creating new user progress"""

    pass


class ProgressUpdate(BaseModel):
    """Schema for updating user progress - all fields optional"""

    completed_topics: Optional[List[str]] = None
    bookmarked_topics: Optional[List[str]] = None
    topic_notes: Optional[Dict[str, str]] = None


class ProgressRead(ProgressBase):
    """Schema for reading user progress"""

    user_id: str  # MongoDB ObjectId as string
    last_updated: datetime
    created_at: datetime

    # Enhanced fields
    streak: Optional[StreakDataRead] = None
    stats: Optional[LearningStatsRead] = None
    topic_progress: Optional[Dict[str, TopicProgressRead]] = None

    class Config:
        from_attributes = True


class DetailedProgressRead(BaseModel):
    """Detailed progress with full analytics"""

    user_id: str
    completed_topics: List[str] = []
    bookmarked_topics: List[str] = []
    topic_notes: Dict[str, str] = {}
    topic_progress: Dict[str, TopicProgressRead] = {}
    streak: StreakDataRead = Field(default_factory=StreakDataRead)
    stats: LearningStatsRead = Field(default_factory=LearningStatsRead)
    recent_activities: List[Dict[str, Any]] = []
    last_updated: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class TopicToggle(BaseModel):
    """Schema for toggling a single topic"""

    topic_key: str  # Format: "category::topic"


class TopicNote(BaseModel):
    """Schema for updating a topic note"""

    topic_key: str  # Format: "category::topic"
    note: str
