"""CRUD operations for Mock Interview feature."""

from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from pymongo.database import Database
from fastapi import HTTPException

import app.ents.mock_interview.models as mock_interview_models
import app.ents.mock_interview.schema as mock_interview_schema


# ============== Timeslot CRUD ==============


def create_timeslot(
    db: Database, *, data: mock_interview_schema.TimeslotCreate, created_by: str
) -> mock_interview_models.MockInterviewTimeslot:
    """Create a new interview timeslot (Volunteer+ only)."""

    # Check for overlapping timeslots on the same date
    existing = db.mock_interview_timeslots.find_one(
        {"date": data.date, "start_time": data.start_time, "is_available": True}
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="A timeslot already exists at this date and time"
        )

    timeslot_dict = {
        "date": data.date,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "is_available": True,
        "created_by": ObjectId(created_by),
        "created_at": datetime.utcnow(),
    }

    result = db.mock_interview_timeslots.insert_one(timeslot_dict)
    timeslot_data = db.mock_interview_timeslots.find_one({"_id": result.inserted_id})
    return mock_interview_models.MockInterviewTimeslot(**timeslot_data)


def create_timeslots_bulk(
    db: Database,
    *,
    timeslots: List[mock_interview_schema.TimeslotCreate],
    created_by: str,
) -> List[mock_interview_models.MockInterviewTimeslot]:
    """Create multiple timeslots at once (Volunteer+ only)."""

    created_timeslots = []
    for timeslot_data in timeslots:
        # Skip duplicates silently
        existing = db.mock_interview_timeslots.find_one(
            {
                "date": timeslot_data.date,
                "start_time": timeslot_data.start_time,
                "is_available": True,
            }
        )
        if existing:
            continue

        timeslot_dict = {
            "date": timeslot_data.date,
            "start_time": timeslot_data.start_time,
            "end_time": timeslot_data.end_time,
            "is_available": True,
            "created_by": ObjectId(created_by),
            "created_at": datetime.utcnow(),
        }

        result = db.mock_interview_timeslots.insert_one(timeslot_dict)
        slot = db.mock_interview_timeslots.find_one({"_id": result.inserted_id})
        created_timeslots.append(mock_interview_models.MockInterviewTimeslot(**slot))

    return created_timeslots


def read_available_timeslots(
    db: Database,
    *,
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> List[mock_interview_models.MockInterviewTimeslot]:
    """Get all available timeslots, optionally filtered by date range."""

    query = {"is_available": True}

    if date_from or date_to:
        query["date"] = {}
        if date_from:
            query["date"]["$gte"] = date_from
        if date_to:
            query["date"]["$lte"] = date_to

    # Only return future timeslots (today or later)
    today = datetime.utcnow().strftime("%Y-%m-%d")
    if "date" not in query:
        query["date"] = {}
    if "$gte" not in query.get("date", {}):
        query["date"]["$gte"] = today

    timeslots = (
        db.mock_interview_timeslots.find(query)
        .sort([("date", 1), ("start_time", 1)])
        .skip(skip)
        .limit(limit)
    )

    return [mock_interview_models.MockInterviewTimeslot(**t) for t in timeslots]


def read_all_timeslots(
    db: Database, *, skip: int = 0, limit: int = 100, include_past: bool = False
) -> List[mock_interview_models.MockInterviewTimeslot]:
    """Get all timeslots (for management view)."""

    query = {}
    if not include_past:
        today = datetime.utcnow().strftime("%Y-%m-%d")
        query["date"] = {"$gte": today}

    timeslots = (
        db.mock_interview_timeslots.find(query)
        .sort([("date", 1), ("start_time", 1)])
        .skip(skip)
        .limit(limit)
    )

    return [mock_interview_models.MockInterviewTimeslot(**t) for t in timeslots]


def update_timeslot(
    db: Database, *, timeslot_id: str, data: mock_interview_schema.TimeslotUpdate
) -> Optional[mock_interview_models.MockInterviewTimeslot]:
    """Update a timeslot (Volunteer+ only)."""

    update_dict = {}
    if data.date is not None:
        update_dict["date"] = data.date
    if data.start_time is not None:
        update_dict["start_time"] = data.start_time
    if data.end_time is not None:
        update_dict["end_time"] = data.end_time
    if data.is_available is not None:
        update_dict["is_available"] = data.is_available

    if not update_dict:
        # No changes, return existing
        timeslot = db.mock_interview_timeslots.find_one({"_id": ObjectId(timeslot_id)})
        if not timeslot:
            return None
        return mock_interview_models.MockInterviewTimeslot(**timeslot)

    result = db.mock_interview_timeslots.update_one(
        {"_id": ObjectId(timeslot_id)}, {"$set": update_dict}
    )

    if result.matched_count == 0:
        return None

    timeslot = db.mock_interview_timeslots.find_one({"_id": ObjectId(timeslot_id)})
    return mock_interview_models.MockInterviewTimeslot(**timeslot)


def delete_timeslot(db: Database, *, timeslot_id: str) -> bool:
    """Delete a timeslot (Volunteer+ only). Only if not booked."""

    # Check if any interview request is using this timeslot
    existing_request = db.mock_interview_requests.find_one(
        {
            "timeslot_id": ObjectId(timeslot_id),
            "status": {"$in": ["pending", "confirmed"]},
        }
    )

    if existing_request:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete timeslot that has pending or confirmed interview requests",
        )

    result = db.mock_interview_timeslots.delete_one({"_id": ObjectId(timeslot_id)})
    return result.deleted_count > 0


# ============== Mock Interview Request CRUD ==============


def create_interview_request(
    db: Database,
    *,
    user_id: str,
    user_name: str,
    user_email: str,
    data: mock_interview_schema.MockInterviewRequestCreate,
) -> mock_interview_models.MockInterviewRequest:
    """Create a new mock interview request (Member only)."""

    # Verify the timeslot exists and is available
    timeslot = db.mock_interview_timeslots.find_one(
        {"_id": ObjectId(data.timeslot_id), "is_available": True}
    )

    if not timeslot:
        raise HTTPException(
            status_code=404, detail="Timeslot not found or not available"
        )

    # Check if user already has a pending/confirmed request for this timeslot
    existing = db.mock_interview_requests.find_one(
        {
            "user_id": ObjectId(user_id),
            "timeslot_id": ObjectId(data.timeslot_id),
            "status": {"$in": ["pending", "confirmed"]},
        }
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="You already have a pending or confirmed request for this timeslot",
        )

    # Calculate duration based on interview type
    duration = mock_interview_schema.InterviewType.get_duration(
        data.interview_type.value
    )

    now = datetime.utcnow()
    request_dict = {
        "user_id": ObjectId(user_id),
        "user_name": user_name,
        "user_email": user_email,
        "interview_type": data.interview_type.value,
        "timeslot_id": ObjectId(data.timeslot_id),
        "timeslot_date": timeslot["date"],
        "timeslot_time": f"{timeslot['start_time']} - {timeslot['end_time']}",
        "duration_minutes": duration,
        "pending_companies": data.pending_companies,
        "earliest_interview_date": data.earliest_interview_date,
        "notes": data.notes or "",
        "status": "pending",
        "interviewer_feedback": "",
        "meeting_link": "",
        "created_at": now,
        "updated_at": now,
    }

    result = db.mock_interview_requests.insert_one(request_dict)

    # Mark the timeslot as unavailable
    db.mock_interview_timeslots.update_one(
        {"_id": ObjectId(data.timeslot_id)}, {"$set": {"is_available": False}}
    )

    request_data = db.mock_interview_requests.find_one({"_id": result.inserted_id})
    return mock_interview_models.MockInterviewRequest(**request_data)


def read_user_interview_requests(
    db: Database, *, user_id: str, skip: int = 0, limit: int = 100
) -> List[mock_interview_models.MockInterviewRequest]:
    """Get all interview requests for a specific user."""

    requests = (
        db.mock_interview_requests.find({"user_id": ObjectId(user_id)})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return [mock_interview_models.MockInterviewRequest(**r) for r in requests]


def read_all_interview_requests(
    db: Database, *, skip: int = 0, limit: int = 100, status: Optional[str] = None
) -> List[mock_interview_models.MockInterviewRequest]:
    """Get all interview requests (Lead+ only)."""

    query = {}
    if status:
        query["status"] = status

    requests = (
        db.mock_interview_requests.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return [mock_interview_models.MockInterviewRequest(**r) for r in requests]


def read_interview_request_by_id(
    db: Database, *, request_id: str
) -> Optional[mock_interview_models.MockInterviewRequest]:
    """Get a specific interview request by ID."""

    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    if not request_data:
        return None
    return mock_interview_models.MockInterviewRequest(**request_data)


def read_assigned_interview_requests(
    db: Database, *, assigned_to: str, skip: int = 0, limit: int = 100
) -> List[mock_interview_models.MockInterviewRequest]:
    """Get interview requests assigned to a specific interviewer."""

    requests = (
        db.mock_interview_requests.find({"assigned_to": ObjectId(assigned_to)})
        .sort("timeslot_date", 1)
        .skip(skip)
        .limit(limit)
    )

    return [mock_interview_models.MockInterviewRequest(**r) for r in requests]


def assign_interviewer(
    db: Database,
    *,
    request_id: str,
    assigned_to: str,
    assigned_to_name: str,
    assigned_by: str,
    meeting_link: str = "",
) -> Optional[mock_interview_models.MockInterviewRequest]:
    """Assign an interviewer to a mock interview request (Lead+ only)."""

    now = datetime.utcnow()
    update_dict = {
        "assigned_to": ObjectId(assigned_to),
        "assigned_to_name": assigned_to_name,
        "assigned_by": ObjectId(assigned_by),
        "assigned_at": now,
        "updated_at": now,
    }

    if meeting_link:
        update_dict["meeting_link"] = meeting_link

    result = db.mock_interview_requests.update_one(
        {"_id": ObjectId(request_id)}, {"$set": update_dict}
    )

    if result.matched_count == 0:
        return None

    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    return mock_interview_models.MockInterviewRequest(**request_data)


def confirm_interview(
    db: Database, *, request_id: str, meeting_link: str = ""
) -> Optional[mock_interview_models.MockInterviewRequest]:
    """Confirm a mock interview request (Lead+ only)."""

    now = datetime.utcnow()
    update_dict = {"status": "confirmed", "confirmed_at": now, "updated_at": now}

    if meeting_link:
        update_dict["meeting_link"] = meeting_link

    result = db.mock_interview_requests.update_one(
        {"_id": ObjectId(request_id)}, {"$set": update_dict}
    )

    if result.matched_count == 0:
        return None

    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    return mock_interview_models.MockInterviewRequest(**request_data)


def complete_interview(
    db: Database, *, request_id: str, interviewer_feedback: str
) -> Optional[mock_interview_models.MockInterviewRequest]:
    """Mark a mock interview as completed with feedback."""

    now = datetime.utcnow()
    update_dict = {
        "status": "completed",
        "interviewer_feedback": interviewer_feedback,
        "completed_at": now,
        "updated_at": now,
    }

    result = db.mock_interview_requests.update_one(
        {"_id": ObjectId(request_id)}, {"$set": update_dict}
    )

    if result.matched_count == 0:
        return None

    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    return mock_interview_models.MockInterviewRequest(**request_data)


def cancel_interview(
    db: Database, *, request_id: str, cancellation_reason: str = ""
) -> Optional[mock_interview_models.MockInterviewRequest]:
    """Cancel a mock interview request."""

    # Get the request to find the timeslot
    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    if not request_data:
        return None

    now = datetime.utcnow()
    update_dict = {
        "status": "cancelled",
        "cancelled_at": now,
        "updated_at": now,
        "notes": request_data.get("notes", "")
        + f"\n\nCancellation reason: {cancellation_reason}"
        if cancellation_reason
        else request_data.get("notes", ""),
    }

    db.mock_interview_requests.update_one(
        {"_id": ObjectId(request_id)}, {"$set": update_dict}
    )

    # Make the timeslot available again
    if request_data.get("timeslot_id"):
        db.mock_interview_timeslots.update_one(
            {"_id": request_data["timeslot_id"]}, {"$set": {"is_available": True}}
        )

    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    return mock_interview_models.MockInterviewRequest(**request_data)


def update_interview_status(
    db: Database,
    *,
    request_id: str,
    data: mock_interview_schema.MockInterviewStatusUpdate,
) -> Optional[mock_interview_models.MockInterviewRequest]:
    """Update the status of a mock interview request."""

    now = datetime.utcnow()
    update_dict = {"status": data.status.value, "updated_at": now}

    if data.status == mock_interview_schema.MockInterviewStatus.confirmed:
        update_dict["confirmed_at"] = now
    elif data.status == mock_interview_schema.MockInterviewStatus.completed:
        update_dict["completed_at"] = now
    elif data.status == mock_interview_schema.MockInterviewStatus.cancelled:
        update_dict["cancelled_at"] = now
        # Make timeslot available again
        request_data = db.mock_interview_requests.find_one(
            {"_id": ObjectId(request_id)}
        )
        if request_data and request_data.get("timeslot_id"):
            db.mock_interview_timeslots.update_one(
                {"_id": request_data["timeslot_id"]}, {"$set": {"is_available": True}}
            )

    if data.interviewer_feedback is not None:
        update_dict["interviewer_feedback"] = data.interviewer_feedback

    if data.meeting_link is not None:
        update_dict["meeting_link"] = data.meeting_link

    result = db.mock_interview_requests.update_one(
        {"_id": ObjectId(request_id)}, {"$set": update_dict}
    )

    if result.matched_count == 0:
        return None

    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    return mock_interview_models.MockInterviewRequest(**request_data)


def count_interview_requests_by_status(db: Database, *, status: str) -> int:
    """Count interview requests by status."""
    return db.mock_interview_requests.count_documents({"status": status})


def count_available_timeslots(db: Database) -> int:
    """Count available future timeslots."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return db.mock_interview_timeslots.count_documents(
        {"is_available": True, "date": {"$gte": today}}
    )
