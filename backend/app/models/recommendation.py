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
    publication_year: int | None = None
    cited_by_count: int | None = None
    embedding_model: str | None = None
    centrality_source: str | None = None


class ScoredPaperRecommendationResponse(BaseModel):
    """Scored recommendation response with configurable signal weights."""

    user_id: str
    alpha: float
    beta: float
    gamma: float
    recommendations: list[ScoredPaperRecommendation] = Field(default_factory=list)


class ExplainedPaperRecommendation(BaseModel):
    """A scored recommendation augmented with deterministic explanation metadata."""

    paper_id: str
    title: str | None = None
    semantic_similarity: float
    graph_centrality: float
    recency: float
    final_score: float
    top_contributing_signals: list[str] = Field(default_factory=list)
    explanation_text: str
    evidence: "RecommendationEvidence"


class RecommendationEvidence(BaseModel):
    """Structured evidence payload for transparent recommendation cards."""

    publication_year: int | None = None
    cited_by_count: int | None = None
    centrality_source: str
    embedding_model: str | None = None
    semantic_strength_bucket: str
    centrality_strength_bucket: str
    recency_strength_bucket: str


class ExplainedPaperRecommendationResponse(BaseModel):
    """Explained recommendation response for recommendation cards."""

    user_id: str
    recommendations: list[ExplainedPaperRecommendation] = Field(default_factory=list)
