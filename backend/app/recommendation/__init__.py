"""Recommendation module exports."""

from app.recommendation.semantic import (
    SemanticRecommendationError,
    UserProfileEmbeddingMissingError,
    UserProfileNotFoundError,
    recommend_papers_by_semantic_similarity,
)

__all__ = [
    "SemanticRecommendationError",
    "UserProfileNotFoundError",
    "UserProfileEmbeddingMissingError",
    "recommend_papers_by_semantic_similarity",
]
