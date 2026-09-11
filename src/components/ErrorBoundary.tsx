import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('LitBench rendering error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="fatal-state">
        <AlertTriangle aria-hidden="true" />
        <h1>LitBench could not render</h1>
        <p>{this.state.error.message}</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          <RotateCcw size={16} aria-hidden="true" />
          Reload workspace
        </button>
      </main>
    );
  }
}
