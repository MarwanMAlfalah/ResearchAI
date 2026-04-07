"""FastAPI application entrypoint for ResearchGraph AI backend."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.utils.logging import configure_logging

settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger(__name__)


app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["root"], summary="Root")
def root() -> dict[str, str]:
    """Return basic API metadata."""

    return {"service": settings.app_name, "status": "running"}


@app.on_event("startup")
def on_startup() -> None:
    """Log startup event."""

    logger.info("API startup complete", extra={"environment": settings.environment})
