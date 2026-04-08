"""Deterministic lightweight research advisor service."""

from __future__ import annotations

from dataclasses import dataclass

from app.core.config import Settings
from app.db.neo4j import Neo4jClient
from app.models.advisor import AdvisorChatResponse, AdvisorSupportingItem
from app.models.recommendation import ExplainedPaperRecommendation
from app.models.skill_gap import SkillGapResponse
from app.models.user_profile import UserProfileResponse
from app.recommendation.explainability import explain_scored_recommendations
from app.recommendation.scored import recommend_papers_with_scores
from app.recommendation.semantic import UserProfileNotFoundError
from app.services.skill_gap_service import build_skill_gap_analysis
from app.services.user_profile_service import get_user_profile

_INTENT_EXPLAIN_RECOMMENDATIONS = "explain_recommendations"
_INTENT_LEARN_NEXT = "learn_next"
_INTENT_START_WITH_FIRST = "start_with_first_paper"
_INTENT_SUMMARIZE_PROFILE = "summarize_profile_direction"
_INTENT_COMPARE_TOP = "compare_top_recommendations"


@dataclass(frozen=True)
class _AdvisorContext:
    """Shared context object used by intent response builders."""

    profile: UserProfileResponse
    explained_recommendations: list[ExplainedPaperRecommendation]
    skill_gap: SkillGapResponse


def generate_advisor_chat_response(
    neo4j_client: Neo4jClient,
    settings: Settings,
    user_id: str,
    message: str,
) -> AdvisorChatResponse:
    """Generate deterministic advisor chat output for supported intents."""

    intent = detect_intent(message)
    context = _build_context(
        neo4j_client=neo4j_client,
        settings=settings,
        user_id=user_id,
    )

    if intent == _INTENT_EXPLAIN_RECOMMENDATIONS:
        answer, supporting = _answer_explain_recommendations(context)
    elif intent == _INTENT_LEARN_NEXT:
        answer, supporting = _answer_learn_next(context)
    elif intent == _INTENT_START_WITH_FIRST:
        answer, supporting = _answer_start_with_first_paper(context)
    elif intent == _INTENT_COMPARE_TOP:
        answer, supporting = _answer_compare_top_recommendations(context)
    else:
        answer, supporting = _answer_summarize_profile_direction(context)

    return AdvisorChatResponse(
        user_id=context.profile.user_id,
        detected_intent=intent,
        answer=answer,
        supporting_items=supporting,
    )


def detect_intent(message: str) -> str:
    """Detect one of the supported advisor intents from a free-text question."""

    text = message.strip().casefold()

    if _contains_any(text, ["compare", "difference", "versus", "vs"]) and _contains_any(
        text, ["recommend", "paper"]
    ):
        return _INTENT_COMPARE_TOP
    if _contains_any(text, ["learn", "skill", "what should i learn", "next skill"]):
        return _INTENT_LEARN_NEXT
    if _contains_any(text, ["start with", "which paper", "first paper", "start first"]):
        return _INTENT_START_WITH_FIRST
    if _contains_any(text, ["explain", "why", "recommendation", "recommended"]):
        return _INTENT_EXPLAIN_RECOMMENDATIONS
    if _contains_any(text, ["summarize", "summary", "direction", "profile"]):
        return _INTENT_SUMMARIZE_PROFILE

    return _INTENT_SUMMARIZE_PROFILE


def _build_context(
    neo4j_client: Neo4jClient,
    settings: Settings,
    user_id: str,
) -> _AdvisorContext:
    """Load reusable profile/recommendation/skill-gap context once."""

    profile = get_user_profile(neo4j_client=neo4j_client, user_id=user_id)
    if profile is None:
        raise UserProfileNotFoundError(f"User profile not found: {user_id}")

    scored = recommend_papers_with_scores(
        neo4j_client=neo4j_client,
        user_id=user_id,
        settings=settings,
        limit=10,
    )
    explained = explain_scored_recommendations(scored_recommendations=scored, settings=settings)
    skill_gap = build_skill_gap_analysis(
        neo4j_client=neo4j_client,
        user_id=user_id,
        settings=settings,
        limit=10,
    )

    return _AdvisorContext(
        profile=profile,
        explained_recommendations=explained,
        skill_gap=skill_gap,
    )


def _answer_explain_recommendations(
    context: _AdvisorContext,
) -> tuple[str, list[AdvisorSupportingItem]]:
    """Explain why top recommendations are ranked highly."""

    top = context.explained_recommendations[:3]
    if not top:
        return (
            "I could not find recommendation candidates yet. Import more papers and try again.",
            [],
        )

    strongest = top[0]
    lead_signals = ", ".join(_pretty_signal_name(item) for item in strongest.top_contributing_signals[:2])
    answer = (
        f"Your recommendations are primarily driven by semantic fit to your profile, then adjusted by "
        f"centrality and recency. The current top paper is '{strongest.title or strongest.paper_id}' "
        f"with score {strongest.final_score:.3f}, mainly due to {lead_signals}."
    )

    supporting = [
        AdvisorSupportingItem(
            item_type="paper",
            title=item.title or item.paper_id,
            details={
                "paper_id": item.paper_id,
                "final_score": round(item.final_score, 4),
                "top_contributing_signals": item.top_contributing_signals,
            },
        )
        for item in top
    ]
    return answer, supporting


def _answer_learn_next(
    context: _AdvisorContext,
) -> tuple[str, list[AdvisorSupportingItem]]:
    """Recommend next skills from backend skill-gap analysis."""

    missing = context.skill_gap.missing_skills[:3]
    if not missing:
        return (
            "No strong skill gaps were detected from your current profile and recommendations. "
            "Consider importing more papers to increase evidence.",
            [],
        )

    skills_text = ", ".join(item.skill for item in missing)
    answer = (
        f"Based on your current profile and recommendation evidence, the next skills to prioritize are: "
        f"{skills_text}."
    )
    supporting = [
        AdvisorSupportingItem(
            item_type="skill",
            title=item.skill,
            details={
                "confidence": item.confidence,
                "evidence_count": item.evidence_count,
                "rationale": item.rationale,
            },
        )
        for item in missing
    ]
    return answer, supporting


def _answer_start_with_first_paper(
    context: _AdvisorContext,
) -> tuple[str, list[AdvisorSupportingItem]]:
    """Recommend the first paper to start with from ranked recommendations."""

    if not context.explained_recommendations:
        return ("I do not have ranked papers yet. Fetch recommendations first.", [])

    first = context.explained_recommendations[0]
    signals = ", ".join(_pretty_signal_name(item) for item in first.top_contributing_signals[:2])
    answer = (
        f"Start with '{first.title or first.paper_id}'. It is currently ranked first "
        f"(score {first.final_score:.3f}) with strongest contribution from {signals}."
    )
    supporting = [
        AdvisorSupportingItem(
            item_type="paper",
            title=first.title or first.paper_id,
            details={
                "paper_id": first.paper_id,
                "final_score": round(first.final_score, 4),
                "explanation_text": first.explanation_text,
                "top_contributing_signals": first.top_contributing_signals,
            },
        )
    ]
    return answer, supporting


def _answer_summarize_profile_direction(
    context: _AdvisorContext,
) -> tuple[str, list[AdvisorSupportingItem]]:
    """Summarize profile context and near-term research direction."""

    top_skills = ", ".join(context.profile.skills[:5]) if context.profile.skills else "none yet"
    next_skills = ", ".join(context.skill_gap.suggested_next_skills[:3]) or "none identified yet"
    top_paper = context.explained_recommendations[0] if context.explained_recommendations else None
    top_paper_text = top_paper.title or top_paper.paper_id if top_paper else "no ranked paper yet"

    answer = (
        f"Profile summary for {context.profile.name or context.profile.user_id}: current skills are {top_skills}. "
        f"Your near-term direction points to {next_skills}. "
        f"Top recommended starting paper is {top_paper_text}."
    )

    supporting: list[AdvisorSupportingItem] = [
        AdvisorSupportingItem(
            item_type="summary",
            title="Profile Snapshot",
            details={
                "user_id": context.profile.user_id,
                "interests_text": _truncate_text(context.profile.interests_text, 180),
                "current_skills": context.profile.skills,
                "suggested_next_skills": context.skill_gap.suggested_next_skills[:5],
            },
        )
    ]
    return answer, supporting


def _answer_compare_top_recommendations(
    context: _AdvisorContext,
) -> tuple[str, list[AdvisorSupportingItem]]:
    """Briefly compare top recommended papers."""

    top = context.explained_recommendations[:3]
    if len(top) < 2:
        return (
            "I need at least two recommendation candidates to compare. Import more papers and retry.",
            [],
        )

    first = top[0]
    second = top[1]
    answer = (
        f"Top recommendation is '{first.title or first.paper_id}' ({first.final_score:.3f}), followed by "
        f"'{second.title or second.paper_id}' ({second.final_score:.3f}). "
        f"The first has stronger { _pretty_signal_name(first.top_contributing_signals[0]) if first.top_contributing_signals else 'ranking signals' }."
    )

    supporting = [
        AdvisorSupportingItem(
            item_type="paper",
            title=item.title or item.paper_id,
            details={
                "paper_id": item.paper_id,
                "final_score": round(item.final_score, 4),
                "semantic_similarity": round(item.semantic_similarity, 4),
                "graph_centrality": round(item.graph_centrality, 4),
                "recency": round(item.recency, 4),
                "top_contributing_signals": item.top_contributing_signals,
            },
        )
        for item in top
    ]
    return answer, supporting


def _contains_any(text: str, patterns: list[str]) -> bool:
    """Return whether any pattern is present in normalized text."""

    return any(pattern in text for pattern in patterns)


def _pretty_signal_name(signal: str) -> str:
    """Convert machine signal names to readable labels."""

    return signal.replace("_", " ")


def _truncate_text(text: str, max_len: int) -> str:
    """Truncate long text for concise summary responses."""

    clean = text.strip()
    if len(clean) <= max_len:
        return clean
    return f"{clean[:max_len].rstrip()}..."
