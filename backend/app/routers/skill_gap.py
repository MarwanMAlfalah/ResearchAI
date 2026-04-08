"""Routes for backend-driven skill gap analysis."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, Request, status

from app.core.config import get_settings
from app.db.neo4j import Neo4jClient, Neo4jClientError
from app.models.skill_gap import SkillGapResponse
from app.recommendation.semantic import UserProfileEmbeddingMissingError, UserProfileNotFoundError
from app.services.skill_gap_service import build_skill_gap_analysis

logger = logging.getLogger(__name__)
router = APIRouter(tags=["skill-gap"])


@router.get("/skill-gap", response_model=SkillGapResponse, summary="Get skill gap analysis for a user")
def get_skill_gap(
    request: Request,
    user_id: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=100),
) -> SkillGapResponse:
    """Return deterministic skill-gap analysis using profile and recommendation evidence."""

    neo4j_client = _get_neo4j_client(request)
    settings = get_settings()

    try:
        return build_skill_gap_analysis(
            neo4j_client=neo4j_client,
            user_id=user_id,
            settings=settings,
            limit=limit,
        )
    except UserProfileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except UserProfileEmbeddingMissingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Neo4jClientError as exc:
        logger.error("Neo4j error while computing skill gap analysis: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable",
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


def _get_neo4j_client(request: Request) -> Neo4jClient:
    """Resolve shared Neo4j client from application state."""

    neo4j_client = getattr(request.app.state, "neo4j", None)
    if not isinstance(neo4j_client, Neo4jClient):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j client is not initialized",
        )
    return neo4j_client
