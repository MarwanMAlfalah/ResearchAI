"""Neo4j graph schema aligned with the ResearchGraph ontology."""

from __future__ import annotations

# Ontology class -> Neo4j node label mapping.
NODE_LABELS: dict[str, str] = {
    "Paper": "Paper",
    "Author": "Author",
    "Topic": "Topic",
    "Method": "Method",
    "Skill": "Skill",
    "Dataset": "Dataset",
    "ResearchArea": "ResearchArea",
    "UserProfile": "UserProfile",
}

# Ontology object property -> Neo4j relationship type mapping.
RELATIONSHIP_TYPES: dict[str, str] = {
    "WRITTEN_BY": "WRITTEN_BY",
    "BELONGS_TO_TOPIC": "BELONGS_TO_TOPIC",
    "USES_METHOD": "USES_METHOD",
    "REQUIRES_SKILL": "REQUIRES_SKILL",
    "RELATED_TO": "RELATED_TO",
    "CITES": "CITES",
    "INTERESTED_IN": "INTERESTED_IN",
    "HAS_SKILL": "HAS_SKILL",
    "LACKS_SKILL": "LACKS_SKILL",
    "USES_DATASET": "USES_DATASET",
    "IN_AREA": "IN_AREA",
    "SIMILAR_TO": "SIMILAR_TO",
}


def get_constraint_statements() -> list[str]:
    """Return schema constraints for deterministic node identity."""

    return [
        "CREATE CONSTRAINT paper_paper_id_unique IF NOT EXISTS FOR (n:Paper) REQUIRE n.paper_id IS UNIQUE",
        "CREATE CONSTRAINT author_author_id_unique IF NOT EXISTS FOR (n:Author) REQUIRE n.author_id IS UNIQUE",
        "CREATE CONSTRAINT topic_name_unique IF NOT EXISTS FOR (n:Topic) REQUIRE n.name IS UNIQUE",
        "CREATE CONSTRAINT method_name_unique IF NOT EXISTS FOR (n:Method) REQUIRE n.name IS UNIQUE",
        "CREATE CONSTRAINT skill_name_unique IF NOT EXISTS FOR (n:Skill) REQUIRE n.name IS UNIQUE",
        "CREATE CONSTRAINT dataset_dataset_id_unique IF NOT EXISTS FOR (n:Dataset) REQUIRE n.dataset_id IS UNIQUE",
        "CREATE CONSTRAINT research_area_name_unique IF NOT EXISTS FOR (n:ResearchArea) REQUIRE n.name IS UNIQUE",
        "CREATE CONSTRAINT user_profile_user_id_unique IF NOT EXISTS FOR (n:UserProfile) REQUIRE n.user_id IS UNIQUE",
    ]


def get_index_statements() -> list[str]:
    """Return additional indexes for common filtering and ranking workloads."""

    return [
        "CREATE INDEX paper_title_idx IF NOT EXISTS FOR (n:Paper) ON (n.title)",
        "CREATE INDEX paper_publication_year_idx IF NOT EXISTS FOR (n:Paper) ON (n.publication_year)",
        "CREATE INDEX paper_published_date_idx IF NOT EXISTS FOR (n:Paper) ON (n.published_date)",
        "CREATE INDEX topic_name_idx IF NOT EXISTS FOR (n:Topic) ON (n.name)",
        "CREATE INDEX method_name_idx IF NOT EXISTS FOR (n:Method) ON (n.name)",
        "CREATE INDEX skill_name_idx IF NOT EXISTS FOR (n:Skill) ON (n.name)",
        "CREATE INDEX user_profile_updated_at_idx IF NOT EXISTS FOR (n:UserProfile) ON (n.updated_at)",
        "CREATE INDEX similar_to_score_idx IF NOT EXISTS FOR ()-[r:SIMILAR_TO]-() ON (r.score)",
        "CREATE INDEX related_to_score_idx IF NOT EXISTS FOR ()-[r:RELATED_TO]-() ON (r.score)",
        "CREATE INDEX cites_weight_idx IF NOT EXISTS FOR ()-[r:CITES]-() ON (r.weight)",
    ]


def get_initialization_statements() -> list[str]:
    """Return all schema initialization statements in execution order."""

    return [*get_constraint_statements(), *get_index_statements()]
