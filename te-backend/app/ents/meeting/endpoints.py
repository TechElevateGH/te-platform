"""API endpoints for Meeting feature."""

from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pymongo.database import Database
from bson import ObjectId

import app.database.session as session
import app.ents.meeting.crud as meeting_crud
import app.ents.meeting.dependencies as meeting_deps
import app.ents.meeting.schema as meeting_schema
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
from app.core.permissions import get_user_role

meeting_router = APIRouter(prefix="/interviews", tags=["Meetings"])


# ============== Timeslot Endpoints ==============


@meeting_router.get(
    "/timeslots",
    response_model=Dict[str, List[meeting_schema.TimeslotRead]],
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
    Get available timeslots for booking meetings.
    Available to all authenticated users.
    """
    timeslots = meeting_crud.read_available_timeslots(
        db, skip=skip, limit=limit, date_from=date_from, date_to=date_to
    )
    return {"timeslots": [meeting_deps.parse_timeslot(t) for t in timeslots]}


@meeting_router.get(
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
    timeslots = meeting_crud.read_all_timeslots(
        db, skip=skip, limit=limit, include_past=include_past
    )
    available_count = meeting_crud.count_available_timeslots(db)

    return {
        "timeslots": [meeting_deps.parse_timeslot(t) for t in timeslots],
        "total": len(timeslots),
        "available_count": available_count,
    }


@meeting_router.post(
    "/timeslots",
    response_model=Dict[str, meeting_schema.TimeslotRead],
    status_code=status.HTTP_201_CREATED,
)
def create_timeslot(
    db: Database = Depends(session.get_db),
    *,
    data: meeting_schema.TimeslotCreate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Create a new timeslot for meetings.
    Volunteer+ only.
    """
    timeslot = meeting_crud.create_timeslot(db, data=data, created_by=str(user.id))
    return {"timeslot": meeting_deps.parse_timeslot(timeslot)}


@meeting_router.post(
    "/timeslots/bulk",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
)
def create_timeslots_bulk(
    db: Database = Depends(session.get_db),
    *,
    data: meeting_schema.TimeslotBulkCreate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Create multiple timeslots at once.
    Volunteer+ only.
    """
    timeslots = meeting_crud.create_timeslots_bulk(
        db, timeslots=data.timeslots, created_by=str(user.id)
    )
    return {
        "timeslots": [meeting_deps.parse_timeslot(t) for t in timeslots],
        "created_count": len(timeslots),
    }


@meeting_router.patch(
    "/timeslots/{timeslot_id}",
    response_model=Dict[str, meeting_schema.TimeslotRead],
)
def update_timeslot(
    timeslot_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: meeting_schema.TimeslotUpdate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Update a timeslot.
    Volunteer+ can update if not booked. Admin can update anytime.
    """
    user_role = get_user_role(user)
    timeslot = meeting_crud.update_timeslot(
        db, timeslot_id=timeslot_id, data=data, user_role=user_role
    )
    if not timeslot:
        raise HTTPException(status_code=404, detail="Timeslot not found")
    return {"timeslot": meeting_deps.parse_timeslot(timeslot)}


@meeting_router.delete(
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
    Volunteer+ can delete if not booked. Admin can delete anytime.
    """
    user_role = get_user_role(user)
    success = meeting_crud.delete_timeslot(
        db, timeslot_id=timeslot_id, user_role=user_role
    )
    if not success:
        raise HTTPException(status_code=404, detail="Timeslot not found")
    return {"message": "Timeslot deleted successfully"}


# ============== Interview Request Endpoints ==============


@meeting_router.post(
    "",
    response_model=Dict[str, meeting_schema.MeetingRequestRead],
    status_code=status.HTTP_201_CREATED,
)
def create_interview_request(
    db: Database = Depends(session.get_db),
    *,
    data: meeting_schema.MeetingRequestCreate,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_member_only),
) -> Any:
    """
    Create a new meeting request.
    Member only.
    """
    request = meeting_crud.create_meeting_request(
        db,
        user_id=str(user.id),
        user_name=user.full_name,
        user_email=user.email,
        data=data,
    )

    # Send email notification to admin
    from app.utilities.email import send_interview_request_email

    try:
        send_interview_request_email(
            member_name=user.full_name,
            member_email=user.email,
            interview_type=meeting_deps.get_meeting_type_display_name(
                data.interview_type.value
            ),
            timeslot_date=request.timeslot_date,
            timeslot_time=request.timeslot_time,
            pending_companies=data.pending_companies,
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to send meeting request email: {e}")

    return {"interview": meeting_deps.parse_meeting_request(request)}


@meeting_router.get(
    "/my-requests",
    response_model=Dict[str, List[meeting_schema.MeetingRequestRead]],
)
def get_my_interview_requests(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_member_only),
) -> Any:
    """
    Get the current user's meeting requests.
    Member only.
    """
    requests = meeting_crud.read_user_meeting_requests(
        db, user_id=str(user.id), skip=skip, limit=limit
    )
    return {"interviews": [meeting_deps.parse_meeting_request(r) for r in requests]}


@meeting_router.get(
    "/assigned",
    response_model=Dict[str, List[meeting_schema.MeetingRequestRead]],
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
    requests = meeting_crud.read_assigned_meeting_requests(
        db, assigned_to=str(user.id), skip=skip, limit=limit
    )
    return {"interviews": [meeting_deps.parse_meeting_request(r) for r in requests]}


@meeting_router.get(
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
    Get all meeting requests.
    Lead+ only.
    """
    requests = meeting_crud.read_all_meeting_requests(
        db, skip=skip, limit=limit, status=status
    )

    pending_count = meeting_crud.count_meeting_requests_by_status(db, status="pending")
    confirmed_count = meeting_crud.count_meeting_requests_by_status(
        db, status="confirmed"
    )

    return {
        "interviews": [meeting_deps.parse_meeting_request(r) for r in requests],
        "total": len(requests),
        "pending_count": pending_count,
        "confirmed_count": confirmed_count,
    }


@meeting_router.get(
    "/interviewers",
    response_model=Dict[str, List[Dict[str, Any]]],
)
def get_interviewers_list(
    db: Database = Depends(session.get_db),
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Get list of available interviewers.
    Lead can see themselves and Volunteers only.
    Admin can see all Volunteer+ users.
    """
    user_role = get_user_role(user)

    if user_role == 4:  # Lead
        # Leads can only see themselves and Volunteers (role 3)
        interviewers = list(
            db.privileged_users.find(
                {
                    "$or": [
                        {"_id": user.id, "is_active": True},  # Themselves
                        {"role": 3, "is_active": True},  # Volunteers
                    ]
                }
            )
        )
    else:  # Admin (role 5)
        # Admins can see all Volunteer+ users (role >= 3)
        interviewers = list(
            db.privileged_users.find({"role": {"$gte": 3}, "is_active": True})
        )

    interviewer_list = []
    for interviewer in interviewers:
        interviewer_list.append(
            {
                "id": str(interviewer["_id"]),
                "full_name": interviewer.get(
                    "username", "Unknown"
                ),  # PrivilegedUser uses 'username' as display name
                "email": None,  # PrivilegedUser doesn't have email field
                "role": interviewer.get("role", 3),
            }
        )

    return {"interviewers": interviewer_list}


@meeting_router.get(
    "/{request_id}",
    response_model=Dict[str, meeting_schema.MeetingRequestRead],
)
def get_interview_request(
    request_id: str,
    db: Database = Depends(session.get_db),
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get a specific meeting request.
    Members can only view their own requests.
    Volunteer+ can view any request.
    """
    request = meeting_crud.read_meeting_request_by_id(db, request_id=request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Meeting request not found")

    # Check authorization
    user_role = get_user_role(user)
    if user_role < 3 and str(request.user_id) != str(user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this meeting request",
        )

    return {"interview": meeting_deps.parse_meeting_request(request)}


@meeting_router.post(
    "/{request_id}/assign",
    response_model=Dict[str, meeting_schema.MeetingRequestRead],
)
def assign_interviewer(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: meeting_schema.MeetingAssign,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Assign an interviewer to a meeting request.
    Lead can assign to themselves or Volunteers only.
    Admin can assign to anyone.
    """
    user_role = get_user_role(user)

    # Get the assignee's information
    assignee = db.privileged_users.find_one({"_id": ObjectId(data.assigned_to)})
    if not assignee:
        # Try member users (in case a member with elevated privileges)
        assignee = db.member_users.find_one({"_id": ObjectId(data.assigned_to)})

    if not assignee:
        raise HTTPException(status_code=404, detail="Assignee not found")

    assignee_role = assignee.get("role", 1)

    # Leads (role 4) can only assign to themselves or Volunteers (role 3)
    # Admins (role 5) can assign to anyone
    if user_role == 4:  # Lead
        if data.assigned_to != str(user.id) and assignee_role != 3:
            raise HTTPException(
                status_code=403,
                detail="Leads can only assign meeting requests to themselves or to Volunteers",
            )

    assignee_name = assignee.get("username") or assignee.get("full_name", "Unknown")

    request = meeting_crud.assign_volunteer(
        db,
        request_id=request_id,
        assigned_to=data.assigned_to,
        assigned_to_name=assignee_name,
        assigned_by=str(user.id),
        meeting_notes=data.meeting_notes or "",
    )

    if not request:
        raise HTTPException(status_code=404, detail="Meeting request not found")

    # Send notification to the assigned interviewer
    from app.utilities.email import send_interview_assigned_email

    assignee_email = assignee.get("email")
    if assignee_email:
        try:
            send_interview_assigned_email(
                email_to=assignee_email,
                interviewer_name=assignee_name,
                member_name=request.user_name,
                interview_type=meeting_deps.get_meeting_type_display_name(
                    request.interview_type
                ),
                timeslot_date=request.timeslot_date,
                timeslot_time=request.timeslot_time,
                duration_minutes=request.duration_minutes,
            )
        except Exception as e:
            print(f"Failed to send assignment email: {e}")

    return {"interview": meeting_deps.parse_meeting_request(request)}


@meeting_router.post(
    "/{request_id}/confirm",
    response_model=Dict[str, meeting_schema.MeetingRequestRead],
)
def confirm_interview(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: meeting_schema.MeetingConfirm,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Confirm a meeting request.
    Lead+ only.
    """
    request = meeting_crud.confirm_meeting(
        db, request_id=request_id, meeting_notes=data.meeting_notes or ""
    )

    if not request:
        raise HTTPException(status_code=404, detail="Meeting request not found")

    # Send confirmation email to the member
    from app.utilities.email import send_interview_confirmed_email

    try:
        send_interview_confirmed_email(
            email_to=request.user_email,
            member_name=request.user_name,
            interview_type=meeting_deps.get_meeting_type_display_name(
                request.interview_type
            ),
            timeslot_date=request.timeslot_date,
            timeslot_time=request.timeslot_time,
            duration_minutes=request.duration_minutes,
            interviewer_name=request.assigned_to_name or "TBD",
            meeting_notes=request.meeting_notes,
            confirmation_message=data.confirmation_message or "",
        )
    except Exception as e:
        print(f"Failed to send confirmation email: {e}")

    return {"interview": meeting_deps.parse_meeting_request(request)}


@meeting_router.post(
    "/{request_id}/complete",
    response_model=Dict[str, meeting_schema.MeetingRequestRead],
)
def complete_interview(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: meeting_schema.MeetingComplete,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Mark a interview as completed with feedback.
    Volunteer+ only. Must be the assigned interviewer or Lead+.
    """
    # Get the request to verify authorization
    existing_request = meeting_crud.read_meeting_request_by_id(
        db, request_id=request_id
    )
    if not existing_request:
        raise HTTPException(status_code=404, detail="Meeting request not found")

    # Verify user is either the assigned interviewer or Lead+
    user_role = get_user_role(user)
    if user_role < 4 and str(existing_request.assigned_to) != str(user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned interviewer or Lead+ can complete this interview",
        )

    request = meeting_crud.complete_meeting(
        db, request_id=request_id, interviewer_feedback=data.interviewer_feedback
    )

    # Send feedback email to the member
    from app.utilities.email import send_interview_completed_email

    try:
        send_interview_completed_email(
            email_to=request.user_email,
            member_name=request.user_name,
            interview_type=meeting_deps.get_meeting_type_display_name(
                request.interview_type
            ),
            interviewer_name=request.assigned_to_name or "Your Interviewer",
            feedback=data.interviewer_feedback,
        )
    except Exception as e:
        print(f"Failed to send completion email: {e}")

    return {"interview": meeting_deps.parse_meeting_request(request)}


@meeting_router.patch(
    "/{request_id}/notes",
    response_model=Dict[str, meeting_schema.MeetingRequestRead],
)
def update_interview_notes(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: meeting_schema.MeetingNotesUpdate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Update meeting notes for a confirmed interview.
    Volunteer+ only. Must be the assigned interviewer or Lead+.
    Sends notification email to the member.
    """
    # Get the request to verify it exists and check authorization
    existing_request = meeting_crud.read_meeting_request_by_id(
        db, request_id=request_id
    )
    if not existing_request:
        raise HTTPException(status_code=404, detail="Meeting request not found")

    # Verify user is either the assigned interviewer or Lead+
    user_role = get_user_role(user)
    if user_role < 4 and str(existing_request.assigned_to) != str(user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned interviewer or Lead+ can update meeting notes",
        )

    request = meeting_crud.update_meeting_notes(
        db, request_id=request_id, meeting_notes=data.meeting_notes
    )

    # Send notification email to the member
    from app.utilities.email import send_meeting_notes_updated_email

    try:
        send_meeting_notes_updated_email(
            email_to=request.user_email,
            member_name=request.user_name,
            interview_type=meeting_deps.get_meeting_type_display_name(
                request.interview_type
            ),
            timeslot_date=request.timeslot_date,
            timeslot_time=request.timeslot_time,
            interviewer_name=request.assigned_to_name or "Your Interviewer",
            meeting_notes=data.meeting_notes,
        )
    except Exception as e:
        print(f"Failed to send notes update email: {e}")

    return {"interview": meeting_deps.parse_meeting_request(request)}


@meeting_router.post(
    "/{request_id}/cancel",
    response_model=Dict[str, meeting_schema.MeetingRequestRead],
)
def cancel_interview(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: meeting_schema.MeetingCancel,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Cancel a meeting request.
    Members can cancel their own pending/confirmed requests.
    Admins can cancel any request.
    Leads cannot cancel requests.
    """
    # Get the request to verify authorization
    existing_request = meeting_crud.read_meeting_request_by_id(
        db, request_id=request_id
    )
    if not existing_request:
        raise HTTPException(status_code=404, detail="Meeting request not found")

    user_role = get_user_role(user)

    # Only Members (their own) and Admins (any) can cancel
    if user_role == 4:  # Lead
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Leads cannot cancel meeting requests. Only the member who created the request or an Admin can cancel.",
        )
    elif user_role == 5:  # Admin - can cancel any request
        pass
    else:  # Member or lower
        if str(existing_request.user_id) != str(user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own meeting requests",
            )
        if existing_request.status not in ["pending", "confirmed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending or confirmed requests can be cancelled",
            )

    request = meeting_crud.cancel_meeting(
        db, request_id=request_id, cancellation_reason=data.cancellation_reason or ""
    )

    # Send cancellation email to member and info@techelevate.org
    from app.utilities.email import send_interview_cancelled_email

    try:
        # Send to member
        send_interview_cancelled_email(
            email_to=request.user_email,
            member_name=request.user_name,
            interview_type=meeting_deps.get_meeting_type_display_name(
                request.interview_type
            ),
            timeslot_date=request.timeslot_date,
            timeslot_time=request.timeslot_time,
            cancellation_reason=data.cancellation_reason or "",
        )
        # Send to info@techelevate.org
        send_interview_cancelled_email(
            email_to="info@techelevate.org",
            member_name=request.user_name,
            interview_type=meeting_deps.get_meeting_type_display_name(
                request.interview_type
            ),
            timeslot_date=request.timeslot_date,
            timeslot_time=request.timeslot_time,
            cancellation_reason=data.cancellation_reason or "",
        )
    except Exception as e:
        print(f"Failed to send cancellation email: {e}")

    return {"interview": meeting_deps.parse_meeting_request(request)}


@meeting_router.delete(
    "/{request_id}",
    response_model=Dict[str, str],
)
def delete_interview_request(
    request_id: str,
    db: Database = Depends(session.get_db),
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_user
    ),
) -> Any:
    """
    Permanently delete an meeting request from the database (Admin only).
    This action cannot be undone. Also makes the associated timeslot available again.
    """
    from app.core.permissions import get_user_role

    # Only Admin (role 5) can delete
    user_role = get_user_role(user)
    if user_role != 5:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can permanently delete meeting requests",
        )

    meeting_crud.delete_meeting_request(db, request_id=request_id)
    return {"message": "Meeting request permanently deleted successfully"}


@meeting_router.post(
    "/bulk-delete",
    response_model=Dict[str, Any],
)
def bulk_delete_interview_requests(
    db: Database = Depends(session.get_db),
    *,
    request_ids: list[str] = Body(..., embed=True),
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_user
    ),
) -> Any:
    """
    Permanently delete multiple meeting requests from the database (Admin only).
    This action cannot be undone. Also makes associated timeslots available again.
    """
    from app.core.permissions import get_user_role

    # Only Admin (role 5) can delete
    user_role = get_user_role(user)
    if user_role != 5:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can permanently delete meeting requests",
        )

    result = meeting_crud.bulk_delete_interview_requests(db, request_ids=request_ids)
    return result


@meeting_router.patch(
    "/{request_id}",
    response_model=Dict[str, meeting_schema.MeetingRequestRead],
)
def update_interview_status(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: meeting_schema.MeetingStatusUpdate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Update interview status.
    Lead+ only.
    """
    request = meeting_crud.update_meeting_status(db, request_id=request_id, data=data)

    if not request:
        raise HTTPException(status_code=404, detail="Meeting request not found")

    return {"interview": meeting_deps.parse_meeting_request(request)}
