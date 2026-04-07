"""Recommendation module exports."""

from app.recommendation.semantic import (
    SemanticRecommendationError,
    UserProfileEmbeddingMissingError,
    UserProfileNotFoundError,
    recommend_papers_by_semantic_similarity,
)
from app.recommendation.scored import recommend_papers_with_scores

__all__ = [
    "SemanticRecommendationError",
    "UserProfileNotFoundError",
    "UserProfileEmbeddingMissingError",
    "recommend_papers_by_semantic_similarity",
    "recommend_papers_with_scores",
]
