"""Response models for backend-driven skill gap analysis."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SkillGapEvidenceSource(BaseModel):
    """One recommendation item that supports a missing skill inference."""

    paper_id: str
    title: str | None = None
    final_score: float
    matched_fields: list[str] = Field(default_factory=list)
    top_contributing_signals: list[str] = Field(default_factory=list)


class MissingSkillEvidence(BaseModel):
    """Derived missing skill with confidence and supporting evidence."""

    skill: str
    confidence: float
    evidence_count: int
    supporting_papers: list[SkillGapEvidenceSource] = Field(default_factory=list)
    rationale: str


class SkillGapResponse(BaseModel):
    """Canonical skill gap response for frontend visualization."""

    user_id: str
    current_skills: list[str] = Field(default_factory=list)
    missing_skills: list[MissingSkillEvidence] = Field(default_factory=list)
    suggested_next_skills: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    gaps_summary: str
