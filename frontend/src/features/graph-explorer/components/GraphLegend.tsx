import type { GraphNodeType } from "../types/graphExplorer";
import { NODE_TYPE_STYLES } from "../utils/graphStyle";

const ORDER: GraphNodeType[] = ["UserProfile", "Paper", "Skill", "Topic", "Author"];

export default function GraphLegend(): JSX.Element {
  return (
    <section className="card-panel p-4">
      <h2 className="text-sm font-semibold text-slate-900">Legend</h2>
      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-2">
        {ORDER.map((type) => (
          <div key={type} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border"
              style={{
                backgroundColor: NODE_TYPE_STYLES[type].color,
                borderColor: NODE_TYPE_STYLES[type].borderColor,
              }}
            />
            <span>{type}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-500">Tip: click a node to focus its direct neighborhood.</p>
    </section>
  );
}
