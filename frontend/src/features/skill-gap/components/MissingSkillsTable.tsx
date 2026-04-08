import type { MissingSkillEvidence } from "../types/skillGap";

type MissingSkillsTableProps = {
  skills: MissingSkillEvidence[];
};

function confidenceLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function MissingSkillsTable({ skills }: MissingSkillsTableProps): JSX.Element {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Missing / Recommended Skills</h2>
      <p className="mt-1 text-sm text-slate-600">Backend-driven skill gap evidence from profile and recommendations.</p>

      {skills.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-600">
          No clear skill gaps detected yet. Import more papers or fetch new recommendations.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Skill
                </th>
                <th className="px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Confidence
                </th>
                <th className="px-2 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Evidence Count
                </th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.skill} className="rounded-lg bg-slate-50 text-slate-800">
                  <td className="rounded-l-lg px-2 py-2 font-medium">{skill.skill}</td>
                  <td className="px-2 py-2">{confidenceLabel(skill.confidence)}</td>
                  <td className="rounded-r-lg px-2 py-2">{skill.evidence_count}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 grid gap-2">
            {skills.map((skill) => (
              <article key={`${skill.skill}-evidence`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{skill.skill} Rationale</p>
                <p className="mt-1 text-sm text-slate-700">{skill.rationale}</p>
                {skill.supporting_papers.length > 0 ? (
                  <div className="mt-2 text-xs text-slate-600">
                    <p className="font-medium text-slate-700">Evidence Papers</p>
                    <p className="mt-1">
                      {skill.supporting_papers
                        .map((paper) => `${paper.title ?? paper.paper_id} (score ${paper.final_score.toFixed(3)})`)
                        .join("; ")}
                    </p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
