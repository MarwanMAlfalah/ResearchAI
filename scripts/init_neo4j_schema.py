"""Initialize Neo4j constraints and indexes for ResearchGraph AI."""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings  # noqa: E402
from app.db.graph_schema import (  # noqa: E402
    NODE_LABELS,
    RELATIONSHIP_TYPES,
    get_constraint_statements,
    get_index_statements,
    get_initialization_statements,
)
from app.db.neo4j import Neo4jClient, Neo4jClientError  # noqa: E402
from app.utils.logging import configure_logging  # noqa: E402


def main() -> None:
    """Apply Neo4j schema statements to the configured database."""

    settings = get_settings()
    configure_logging(settings.log_level)

    client = Neo4jClient(
        uri=settings.neo4j_uri,
        username=settings.neo4j_username,
        password=settings.neo4j_password,
        database=settings.neo4j_database,
    )

    print("Ontology -> Neo4j label mapping:")
    for ontology_class, label in NODE_LABELS.items():
        print(f"  {ontology_class} -> {label}")

    print("\nOntology -> Neo4j relationship mapping:")
    for ontology_relation, rel_type in RELATIONSHIP_TYPES.items():
        print(f"  {ontology_relation} -> {rel_type}")

    try:
        client.connect()

        statements = get_initialization_statements()
        print(f"\nApplying {len(get_constraint_statements())} constraints and {len(get_index_statements())} indexes...")

        for statement in statements:
            client.run_write_query(statement)
            print(f"  OK: {statement}")

        print("\nNeo4j schema initialization complete.")
    except Neo4jClientError as exc:
        raise SystemExit(f"Neo4j schema initialization failed: {exc}") from exc
    finally:
        try:
            client.close()
        except Neo4jClientError:
            pass


if __name__ == "__main__":
    main()
