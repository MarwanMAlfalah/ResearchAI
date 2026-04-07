"""Service layer for ingesting normalized papers into Neo4j."""

from __future__ import annotations

import logging
import re
from typing import Any

from app.ai.embeddings import get_embedding_service
from app.core.config import get_settings
from app.db.neo4j import Neo4jClient
from app.models.ingestion import NormalizedPaper, PaperImportResult

logger = logging.getLogger(__name__)

_OPENALEX_PREFIX = "https://openalex.org/"


def import_normalized_paper(neo4j_client: Neo4jClient, paper: NormalizedPaper) -> PaperImportResult:
    """Import one normalized paper payload into Neo4j using idempotent MERGE upserts."""

    paper_id = _extract_paper_id(paper)
    if not paper_id:
        raise ValueError("Paper payload must include ids.openalex (or ids.OpenAlex) for paper_id")

    settings = get_settings()
    embedding_model = settings.embedding_model_name
    existing_paper = _get_existing_paper_core(neo4j_client=neo4j_client, paper_id=paper_id)
    paper_embedding = _compute_or_reuse_paper_embedding(
        settings=settings,
        existing_paper=existing_paper,
        title=paper.title,
        abstract=paper.abstract,
    )

    paper_params = {
        "paper_id": paper_id,
        "title": paper.title,
        "abstract": paper.abstract,
        "publication_year": paper.publication_year,
        "cited_by_count": paper.cited_by_count,
        "doi": _extract_doi(paper.ids),
        "paper_embedding": paper_embedding,
        "embedding_model": embedding_model,
    }

    authors = _normalize_authors(paper)
    topics = _normalize_topics(paper)

    query = """
    MERGE (p:Paper {paper_id: $paper.paper_id})
    ON CREATE SET p.created_at = datetime()
    SET p.title = $paper.title,
        p.abstract = $paper.abstract,
        p.publication_year = $paper.publication_year,
        p.cited_by_count = $paper.cited_by_count,
        p.doi = $paper.doi,
        p.paper_embedding = $paper.paper_embedding,
        p.embedding_model = $paper.embedding_model,
        p.updated_at = datetime()

    WITH p
    UNWIND $authors AS author
    WITH p, author
    WHERE author.author_id IS NOT NULL AND author.author_id <> ""
    MERGE (a:Author {author_id: author.author_id})
    ON CREATE SET a.created_at = datetime()
    SET a.name = author.name,
        a.orcid = coalesce(author.orcid, a.orcid),
        a.updated_at = datetime()
    MERGE (p)-[:WRITTEN_BY]->(a)

    WITH p
    UNWIND $topics AS topic
    WITH p, topic
    WHERE topic.name IS NOT NULL AND topic.name <> ""
    MERGE (t:Topic {name: topic.name})
    ON CREATE SET t.created_at = datetime()
    SET t.topic_id = coalesce(topic.topic_id, t.topic_id),
        t.updated_at = datetime()
    MERGE (p)-[r:BELONGS_TO_TOPIC]->(t)
    SET r.score = topic.score,
        r.updated_at = datetime()

    RETURN p.paper_id AS paper_id
    """

    result = neo4j_client.run_write_query(
        query=query,
        parameters={
            "paper": paper_params,
            "authors": authors,
            "topics": topics,
        },
    )

    if not result:
        raise RuntimeError("Neo4j upsert did not return a result")

    author_ids = sorted({a["author_id"] for a in authors if a.get("author_id")})
    topic_names = sorted({t["name"] for t in topics if t.get("name")})

    logger.info(
        "Imported paper into Neo4j",
        extra={
            "paper_id": paper_id,
            "authors": len(author_ids),
            "topics": len(topic_names),
        },
    )

    return PaperImportResult(
        paper_id=result[0]["paper_id"],
        authors_merged=len(author_ids),
        topics_merged=len(topic_names),
        author_ids=author_ids,
        topic_names=topic_names,
    )


def _compute_or_reuse_paper_embedding(
    settings: Any,
    existing_paper: dict[str, object],
    title: str | None,
    abstract: str | None,
) -> list[float] | None:
    """Compute paper embedding unless existing one can be safely reused."""

    existing_embedding = _to_float_list_or_none(existing_paper.get("paper_embedding"))
    if (
        existing_embedding is not None
        and existing_paper.get("title") == title
        and existing_paper.get("abstract") == abstract
        and existing_paper.get("embedding_model") == settings.embedding_model_name
    ):
        return existing_embedding

    embedding_service = get_embedding_service(
        model_name=settings.embedding_model_name,
        device=settings.embedding_device,
    )
    return embedding_service.generate_paper_embedding(title=title, abstract=abstract)


def _get_existing_paper_core(neo4j_client: Neo4jClient, paper_id: str) -> dict[str, object]:
    """Return existing paper fields used to determine embedding reuse."""

    rows = neo4j_client.run_read_query(
        query="""
        MATCH (p:Paper {paper_id: $paper_id})
        RETURN
            p.title AS title,
            p.abstract AS abstract,
            p.paper_embedding AS paper_embedding,
            p.embedding_model AS embedding_model
        LIMIT 1
        """,
        parameters={"paper_id": paper_id},
    )
    return rows[0] if rows else {}


def _extract_paper_id(paper: NormalizedPaper) -> str | None:
    """Resolve canonical paper identifier from normalized IDs."""

    candidates = [
        paper.ids.get("openalex"),
        paper.ids.get("OpenAlex"),
        paper.ids.get("id"),
    ]

    for candidate in candidates:
        if isinstance(candidate, str) and candidate.strip():
            return _normalize_openalex_id(candidate)

    return None


def _extract_doi(ids: dict[str, object]) -> str | None:
    """Extract DOI from normalized IDs map when present."""

    doi = ids.get("doi") or ids.get("DOI")
    if isinstance(doi, str) and doi.strip():
        return doi.strip()
    return None


def _normalize_authors(paper: NormalizedPaper) -> list[dict[str, str | None]]:
    """Normalize author payload for Cypher parameters."""

    normalized: list[dict[str, str | None]] = []

    for author in paper.authors:
        author_id = _resolve_author_id(author.openalex_id, author.orcid, author.name)
        if not author_id:
            continue

        normalized.append(
            {
                "author_id": author_id,
                "name": author.name,
                "orcid": author.orcid,
            }
        )

    return normalized


def _normalize_topics(paper: NormalizedPaper) -> list[dict[str, str | float | None]]:
    """Normalize concept/topic payload for Cypher parameters."""

    normalized: list[dict[str, str | float | None]] = []

    for concept in paper.concepts:
        if not concept.name:
            continue

        normalized.append(
            {
                "name": concept.name.strip(),
                "topic_id": _normalize_openalex_id(concept.openalex_id) if concept.openalex_id else None,
                "score": concept.score,
            }
        )

    return normalized


def _resolve_author_id(openalex_id: str | None, orcid: str | None, name: str | None) -> str | None:
    """Resolve stable author identifier with OpenAlex-first strategy."""

    if openalex_id and openalex_id.strip():
        return _normalize_openalex_id(openalex_id)

    if orcid and orcid.strip():
        return orcid.strip()

    if name and name.strip():
        slug = re.sub(r"[^a-z0-9]+", "_", name.strip().lower()).strip("_")
        return f"name::{slug}" if slug else None

    return None


def _normalize_openalex_id(identifier: str) -> str:
    """Normalize OpenAlex entity identifier to compact token form."""

    clean = identifier.strip()
    if clean.startswith(_OPENALEX_PREFIX):
        return clean.removeprefix(_OPENALEX_PREFIX)
    return clean


def _to_float_list_or_none(value: object) -> list[float] | None:
    """Convert Neo4j stored vector values into a float list when possible."""

    if value is None:
        return None
    if isinstance(value, list):
        out: list[float] = []
        for item in value:
            try:
                out.append(float(item))
            except (TypeError, ValueError):
                return None
        return out if out else None
    return None
