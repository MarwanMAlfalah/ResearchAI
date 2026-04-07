"""Import routes for writing normalized data into the graph."""

from __future__ import annotations

import logging
import re

from fastapi import APIRouter, HTTPException, Request, status

from app.core.config import get_settings
from app.data_ingestion.openalex_client import (
    OpenAlexAPIError,
    OpenAlexClient,
    OpenAlexNotFoundError,
    OpenAlexTimeoutError,
)
from app.db.neo4j import Neo4jClient, Neo4jClientError
from app.models.ingestion import NormalizedPaper, OpenAlexPaperImportResponse, PaperImportResult
from app.services.ingestion_service import import_normalized_paper

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/import", tags=["import"])

_OPENALEX_PREFIX = "https://openalex.org/"
_OPENALEX_WORK_ID_PATTERN = re.compile(r"^W\d+$")


@router.post("/paper", response_model=PaperImportResult, summary="Import one normalized paper")
def import_paper(request: Request, payload: NormalizedPaper) -> PaperImportResult:
    """Import one normalized paper payload into Neo4j."""

    neo4j_client = _get_neo4j_client(request)

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


@router.post(
    "/paper/{openalex_id:path}",
    response_model=OpenAlexPaperImportResponse,
    summary="Import one paper directly from OpenAlex by ID",
)
def import_paper_by_openalex_id(request: Request, openalex_id: str) -> OpenAlexPaperImportResponse:
    """Fetch, normalize, and import one OpenAlex paper by ID."""

    normalized_work_id = _validate_openalex_work_id(openalex_id)
    neo4j_client = _get_neo4j_client(request)

    settings = get_settings()
    client = OpenAlexClient(
        base_url=settings.openalex_base_url,
        timeout_seconds=settings.openalex_timeout_seconds,
    )

    try:
        normalized_payload = client.fetch_paper_by_id(normalized_work_id)
        paper = NormalizedPaper.model_validate(normalized_payload)
        imported = import_normalized_paper(neo4j_client=neo4j_client, paper=paper)

        return OpenAlexPaperImportResponse(
            openalex_id=normalized_work_id,
            imported=imported,
        )
    except OpenAlexNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"OpenAlex paper not found: {normalized_work_id}",
        ) from exc
    except OpenAlexTimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="OpenAlex request timed out",
        ) from exc
    except OpenAlexAPIError as exc:
        logger.error("OpenAlex API failure during import: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to fetch paper from OpenAlex",
        ) from exc
    except Neo4jClientError as exc:
        logger.error("Neo4j write failure during OpenAlex import: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable",
        ) from exc
    except (RuntimeError, ValueError) as exc:
        logger.error("Paper import failed after OpenAlex fetch: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Paper import failed",
        ) from exc
    finally:
        client.close()


def _get_neo4j_client(request: Request) -> Neo4jClient:
    """Resolve shared Neo4j client from application state."""

    neo4j_client = getattr(request.app.state, "neo4j", None)
    if not isinstance(neo4j_client, Neo4jClient):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j client is not initialized",
        )
    return neo4j_client


def _validate_openalex_work_id(openalex_id: str) -> str:
    """Validate and normalize OpenAlex Work ID for path imports."""

    raw = openalex_id.strip()
    if not raw:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="OpenAlex ID must not be empty",
        )

    if raw.startswith(_OPENALEX_PREFIX):
        raw = raw.removeprefix(_OPENALEX_PREFIX)

    raw = raw.upper()

    if not _OPENALEX_WORK_ID_PATTERN.match(raw):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid OpenAlex ID format. Expected a Work ID like W1234567890",
        )

    return raw
