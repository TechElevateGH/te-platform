from datetime import date
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
