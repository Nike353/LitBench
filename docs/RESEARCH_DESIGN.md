# Research and clustering design

The canonical library is a typed graph, not a fixed taxonomy. A paper can have
one primary cluster for stable layout, explicit secondary `belongs_to` edges,
and links to methods, claims, representations, and other papers. Accepted
secondary memberships are preserved. The universe can also infer up to three
additional memberships from graph evidence; these are a view over the graph,
not automatic rewrites of your organization.

For a personal research library, keep curated clusters as the default. People
organize literature around research questions that can overlap and change.
An agent can propose renaming, moving, creating, and connecting records, but the
user reviews the exact bundle. Manual controls provide the same ownership.

Embedding similarity or graph community detection would be useful future
suggestion mechanisms as libraries grow. They should produce reviewable proposed
groups, with evidence and an explanation of why the papers belong together.
Similarity alone does not establish a scientific relationship, and automatic
global reclustering would disrupt a user's existing mental map. No embedding
service, vector database, or clustering model is required by this release.

## Implementation

- React renders Discuss, Compare, graph inspection, and manual editing.
- The Python server selects the personal workspace independently of code/assets.
- `tools/research.py` assembles bounded library context and invokes the selected
  CLI with a strict output schema. Provider invocations are ephemeral.
- Answers, citations, comparison cells, and proposed graph operations are
  validated before storage. Comparisons must contain the complete requested grid.
- Applying a proposal validates the graph revision and the entire change bundle.
  An intent journal recovers graph and conversation state together after a crash.
- Research and insertion share a run lock. Cancellation terminates the process
  group; temporary invocation files are removed. The server recovers interrupted
  turns without silently restarting paid model calls.

Notes generated during research live on graph records; original paper Markdown
remains available. Graph drafts are keyed by workspace identity to avoid mixing
libraries served from the same origin.
