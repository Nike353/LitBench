import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  filterGraph,
  graphStats,
  replaceEdge,
  replaceNode,
  serializeForSave,
} from './graph';
import { migrateAndValidateGraph, NODE_TYPES, STATUSES, type GraphData } from './schema';
import canonicalGraph from '../../tests/fixtures/library/data/graph.json';

let graph: GraphData;

beforeEach(() => {
  graph = migrateAndValidateGraph(structuredClone(canonicalGraph)).graph;
});

describe('graph domain operations', () => {
  it('filters nodes and removes edges with hidden endpoints', () => {
    const filtered = filterGraph(graph, {
      query: 'Diffusion Policy',
      nodeTypes: new Set(NODE_TYPES),
      statuses: new Set(STATUSES),
      relations: new Set(graph.edges.map((edge) => edge.relation)),
      clusterId: null,
      showRejected: false,
    });
    expect(
      filtered.nodes.some((node) => node.id === 'paper:chi2023-diffusion-policy'),
    ).toBe(true);
    expect(
      filtered.edges.every(
        (edge) =>
          filtered.nodes.some((node) => node.id === edge.source) &&
          filtered.nodes.some((node) => node.id === edge.target),
      ),
    ).toBe(true);
  });

  it('applies status filters to nodes as well as edges', () => {
    const statuses = new Set(STATUSES);
    statuses.delete('proposed');
    const filtered = filterGraph(graph, {
      query: '',
      nodeTypes: new Set(NODE_TYPES),
      statuses,
      relations: new Set(graph.edges.map((edge) => edge.relation)),
      clusterId: null,
      showRejected: false,
    });
    expect(filtered.nodes.every((node) => node.status !== 'proposed')).toBe(true);
    expect(filtered.edges.every((edge) => edge.status !== 'proposed')).toBe(true);
  });

  it('marks manually edited nodes and edges as user owned', () => {
    const proposedNode = graph.nodes.find((node) => node.origin === 'claude')!;
    const proposedEdge = graph.edges.find((edge) => edge.origin === 'claude')!;
    const withNode = replaceNode(graph, proposedNode.id, { label: 'Edited label' });
    const withEdge = replaceEdge(withNode, proposedEdge.id, { confidence: 0.5 });
    expect(withEdge.nodes.find((node) => node.id === proposedNode.id)?.origin).toBe('user');
    expect(withEdge.edges.find((edge) => edge.id === proposedEdge.id)?.origin).toBe('user');
  });

  it('increments exactly one revision during serialization', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T12:00:00Z'));
    const saved = serializeForSave(graph, 9);
    expect(saved.meta.revision).toBe(10);
    expect(saved.meta.updated_at).toBe('2026-07-23T12:00:00.000Z');
    vi.useRealTimers();
  });

  it('reports stable graph statistics', () => {
    const expectedPapers = graph.nodes.filter((node) => node.type === 'paper').length;
    const expectedConcepts = graph.nodes.filter(
      (node) => node.type !== 'paper' && node.type !== 'cluster',
    ).length;
    const expectedClusters = graph.nodes.filter((node) => node.type === 'cluster').length;
    const expectedProposed =
      graph.nodes.filter((node) => node.status === 'proposed').length +
      graph.edges.filter((edge) => edge.status === 'proposed').length;
    expect(graphStats(graph)).toEqual({
      papers: expectedPapers,
      concepts: expectedConcepts,
      clusters: expectedClusters,
      connections: graph.edges.length,
      proposed: expectedProposed,
    });
  });
});
