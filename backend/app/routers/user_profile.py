"""Routes for creating, updating, and retrieving user profiles."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request, status

from app.db.neo4j import Neo4jClient, Neo4jClientError
from app.models.user_profile import UserProfileResponse, UserProfileUpsertRequest
from app.services.user_profile_service import get_user_profile, upsert_user_profile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/user", tags=["user"])


@router.post("/profile", response_model=UserProfileResponse, summary="Create or update user profile")
def save_user_profile(request: Request, payload: UserProfileUpsertRequest) -> UserProfileResponse:
    """Create or update a user profile and its linked skills."""

    neo4j_client = _get_neo4j_client(request)

    try:
        return upsert_user_profile(neo4j_client=neo4j_client, payload=payload)
    except Neo4jClientError as exc:
        logger.error("Neo4j error while saving user profile: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable",
        ) from exc
    except RuntimeError as exc:
        logger.error("Unexpected user profile save failure: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save user profile",
        ) from exc


@router.get("/profile/{id}", response_model=UserProfileResponse, summary="Get user profile")
def read_user_profile(request: Request, id: str) -> UserProfileResponse:
    """Return a user profile with linked skills."""

    neo4j_client = _get_neo4j_client(request)

    try:
        profile = get_user_profile(neo4j_client=neo4j_client, user_id=id)
    except Neo4jClientError as exc:
        logger.error("Neo4j error while fetching user profile: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable",
        ) from exc

    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User profile not found: {id}",
        )

    return profile


def _get_neo4j_client(request: Request) -> Neo4jClient:
    """Resolve shared Neo4j client from application state."""

    neo4j_client = getattr(request.app.state, "neo4j", None)
    if not isinstance(neo4j_client, Neo4jClient):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j client is not initialized",
        )
    return neo4j_client
