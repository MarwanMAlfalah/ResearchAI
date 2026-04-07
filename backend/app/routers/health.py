"""Health and dependency check router."""

import logging

from fastapi import APIRouter, HTTPException, Request, status

from app.db.neo4j import Neo4jClientError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", summary="Health check")
def health_check() -> dict[str, str]:
    """Return service health status."""

    return {"status": "ok"}


@router.get("/neo4j", summary="Neo4j connectivity check")
def neo4j_health_check(request: Request) -> dict[str, str]:
    """Validate Neo4j connectivity via the shared application client."""

    neo4j_client = getattr(request.app.state, "neo4j", None)
    if neo4j_client is None:
        logger.error("Neo4j client not found in application state")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j client is not initialized",
        )

    try:
        neo4j_client.verify_connectivity()
        return {"status": "ok", "neo4j": "connected"}
    except Neo4jClientError as exc:
        logger.error("Neo4j connectivity endpoint failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable",
        ) from exc
