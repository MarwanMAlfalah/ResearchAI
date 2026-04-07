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
from app.models.ingestion import (
    NormalizedPaper,
    OpenAlexBatchImportItemResult,
    OpenAlexBatchImportRequest,
    OpenAlexBatchImportResponse,
    OpenAlexPaperImportResponse,
    PaperImportResult,
)
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

    neo4j_client = _get_neo4j_client(request)

    settings = get_settings()
    client = OpenAlexClient(
        base_url=settings.openalex_base_url,
        timeout_seconds=settings.openalex_timeout_seconds,
    )

    try:
        return _import_openalex_paper_by_id(
            openalex_id=openalex_id,
            neo4j_client=neo4j_client,
            openalex_client=client,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except OpenAlexNotFoundError as exc:
        normalized_work_id = _best_effort_openalex_id(openalex_id)
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
    except RuntimeError as exc:
        logger.error("Paper import failed after OpenAlex fetch: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Paper import failed",
        ) from exc
    finally:
        client.close()


@router.post(
    "/papers/by-id",
    response_model=OpenAlexBatchImportResponse,
    summary="Batch import papers directly from OpenAlex IDs",
)
def import_papers_by_openalex_id(
    request: Request,
    payload: OpenAlexBatchImportRequest,
) -> OpenAlexBatchImportResponse:
    """Fetch, normalize, and import a batch of OpenAlex papers by ID."""

    if not payload.openalex_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="openalex_ids must contain at least one ID",
        )

    neo4j_client = _get_neo4j_client(request)
    settings = get_settings()
    client = OpenAlexClient(
        base_url=settings.openalex_base_url,
        timeout_seconds=settings.openalex_timeout_seconds,
    )

    results: list[OpenAlexBatchImportItemResult] = []
    imported_count = 0

    try:
        for raw_id in payload.openalex_ids:
            candidate_id = _best_effort_openalex_id(raw_id)

            try:
                imported_response = _import_openalex_paper_by_id(
                    openalex_id=raw_id,
                    neo4j_client=neo4j_client,
                    openalex_client=client,
                )
                results.append(
                    OpenAlexBatchImportItemResult(
                        openalex_id=imported_response.openalex_id,
                        status="imported",
                        imported=imported_response.imported,
                    )
                )
                imported_count += 1
            except ValueError as exc:
                results.append(
                    OpenAlexBatchImportItemResult(
                        openalex_id=candidate_id,
                        status="failed",
                        reason=str(exc),
                    )
                )
            except OpenAlexNotFoundError:
                results.append(
                    OpenAlexBatchImportItemResult(
                        openalex_id=candidate_id,
                        status="failed",
                        reason="Paper not found in OpenAlex",
                    )
                )
            except OpenAlexTimeoutError:
                results.append(
                    OpenAlexBatchImportItemResult(
                        openalex_id=candidate_id,
                        status="failed",
                        reason="OpenAlex request timed out",
                    )
                )
            except OpenAlexAPIError:
                results.append(
                    OpenAlexBatchImportItemResult(
                        openalex_id=candidate_id,
                        status="failed",
                        reason="OpenAlex API failure",
                    )
                )
            except Neo4jClientError:
                results.append(
                    OpenAlexBatchImportItemResult(
                        openalex_id=candidate_id,
                        status="failed",
                        reason="Neo4j write failure",
                    )
                )
            except RuntimeError:
                results.append(
                    OpenAlexBatchImportItemResult(
                        openalex_id=candidate_id,
                        status="failed",
                        reason="Paper import failed",
                    )
                )
            except Exception as exc:  # pragma: no cover - defensive fallback
                logger.exception("Unexpected batch import error", extra={"openalex_id": candidate_id})
                results.append(
                    OpenAlexBatchImportItemResult(
                        openalex_id=candidate_id,
                        status="failed",
                        reason=f"Unexpected error: {exc.__class__.__name__}",
                    )
                )
    finally:
        client.close()

    failed_count = len(results) - imported_count

    return OpenAlexBatchImportResponse(
        total=len(payload.openalex_ids),
        imported=imported_count,
        failed=failed_count,
        results=results,
    )


def _get_neo4j_client(request: Request) -> Neo4jClient:
    """Resolve shared Neo4j client from application state."""

    neo4j_client = getattr(request.app.state, "neo4j", None)
    if not isinstance(neo4j_client, Neo4jClient):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j client is not initialized",
        )
    return neo4j_client


def _import_openalex_paper_by_id(
    openalex_id: str,
    neo4j_client: Neo4jClient,
    openalex_client: OpenAlexClient,
) -> OpenAlexPaperImportResponse:
    """Import one paper by OpenAlex ID using shared fetch and ingestion logic."""

    normalized_work_id = _normalize_openalex_work_id(openalex_id)
    normalized_payload = openalex_client.fetch_paper_by_id(normalized_work_id)
    paper = NormalizedPaper.model_validate(normalized_payload)
    imported = import_normalized_paper(neo4j_client=neo4j_client, paper=paper)

    return OpenAlexPaperImportResponse(
        openalex_id=normalized_work_id,
        imported=imported,
    )


def _normalize_openalex_work_id(openalex_id: str) -> str:
    """Normalize and validate OpenAlex Work ID."""

    raw = openalex_id.strip()
    if not raw:
        raise ValueError("OpenAlex ID must not be empty")

    if raw.startswith(_OPENALEX_PREFIX):
        raw = raw.removeprefix(_OPENALEX_PREFIX)

    raw = raw.upper()

    if not _OPENALEX_WORK_ID_PATTERN.match(raw):
        raise ValueError("Invalid OpenAlex ID format. Expected a Work ID like W1234567890")

    return raw


def _best_effort_openalex_id(openalex_id: str) -> str:
    """Return a cleaned OpenAlex ID candidate for reporting failures."""

    raw = openalex_id.strip() if isinstance(openalex_id, str) else ""
    if raw.startswith(_OPENALEX_PREFIX):
        raw = raw.removeprefix(_OPENALEX_PREFIX)
    return raw.upper() if raw else "<empty>"
