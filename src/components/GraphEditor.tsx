import { useState } from 'react';
import { graphSchema, type GraphNode } from '../domain/schema';
import { useWorkspaceStore } from '../store/workspaceStore';

export function GraphEditor({ sourceId = '' }: { sourceId?: string }) {
  const graph = useWorkspaceStore((s) => s.graph)!;
  const replace = useWorkspaceStore((s) => s.replaceGraph);
  const toast = useWorkspaceStore((s) => s.addToast);
  const [mode, setMode] = useState<'cluster' | 'method' | 'connection'>(
    sourceId ? 'connection' : 'cluster',
  );
  const [label, setLabel] = useState('');
  const [source, setSource] = useState(sourceId);
  const [target, setTarget] = useState('');
  const [relation, setRelation] = useState('builds_on');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [confidence, setConfidence] = useState(0.7);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  function create() {
    setError('');
    try {
      let next = graph;
      if (mode === 'connection') {
        if (!source || !target || source === target)
          throw new Error('Choose two different records.');
        if (!relation.trim() || !reason.trim() || !evidence.trim())
          throw new Error('Add a relation, explanation, and evidence.');
        if (
          graph.edges.some(
            (e) =>
              e.source === source && e.target === target && e.relation === relation.trim(),
          )
        )
          throw new Error('That connection already exists.');
        const number = Math.max(0, ...graph.edges.map((e) => Number(e.id.slice(1)))) + 1;
        next = {
          ...graph,
          edges: [
            ...graph.edges,
            {
              id: `e${String(number).padStart(3, '0')}`,
              source,
              target,
              relation: relation.trim(),
              transition_note: reason.trim(),
              evidence: evidence.trim(),
              confidence,
              status: 'accepted',
              origin: 'user',
              created_at: new Date().toISOString().slice(0, 10),
            },
          ],
        };
      } else {
        if (!label.trim()) throw new Error('Enter a name.');
        const slug =
          label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'record';
        let id = `${mode}:${slug}`;
        let suffix = 2;
        while (graph.nodes.some((n) => n.id === id)) id = `${mode}:${slug}-${suffix++}`;
        const node: GraphNode = {
          id,
          type: mode,
          label: label.trim(),
          description: reason.trim(),
          origin: 'user',
          status: 'accepted',
          created_at: new Date().toISOString().slice(0, 10),
        };
        next = { ...graph, nodes: [...graph.nodes, node] };
      }
      replace(graphSchema.parse(next));
      toast('Added to your draft. Save changes to keep it.', 'success');
      setOpen(false);
      setLabel('');
      setReason('');
      setEvidence('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="manual-editor">
      <button className="button secondary full" onClick={() => setOpen(!open)}>
        {open
          ? 'Close editor'
          : sourceId
            ? 'Create a connection'
            : 'Create cluster, method, or connection'}
      </button>
      {open && (
        <div className="inspector-form">
          <label>
            New record
            <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
              <option value="cluster">Cluster</option>
              <option value="method">Method</option>
              <option value="connection">Connection</option>
            </select>
          </label>
          {mode !== 'connection' ? (
            <label>
              Name
              <input
                value={label}
                maxLength={250}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
          ) : (
            <>
              <label>
                From
                <select value={source} onChange={(e) => setSource(e.target.value)}>
                  <option value="">Choose source</option>
                  {graph.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                To
                <select value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="">Choose target</option>
                  {graph.nodes
                    .filter((n) => n.id !== source)
                    .map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.label}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Relation
                <input
                  list="relationship-options"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                />
                <datalist id="relationship-options">
                  {[
                    'builds_on',
                    'extends',
                    'contrasts',
                    'uses_method',
                    'belongs_to',
                    'supports',
                    'questions',
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </datalist>
              </label>
            </>
          )}
          <label>
            {mode === 'connection' ? 'Why are they connected?' : 'Description'}
            <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {mode === 'connection' && (
            <>
              <label>
                Evidence
                <textarea
                  rows={2}
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                />
              </label>
              <label>
                Confidence · {confidence.toFixed(2)}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                />
              </label>
            </>
          )}
          {error && (
            <p role="alert" className="research-warning">
              {error}
            </p>
          )}
          <button className="button primary full" onClick={create}>
            Add {mode}
          </button>
        </div>
      )}
    </section>
  );
}
