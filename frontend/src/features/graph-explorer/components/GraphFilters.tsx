import { SectionCard } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import type { GraphFilterState, GraphNodeType } from "../types/graphExplorer";
import { NODE_TYPE_STYLES } from "../utils/graphStyle";

type GraphFiltersProps = {
  filters: GraphFilterState;
  onToggle: (type: GraphNodeType) => void;
  counts?: Partial<Record<GraphNodeType, number>>;
};

const ORDER: GraphNodeType[] = ["UserProfile", "Skill", "Paper", "Topic", "Author"];

export default function GraphFilters({ filters, onToggle, counts }: GraphFiltersProps): JSX.Element {
  return (
    <SectionCard
      eyebrow="Controls"
      title="Node filters"
      description="Show or hide entity types to reduce noise and focus the graph."
    >
      <div className="flex flex-wrap gap-2">
        {ORDER.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-semibold transition",
              filters[type]
                ? "border-slate-900 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            )}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NODE_TYPE_STYLES[type].color }} />
            {type}
            <span className="text-xs opacity-80">({counts?.[type] ?? 0})</span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
