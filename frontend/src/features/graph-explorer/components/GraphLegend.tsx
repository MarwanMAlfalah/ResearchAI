import { SectionCard } from "../../../components/ui";
import type { GraphNodeType } from "../types/graphExplorer";
import { NODE_TYPE_STYLES } from "../utils/graphStyle";

const ORDER: GraphNodeType[] = ["UserProfile", "Paper", "Skill", "Topic", "Author"];

export default function GraphLegend(): JSX.Element {
  return (
    <SectionCard
      eyebrow="Reference"
      title="Legend"
      description="Use the legend to decode node colors while exploring the graph."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {ORDER.map((type) => (
          <div key={type} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-slate-700">
            <span
              className="inline-block h-3 w-3 rounded-full border"
              style={{
                backgroundColor: NODE_TYPE_STYLES[type].color,
                borderColor: NODE_TYPE_STYLES[type].borderColor,
              }}
            />
            <span className="font-medium">{type}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">Tip: click a node to highlight its local neighborhood and inspect its metadata.</p>
    </SectionCard>
  );
}
