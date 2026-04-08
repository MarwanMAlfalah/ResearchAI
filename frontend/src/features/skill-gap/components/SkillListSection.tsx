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
  const badgeClass =
    tone === "highlight"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <section className="card-panel">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      {items.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-600">
          {emptyText}
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={`${title}-${item}`} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
              {item}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
