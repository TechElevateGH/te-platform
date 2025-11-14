from app.ents.application.endpoints import (
    applications_router,
    user_applications_router,
)
from app.ents.referral.endpoints import referral_router
from app.ents.home.endpoints import home_router
from app.ents.documentation.endpoints import documentation_router
from app.ents.learning.endpoints import router as learning_router
from app.ents.problem.endpoints import router as problem_router
from app.ents.user.auth import auth_router
from app.ents.user.endpoints import router as users_router
from app.ents.resume import (
    resume_reviews_router,
    resumes_router,
    user_resumes_router,
)
from app.ents.verification.endpoints import router as verification_router
from fastapi import APIRouter

api_router = APIRouter()

# Public endpoints
api_router.include_router(home_router, tags=["Home"])
api_router.include_router(documentation_router)

# Authentication
api_router.include_router(auth_router, prefix="/auth")  # Has its own tags

# Email Verification
api_router.include_router(verification_router)  # Has its own tags

# User management
api_router.include_router(users_router)  # Tags: Users

# Applications & Resumes (embedded in user documents)
api_router.include_router(
    user_applications_router
)  # Has its own tags from router definition
api_router.include_router(applications_router)  # Admin/Lead endpoints
api_router.include_router(
    user_resumes_router
)  # Has its own tags from router definition
api_router.include_router(resumes_router)

# Referral management
api_router.include_router(referral_router, tags=["Referrals"])

# Resume review management
api_router.include_router(resume_reviews_router)

# Learning and practice
api_router.include_router(learning_router, tags=["Learning"])
api_router.include_router(problem_router, tags=["Problems"])
