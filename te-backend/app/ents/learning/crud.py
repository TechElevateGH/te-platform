import app.ents.learning.models as learning_models
import app.ents.learning.schema as learning_schema
from pymongo.database import Database
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


# ============================================
# HELPER FUNCTIONS FOR PROGRESS TRACKING
# ============================================


def parse_topic_key(topic_key: str) -> tuple:
    """Parse topic_key into category and topic_name"""
    if "::" in topic_key:
        parts = topic_key.split("::", 1)
        return parts[0], parts[1]
    return "Unknown", topic_key


def update_streak(progress: Dict[str, Any]) -> Dict[str, Any]:
    """Update streak data based on current activity"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    streak_data = progress.get(
        "streak_data",
        {
            "current_streak": 0,
            "longest_streak": 0,
            "last_activity_date": None,
            "streak_dates": [],
            "weekly_goals_met": 0,
        },
    )

    last_date = streak_data.get("last_activity_date")
    current_streak = streak_data.get("current_streak", 0)
    longest_streak = streak_data.get("longest_streak", 0)
    streak_dates = streak_data.get("streak_dates", [])

    if last_date == today:
        # Already logged activity today, no change
        return streak_data

    if last_date:
        last_dt = datetime.strptime(last_date, "%Y-%m-%d")
        today_dt = datetime.strptime(today, "%Y-%m-%d")
        diff = (today_dt - last_dt).days

        if diff == 1:
            # Consecutive day - extend streak
            current_streak += 1
        elif diff > 1:
            # Streak broken
            current_streak = 1
        # diff == 0 handled above
    else:
        # First activity ever
        current_streak = 1

    # Update longest streak
    if current_streak > longest_streak:
        longest_streak = current_streak

    # Keep last 30 days of streak dates
    if today not in streak_dates:
        streak_dates.append(today)
    streak_dates = sorted(streak_dates)[-30:]

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_activity_date": today,
        "streak_dates": streak_dates,
        "weekly_goals_met": streak_data.get("weekly_goals_met", 0),
    }


def log_activity(
    db: Database,
    user_id: int,
    activity_type: str,
    topic_key: Optional[str] = None,
    duration_seconds: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """Log a learning activity to the user's progress"""
    category, topic_name = parse_topic_key(topic_key) if topic_key else (None, None)

    activity = {
        "activity_type": activity_type,
        "topic_key": topic_key,
        "category": category,
        "topic_name": topic_name,
        "duration_seconds": duration_seconds,
        "metadata": metadata or {},
        "timestamp": datetime.utcnow(),
    }

    # Add to recent activities (keep last 100)
    db["user_progress"].update_one(
        {"user_id": ObjectId(user_id)},
        {
            "$push": {
                "recent_activities": {
                    "$each": [activity],
                    "$slice": -100,  # Keep last 100
                }
            },
            "$set": {"last_updated": datetime.utcnow()},
        },
    )


def get_or_create_topic_progress(
    progress: Dict[str, Any], topic_key: str
) -> Dict[str, Any]:
    """Get or create topic progress entry"""
    topic_progress = progress.get("topic_progress", {})

    if topic_key not in topic_progress:
        category, topic_name = parse_topic_key(topic_key)
        topic_progress[topic_key] = {
            "topic_key": topic_key,
            "category": category,
            "topic_name": topic_name,
            "is_completed": False,
            "completion_count": 0,
            "first_completed_at": None,
            "last_completed_at": None,
            "total_time_seconds": 0,
            "session_count": 0,
            "last_session_at": None,
            "video_views": 0,
            "resource_clicks": 0,
            "notes_updated_count": 0,
            "started_at": datetime.utcnow(),
            "last_activity_at": datetime.utcnow(),
        }

    return topic_progress[topic_key]


def calculate_learning_stats(
    progress: Dict[str, Any], all_topics_count: int = 69
) -> Dict[str, Any]:
    """Calculate comprehensive learning statistics"""
    topic_progress = progress.get("topic_progress", {})
    completed_topics = progress.get("completed_topics", [])
    bookmarked_topics = progress.get("bookmarked_topics", [])
    topic_notes = progress.get("topic_notes", {})
    streak_data = progress.get("streak_data", {})
    recent_activities = progress.get("recent_activities", [])

    # Count completions and in-progress
    total_completed = 0
    total_in_progress = 0
    total_time = 0
    category_stats = {}
    recent_completions = []

    for topic_key, tp in topic_progress.items():
        category = tp.get("category", "Unknown")

        if category not in category_stats:
            category_stats[category] = {
                "category": category,
                "total_topics": 0,
                "completed_topics": 0,
                "in_progress_topics": 0,
                "total_time_seconds": 0,
                "last_activity_at": None,
            }

        category_stats[category]["total_topics"] += 1
        category_stats[category]["total_time_seconds"] += tp.get(
            "total_time_seconds", 0
        )
        total_time += tp.get("total_time_seconds", 0)

        if tp.get("is_completed"):
            total_completed += 1
            category_stats[category]["completed_topics"] += 1
            if tp.get("last_completed_at"):
                recent_completions.append(
                    {
                        "topic_key": topic_key,
                        "topic_name": tp.get("topic_name"),
                        "category": category,
                        "completed_at": tp.get("last_completed_at"),
                    }
                )
        elif tp.get("started_at"):
            total_in_progress += 1
            category_stats[category]["in_progress_topics"] += 1

        # Update last activity for category
        if tp.get("last_activity_at"):
            if (
                not category_stats[category]["last_activity_at"]
                or tp["last_activity_at"] > category_stats[category]["last_activity_at"]
            ):
                category_stats[category]["last_activity_at"] = tp["last_activity_at"]

    # Also count from legacy completed_topics list
    for topic in completed_topics:
        if isinstance(topic, dict):
            tk = topic.get("topic_key", "")
            if tk and tk not in topic_progress:
                total_completed += 1
                category, name = parse_topic_key(tk)
                if topic.get("completed_at"):
                    recent_completions.append(
                        {
                            "topic_key": tk,
                            "topic_name": name,
                            "category": category,
                            "completed_at": topic.get("completed_at"),
                        }
                    )

    # Sort recent completions by date
    recent_completions.sort(
        key=lambda x: x.get("completed_at") or datetime.min, reverse=True
    )

    # Calculate learning velocity (topics per week over last 4 weeks)
    four_weeks_ago = datetime.utcnow() - timedelta(weeks=4)
    recent_completion_count = sum(
        1
        for c in recent_completions
        if c.get("completed_at") and c["completed_at"] > four_weeks_ago
    )
    learning_velocity = recent_completion_count / 4.0

    # Calculate weekly time trend
    weekly_time_trend = []
    for week_offset in range(4):
        week_start = datetime.utcnow() - timedelta(weeks=week_offset + 1)
        week_end = datetime.utcnow() - timedelta(weeks=week_offset)
        week_time = 0
        for activity in recent_activities:
            ts = activity.get("timestamp")
            if ts and week_start <= ts < week_end:
                week_time += activity.get("duration_seconds", 0)
        weekly_time_trend.append(
            {
                "week": week_offset + 1,
                "week_start": week_start.strftime("%Y-%m-%d"),
                "total_seconds": week_time,
            }
        )

    session_count = progress.get("session_count", 0)
    avg_session = total_time // session_count if session_count > 0 else 0

    return {
        "total_completed": total_completed,
        "total_in_progress": total_in_progress,
        "total_bookmarked": len(bookmarked_topics),
        "total_notes": len(topic_notes),
        "total_learning_time_seconds": total_time,
        "session_count": session_count,
        "average_session_duration": avg_session,
        "streak": {
            "current_streak": streak_data.get("current_streak", 0),
            "longest_streak": streak_data.get("longest_streak", 0),
            "last_activity_date": streak_data.get("last_activity_date"),
            "streak_dates": streak_data.get("streak_dates", [])[-7:],  # Last 7 days
            "weekly_goals_met": streak_data.get("weekly_goals_met", 0),
        },
        "categories": [
            {
                **cat_data,
                "completion_percentage": round(
                    (cat_data["completed_topics"] / cat_data["total_topics"] * 100)
                    if cat_data["total_topics"] > 0
                    else 0,
                    1,
                ),
            }
            for cat_data in category_stats.values()
        ],
        "recent_completions": recent_completions[:10],
        "learning_velocity": round(learning_velocity, 2),
        "weekly_time_trend": weekly_time_trend,
    }


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
    """Toggle a topic's completion status with sophisticated tracking"""
    progress_doc = db["user_progress"].find_one({"user_id": ObjectId(user_id)})
    now = datetime.utcnow()
    category, topic_name = parse_topic_key(topic_key)

    if not progress_doc:
        # Create new progress if doesn't exist
        new_topic_progress = {
            topic_key: {
                "topic_key": topic_key,
                "category": category,
                "topic_name": topic_name,
                "is_completed": True,
                "completion_count": 1,
                "first_completed_at": now,
                "last_completed_at": now,
                "total_time_seconds": 0,
                "session_count": 1,
                "last_session_at": now,
                "video_views": 0,
                "resource_clicks": 0,
                "notes_updated_count": 0,
                "started_at": now,
                "last_activity_at": now,
            }
        }

        new_completion = {
            "topic_key": topic_key,
            "completed_at": now,
            "count": 1,
        }

        initial_streak = update_streak({})

        db["user_progress"].insert_one(
            {
                "user_id": ObjectId(user_id),
                "topic_progress": new_topic_progress,
                "completed_topics": [new_completion],
                "bookmarked_topics": [],
                "topic_notes": {},
                "streak_data": initial_streak,
                "recent_activities": [
                    {
                        "activity_type": "topic_completed",
                        "topic_key": topic_key,
                        "category": category,
                        "topic_name": topic_name,
                        "timestamp": now,
                    }
                ],
                "total_learning_time_seconds": 0,
                "session_count": 1,
                "stats_cache": {},
                "last_updated": now,
                "created_at": now,
            }
        )

        progress_doc = db["user_progress"].find_one({"user_id": ObjectId(user_id)})
        return learning_models.UserProgress(**progress_doc)

    # Get or create topic progress
    topic_progress = progress_doc.get("topic_progress", {})
    tp = topic_progress.get(
        topic_key,
        {
            "topic_key": topic_key,
            "category": category,
            "topic_name": topic_name,
            "is_completed": False,
            "completion_count": 0,
            "first_completed_at": None,
            "last_completed_at": None,
            "total_time_seconds": 0,
            "session_count": 0,
            "last_session_at": None,
            "video_views": 0,
            "resource_clicks": 0,
            "notes_updated_count": 0,
            "started_at": now,
            "last_activity_at": now,
        },
    )

    # Handle legacy completed_topics list
    completed = progress_doc.get("completed_topics", [])
    existing_topic = None
    existing_index = -1

    for i, topic in enumerate(completed):
        if isinstance(topic, dict):
            if topic.get("topic_key") == topic_key:
                existing_topic = topic
                existing_index = i
                break
        elif isinstance(topic, str) and topic == topic_key:
            existing_topic = {
                "topic_key": topic,
                "completed_at": now,
                "count": 1,
            }
            existing_index = i
            break

    # Determine activity type based on current state
    if tp.get("is_completed"):
        # Re-completing (marking as done again) - increment count
        tp["completion_count"] = tp.get("completion_count", 0) + 1
        tp["last_completed_at"] = now
        activity_type = "topic_revisited"
    else:
        # First completion or completing again after uncomplete
        tp["is_completed"] = True
        tp["completion_count"] = tp.get("completion_count", 0) + 1
        if not tp.get("first_completed_at"):
            tp["first_completed_at"] = now
        tp["last_completed_at"] = now
        activity_type = "topic_completed"

    tp["last_activity_at"] = now
    tp["session_count"] = tp.get("session_count", 0) + 1
    tp["last_session_at"] = now
    topic_progress[topic_key] = tp

    # Update legacy completed_topics list
    if existing_topic:
        completed[existing_index] = {
            "topic_key": topic_key,
            "completed_at": now,
            "count": tp["completion_count"],
        }
    else:
        completed.append(
            {
                "topic_key": topic_key,
                "completed_at": now,
                "count": tp["completion_count"],
            }
        )

    # Update streak
    new_streak = update_streak(progress_doc)

    # Log activity
    new_activity = {
        "activity_type": activity_type,
        "topic_key": topic_key,
        "category": category,
        "topic_name": topic_name,
        "timestamp": now,
    }

    db["user_progress"].update_one(
        {"user_id": ObjectId(user_id)},
        {
            "$set": {
                "topic_progress": topic_progress,
                "completed_topics": completed,
                "streak_data": new_streak,
                "last_updated": now,
            },
            "$push": {"recent_activities": {"$each": [new_activity], "$slice": -100}},
            "$inc": {"session_count": 1},
        },
    )

    progress_doc = db["user_progress"].find_one({"user_id": ObjectId(user_id)})
    return learning_models.UserProgress(**progress_doc)


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


# ============================================
# ENHANCED TRACKING FUNCTIONS
# ============================================


def track_time_on_topic(
    db: Database, user_id: int, topic_key: str, duration_seconds: int
) -> Optional[learning_models.UserProgress]:
    """Track time spent on a specific topic"""
    now = datetime.utcnow()
    category, topic_name = parse_topic_key(topic_key)

    progress_doc = db["user_progress"].find_one({"user_id": ObjectId(user_id)})

    if not progress_doc:
        # Create new progress
        new_topic_progress = {
            topic_key: {
                "topic_key": topic_key,
                "category": category,
                "topic_name": topic_name,
                "is_completed": False,
                "completion_count": 0,
                "first_completed_at": None,
                "last_completed_at": None,
                "total_time_seconds": duration_seconds,
                "session_count": 1,
                "last_session_at": now,
                "video_views": 0,
                "resource_clicks": 0,
                "notes_updated_count": 0,
                "started_at": now,
                "last_activity_at": now,
            }
        }

        db["user_progress"].insert_one(
            {
                "user_id": ObjectId(user_id),
                "topic_progress": new_topic_progress,
                "completed_topics": [],
                "bookmarked_topics": [],
                "topic_notes": {},
                "streak_data": update_streak({}),
                "recent_activities": [],
                "total_learning_time_seconds": duration_seconds,
                "session_count": 1,
                "stats_cache": {},
                "last_updated": now,
                "created_at": now,
            }
        )
    else:
        # Update existing topic progress
        topic_progress = progress_doc.get("topic_progress", {})
        tp = topic_progress.get(
            topic_key,
            {
                "topic_key": topic_key,
                "category": category,
                "topic_name": topic_name,
                "is_completed": False,
                "completion_count": 0,
                "total_time_seconds": 0,
                "session_count": 0,
                "started_at": now,
            },
        )

        tp["total_time_seconds"] = tp.get("total_time_seconds", 0) + duration_seconds
        tp["session_count"] = tp.get("session_count", 0) + 1
        tp["last_session_at"] = now
        tp["last_activity_at"] = now
        topic_progress[topic_key] = tp

        # Update streak
        new_streak = update_streak(progress_doc)

        db["user_progress"].update_one(
            {"user_id": ObjectId(user_id)},
            {
                "$set": {
                    "topic_progress": topic_progress,
                    "streak_data": new_streak,
                    "last_updated": now,
                },
                "$inc": {
                    "total_learning_time_seconds": duration_seconds,
                    "session_count": 1,
                },
            },
        )

    progress_doc = db["user_progress"].find_one({"user_id": ObjectId(user_id)})
    return learning_models.UserProgress(**progress_doc)


def start_learning_session(
    db: Database, user_id: int, topic_key: Optional[str] = None
) -> Optional[learning_models.UserProgress]:
    """Start a learning session"""
    now = datetime.utcnow()

    progress_doc = db["user_progress"].find_one({"user_id": ObjectId(user_id)})

    activity = {
        "activity_type": "session_started",
        "topic_key": topic_key,
        "timestamp": now,
    }

    if topic_key:
        category, topic_name = parse_topic_key(topic_key)
        activity["category"] = category
        activity["topic_name"] = topic_name

    if not progress_doc:
        # Create new progress
        initial_streak = update_streak({})
        db["user_progress"].insert_one(
            {
                "user_id": ObjectId(user_id),
                "topic_progress": {},
                "completed_topics": [],
                "bookmarked_topics": [],
                "topic_notes": {},
                "streak_data": initial_streak,
                "recent_activities": [activity],
                "current_session_start": now,
                "total_learning_time_seconds": 0,
                "session_count": 0,
                "stats_cache": {},
                "last_updated": now,
                "created_at": now,
            }
        )
    else:
        db["user_progress"].update_one(
            {"user_id": ObjectId(user_id)},
            {
                "$set": {
                    "current_session_start": now,
                    "last_updated": now,
                },
                "$push": {"recent_activities": {"$each": [activity], "$slice": -100}},
            },
        )

    progress_doc = db["user_progress"].find_one({"user_id": ObjectId(user_id)})
    return learning_models.UserProgress(**progress_doc)


def end_learning_session(
    db: Database,
    user_id: int,
    topic_key: Optional[str] = None,
    duration_seconds: Optional[int] = None,
) -> Optional[learning_models.UserProgress]:
    """End a learning session and record the duration"""
    now = datetime.utcnow()

    progress_doc = db["user_progress"].find_one({"user_id": ObjectId(user_id)})

    if not progress_doc:
        return None

    # Calculate duration if not provided
    session_start = progress_doc.get("current_session_start")
    if duration_seconds is None and session_start:
        duration_seconds = int((now - session_start).total_seconds())
    elif duration_seconds is None:
        duration_seconds = 0

    activity = {
        "activity_type": "session_ended",
        "topic_key": topic_key,
        "duration_seconds": duration_seconds,
        "timestamp": now,
    }

    if topic_key:
        category, topic_name = parse_topic_key(topic_key)
        activity["category"] = category
        activity["topic_name"] = topic_name

        # Update topic-specific time
        topic_progress = progress_doc.get("topic_progress", {})
        if topic_key in topic_progress:
            topic_progress[topic_key]["total_time_seconds"] = (
                topic_progress[topic_key].get("total_time_seconds", 0)
                + duration_seconds
            )
            topic_progress[topic_key]["session_count"] = (
                topic_progress[topic_key].get("session_count", 0) + 1
            )
            topic_progress[topic_key]["last_session_at"] = now
            topic_progress[topic_key]["last_activity_at"] = now

        db["user_progress"].update_one(
            {"user_id": ObjectId(user_id)},
            {
                "$set": {
                    "topic_progress": topic_progress,
                    "current_session_start": None,
                    "last_updated": now,
                },
                "$inc": {
                    "total_learning_time_seconds": duration_seconds,
                    "session_count": 1,
                },
                "$push": {"recent_activities": {"$each": [activity], "$slice": -100}},
            },
        )
    else:
        db["user_progress"].update_one(
            {"user_id": ObjectId(user_id)},
            {
                "$set": {
                    "current_session_start": None,
                    "last_updated": now,
                },
                "$inc": {
                    "total_learning_time_seconds": duration_seconds,
                    "session_count": 1,
                },
                "$push": {"recent_activities": {"$each": [activity], "$slice": -100}},
            },
        )

    progress_doc = db["user_progress"].find_one({"user_id": ObjectId(user_id)})
    return learning_models.UserProgress(**progress_doc)


def track_resource_access(
    db: Database, user_id: int, topic_key: str, resource_url: str
) -> None:
    """Track when a user accesses a learning resource"""
    now = datetime.utcnow()
    category, topic_name = parse_topic_key(topic_key)

    activity = {
        "activity_type": "resource_accessed",
        "topic_key": topic_key,
        "category": category,
        "topic_name": topic_name,
        "resource_url": resource_url,
        "timestamp": now,
    }

    db["user_progress"].update_one(
        {"user_id": ObjectId(user_id)},
        {
            "$inc": {f"topic_progress.{topic_key}.resource_clicks": 1},
            "$set": {
                f"topic_progress.{topic_key}.last_activity_at": now,
                "last_updated": now,
            },
            "$push": {"recent_activities": {"$each": [activity], "$slice": -100}},
        },
        upsert=True,
    )


def track_video_view(
    db: Database,
    user_id: int,
    topic_key: str,
    video_id: str,
    duration_seconds: Optional[int] = None,
) -> None:
    """Track when a user watches a video"""
    now = datetime.utcnow()
    category, topic_name = parse_topic_key(topic_key)

    activity = {
        "activity_type": "video_watched",
        "topic_key": topic_key,
        "category": category,
        "topic_name": topic_name,
        "metadata": {"video_id": video_id},
        "duration_seconds": duration_seconds,
        "timestamp": now,
    }

    update_ops = {
        "$inc": {f"topic_progress.{topic_key}.video_views": 1},
        "$set": {
            f"topic_progress.{topic_key}.last_activity_at": now,
            "last_updated": now,
        },
        "$push": {"recent_activities": {"$each": [activity], "$slice": -100}},
    }

    if duration_seconds:
        update_ops["$inc"][f"topic_progress.{topic_key}.total_time_seconds"] = (
            duration_seconds
        )
        update_ops["$inc"]["total_learning_time_seconds"] = duration_seconds

    db["user_progress"].update_one(
        {"user_id": ObjectId(user_id)}, update_ops, upsert=True
    )


def get_detailed_progress(db: Database, user_id: int) -> Optional[Dict[str, Any]]:
    """Get detailed progress with full analytics"""
    progress_doc = db["user_progress"].find_one({"user_id": ObjectId(user_id)})

    if not progress_doc:
        return None

    # Calculate comprehensive stats
    stats = calculate_learning_stats(progress_doc)

    # Extract completed topic keys for backward compat
    completed_topic_keys = []
    for topic in progress_doc.get("completed_topics", []):
        if isinstance(topic, dict):
            completed_topic_keys.append(topic.get("topic_key", ""))
        elif isinstance(topic, str):
            completed_topic_keys.append(topic)

    return {
        "user_id": str(progress_doc["user_id"]),
        "completed_topics": completed_topic_keys,
        "bookmarked_topics": progress_doc.get("bookmarked_topics", []),
        "topic_notes": progress_doc.get("topic_notes", {}),
        "topic_progress": progress_doc.get("topic_progress", {}),
        "streak": stats.get("streak", {}),
        "stats": stats,
        "recent_activities": progress_doc.get("recent_activities", [])[-20:],
        "last_updated": progress_doc.get("last_updated"),
        "created_at": progress_doc.get("created_at"),
    }


# Admin Statistics Functions
def get_all_members_progress(db: Database) -> List[dict]:
    """Get learning progress for all members (Admin/Lead only) with enhanced metrics"""
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

            # Get streak data
            streak_data = progress.get("streak_data", {})

            # Get topic-level progress for detailed metrics
            topic_progress = progress.get("topic_progress", {})
            total_time = sum(
                tp.get("total_time_seconds", 0) for tp in topic_progress.values()
            )

            # Calculate category breakdown
            category_breakdown = {}
            for tp in topic_progress.values():
                cat = tp.get("category", "Unknown")
                if cat not in category_breakdown:
                    category_breakdown[cat] = {
                        "completed": 0,
                        "in_progress": 0,
                        "time_seconds": 0,
                    }
                if tp.get("is_completed"):
                    category_breakdown[cat]["completed"] += 1
                elif tp.get("started_at"):
                    category_breakdown[cat]["in_progress"] += 1
                category_breakdown[cat]["time_seconds"] += tp.get(
                    "total_time_seconds", 0
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
                    # Enhanced metrics
                    "total_time_seconds": total_time,
                    "total_time_formatted": f"{total_time // 3600}h {(total_time % 3600) // 60}m",
                    "session_count": progress.get("session_count", 0),
                    "current_streak": streak_data.get("current_streak", 0),
                    "longest_streak": streak_data.get("longest_streak", 0),
                    "last_activity_date": streak_data.get("last_activity_date"),
                    "category_breakdown": category_breakdown,
                    "last_updated": progress.get("last_updated"),
                    "created_at": progress.get("created_at"),
                }
            )

    return result


def get_learning_statistics(db: Database) -> dict:
    """Get overall learning statistics with enhanced analytics (Admin/Lead only)"""
    total_members = db.member_users.count_documents({"is_active": True})
    members_with_progress = db["user_progress"].count_documents({})

    # Get all progress records
    all_progress = list(db["user_progress"].find())

    total_completions = sum(len(p.get("completed_topics", [])) for p in all_progress)
    total_bookmarks = sum(len(p.get("bookmarked_topics", [])) for p in all_progress)
    total_notes = sum(len(p.get("topic_notes", {})) for p in all_progress)
    total_time = sum(p.get("total_learning_time_seconds", 0) for p in all_progress)
    total_sessions = sum(p.get("session_count", 0) for p in all_progress)

    # Topic completion frequency with category info
    topic_completions = {}
    category_completions = {}

    for progress in all_progress:
        for topic in progress.get("completed_topics", []):
            if isinstance(topic, dict):
                topic_key = topic.get("topic_key", "")
                if topic_key:
                    topic_completions[topic_key] = (
                        topic_completions.get(topic_key, 0) + 1
                    )
                    if "::" in topic_key:
                        category = topic_key.split("::")[0]
                        category_completions[category] = (
                            category_completions.get(category, 0) + 1
                        )
            elif isinstance(topic, str):
                topic_completions[topic] = topic_completions.get(topic, 0) + 1
                if "::" in topic:
                    category = topic.split("::")[0]
                    category_completions[category] = (
                        category_completions.get(category, 0) + 1
                    )

    # Sort topics by completion count
    most_completed_topics = sorted(
        topic_completions.items(), key=lambda x: x[1], reverse=True
    )[:10]

    # Format most completed topics with names
    formatted_topics = []
    for topic_key, count in most_completed_topics:
        if "::" in topic_key:
            category, topic_name = topic_key.split("::", 1)
            formatted_topics.append(
                {
                    "topic_key": topic_key,
                    "topic_name": topic_name,
                    "category": category,
                    "count": count,
                }
            )
        else:
            formatted_topics.append(
                {
                    "topic_key": topic_key,
                    "topic_name": topic_key,
                    "category": "Unknown",
                    "count": count,
                }
            )

    # Category breakdown
    category_stats = sorted(
        [
            {"category": cat, "completions": count}
            for cat, count in category_completions.items()
        ],
        key=lambda x: x["completions"],
        reverse=True,
    )

    # Streak statistics
    active_streaks = sum(
        1 for p in all_progress if p.get("streak_data", {}).get("current_streak", 0) > 0
    )
    max_streak = max(
        (p.get("streak_data", {}).get("longest_streak", 0) for p in all_progress),
        default=0,
    )
    avg_streak = (
        sum(p.get("streak_data", {}).get("current_streak", 0) for p in all_progress)
        / members_with_progress
        if members_with_progress > 0
        else 0
    )

    # Weekly activity (last 7 days)
    from datetime import timedelta

    week_dates = [
        (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)
    ]

    daily_activity = {date: 0 for date in week_dates}
    for progress in all_progress:
        streak_dates = progress.get("streak_data", {}).get("streak_dates", [])
        for date in streak_dates:
            if date in daily_activity:
                daily_activity[date] += 1

    weekly_activity = [
        {"date": date, "active_members": count}
        for date, count in sorted(daily_activity.items())
    ]

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
        "most_completed_topics": formatted_topics,
        # Enhanced statistics
        "total_learning_time_seconds": total_time,
        "total_learning_time_formatted": f"{total_time // 3600}h {(total_time % 3600) // 60}m",
        "total_sessions": total_sessions,
        "avg_session_duration": round(total_time / total_sessions, 0)
        if total_sessions > 0
        else 0,
        "active_streaks": active_streaks,
        "max_streak": max_streak,
        "avg_streak": round(avg_streak, 1),
        "category_stats": category_stats,
        "weekly_activity": weekly_activity,
    }
