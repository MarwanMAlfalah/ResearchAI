import type { UserProfileResponse } from "../../profile/types/profile";
import type { ExplainedRecommendation } from "../../recommendations/types/recommendation";
import type { SearchPaperResult } from "../../search/types/search";
import type { SkillGapResponse } from "../../skill-gap/types/skillGap";
import type { GraphData, GraphEdge, GraphNode } from "../types/graphExplorer";

function normalizeOpenAlexId(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.replace(/^https:\/\/openalex\.org\//i, "").trim() || null;
}

function upsertNode(nodes: Map<string, GraphNode>, node: GraphNode): void {
  if (!nodes.has(node.id)) {
    nodes.set(node.id, node);
  }
}

function upsertEdge(edges: Map<string, GraphEdge>, edge: GraphEdge): void {
  if (!edges.has(edge.id)) {
    edges.set(edge.id, edge);
  }
}

function relationId(source: string, target: string, relation: string): string {
  return `${source}-${relation}-${target}`;
}

export function buildGraphData(params: {
  profile: UserProfileResponse;
  recommendations: ExplainedRecommendation[];
  skillGap: SkillGapResponse;
  searchResults: SearchPaperResult[];
}): GraphData {
  const { profile, recommendations, skillGap, searchResults } = params;

  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  const userNodeId = `user:${profile.user_id}`;
  upsertNode(nodes, {
    id: userNodeId,
    type: "UserProfile",
    label: profile.name || profile.user_id,
    metadata: {
      user_id: profile.user_id,
      name: profile.name,
      interests_text: profile.interests_text,
      embedding_model: profile.embedding_model,
    },
  });

  profile.skills.forEach((skill) => {
    const skillId = `skill:${skill.toLowerCase()}`;
    upsertNode(nodes, {
      id: skillId,
      type: "Skill",
      label: skill,
      metadata: { source: "profile" },
    });
    upsertEdge(edges, {
      id: relationId(userNodeId, skillId, "HAS_SKILL"),
      source: userNodeId,
      target: skillId,
      relation: "HAS_SKILL",
    });
  });

  skillGap.suggested_next_skills.forEach((skill) => {
    const skillId = `skill:${skill.toLowerCase()}`;
    upsertNode(nodes, {
      id: skillId,
      type: "Skill",
      label: skill,
      metadata: { source: "suggested_next_skills" },
    });
    upsertEdge(edges, {
      id: relationId(userNodeId, skillId, "LACKS_SKILL"),
      source: userNodeId,
      target: skillId,
      relation: "LACKS_SKILL",
    });
  });

  const searchIndex = new Map<string, SearchPaperResult>();
  searchResults.forEach((paper) => {
    const openalexId = normalizeOpenAlexId((paper.ids.openalex as string | undefined) ?? null);
    if (openalexId) {
      searchIndex.set(openalexId, paper);
    }
  });

  recommendations.forEach((paper) => {
    const normalizedPaperId = normalizeOpenAlexId(paper.paper_id) ?? paper.paper_id;
    const paperNodeId = `paper:${normalizedPaperId}`;

    upsertNode(nodes, {
      id: paperNodeId,
      type: "Paper",
      label: paper.title ?? normalizedPaperId,
      metadata: {
        paper_id: paper.paper_id,
        final_score: paper.final_score,
        semantic_similarity: paper.semantic_similarity,
        graph_centrality: paper.graph_centrality,
        recency: paper.recency,
      },
    });

    upsertEdge(edges, {
      id: relationId(userNodeId, paperNodeId, "RECOMMENDED"),
      source: userNodeId,
      target: paperNodeId,
      relation: "RECOMMENDED",
    });

    const searchPaper = searchIndex.get(normalizedPaperId);
    if (!searchPaper) {
      return;
    }

    searchPaper.concepts.slice(0, 4).forEach((concept) => {
      if (!concept.name) {
        return;
      }
      const topicNodeId = `topic:${concept.name.toLowerCase()}`;
      upsertNode(nodes, {
        id: topicNodeId,
        type: "Topic",
        label: concept.name,
        metadata: {
          score: concept.score,
          openalex_id: concept.openalex_id,
        },
      });
      upsertEdge(edges, {
        id: relationId(paperNodeId, topicNodeId, "BELONGS_TO_TOPIC"),
        source: paperNodeId,
        target: topicNodeId,
        relation: "BELONGS_TO_TOPIC",
      });
    });

    searchPaper.authors.slice(0, 5).forEach((author) => {
      const authorName = author.name?.trim();
      if (!authorName) {
        return;
      }
      const authorNodeId = `author:${authorName.toLowerCase()}`;
      upsertNode(nodes, {
        id: authorNodeId,
        type: "Author",
        label: authorName,
        metadata: {
          openalex_id: author.openalex_id,
          orcid: author.orcid,
        },
      });
      upsertEdge(edges, {
        id: relationId(paperNodeId, authorNodeId, "WRITTEN_BY"),
        source: paperNodeId,
        target: authorNodeId,
        relation: "WRITTEN_BY",
      });
    });
  });

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
}
