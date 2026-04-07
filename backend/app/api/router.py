"""API router registration."""

from fastapi import APIRouter

from app.routers.health import router as health_router
from app.routers.imports import router as import_router
from app.routers.recommend import router as recommend_router
from app.routers.search import router as search_router
from app.routers.user_profile import router as user_profile_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(search_router)
api_router.include_router(import_router)
api_router.include_router(user_profile_router)
api_router.include_router(recommend_router)
