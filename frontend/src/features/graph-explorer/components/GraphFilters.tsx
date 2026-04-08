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
    <section className="card-panel p-4">
      <h2 className="text-sm font-semibold text-slate-900">Node Filters</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {ORDER.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onToggle(type)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              filters[type]
                ? "border-slate-800 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: NODE_TYPE_STYLES[type].color }}
            />
            {type}
            <span className="ml-1 text-[11px] opacity-80">({counts?.[type] ?? 0})</span>
          </button>
        ))}
      </div>
    </section>
  );
}
