from enum import Enum

from typing import Optional

from pydantic import BaseModel


class LessonFormat(Enum):
    video = "video"
    document = "document"
    html = "html"


class LessonCategory(Enum):
    workshop = "Workshops"
    dsa = "Data Structures and Algorithms"
    system_design = "System Design"


class LessonBase(BaseModel):
    topic: str
    link: str
    category: LessonCategory
    subcategory: Optional[str]
    format: LessonFormat = LessonFormat.video
    playlist: str
    year: int = 2023
    instructor: str = ""
    uploader: int = 0


class LessonCreate(LessonBase): ...


class LessonRead(LessonBase):
    id: int
