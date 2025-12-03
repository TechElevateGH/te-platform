"""CRUD operations for Meeting feature."""

from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from pymongo.database import Database
from fastapi import HTTPException

import app.ents.meeting.models as meeting_models
import app.ents.meeting.schema as meeting_schema


# ============== Timeslot CRUD ==============


def create_timeslot(
    db: Database, *, data: meeting_schema.TimeslotCreate, created_by: str
) -> meeting_models.MeetingTimeslot:
    """Create a new meeting timeslot (Volunteer+ only).

    Multiple volunteers can create slots at the same date/time.
    Only prevents the same volunteer from creating duplicate slots.
    """

    # Check for duplicate from the same creator
    existing = db.mock_interview_timeslots.find_one(
        {
            "date": data.date,
            "start_time": data.start_time,
            "is_available": True,
            "created_by": ObjectId(created_by),
        }
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="You already have a slot at this date and time"
        )

    timeslot_dict = {
        "date": data.date,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "is_available": True,
        "interview_types": [t.value for t in data.interview_types]
        if data.interview_types
        else [],
        "created_by": ObjectId(created_by),
        "created_at": datetime.utcnow(),
    }

    result = db.mock_interview_timeslots.insert_one(timeslot_dict)
    timeslot_data = db.mock_interview_timeslots.find_one({"_id": result.inserted_id})
    return meeting_models.MeetingTimeslot(**timeslot_data)


def create_timeslots_bulk(
    db: Database,
    *,
    timeslots: List[meeting_schema.TimeslotCreate],
    created_by: str,
) -> List[meeting_models.MeetingTimeslot]:
    """Create multiple timeslots at once (Volunteer+ only).

    This allows creating multiple slots at the same date/time to support
    multiple volunteers being available at the same time.
    """

    created_timeslots = []
    for timeslot_data in timeslots:
        timeslot_dict = {
            "date": timeslot_data.date,
            "start_time": timeslot_data.start_time,
            "end_time": timeslot_data.end_time,
            "is_available": True,
            "interview_types": [t.value for t in timeslot_data.interview_types]
            if timeslot_data.interview_types
            else [],
            "created_by": ObjectId(created_by),
            "created_at": datetime.utcnow(),
        }

        result = db.mock_interview_timeslots.insert_one(timeslot_dict)
        slot = db.mock_interview_timeslots.find_one({"_id": result.inserted_id})
        created_timeslots.append(meeting_models.MeetingTimeslot(**slot))

    return created_timeslots


def read_available_timeslots(
    db: Database,
    *,
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> List[meeting_models.MeetingTimeslot]:
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

    return [meeting_models.MeetingTimeslot(**t) for t in timeslots]


def read_all_timeslots(
    db: Database, *, skip: int = 0, limit: int = 100, include_past: bool = False
) -> List[meeting_models.MeetingTimeslot]:
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

    return [meeting_models.MeetingTimeslot(**t) for t in timeslots]


def update_timeslot(
    db: Database,
    *,
    timeslot_id: str,
    data: meeting_schema.TimeslotUpdate,
    user_role: int = 3,
) -> Optional[meeting_models.MeetingTimeslot]:
    """Update a timeslot.

    Volunteer+ can update if no member has booked it.
    Admin can update anytime.
    """

    # Check if timeslot is booked (only if not Admin)
    if user_role < 5:  # Not an Admin
        existing_request = db.mock_interview_requests.find_one(
            {
                "timeslot_id": ObjectId(timeslot_id),
                "status": {"$in": ["pending", "confirmed"]},
            }
        )
        if existing_request:
            raise HTTPException(
                status_code=400,
                detail="Cannot update timeslot that has pending or confirmed meeting requests. Only Admins can modify booked timeslots.",
            )

    update_dict = {}
    if data.date is not None:
        update_dict["date"] = data.date
    if data.start_time is not None:
        update_dict["start_time"] = data.start_time
    if data.end_time is not None:
        update_dict["end_time"] = data.end_time
    if data.is_available is not None:
        update_dict["is_available"] = data.is_available
    if data.interview_types is not None:
        update_dict["interview_types"] = [t.value for t in data.interview_types]

    if not update_dict:
        # No changes, return existing
        timeslot = db.mock_interview_timeslots.find_one({"_id": ObjectId(timeslot_id)})
        if not timeslot:
            return None
        return meeting_models.MeetingTimeslot(**timeslot)

    result = db.mock_interview_timeslots.update_one(
        {"_id": ObjectId(timeslot_id)}, {"$set": update_dict}
    )

    if result.matched_count == 0:
        return None

    timeslot = db.mock_interview_timeslots.find_one({"_id": ObjectId(timeslot_id)})
    return meeting_models.MeetingTimeslot(**timeslot)


def delete_timeslot(db: Database, *, timeslot_id: str, user_role: int = 3) -> bool:
    """Delete a timeslot.

    Volunteer+ can delete if no member has booked it.
    Admin can delete anytime.
    """

    # Check if any meeting request is using this timeslot (only if not Admin)
    if user_role < 5:  # Not an Admin
        existing_request = db.mock_interview_requests.find_one(
            {
                "timeslot_id": ObjectId(timeslot_id),
                "status": {"$in": ["pending", "confirmed"]},
            }
        )

        if existing_request:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete timeslot that has pending or confirmed meeting requests. Only Admins can delete booked timeslots.",
            )

    result = db.mock_interview_timeslots.delete_one({"_id": ObjectId(timeslot_id)})
    return result.deleted_count > 0


# ============== Meeting Request CRUD ==============


def create_meeting_request(
    db: Database,
    *,
    user_id: str,
    user_name: str,
    user_email: str,
    data: meeting_schema.MeetingRequestCreate,
) -> meeting_models.MeetingRequest:
    """Create a new meeting request (Member only)."""

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

    # Calculate duration based on meeting type
    duration = meeting_schema.MeetingType.get_duration(data.interview_type.value)

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
        "member_notes": data.member_notes or "",
        "status": "pending",
        "interviewer_feedback": "",
        "meeting_notes": "",
        "reminder_sent": False,
        "created_at": now,
        "updated_at": now,
    }

    result = db.mock_interview_requests.insert_one(request_dict)

    # Mark the timeslot as unavailable
    db.mock_interview_timeslots.update_one(
        {"_id": ObjectId(data.timeslot_id)}, {"$set": {"is_available": False}}
    )

    request_data = db.mock_interview_requests.find_one({"_id": result.inserted_id})
    return meeting_models.MeetingRequest(**request_data)


def read_user_meeting_requests(
    db: Database, *, user_id: str, skip: int = 0, limit: int = 100
) -> List[meeting_models.MeetingRequest]:
    """Get all meeting requests for a specific user."""

    requests = (
        db.mock_interview_requests.find({"user_id": ObjectId(user_id)})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return [meeting_models.MeetingRequest(**r) for r in requests]


def read_all_meeting_requests(
    db: Database, *, skip: int = 0, limit: int = 100, status: Optional[str] = None
) -> List[meeting_models.MeetingRequest]:
    """Get all meeting requests (Lead+ only)."""

    query = {}
    if status:
        query["status"] = status

    requests = (
        db.mock_interview_requests.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return [meeting_models.MeetingRequest(**r) for r in requests]


def read_meeting_request_by_id(
    db: Database, *, request_id: str
) -> Optional[meeting_models.MeetingRequest]:
    """Get a specific meeting request by ID."""

    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    if not request_data:
        return None
    return meeting_models.MeetingRequest(**request_data)


def read_assigned_meeting_requests(
    db: Database, *, assigned_to: str, skip: int = 0, limit: int = 100
) -> List[meeting_models.MeetingRequest]:
    """Get meeting requests assigned to a specific interviewer."""

    requests = (
        db.mock_interview_requests.find({"assigned_to": ObjectId(assigned_to)})
        .sort("timeslot_date", 1)
        .skip(skip)
        .limit(limit)
    )

    return [meeting_models.MeetingRequest(**r) for r in requests]


def assign_volunteer(
    db: Database,
    *,
    request_id: str,
    assigned_to: str,
    assigned_to_name: str,
    assigned_by: str,
    meeting_notes: str = "",
) -> Optional[meeting_models.MeetingRequest]:
    """Assign a volunteer to a meeting request (Lead+ only)."""

    now = datetime.utcnow()
    update_dict = {
        "assigned_to": ObjectId(assigned_to),
        "assigned_to_name": assigned_to_name,
        "assigned_by": ObjectId(assigned_by),
        "assigned_at": now,
        "updated_at": now,
    }

    if meeting_notes:
        update_dict["meeting_notes"] = meeting_notes

    result = db.mock_interview_requests.update_one(
        {"_id": ObjectId(request_id)}, {"$set": update_dict}
    )

    if result.matched_count == 0:
        return None

    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    return meeting_models.MeetingRequest(**request_data)


def confirm_meeting(
    db: Database, *, request_id: str, meeting_notes: str = ""
) -> Optional[meeting_models.MeetingRequest]:
    """Confirm a meeting request (Lead+ only)."""

    now = datetime.utcnow()
    update_dict = {
        "status": "confirmed",
        "confirmed_at": now,
        "updated_at": now,
        "reminder_sent": False,  # Reset reminder flag when confirming
    }

    if meeting_notes:
        update_dict["meeting_notes"] = meeting_notes

    result = db.mock_interview_requests.update_one(
        {"_id": ObjectId(request_id)}, {"$set": update_dict}
    )

    if result.matched_count == 0:
        return None

    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    return meeting_models.MeetingRequest(**request_data)


def complete_meeting(
    db: Database, *, request_id: str, interviewer_feedback: str
) -> Optional[meeting_models.MeetingRequest]:
    """Mark a meeting as completed with feedback."""

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
    return meeting_models.MeetingRequest(**request_data)


def cancel_meeting(
    db: Database, *, request_id: str, cancellation_reason: str = ""
) -> Optional[meeting_models.MeetingRequest]:
    """Cancel a meeting request."""

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
    return meeting_models.MeetingRequest(**request_data)


def update_meeting_status(
    db: Database,
    *,
    request_id: str,
    data: meeting_schema.MeetingStatusUpdate,
) -> Optional[meeting_models.MeetingRequest]:
    """Update the status of a meeting request."""

    now = datetime.utcnow()
    update_dict = {"status": data.status.value, "updated_at": now}

    if data.status == meeting_schema.MeetingStatus.confirmed:
        update_dict["confirmed_at"] = now
    elif data.status == meeting_schema.MeetingStatus.completed:
        update_dict["completed_at"] = now
    elif data.status == meeting_schema.MeetingStatus.cancelled:
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

    if data.member_notes is not None:
        update_dict["member_notes"] = data.member_notes

    result = db.mock_interview_requests.update_one(
        {"_id": ObjectId(request_id)}, {"$set": update_dict}
    )

    if result.matched_count == 0:
        return None

    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    return meeting_models.MeetingRequest(**request_data)


def count_meeting_requests_by_status(db: Database, *, status: str) -> int:
    """Count meeting requests by status."""
    return db.mock_interview_requests.count_documents({"status": status})


def count_available_timeslots(db: Database) -> int:
    """Count available future timeslots."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    return db.mock_interview_timeslots.count_documents(
        {"is_available": True, "date": {"$gte": today}}
    )


def delete_meeting_request(db: Database, *, request_id: str) -> bool:
    """
    Permanently delete a meeting request from the database (Admin only).
    Also makes the associated timeslot available again.
    """
    # Get the request to find the timeslot
    request_data = db.mock_interview_requests.find_one({"_id": ObjectId(request_id)})
    if not request_data:
        raise HTTPException(status_code=404, detail="Meeting request not found")

    # Delete the request
    result = db.mock_interview_requests.delete_one({"_id": ObjectId(request_id)})

    # Make the timeslot available again if it exists
    if request_data.get("timeslot_id"):
        db.mock_interview_timeslots.update_one(
            {"_id": request_data["timeslot_id"]}, {"$set": {"is_available": True}}
        )

    return result.deleted_count > 0


def bulk_delete_meeting_requests(db: Database, *, request_ids: list[str]) -> dict:
    """
    Permanently delete multiple meeting requests from the database (Admin only).
    Also makes the associated timeslots available again.
    """
    deleted_count = 0
    for request_id in request_ids:
        try:
            # Get the request to find the timeslot
            request_data = db.mock_interview_requests.find_one(
                {"_id": ObjectId(request_id)}
            )
            if request_data:
                # Delete the request
                result = db.mock_interview_requests.delete_one(
                    {"_id": ObjectId(request_id)}
                )
                if result.deleted_count > 0:
                    deleted_count += 1

                # Make the timeslot available again if it exists
                if request_data.get("timeslot_id"):
                    db.mock_interview_timeslots.update_one(
                        {"_id": request_data["timeslot_id"]},
                        {"$set": {"is_available": True}},
                    )
        except Exception:
            continue

    return {
        "message": f"Successfully deleted {deleted_count} meeting request(s)",
        "deleted_count": deleted_count,
        "total_requested": len(request_ids),
    }
