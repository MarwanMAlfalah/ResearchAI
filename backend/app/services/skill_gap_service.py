"""Service layer for deterministic skill gap analysis."""

from __future__ import annotations

from dataclasses import dataclass, field

from app.core.config import Settings
from app.db.neo4j import Neo4jClient
from app.models.recommendation import ExplainedPaperRecommendation
from app.models.skill_gap import MissingSkillEvidence, SkillGapEvidenceSource, SkillGapResponse
from app.recommendation.explainability import explain_scored_recommendations
from app.recommendation.scored import recommend_papers_with_scores
from app.recommendation.semantic import UserProfileNotFoundError
from app.services.user_profile_service import get_user_profile

_SKILL_CATALOG = [
    "python",
    "machine learning",
    "deep learning",
    "natural language processing",
    "transformers",
    "sentence transformers",
    "embeddings",
    "knowledge graphs",
    "ontology engineering",
    "neo4j",
    "graph databases",
    "graph neural networks",
    "link prediction",
    "recommender systems",
    "information retrieval",
    "data mining",
    "network analysis",
    "statistics",
    "rdflib",
    "owlready2",
    "spacy",
    "keybert",
    "cytoscape",
    "fastapi",
    "typescript",
    "react",
]


@dataclass
class _SkillAccumulator:
    """Internal accumulator for one derived missing skill."""

    score: float = 0.0
    sources: list[SkillGapEvidenceSource] = field(default_factory=list)
    matched_interest: bool = False


def build_skill_gap_analysis(
    neo4j_client: Neo4jClient,
    user_id: str,
    settings: Settings,
    limit: int = 10,
) -> SkillGapResponse:
    """Build canonical skill gap response from profile + explained recommendations."""

    profile = get_user_profile(neo4j_client=neo4j_client, user_id=user_id)
    if profile is None:
        raise UserProfileNotFoundError(f"User profile not found: {user_id}")

    scored = recommend_papers_with_scores(
        neo4j_client=neo4j_client,
        user_id=user_id,
        settings=settings,
        limit=limit,
    )
    explained = explain_scored_recommendations(scored_recommendations=scored, settings=settings)

    current_skills = _normalize_current_skills(profile.skills)
    current_skill_keys = {skill.casefold() for skill in current_skills}
    candidate_map = _collect_missing_skill_candidates(
        explained_recommendations=explained,
        interests_text=profile.interests_text,
    )

    missing = _rank_missing_skills(
        candidate_map=candidate_map,
        current_skill_keys=current_skill_keys,
        limit=limit,
    )
    suggested_next = [item.skill for item in missing[: min(5, len(missing))]]
    strengths = _derive_strengths(
        current_skills=current_skills,
        interests_text=profile.interests_text,
        explained_recommendations=explained,
    )
    gaps_summary = _build_gaps_summary(
        missing_count=len(missing),
        recommendation_count=len(explained),
        suggested_next_skills=suggested_next,
    )

    return SkillGapResponse(
        user_id=profile.user_id,
        current_skills=current_skills,
        missing_skills=missing,
        suggested_next_skills=suggested_next,
        strengths=strengths,
        gaps_summary=gaps_summary,
    )


def _collect_missing_skill_candidates(
    explained_recommendations: list[ExplainedPaperRecommendation],
    interests_text: str,
) -> dict[str, _SkillAccumulator]:
    """Collect deterministic skill candidates from interests and recommendation evidence."""

    candidates: dict[str, _SkillAccumulator] = {}
    interests_lc = interests_text.casefold()

    for skill in _SKILL_CATALOG:
        skill_key = skill.casefold()
        if skill_key in interests_lc:
            bucket = candidates.setdefault(skill_key, _SkillAccumulator())
            bucket.score += 0.8
            bucket.matched_interest = True

    for rec in explained_recommendations:
        title_lc = (rec.title or "").casefold()
        explanation_lc = rec.explanation_text.casefold()

        for skill in _SKILL_CATALOG:
            skill_key = skill.casefold()
            matched_fields: list[str] = []
            if skill_key in title_lc:
                matched_fields.append("title")
            if skill_key in explanation_lc:
                matched_fields.append("explanation")
            if not matched_fields:
                continue

            bucket = candidates.setdefault(skill_key, _SkillAccumulator())
            contribution = _recommendation_skill_contribution(rec=rec, matched_fields=matched_fields)
            bucket.score += contribution
            bucket.sources.append(
                SkillGapEvidenceSource(
                    paper_id=rec.paper_id,
                    title=rec.title,
                    final_score=rec.final_score,
                    matched_fields=matched_fields,
                    top_contributing_signals=rec.top_contributing_signals,
                )
            )

    return candidates


def _rank_missing_skills(
    candidate_map: dict[str, _SkillAccumulator],
    current_skill_keys: set[str],
    limit: int,
) -> list[MissingSkillEvidence]:
    """Convert candidate map into sorted and normalized missing skill evidence list."""

    filtered: list[tuple[str, _SkillAccumulator]] = [
        (key, value)
        for key, value in candidate_map.items()
        if key not in current_skill_keys
    ]

    filtered.sort(key=lambda item: (item[1].score, len(item[1].sources), item[0]), reverse=True)
    top = filtered[:limit]

    max_score = max((item[1].score for item in top), default=0.0)
    out: list[MissingSkillEvidence] = []

    for skill_key, accumulator in top:
        confidence = _normalize_confidence(accumulator.score, max_score=max_score)
        out.append(
            MissingSkillEvidence(
                skill=_title_case(skill_key),
                confidence=confidence,
                evidence_count=len(accumulator.sources),
                supporting_papers=accumulator.sources[:5],
                rationale=_build_rationale(accumulator),
            )
        )

    return out


def _derive_strengths(
    current_skills: list[str],
    interests_text: str,
    explained_recommendations: list[ExplainedPaperRecommendation],
) -> list[str]:
    """Rank current skills by how visible they are in interests and recommendation evidence."""

    if not current_skills:
        return []

    interests_lc = interests_text.casefold()
    scored: list[tuple[str, float]] = []

    for skill in current_skills:
        key = skill.casefold()
        score = 0.0
        if key and key in interests_lc:
            score += 1.0

        for rec in explained_recommendations:
            title_lc = (rec.title or "").casefold()
            explanation_lc = rec.explanation_text.casefold()
            if key and (key in title_lc or key in explanation_lc):
                score += 0.5

        scored.append((skill, score))

    scored.sort(key=lambda item: (item[1], item[0].casefold()), reverse=True)
    top = [item[0] for item in scored[:6]]
    return top


def _recommendation_skill_contribution(
    rec: ExplainedPaperRecommendation,
    matched_fields: list[str],
) -> float:
    """Compute deterministic contribution score for one recommendation-to-skill match."""

    contribution = rec.final_score
    if "title" in matched_fields:
        contribution += 0.7
    if "explanation" in matched_fields:
        contribution += 0.4
    if rec.evidence.semantic_strength_bucket == "high":
        contribution += 0.2
    return contribution


def _build_rationale(accumulator: _SkillAccumulator) -> str:
    """Build concise deterministic rationale for one missing skill."""

    from_recs = len(accumulator.sources)
    if accumulator.matched_interest and from_recs > 0:
        return "Matched user interests and appeared in recommendation evidence."
    if accumulator.matched_interest:
        return "Matched user interests but appeared less in recommendation evidence."
    return "Inferred from recommendation evidence."


def _build_gaps_summary(
    missing_count: int,
    recommendation_count: int,
    suggested_next_skills: list[str],
) -> str:
    """Create a concise summary sentence for frontend display."""

    if missing_count == 0:
        return (
            f"No strong skill gaps detected from {recommendation_count} recommendations. "
            "Add more papers or richer profile interests to improve signal quality."
        )

    top = ", ".join(suggested_next_skills[:3]) if suggested_next_skills else "none"
    return (
        f"Identified {missing_count} potential skill gaps from {recommendation_count} recommendations. "
        f"Top next skills: {top}."
    )


def _normalize_current_skills(skills: list[str]) -> list[str]:
    """Normalize and deduplicate profile skills with stable ordering."""

    seen: set[str] = set()
    out: list[str] = []

    for skill in skills:
        clean = skill.strip()
        if not clean:
            continue
        key = clean.casefold()
        if key in seen:
            continue
        seen.add(key)
        out.append(clean)

    return out


def _normalize_confidence(score: float, max_score: float) -> float:
    """Normalize confidence into [0, 1] with deterministic rounding."""

    if max_score <= 0.0:
        return 0.0
    value = max(0.0, min(1.0, score / max_score))
    return round(value, 4)


def _title_case(value: str) -> str:
    """Convert skill key to a user-facing title case string."""

    return " ".join(token.capitalize() for token in value.split(" ") if token)
