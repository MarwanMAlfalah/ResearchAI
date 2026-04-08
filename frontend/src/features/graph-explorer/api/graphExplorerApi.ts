import { getUserProfile } from "../../profile/api/profileApi";
import { fetchExplainedRecommendations } from "../../recommendations/api/recommendationsApi";
import { searchPapers } from "../../search/api/searchApi";
import { fetchSkillGapAnalysis } from "../../skill-gap/api/skillGapApi";
import type { GraphData } from "../types/graphExplorer";
import { buildGraphData } from "../utils/buildGraphData";

export async function fetchGraphExplorerData(userId: string, limit: number): Promise<GraphData> {
  const profile = await getUserProfile(userId);

  const query = profile.interests_text.trim().length > 0 ? profile.interests_text : "research methods";

  const [recommendationResponse, skillGapResponse, searchResults] = await Promise.all([
    fetchExplainedRecommendations(userId, limit),
    fetchSkillGapAnalysis(userId, limit),
    searchPapers(query, limit),
  ]);

  return buildGraphData({
    profile,
    recommendations: recommendationResponse.recommendations,
    skillGap: skillGapResponse,
    searchResults,
  });
}
