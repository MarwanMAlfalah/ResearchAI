"""Response models for semantic paper recommendation endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SemanticPaperRecommendation(BaseModel):
    """A single paper recommendation scored by semantic similarity."""

    paper_id: str
    title: str | None = None
    similarity_score: float


class SemanticPaperRecommendationResponse(BaseModel):
    """Semantic recommendation response for a user profile."""

    user_id: str
    recommendations: list[SemanticPaperRecommendation] = Field(default_factory=list)
