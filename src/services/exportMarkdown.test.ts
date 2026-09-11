import { describe, expect, it } from 'vitest';
import { migrateAndValidateGraph } from '../domain/schema';
import { buildClusterMarkdown } from './exportMarkdown';
import canonicalGraph from '../../tests/fixtures/library/data/graph.json';

const graph = migrateAndValidateGraph(canonicalGraph).graph;

describe('cluster Markdown export', () => {
  it('exports papers, concepts, evidence, and transition notes', () => {
    const output = buildClusterMarkdown(graph, 'cluster:diffusion-policies');
    expect(output).toContain('# Literature Notes: Diffusion-Based Visuomotor Policies');
    expect(output).toContain('Diffusion Policy: Visuomotor Policy Learning');
    expect(output).toContain('## Concepts');
    expect(output).toContain('Evidence:');
    expect(output).toContain('confidence');
  });

  it('rejects unknown cluster ids', () => {
    expect(() => buildClusterMarkdown(graph, 'cluster:missing')).toThrow(/valid cluster/);
  });
});
