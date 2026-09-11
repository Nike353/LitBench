import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type ReactFlowInstance,
} from '@xyflow/react';
import { Focus, Maximize2, SearchX } from 'lucide-react';
import { filterGraph } from '../domain/graph';
import { useWorkspaceStore } from '../store/workspaceStore';
import { LineageEdge } from './graph/LineageEdge';
import { LineageLane } from './graph/LineageLane';
import {
  buildLineageMapScene,
  type LineageSceneEdge,
  type LineageSceneNode,
} from './graph/lineageMapModel';
import { LineagePaperNode } from './graph/LineagePaperNode';

const nodeTypes = {
  lineagePaper: LineagePaperNode,
  lineageLane: LineageLane,
};

const edgeTypes = {
  lineageEdge: LineageEdge,
};

function LineageSurface() {
  const graph = useWorkspaceStore((state) => state.graph)!;
  const filters = useWorkspaceStore((state) => state.filters);
  const selection = useWorkspaceStore((state) => state.selection);
  const select = useWorkspaceStore((state) => state.select);
  const flow = useReactFlow<LineageSceneNode, LineageSceneEdge>();
  const instanceRef = useRef<ReactFlowInstance<LineageSceneNode, LineageSceneEdge> | null>(
    null,
  );
  const visibleGraph = useMemo(() => filterGraph(graph, filters), [filters, graph]);
  const scene = useMemo(
    () => buildLineageMapScene(graph, visibleGraph, selection),
    [graph, selection, visibleGraph],
  );
  const paperNodes = useMemo(
    () => scene.nodes.filter((node) => node.data.kind === 'paper'),
    [scene.nodes],
  );
  const selectionNodes = useMemo(() => {
    if (!selection) return [];
    const ids =
      selection.kind === 'node'
        ? [selection.id]
        : scene.edges
            .filter((edge) => edge.id === selection.id)
            .flatMap((edge) => [edge.source, edge.target]);
    return paperNodes.filter((node) => ids.includes(node.id));
  }, [paperNodes, scene.edges, selection]);
  const visibleSignature = paperNodes.map((node) => node.id).join('|');
  const lastVisibleSignature = useRef(visibleSignature);

  useEffect(() => {
    if (!selection || !instanceRef.current) return;
    if (selectionNodes.length) {
      void flow.fitView({
        nodes: selectionNodes,
        duration: 480,
        padding: selectionNodes.length === 1 ? 1.5 : 0.9,
        maxZoom: 1.08,
      });
    }
  }, [flow, selection, selectionNodes]);

  useEffect(() => {
    if (lastVisibleSignature.current === visibleSignature) return;
    lastVisibleSignature.current = visibleSignature;
    if (!instanceRef.current || !paperNodes.length) return;
    const timer = window.setTimeout(() => {
      void flow.fitView({
        nodes: paperNodes,
        duration: 460,
        padding: paperNodes.length === 1 ? 1.5 : 0.18,
        minZoom: 0.12,
        maxZoom: paperNodes.length <= 3 ? 0.95 : 0.68,
      });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [flow, paperNodes, visibleSignature]);

  function fitAll() {
    if (!paperNodes.length) return;
    void flow.fitView({
      nodes: paperNodes,
      duration: 560,
      padding: 0.14,
      minZoom: 0.1,
      maxZoom: 0.7,
    });
  }

  function focusSelection() {
    if (!selectionNodes.length) return;
    void flow.fitView({
      nodes: selectionNodes,
      duration: 460,
      padding: selectionNodes.length === 1 ? 1.5 : 0.9,
      maxZoom: 1.08,
    });
  }

  function handleKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Escape') {
      select(null);
      return;
    }
    if (
      !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Enter'].includes(event.key) ||
      !paperNodes.length
    ) {
      return;
    }
    event.preventDefault();
    const currentIndex = paperNodes.findIndex((node) => node.id === selection?.id);
    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const nextIndex =
      currentIndex < 0
        ? direction > 0
          ? 0
          : paperNodes.length - 1
        : event.key === 'Enter'
          ? currentIndex
          : (currentIndex + direction + paperNodes.length) % paperNodes.length;
    select({ kind: 'node', id: paperNodes[nextIndex].id });
  }

  return (
    <div
      className="graph-stage lineage-map"
      tabIndex={0}
      onKeyDown={handleKeyboard}
      aria-label={`Two-dimensional lineage map with ${scene.paperCount} papers, ${scene.laneCount} research lineages, and ${scene.edgeCount} paper connections`}
      data-testid="graph-stage"
      data-view="lineages"
      data-paper-count={scene.paperCount}
      data-lane-count={scene.laneCount}
      data-edge-count={scene.edgeCount}
    >
      <div className="lineage-map-status" aria-label="Visible lineage statistics">
        <strong>{scene.paperCount} papers</strong>
        <span>{scene.laneCount} lineages</span>
        <span>{scene.edgeCount} connections</span>
      </div>
      <div className="lineage-map-controls" aria-label="Lineage map controls">
        <button
          type="button"
          onClick={fitAll}
          disabled={!paperNodes.length}
          title="Fit all lineages"
          aria-label="Fit all lineages"
        >
          <Maximize2 size={16} />
        </button>
        <button
          type="button"
          onClick={focusSelection}
          disabled={!selectionNodes.length}
          title="Focus selection"
          aria-label="Focus selection in lineages"
        >
          <Focus size={16} />
        </button>
      </div>

      {paperNodes.length ? (
        <ReactFlow<LineageSceneNode, LineageSceneEdge>
          nodes={scene.nodes}
          edges={scene.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={(instance) => {
            instanceRef.current = instance;
            const compact = window.matchMedia('(max-width: 780px)').matches;
            window.setTimeout(() => {
              void instance.setViewport({
                x: compact ? 8 : 24,
                y: compact ? 12 : 24,
                zoom: compact ? 0.48 : 0.68,
              });
            }, 0);
          }}
          onNodeClick={(_, node) => {
            if (node.data.kind === 'paper') {
              select({ kind: 'node', id: node.id });
            }
          }}
          onEdgeClick={(_, edge) => select({ kind: 'edge', id: edge.id })}
          onPaneClick={() => select(null)}
          minZoom={0.08}
          maxZoom={1.65}
          defaultEdgeOptions={{ focusable: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elevateEdgesOnSelect
          onlyRenderVisibleElements={false}
          proOptions={{ hideAttribution: true }}
          fitView={false}
          deleteKeyCode={null}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#c5ced2" />
          <Controls
            position="bottom-right"
            showInteractive={false}
            fitViewOptions={{ nodes: paperNodes, padding: 0.14 }}
          />
          <MiniMap
            position="bottom-left"
            pannable
            zoomable
            nodeStrokeWidth={0}
            nodeColor={(node) => {
              const data = node.data as { kind: 'lane' } | { kind: 'paper'; color: string };
              return data.kind === 'lane' ? 'transparent' : data.color;
            }}
            maskColor="rgba(235, 239, 240, 0.78)"
          />
        </ReactFlow>
      ) : (
        <div className="lineage-map-empty" role="status">
          <SearchX size={24} aria-hidden="true" />
          <strong>No papers in this view</strong>
          <span>Clear a search or widen the active filters.</span>
        </div>
      )}
    </div>
  );
}

export function LineageMap() {
  return (
    <ReactFlowProvider>
      <LineageSurface />
    </ReactFlowProvider>
  );
}
