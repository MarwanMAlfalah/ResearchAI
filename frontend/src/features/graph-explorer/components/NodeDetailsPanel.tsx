import type { GraphNode } from "../types/graphExplorer";

type NodeDetailsPanelProps = {
  node: GraphNode | null;
};

function formatKey(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value !== null && typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export default function NodeDetailsPanel({ node }: NodeDetailsPanelProps): JSX.Element {
  if (!node) {
    return (
      <section className="card-panel p-4">
        <h2 className="text-sm font-semibold text-slate-900">Node Details</h2>
        <p className="mt-3 text-sm text-slate-600">
          Click a node in the graph to inspect its metadata and relation context.
        </p>
      </section>
    );
  }

  const metadataEntries = Object.entries(node.metadata);

  return (
    <section className="card-panel p-4">
      <h2 className="text-sm font-semibold text-slate-900">Node Details</h2>
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">Node ID</p>
        <p className="mt-1 break-all text-xs text-slate-700">{node.id}</p>

        <p className="text-[11px] uppercase tracking-wide text-slate-500">Type</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{node.type}</p>

        <p className="mt-3 text-[11px] uppercase tracking-wide text-slate-500">Label</p>
        <p className="mt-1 text-sm text-slate-800">{node.label}</p>

        <p className="mt-3 text-[11px] uppercase tracking-wide text-slate-500">Metadata</p>
        {metadataEntries.length === 0 ? (
          <p className="mt-1 text-xs text-slate-500">No metadata available for this node.</p>
        ) : (
          <dl className="mt-1 grid gap-1 text-xs text-slate-700">
            {metadataEntries.map(([key, value]) => (
              <div key={`${node.id}-${key}`} className="grid grid-cols-[120px_1fr] gap-2">
                <dt className="font-medium text-slate-500">{formatKey(key)}</dt>
                <dd className="break-words text-slate-700">{formatValue(value)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
