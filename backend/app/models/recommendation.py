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


class ScoredPaperRecommendation(BaseModel):
    """A paper recommendation with full multi-signal score breakdown."""

    paper_id: str
    title: str | None = None
    semantic_similarity: float
    graph_centrality: float
    recency: float
    final_score: float


class ScoredPaperRecommendationResponse(BaseModel):
    """Scored recommendation response with configurable signal weights."""

    user_id: str
    alpha: float
    beta: float
    gamma: float
    recommendations: list[ScoredPaperRecommendation] = Field(default_factory=list)
