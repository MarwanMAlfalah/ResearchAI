import type { UserProfileResponse } from "../../profile/types/profile";
import type { ExplainedRecommendation } from "../../recommendations/types/recommendation";

export type SkillGapDataSource = {
  profile: UserProfileResponse;
  recommendations: ExplainedRecommendation[];
};

export type DerivedSkill = {
  name: string;
  confidence: number;
  evidence_count: number;
};

export type SkillGapSummary = {
  strengths: string[];
  gaps: string[];
  suggested_next_skills: string[];
};

export type SkillGapViewModel = {
  user_id: string;
  current_skills: string[];
  missing_skills: DerivedSkill[];
  summary: SkillGapSummary;
};
