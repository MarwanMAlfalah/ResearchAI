import { API_BASE_URL } from "../../../services/api";
import type { AdvisorChatRequest, AdvisorChatResponse } from "../types/advisor";

async function readErrorDetail(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail ?? fallback;
  } catch {
    return fallback;
  }
}

export async function sendAdvisorChat(payload: AdvisorChatRequest): Promise<AdvisorChatResponse> {
  const response = await fetch(`${API_BASE_URL}/advisor/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await readErrorDetail(response, "Advisor request failed.");
    throw new Error(detail);
  }

  return (await response.json()) as AdvisorChatResponse;
}
