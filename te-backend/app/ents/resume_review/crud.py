from datetime import date, datetime
from bson import ObjectId
from pymongo.database import Database
from fastapi import HTTPException, status
import app.ents.resumereview.models as review_models
import app.ents.resumereview.schema as review_schema


def create_review_request(
    db: Database,
    *,
    user_id: str,
    user_name: str,
    user_email: str,
    data: review_schema.ResumeReviewCreate,
) -> review_models.ResumeReview:
    """Create a new resume review request"""
    review_data = {
        "user_id": ObjectId(user_id),
        "user_name": user_name,
        "user_email": user_email,
        "resume_link": data.resume_link,
        "job_title": data.job_title,
        "level": data.level,
        "status": "Pending",
        "submitted_date": date.today().strftime("%Y-%m-%d"),
        "reviewed_by": None,
        "reviewer_name": None,
        "assigned_date": None,
        "review_date": None,
        "feedback": "",
        "notes": data.notes,
    }

    result = db.resume_reviews.insert_one(review_data)
    created_review = db.resume_reviews.find_one({"_id": result.inserted_id})
    return review_models.ResumeReview(**created_review)


def read_all_review_requests(db: Database) -> list[dict]:
    """Read all resume review requests (for Volunteers and above)"""
    reviews_data = db.resume_reviews.find({}).sort("submitted_date", -1)
    result = []
    for review in reviews_data:
        result.append(
            {
                "id": str(review["_id"]),
                "_id": str(review["_id"]),
                "user_id": str(review["user_id"]),
                "user_name": review.get("user_name"),
                "user_email": review.get("user_email"),
                "resume_link": review.get("resume_link"),
                "job_title": review.get("job_title"),
                "level": review.get("level"),
                "status": review.get("status"),
                "submitted_date": review.get("submitted_date"),
                "reviewed_by": str(review["reviewed_by"])
                if review.get("reviewed_by")
                else None,
                "reviewer_name": review.get("reviewer_name"),
                "assigned_date": review.get("assigned_date"),
                "review_date": review.get("review_date"),
                "feedback": review.get("feedback", ""),
                "notes": review.get("notes", ""),
                "updated_at": review.get("updated_at"),
            }
        )
    return result


def read_user_review_requests(db: Database, *, user_id: str) -> list[dict]:
    """Read resume review requests for a specific user"""
    reviews_data = db.resume_reviews.find({"user_id": ObjectId(user_id)}).sort(
        "submitted_date", -1
    )
    result = []
    for review in reviews_data:
        result.append(
            {
                "id": str(review["_id"]),
                "_id": str(review["_id"]),
                "user_id": str(review["user_id"]),
                "user_name": review.get("user_name"),
                "user_email": review.get("user_email"),
                "resume_link": review.get("resume_link"),
                "job_title": review.get("job_title"),
                "level": review.get("level"),
                "status": review.get("status"),
                "submitted_date": review.get("submitted_date"),
                "reviewed_by": str(review["reviewed_by"])
                if review.get("reviewed_by")
                else None,
                "reviewer_name": review.get("reviewer_name"),
                "assigned_date": review.get("assigned_date"),
                "review_date": review.get("review_date"),
                "feedback": review.get("feedback", ""),
                "notes": review.get("notes", ""),
                "updated_at": review.get("updated_at"),
            }
        )
    return result


def update_review_request(
    db: Database,
    *,
    review_id: str,
    reviewer_id: str,
    reviewer_name: str,
    data: review_schema.ResumeReviewUpdate,
) -> dict:
    """Update a resume review request"""
    update_data = {}

    # Always set updated_at when any update happens
    update_data["updated_at"] = datetime.utcnow().isoformat()

    if data.status is not None:
        update_data["status"] = data.status
        if data.status in ["In Review", "Completed"]:
            update_data["reviewed_by"] = ObjectId(reviewer_id)
            update_data["reviewer_name"] = reviewer_name
            # Set assigned_date when status changes to "In Review" for the first time
            if data.status == "In Review":
                # Only set assigned_date if not already set
                existing_review = db.resume_reviews.find_one(
                    {"_id": ObjectId(review_id)}
                )
                if not existing_review.get("assigned_date"):
                    update_data["assigned_date"] = date.today().strftime("%Y-%m-%d")
            if data.status == "Completed":
                update_data["review_date"] = date.today().strftime("%Y-%m-%d")

    if data.feedback is not None:
        update_data["feedback"] = data.feedback

    if data.notes is not None:
        update_data["notes"] = data.notes

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update"
        )

    result = db.resume_reviews.update_one(
        {"_id": ObjectId(review_id)}, {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume review request not found",
        )

    updated_review = db.resume_reviews.find_one({"_id": ObjectId(review_id)})
    return {
        "id": str(updated_review["_id"]),
        "_id": str(updated_review["_id"]),
        "user_id": str(updated_review["user_id"]),
        "user_name": updated_review.get("user_name"),
        "user_email": updated_review.get("user_email"),
        "resume_link": updated_review.get("resume_link"),
        "job_title": updated_review.get("job_title"),
        "level": updated_review.get("level"),
        "status": updated_review.get("status"),
        "submitted_date": updated_review.get("submitted_date"),
        "reviewed_by": str(updated_review["reviewed_by"])
        if updated_review.get("reviewed_by")
        else None,
        "reviewer_name": updated_review.get("reviewer_name"),
        "assigned_date": updated_review.get("assigned_date"),
        "review_date": updated_review.get("review_date"),
        "feedback": updated_review.get("feedback", ""),
        "notes": updated_review.get("notes", ""),
        "updated_at": updated_review.get("updated_at"),
    }


def delete_review_request(db: Database, *, review_id: str) -> bool:
    """Delete a resume review request"""
    result = db.resume_reviews.delete_one({"_id": ObjectId(review_id)})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume review request not found",
        )
    return True


def get_review_by_id(db: Database, *, review_id: str) -> review_models.ResumeReview:
    """Get a single resume review by ID"""
    review_data = db.resume_reviews.find_one({"_id": ObjectId(review_id)})
    if not review_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume review request not found",
        )
    return review_models.ResumeReview(**review_data)


def assign_review_to_reviewer(
    db: Database,
    *,
    review_id: str,
    reviewer_id: str,
    reviewer_name: str,
) -> dict:
    """Assign a resume review to a specific reviewer"""
    # Check if review exists
    review = db.resume_reviews.find_one({"_id": ObjectId(review_id)})
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume review request not found",
        )

    # Prepare assignment data
    assignment_data = {
        "reviewed_by": ObjectId(reviewer_id),
        "reviewer_name": reviewer_name,
        "assigned_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "In Review",  # Automatically set status to In Review when assigned
        "updated_at": datetime.utcnow().isoformat(),
    }

    # Update the review
    result = db.resume_reviews.update_one(
        {"_id": ObjectId(review_id)}, {"$set": assignment_data}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume review request not found",
        )

    # Return updated review
    updated_review = db.resume_reviews.find_one({"_id": ObjectId(review_id)})
    return {
        "id": str(updated_review["_id"]),
        "_id": str(updated_review["_id"]),
        "user_id": str(updated_review["user_id"]),
        "user_name": updated_review.get("user_name"),
        "user_email": updated_review.get("user_email"),
        "resume_link": updated_review.get("resume_link"),
        "job_title": updated_review.get("job_title"),
        "level": updated_review.get("level"),
        "status": updated_review.get("status"),
        "submitted_date": updated_review.get("submitted_date"),
        "reviewed_by": str(updated_review["reviewed_by"])
        if updated_review.get("reviewed_by")
        else None,
        "reviewer_name": updated_review.get("reviewer_name"),
        "assigned_date": updated_review.get("assigned_date"),
        "review_date": updated_review.get("review_date"),
        "feedback": updated_review.get("feedback", ""),
        "notes": updated_review.get("notes", ""),
        "updated_at": updated_review.get("updated_at"),
    }


def bulk_assign_reviews_to_reviewer(
    db: Database,
    *,
    review_ids: list[str],
    reviewer_id: str,
    reviewer_name: str,
) -> dict:
    """Bulk assign multiple resume reviews to a specific reviewer"""
    # Convert review IDs to ObjectId
    object_ids = [ObjectId(rid) for rid in review_ids]

    # Prepare assignment data
    assignment_data = {
        "reviewed_by": ObjectId(reviewer_id),
        "reviewer_name": reviewer_name,
        "assigned_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "status": "In Review",  # Automatically set status to In Review when assigned
        "updated_at": datetime.utcnow().isoformat(),
    }

    # Bulk update
    result = db.resume_reviews.update_many(
        {"_id": {"$in": object_ids}}, {"$set": assignment_data}
    )

    return {
        "message": f"Successfully assigned {result.modified_count} resume review(s)",
        "assigned_count": result.modified_count,
        "total_requested": len(review_ids),
    }


def get_reviews_assigned_to_user(db: Database, *, user_id: str) -> list[dict]:
    """Get all resume reviews assigned to a specific user"""
    reviews_data = db.resume_reviews.find({"reviewed_by": ObjectId(user_id)})
    result = []
    for review in reviews_data:
        result.append(
            {
                "id": str(review["_id"]),
                "user_id": str(review.get("user_id")),
                "user_name": review.get("user_name"),
                "user_email": review.get("user_email"),
                "resume_link": review.get("resume_link"),
                "job_title": review.get("job_title"),
                "level": review.get("level"),
                "notes": review.get("notes"),
                "status": review.get("status"),
                "feedback": review.get("feedback"),
                "submitted_date": review.get("submitted_date"),
                "reviewed_by": str(review.get("reviewed_by"))
                if review.get("reviewed_by")
                else None,
                "reviewer_name": review.get("reviewer_name"),
                "assigned_date": review.get("assigned_date"),
            }
        )
    return result


def get_all_assigned_reviews(db: Database) -> list[dict]:
    """Get all resume reviews that have been assigned (Admin only)"""
    # Find all reviews where reviewed_by is not null
    reviews_data = db.resume_reviews.find({"reviewed_by": {"$ne": None}})
    result = []
    for review in reviews_data:
        result.append(
            {
                "id": str(review["_id"]),
                "user_id": str(review.get("user_id")),
                "user_name": review.get("user_name"),
                "user_email": review.get("user_email"),
                "resume_link": review.get("resume_link"),
                "job_title": review.get("job_title"),
                "level": review.get("level"),
                "status": review.get("status"),
                "feedback": review.get("feedback"),
                "submitted_date": review.get("submitted_date"),
                "reviewed_by": str(review.get("reviewed_by")),
                "reviewer_name": review.get("reviewer_name"),
                "assigned_date": review.get("assigned_date"),
            }
        )
    return result
