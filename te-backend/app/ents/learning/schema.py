from enum import Enum

from typing import Optional, List, Dict
from datetime import datetime

from pydantic import BaseModel, Field


# Lesson Schemas for DSA Content
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

    class Config:
        from_attributes = True


class TopicToggle(BaseModel):
    """Schema for toggling a single topic"""

    topic_key: str  # Format: "category::topic"


class TopicNote(BaseModel):
    """Schema for updating a topic note"""

    topic_key: str  # Format: "category::topic"
    note: str
