import { API_BASE_URL } from "../../../services/api";
import type { UserProfileResponse, UserProfileUpsertRequest } from "../types/profile";

async function readErrorDetail(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getUserProfile(userId: string): Promise<UserProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/user/profile/${encodeURIComponent(userId)}`);

  if (!response.ok) {
    const detail = await readErrorDetail(response, "Failed to load profile.");
    throw new Error(detail);
  }

  return (await response.json()) as UserProfileResponse;
}

export async function saveUserProfile(payload: UserProfileUpsertRequest): Promise<UserProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await readErrorDetail(response, "Failed to save profile.");
    throw new Error(detail);
  }

  return (await response.json()) as UserProfileResponse;
}
