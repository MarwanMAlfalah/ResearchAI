"""Pydantic models for normalized paper ingestion payloads."""

from __future__ import annotations

from typing import Any

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
