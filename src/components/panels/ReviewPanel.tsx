import { Check, GitPullRequestArrow, HelpCircle, X } from 'lucide-react';
import { indexNodes, proposedItems } from '../../domain/graph';
import { useWorkspaceStore } from '../../store/workspaceStore';

export function ReviewPanel() {
  const graph = useWorkspaceStore((state) => state.graph)!;
  const select = useWorkspaceStore((state) => state.select);
  const selection = useWorkspaceStore((state) => state.selection);
  const setStatus = useWorkspaceStore((state) => state.setStatus);
  const query = useWorkspaceStore((state) =>
    state.filters.query.trim().toLocaleLowerCase(),
  );
  const allItems = proposedItems(graph);
  const nodes = indexNodes(graph);
  const items = allItems.filter(({ kind, item }) => {
    if (!query) return true;
    const searchable =
      kind === 'node'
        ? [
            item.label,
            item.description,
            item.paper?.title,
            item.paper?.authors.join(' '),
            item.paper?.summary,
          ]
        : [
            item.relation,
            item.transition_note,
            item.evidence,
            nodes.get(item.source)?.label,
            nodes.get(item.target)?.label,
          ];
    return searchable.filter(Boolean).join(' ').toLocaleLowerCase().includes(query);
  });

  return (
    <div className="panel-scroll">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Human review</span>
          <h2>Proposal queue</h2>
        </div>
        <span className="large-count">
          {items.length}
          {query && <small>/{allItems.length}</small>}
        </span>
      </div>
      <div className="review-list">
        {items.map(({ kind, item }) => {
          const label =
            kind === 'node'
              ? item.label
              : `${nodes.get(item.source)?.label ?? item.source} → ${nodes.get(item.target)?.label ?? item.target}`;
          return (
            <article
              key={`${kind}:${item.id}`}
              className={selection?.id === item.id ? 'active' : ''}
            >
              <button className="review-main" onClick={() => select({ kind, id: item.id })}>
                <span className="proposal-mark">
                  <GitPullRequestArrow size={16} aria-hidden="true" />
                </span>
                <span>
                  <small>
                    {kind === 'node' ? item.type.replace('_', ' ') : item.relation}
                  </small>
                  <strong>{label}</strong>
                </span>
              </button>
              <div className="review-actions">
                <button
                  className="accept"
                  title="Accept proposal"
                  aria-label={`Accept ${label}`}
                  onClick={() => setStatus(kind, item.id, 'accepted')}
                >
                  <Check size={15} />
                </button>
                <button
                  className="uncertain"
                  title="Mark uncertain"
                  aria-label={`Mark ${label} uncertain`}
                  onClick={() => setStatus(kind, item.id, 'uncertain')}
                >
                  <HelpCircle size={15} />
                </button>
                <button
                  className="reject"
                  title="Reject proposal"
                  aria-label={`Reject ${label}`}
                  onClick={() => setStatus(kind, item.id, 'rejected')}
                >
                  <X size={15} />
                </button>
              </div>
            </article>
          );
        })}
        {items.length === 0 && (
          <div className="empty-panel">
            <Check size={24} aria-hidden="true" />
            <strong>{query ? 'No matching proposals' : 'Queue is clear'}</strong>
            <p>
              {query
                ? 'No proposed records match the current search.'
                : 'There are no agent proposals awaiting a decision.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
