"""Service layer for user profile upsert and retrieval in Neo4j."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from app.db.neo4j import Neo4jClient
from app.models.user_profile import UserProfileResponse, UserProfileUpsertRequest


def upsert_user_profile(neo4j_client: Neo4jClient, payload: UserProfileUpsertRequest) -> UserProfileResponse:
    """Create or update a user profile and synchronize HAS_SKILL relationships."""

    normalized_skills = _normalize_skills(payload.skills)

    neo4j_client.run_write_query(
        query="""
        MERGE (u:UserProfile {user_id: $user_id})
        ON CREATE SET u.created_at = datetime()
        SET u.name = $name,
            u.interests_text = $interests_text,
            u.profile_text = $interests_text,
            u.updated_at = datetime(),
            u.interests_embedding = coalesce(u.interests_embedding, null),
            u.embedding_model = coalesce(u.embedding_model, null)
        """,
        parameters={
            "user_id": payload.user_id,
            "name": payload.name,
            "interests_text": payload.interests_text,
        },
    )

    neo4j_client.run_write_query(
        query="""
        MATCH (u:UserProfile {user_id: $user_id})
        OPTIONAL MATCH (u)-[r:HAS_SKILL]->(s:Skill)
        WHERE NOT s.name IN $skills
        DELETE r
        """,
        parameters={
            "user_id": payload.user_id,
            "skills": normalized_skills,
        },
    )

    if normalized_skills:
        neo4j_client.run_write_query(
            query="""
            MATCH (u:UserProfile {user_id: $user_id})
            UNWIND $skills AS skill_name
            MERGE (s:Skill {name: skill_name})
            ON CREATE SET s.created_at = datetime()
            SET s.updated_at = datetime()
            MERGE (u)-[:HAS_SKILL]->(s)
            """,
            parameters={
                "user_id": payload.user_id,
                "skills": normalized_skills,
            },
        )

    profile = get_user_profile(neo4j_client=neo4j_client, user_id=payload.user_id)
    if profile is None:
        raise RuntimeError("User profile upsert failed")

    return profile


def get_user_profile(neo4j_client: Neo4jClient, user_id: str) -> UserProfileResponse | None:
    """Fetch a user profile and linked skills by user ID."""

    rows = neo4j_client.run_read_query(
        query="""
        MATCH (u:UserProfile {user_id: $user_id})
        OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
        RETURN
            u.user_id AS user_id,
            u.name AS name,
            u.interests_text AS interests_text,
            u.interests_embedding AS interests_embedding,
            u.embedding_model AS embedding_model,
            u.created_at AS created_at,
            u.updated_at AS updated_at,
            collect(DISTINCT s.name) AS skills
        """,
        parameters={"user_id": user_id},
    )

    if not rows:
        return None

    row = rows[0]
    skills = sorted([skill for skill in (row.get("skills") or []) if isinstance(skill, str) and skill])

    return UserProfileResponse(
        user_id=str(row.get("user_id") or ""),
        name=str(row.get("name") or ""),
        interests_text=str(row.get("interests_text") or ""),
        interests_embedding=_to_float_list_or_none(row.get("interests_embedding")),
        embedding_model=row.get("embedding_model"),
        skills=skills,
        created_at=_to_iso_string(row.get("created_at")),
        updated_at=_to_iso_string(row.get("updated_at")),
    )


def _normalize_skills(skills: list[str]) -> list[str]:
    """Normalize skills list while preserving deterministic order and uniqueness."""

    seen: set[str] = set()
    normalized: list[str] = []

    for skill in skills:
        clean = skill.strip()
        if not clean:
            continue
        key = clean.casefold()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(clean)

    return normalized


def _to_iso_string(value: Any) -> str | None:
    """Convert Neo4j temporal values to ISO strings when possible."""

    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "iso_format") and callable(value.iso_format):
        return value.iso_format()
    if hasattr(value, "isoformat") and callable(value.isoformat):
        return value.isoformat()
    return str(value)


def _to_float_list_or_none(value: Any) -> list[float] | None:
    """Convert embedding value to float list when stored, otherwise None."""

    if value is None:
        return None
    if isinstance(value, list):
        out: list[float] = []
        for item in value:
            try:
                out.append(float(item))
            except (TypeError, ValueError):
                return None
        return out
    return None
