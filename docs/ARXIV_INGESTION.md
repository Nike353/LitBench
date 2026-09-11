# 2026 Humanoid Loco-Manipulation Retrieval

## Scope

The committed batch covers submissions from `2026-01-01` through
`2026-07-23`. Four `cs.RO` Atom queries cover direct loco-manipulation,
humanoid manipulation, humanoid whole-body control, and humanoid locomotion
control. Results are sorted by `submittedDate` descending and deduplicated by
versionless arXiv ID.

Run:

```sh
python3 tools/retrieve_arxiv.py \
  --from 2026-01-01 --through 2026-07-23 --count 50
```

The result is
`data/imports/humanoid-loco-manipulation-2026.json`. Raw Atom responses live
under `data/imports/sources/`; SHA-256 values in the manifest prove provenance.

## Responsibility Split

Retrieval verifies only arXiv metadata, date/category constraints, ordering,
canonical URLs, and deduplication. The 50 records are candidates, not
agent-qualified papers. `agent_qualified_count` remains `null`.

The selected local agent applies the manifest's relevance policy. It must
reject incidental humanoid mentions and non-humanoid work, then use
`prompts/insert_paper.md` for PDF reading, summaries, cluster placement,
concept extraction, evidence-backed edges, and notes. Every graph addition
remains a proposal for researcher review.

Processing results are recorded in
`data/imports/humanoid-loco-manipulation-2026-state.json`. An `excluded`
record includes the agent's concrete reason; `failed` and `cancelled` records
remain retryable; `inserted` and `duplicate` records are not run again.
New semantic outcomes also record `full_text_source`: the exact arXiv HTML or
PDF URL, format, and reviewed sections/pages attested by the agent. The bridge
accepts an insertion or exclusion only when that URL appears in observed fetch
or shell-tool activity. Older outcomes without this field must be revalidated
before they are considered fully attested.

Run the read-only revalidation queue with:

```sh
python3 tools/revalidate_arxiv_outcomes.py --agent codex
```

The command executes against a disposable workspace, rejects any file mutation
or classification drift, and persists each confirmed source attestation
incrementally. It is deterministic to resume because outcomes that already
have an attestation are skipped.

## Final Results

The 50-candidate batch completed with 17 inserted proposals and 32 full-text
exclusions. All 49 terminal outcomes retain an observed arXiv HTML/PDF source,
format, reviewed-section evidence, and attestation timestamp in the portable
ledger.

One candidate, arXiv `2607.08620`, remains failed rather than classified: the
paper was withdrawn for licensing reasons and every arXiv full-text URL returns 404. The bridge made no semantic claim and applied no graph change. This is the
only shortfall from processing all 50 records.

Tests parse the committed source snapshots and use fake local-agent
executables, so verification requires neither live network access nor model
tokens.
