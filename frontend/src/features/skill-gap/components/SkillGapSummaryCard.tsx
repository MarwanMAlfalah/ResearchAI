import type { SkillGapSummary } from "../types/skillGap";

type SkillGapSummaryCardProps = {
  summary: SkillGapSummary;
};

export default function SkillGapSummaryCard({ summary }: SkillGapSummaryCardProps): JSX.Element {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Gap Summary</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <SummaryBlock
          title="Strengths"
          value={summary.strengths.length}
          details={summary.strengths.length > 0 ? summary.strengths.join(", ") : "No skills added yet."}
        />
        <SummaryBlock
          title="Gaps"
          value={summary.gaps.length}
          details={summary.gaps.length > 0 ? summary.gaps.join(", ") : "No major gaps detected."}
        />
        <SummaryBlock
          title="Suggested Next"
          value={summary.suggested_next_skills.length}
          details={
            summary.suggested_next_skills.length > 0
              ? summary.suggested_next_skills.join(", ")
              : "Add interests and fetch recommendations first."
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
