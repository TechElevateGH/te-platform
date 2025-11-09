import app.ents.learning.models as learning_models
import app.ents.learning.schema as learning_schema
from pymongo.database import Database
from app.core import service
from app.core.settings import settings
from app.utilities.constants import Constants


def read_lessons(
    db: Database, *, skip: int = 0, limit: int = 100
) -> list[learning_models.Lesson]:
    return db.query(learning_models.Lesson).offset(skip).limit(limit).all()


def read_lessons_v1():
    drive_service = service.get_drive_service()
    response = drive_service.files(q=settings.GDRIVE_LESSONS)
    files = response.get("files", [])

    # DSA Textbook Chapters

    #
    for f in files:
        print(f)


def create_lesson(
    db: Database, *, data: learning_schema.LessonCreate
) -> learning_models.Lesson:
    lesson = learning_models.Lesson(**data.dict())

    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson
