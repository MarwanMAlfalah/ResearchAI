"""Routes for deterministic advisor chat responses."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import get_settings
from app.db.neo4j import Neo4jClient, Neo4jClientError
from app.models.advisor import AdvisorChatRequest, AdvisorChatResponse
from app.recommendation.semantic import UserProfileEmbeddingMissingError, UserProfileNotFoundError
from app.services.advisor_service import generate_advisor_chat_response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/advisor", tags=["advisor"])


@router.post("/chat", response_model=AdvisorChatResponse, summary="Advisor chat based on graph context")
def advisor_chat(request: Request, payload: AdvisorChatRequest) -> AdvisorChatResponse:
    """Return a deterministic advisor response using existing backend context."""

    neo4j_client = _get_neo4j_client(request)
    settings = get_settings()

    try:
        return generate_advisor_chat_response(
            neo4j_client=neo4j_client,
            settings=settings,
            user_id=payload.user_id,
            message=payload.message,
        )
    except UserProfileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except UserProfileEmbeddingMissingError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Neo4jClientError as exc:
        logger.error("Neo4j error while generating advisor response: %s", exc)
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
