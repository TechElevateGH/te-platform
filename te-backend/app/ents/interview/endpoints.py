"""API endpoints for Interview feature."""

from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pymongo.database import Database
from bson import ObjectId

import app.database.session as session
import app.ents.interview.crud as interview_crud
import app.ents.interview.dependencies as interview_deps
import app.ents.interview.schema as interview_schema
import app.ents.user.dependencies as user_dependencies
import app.ents.user.models as user_models
from app.core.permissions import get_user_role

interview_router = APIRouter(prefix="/interviews", tags=["Interviews"])


# ============== Timeslot Endpoints ==============


@interview_router.get(
    "/timeslots",
    response_model=Dict[str, List[interview_schema.TimeslotRead]],
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
    Get available timeslots for booking interviews.
    Available to all authenticated users.
    """
    timeslots = interview_crud.read_available_timeslots(
        db, skip=skip, limit=limit, date_from=date_from, date_to=date_to
    )
    return {"timeslots": [interview_deps.parse_timeslot(t) for t in timeslots]}


@interview_router.get(
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
    timeslots = interview_crud.read_all_timeslots(
        db, skip=skip, limit=limit, include_past=include_past
    )
    available_count = interview_crud.count_available_timeslots(db)

    return {
        "timeslots": [interview_deps.parse_timeslot(t) for t in timeslots],
        "total": len(timeslots),
        "available_count": available_count,
    }


@interview_router.post(
    "/timeslots",
    response_model=Dict[str, interview_schema.TimeslotRead],
    status_code=status.HTTP_201_CREATED,
)
def create_timeslot(
    db: Database = Depends(session.get_db),
    *,
    data: interview_schema.TimeslotCreate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Create a new timeslot for interviews.
    Volunteer+ only.
    """
    timeslot = interview_crud.create_timeslot(db, data=data, created_by=str(user.id))
    return {"timeslot": interview_deps.parse_timeslot(timeslot)}


@interview_router.post(
    "/timeslots/bulk",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
)
def create_timeslots_bulk(
    db: Database = Depends(session.get_db),
    *,
    data: interview_schema.TimeslotBulkCreate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Create multiple timeslots at once.
    Volunteer+ only.
    """
    timeslots = interview_crud.create_timeslots_bulk(
        db, timeslots=data.timeslots, created_by=str(user.id)
    )
    return {
        "timeslots": [interview_deps.parse_timeslot(t) for t in timeslots],
        "created_count": len(timeslots),
    }


@interview_router.patch(
    "/timeslots/{timeslot_id}",
    response_model=Dict[str, interview_schema.TimeslotRead],
)
def update_timeslot(
    timeslot_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: interview_schema.TimeslotUpdate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Update a timeslot.
    Volunteer+ only.
    """
    timeslot = interview_crud.update_timeslot(db, timeslot_id=timeslot_id, data=data)
    if not timeslot:
        raise HTTPException(status_code=404, detail="Timeslot not found")
    return {"timeslot": interview_deps.parse_timeslot(timeslot)}


@interview_router.delete(
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
    success = interview_crud.delete_timeslot(db, timeslot_id=timeslot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Timeslot not found")
    return {"message": "Timeslot deleted successfully"}


# ============== Interview Request Endpoints ==============


@interview_router.post(
    "",
    response_model=Dict[str, interview_schema.InterviewRequestRead],
    status_code=status.HTTP_201_CREATED,
)
def create_interview_request(
    db: Database = Depends(session.get_db),
    *,
    data: interview_schema.InterviewRequestCreate,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_member_only),
) -> Any:
    """
    Create a new interview request.
    Member only.
    """
    request = interview_crud.create_interview_request(
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
            interview_type=interview_deps.get_interview_type_display_name(
                data.interview_type.value
            ),
            timeslot_date=request.timeslot_date,
            timeslot_time=request.timeslot_time,
            pending_companies=data.pending_companies,
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to send interview request email: {e}")

    return {"interview": interview_deps.parse_interview_request(request)}


@interview_router.get(
    "/my-requests",
    response_model=Dict[str, List[interview_schema.InterviewRequestRead]],
)
def get_my_interview_requests(
    db: Database = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_member_only),
) -> Any:
    """
    Get the current user's interview requests.
    Member only.
    """
    requests = interview_crud.read_user_interview_requests(
        db, user_id=str(user.id), skip=skip, limit=limit
    )
    return {"interviews": [interview_deps.parse_interview_request(r) for r in requests]}


@interview_router.get(
    "/assigned",
    response_model=Dict[str, List[interview_schema.InterviewRequestRead]],
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
    requests = interview_crud.read_assigned_interview_requests(
        db, assigned_to=str(user.id), skip=skip, limit=limit
    )
    return {"interviews": [interview_deps.parse_interview_request(r) for r in requests]}


@interview_router.get(
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
    Get all interview requests.
    Lead+ only.
    """
    requests = interview_crud.read_all_interview_requests(
        db, skip=skip, limit=limit, status=status
    )

    pending_count = interview_crud.count_interview_requests_by_status(
        db, status="pending"
    )
    confirmed_count = interview_crud.count_interview_requests_by_status(
        db, status="confirmed"
    )

    return {
        "interviews": [interview_deps.parse_interview_request(r) for r in requests],
        "total": len(requests),
        "pending_count": pending_count,
        "confirmed_count": confirmed_count,
    }


@interview_router.get(
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
    Get list of available interviewers (Volunteer+ users).
    Lead+ only.
    """
    # Get privileged users with role >= 3 (Volunteer, Lead, Admin)
    interviewers = db.privileged_users.find({"role": {"$gte": 3}, "is_active": True})

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


@interview_router.get(
    "/{request_id}",
    response_model=Dict[str, interview_schema.InterviewRequestRead],
)
def get_interview_request(
    request_id: str,
    db: Database = Depends(session.get_db),
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Get a specific interview request.
    Members can only view their own requests.
    Volunteer+ can view any request.
    """
    request = interview_crud.read_interview_request_by_id(db, request_id=request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Interview request not found")

    # Check authorization
    user_role = get_user_role(user)
    if user_role < 3 and str(request.user_id) != str(user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this interview request",
        )

    return {"interview": interview_deps.parse_interview_request(request)}


@interview_router.post(
    "/{request_id}/assign",
    response_model=Dict[str, interview_schema.InterviewRequestRead],
)
def assign_interviewer(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: interview_schema.InterviewAssign,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Assign an interviewer to a interview request.
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

    request = interview_crud.assign_interviewer(
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
    from app.utilities.email import send_interview_assigned_email

    assignee_email = assignee.get("email")
    if assignee_email:
        try:
            send_interview_assigned_email(
                email_to=assignee_email,
                interviewer_name=assignee_name,
                member_name=request.user_name,
                interview_type=interview_deps.get_interview_type_display_name(
                    request.interview_type
                ),
                timeslot_date=request.timeslot_date,
                timeslot_time=request.timeslot_time,
                duration_minutes=request.duration_minutes,
            )
        except Exception as e:
            print(f"Failed to send assignment email: {e}")

    return {"interview": interview_deps.parse_interview_request(request)}


@interview_router.post(
    "/{request_id}/confirm",
    response_model=Dict[str, interview_schema.InterviewRequestRead],
)
def confirm_interview(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: interview_schema.InterviewConfirm,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Confirm a interview request.
    Lead+ only.
    """
    request = interview_crud.confirm_interview(
        db, request_id=request_id, meeting_link=data.meeting_link or ""
    )

    if not request:
        raise HTTPException(status_code=404, detail="Interview request not found")

    # Send confirmation email to the member
    from app.utilities.email import send_interview_confirmed_email

    try:
        send_interview_confirmed_email(
            email_to=request.user_email,
            member_name=request.user_name,
            interview_type=interview_deps.get_interview_type_display_name(
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

    return {"interview": interview_deps.parse_interview_request(request)}


@interview_router.post(
    "/{request_id}/complete",
    response_model=Dict[str, interview_schema.InterviewRequestRead],
)
def complete_interview(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: interview_schema.InterviewComplete,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_volunteer_or_above
    ),
) -> Any:
    """
    Mark a interview as completed with feedback.
    Volunteer+ only. Must be the assigned interviewer or Lead+.
    """
    # Get the request to verify authorization
    existing_request = interview_crud.read_interview_request_by_id(
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

    request = interview_crud.complete_interview(
        db, request_id=request_id, interviewer_feedback=data.interviewer_feedback
    )

    # Send feedback email to the member
    from app.utilities.email import send_interview_completed_email

    try:
        send_interview_completed_email(
            email_to=request.user_email,
            member_name=request.user_name,
            interview_type=interview_deps.get_interview_type_display_name(
                request.interview_type
            ),
            interviewer_name=request.assigned_to_name or "Your Interviewer",
            feedback=data.interviewer_feedback,
        )
    except Exception as e:
        print(f"Failed to send completion email: {e}")

    return {"interview": interview_deps.parse_interview_request(request)}


@interview_router.post(
    "/{request_id}/cancel",
    response_model=Dict[str, interview_schema.InterviewRequestRead],
)
def cancel_interview(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: interview_schema.InterviewCancel,
    user: user_models.MemberUser = Depends(user_dependencies.get_current_user),
) -> Any:
    """
    Cancel a interview request.
    Members can cancel their own pending requests.
    Lead+ can cancel any request.
    """
    # Get the request to verify authorization
    existing_request = interview_crud.read_interview_request_by_id(
        db, request_id=request_id
    )
    if not existing_request:
        raise HTTPException(status_code=404, detail="Interview request not found")

    user_role = get_user_role(user)

    # Members can cancel their own pending or confirmed requests
    if user_role < 4:
        if str(existing_request.user_id) != str(user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own interview requests",
            )
        if existing_request.status not in ["pending", "confirmed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending or confirmed requests can be cancelled",
            )

    request = interview_crud.cancel_interview(
        db, request_id=request_id, cancellation_reason=data.cancellation_reason or ""
    )

    # Send cancellation email to member and info@techelevate.org
    from app.utilities.email import send_interview_cancelled_email

    try:
        # Send to member
        send_interview_cancelled_email(
            email_to=request.user_email,
            member_name=request.user_name,
            interview_type=interview_deps.get_interview_type_display_name(
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
            interview_type=interview_deps.get_interview_type_display_name(
                request.interview_type
            ),
            timeslot_date=request.timeslot_date,
            timeslot_time=request.timeslot_time,
            cancellation_reason=data.cancellation_reason or "",
        )
    except Exception as e:
        print(f"Failed to send cancellation email: {e}")

    return {"interview": interview_deps.parse_interview_request(request)}


@interview_router.delete(
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
    Permanently delete an interview request from the database (Admin only).
    This action cannot be undone. Also makes the associated timeslot available again.
    """
    from app.core.permissions import get_user_role

    # Only Admin (role 5) can delete
    user_role = get_user_role(user)
    if user_role != 5:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can permanently delete interview requests",
        )

    interview_crud.delete_interview_request(db, request_id=request_id)
    return {"message": "Interview request permanently deleted successfully"}


@interview_router.post(
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
    Permanently delete multiple interview requests from the database (Admin only).
    This action cannot be undone. Also makes associated timeslots available again.
    """
    from app.core.permissions import get_user_role

    # Only Admin (role 5) can delete
    user_role = get_user_role(user)
    if user_role != 5:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can permanently delete interview requests",
        )

    result = interview_crud.bulk_delete_interview_requests(db, request_ids=request_ids)
    return result


@interview_router.patch(
    "/{request_id}",
    response_model=Dict[str, interview_schema.InterviewRequestRead],
)
def update_interview_status(
    request_id: str,
    db: Database = Depends(session.get_db),
    *,
    data: interview_schema.InterviewStatusUpdate,
    user: Union[user_models.MemberUser, user_models.PrivilegedUser] = Depends(
        user_dependencies.get_current_lead
    ),
) -> Any:
    """
    Update interview status.
    Lead+ only.
    """
    request = interview_crud.update_interview_status(
        db, request_id=request_id, data=data
    )

    if not request:
        raise HTTPException(status_code=404, detail="Interview request not found")

    return {"interview": interview_deps.parse_interview_request(request)}
