import { describe, expect, it } from 'vitest';
import canonicalGraph from '../../tests/fixtures/library/data/graph.json';
import { migrateAndValidateGraph } from './schema';
import {
  clusterPaperCounts,
  derivePaperMemberships,
  paperBelongsToCluster,
} from './hypergraph';

const graph = migrateAndValidateGraph(canonicalGraph).graph;

describe('hypergraph projection', () => {
  it('keeps one primary membership and caps evidence-derived secondary fields', () => {
    const memberships = derivePaperMemberships(graph);
    expect(memberships.size).toBe(
      graph.nodes.filter((node) => node.type === 'paper').length,
    );
    for (const paperMemberships of memberships.values()) {
      expect(paperMemberships.filter((item) => item.role === 'primary')).toHaveLength(1);
      expect(
        paperMemberships.filter((item) => item.role === 'secondary').length,
      ).toBeLessThanOrEqual(3);
    }
  });

  it('makes bridge membership available to filtering and field counts', () => {
    const memberships = derivePaperMemberships(graph);
    const bridge = [...memberships.entries()].find(([, items]) => items.length > 1)!;
    const secondary = bridge[1].find((item) => item.role === 'secondary')!;

    expect(paperBelongsToCluster(memberships, bridge[0], secondary.cluster.id)).toBe(true);
    expect(
      clusterPaperCounts(graph, memberships).get(secondary.cluster.id)?.bridges,
    ).toBeGreaterThan(0);
  });
});
