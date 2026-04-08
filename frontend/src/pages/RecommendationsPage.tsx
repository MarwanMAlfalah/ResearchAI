import { FormEvent, useEffect, useMemo, useState } from "react";

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
        <header className="page-header">
          <h1 className="page-title">Explained Recommendations</h1>
          <p className="page-subtitle">
            Retrieve semantically ranked papers with score breakdown and transparent evidence for each recommendation.
          </p>
          <p className="page-caption">User ID is prefilled from the active app context.</p>
        </header>

        <form className="form-card sm:grid-cols-[1fr_160px_auto]" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">User ID</span>
            <input
              className="input-control"
              value={userId}
              onChange={(event) => handleUserIdChange(event.target.value)}
              placeholder="Enter user ID"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Limit</span>
            <input
              type="number"
              min={1}
              max={100}
              className="input-control"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-fit self-end"
          >
            {loading ? "Fetching..." : "Fetch Recommendations"}
          </button>
        </form>

        <div className="mt-3 text-xs text-slate-500">
          Results: <span className="font-semibold text-slate-700">{hasFetched ? recommendationCount : 0}</span>
        </div>

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
