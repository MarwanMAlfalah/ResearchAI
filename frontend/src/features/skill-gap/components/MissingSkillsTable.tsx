import { EmptyState, Pill, SectionCard } from "../../../components/ui";
import type { MissingSkillEvidence } from "../types/skillGap";

type MissingSkillsTableProps = {
  skills: MissingSkillEvidence[];
};

function confidenceLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function confidenceTone(value: number): "success" | "warning" | "muted" {
  if (value >= 0.7) {
    return "success";
  }

  if (value >= 0.4) {
    return "warning";
  }

  return "muted";
}

export default function MissingSkillsTable({ skills }: MissingSkillsTableProps): JSX.Element {
  return (
    <SectionCard
      eyebrow="Evidence"
      title="Missing and recommended skills"
      description="Backend-generated skill gaps with confidence, supporting rationale, and recommendation-derived evidence."
      contentClassName="grid gap-5"
    >
      {skills.length === 0 ? (
        <EmptyState
          title="No skill gaps detected"
          description="Import more papers or refresh recommendations to generate stronger skill-gap evidence."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full overflow-hidden rounded-[24px] border border-slate-200 bg-white text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Skill
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Confidence
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Evidence Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.skill} className="border-t border-slate-200">
                    <td className="px-4 py-4 font-semibold text-slate-900">{skill.skill}</td>
                    <td className="px-4 py-4">
                      <Pill tone={confidenceTone(skill.confidence)} className="normal-case tracking-[0.04em]">
                        {confidenceLabel(skill.confidence)}
                      </Pill>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{skill.evidence_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4">
            {skills.map((skill) => (
              <article key={`${skill.skill}-evidence`} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{skill.skill}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{skill.rationale}</p>
                  </div>
                  <Pill tone={confidenceTone(skill.confidence)}>{confidenceLabel(skill.confidence)} confidence</Pill>
                </div>

                {skill.supporting_papers.length > 0 ? (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    {skill.supporting_papers.map((paper) => (
                      <div key={`${skill.skill}-${paper.paper_id}`} className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{paper.title ?? paper.paper_id}</p>
                        <p className="mt-1 text-xs text-slate-500">Score {paper.final_score.toFixed(3)}</p>
                        {paper.matched_fields.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {paper.matched_fields.map((field) => (
                              <Pill
                                key={`${paper.paper_id}-${field}`}
                                tone="accent"
                                className="normal-case tracking-[0.04em]"
                              >
                                {field}
                              </Pill>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}
