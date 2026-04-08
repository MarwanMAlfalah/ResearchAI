type SkillGapSummaryCardProps = {
  strengths: string[];
  missingSkillsCount: number;
  suggestedNextSkills: string[];
  gapsSummary: string;
};

export default function SkillGapSummaryCard({
  strengths,
  missingSkillsCount,
  suggestedNextSkills,
  gapsSummary,
}: SkillGapSummaryCardProps): JSX.Element {
  return (
    <section className="card-panel">
      <h2 className="text-base font-semibold text-slate-900">Gap Summary</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SummaryBlock
          title="Strengths"
          value={strengths.length}
          details={strengths.length > 0 ? strengths.join(", ") : "No skills added yet."}
        />
        <SummaryBlock
          title="Gaps"
          value={missingSkillsCount}
          details={gapsSummary}
        />
        <SummaryBlock
          title="Suggested Next"
          value={suggestedNextSkills.length}
          details={
            suggestedNextSkills.length > 0
              ? suggestedNextSkills.join(", ")
              : "No immediate next-skill recommendation."
          }
        />
      </div>
    </section>
  );
}

type SummaryBlockProps = {
  title: string;
  value: number;
  details: string;
};

function SummaryBlock({ title, value, details }: SummaryBlockProps): JSX.Element {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{details}</p>
    </article>
  );
}
