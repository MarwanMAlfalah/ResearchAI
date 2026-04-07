"""Application configuration loaded from environment variables."""

from functools import lru_cache
from datetime import datetime

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings."""

    app_name: str = "ResearchGraph AI API"
    environment: str = Field(default="development")
    api_v1_prefix: str = "/api/v1"

    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    log_level: str = "INFO"

    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = "neo4j"
    neo4j_database: str = "neo4j"

    openalex_base_url: str = "https://api.openalex.org"
    openalex_timeout_seconds: float = 10.0

    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_device: str = "cpu"

    recommendation_alpha: float = 0.6
    recommendation_beta: float = 0.25
    recommendation_gamma: float = 0.15
    recommendation_recency_decay: float = 0.25
    recommendation_current_year: int = Field(default_factory=lambda: datetime.utcnow().year)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()
