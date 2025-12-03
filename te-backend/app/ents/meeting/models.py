"""MongoDB models for Meeting feature."""

from datetime import datetime
from typing import Optional, Any, List
from pydantic import BaseModel, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema
from bson import ObjectId


# Custom type for MongoDB ObjectId compatible with Pydantic v2
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.union_schema(
            [
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema(
                    [
                        core_schema.str_schema(),
                        core_schema.no_info_plain_validator_function(cls.validate),
                    ]
                ),
            ]
        )

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

    @classmethod
    def __get_pydantic_json_schema__(
        cls, schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {"type": "string"}


class MeetingTimeslot(BaseModel):
    """
    MongoDB document model for available meeting timeslots.
    Volunteer+ users can manage these timeslots.
    """

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    date: str  # Format: YYYY-MM-DD
    start_time: str  # Format: HH:MM (24-hour)
    end_time: str  # Format: HH:MM (24-hour)
    is_available: bool = True
    interview_types: List[str] = []  # List of meeting types available in this slot
    created_by: PyObjectId  # Volunteer/Lead/Admin who created this slot
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}


class MeetingRequest(BaseModel):
    """
    MongoDB document model for meeting requests from Members.
    """

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")

    # Member who requested the meeting
    user_id: PyObjectId
    user_name: str = ""
    user_email: str = ""

    # Meeting details
    interview_type: str  # system_design, behavioral, technical, coding
    timeslot_id: PyObjectId  # Reference to the selected timeslot
    timeslot_date: str = ""  # Denormalized for quick access
    timeslot_time: str = ""  # Denormalized for quick access

    # Duration based on type: behavioral=20min, others=55min
    duration_minutes: int = 55

    # Companies the member has pending interviews with
    pending_companies: List[str] = []  # List of company names
    earliest_interview_date: Optional[str] = None  # Format: YYYY-MM-DD

    # Additional notes from the member
    member_notes: str = ""

    # Assignment and status
    assigned_to: Optional[PyObjectId] = None  # Volunteer/Lead assigned to conduct
    assigned_to_name: Optional[str] = None  # Denormalized for quick access
    assigned_by: Optional[PyObjectId] = None  # Lead/Admin who made the assignment
    assigned_at: Optional[datetime] = None

    # Status: pending, confirmed, completed, cancelled
    status: str = "pending"

    # Feedback from the interviewer
    interviewer_feedback: str = ""

    # Meeting notes from interviewer (meeting link, details, etc.)
    meeting_notes: str = ""

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

    # Reminder tracking
    reminder_sent: bool = False
    reminder_sent_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str, datetime: lambda v: v.isoformat()}
