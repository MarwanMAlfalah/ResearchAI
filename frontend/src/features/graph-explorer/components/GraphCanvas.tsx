import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape, { Core, ElementDefinition, EventObject, NodeSingular } from "cytoscape";

import type { GraphData, GraphFilterState, GraphNode, GraphNodeType } from "../types/graphExplorer";
import { NODE_TYPE_STYLES, truncateNodeLabel } from "../utils/graphStyle";

type GraphCanvasProps = {
  graphData: GraphData;
  filters: GraphFilterState;
  onSelectNode: (node: GraphNode | null) => void;
};

type HoverPreview = {
  label: string;
  type: GraphNodeType;
  x: number;
  y: number;
} | null;

function rankForLayout(type: GraphNodeType): number {
  if (type === "UserProfile") {
    return 5;
  }
  if (type === "Paper") {
    return 4;
  }
  if (type === "Skill") {
    return 3;
  }
  if (type === "Topic") {
    return 2;
  }
  return 1;
}

function nodeColor(type: GraphNodeType): string {
  return NODE_TYPE_STYLES[type].color;
}

function nodeBorderColor(type: GraphNodeType): string {
  return NODE_TYPE_STYLES[type].borderColor;
}

function nodeSize(type: GraphNodeType): number {
  return NODE_TYPE_STYLES[type].size;
}

export default function GraphCanvas({ graphData, filters, onSelectNode }: GraphCanvasProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview>(null);

  const filteredData = useMemo(() => {
    const visibleNodeIds = new Set(graphData.nodes.filter((node) => filters[node.type]).map((node) => node.id));

    const nodes = graphData.nodes.filter((node) => visibleNodeIds.has(node.id));
    const edges = graphData.edges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));

    return { nodes, edges };
  }, [graphData, filters]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const elements: ElementDefinition[] = [
      ...filteredData.nodes.map((node) => ({
        data: {
          id: node.id,
          label: truncateNodeLabel(node.label),
          fullLabel: node.label,
          type: node.type,
          metadata: node.metadata,
        },
      })),
      ...filteredData.edges.map((edge) => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          relation: edge.relation,
        },
      })),
    ];

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": (ele: NodeSingular) => nodeColor(ele.data("type") as GraphNodeType),
            "border-color": (ele: NodeSingular) => nodeBorderColor(ele.data("type") as GraphNodeType),
            "border-width": 2,
            label: "data(label)",
            color: "#0f172a",
            "font-size": 10,
            "font-weight": 500,
            "text-wrap": "wrap",
            "text-max-width": "120px",
            "text-valign": "bottom",
            "text-margin-y": 8,
            "text-background-color": "#ffffff",
            "text-background-opacity": 0.85,
            "text-background-padding": "2px",
            width: (ele: NodeSingular) => nodeSize(ele.data("type") as GraphNodeType),
            height: (ele: NodeSingular) => nodeSize(ele.data("type") as GraphNodeType),
            opacity: 1,
            "overlay-opacity": 0,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#94a3b8",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "target-arrow-color": "#94a3b8",
            "arrow-scale": 0.7,
            opacity: 0.62,
          },
        },
        {
          selector: ".node-focus",
          style: {
            "border-width": 4,
            "border-color": "#0f172a",
            "z-index": 30,
          },
        },
        {
          selector: ".node-neighbor",
          style: {
            "border-width": 3,
            "z-index": 20,
          },
        },
        {
          selector: ".edge-neighbor",
          style: {
            width: 2.5,
            "line-color": "#475569",
            "target-arrow-color": "#475569",
            opacity: 0.95,
            "z-index": 15,
          },
        },
        {
          selector: ".faded",
          style: {
            opacity: 0.12,
          },
        },
      ],
      layout: {
        name: "concentric",
        fit: true,
        animate: true,
        animationDuration: 280,
        padding: 50,
        spacingFactor: 1.35,
        minNodeSpacing: 80,
        concentric: (node: NodeSingular) => rankForLayout(node.data("type") as GraphNodeType),
        levelWidth: () => 1,
      },
      wheelSensitivity: 0.15,
      motionBlur: true,
      boxSelectionEnabled: false,
      autounselectify: false,
    });

    function clearFocus(): void {
      cy.elements().removeClass("faded");
      cy.nodes().removeClass("node-focus node-neighbor");
      cy.edges().removeClass("edge-neighbor");
      onSelectNode(null);
    }

    function focusOnNode(node: NodeSingular): void {
      const neighborhood = node.closedNeighborhood();

      cy.elements().addClass("faded");
      neighborhood.removeClass("faded");
      cy.nodes().removeClass("node-focus node-neighbor");
      cy.edges().removeClass("edge-neighbor");

      node.addClass("node-focus");
      node.neighborhood("node").addClass("node-neighbor");
      node.connectedEdges().addClass("edge-neighbor");

      onSelectNode({
        id: String(node.data("id")),
        type: node.data("type") as GraphNodeType,
        label: String(node.data("fullLabel") ?? node.data("label") ?? ""),
        metadata: (node.data("metadata") as Record<string, unknown>) ?? {},
      });
    }

    cy.on("tap", "node", (event: EventObject) => {
      const node = event.target as NodeSingular;
      focusOnNode(node);
    });

    cy.on("tap", (event: EventObject) => {
      if (event.target === cy) {
        clearFocus();
      }
    });

    cy.on("mouseover", "node", (event: EventObject) => {
      const node = event.target as NodeSingular;
      const renderedPosition = node.renderedPosition();
      setHoverPreview({
        label: String(node.data("fullLabel") ?? node.data("label") ?? ""),
        type: node.data("type") as GraphNodeType,
        x: renderedPosition.x,
        y: renderedPosition.y,
      });
    });

    cy.on("mouseout", "node", () => {
      setHoverPreview(null);
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [filteredData, onSelectNode]);

  function handleFitView(): void {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }
    cy.animate({
      fit: {
        eles: cy.elements(),
        padding: 40,
      },
      duration: 280,
    });
  }

  function handleResetView(): void {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    cy.zoom(1);
    cy.center();
  }

  function handleResetSelection(): void {
    const cy = cyRef.current;
    if (!cy) {
      return;
    }

    cy.elements().removeClass("faded");
    cy.nodes().removeClass("node-focus node-neighbor");
    cy.edges().removeClass("edge-neighbor");
    onSelectNode(null);
  }

  return (
    <div className="relative">
      <div className="absolute right-3 top-3 z-20 flex gap-2">
        <button
          type="button"
          onClick={handleFitView}
          className="btn-secondary px-2.5 py-1 text-xs"
        >
          Fit
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="btn-secondary px-2.5 py-1 text-xs"
        >
          Reset View
        </button>
        <button
          type="button"
          onClick={handleResetSelection}
          className="btn-secondary px-2.5 py-1 text-xs"
        >
          Reset Selection
        </button>
      </div>

      {hoverPreview ? (
        <div
          className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs shadow-md"
          style={{ left: hoverPreview.x + 10, top: hoverPreview.y + 10 }}
        >
          <p className="font-semibold text-slate-900">{hoverPreview.label}</p>
          <p className="text-slate-600">{hoverPreview.type}</p>
        </div>
      ) : null}

      <div ref={containerRef} className="h-[620px] w-full rounded-lg border border-slate-200 bg-white" />
    </div>
  );
}
