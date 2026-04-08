import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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
        <header className="page-header">
          <h1 className="page-title">Graph Explorer</h1>
          <p className="page-subtitle">
            Explore user profile, skills, recommended papers, topics, and authors as an interactive knowledge graph.
          </p>
          <p className="page-caption">Uses real backend data assembled from profile, recommendation, skill-gap, and search APIs.</p>
        </header>

        <form className="form-card sm:grid-cols-[1fr_160px_auto]" onSubmit={handleLoadGraph}>
          <label className="field">
            <span className="field-label">User ID</span>
            <input
              className="input-control"
              value={userId}
              onChange={(event) => handleUserIdInput(event.target.value)}
              placeholder="Enter user ID"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Limit</span>
            <input
              type="number"
              min={1}
              max={100}
              className="input-control"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-fit self-end"
          >
            {loading ? "Loading..." : "Load Graph"}
          </button>
        </form>

        <div className="mt-3 text-xs text-slate-500">
          Visible: <span className="font-semibold text-slate-700">{visibleNodeCount}</span> nodes, <span className="font-semibold text-slate-700">{visibleEdgeCount}</span> edges
        </div>

        {error ? (
          <section className="state-panel state-panel-error mt-6">
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </section>
        ) : null}

        {loading ? (
          <section className="state-panel state-panel-loading mt-6">
            <p className="text-sm text-slate-600">Loading graph data from backend services...</p>
          </section>
        ) : null}

        {!loading && !error && !hasLoaded ? (
          <section className="state-panel state-panel-empty mt-6 border-dashed">
            <p className="text-sm text-slate-600">Load a graph to inspect linked entities and relationships.</p>
          </section>
        ) : null}

        {!loading && !error && hasLoaded && graphData && graphData.nodes.length === 0 ? (
          <section className="state-panel state-panel-empty mt-6 border-dashed">
            <p className="text-sm text-slate-600">No graph data was available for this user and limit.</p>
          </section>
        ) : null}

        {!loading && !error && graphData && graphData.nodes.length > 0 ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-4">
              <GraphFilters filters={filters} onToggle={handleToggleFilter} counts={nodeTypeCounts} />
              <GraphLegend />
              <section className="card-panel p-4">
                <GraphCanvas graphData={graphData} filters={filters} onSelectNode={handleSelectNode} />
              </section>
            </div>
            <NodeDetailsPanel node={selectedNode} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
