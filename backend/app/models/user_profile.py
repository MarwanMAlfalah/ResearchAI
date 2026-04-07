"""Models for user profile create/update and retrieval responses."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class UserProfileUpsertRequest(BaseModel):
    """Request payload for creating or updating a user profile."""

    model_config = ConfigDict(extra="ignore")

    user_id: str
    name: str
    interests_text: str = ""
    skills: list[str] = Field(default_factory=list)


class UserProfileResponse(BaseModel):
    """Frontend-friendly user profile response."""

    user_id: str
    name: str
    interests_text: str
    interests_embedding: list[float] | None = None
    embedding_model: str | None = None
    skills: list[str] = Field(default_factory=list)
    created_at: str | None = None
    updated_at: str | None = None
