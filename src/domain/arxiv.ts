import { z } from 'zod';

export const ARXIV_QUEUE_STATUSES = ['queued'] as const;

export const PROCESSING_STATUSES = [
  'queued',
  'processing',
  'inserted',
  'excluded',
  'failed',
  'cancelled',
  'duplicate',
] as const;

export const arxivRecordSchema = z.object({
  arxiv_id: z.string(),
  canonical_url: z.string().url(),
  title: z.string().min(1),
  authors: z.array(z.string()).min(1),
  abstract: z.string().min(1),
  submitted_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  categories: z.array(z.string()).min(1),
  primary_category: z.string(),
  query_id: z.string(),
  query_terms: z.array(z.string()),
  retrieved_at: z.string().datetime({ offset: true }),
  retrieval_match: z.object({
    query_ids: z.array(z.string()).min(1),
    matched_terms: z.array(z.string()),
  }),
  queue_status: z.enum(ARXIV_QUEUE_STATUSES).default('queued'),
  attempts: z.number().int().min(0).default(0),
  last_error: z.string().nullable().default(null),
  appendix_entry: z.number().int().positive().optional(),
  ledger_year: z.number().int().min(1900).max(2100).nullable().optional(),
  ledger_title: z.string().min(1).optional(),
  ledger_source_url: z.string().url().nullable().optional(),
});

export const arxivBatchSchema = z.object({
  schema_version: z.literal(1),
  batch_id: z.string(),
  generated_at: z.string().datetime({ offset: true }),
  date_range: z.object({
    from: z.string(),
    through: z.string(),
  }),
  query: z.object({
    endpoint: z.string().url(),
    search_queries: z.array(z.string()),
    sort_by: z.literal('submittedDate'),
    sort_order: z.literal('descending'),
  }),
  sources: z.array(
    z.object({
      query_id: z.string(),
      snapshot_file: z.string(),
      sha256: z.string().length(64),
      result_count: z.number().int().min(0),
    }),
  ),
  relevance_policy: z.object({
    description: z.string(),
    evaluated_by: z.string().min(1),
    hard_requirements: z.array(z.string()),
  }),
  requested_count: z.number().int().positive(),
  retrieved_count: z.number().int().min(0),
  agent_qualified_count: z.number().int().min(0).nullable(),
  records: z.array(arxivRecordSchema),
  retrieval_exclusions: z.array(
    z.object({
      arxiv_id: z.string(),
      title: z.string(),
      reason: z.string(),
    }),
  ),
});

export const processingRecordSchema = z.object({
  status: z.enum(PROCESSING_STATUSES),
  attempts: z.number().int().min(0),
  started_at: z.string().datetime({ offset: true }).nullable(),
  finished_at: z.string().datetime({ offset: true }).nullable(),
  reason: z.string().nullable(),
  summary: z.string().nullable(),
  graph_node_id: z.string().nullable(),
  duration_s: z.number().min(0).nullable(),
  cost_usd: z.number().min(0).nullable(),
  full_text_source: z
    .object({
      url: z.string().url(),
      format: z.enum(['arxiv-html', 'arxiv-pdf']),
      evidence: z.string().min(1),
    })
    .nullable()
    .default(null),
  full_text_attested_at: z.string().datetime({ offset: true }).nullable().default(null),
});

export const processingLedgerSchema = z.object({
  schema_version: z.literal(1),
  batch_id: z.string(),
  updated_at: z.string().datetime({ offset: true }),
  records: z.record(processingRecordSchema),
});

export const processingStateSchema = processingLedgerSchema.extend({
  counts: z.record(z.number().int().min(0)),
  qualified_count: z.number().int().min(0),
  imported_count: z.number().int().min(0),
  excluded_count: z.number().int().min(0),
});

export type ArxivBatch = z.infer<typeof arxivBatchSchema>;
export type ArxivRecord = z.infer<typeof arxivRecordSchema>;
export type ProcessingRecord = z.infer<typeof processingRecordSchema>;
export type ProcessingLedger = z.infer<typeof processingLedgerSchema>;
export type ProcessingState = z.infer<typeof processingStateSchema>;
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];
