"""Ontology schema definition for ResearchGraph AI using OWLReady2."""

from __future__ import annotations

from pathlib import Path

from owlready2 import ObjectProperty, Ontology, SymmetricProperty, Thing, get_ontology

DEFAULT_BASE_IRI = "http://researchgraph.ai/ontology#"


def create_researchgraph_ontology(base_iri: str = DEFAULT_BASE_IRI) -> Ontology:
    """Create and return the ResearchGraph ontology instance.

    The ontology includes core research entities and the initial set of
    relationship types required by the project plan.
    """

    ontology = get_ontology(base_iri)

    with ontology:
        class Paper(Thing):
            """A scholarly paper or publication."""

        class Author(Thing):
            """A person credited for writing a paper."""

        class Topic(Thing):
            """A research topic or theme extracted from content."""

        class Method(Thing):
            """A research method used by a paper."""

        class Skill(Thing):
            """A competency relevant to research execution."""

        class Dataset(Thing):
            """A dataset used in or referenced by research."""

        class ResearchArea(Thing):
            """A broad academic area or domain."""

        class UserProfile(Thing):
            """An end-user profile with interests and skills."""

        class WRITTEN_BY(ObjectProperty):
            """Links a paper to its author(s)."""

            domain = [Paper]
            range = [Author]

        class BELONGS_TO_TOPIC(ObjectProperty):
            """Links a paper to one or more topics."""

            domain = [Paper]
            range = [Topic]

        class USES_METHOD(ObjectProperty):
            """Links a paper to methods used in the work."""

            domain = [Paper]
            range = [Method]

        class REQUIRES_SKILL(ObjectProperty):
            """Links a method to the skill(s) needed to apply it."""

            domain = [Method]
            range = [Skill]

        class RELATED_TO(SymmetricProperty, ObjectProperty):
            """Generic symmetric relation for semantically related entities."""

            domain = [Thing]
            range = [Thing]

        class CITES(ObjectProperty):
            """Links a paper to another paper it cites."""

            domain = [Paper]
            range = [Paper]

        class INTERESTED_IN(ObjectProperty):
            """Links a user profile to research topics of interest."""

            domain = [UserProfile]
            range = [Topic]

        class HAS_SKILL(ObjectProperty):
            """Links a user profile to skills already possessed."""

            domain = [UserProfile]
            range = [Skill]

        class LACKS_SKILL(ObjectProperty):
            """Links a user profile to skills not yet possessed."""

            domain = [UserProfile]
            range = [Skill]

        class USES_DATASET(ObjectProperty):
            """Links a paper to datasets it uses."""

            domain = [Paper]
            range = [Dataset]

        class IN_AREA(ObjectProperty):
            """Links a paper to its broader research area."""

            domain = [Paper]
            range = [ResearchArea]

        class SIMILAR_TO(SymmetricProperty, ObjectProperty):
            """Symmetric similarity relation across entities."""

            domain = [Thing]
            range = [Thing]

    return ontology


def export_ontology(output_path: str | Path, base_iri: str = DEFAULT_BASE_IRI) -> Path:
    """Generate and save the ontology as an OWL file."""

    target = Path(output_path)
    target.parent.mkdir(parents=True, exist_ok=True)

    ontology = create_researchgraph_ontology(base_iri=base_iri)
    ontology.save(file=str(target), format="rdfxml")
    return target
