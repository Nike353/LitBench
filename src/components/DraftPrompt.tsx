import { Clock3, RotateCcw, Trash2 } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

export function DraftPrompt() {
  const available = useWorkspaceStore((state) => state.draftAvailable);
  const restore = useWorkspaceStore((state) => state.restoreDraft);
  const dismiss = useWorkspaceStore((state) => state.dismissDraft);
  if (!available) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="draft-title">
        <span className="modal-icon">
          <Clock3 aria-hidden="true" />
        </span>
        <h2 id="draft-title">Restore unsaved work?</h2>
        <p>An autosaved draft matches the current graph revision.</p>
        <div className="modal-actions">
          <button className="button secondary" onClick={dismiss}>
            <Trash2 size={15} /> Discard
          </button>
          <button className="button primary" onClick={restore} autoFocus>
            <RotateCcw size={15} /> Restore draft
          </button>
        </div>
      </div>
    </div>
  );
}
