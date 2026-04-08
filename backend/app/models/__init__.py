"""Domain and request/response models."""

from app.models.ingestion import (
    NormalizedAuthor,
    NormalizedConcept,
    NormalizedPaper,
    OpenAlexBatchImportItemResult,
    OpenAlexBatchImportRequest,
    OpenAlexBatchImportResponse,
    OpenAlexPaperImportResponse,
    PaperImportResult,
)
from app.models.recommendation import (
    ExplainedPaperRecommendation,
    ExplainedPaperRecommendationResponse,
    RecommendationEvidence,
    ScoredPaperRecommendation,
    ScoredPaperRecommendationResponse,
    SemanticPaperRecommendation,
    SemanticPaperRecommendationResponse,
)
from app.models.user_profile import UserProfileResponse, UserProfileUpsertRequest

__all__ = [
    "NormalizedAuthor",
    "NormalizedConcept",
    "NormalizedPaper",
    "PaperImportResult",
    "OpenAlexPaperImportResponse",
    "OpenAlexBatchImportRequest",
    "OpenAlexBatchImportItemResult",
    "OpenAlexBatchImportResponse",
    "UserProfileUpsertRequest",
    "UserProfileResponse",
    "SemanticPaperRecommendation",
    "SemanticPaperRecommendationResponse",
    "ScoredPaperRecommendation",
    "ScoredPaperRecommendationResponse",
    "ExplainedPaperRecommendation",
    "ExplainedPaperRecommendationResponse",
    "RecommendationEvidence",
]
