"""Request and response models for lightweight advisor chat."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AdvisorChatRequest(BaseModel):
    """Inbound advisor chat request payload."""

    model_config = ConfigDict(extra="ignore")

    user_id: str
    message: str


class AdvisorSupportingItem(BaseModel):
    """Structured supporting item attached to advisor responses."""

    item_type: str
    title: str
    details: dict[str, Any] = Field(default_factory=dict)


class AdvisorChatResponse(BaseModel):
    """Outbound advisor chat response payload."""

    user_id: str
    detected_intent: str
    answer: str
    supporting_items: list[AdvisorSupportingItem] = Field(default_factory=list)
