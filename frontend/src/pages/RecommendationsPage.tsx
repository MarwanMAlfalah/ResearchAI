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
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Explained Recommendations
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Retrieve semantically ranked papers with score breakdown and transparent evidence for each recommendation.
          </p>
          <p className="mt-1 text-xs text-slate-500">User ID is prefilled from the active app context.</p>
        </header>

        <form
          className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_160px_auto]"
          onSubmit={handleSubmit}
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">User ID</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={userId}
              onChange={(event) => handleUserIdChange(event.target.value)}
              placeholder="Enter user ID"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Limit</span>
            <input
              type="number"
              min={1}
              max={100}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="h-fit self-end rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Fetching..." : "Fetch Recommendations"}
          </button>
        </form>

        <div className="mt-3 text-xs text-slate-500">Results: {hasFetched ? recommendationCount : 0}</div>

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
