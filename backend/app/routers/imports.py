"""Import routes for writing normalized data into the graph."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request, status

from app.db.neo4j import Neo4jClient, Neo4jClientError
from app.models.ingestion import NormalizedPaper, PaperImportResult
from app.services.ingestion_service import import_normalized_paper

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/import", tags=["import"])


@router.post("/paper", response_model=PaperImportResult, summary="Import one normalized paper")
def import_paper(request: Request, payload: NormalizedPaper) -> PaperImportResult:
    """Import one normalized paper payload into Neo4j."""

    neo4j_client = getattr(request.app.state, "neo4j", None)
    if not isinstance(neo4j_client, Neo4jClient):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j client is not initialized",
        )

    try:
        return import_normalized_paper(neo4j_client=neo4j_client, paper=payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Neo4jClientError as exc:
        logger.error("Neo4j error while importing paper: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable",
        ) from exc
    except RuntimeError as exc:
        logger.error("Import operation failed unexpectedly: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Paper import failed",
        ) from exc
