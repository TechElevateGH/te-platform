"""API endpoints for Mock Interview feature."""

from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from bson import ObjectId

import app.database.session as session
import app.ents.mock_interview.crud as mock_interview_crud
import app.ents.mock_interview.dependencies as mock_interview_deps
import app.ents.mock_interview.schema as mock_interview_schema
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
from app.core.permissions import get_user_role

mock_interview_router = APIRouter(prefix="/mock-interviews", tags=["Mock Interviews"])


# ============== Timeslot Endpoints ==============


@mock_interview_router.get(
    "/timeslots",
    response_model=Dict[str, List[mock_interview_schema.TimeslotRead]],
)
def get_available_timeslots(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get available timeslots for booking mock interviews.
    Available to all authenticated users.
    """
    timeslots = mock_interview_crud.read_available_timeslots(
        db, skip=skip, limit=limit, date_from=date_from, date_to=date_to
    )
    return {"timeslots": [mock_interview_deps.parse_timeslot(t) for t in timeslots]}


@mock_interview_router.get(
    "/timeslots/all",
    response_model=Dict[str, Any],
)
def get_all_timeslots(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    include_past: bool = False,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Get all timeslots (available and booked) for management.
    Volunteer+ only.
    """
    timeslots = mock_interview_crud.read_all_timeslots(
        db, skip=skip, limit=limit, include_past=include_past
    )
    available_count = mock_interview_crud.count_available_timeslots(db)

    return {
        "timeslots": [mock_interview_deps.parse_timeslot(t) for t in timeslots],
        "total": len(timeslots),
        "available_count": available_count,
    }


@mock_interview_router.post(
    "/timeslots",
    response_model=Dict[str, mock_interview_schema.TimeslotRead],
    status_code=status.HTTP_201_CREATED,
)
def create_timeslot(
    db: Database = Depends(session.get_db),
    *,
    data: mock_interview_schema.TimeslotCreate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Create a new timeslot for mock interviews.
    Volunteer+ only.
    """
    timeslot = mock_interview_crud.create_timeslot(
        db, data=data, created_by=str(user.id)
    )
    return {"timeslot": mock_interview_deps.parse_timeslot(timeslot)}


@mock_interview_router.post(
    "/timeslots/bulk",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
)
def create_timeslots_bulk(
    db: Database = Depends(session.get_db),
    *,
    data: mock_interview_schema.TimeslotBulkCreate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Create multiple timeslots at once.
    Volunteer+ only.
    """
    timeslots = mock_interview_crud.create_timeslots_bulk(
        db, timeslots=data.timeslots, created_by=str(user.id)
    )
    return {
        "timeslots": [mock_interview_deps.parse_timeslot(t) for t in timeslots],
        "created_count": len(timeslots),
    }


@mock_interview_router.patch(
    "/timeslots/{timeslot_id}",
    response_model=Dict[str, mock_interview_schema.TimeslotRead],
)
def update_timeslot(
    timeslot_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: mock_interview_schema.TimeslotUpdate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Update a timeslot.
    Volunteer+ only.
    """
    timeslot = mock_interview_crud.update_timeslot(
        db, timeslot_id=timeslot_id, data=data
    )
    if not timeslot:
        raise HTTPException(status_code=404, detail="Timeslot not found")
    return {"timeslot": mock_interview_deps.parse_timeslot(timeslot)}


@mock_interview_router.delete(
    "/timeslots/{timeslot_id}",
    response_model=Dict[str, str],
)
def delete_timeslot(
    timeslot_id: str,
    db: Database = Depends(session.get_db),
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Delete a timeslot.
    Volunteer+ only. Cannot delete if there are pending/confirmed interviews.
    """
    success = mock_interview_crud.delete_timeslot(db, timeslot_id=timeslot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Timeslot not found")
    return {"message": "Timeslot deleted successfully"}


# ============== Mock Interview Request Endpoints ==============


@mock_interview_router.post(
    "",
    response_model=Dict[str, mock_interview_schema.MockInterviewRequestRead],
    status_code=status.HTTP_201_CREATED,
)
def create_interview_request(
    db: Database = Depends(session.get_db),
    *,
    data: mock_interview_schema.MockInterviewRequestCreate,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_member_only),
) -> Any:
    """
    Create a new mock interview request.
    Member only.
    """
    request = mock_interview_crud.create_interview_request(
        db,
        user_id=str(user.id),
        user_name=user.full_name,
        user_email=user.email,
        data=data,
    )

    # Send email notification to admin
    from app.utilities.email import send_mock_interview_request_email

    try:
        send_mock_interview_request_email(
            member_name=user.full_name,
            member_email=user.email,
            interview_type=mock_interview_deps.get_interview_type_display_name(
                data.interview_type.value
            ),
            timeslot_date=request.timeslot_date,
            timeslot_time=request.timeslot_time,
            pending_companies=data.pending_companies,
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to send mock interview request email: {e}")

    return {"interview": mock_interview_deps.parse_interview_request(request)}


@mock_interview_router.get(
    "/my-requests",
    response_model=Dict[str, List[mock_interview_schema.MockInterviewRequestRead]],
)
def get_my_interview_requests(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_member_only),
) -> Any:
    """
    Get the current user's mock interview requests.
    Member only.
    """
    requests = mock_interview_crud.read_user_interview_requests(
        db, user_id=str(user.id), skip=skip, limit=limit
    )
    return {
        "interviews": [mock_interview_deps.parse_interview_request(r) for r in requests]
    }


@mock_interview_router.get(
    "/assigned",
    response_model=Dict[str, List[mock_interview_schema.MockInterviewRequestRead]],
)
def get_assigned_interviews(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Get interviews assigned to the current user (as interviewer).
    Volunteer+ only.
    """
    requests = mock_interview_crud.read_assigned_interview_requests(
        db, assigned_to=str(user.id), skip=skip, limit=limit
    )
    return {
        "interviews": [mock_interview_deps.parse_interview_request(r) for r in requests]
    }


@mock_interview_router.get(
    "/all",
    response_model=Dict[str, Any],
)
def get_all_interview_requests(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Get all mock interview requests.
    Lead+ only.
    """
    requests = mock_interview_crud.read_all_interview_requests(
        db, skip=skip, limit=limit, status=status
    )

    pending_count = mock_interview_crud.count_interview_requests_by_status(
        db, status="pending"
    )
    confirmed_count = mock_interview_crud.count_interview_requests_by_status(
        db, status="confirmed"
    )

    return {
        "interviews": [
            mock_interview_deps.parse_interview_request(r) for r in requests
        ],
        "total": len(requests),
        "pending_count": pending_count,
        "confirmed_count": confirmed_count,
    }


@mock_interview_router.get(
    "/{request_id}",
    response_model=Dict[str, mock_interview_schema.MockInterviewRequestRead],
)
def get_interview_request(
    request_id: str,
    db: Database = Depends(session.get_db),
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get a specific mock interview request.
    Members can only view their own requests.
    Volunteer+ can view any request.
    """
    request = mock_interview_crud.read_interview_request_by_id(
        db, request_id=request_id
    )
    if not request:
        raise HTTPException(status_code=404, detail="Interview request not found")

    # Check authorization
    user_role = get_user_role(user)
    if user_role < 3 and str(request.user_id) != str(user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this interview request",
        )

    return {"interview": mock_interview_deps.parse_interview_request(request)}


@mock_interview_router.post(
    "/{request_id}/assign",
    response_model=Dict[str, mock_interview_schema.MockInterviewRequestRead],
)
def assign_interviewer(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: mock_interview_schema.MockInterviewAssign,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Assign an interviewer to a mock interview request.
    Lead+ only.
    """
    # Get the assignee's name
    assignee = db.privileged_users.find_one({"_id": ObjectId(data.assigned_to)})
    if not assignee:
        # Try member users (in case a member with elevated privileges)
        assignee = db.member_users.find_one({"_id": ObjectId(data.assigned_to)})

    if not assignee:
        raise HTTPException(status_code=404, detail="Assignee not found")

    assignee_name = assignee.get("username") or assignee.get("full_name", "Unknown")

    request = mock_interview_crud.assign_interviewer(
        db,
        request_id=request_id,
        assigned_to=data.assigned_to,
        assigned_to_name=assignee_name,
        assigned_by=str(user.id),
        meeting_link=data.meeting_link or "",
    )

    if not request:
        raise HTTPException(status_code=404, detail="Interview request not found")

    # Send notification to the assigned interviewer
    from app.utilities.email import send_mock_interview_assigned_email

    assignee_email = assignee.get("email")
    if assignee_email:
        try:
            send_mock_interview_assigned_email(
                email_to=assignee_email,
                interviewer_name=assignee_name,
                member_name=request.user_name,
                interview_type=mock_interview_deps.get_interview_type_display_name(
                    request.interview_type
                ),
                timeslot_date=request.timeslot_date,
                timeslot_time=request.timeslot_time,
                duration_minutes=request.duration_minutes,
            )
        except Exception as e:
            print(f"Failed to send assignment email: {e}")

    return {"interview": mock_interview_deps.parse_interview_request(request)}


@mock_interview_router.post(
    "/{request_id}/confirm",
    response_model=Dict[str, mock_interview_schema.MockInterviewRequestRead],
)
def confirm_interview(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: mock_interview_schema.MockInterviewConfirm,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Confirm a mock interview request.
    Lead+ only.
    """
    request = mock_interview_crud.confirm_interview(
        db, request_id=request_id, meeting_link=data.meeting_link or ""
    )

    if not request:
        raise HTTPException(status_code=404, detail="Interview request not found")

    # Send confirmation email to the member
    from app.utilities.email import send_mock_interview_confirmed_email

    try:
        send_mock_interview_confirmed_email(
            email_to=request.user_email,
            member_name=request.user_name,
            interview_type=mock_interview_deps.get_interview_type_display_name(
                request.interview_type
            ),
            timeslot_date=request.timeslot_date,
            timeslot_time=request.timeslot_time,
            duration_minutes=request.duration_minutes,
            interviewer_name=request.assigned_to_name or "TBD",
            meeting_link=request.meeting_link,
            confirmation_message=data.confirmation_message or "",
        )
    except Exception as e:
        print(f"Failed to send confirmation email: {e}")

    return {"interview": mock_interview_deps.parse_interview_request(request)}


@mock_interview_router.post(
    "/{request_id}/complete",
    response_model=Dict[str, mock_interview_schema.MockInterviewRequestRead],
)
def complete_interview(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: mock_interview_schema.MockInterviewComplete,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Mark a mock interview as completed with feedback.
    Volunteer+ only. Must be the assigned interviewer or Lead+.
    """
    # Get the request to verify authorization
    existing_request = mock_interview_crud.read_interview_request_by_id(
        db, request_id=request_id
    )
    if not existing_request:
        raise HTTPException(status_code=404, detail="Interview request not found")

    # Verify user is either the assigned interviewer or Lead+
    user_role = get_user_role(user)
    if user_role < 4 and str(existing_request.assigned_to) != str(user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned interviewer or Lead+ can complete this interview",
        )

    request = mock_interview_crud.complete_interview(
        db, request_id=request_id, interviewer_feedback=data.interviewer_feedback
    )

    # Send feedback email to the member
    from app.utilities.email import send_mock_interview_completed_email

    try:
        send_mock_interview_completed_email(
            email_to=request.user_email,
            member_name=request.user_name,
            interview_type=mock_interview_deps.get_interview_type_display_name(
                request.interview_type
            ),
            interviewer_name=request.assigned_to_name or "Your Interviewer",
            feedback=data.interviewer_feedback,
        )
    except Exception as e:
        print(f"Failed to send completion email: {e}")

    return {"interview": mock_interview_deps.parse_interview_request(request)}


@mock_interview_router.post(
    "/{request_id}/cancel",
    response_model=Dict[str, mock_interview_schema.MockInterviewRequestRead],
)
def cancel_interview(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: mock_interview_schema.MockInterviewCancel,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Cancel a mock interview request.
    Members can cancel their own pending requests.
    Lead+ can cancel any request.
    """
    # Get the request to verify authorization
    existing_request = mock_interview_crud.read_interview_request_by_id(
        db, request_id=request_id
    )
    if not existing_request:
        raise HTTPException(status_code=404, detail="Interview request not found")

    user_role = get_user_role(user)

    # Members can only cancel their own pending requests
    if user_role < 4:
        if str(existing_request.user_id) != str(user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own interview requests",
            )
        if existing_request.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending requests can be cancelled by members",
            )

    request = mock_interview_crud.cancel_interview(
        db, request_id=request_id, cancellation_reason=data.cancellation_reason or ""
    )

    # Send cancellation email
    from app.utilities.email import send_mock_interview_cancelled_email

    try:
        send_mock_interview_cancelled_email(
            email_to=request.user_email,
            member_name=request.user_name,
            interview_type=mock_interview_deps.get_interview_type_display_name(
                request.interview_type
            ),
            timeslot_date=request.timeslot_date,
            timeslot_time=request.timeslot_time,
            cancellation_reason=data.cancellation_reason or "",
        )
    except Exception as e:
        print(f"Failed to send cancellation email: {e}")

    return {"interview": mock_interview_deps.parse_interview_request(request)}


@mock_interview_router.patch(
    "/{request_id}",
    response_model=Dict[str, mock_interview_schema.MockInterviewRequestRead],
)
def update_interview_status(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: mock_interview_schema.MockInterviewStatusUpdate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Update mock interview status.
    Lead+ only.
    """
    request = mock_interview_crud.update_interview_status(
        db, request_id=request_id, data=data
    )

    if not request:
        raise HTTPException(status_code=404, detail="Interview request not found")

    return {"interview": mock_interview_deps.parse_interview_request(request)}


@mock_interview_router.get(
    "/volunteers/list",
    response_model=Dict[str, List[Dict[str, Any]]],
)
def get_volunteers_list(
    db: Database = Depends(session.get_db),
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Get list of volunteers and leads who can be assigned as interviewers.
    Lead+ only.
    """
    # Get privileged users with role >= 3 (Volunteer, Lead, Admin)
    volunteers = db.privileged_users.find({"role": {"$gte": 3}, "is_active": True})

    volunteer_list = []
    for v in volunteers:
        volunteer_list.append(
            {
                "id": str(v["_id"]),
                "name": v.get("username", "Unknown"),
                "role": v.get("role", 3),
            }
        )

    return {"volunteers": volunteer_list}
