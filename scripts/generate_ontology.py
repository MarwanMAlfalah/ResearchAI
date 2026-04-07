"""Generate and export the ResearchGraph AI ontology locally."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.ontology import DEFAULT_BASE_IRI, export_ontology  # noqa: E402


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for ontology export."""

    parser = argparse.ArgumentParser(description="Generate ResearchGraph AI ontology OWL file")
    parser.add_argument(
        "--output",
        default=str(PROJECT_ROOT / "data" / "ontology" / "researchgraph.owl"),
        help="Output OWL file path",
    )
    parser.add_argument(
        "--base-iri",
        default=DEFAULT_BASE_IRI,
        help="Base IRI for ontology namespace",
    )
    return parser.parse_args()


def main() -> None:
    """Generate ontology and print export location."""

    args = parse_args()
    output_path = export_ontology(output_path=args.output, base_iri=args.base_iri)
    print(f"Ontology exported: {output_path}")


if __name__ == "__main__":
    main()
