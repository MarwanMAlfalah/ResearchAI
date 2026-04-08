export type GraphNodeType = "UserProfile" | "Skill" | "Paper" | "Topic" | "Author";

export type GraphNode = {
  id: string;
  type: GraphNodeType;
  label: string;
  metadata: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  relation: string;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphFilterState = Record<GraphNodeType, boolean>;

export const DEFAULT_GRAPH_FILTERS: GraphFilterState = {
  UserProfile: true,
  Skill: true,
  Paper: true,
  Topic: true,
  Author: true,
};
