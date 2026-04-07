"""Template-based explainability layer for scored paper recommendations."""

from __future__ import annotations

from dataclasses import dataclass

from app.core.config import Settings
from app.models.recommendation import ExplainedPaperRecommendation, ScoredPaperRecommendation


@dataclass(frozen=True)
class SignalContribution:
    """Weighted contribution metadata for a scoring signal."""

    signal: str
    raw_score: float
    weighted_score: float


def explain_scored_recommendations(
    scored_recommendations: list[ScoredPaperRecommendation],
    settings: Settings,
) -> list[ExplainedPaperRecommendation]:
    """Attach deterministic explanation metadata to scored recommendations."""

    explained: list[ExplainedPaperRecommendation] = []

    for rec in scored_recommendations:
        contributions = _rank_signal_contributions(rec=rec, settings=settings)
        top_signals = [item.signal for item in contributions]
        explanation_text = _build_explanation_text(rec=rec, contributions=contributions)

        explained.append(
            ExplainedPaperRecommendation(
                paper_id=rec.paper_id,
                title=rec.title,
                semantic_similarity=rec.semantic_similarity,
                graph_centrality=rec.graph_centrality,
                recency=rec.recency,
                final_score=rec.final_score,
                top_contributing_signals=top_signals,
                explanation_text=explanation_text,
            )
        )

    return explained


def _rank_signal_contributions(
    rec: ScoredPaperRecommendation,
    settings: Settings,
) -> list[SignalContribution]:
    """Rank signals by weighted contribution to final score."""

    contributions = [
        SignalContribution(
            signal="semantic_similarity",
            raw_score=rec.semantic_similarity,
            weighted_score=settings.recommendation_alpha * rec.semantic_similarity,
        ),
        SignalContribution(
            signal="graph_centrality",
            raw_score=rec.graph_centrality,
            weighted_score=settings.recommendation_beta * rec.graph_centrality,
        ),
        SignalContribution(
            signal="recency",
            raw_score=rec.recency,
            weighted_score=settings.recommendation_gamma * rec.recency,
        ),
    ]

    contributions.sort(key=lambda item: item.weighted_score, reverse=True)
    return contributions


def _build_explanation_text(
    rec: ScoredPaperRecommendation,
    contributions: list[SignalContribution],
) -> str:
    """Build concise explanation text with strongest signals first."""

    first = contributions[0]
    second = contributions[1]
    third = contributions[2]

    first_part = _signal_phrase(first, lead=True)
    second_part = _signal_phrase(second, lead=False)
    third_part = _signal_phrase(third, lead=False)

    return (
        f"{first_part}; {second_part}; {third_part}. "
        f"Overall recommendation score: {rec.final_score:.3f}."
    )


def _signal_phrase(contribution: SignalContribution, lead: bool) -> str:
    """Generate one template phrase for a signal contribution."""

    strength = _strength_bucket(contribution.raw_score)

    labels = {
        "semantic_similarity": "semantic match to your interests",
        "graph_centrality": "graph centrality within the citation network",
        "recency": "publication recency",
    }

    if lead:
        prefixes = {
            "high": "Strong",
            "medium": "Solid",
            "low": "Limited",
        }
        return f"{prefixes[strength]} {labels[contribution.signal]}"

    connectors = {
        "high": "also strong",
        "medium": "is moderate",
        "low": "is weaker",
    }
    return f"{labels[contribution.signal].capitalize()} {connectors[strength]}"


def _strength_bucket(score: float) -> str:
    """Convert numeric signal score into a coarse qualitative bucket."""

    if score >= 0.67:
        return "high"
    if score >= 0.34:
        return "medium"
    return "low"
