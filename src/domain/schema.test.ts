import { describe, expect, it } from 'vitest';
import { graphSchema, migrateAndValidateGraph } from './schema';
import canonicalGraph from '../../tests/fixtures/library/data/graph.json';

const graphV1 = structuredClone(canonicalGraph);
graphV1.meta.schema_version = 1;

describe('graph schema and migration', () => {
  it('migrates the canonical v1 graph without changing graph content', () => {
    const result = migrateAndValidateGraph(graphV1);
    expect(result.migratedFrom).toBe(1);
    expect(result.graph.meta.schema_version).toBe(2);
    expect(result.graph.nodes).toEqual(graphV1.nodes);
    expect(result.graph.edges).toEqual(graphV1.edges);
  });

  it('accepts a current v2 graph', () => {
    const graphV2 = structuredClone(graphV1);
    graphV2.meta.schema_version = 2;
    const result = migrateAndValidateGraph(graphV2);
    expect(result.migratedFrom).toBeNull();
  });

  it('rejects duplicate identifiers and dangling endpoints', () => {
    const malformed = structuredClone(graphV1);
    malformed.nodes.push(structuredClone(malformed.nodes[0]));
    malformed.edges[0].source = 'paper:missing';
    expect(() => graphSchema.parse(malformed)).toThrow(/Duplicate node id|Unknown source/);
  });

  it('rejects future schema versions', () => {
    const future = structuredClone(graphV1);
    future.meta.schema_version = 99;
    expect(() => migrateAndValidateGraph(future)).toThrow(/newer/);
  });
});
