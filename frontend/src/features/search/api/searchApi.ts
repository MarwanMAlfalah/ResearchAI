import { API_BASE_URL } from "../../../services/api";
import type { ImportPaperResponse, SearchPaperResult } from "../types/search";

async function readErrorDetail(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail ?? fallback;
  } catch {
    return fallback;
  }
}

export async function searchPapers(query: string, limit: number): Promise<SearchPaperResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  const response = await fetch(`${API_BASE_URL}/search/papers?${params.toString()}`);

  if (!response.ok) {
    const detail = await readErrorDetail(response, "Failed to search papers.");
    throw new Error(detail);
  }

  return (await response.json()) as SearchPaperResult[];
}

function normalizeOpenAlexId(value: string): string {
  const clean = value.trim();
  return clean.replace(/^https:\/\/openalex\.org\//i, "");
}

export async function importPaperByOpenAlexId(openalexId: string): Promise<ImportPaperResponse> {
  const normalizedId = normalizeOpenAlexId(openalexId);
  const response = await fetch(`${API_BASE_URL}/import/paper/${encodeURIComponent(normalizedId)}`, {
    method: "POST",
  });

  if (!response.ok) {
    const detail = await readErrorDetail(response, "Failed to import paper.");
    throw new Error(detail);
  }

  return (await response.json()) as ImportPaperResponse;
}

export function getOpenAlexId(result: SearchPaperResult): string | null {
  const raw = result.ids.openalex;
  if (!raw) {
    return null;
  }

  return normalizeOpenAlexId(raw);
}
