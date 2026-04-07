"""Recommendation routes."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, Request, status

from app.core.config import get_settings
from app.db.neo4j import Neo4jClient, Neo4jClientError
from app.models.recommendation import (
    ExplainedPaperRecommendationResponse,
    ScoredPaperRecommendationResponse,
    SemanticPaperRecommendationResponse,
)
from app.recommendation.explainability import explain_scored_recommendations
from app.recommendation.scored import recommend_papers_with_scores
from app.recommendation.semantic import (
    UserProfileEmbeddingMissingError,
    UserProfileNotFoundError,
    recommend_papers_by_semantic_similarity,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.get(
    "/papers/semantic",
    response_model=SemanticPaperRecommendationResponse,
    summary="Get semantic paper recommendations",
)
def get_semantic_paper_recommendations(
    request: Request,
    user_id: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=100),
) -> SemanticPaperRecommendationResponse:
    """Return top papers ranked by cosine similarity to user interests embedding."""

    neo4j_client = _get_neo4j_client(request)

    try:
        recommendations = recommend_papers_by_semantic_similarity(
            neo4j_client=neo4j_client,
            user_id=user_id,
            limit=limit,
        )
    except UserProfileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except UserProfileEmbeddingMissingError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Neo4jClientError as exc:
        logger.error("Neo4j error while computing semantic recommendations: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return SemanticPaperRecommendationResponse(user_id=user_id, recommendations=recommendations)


@router.get(
    "/papers/scored",
    response_model=ScoredPaperRecommendationResponse,
    summary="Get multi-signal scored paper recommendations",
)
def get_scored_paper_recommendations(
    request: Request,
    user_id: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=100),
) -> ScoredPaperRecommendationResponse:
    """Return top papers ranked by weighted semantic, centrality, and recency signals."""

    neo4j_client = _get_neo4j_client(request)
    settings = get_settings()

    try:
        recommendations = recommend_papers_with_scores(
            neo4j_client=neo4j_client,
            user_id=user_id,
            settings=settings,
            limit=limit,
        )
    except UserProfileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except UserProfileEmbeddingMissingError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Neo4jClientError as exc:
        logger.error("Neo4j error while computing scored recommendations: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return ScoredPaperRecommendationResponse(
        user_id=user_id,
        alpha=settings.recommendation_alpha,
        beta=settings.recommendation_beta,
        gamma=settings.recommendation_gamma,
        recommendations=recommendations,
    )


@router.get(
    "/papers/explained",
    response_model=ExplainedPaperRecommendationResponse,
    summary="Get explained paper recommendations",
)
def get_explained_paper_recommendations(
    request: Request,
    user_id: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=100),
) -> ExplainedPaperRecommendationResponse:
    """Return top papers with score breakdown and explanation metadata."""

    neo4j_client = _get_neo4j_client(request)
    settings = get_settings()

    try:
        scored = recommend_papers_with_scores(
            neo4j_client=neo4j_client,
            user_id=user_id,
            settings=settings,
            limit=limit,
        )
        explained = explain_scored_recommendations(scored_recommendations=scored, settings=settings)
    except UserProfileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except UserProfileEmbeddingMissingError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Neo4jClientError as exc:
        logger.error("Neo4j error while computing explained recommendations: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j is unavailable",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return ExplainedPaperRecommendationResponse(user_id=user_id, recommendations=explained)


def _get_neo4j_client(request: Request) -> Neo4jClient:
    """Resolve shared Neo4j client from application state."""

    neo4j_client = getattr(request.app.state, "neo4j", None)
    if not isinstance(neo4j_client, Neo4jClient):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Neo4j client is not initialized",
        )
    return neo4j_client
