import type { ExplainedRecommendationsResponse } from "../types/recommendation";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000/api/v1";

export async function fetchExplainedRecommendations(
  userId: string,
  limit: number
): Promise<ExplainedRecommendationsResponse> {
  const params = new URLSearchParams({
    user_id: userId,
    limit: String(limit),
  });

  const response = await fetch(`${API_BASE_URL}/recommend/papers/explained?${params.toString()}`);

  if (!response.ok) {
    let detail = "Failed to fetch recommendations.";

    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        detail = body.detail;
      }
    } catch {
      // Keep default detail when body is not JSON.
    }

    throw new Error(detail);
  }

  return (await response.json()) as ExplainedRecommendationsResponse;
}
