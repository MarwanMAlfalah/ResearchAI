"""Multi-signal scored recommendation service for papers."""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

from app.ai.embeddings import cosine_similarity
from app.core.config import Settings
from app.db.neo4j import Neo4jClient
from app.models.recommendation import ScoredPaperRecommendation
from app.recommendation.semantic import get_paper_embedding_candidates, get_user_profile_embedding


@dataclass(frozen=True)
class ScoringWeights:
    """Weight configuration for multi-signal recommendation scoring."""

    alpha: float
    beta: float
    gamma: float


@dataclass(frozen=True)
class ScoringContext:
    """Runtime context values used during signal computation."""

    current_year: int
    recency_decay: float


def recommend_papers_with_scores(
    neo4j_client: Neo4jClient,
    user_id: str,
    settings: Settings,
    limit: int = 10,
) -> list[ScoredPaperRecommendation]:
    """Compute and return top-N papers using semantic, centrality, and recency signals."""

    user_embedding = get_user_profile_embedding(neo4j_client=neo4j_client, user_id=user_id)
    candidates = get_paper_embedding_candidates(neo4j_client=neo4j_client)

    weights = ScoringWeights(
        alpha=settings.recommendation_alpha,
        beta=settings.recommendation_beta,
        gamma=settings.recommendation_gamma,
    )
    context = ScoringContext(
        current_year=settings.recommendation_current_year,
        recency_decay=settings.recommendation_recency_decay,
    )

    max_degree = _max_citation_degree(candidates)
    scored: list[ScoredPaperRecommendation] = []

    for candidate in candidates:
        paper_embedding = _to_float_list_or_none(candidate.get("paper_embedding"))
        if not paper_embedding:
            continue

        semantic_similarity = cosine_similarity(user_embedding, paper_embedding)
        graph_centrality = _graph_centrality_score(candidate.get("citation_degree"), max_degree)
        recency = _recency_score(candidate.get("publication_year"), context)

        final_score = (
            weights.alpha * semantic_similarity
            + weights.beta * graph_centrality
            + weights.gamma * recency
        )

        scored.append(
            ScoredPaperRecommendation(
                paper_id=str(candidate.get("paper_id") or ""),
                title=candidate.get("title"),
                semantic_similarity=float(semantic_similarity),
                graph_centrality=float(graph_centrality),
                recency=float(recency),
                final_score=float(final_score),
            )
        )

    scored.sort(key=lambda item: item.final_score, reverse=True)
    return scored[:limit]


def _recency_score(publication_year: Any, context: ScoringContext) -> float:
    """Compute exponential-decay recency score from publication year."""

    try:
        year = int(publication_year)
    except (TypeError, ValueError):
        return 0.0

    age = max(0, context.current_year - year)
    return math.exp(-context.recency_decay * age)


def _graph_centrality_score(citation_degree: Any, max_degree: float) -> float:
    """Compute normalized centrality score from citation degree."""

    try:
        degree = float(citation_degree)
    except (TypeError, ValueError):
        degree = 0.0

    if max_degree <= 0.0:
        return 0.0

    return max(0.0, min(1.0, degree / max_degree))


def _max_citation_degree(candidates: list[dict[str, Any]]) -> float:
    """Find maximum citation degree for centrality normalization."""

    max_value = 0.0
    for candidate in candidates:
        try:
            degree = float(candidate.get("citation_degree") or 0.0)
        except (TypeError, ValueError):
            degree = 0.0
        if degree > max_value:
            max_value = degree
    return max_value


def _to_float_list_or_none(value: Any) -> list[float] | None:
    """Convert Neo4j property value to a float list when possible."""

    if value is None:
        return None
    if isinstance(value, list):
        out: list[float] = []
        for item in value:
            try:
                out.append(float(item))
            except (TypeError, ValueError):
                return None
        return out if out else None
    return None
