"""API router registration."""

from fastapi import APIRouter

from app.routers.health import router as health_router
from app.routers.imports import router as import_router
from app.routers.search import router as search_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(search_router)
api_router.include_router(import_router)
