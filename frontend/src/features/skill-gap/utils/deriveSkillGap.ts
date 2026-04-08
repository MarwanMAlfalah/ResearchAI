import type { ExplainedRecommendation } from "../../recommendations/types/recommendation";
import type { SkillGapDataSource, SkillGapViewModel } from "../types/skillGap";

const MAX_SUGGESTED_SKILLS = 6;

const SKILL_CATALOG: string[] = [
  "python",
  "machine learning",
  "deep learning",
  "natural language processing",
  "transformers",
  "sentence transformers",
  "embeddings",
  "knowledge graphs",
  "ontology engineering",
  "neo4j",
  "graph databases",
  "graph neural networks",
  "link prediction",
  "recommender systems",
  "information retrieval",
  "data mining",
  "network analysis",
  "scientific writing",
  "statistics",
  "rdflib",
  "owlready2",
  "spacy",
  "keybert",
  "cytoscape",
  "fastapi",
  "typescript",
  "react",
];

function normalizeSkill(value: string): string {
  return value.trim().toLowerCase();
}

function titleCaseSkill(value: string): string {
  return value
    .split(" ")
    .map((token) => (token.length === 0 ? token : token.charAt(0).toUpperCase() + token.slice(1)))
    .join(" ");
}

function recommendationEvidenceWeight(item: ExplainedRecommendation): number {
  if (item.final_score >= 0.75) {
    return 1.5;
  }

  if (item.final_score >= 0.5) {
    return 1.2;
  }

  return 1;
}

function collectSkillCandidates(
  recommendations: ExplainedRecommendation[],
  interestsText: string
): Map<string, { score: number; evidenceCount: number }> {
  const aggregate = new Map<string, { score: number; evidenceCount: number }>();
  const interests = interestsText.toLowerCase();

  SKILL_CATALOG.forEach((skill) => {
    if (interests.includes(skill)) {
      aggregate.set(skill, { score: 1.5, evidenceCount: 1 });
    }
  });

  recommendations.forEach((item) => {
    const haystack = `${item.title ?? ""} ${item.explanation_text}`.toLowerCase();
    const weight = recommendationEvidenceWeight(item);

    SKILL_CATALOG.forEach((skill) => {
      if (!haystack.includes(skill)) {
        return;
      }

      const existing = aggregate.get(skill);
      if (existing) {
        aggregate.set(skill, {
          score: existing.score + weight,
          evidenceCount: existing.evidenceCount + 1,
        });
      } else {
        aggregate.set(skill, {
          score: weight,
          evidenceCount: 1,
        });
      }
    });
  });

  return aggregate;
}

export function deriveSkillGapViewModel({ profile, recommendations }: SkillGapDataSource): SkillGapViewModel {
  const currentSkills = profile.skills.map((skill) => skill.trim()).filter((skill) => skill.length > 0);
  const currentSkillSet = new Set(currentSkills.map(normalizeSkill));

  const candidates = collectSkillCandidates(recommendations, profile.interests_text);

  const missingSkills = Array.from(candidates.entries())
    .filter(([skill]) => !currentSkillSet.has(skill))
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, MAX_SUGGESTED_SKILLS)
    .map(([skill, metrics]) => ({
      name: titleCaseSkill(skill),
      confidence: Number(Math.min(metrics.score / 5, 1).toFixed(2)),
      evidence_count: metrics.evidenceCount,
    }));

  const strengths = currentSkills.slice(0, 6);
  const gaps = missingSkills.map((skill) => skill.name);
  const suggestedNextSkills = gaps.slice(0, 3);

  return {
    user_id: profile.user_id,
    current_skills: currentSkills,
    missing_skills: missingSkills,
    summary: {
      strengths,
      gaps,
      suggested_next_skills: suggestedNextSkills,
    },
  };
}
