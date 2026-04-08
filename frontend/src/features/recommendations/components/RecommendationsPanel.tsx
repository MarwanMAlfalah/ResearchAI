import type { ExplainedRecommendation } from "../types/recommendation";
import RecommendationCard from "./RecommendationCard";

type RecommendationsPanelProps = {
  recommendations: ExplainedRecommendation[];
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
};

export default function RecommendationsPanel({
  recommendations,
  loading,
  error,
  hasFetched,
}: RecommendationsPanelProps): JSX.Element {
  if (loading) {
    return (
      <section className="state-panel state-panel-loading mt-6">
        <p className="text-sm text-slate-600">Loading recommendations...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="state-panel state-panel-error mt-6">
        <p className="text-sm font-medium text-rose-700">{error}</p>
      </section>
    );
  }

  if (hasFetched && recommendations.length === 0) {
    return (
      <section className="state-panel state-panel-empty mt-6 border-slate-200">
        <p className="text-sm text-slate-600">No recommendations found for this user profile.</p>
      </section>
    );
  }

  if (!hasFetched) {
    return (
      <section className="state-panel state-panel-empty mt-6 border-dashed">
        <p className="text-sm text-slate-600">Enter a user ID and fetch recommendations to begin.</p>
      </section>
    );
  }

  return (
    <section className="mt-6 grid gap-4">
      {recommendations.map((recommendation) => (
        <RecommendationCard key={recommendation.paper_id} recommendation={recommendation} />
      ))}
    </section>
  );
}
