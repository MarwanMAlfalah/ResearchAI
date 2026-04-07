"""OpenAlex API client with normalization for internal ResearchGraph schema."""

from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class OpenAlexClientError(Exception):
    """Base exception for OpenAlex client failures."""


class OpenAlexTimeoutError(OpenAlexClientError):
    """Raised when OpenAlex request times out."""


class OpenAlexAPIError(OpenAlexClientError):
    """Raised when OpenAlex returns a non-success response."""


class OpenAlexNotFoundError(OpenAlexAPIError):
    """Raised when the requested OpenAlex entity does not exist."""


class OpenAlexClient:
    """Small, testable OpenAlex HTTP client.

    The client handles communication and response normalization only.
    Business workflows should be implemented in service layers.
    """

    def __init__(
        self,
        base_url: str = "https://api.openalex.org",
        timeout_seconds: float = 10.0,
        http_client: httpx.Client | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds
        self._http_client = http_client or httpx.Client(timeout=self._timeout_seconds)

    def search_papers(self, query: str, per_page: int = 10, page: int = 1) -> list[dict[str, Any]]:
        """Search papers by free-text query and return normalized works."""

        params = {
            "search": query,
            "per-page": per_page,
            "page": page,
        }
        payload = self._request("/works", params=params)
        works = payload.get("results", [])

        if not isinstance(works, list):
            logger.warning("OpenAlex response 'results' field was not a list")
            return []

        return [self._normalize_work(work) for work in works if isinstance(work, dict)]

    def fetch_paper_by_id(self, openalex_id: str) -> dict[str, Any]:
        """Fetch one paper by OpenAlex ID and return normalized result."""

        normalized_id = self._normalize_openalex_id(openalex_id)
        payload = self._request(f"/works/{normalized_id}")

        if not isinstance(payload, dict):
            raise OpenAlexAPIError("Unexpected payload format for work details")

        return self._normalize_work(payload)

    def close(self) -> None:
        """Close the underlying HTTP client."""

        self._http_client.close()

    def _request(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """Execute GET request with timeout and API error handling."""

        url = f"{self._base_url}{path}"

        try:
            response = self._http_client.get(url, params=params)
            response.raise_for_status()
            payload = response.json()

            if not isinstance(payload, dict):
                raise OpenAlexAPIError("OpenAlex returned a non-object JSON payload")

            return payload
        except httpx.TimeoutException as exc:
            logger.error("OpenAlex request timed out", extra={"url": url})
            raise OpenAlexTimeoutError("OpenAlex request timed out") from exc
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                logger.info("OpenAlex resource not found", extra={"url": url})
                raise OpenAlexNotFoundError("OpenAlex resource not found") from exc
            logger.error(
                "OpenAlex returned non-success status",
                extra={"url": url, "status_code": exc.response.status_code},
            )
            raise OpenAlexAPIError(f"OpenAlex API error: HTTP {exc.response.status_code}") from exc
        except httpx.RequestError as exc:
            logger.error("OpenAlex request failed", extra={"url": url})
            raise OpenAlexAPIError("OpenAlex request failed") from exc

    def _normalize_work(self, work: dict[str, Any]) -> dict[str, Any]:
        """Normalize one OpenAlex work into internal schema."""

        return {
            "title": work.get("display_name"),
            "abstract": self._extract_abstract(work),
            "authors": self._extract_authors(work),
            "publication_year": work.get("publication_year"),
            "cited_by_count": work.get("cited_by_count"),
            "concepts": self._extract_concepts(work),
            "ids": self._extract_ids(work),
        }

    def _extract_abstract(self, work: dict[str, Any]) -> str | None:
        """Extract abstract text from OpenAlex payload when present."""

        inverted = work.get("abstract_inverted_index")
        if isinstance(inverted, dict):
            return self._reconstruct_inverted_abstract(inverted)

        abstract = work.get("abstract")
        return abstract if isinstance(abstract, str) else None

    def _extract_authors(self, work: dict[str, Any]) -> list[dict[str, str | None]]:
        """Extract normalized authors list."""

        authorships = work.get("authorships", [])
        if not isinstance(authorships, list):
            return []

        authors: list[dict[str, str | None]] = []
        for authorship in authorships:
            if not isinstance(authorship, dict):
                continue

            author = authorship.get("author")
            if not isinstance(author, dict):
                continue

            authors.append(
                {
                    "name": author.get("display_name"),
                    "openalex_id": author.get("id"),
                    "orcid": author.get("orcid"),
                }
            )

        return authors

    def _extract_concepts(self, work: dict[str, Any]) -> list[dict[str, Any]]:
        """Extract concept/topic entries from OpenAlex."""

        concepts = work.get("concepts", [])
        if not isinstance(concepts, list):
            return []

        normalized: list[dict[str, Any]] = []
        for concept in concepts:
            if not isinstance(concept, dict):
                continue

            normalized.append(
                {
                    "name": concept.get("display_name"),
                    "openalex_id": concept.get("id"),
                    "score": concept.get("score"),
                }
            )

        return normalized

    def _extract_ids(self, work: dict[str, Any]) -> dict[str, Any]:
        """Extract identifier map, preserving OpenAlex IDs when available."""

        ids = work.get("ids") if isinstance(work.get("ids"), dict) else {}

        return {
            **ids,
            "openalex": work.get("id") or ids.get("openalex"),
        }

    def _normalize_openalex_id(self, openalex_id: str) -> str:
        """Normalize OpenAlex ID input into short work identifier."""

        clean = openalex_id.strip()
        if clean.startswith("https://openalex.org/"):
            return clean.removeprefix("https://openalex.org/")
        return clean

    def _reconstruct_inverted_abstract(self, inverted_index: dict[str, Any]) -> str | None:
        """Reconstruct abstract text from OpenAlex inverted index format."""

        positioned_tokens: list[tuple[int, str]] = []

        for token, positions in inverted_index.items():
            if not isinstance(token, str) or not isinstance(positions, list):
                continue
            for position in positions:
                if isinstance(position, int):
                    positioned_tokens.append((position, token))

        if not positioned_tokens:
            return None

        positioned_tokens.sort(key=lambda item: item[0])
        return " ".join(token for _, token in positioned_tokens)
