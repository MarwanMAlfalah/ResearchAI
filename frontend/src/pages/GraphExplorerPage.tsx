import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ActionBar, Button, FormField, PageHeader, Pill, SectionCard, StatCard, StatusPanel } from "../components/ui";
import { fetchGraphExplorerData } from "../features/graph-explorer/api/graphExplorerApi";
import GraphCanvas from "../features/graph-explorer/components/GraphCanvas";
import GraphFilters from "../features/graph-explorer/components/GraphFilters";
import GraphLegend from "../features/graph-explorer/components/GraphLegend";
import NodeDetailsPanel from "../features/graph-explorer/components/NodeDetailsPanel";
import {
  DEFAULT_GRAPH_FILTERS,
  type GraphData,
  type GraphFilterState,
  type GraphNode,
  type GraphNodeType,
} from "../features/graph-explorer/types/graphExplorer";

type GraphExplorerPageProps = {
  initialUserId?: string;
  onUserIdChange?: (userId: string) => void;
};

const DEFAULT_USER_ID = "user_001";
const DEFAULT_LIMIT = 20;

export default function GraphExplorerPage({ initialUserId, onUserIdChange }: GraphExplorerPageProps): JSX.Element {
  const [userId, setUserId] = useState<string>(initialUserId ?? DEFAULT_USER_ID);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filters, setFilters] = useState<GraphFilterState>(DEFAULT_GRAPH_FILTERS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!initialUserId) {
      return;
    }
    setUserId((prev) => (prev === initialUserId ? prev : initialUserId));
  }, [initialUserId]);

  const visibleNodeCount = useMemo(() => {
    if (!graphData) {
      return 0;
    }

    return graphData.nodes.filter((node) => filters[node.type]).length;
  }, [graphData, filters]);

  const nodeTypeCounts = useMemo(() => {
    if (!graphData) {
      return {};
    }

    return graphData.nodes.reduce<Partial<Record<GraphNodeType, number>>>((acc, node) => {
      acc[node.type] = (acc[node.type] ?? 0) + 1;
      return acc;
    }, {});
  }, [graphData]);

  const visibleEdgeCount = useMemo(() => {
    if (!graphData) {
      return 0;
    }

    const visibleNodes = new Set(graphData.nodes.filter((node) => filters[node.type]).map((node) => node.id));
    return graphData.edges.filter((edge) => visibleNodes.has(edge.source) && visibleNodes.has(edge.target)).length;
  }, [graphData, filters]);

  function handleUserIdInput(value: string): void {
    setUserId(value);
    onUserIdChange?.(value);
  }

  function handleToggleFilter(type: GraphNodeType): void {
    setFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }

  const handleSelectNode = useCallback((node: GraphNode | null): void => {
    setSelectedNode(node);
  }, []);

  async function handleLoadGraph(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const cleanUserId = userId.trim();
    if (!cleanUserId) {
      setError("Please provide a user ID.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextGraphData = await fetchGraphExplorerData(cleanUserId, limit);
      setGraphData(nextGraphData);
      setSelectedNode(null);
      setHasLoaded(true);
      onUserIdChange?.(cleanUserId);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to load graph data.";
      setError(message);
      setGraphData(null);
      setSelectedNode(null);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="app-container">
        <PageHeader
          eyebrow="Knowledge Graph"
          title="Graph explorer"
          description="Inspect the product graph around a researcher with cleaner controls, a stronger canvas frame, and a dedicated side inspector for node-level detail."
          meta={
            <>
              <span>Graph data is assembled from profile, recommendation, skill-gap, and search flows.</span>
              <Pill tone={hasLoaded && graphData ? "success" : "muted"}>{hasLoaded && graphData ? "Graph loaded" : "Awaiting graph"}</Pill>
            </>
          }
          stats={
            <>
              <StatCard label="Visible Nodes" value={visibleNodeCount} hint="Nodes currently visible under the active filters." />
              <StatCard label="Visible Edges" value={visibleEdgeCount} hint="Edges connecting visible nodes." tone="accent" />
              <StatCard label="Selected Node" value={selectedNode?.type ?? "None"} hint={selectedNode ? selectedNode.label : "Click any node to inspect it."} tone="success" />
            </>
          }
        />

        <form onSubmit={handleLoadGraph}>
          <ActionBar>
            <div className="grid flex-1 gap-4 sm:grid-cols-[minmax(0,1fr)_170px]">
              <FormField label="User ID" hint="The graph loads around this researcher context.">
                <input
                  className="input-control"
                  value={userId}
                  onChange={(event) => handleUserIdInput(event.target.value)}
                  placeholder="Enter user ID"
                  required
                />
              </FormField>

              <FormField label="Limit" hint="Caps the amount of graph-linked data requested.">
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="input-control"
                  value={limit}
                  onChange={(event) => setLimit(Number(event.target.value))}
                  required
                />
              </FormField>
            </div>

            <Button type="submit" disabled={loading} className="sm:min-w-[180px]">
              {loading ? "Loading graph..." : "Load graph"}
            </Button>
          </ActionBar>
        </form>

        {error ? (
          <StatusPanel tone="error" title="Graph request failed">
            {error}
          </StatusPanel>
        ) : null}

        {loading ? (
          <StatusPanel tone="loading" title="Building graph">
            Loading graph data from backend services and preparing the interactive canvas.
          </StatusPanel>
        ) : null}

        {!loading && !error && !hasLoaded ? (
          <StatusPanel tone="empty" title="No graph loaded">
            Load a graph to inspect linked entities and relationships around this researcher.
          </StatusPanel>
        ) : null}

        {!loading && !error && hasLoaded && graphData && graphData.nodes.length === 0 ? (
          <StatusPanel tone="empty" title="Graph returned no nodes">
            No graph data was available for this user and limit.
          </StatusPanel>
        ) : null}

        {!loading && !error && graphData && graphData.nodes.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-6">
              <div className="grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
                <GraphFilters filters={filters} onToggle={handleToggleFilter} counts={nodeTypeCounts} />
                <GraphLegend />
              </div>

              <SectionCard
                eyebrow="Canvas"
                title="Interactive graph"
                description="Explore direct neighborhoods, filter entity types, and use the inspector to understand why nodes appear in the graph."
                contentClassName="p-0"
              >
                <GraphCanvas graphData={graphData} filters={filters} onSelectNode={handleSelectNode} />
              </SectionCard>
            </div>

            <NodeDetailsPanel node={selectedNode} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
