import { EmptyState, StatusPanel } from "../../../components/ui";
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
      <StatusPanel tone="loading" title="Loading recommendations">
        Pulling ranked papers and explanation evidence from the recommendation service.
      </StatusPanel>
    );
  }

  if (error) {
    return (
      <StatusPanel tone="error" title="Recommendation request failed">
        {error}
      </StatusPanel>
    );
  }

  if (hasFetched && recommendations.length === 0) {
    return (
      <EmptyState
        title="No recommendations returned"
        description="This user profile did not produce any recommendation candidates yet. Try updating the profile or increasing the result limit."
      />
    );
  }

  if (!hasFetched) {
    return (
      <EmptyState
        title="No recommendation run yet"
        description="Choose a user and fetch recommendations to review ranking scores, evidence, and explanation signals."
      />
    );
  }

  return (
    <section className="grid gap-5">
      {recommendations.map((recommendation, index) => (
        <RecommendationCard key={recommendation.paper_id} recommendation={recommendation} rank={index + 1} />
      ))}
    </section>
  );
}
