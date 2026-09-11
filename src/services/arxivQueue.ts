import {
  arxivBatchSchema,
  processingLedgerSchema,
  processingStateSchema,
  type ArxivBatch,
  type ProcessingRecord,
  type ProcessingLedger,
  type ProcessingState,
} from '../domain/arxiv';

export const DEFAULT_BATCH_URL = '/data/imports/adaptation-appendix-b-051-106.json';
export const DEFAULT_STATE_URL = '/data/imports/adaptation-appendix-b-051-106-state.json';

export async function loadArxivBatch(url = DEFAULT_BATCH_URL): Promise<ArxivBatch> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'No arXiv retrieval batch has been generated yet.'
        : `Could not load arXiv batch (HTTP ${response.status}).`,
    );
  }
  return arxivBatchSchema.parse(await response.json());
}

export async function loadArxivBatchFile(file: File): Promise<ArxivBatch> {
  if (file.size > 25 * 1024 * 1024) throw new Error('Batch file exceeds the 25 MB limit.');
  return arxivBatchSchema.parse(JSON.parse(await file.text()));
}

function queuedRecord(): ProcessingRecord {
  return {
    status: 'queued',
    attempts: 0,
    started_at: null,
    finished_at: null,
    reason: null,
    summary: null,
    graph_node_id: null,
    duration_s: null,
    cost_usd: null,
    full_text_source: null,
    full_text_attested_at: null,
  };
}

export function createLocalProcessingState(batch: ArxivBatch): ProcessingState {
  return {
    schema_version: 1,
    batch_id: batch.batch_id,
    updated_at: batch.generated_at,
    records: Object.fromEntries(
      batch.records.map((record) => [record.arxiv_id, queuedRecord()]),
    ),
    counts: { queued: batch.records.length },
    qualified_count: 0,
    imported_count: 0,
    excluded_count: 0,
  };
}

export function summarizeProcessingLedger(ledger: ProcessingLedger): ProcessingState {
  const counts = Object.values(ledger.records).reduce(
    (result, record) => {
      result[record.status] = (result[record.status] ?? 0) + 1;
      return result;
    },
    {} as Record<string, number>,
  );
  return {
    ...ledger,
    counts,
    qualified_count: (counts.inserted ?? 0) + (counts.duplicate ?? 0),
    imported_count: counts.inserted ?? 0,
    excluded_count: counts.excluded ?? 0,
  };
}

export async function loadProcessingState(batch: ArxivBatch): Promise<ProcessingState> {
  try {
    const response = await fetch('/api/imports/state', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const state = processingStateSchema.parse(await response.json());
    if (state.batch_id !== batch.batch_id) {
      throw new Error('Processing state belongs to a different arXiv batch.');
    }
    return state;
  } catch {
    try {
      const response = await fetch(DEFAULT_STATE_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const ledger = processingLedgerSchema.parse(await response.json());
      if (ledger.batch_id !== batch.batch_id) throw new Error('State batch mismatch.');
      return summarizeProcessingLedger(ledger);
    } catch {
      return createLocalProcessingState(batch);
    }
  }
}

export function pendingRecords(
  batch: ArxivBatch,
  state: ProcessingState,
  existingUrls: Set<string>,
) {
  return batch.records.filter(
    (record) =>
      !['inserted', 'excluded', 'duplicate'].includes(
        state.records[record.arxiv_id]?.status ?? 'queued',
      ) && !existingUrls.has(record.canonical_url),
  );
}
