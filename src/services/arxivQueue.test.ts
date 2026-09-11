import { describe, expect, it } from 'vitest';
import { arxivBatchSchema } from '../domain/arxiv';
import {
  createLocalProcessingState,
  pendingRecords,
  summarizeProcessingLedger,
} from './arxivQueue';
import canonicalBatch from '../../tests/fixtures/library/data/imports/humanoid-loco-manipulation-2026.json';

const batch = arxivBatchSchema.parse(canonicalBatch);

describe('arXiv queue contract', () => {
  it('loads 50 unique synthetic candidates without qualification claims', () => {
    expect(batch.records).toHaveLength(50);
    expect(new Set(batch.records.map((record) => record.arxiv_id)).size).toBe(50);
    expect(batch.agent_qualified_count).toBeNull();
    expect(batch.relevance_policy.evaluated_by).toBe('selected-local-agent');
    expect(batch.records.every((record) => record.queue_status === 'queued')).toBe(true);
    expect(batch.date_range).toEqual({
      from: '2026-01-01',
      through: '2026-07-23',
    });
  });

  it('does not enqueue records already represented in the graph', () => {
    const duplicate = batch.records[0].canonical_url;
    const pending = pendingRecords(
      batch,
      createLocalProcessingState(batch),
      new Set([duplicate]),
    );
    expect(pending).toHaveLength(49);
    expect(pending.some((record) => record.canonical_url === duplicate)).toBe(false);
  });

  it('does not rerun durable inserted, excluded, or duplicate outcomes', () => {
    const state = createLocalProcessingState(batch);
    state.records[batch.records[0].arxiv_id].status = 'inserted';
    state.records[batch.records[1].arxiv_id].status = 'excluded';
    state.records[batch.records[2].arxiv_id].status = 'duplicate';
    expect(pendingRecords(batch, state, new Set())).toHaveLength(47);
  });

  it('derives portable qualification counts from the file-based ledger', () => {
    const state = createLocalProcessingState(batch);
    state.records[batch.records[0].arxiv_id].status = 'inserted';
    state.records[batch.records[1].arxiv_id].status = 'excluded';
    const summary = summarizeProcessingLedger({
      schema_version: state.schema_version,
      batch_id: state.batch_id,
      updated_at: state.updated_at,
      records: state.records,
    });
    expect(summary.qualified_count).toBe(1);
    expect(summary.imported_count).toBe(1);
    expect(summary.excluded_count).toBe(1);
  });
});
