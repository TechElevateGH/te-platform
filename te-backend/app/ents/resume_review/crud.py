"""Compatibility wrapper for legacy resume_review imports."""

from app.ents.resume import crud as _resume_crud
from app.ents.resume import models as resume_models
from app.ents.resume import schema as resume_schema

create_review_request = _resume_crud.create_review_request
read_all_review_requests = _resume_crud.read_all_review_requests
read_user_review_requests = _resume_crud.read_user_review_requests
update_review_request = _resume_crud.update_review_request
delete_review_request = _resume_crud.delete_review_request
get_review_by_id = _resume_crud.get_review_by_id
assign_review_to_reviewer = _resume_crud.assign_review_to_reviewer
bulk_assign_reviews_to_reviewer = _resume_crud.bulk_assign_reviews_to_reviewer
get_reviews_assigned_to_user = _resume_crud.get_reviews_assigned_to_user
get_all_assigned_reviews = _resume_crud.get_all_assigned_reviews

ResumeReview = resume_models.ResumeReview
ResumeReviewCreate = resume_schema.ResumeReviewCreate
ResumeReviewUpdate = resume_schema.ResumeReviewUpdate
ResumeReviewAssign = resume_schema.ResumeReviewAssign
BulkResumeReviewAssign = resume_schema.BulkResumeReviewAssign
ResumeReviewRead = resume_schema.ResumeReviewRead

__all__ = [
    "ResumeReview",
    "ResumeReviewCreate",
    "ResumeReviewUpdate",
    "ResumeReviewAssign",
    "BulkResumeReviewAssign",
    "ResumeReviewRead",
    "create_review_request",
    "read_all_review_requests",
    "read_user_review_requests",
    "update_review_request",
    "delete_review_request",
    "get_review_by_id",
    "assign_review_to_reviewer",
    "bulk_assign_reviews_to_reviewer",
    "get_reviews_assigned_to_user",
    "get_all_assigned_reviews",
]
