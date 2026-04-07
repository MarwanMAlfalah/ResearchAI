"""AI module exports."""

from app.ai.embeddings import EmbeddingService, cosine_similarity, get_embedding_service

__all__ = ["EmbeddingService", "get_embedding_service", "cosine_similarity"]
