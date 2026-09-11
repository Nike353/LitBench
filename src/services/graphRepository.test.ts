import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadGraph, RevisionConflictError, saveGraph } from './graphRepository';
import { migrateAndValidateGraph } from '../domain/schema';
import canonicalGraph from '../../tests/fixtures/library/data/graph.json';

const rawGraph = canonicalGraph;
const graph = migrateAndValidateGraph(rawGraph).graph;

describe('graph repository', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('prefers the canonical local API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(rawGraph), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const result = await loadGraph();
    expect(result.mode).toBe('api');
    expect(result.migratedFrom).toBeNull();
  });

  it('falls back to the static graph when the API is unavailable', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify(rawGraph), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const result = await loadGraph();
    expect(result.mode).toBe('http');
  });

  it('surfaces revision conflicts from API saves', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ current_revision: 4 }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    await expect(saveGraph(graph, 3, 'api')).rejects.toEqual(
      expect.objectContaining<Partial<RevisionConflictError>>({
        name: 'RevisionConflictError',
        currentRevision: 4,
      }),
    );
  });
});
