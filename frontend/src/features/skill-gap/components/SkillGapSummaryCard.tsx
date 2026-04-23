import { Pill, SectionCard, StatCard } from "../../../components/ui";

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
    <SectionCard
      eyebrow="Overview"
      title="Skill gap dashboard"
      description="A summary of current strengths, uncovered gaps, and the next skills the product recommends prioritizing."
      tone="accent"
      contentClassName="grid gap-5"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Strengths"
          value={strengths.length}
          hint={strengths.length > 0 ? strengths.join(", ") : "No strengths detected yet."}
          tone="success"
        />
        <StatCard
          label="Skill Gaps"
          value={missingSkillsCount}
          hint={gapsSummary}
          tone="warning"
        />
        <StatCard
          label="Suggested Next"
          value={suggestedNextSkills.length}
          hint={
            suggestedNextSkills.length > 0
              ? suggestedNextSkills.join(", ")
              : "No immediate next-skill recommendation."
          }
          tone="accent"
        />
      </div>

      {strengths.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {strengths.map((strength) => (
            <Pill key={strength} tone="success" className="normal-case tracking-[0.04em]">
              {strength}
            </Pill>
          ))}
        </div>
      ) : null}
    </SectionCard>
  );
}
