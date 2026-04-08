import { FormEvent, useEffect, useMemo, useState } from "react";

import { fetchSkillGapAnalysis } from "../features/skill-gap/api/skillGapApi";
import MissingSkillsTable from "../features/skill-gap/components/MissingSkillsTable";
import SkillGapSummaryCard from "../features/skill-gap/components/SkillGapSummaryCard";
import SkillListSection from "../features/skill-gap/components/SkillListSection";
import type { SkillGapResponse } from "../features/skill-gap/types/skillGap";

type SkillGapPageProps = {
  initialUserId?: string;
  onUserIdChange?: (userId: string) => void;
};

const DEFAULT_USER_ID = "user_001";
const DEFAULT_LIMIT = 15;

export default function SkillGapPage({ initialUserId, onUserIdChange }: SkillGapPageProps): JSX.Element {
  const [userId, setUserId] = useState<string>(initialUserId ?? DEFAULT_USER_ID);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<SkillGapResponse | null>(null);

  const missingSkillNames = useMemo(() => (analysis ? analysis.missing_skills.map((skill) => skill.skill) : []), [analysis]);

  useEffect(() => {
    if (!initialUserId) {
      return;
    }
    setUserId((prev) => (prev === initialUserId ? prev : initialUserId));
  }, [initialUserId]);

  function handleUserIdInput(value: string): void {
    setUserId(value);
    onUserIdChange?.(value);
  }

  async function handleLoad(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const cleanUserId = userId.trim();
    if (cleanUserId.length === 0) {
      setError("Please provide a user ID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextAnalysis = await fetchSkillGapAnalysis(cleanUserId, limit);
      setAnalysis(nextAnalysis);
      setHasLoaded(true);
      onUserIdChange?.(cleanUserId);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to load skill gap data.";
      setError(message);
      setAnalysis(null);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="app-container">
        <header className="page-header">
          <h1 className="page-title">Skill Gap Analysis</h1>
          <p className="page-subtitle">
            Compare current profile skills against backend-generated gap analysis and supporting recommendation evidence.
          </p>
          <p className="page-caption">User ID is prefilled from the active app context.</p>
        </header>

        <form className="form-card sm:grid-cols-[1fr_180px_auto]" onSubmit={handleLoad}>
          <label className="field">
            <span className="field-label">User ID</span>
            <input
              className="input-control"
              value={userId}
              onChange={(event) => handleUserIdInput(event.target.value)}
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
            {loading ? "Loading..." : "Load Skill Gap"}
          </button>
        </form>

        {error ? (
          <section className="state-panel state-panel-error mt-6">
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </section>
        ) : null}

        {loading ? (
          <section className="state-panel state-panel-loading mt-6">
            <p className="text-sm text-slate-600">Loading backend skill gap analysis...</p>
          </section>
        ) : null}

        {!loading && !error && !hasLoaded ? (
          <section className="state-panel state-panel-empty mt-6 border-dashed">
            <p className="text-sm text-slate-600">Load backend skill gap analysis to view strengths and recommended skills.</p>
          </section>
        ) : null}

        {!loading && !error && hasLoaded && analysis ? (
          <div className="mt-6 grid gap-4">
            <SkillGapSummaryCard
              strengths={analysis.strengths}
              missingSkillsCount={analysis.missing_skills.length}
              suggestedNextSkills={analysis.suggested_next_skills}
              gapsSummary={analysis.gaps_summary}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <SkillListSection
                title="Current Skills"
                description="Skills currently connected to the user profile."
                items={analysis.current_skills}
                emptyText="No skills found in profile. Add skills in the Profile page."
              />
              <SkillListSection
                title="Suggested Skills"
                description="Backend-suggested next skills based on recommendation evidence."
                items={analysis.suggested_next_skills}
                emptyText="No suggested skills detected from current backend analysis."
                tone="highlight"
              />
            </div>

            <MissingSkillsTable skills={analysis.missing_skills} />
            <SkillListSection
              title="All Missing Skills"
              description="All backend-identified missing skills for this user."
              items={missingSkillNames}
              emptyText="No missing skills identified."
              tone="highlight"
            />
          </div>
        ) : null}
      </section>
    </main>
  );
}
