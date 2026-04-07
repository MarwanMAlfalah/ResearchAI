"""Reusable sentence-transformers embedding service for ResearchGraph AI."""

from __future__ import annotations

import math
from collections import OrderedDict
from functools import lru_cache

from sentence_transformers import SentenceTransformer


class EmbeddingService:
    """Generate text embeddings using a configurable sentence-transformer model."""

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        device: str = "cpu",
        cache_size: int = 2048,
    ) -> None:
        self._model_name = model_name
        self._device = device
        self._cache_size = cache_size
        self._model: SentenceTransformer | None = None
        self._embedding_cache: OrderedDict[str, list[float]] = OrderedDict()

    @property
    def model_name(self) -> str:
        """Return the configured embedding model name."""

        return self._model_name

    def generate_user_interests_embedding(self, interests_text: str) -> list[float] | None:
        """Generate embedding for user interests text."""

        return self._encode_text(interests_text)

    def generate_paper_embedding(self, title: str | None, abstract: str | None) -> list[float] | None:
        """Generate embedding for paper text composed of title and abstract."""

        chunks = [part.strip() for part in [title or "", abstract or ""] if part and part.strip()]
        if not chunks:
            return None
        return self._encode_text("\n\n".join(chunks))

    def generate_topic_embedding(self, topic_text: str) -> list[float] | None:
        """Generate embedding for a topic text string."""

        return self._encode_text(topic_text)

    def cosine_similarity(self, vector_a: list[float], vector_b: list[float]) -> float:
        """Compute cosine similarity between two embeddings."""

        return cosine_similarity(vector_a, vector_b)

    def _encode_text(self, text: str) -> list[float] | None:
        """Encode text to embedding with simple in-memory caching."""

        normalized = text.strip()
        if not normalized:
            return None

        cached = self._embedding_cache.get(normalized)
        if cached is not None:
            self._embedding_cache.move_to_end(normalized)
            return list(cached)

        model = self._get_model()
        vector = model.encode(normalized, convert_to_numpy=False)
        embedding = [float(value) for value in vector]
        self._embedding_cache[normalized] = embedding

        if len(self._embedding_cache) > self._cache_size:
            self._embedding_cache.popitem(last=False)

        return list(embedding)

    def _get_model(self) -> SentenceTransformer:
        """Lazy-load the embedding model only when needed."""

        if self._model is None:
            self._model = SentenceTransformer(self._model_name, device=self._device)
        return self._model


@lru_cache
def get_embedding_service(model_name: str, device: str) -> EmbeddingService:
    """Return a cached embedding service instance by model/device pair."""

    return EmbeddingService(model_name=model_name, device=device)


def cosine_similarity(vector_a: list[float], vector_b: list[float]) -> float:
    """Compute cosine similarity with numerical safety checks."""

    if len(vector_a) != len(vector_b):
        raise ValueError("Embedding vectors must have the same length")
    if not vector_a:
        raise ValueError("Embedding vectors must not be empty")

    dot = sum(a * b for a, b in zip(vector_a, vector_b))
    norm_a = math.sqrt(sum(a * a for a in vector_a))
    norm_b = math.sqrt(sum(b * b for b in vector_b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot / (norm_a * norm_b)
