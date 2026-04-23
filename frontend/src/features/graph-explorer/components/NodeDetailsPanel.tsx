import { EmptyState, MetadataGrid, Pill, SectionCard } from "../../../components/ui";
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
      <SectionCard
        eyebrow="Inspector"
        title="Node details"
        description="Select any node in the graph to inspect its metadata and relation context."
        className="h-fit xl:sticky xl:top-32"
      >
        <EmptyState
          title="No node selected"
          description="Click a node in the graph canvas to inspect its label, type, and metadata."
        />
      </SectionCard>
    );
  }

  const metadataEntries = Object.entries(node.metadata);

  return (
    <SectionCard
      eyebrow="Inspector"
      title="Node details"
      description="Detailed metadata for the currently selected graph entity."
      className="h-fit xl:sticky xl:top-32"
      contentClassName="grid gap-4"
      action={<Pill tone="accent">{node.type}</Pill>}
    >
      <MetadataGrid
        columns={1}
        items={[
          { label: "Node ID", value: <span className="break-all">{node.id}</span> },
          { label: "Label", value: node.label },
        ]}
      />

      {metadataEntries.length === 0 ? (
        <p className="text-sm text-slate-600">No metadata available for this node.</p>
      ) : (
        <MetadataGrid
          columns={1}
          items={metadataEntries.map(([key, value]) => ({
            label: formatKey(key),
            value: <span className="break-words">{formatValue(value)}</span>,
          }))}
        />
      )}
    </SectionCard>
  );
}
