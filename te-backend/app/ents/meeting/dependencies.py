"""Helper functions and dependencies for Meeting feature."""

import app.ents.meeting.models as meeting_models
import app.ents.meeting.schema as meeting_schema


def parse_timeslot(
    timeslot: meeting_models.MeetingTimeslot,
) -> meeting_schema.TimeslotRead:
    """Convert a timeslot model to a read schema."""
    return meeting_schema.TimeslotRead(
        id=str(timeslot.id),
        date=timeslot.date,
        start_time=timeslot.start_time,
        end_time=timeslot.end_time,
        is_available=timeslot.is_available,
        interview_types=timeslot.interview_types
        if hasattr(timeslot, "interview_types")
        else [],
        created_by=str(timeslot.created_by),
        created_at=timeslot.created_at.isoformat() if timeslot.created_at else "",
    )


def parse_meeting_request(
    request: meeting_models.MeetingRequest,
) -> meeting_schema.MeetingRequestRead:
    """Convert a meeting request model to a read schema."""
    return meeting_schema.MeetingRequestRead(
        id=str(request.id),
        user_id=str(request.user_id),
        user_name=request.user_name,
        user_email=request.user_email,
        interview_type=request.interview_type,
        timeslot_id=str(request.timeslot_id),
        timeslot_date=request.timeslot_date,
        timeslot_time=request.timeslot_time,
        duration_minutes=request.duration_minutes,
        pending_companies=request.pending_companies,
        earliest_interview_date=request.earliest_interview_date,
        member_notes=request.member_notes,
        assigned_to=str(request.assigned_to) if request.assigned_to else None,
        assigned_to_name=request.assigned_to_name,
        assigned_by=str(request.assigned_by) if request.assigned_by else None,
        assigned_at=request.assigned_at.isoformat() if request.assigned_at else None,
        status=request.status,
        interviewer_feedback=request.interviewer_feedback,
        meeting_notes=request.meeting_notes,
        created_at=request.created_at.isoformat() if request.created_at else "",
        updated_at=request.updated_at.isoformat() if request.updated_at else "",
        confirmed_at=request.confirmed_at.isoformat() if request.confirmed_at else None,
        completed_at=request.completed_at.isoformat() if request.completed_at else None,
        cancelled_at=request.cancelled_at.isoformat() if request.cancelled_at else None,
    )


def parse_meeting_request_brief(
    request: meeting_models.MeetingRequest,
) -> meeting_schema.MeetingRequestReadBrief:
    """Convert a meeting request model to a brief read schema."""
    return meeting_schema.MeetingRequestReadBrief(
        id=str(request.id),
        user_name=request.user_name,
        user_email=request.user_email,
        interview_type=request.interview_type,
        timeslot_date=request.timeslot_date,
        timeslot_time=request.timeslot_time,
        duration_minutes=request.duration_minutes,
        status=request.status,
        assigned_to_name=request.assigned_to_name,
        pending_companies=request.pending_companies,
        earliest_interview_date=request.earliest_interview_date,
        created_at=request.created_at.isoformat() if request.created_at else "",
    )


def get_meeting_type_display_name(interview_type: str) -> str:
    """Get a user-friendly display name for meeting type."""
    display_names = {
        "system_design": "System Design",
        "behavioral": "Behavioral",
        "coding": "Coding",
        "one_on_one": "1-on-1 Mentorship",
    }
    return display_names.get(interview_type, interview_type.title())


def get_status_display_name(status: str) -> str:
    """Get a user-friendly display name for status."""
    display_names = {
        "pending": "Pending",
        "confirmed": "Confirmed",
        "completed": "Completed",
        "cancelled": "Cancelled",
    }
    return display_names.get(status, status.title())
