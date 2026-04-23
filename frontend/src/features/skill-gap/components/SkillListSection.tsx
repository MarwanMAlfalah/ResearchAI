import { EmptyState, Pill, SectionCard } from "../../../components/ui";

type SkillListSectionProps = {
  title: string;
  description: string;
  items: string[];
  emptyText: string;
  tone?: "neutral" | "highlight";
};

export default function SkillListSection({
  title,
  description,
  items,
  emptyText,
  tone = "neutral",
}: SkillListSectionProps): JSX.Element {
  const pillTone = tone === "highlight" ? "warning" : "accent";

  return (
    <SectionCard title={title} description={description} eyebrow="Skills">
      {items.length === 0 ? (
        <EmptyState title="Nothing to show yet" description={emptyText} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Pill key={`${title}-${item}`} tone={pillTone} className="normal-case tracking-[0.04em]">
              {item}
            </Pill>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
