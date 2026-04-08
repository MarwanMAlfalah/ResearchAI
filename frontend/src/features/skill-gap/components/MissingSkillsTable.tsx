import type { DerivedSkill } from "../types/skillGap";

type MissingSkillsTableProps = {
  skills: DerivedSkill[];
};

function confidenceLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function MissingSkillsTable({ skills }: MissingSkillsTableProps): JSX.Element {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Missing / Recommended Skills</h2>
      <p className="mt-1 text-sm text-slate-600">
        Initial frontend-derived recommendations based on profile interests and top recommended papers.
      </p>

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
                <tr key={skill.name} className="rounded-lg bg-slate-50 text-slate-800">
                  <td className="rounded-l-lg px-2 py-2 font-medium">{skill.name}</td>
                  <td className="px-2 py-2">{confidenceLabel(skill.confidence)}</td>
                  <td className="rounded-r-lg px-2 py-2">{skill.evidence_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
