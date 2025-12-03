"""
Background tasks for scheduled operations like email reminders.
"""

import logging
from datetime import datetime, timedelta

from app.core.settings import settings
from app.database.session import mongodb
from app.ents.meeting.models import MeetingRequest
from app.ents.user.models import PrivilegedUser
from app.utilities.email import send_meeting_reminder_email
from bson import ObjectId

logger = logging.getLogger(__name__)


async def send_meeting_reminders():
    """
    Send reminder emails 30 minutes before confirmed meetings.

    This task should be called periodically (e.g., every 5 minutes) to check
    for upcoming meetings and send reminder emails to:
    1. The assigned volunteer+ (if they have an email)
    2. info@techelevate.org
    """
    try:
        db = mongodb

        # Calculate the target time window (meetings happening 25-35 minutes from now)
        # This gives us a 10-minute window to catch meetings even if the task runs slightly off schedule
        now = datetime.utcnow()
        reminder_time_start = now + timedelta(minutes=25)
        reminder_time_end = now + timedelta(minutes=35)

        logger.info(
            f"Checking for meetings between {reminder_time_start} and {reminder_time_end}"
        )

        # Query confirmed meetings that haven't had reminders sent yet
        # We'll add a reminder_sent field to track this
        meetings = db.meeting_requests.find(
            {
                "status": "confirmed",
                "$or": [
                    {"reminder_sent": {"$exists": False}},
                    {"reminder_sent": False},
                ],
            }
        )

        reminders_sent = 0

        for meeting_data in meetings:
            try:
                meeting = MeetingRequest(**meeting_data)

                # Parse the meeting datetime
                # timeslot_date is YYYY-MM-DD, timeslot_time is HH:MM
                meeting_datetime_str = (
                    f"{meeting.timeslot_date} {meeting.timeslot_time}"
                )
                meeting_datetime = datetime.strptime(
                    meeting_datetime_str, "%Y-%m-%d %H:%M"
                )

                # Check if this meeting is in our reminder window
                if reminder_time_start <= meeting_datetime <= reminder_time_end:
                    logger.info(
                        f"Sending reminder for meeting {meeting.id} at {meeting_datetime}"
                    )

                    # Get the assigned volunteer+ user
                    volunteer = None
                    if meeting.assigned_to:
                        volunteer_data = db.privileged_users.find_one(
                            {"_id": meeting.assigned_to}
                        )
                        if volunteer_data:
                            volunteer = PrivilegedUser(**volunteer_data)

                    # Send to volunteer+ if they have an email
                    if volunteer and volunteer.email:
                        try:
                            send_meeting_reminder_email(
                                email_to=volunteer.email,
                                recipient_name=meeting.assigned_to_name or "Volunteer",
                                member_name=meeting.user_name,
                                interview_type=meeting.interview_type,
                                timeslot_date=meeting.timeslot_date,
                                timeslot_time=meeting.timeslot_time,
                                duration_minutes=meeting.duration_minutes,
                                meeting_notes=meeting.meeting_notes or "",
                            )
                            logger.info(f"Sent reminder to volunteer {volunteer.email}")
                        except Exception as e:
                            logger.error(
                                f"Failed to send reminder to volunteer {volunteer.email}: {e}"
                            )

                    # Always send to info@techelevate.org
                    try:
                        send_meeting_reminder_email(
                            email_to="info@techelevate.org",
                            recipient_name="TechElevate Team",
                            member_name=meeting.user_name,
                            interview_type=meeting.interview_type,
                            timeslot_date=meeting.timeslot_date,
                            timeslot_time=meeting.timeslot_time,
                            duration_minutes=meeting.duration_minutes,
                            meeting_notes=meeting.meeting_notes or "",
                        )
                        logger.info("Sent reminder to info@techelevate.org")
                    except Exception as e:
                        logger.error(
                            f"Failed to send reminder to info@techelevate.org: {e}"
                        )

                    # Mark reminder as sent
                    db.meeting_requests.update_one(
                        {"_id": meeting.id},
                        {"$set": {"reminder_sent": True, "reminder_sent_at": now}},
                    )

                    reminders_sent += 1

            except Exception as e:
                logger.error(f"Error processing meeting {meeting_data.get('_id')}: {e}")
                continue

        logger.info(
            f"Meeting reminder task completed. Sent {reminders_sent} reminders."
        )

    except Exception as e:
        logger.error(f"Error in send_meeting_reminders task: {e}")
