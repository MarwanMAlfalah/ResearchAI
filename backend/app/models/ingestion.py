"""Pydantic models for normalized paper ingestion payloads."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class NormalizedAuthor(BaseModel):
    """Normalized author payload from external paper sources."""

    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    openalex_id: str | None = None
    orcid: str | None = None


class NormalizedConcept(BaseModel):
    """Normalized concept/topic payload from external paper sources."""

    model_config = ConfigDict(extra="ignore")

    name: str | None = None
    openalex_id: str | None = None
    score: float | None = None


class NormalizedPaper(BaseModel):
    """Normalized paper payload for ingestion into Neo4j."""

    model_config = ConfigDict(extra="ignore")

    title: str | None = None
    abstract: str | None = None
    authors: list[NormalizedAuthor] = Field(default_factory=list)
    publication_year: int | None = None
    cited_by_count: int | None = None
    concepts: list[NormalizedConcept] = Field(default_factory=list)
    ids: dict[str, Any] = Field(default_factory=dict)


class PaperImportResult(BaseModel):
    """Result summary for one paper import operation."""

    paper_id: str
    authors_merged: int
    topics_merged: int
    author_ids: list[str] = Field(default_factory=list)
    topic_names: list[str] = Field(default_factory=list)


class OpenAlexPaperImportResponse(BaseModel):
    """Response payload for direct OpenAlex paper import endpoint."""

    status: str = "imported"
    openalex_id: str
    imported: PaperImportResult


class OpenAlexBatchImportRequest(BaseModel):
    """Request payload for batch direct imports from OpenAlex IDs."""

    openalex_ids: list[str] = Field(default_factory=list)


class OpenAlexBatchImportItemResult(BaseModel):
    """Per-ID result item for batch OpenAlex import operations."""

    openalex_id: str
    status: Literal["imported", "failed"]
    reason: str | None = None
    imported: PaperImportResult | None = None


class OpenAlexBatchImportResponse(BaseModel):
    """Aggregate response payload for batch OpenAlex imports."""

    total: int
    imported: int
    failed: int
    results: list[OpenAlexBatchImportItemResult] = Field(default_factory=list)
