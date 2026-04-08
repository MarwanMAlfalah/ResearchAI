"""Semantic similarity recommendation service for papers."""

from __future__ import annotations

from typing import Any

from app.ai.embeddings import cosine_similarity
from app.db.neo4j import Neo4jClient
from app.models.recommendation import SemanticPaperRecommendation


class SemanticRecommendationError(Exception):
    """Base error for semantic recommendation service."""


class UserProfileNotFoundError(SemanticRecommendationError):
    """Raised when the requested user profile does not exist."""


class UserProfileEmbeddingMissingError(SemanticRecommendationError):
    """Raised when user profile does not have an embedding yet."""


def recommend_papers_by_semantic_similarity(
    neo4j_client: Neo4jClient,
    user_id: str,
    limit: int = 10,
) -> list[SemanticPaperRecommendation]:
    """Return top-N papers sorted by cosine similarity to user interests embedding."""

    user_embedding = get_user_profile_embedding(neo4j_client=neo4j_client, user_id=user_id)
    papers = get_paper_embedding_candidates(neo4j_client=neo4j_client)

    scored: list[SemanticPaperRecommendation] = []
    for paper in papers:
        paper_embedding = _to_float_list_or_none(paper.get("paper_embedding"))
        if not paper_embedding:
            continue

        score = cosine_similarity(user_embedding, paper_embedding)
        scored.append(
            SemanticPaperRecommendation(
                paper_id=str(paper.get("paper_id") or ""),
                title=paper.get("title"),
                similarity_score=float(score),
            )
        )

    scored.sort(key=lambda item: item.similarity_score, reverse=True)
    return scored[:limit]


def get_user_profile_embedding(neo4j_client: Neo4jClient, user_id: str) -> list[float]:
    """Fetch user embedding vector from Neo4j and validate availability."""

    rows = neo4j_client.run_read_query(
        query="""
        MATCH (u:UserProfile {user_id: $user_id})
        RETURN u.user_id AS user_id, u.interests_embedding AS interests_embedding
        LIMIT 1
        """,
        parameters={"user_id": user_id},
    )

    if not rows:
        raise UserProfileNotFoundError(f"User profile not found: {user_id}")

    embedding = _to_float_list_or_none(rows[0].get("interests_embedding"))
    if embedding is None:
        raise UserProfileEmbeddingMissingError(
            f"User profile embedding is missing for user_id={user_id}"
        )

    return embedding


def get_paper_embedding_candidates(neo4j_client: Neo4jClient) -> list[dict[str, Any]]:
    """Fetch papers with embeddings and graph metadata for scoring."""

    return neo4j_client.run_read_query(
        query="""
        MATCH (p:Paper)
        WHERE p.paper_embedding IS NOT NULL
        OPTIONAL MATCH (p)<-[:CITES]-(:Paper)
        WITH p, count(*) AS incoming_citations
        OPTIONAL MATCH (p)-[:CITES]->(:Paper)
        WITH p, incoming_citations, count(*) AS outgoing_citations
        RETURN
            p.paper_id AS paper_id,
            p.title AS title,
            p.paper_embedding AS paper_embedding,
            p.embedding_model AS embedding_model,
            p.publication_year AS publication_year,
            p.cited_by_count AS cited_by_count,
            toFloat(incoming_citations + outgoing_citations) AS citation_degree
        """
    )


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
