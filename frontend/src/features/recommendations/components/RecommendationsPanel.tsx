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
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading recommendations...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-rose-700">{error}</p>
      </section>
    );
  }

  if (hasFetched && recommendations.length === 0) {
    return (
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">No recommendations found for this user profile.</p>
      </section>
    );
  }

  if (!hasFetched) {
    return (
      <section className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6">
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
