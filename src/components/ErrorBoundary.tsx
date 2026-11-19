import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Catches a crash inside part of the screen so the rest of the app keeps working. Shows `fallback`
 * (or a small "this part couldn't load" card) instead of a blank page. Errors go to the console only.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; name: string; fallback?: (reset: () => void) => ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(`[Squzo] ${this.props.name} crashed:`, error, info.componentStack);
  }

  reset = () => this.setState({ failed: false });

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.reset);
    return (
      <div role="alert" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">This part couldn’t load.</p>
        <p className="text-xs text-slate-400 mt-1">Your data is safe. It may be a problem with the connection or with data from the server.</p>
        <button onClick={this.reset} className="mt-3 rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white">
          Try again
        </button>
      </div>
    );
  }
}
