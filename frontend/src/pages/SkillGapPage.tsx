import { FormEvent, useEffect, useMemo, useState } from "react";

import { ActionBar, Button, FormField, PageHeader, Pill, StatCard, StatusPanel } from "../components/ui";
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
        <PageHeader
          eyebrow="Learning Strategy"
          title="Skill gap analysis"
          description="Compare current profile skills with backend-generated gap analysis, then turn the findings into a focused learning roadmap backed by recommendation evidence."
          meta={
            <>
              <span>User ID is prefilled from the active workspace context.</span>
              <Pill tone={hasLoaded && analysis ? "success" : "muted"}>{hasLoaded && analysis ? "Analysis loaded" : "Awaiting analysis"}</Pill>
            </>
          }
          stats={
            <>
              <StatCard label="User Context" value={userId || "Unassigned"} hint="Current researcher being analyzed." />
              <StatCard label="Missing Skills" value={analysis?.missing_skills.length ?? 0} hint="Evidence-backed missing capabilities." tone="warning" />
              <StatCard label="Suggested Next" value={analysis?.suggested_next_skills.length ?? 0} hint="Skills to prioritize next." tone="accent" />
            </>
          }
        />

        <form onSubmit={handleLoad}>
          <ActionBar>
            <div className="grid flex-1 gap-4 sm:grid-cols-[minmax(0,1fr)_190px]">
              <FormField label="User ID" hint="Loads gap analysis for the active researcher profile.">
                <input
                  className="input-control"
                  value={userId}
                  onChange={(event) => handleUserIdInput(event.target.value)}
                  placeholder="Enter user ID"
                  required
                />
              </FormField>

              <FormField label="Limit" hint="Recommendation evidence depth used by the backend.">
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

            <Button type="submit" disabled={loading} className="sm:min-w-[200px]">
              {loading ? "Loading analysis..." : "Load skill gap"}
            </Button>
          </ActionBar>
        </form>

        {error ? (
          <StatusPanel tone="error" title="Skill gap request failed">
            {error}
          </StatusPanel>
        ) : null}

        {loading ? (
          <StatusPanel tone="loading" title="Building analysis">
            Loading backend skill-gap analysis and supporting recommendation evidence.
          </StatusPanel>
        ) : null}

        {!loading && !error && !hasLoaded ? (
          <StatusPanel tone="empty" title="No analysis loaded">
            Load skill-gap analysis to view strengths, missing skills, and suggested next capabilities.
          </StatusPanel>
        ) : null}

        {!loading && !error && hasLoaded && analysis ? (
          <div className="grid gap-6">
            <SkillGapSummaryCard
              strengths={analysis.strengths}
              missingSkillsCount={analysis.missing_skills.length}
              suggestedNextSkills={analysis.suggested_next_skills}
              gapsSummary={analysis.gaps_summary}
            />

            <div className="grid gap-6 xl:grid-cols-2">
              <SkillListSection
                title="Current skills"
                description="Skills currently attached to the researcher profile."
                items={analysis.current_skills}
                emptyText="No skills found in the profile yet. Add them on the Profile page."
              />
              <SkillListSection
                title="Suggested next skills"
                description="High-priority skills surfaced by the backend from recommendation evidence."
                items={analysis.suggested_next_skills}
                emptyText="No suggested next skills detected from the current backend analysis."
                tone="highlight"
              />
            </div>

            <MissingSkillsTable skills={analysis.missing_skills} />

            <SkillListSection
              title="All missing skills"
              description="A compact list of all backend-identified missing skills for this researcher."
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
