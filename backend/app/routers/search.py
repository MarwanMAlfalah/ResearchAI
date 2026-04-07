"""Search routes for external paper discovery."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status

from app.core.config import get_settings
from app.data_ingestion.openalex_client import (
    OpenAlexAPIError,
    OpenAlexClient,
    OpenAlexTimeoutError,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["search"])


@router.get("/papers", summary="Search papers via OpenAlex")
def search_papers(
    q: str = Query(..., min_length=2, description="Paper search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
) -> list[dict[str, Any]]:
    """Return normalized paper search results from OpenAlex."""

    settings = get_settings()
    client = OpenAlexClient(
        base_url=settings.openalex_base_url,
        timeout_seconds=settings.openalex_timeout_seconds,
    )

    try:
        return client.search_papers(query=q, per_page=limit)
    except OpenAlexTimeoutError as exc:
        logger.warning("OpenAlex search timed out", extra={"query": q})
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="OpenAlex request timed out",
        ) from exc
    except OpenAlexAPIError as exc:
        logger.error("OpenAlex search failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OpenAlex search request failed",
        ) from exc
    finally:
        client.close()
