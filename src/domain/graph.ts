import type { GraphData, GraphEdge, GraphNode, NodeType, ReviewStatus } from './schema';
import { derivePaperMemberships, paperBelongsToCluster } from './hypergraph';

export interface GraphFilters {
  query: string;
  nodeTypes: Set<NodeType>;
  statuses: Set<ReviewStatus>;
  relations: Set<string>;
  clusterId: string | null;
  showRejected: boolean;
}

export function indexNodes(graph: GraphData): Map<string, GraphNode> {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

export function proposedItems(
  graph: GraphData,
): Array<{ kind: 'node'; item: GraphNode } | { kind: 'edge'; item: GraphEdge }> {
  return [
    ...graph.nodes
      .filter((node) => node.status === 'proposed')
      .map((item) => ({ kind: 'node' as const, item })),
    ...graph.edges
      .filter((edge) => edge.status === 'proposed')
      .map((item) => ({ kind: 'edge' as const, item })),
  ];
}

export function filterGraph(graph: GraphData, filters: GraphFilters): GraphData {
  const query = filters.query.trim().toLocaleLowerCase();
  const memberships = filters.clusterId ? derivePaperMemberships(graph) : null;
  const visibleNodeIds = new Set(
    graph.nodes
      .filter((node) => filters.nodeTypes.has(node.type))
      .filter((node) => filters.statuses.has(node.status))
      .filter((node) => filters.showRejected || node.status !== 'rejected')
      .filter(
        (node) =>
          !filters.clusterId ||
          node.id === filters.clusterId ||
          node.cluster === filters.clusterId ||
          (node.type === 'paper' &&
            memberships != null &&
            paperBelongsToCluster(memberships, node.id, filters.clusterId)),
      )
      .filter((node) => {
        if (!query) return true;
        const paper = node.paper;
        return [
          node.label,
          node.description,
          paper?.title,
          paper?.summary,
          paper?.authors.join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase()
          .includes(query);
      })
      .map((node) => node.id),
  );

  return {
    meta: graph.meta,
    nodes: graph.nodes.filter((node) => visibleNodeIds.has(node.id)),
    edges: graph.edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) &&
        visibleNodeIds.has(edge.target) &&
        filters.statuses.has(edge.status) &&
        filters.relations.has(edge.relation) &&
        (filters.showRejected || edge.status !== 'rejected'),
    ),
  };
}

export function replaceNode(
  graph: GraphData,
  id: string,
  updates: Partial<GraphNode>,
  flipOrigin = true,
): GraphData {
  return {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.id === id
        ? ({
            ...node,
            ...updates,
            ...(flipOrigin ? { origin: 'user' as const } : {}),
          } as GraphNode)
        : node,
    ),
  };
}

export function replaceEdge(
  graph: GraphData,
  id: string,
  updates: Partial<GraphEdge>,
): GraphData {
  return {
    ...graph,
    edges: graph.edges.map((edge) =>
      edge.id === id ? { ...edge, ...updates, origin: 'user' as const } : edge,
    ),
  };
}

export function serializeForSave(graph: GraphData, baseRevision: number): GraphData {
  return {
    ...graph,
    meta: {
      ...graph.meta,
      schema_version: 2,
      revision: baseRevision + 1,
      updated_at: new Date().toISOString(),
    },
  };
}

export function graphStats(graph: GraphData) {
  return {
    papers: graph.nodes.filter((node) => node.type === 'paper').length,
    concepts: graph.nodes.filter((node) => node.type !== 'paper' && node.type !== 'cluster')
      .length,
    clusters: graph.nodes.filter((node) => node.type === 'cluster').length,
    connections: graph.edges.length,
    proposed: proposedItems(graph).length,
  };
}
