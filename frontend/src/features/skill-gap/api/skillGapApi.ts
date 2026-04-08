import { API_BASE_URL } from "../../../services/api";
import type { SkillGapResponse } from "../types/skillGap";

async function readErrorDetail(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchSkillGapAnalysis(userId: string, limit: number): Promise<SkillGapResponse> {
  const params = new URLSearchParams({
    user_id: userId,
    limit: String(limit),
  });

  const response = await fetch(`${API_BASE_URL}/skill-gap?${params.toString()}`);

  if (!response.ok) {
    const detail = await readErrorDetail(response, "Failed to fetch skill gap analysis.");
    throw new Error(detail);
  }

  return (await response.json()) as SkillGapResponse;
}
