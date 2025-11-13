import app.ents.learning.models as learning_models
import app.ents.learning.schema as learning_schema
from pymongo.database import Database
from app.core import service
from app.core.settings import settings
from datetime import datetime
from typing import Optional, List
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


# ============================================
# LESSON CRUD OPERATIONS
# ============================================


def get_all_lessons(
    db: Database,
    *,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    is_published: Optional[bool] = None,
) -> List[learning_models.Lesson]:
    """Get all lessons with optional filtering"""
    query = {}

    if category:
        query["category"] = category
    if topic:
        query["topic"] = topic
    if difficulty:
        query["difficulty"] = difficulty
    if is_published is not None:
        query["is_published"] = is_published

    lessons = db["lessons"].find(query).skip(skip).limit(limit).sort("created_at", -1)
    return [learning_models.Lesson(**lesson) for lesson in lessons]


def get_lesson_by_id(db: Database, lesson_id: str) -> Optional[learning_models.Lesson]:
    """Get a single lesson by ID"""
    if not ObjectId.is_valid(lesson_id):
        return None

    lesson = db["lessons"].find_one({"_id": ObjectId(lesson_id)})
    if lesson:
        # Increment view count
        db["lessons"].update_one(
            {"_id": ObjectId(lesson_id)}, {"$inc": {"view_count": 1}}
        )
        lesson["view_count"] = lesson.get("view_count", 0) + 1
        return learning_models.Lesson(**lesson)
    return None


def get_lessons_by_category_and_topic(
    db: Database, category: str, topic: str
) -> List[learning_models.Lesson]:
    """Get all lessons for a specific category and topic"""
    lessons = (
        db["lessons"]
        .find({"category": category, "topic": topic, "is_published": True})
        .sort("created_at", -1)
    )

    return [learning_models.Lesson(**lesson) for lesson in lessons]


def create_lesson(
    db: Database, *, data: learning_schema.LessonCreate, user_id: int
) -> learning_models.Lesson:
    """Create a new lesson"""
    lesson_data = data.dict()
    lesson_data["created_by"] = user_id
    lesson_data["created_at"] = datetime.utcnow()
    lesson_data["updated_at"] = datetime.utcnow()
    lesson_data["view_count"] = 0

    result = db["lessons"].insert_one(lesson_data)
    lesson_data["_id"] = result.inserted_id

    return learning_models.Lesson(**lesson_data)


def update_lesson(
    db: Database, lesson_id: str, data: learning_schema.LessonUpdate
) -> Optional[learning_models.Lesson]:
    """Update an existing lesson"""
    if not ObjectId.is_valid(lesson_id):
        return None

    update_data = {
        k: v for k, v in data.dict(exclude_unset=True).items() if v is not None
    }
    update_data["updated_at"] = datetime.utcnow()

    result = db["lessons"].find_one_and_update(
        {"_id": ObjectId(lesson_id)}, {"$set": update_data}, return_document=True
    )

    if result:
        return learning_models.Lesson(**result)
    return None


def delete_lesson(db: Database, lesson_id: str) -> bool:
    """Delete a lesson"""
    if not ObjectId.is_valid(lesson_id):
        return False

    result = db["lessons"].delete_one({"_id": ObjectId(lesson_id)})
    return result.deleted_count > 0


# Legacy function for backwards compatibility
def read_lessons(
    db: Database, *, skip: int = 0, limit: int = 100
) -> List[learning_models.Lesson]:
    return get_all_lessons(db, skip=skip, limit=limit)


def read_lessons_v1():
    drive_service = service.get_drive_service()
    response = drive_service.files(q=settings.GDRIVE_LESSONS)
    files = response.get("files", [])

    # Log files for debugging if needed
    logger.debug(f"Found {len(files)} files in Google Drive")


# User Progress CRUD Operations
def get_user_progress(
    db: Database, user_id: int
) -> Optional[learning_models.UserProgress]:
    """Get user's learning progress by user_id"""
    progress = db["user_progress"].find_one({"user_id": ObjectId(user_id)})
    if progress:
        return learning_models.UserProgress(**progress)
    return None


def create_user_progress(
    db: Database, user_id: int, data: learning_schema.ProgressCreate
) -> learning_models.UserProgress:
    """Create new user progress record"""
    progress_data = data.dict()
    progress_data["user_id"] = ObjectId(user_id)
    progress_data["last_updated"] = datetime.utcnow()
    progress_data["created_at"] = datetime.utcnow()

    result = db["user_progress"].insert_one(progress_data)
    progress_data["_id"] = result.inserted_id

    return learning_models.UserProgress(**progress_data)


def update_user_progress(
    db: Database, user_id: int, data: learning_schema.ProgressUpdate
) -> Optional[learning_models.UserProgress]:
    """Update existing user progress"""
    update_data = {
        k: v for k, v in data.dict(exclude_unset=True).items() if v is not None
    }
    update_data["last_updated"] = datetime.utcnow()

    result = db["user_progress"].find_one_and_update(
        {"user_id": ObjectId(user_id)}, {"$set": update_data}, return_document=True
    )

    if result:
        return learning_models.UserProgress(**result)
    return None


def toggle_completed_topic(
    db: Database, user_id: int, topic_key: str
) -> Optional[learning_models.UserProgress]:
    """Toggle a topic's completion status with date tracking and count"""
    progress = get_user_progress(db, user_id)

    if not progress:
        # Create new progress if doesn't exist with new structure
        new_completion = {
            "topic_key": topic_key,
            "completed_at": datetime.utcnow(),
            "count": 1,
        }
        db["user_progress"].insert_one(
            {
                "user_id": ObjectId(user_id),
                "completed_topics": [new_completion],
                "bookmarked_topics": [],
                "topic_notes": {},
                "last_updated": datetime.utcnow(),
                "created_at": datetime.utcnow(),
            }
        )
        progress_data = db["user_progress"].find_one({"user_id": ObjectId(user_id)})
        return learning_models.UserProgress(**progress_data)
    else:
        # Check if topic already exists in completed topics
        completed = progress.completed_topics
        existing_topic = None
        existing_index = -1

        # Handle both old format (list of strings) and new format (list of dicts)
        for i, topic in enumerate(completed):
            if isinstance(topic, dict):
                if topic.get("topic_key") == topic_key:
                    existing_topic = topic
                    existing_index = i
                    break
            elif isinstance(topic, str) and topic == topic_key:
                # Migrate old format to new format
                existing_topic = {
                    "topic_key": topic,
                    "completed_at": datetime.utcnow(),
                    "count": 1,
                }
                existing_index = i
                break

        if existing_topic:
            # Topic exists - increment count and update date
            completed[existing_index] = {
                "topic_key": topic_key,
                "completed_at": datetime.utcnow(),
                "count": existing_topic.get("count", 1) + 1,
            }
        else:
            # Topic doesn't exist - add it
            completed.append(
                {"topic_key": topic_key, "completed_at": datetime.utcnow(), "count": 1}
            )

        db["user_progress"].update_one(
            {"user_id": ObjectId(user_id)},
            {
                "$set": {
                    "completed_topics": completed,
                    "last_updated": datetime.utcnow(),
                }
            },
        )
        progress.completed_topics = completed
        progress.last_updated = datetime.utcnow()

    return progress


def toggle_bookmarked_topic(
    db: Database, user_id: int, topic_key: str
) -> Optional[learning_models.UserProgress]:
    """Toggle a topic's bookmark status"""
    progress = get_user_progress(db, user_id)

    if not progress:
        # Create new progress if doesn't exist
        progress = create_user_progress(
            db, user_id, learning_schema.ProgressCreate(bookmarked_topics=[topic_key])
        )
    else:
        # Toggle the bookmark
        bookmarked = progress.bookmarked_topics
        if topic_key in bookmarked:
            bookmarked.remove(topic_key)
        else:
            bookmarked.append(topic_key)

        db["user_progress"].update_one(
            {"user_id": ObjectId(user_id)},
            {
                "$set": {
                    "bookmarked_topics": bookmarked,
                    "last_updated": datetime.utcnow(),
                }
            },
        )
        progress.bookmarked_topics = bookmarked
        progress.last_updated = datetime.utcnow()

    return progress


def update_topic_note(
    db: Database, user_id: int, topic_key: str, note: str
) -> Optional[learning_models.UserProgress]:
    """Update or create a note for a specific topic"""
    progress = get_user_progress(db, user_id)

    if not progress:
        # Create new progress if doesn't exist
        progress = create_user_progress(
            db, user_id, learning_schema.ProgressCreate(topic_notes={topic_key: note})
        )
    else:
        # Update the note
        notes = progress.topic_notes
        if note.strip():  # Only add/update if note has content
            notes[topic_key] = note
        else:  # Remove note if empty
            notes.pop(topic_key, None)

        db["user_progress"].update_one(
            {"user_id": ObjectId(user_id)},
            {"$set": {"topic_notes": notes, "last_updated": datetime.utcnow()}},
        )
        progress.topic_notes = notes
        progress.last_updated = datetime.utcnow()

    return progress


# Admin Statistics Functions
def get_all_members_progress(db: Database) -> List[dict]:
    """Get learning progress for all members (Admin/Lead only)"""
    all_progress = list(db["user_progress"].find())

    result = []
    for progress in all_progress:
        # Get user details from member_users collection
        user_data = db.member_users.find_one({"_id": progress["user_id"]})
        if user_data:
            # Process completed topics to extract topic names with metadata
            completed_topics_list = []
            completed_topics_raw = progress.get("completed_topics", [])

            for topic in completed_topics_raw:
                if isinstance(topic, dict):
                    # New format with metadata
                    topic_key = topic.get("topic_key", "")
                    if "::" in topic_key:
                        category, topic_name = topic_key.split("::", 1)
                        completed_topics_list.append(
                            {
                                "topic_name": topic_name,
                                "category": category,
                                "completed_at": topic.get("completed_at").isoformat()
                                if topic.get("completed_at")
                                else None,
                                "count": topic.get("count", 1),
                            }
                        )
                elif isinstance(topic, str):
                    # Old format - migrate on read
                    if "::" in topic:
                        category, topic_name = topic.split("::", 1)
                        completed_topics_list.append(
                            {
                                "topic_name": topic_name,
                                "category": category,
                                "completed_at": None,
                                "count": 1,
                            }
                        )

            # Process bookmarked topics
            bookmarked_topics_list = []
            for topic in progress.get("bookmarked_topics", []):
                if "::" in topic:
                    category, topic_name = topic.split("::", 1)
                    bookmarked_topics_list.append(
                        {"topic_name": topic_name, "category": category}
                    )

            result.append(
                {
                    "user_id": str(progress["user_id"]),
                    "full_name": user_data.get("full_name", "Unknown"),
                    "email": user_data.get("email", ""),
                    "completed_count": len(completed_topics_list),
                    "bookmarked_count": len(bookmarked_topics_list),
                    "notes_count": len(progress.get("topic_notes", {})),
                    "completed_topics": completed_topics_list,
                    "bookmarked_topics": bookmarked_topics_list,
                    "last_updated": progress.get("last_updated"),
                    "created_at": progress.get("created_at"),
                }
            )

    return result


def get_learning_statistics(db: Database) -> dict:
    """Get overall learning statistics (Admin/Lead only)"""
    total_members = db.member_users.count_documents({"is_active": True})
    members_with_progress = db["user_progress"].count_documents({})

    # Get all progress records
    all_progress = list(db["user_progress"].find())

    total_completions = sum(len(p.get("completed_topics", [])) for p in all_progress)
    total_bookmarks = sum(len(p.get("bookmarked_topics", [])) for p in all_progress)
    total_notes = sum(len(p.get("topic_notes", {})) for p in all_progress)

    # Topic completion frequency
    topic_completions = {}
    for progress in all_progress:
        for topic in progress.get("completed_topics", []):
            topic_completions[topic] = topic_completions.get(topic, 0) + 1

    # Sort topics by completion count
    most_completed_topics = sorted(
        topic_completions.items(), key=lambda x: x[1], reverse=True
    )[:10]

    return {
        "total_members": total_members,
        "members_with_progress": members_with_progress,
        "engagement_rate": round((members_with_progress / total_members * 100), 2)
        if total_members > 0
        else 0,
        "total_completions": total_completions,
        "total_bookmarks": total_bookmarks,
        "total_notes": total_notes,
        "avg_completions_per_member": round(
            total_completions / members_with_progress, 2
        )
        if members_with_progress > 0
        else 0,
        "most_completed_topics": [
            {"topic": topic, "count": count} for topic, count in most_completed_topics
        ],
    }
