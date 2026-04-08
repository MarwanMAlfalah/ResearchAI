import type { GraphNodeType } from "../types/graphExplorer";

export type NodeVisualStyle = {
  color: string;
  borderColor: string;
  size: number;
};

export const NODE_TYPE_STYLES: Record<GraphNodeType, NodeVisualStyle> = {
  UserProfile: {
    color: "#1d4ed8",
    borderColor: "#1e3a8a",
    size: 46,
  },
  Skill: {
    color: "#0f766e",
    borderColor: "#134e4a",
    size: 30,
  },
  Paper: {
    color: "#7c3aed",
    borderColor: "#581c87",
    size: 36,
  },
  Topic: {
    color: "#b45309",
    borderColor: "#7c2d12",
    size: 28,
  },
  Author: {
    color: "#475569",
    borderColor: "#1e293b",
    size: 26,
  },
};

export function truncateNodeLabel(value: string, maxLength: number = 26): string {
  const clean = value.trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1)}…`;
}
