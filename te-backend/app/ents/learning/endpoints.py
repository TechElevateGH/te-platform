from typing import Any, Dict, List, Optional

import app.database.session as session
import app.ents.application.crud as application_crud
import app.ents.application.schema as application_schema
import app.ents.learning.crud as learning_crud
import app.ents.learning.schema as learning_schema
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
from app.core.settings import settings
from fastapi import APIRouter, Depends, UploadFile, HTTPException, Query
from pymongo.database import Database

router = APIRouter(prefix="/learning")


# ============================================
# LESSON ENDPOINTS
# ============================================


@router.get(
    "/lessons",
    response_model=List[learning_schema.LessonRead],
)
def get_lessons(
    db: Database = Depends(session.get_db),
    current_user: Optional[user_models.MemberUser] = Depends(
        user_dependencies.get_learning_content_access
    ),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    is_published: Optional[bool] = Query(None),
) -> Any:
    """
    Retrieve lessons with optional filtering.
    Filters: category, topic, difficulty, is_published
    Available to everyone except Referrers. Guests can view content.
    """
    lessons = learning_crud.get_all_lessons(
        db,
        skip=skip,
        limit=limit,
        category=category,
        topic=topic,
        difficulty=difficulty,
        is_published=is_published,
    )

    return [
        learning_schema.LessonRead(
            id=str(lesson.id),
            title=lesson.title,
            category=lesson.category,
            topic=lesson.topic,
            description=lesson.description,
            video_id=lesson.video_id,
            content_type=lesson.content_type,
            resources=lesson.resources,
            code_examples=lesson.code_examples,
            difficulty=lesson.difficulty,
            tags=lesson.tags,
            duration_minutes=lesson.duration_minutes,
            instructor=lesson.instructor,
            is_published=lesson.is_published,
            created_by=lesson.created_by,
            created_at=lesson.created_at,
            updated_at=lesson.updated_at,
            view_count=lesson.view_count,
        )
        for lesson in lessons
    ]


@router.get(
    "/lessons/{lesson_id}",
    response_model=learning_schema.LessonRead,
)
def get_lesson(
    lesson_id: str,
    db: Database = Depends(session.get_db),
    current_user: Optional[user_models.MemberUser] = Depends(
        user_dependencies.get_learning_content_access
    ),
) -> Any:
    """
    Get a specific lesson by ID.
    Available to everyone except Referrers. Guests can view content.
    """
    lesson = learning_crud.get_lesson_by_id(db, lesson_id)

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return learning_schema.LessonRead(
        id=str(lesson.id),
        title=lesson.title,
        category=lesson.category,
        topic=lesson.topic,
        description=lesson.description,
        video_id=lesson.video_id,
        content_type=lesson.content_type,
        resources=lesson.resources,
        code_examples=lesson.code_examples,
        difficulty=lesson.difficulty,
        tags=lesson.tags,
        duration_minutes=lesson.duration_minutes,
        instructor=lesson.instructor,
        is_published=lesson.is_published,
        created_by=lesson.created_by,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at,
        view_count=lesson.view_count,
    )


@router.get(
    "/lessons/category/{category}/topic/{topic}",
    response_model=List[learning_schema.LessonRead],
)
def get_lessons_for_topic(
    category: str,
    topic: str,
    db: Database = Depends(session.get_db),
    current_user: Optional[user_models.MemberUser] = Depends(
        user_dependencies.get_learning_content_access
    ),
) -> Any:
    """
    Get all lessons for a specific category and topic.
    Available to everyone except Referrers. Guests can view content.
    """
    lessons = learning_crud.get_lessons_by_category_and_topic(db, category, topic)

    return [
        learning_schema.LessonRead(
            id=str(lesson.id),
            title=lesson.title,
            category=lesson.category,
            topic=lesson.topic,
            description=lesson.description,
            video_id=lesson.video_id,
            content_type=lesson.content_type,
            resources=lesson.resources,
            code_examples=lesson.code_examples,
            difficulty=lesson.difficulty,
            tags=lesson.tags,
            duration_minutes=lesson.duration_minutes,
            instructor=lesson.instructor,
            is_published=lesson.is_published,
            created_by=lesson.created_by,
            created_at=lesson.created_at,
            updated_at=lesson.updated_at,
            view_count=lesson.view_count,
        )
        for lesson in lessons
    ]


@router.post(
    "/lessons",
    response_model=learning_schema.LessonRead,
)
def create_lesson(
    db: Database = Depends(session.get_db),
    *,
    data: learning_schema.LessonCreate,
    current_user: user_models.MemberUser = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Create a new lesson. Requires Volunteer permissions or above (role >= 3).
    """
    lesson = learning_crud.create_lesson(db, data=data, user_id=current_user.id)

    return learning_schema.LessonRead(
        id=str(lesson.id),
        title=lesson.title,
        category=lesson.category,
        topic=lesson.topic,
        description=lesson.description,
        video_id=lesson.video_id,
        content_type=lesson.content_type,
        resources=lesson.resources,
        code_examples=lesson.code_examples,
        difficulty=lesson.difficulty,
        tags=lesson.tags,
        duration_minutes=lesson.duration_minutes,
        instructor=lesson.instructor,
        is_published=lesson.is_published,
        created_by=lesson.created_by,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at,
        view_count=lesson.view_count,
    )


@router.patch(
    "/lessons/{lesson_id}",
    response_model=learning_schema.LessonRead,
)
def update_lesson(
    lesson_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: learning_schema.LessonUpdate,
    current_user: user_models.MemberUser = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Update an existing lesson. Requires Volunteer permissions or above (role >= 3).
    """
    lesson = learning_crud.update_lesson(db, lesson_id, data)

    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return learning_schema.LessonRead(
        id=str(lesson.id),
        title=lesson.title,
        category=lesson.category,
        topic=lesson.topic,
        description=lesson.description,
        video_id=lesson.video_id,
        content_type=lesson.content_type,
        resources=lesson.resources,
        code_examples=lesson.code_examples,
        difficulty=lesson.difficulty,
        tags=lesson.tags,
        duration_minutes=lesson.duration_minutes,
        instructor=lesson.instructor,
        is_published=lesson.is_published,
        created_by=lesson.created_by,
        created_at=lesson.created_at,
        updated_at=lesson.updated_at,
        view_count=lesson.view_count,
    )


@router.delete(
    "/lessons/{lesson_id}",
    response_model=Dict[str, bool],
)
def delete_lesson(
    lesson_id: str,
    db: Database = Depends(session.get_db),
    current_user: user_models.MemberUser = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Delete a lesson. Requires Volunteer permissions or above (role >= 3).
    """
    success = learning_crud.delete_lesson(db, lesson_id)

    if not success:
        raise HTTPException(status_code=404, detail="Lesson not found")

    return {"success": True}


@router.post(
    "/file/upload",
    response_model=Dict[str, application_schema.FileUpload],
)
def lesson_file_upload(
    *,
    db: Database = Depends(session.get_db),
    file: UploadFile,
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Create other lesson.
    """
    uploaded_file = application_crud.upload_file(
        file=file, parent=settings.GDRIVE_LESSONS
    )
    return {"file": uploaded_file}


# User Progress Endpoints
@router.get(
    "/progress",
    response_model=learning_schema.ProgressRead,
)
def get_user_progress(
    db: Database = Depends(session.get_db),
    current_user: user_models.MemberUser = Depends(
        user_dependencies.get_current_member_only
    ),
) -> Any:
    """
    Get current user's learning progress.
    Only available for Members (role=1).
    """
    progress = learning_crud.get_user_progress(db, current_user.id)

    if not progress:
        # Create empty progress if doesn't exist
        progress = learning_crud.create_user_progress(
            db, current_user.id, learning_schema.ProgressCreate()
        )

    return {
        "user_id": str(progress.user_id),
        "completed_topics": progress.completed_topics,
        "bookmarked_topics": progress.bookmarked_topics,
        "topic_notes": progress.topic_notes,
        "last_updated": progress.last_updated,
        "created_at": progress.created_at,
    }


@router.post(
    "/progress",
    response_model=learning_schema.ProgressRead,
)
def update_progress(
    *,
    db: Database = Depends(session.get_db),
    data: learning_schema.ProgressUpdate,
    current_user: user_models.MemberUser = Depends(
        user_dependencies.get_current_member_only
    ),
) -> Any:
    """
    Update user's learning progress.
    Only available for Members (role=1).
    """
    progress = learning_crud.get_user_progress(db, current_user.id)

    if not progress:
        # Create new progress
        create_data = learning_schema.ProgressCreate(
            completed_topics=data.completed_topics or [],
            bookmarked_topics=data.bookmarked_topics or [],
            topic_notes=data.topic_notes or {},
        )
        progress = learning_crud.create_user_progress(db, current_user.id, create_data)
    else:
        # Update existing progress
        progress = learning_crud.update_user_progress(db, current_user.id, data)

    # Convert to dict and ensure user_id is a string
    return {
        "user_id": str(progress.user_id),
        "completed_topics": progress.completed_topics,
        "bookmarked_topics": progress.bookmarked_topics,
        "topic_notes": progress.topic_notes,
        "last_updated": progress.last_updated,
        "created_at": progress.created_at,
    }


@router.patch(
    "/progress/complete",
    response_model=learning_schema.ProgressRead,
)
def toggle_complete_topic(
    *,
    db: Database = Depends(session.get_db),
    data: learning_schema.TopicToggle,
    current_user: user_models.MemberUser = Depends(
        user_dependencies.get_current_member_only
    ),
) -> Any:
    """
    Toggle completion status for a topic.
    Only available for Members (role=1).
    """
    progress = learning_crud.toggle_completed_topic(db, current_user.id, data.topic_key)

    return {
        "user_id": str(progress.user_id),
        "completed_topics": progress.completed_topics,
        "bookmarked_topics": progress.bookmarked_topics,
        "topic_notes": progress.topic_notes,
        "last_updated": progress.last_updated,
        "created_at": progress.created_at,
    }


@router.patch(
    "/progress/bookmark",
    response_model=learning_schema.ProgressRead,
)
def toggle_bookmark_topic(
    *,
    db: Database = Depends(session.get_db),
    data: learning_schema.TopicToggle,
    current_user: user_models.MemberUser = Depends(
        user_dependencies.get_current_member_only
    ),
) -> Any:
    """
    Toggle bookmark status for a topic.
    Only available for Members (role=1).
    """
    progress = learning_crud.toggle_bookmarked_topic(
        db, current_user.id, data.topic_key
    )

    return {
        "user_id": str(progress.user_id),
        "completed_topics": progress.completed_topics,
        "bookmarked_topics": progress.bookmarked_topics,
        "topic_notes": progress.topic_notes,
        "last_updated": progress.last_updated,
        "created_at": progress.created_at,
    }


@router.post(
    "/progress/note",
    response_model=learning_schema.ProgressRead,
)
def update_note(
    *,
    db: Database = Depends(session.get_db),
    data: learning_schema.TopicNote,
    current_user: user_models.MemberUser = Depends(
        user_dependencies.get_current_member_only
    ),
) -> Any:
    """
    Update or create a note for a topic.
    Only available for Members (role=1).
    """
    progress = learning_crud.update_topic_note(
        db, current_user.id, data.topic_key, data.note
    )

    return {
        "user_id": str(progress.user_id),
        "completed_topics": progress.completed_topics,
        "bookmarked_topics": progress.bookmarked_topics,
        "topic_notes": progress.topic_notes,
        "last_updated": progress.last_updated,
        "created_at": progress.created_at,
    }


# ============================================
# ADMIN/LEAD STATISTICS ENDPOINTS
# ============================================


@router.get(
    "/admin/all-progress",
)
def get_all_progress(
    db: Database = Depends(session.get_db),
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_lead),
) -> Any:
    """
    Get learning progress for all members.
    Only available for Lead/Admin (role >= 4).
    """
    all_progress = learning_crud.get_all_members_progress(db)
    return {"members": all_progress, "total": len(all_progress)}


@router.get(
    "/admin/statistics",
)
def get_statistics(
    db: Database = Depends(session.get_db),
    current_user: user_models.MemberUser = Depends(user_dependencies.get_current_lead),
) -> Any:
    """
    Get overall learning statistics and analytics.
    Only available for Lead/Admin (role >= 4).
    """
    stats = learning_crud.get_learning_statistics(db)
    return stats
