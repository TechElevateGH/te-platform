from app.ents.application.endpoints import (
    apps_router,
    user_apps_router,
    resumes_router,
)
from app.ents.referral_company.endpoints import referral_company_router, referral_router
from app.ents.home.endpoints import home_router
from app.ents.learning.endpoints import router as learning_router
from app.ents.problem.endpoints import router as problem_router
from app.ents.user.auth import router as auth_router
from app.ents.user.endpoints import router as user_router
from app.ents.resumereview.endpoints import router as resume_review_router
from fastapi import APIRouter

api_router = APIRouter()

# Public endpoints
api_router.include_router(home_router, tags=["Home"])

# Authentication endpoints - professional /auth/* structure
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# User management endpoints
api_router.include_router(user_router, tags=["Users"])

# Application management
api_router.include_router(apps_router, tags=["Applications"])
api_router.include_router(resumes_router, tags=["Resumes"])
api_router.include_router(user_apps_router, tags=["User Applications"])

# Company and referral management
api_router.include_router(referral_company_router, tags=["Referral Companies"])
api_router.include_router(referral_router, tags=["Referrals"])

# Resume review management
api_router.include_router(
    resume_review_router, prefix="/resume-reviews", tags=["Resume Reviews"]
)

# Learning and practice
api_router.include_router(learning_router, tags=["Learning"])
api_router.include_router(problem_router, tags=["Problems"])
