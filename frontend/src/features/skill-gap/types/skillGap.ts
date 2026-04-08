export type SkillGapEvidenceSource = {
  paper_id: string;
  title: string | null;
  final_score: number;
  matched_fields: string[];
  top_contributing_signals: string[];
};

export type MissingSkillEvidence = {
  skill: string;
  confidence: number;
  evidence_count: number;
  supporting_papers: SkillGapEvidenceSource[];
  rationale: string;
};

export type SkillGapResponse = {
  user_id: string;
  current_skills: string[];
  missing_skills: MissingSkillEvidence[];
  suggested_next_skills: string[];
  strengths: string[];
  gaps_summary: string;
};
