import { AlertTriangle, Network, RotateCcw } from 'lucide-react';

export function LoadingState() {
  return (
    <main className="boot-state" aria-live="polite">
      <div className="boot-mark">
        <Network aria-hidden="true" />
      </div>
      <div>
        <strong>Orbis</strong>
        <span>Loading research graph</span>
      </div>
      <div className="loading-track">
        <span />
      </div>
    </main>
  );
}

export function WorkspaceError({ message }: { message: string }) {
  return (
    <main className="fatal-state">
      <AlertTriangle aria-hidden="true" />
      <h1>Workspace unavailable</h1>
      <p>{message}</p>
      <button className="button primary" onClick={() => window.location.reload()}>
        <RotateCcw size={16} aria-hidden="true" />
        Try again
      </button>
    </main>
  );
}
