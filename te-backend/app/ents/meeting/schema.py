"""Pydantic schemas for Meeting feature."""

from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class MeetingType(str, Enum):
    """Types of meetings available."""

    system_design = "system_design"
    behavioral = "behavioral"
    coding = "coding"
    one_on_one = "one_on_one"

    @classmethod
    def get_duration(cls, meeting_type: str) -> int:
        """Get duration in minutes for meeting type. Behavioral and 1-on-1 are 20 min, others are 55 min."""
        if meeting_type == cls.behavioral.value:
            return 20
        if meeting_type == cls.one_on_one.value:
            return 20
        return 55


class MeetingStatus(str, Enum):
    """Status of a meeting request."""

    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"


# ============== Timeslot Schemas ==============


class TimeslotCreate(BaseModel):
    """Schema for creating a new timeslot (Volunteer+ only)."""

    date: str = Field(..., description="Date in YYYY-MM-DD format")
    start_time: str = Field(..., description="Start time in HH:MM format (24-hour)")
    end_time: str = Field(..., description="End time in HH:MM format (24-hour)")
    interview_types: List[MeetingType] = Field(
        default=[], description="List of meeting types available in this slot"
    )


class TimeslotUpdate(BaseModel):
    """Schema for updating a timeslot (Volunteer+ only)."""

    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_available: Optional[bool] = None
    interview_types: Optional[List[MeetingType]] = None


class TimeslotRead(BaseModel):
    """Schema for reading timeslot data."""

    id: str
    date: str
    start_time: str
    end_time: str
    is_available: bool
    interview_types: List[str]
    created_by: str
    created_at: str


class TimeslotBulkCreate(BaseModel):
    """Schema for bulk creating timeslots."""

    timeslots: List[TimeslotCreate]


# ============== Meeting Request Schemas ==============


class MeetingRequestCreate(BaseModel):
    """Schema for Member to create a meeting request."""

    interview_type: MeetingType
    timeslot_id: str = Field(..., description="ID of the selected timeslot")
    pending_companies: List[str] = Field(
        default=[],
        description="List of companies the member has pending interviews with",
    )
    earliest_interview_date: Optional[str] = Field(
        None, description="Date of earliest upcoming interview (YYYY-MM-DD format)"
    )
    member_notes: Optional[str] = Field(
        "", description="Additional notes for the interviewer"
    )


class MeetingRequestUpdate(BaseModel):
    """Schema for updating a meeting request."""

    interview_type: Optional[MeetingType] = None
    timeslot_id: Optional[str] = None
    pending_companies: Optional[List[str]] = None
    earliest_interview_date: Optional[str] = None
    member_notes: Optional[str] = None


class MeetingAssign(BaseModel):
    """Schema for Lead+ to assign an interviewer to a request."""

    assigned_to: str = Field(..., description="User ID of the Volunteer/Lead to assign")
    meeting_notes: Optional[str] = Field(
        "", description="Notes for the meeting (link, details, etc.)"
    )


class MeetingConfirm(BaseModel):
    """Schema for confirming a meeting."""

    meeting_notes: Optional[str] = Field(
        "", description="Notes for the meeting (link, details, etc.)"
    )
    confirmation_message: Optional[str] = Field(
        "", description="Optional message to send to the member"
    )


class MeetingComplete(BaseModel):
    """Schema for completing a meeting with feedback."""

    interviewer_feedback: str = Field(..., description="Feedback from the interviewer")


class MeetingCancel(BaseModel):
    """Schema for cancelling a meeting."""

    cancellation_reason: Optional[str] = Field(
        "", description="Reason for cancellation"
    )


class MeetingStatusUpdate(BaseModel):
    """Schema for updating meeting status."""

    status: MeetingStatus
    interviewer_feedback: Optional[str] = None
    meeting_notes: Optional[str] = None


# ============== Read Schemas ==============


class MeetingRequestRead(BaseModel):
    """Schema for reading meeting request data."""

    id: str
    user_id: str
    user_name: str
    user_email: str
    interview_type: str
    timeslot_id: str
    timeslot_date: str
    timeslot_time: str
    duration_minutes: int
    pending_companies: List[str]
    earliest_interview_date: Optional[str]
    member_notes: str
    assigned_to: Optional[str]
    assigned_to_name: Optional[str]
    assigned_by: Optional[str]
    assigned_at: Optional[str]
    status: str
    interviewer_feedback: str
    meeting_notes: str
    created_at: str
    updated_at: str
    confirmed_at: Optional[str]
    completed_at: Optional[str]
    cancelled_at: Optional[str]


class MeetingRequestReadBrief(BaseModel):
    """Brief schema for listing meeting requests."""

    id: str
    user_name: str
    user_email: str
    interview_type: str
    timeslot_date: str
    timeslot_time: str
    duration_minutes: int
    status: str
    assigned_to_name: Optional[str]
    pending_companies: List[str]
    earliest_interview_date: Optional[str]
    created_at: str
