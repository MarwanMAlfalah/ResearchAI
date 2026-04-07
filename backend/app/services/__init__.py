"""Service layer exports."""

from app.services.ingestion_service import import_normalized_paper

__all__ = ["import_normalized_paper"]
