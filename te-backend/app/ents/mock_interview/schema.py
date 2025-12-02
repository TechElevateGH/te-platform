"""Pydantic schemas for Mock Interview feature."""

from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class InterviewType(str, Enum):
    """Types of mock interviews available."""

    system_design = "system_design"
    behavioral = "behavioral"
    coding = "coding"

    @classmethod
    def get_duration(cls, interview_type: str) -> int:
        """Get duration in minutes for interview type. Behavioral is 20 min, others are 55 min."""
        if interview_type == cls.behavioral.value:
            return 20
        return 55


class MockInterviewStatus(str, Enum):
    """Status of a mock interview request."""

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


class TimeslotUpdate(BaseModel):
    """Schema for updating a timeslot (Volunteer+ only)."""

    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_available: Optional[bool] = None


class TimeslotRead(BaseModel):
    """Schema for reading timeslot data."""

    id: str
    date: str
    start_time: str
    end_time: str
    is_available: bool
    created_by: str
    created_at: str


class TimeslotBulkCreate(BaseModel):
    """Schema for bulk creating timeslots."""

    timeslots: List[TimeslotCreate]


# ============== Mock Interview Request Schemas ==============


class MockInterviewRequestCreate(BaseModel):
    """Schema for Member to create a mock interview request."""

    interview_type: InterviewType
    timeslot_id: str = Field(..., description="ID of the selected timeslot")
    pending_companies: List[str] = Field(
        default=[],
        description="List of companies the member has pending interviews with",
    )
    earliest_interview_date: Optional[str] = Field(
        None, description="Date of earliest upcoming interview (YYYY-MM-DD format)"
    )
    notes: Optional[str] = Field("", description="Additional notes for the interviewer")


class MockInterviewRequestUpdate(BaseModel):
    """Schema for updating a mock interview request."""

    interview_type: Optional[InterviewType] = None
    timeslot_id: Optional[str] = None
    pending_companies: Optional[List[str]] = None
    earliest_interview_date: Optional[str] = None
    notes: Optional[str] = None


class MockInterviewAssign(BaseModel):
    """Schema for Lead+ to assign an interviewer to a request."""

    assigned_to: str = Field(..., description="User ID of the Volunteer/Lead to assign")
    meeting_link: Optional[str] = Field(
        "", description="Meeting link for the interview"
    )


class MockInterviewConfirm(BaseModel):
    """Schema for confirming a mock interview."""

    meeting_link: Optional[str] = Field(
        "", description="Meeting link for the interview"
    )
    confirmation_message: Optional[str] = Field(
        "", description="Optional message to send to the member"
    )


class MockInterviewComplete(BaseModel):
    """Schema for completing a mock interview with feedback."""

    interviewer_feedback: str = Field(..., description="Feedback from the interviewer")


class MockInterviewCancel(BaseModel):
    """Schema for cancelling a mock interview."""

    cancellation_reason: Optional[str] = Field(
        "", description="Reason for cancellation"
    )


class MockInterviewStatusUpdate(BaseModel):
    """Schema for updating mock interview status."""

    status: MockInterviewStatus
    interviewer_feedback: Optional[str] = None
    meeting_link: Optional[str] = None


# ============== Read Schemas ==============


class MockInterviewRequestRead(BaseModel):
    """Schema for reading mock interview request data."""

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
    notes: str
    assigned_to: Optional[str]
    assigned_to_name: Optional[str]
    assigned_by: Optional[str]
    assigned_at: Optional[str]
    status: str
    interviewer_feedback: str
    meeting_link: str
    created_at: str
    updated_at: str
    confirmed_at: Optional[str]
    completed_at: Optional[str]
    cancelled_at: Optional[str]


class MockInterviewRequestReadBrief(BaseModel):
    """Brief schema for listing mock interview requests."""

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
