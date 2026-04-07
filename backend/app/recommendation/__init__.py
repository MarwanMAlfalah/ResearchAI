"""Recommendation module exports."""

from app.recommendation.semantic import (
    SemanticRecommendationError,
    UserProfileEmbeddingMissingError,
    UserProfileNotFoundError,
    recommend_papers_by_semantic_similarity,
)
from app.recommendation.scored import recommend_papers_with_scores
from app.recommendation.explainability import explain_scored_recommendations

__all__ = [
    "SemanticRecommendationError",
    "UserProfileNotFoundError",
    "UserProfileEmbeddingMissingError",
    "recommend_papers_by_semantic_similarity",
    "recommend_papers_with_scores",
    "explain_scored_recommendations",
]
