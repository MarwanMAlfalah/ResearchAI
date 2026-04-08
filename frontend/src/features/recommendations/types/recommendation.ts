export type StrengthBucket = "high" | "medium" | "low";

export type RecommendationEvidence = {
  publication_year: number | null;
  cited_by_count: number | null;
  centrality_source: string;
  embedding_model: string | null;
  semantic_strength_bucket: StrengthBucket;
  centrality_strength_bucket: StrengthBucket;
  recency_strength_bucket: StrengthBucket;
};

export type ExplainedRecommendation = {
  paper_id: string;
  title: string | null;
  semantic_similarity: number;
  graph_centrality: number;
  recency: number;
  final_score: number;
  top_contributing_signals: string[];
  explanation_text: string;
  evidence: RecommendationEvidence;
};

export type ExplainedRecommendationsResponse = {
  user_id: string;
  recommendations: ExplainedRecommendation[];
};
