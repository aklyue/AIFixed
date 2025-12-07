from fastapi import APIRouter

from src.auth.oauth_github import router as github_router
from src.auth.oauth_google import router as google_router

router = APIRouter()
router.include_router(github_router)
router.include_router(google_router)