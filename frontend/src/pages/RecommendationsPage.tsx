import { FormEvent, useEffect, useMemo, useState } from "react";

import { ActionBar, Button, FormField, PageHeader, Pill, StatCard } from "../components/ui";
import { fetchExplainedRecommendations } from "../features/recommendations/api/recommendationsApi";
import RecommendationsPanel from "../features/recommendations/components/RecommendationsPanel";
import type { ExplainedRecommendation } from "../features/recommendations/types/recommendation";

const DEFAULT_USER_ID = "user_001";
const DEFAULT_LIMIT = 5;

type RecommendationsPageProps = {
  initialUserId?: string;
  onUserIdChange?: (userId: string) => void;
};

export default function RecommendationsPage({
  initialUserId,
  onUserIdChange,
}: RecommendationsPageProps): JSX.Element {
  const [userId, setUserId] = useState<string>(initialUserId ?? DEFAULT_USER_ID);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [recommendations, setRecommendations] = useState<ExplainedRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  useEffect(() => {
    if (!initialUserId) {
      return;
    }
    setUserId((prev) => (prev === initialUserId ? prev : initialUserId));
  }, [initialUserId]);

  function handleUserIdChange(nextUserId: string): void {
    setUserId(nextUserId);
    onUserIdChange?.(nextUserId);
  }

  const recommendationCount = useMemo(() => recommendations.length, [recommendations.length]);
  const topScore = useMemo(
    () => (recommendations.length > 0 ? recommendations[0].final_score.toFixed(3) : "N/A"),
    [recommendations]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const data = await fetchExplainedRecommendations(userId.trim(), limit);
      setRecommendations(data.recommendations);
      setHasFetched(true);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Unable to fetch recommendations.";
      setError(message);
      setRecommendations([]);
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="app-container">
        <PageHeader
          eyebrow="Ranking Workspace"
          title="Explained recommendations"
          description="Review semantically ranked papers in a product-style queue with clear score breakdowns, evidence signals, and easy-to-scan explanation blocks."
          meta={
            <>
              <span>Prefilled from active workspace context.</span>
              <Pill tone={hasFetched ? "success" : "muted"}>{hasFetched ? "Results ready" : "Awaiting fetch"}</Pill>
            </>
          }
          stats={
            <>
              <StatCard label="User Context" value={userId || "Unassigned"} hint="Used for the recommendation request." />
              <StatCard label="Results" value={hasFetched ? recommendationCount : 0} hint="Recommendation cards returned." tone="accent" />
              <StatCard label="Top Score" value={topScore} hint="Highest final score in the current result set." tone="success" />
            </>
          }
        />

        <form onSubmit={handleSubmit}>
          <ActionBar>
            <div className="grid flex-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
              <FormField label="User ID" hint="Matches the active researcher context from the top shell.">
                <input
                  className="input-control"
                  value={userId}
                  onChange={(event) => handleUserIdChange(event.target.value)}
                  placeholder="Enter user ID"
                  required
                />
              </FormField>

              <FormField label="Limit" hint="Choose how many ranked papers to review in this pass.">
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="input-control"
                  value={limit}
                  onChange={(event) => setLimit(Number(event.target.value))}
                  required
                />
              </FormField>
            </div>

            <Button type="submit" disabled={loading} className="sm:min-w-[220px]">
              {loading ? "Fetching recommendations..." : "Fetch recommendations"}
            </Button>
          </ActionBar>
        </form>

        <RecommendationsPanel
          recommendations={recommendations}
          loading={loading}
          error={error}
          hasFetched={hasFetched}
        />
      </section>
    </main>
  );
}
