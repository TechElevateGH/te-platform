"""Helper functions and dependencies for Mock Interview feature."""

import app.ents.mock_interview.models as mock_interview_models
import app.ents.mock_interview.schema as mock_interview_schema


def parse_timeslot(
    timeslot: mock_interview_models.MockInterviewTimeslot,
) -> mock_interview_schema.TimeslotRead:
    """Convert a timeslot model to a read schema."""
    return mock_interview_schema.TimeslotRead(
        id=str(timeslot.id),
        date=timeslot.date,
        start_time=timeslot.start_time,
        end_time=timeslot.end_time,
        is_available=timeslot.is_available,
        created_by=str(timeslot.created_by),
        created_at=timeslot.created_at.isoformat() if timeslot.created_at else "",
    )


def parse_interview_request(
    request: mock_interview_models.MockInterviewRequest,
) -> mock_interview_schema.MockInterviewRequestRead:
    """Convert a mock interview request model to a read schema."""
    return mock_interview_schema.MockInterviewRequestRead(
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
        notes=request.notes,
        assigned_to=str(request.assigned_to) if request.assigned_to else None,
        assigned_to_name=request.assigned_to_name,
        assigned_by=str(request.assigned_by) if request.assigned_by else None,
        assigned_at=request.assigned_at.isoformat() if request.assigned_at else None,
        status=request.status,
        interviewer_feedback=request.interviewer_feedback,
        meeting_link=request.meeting_link,
        created_at=request.created_at.isoformat() if request.created_at else "",
        updated_at=request.updated_at.isoformat() if request.updated_at else "",
        confirmed_at=request.confirmed_at.isoformat() if request.confirmed_at else None,
        completed_at=request.completed_at.isoformat() if request.completed_at else None,
        cancelled_at=request.cancelled_at.isoformat() if request.cancelled_at else None,
    )


def parse_interview_request_brief(
    request: mock_interview_models.MockInterviewRequest,
) -> mock_interview_schema.MockInterviewRequestReadBrief:
    """Convert a mock interview request model to a brief read schema."""
    return mock_interview_schema.MockInterviewRequestReadBrief(
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


def get_interview_type_display_name(interview_type: str) -> str:
    """Get a user-friendly display name for interview type."""
    display_names = {
        "system_design": "System Design",
        "behavioral": "Behavioral",
        "coding": "Coding",
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
