import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Terminal, RefreshCw } from 'lucide-react';
import { appLogger } from '../services/logger';
import { triggerAutoOpen } from '../services/global-error-trap';

interface Props {
  children: ReactNode;
  onOpenLogDrawer?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    const logEntry = appLogger.scope('REACT:CRASH').error(
      error.message || 'React render greška',
      error,
      { componentStack: errorInfo.componentStack }
    );
    if (logEntry) {
      triggerAutoOpen(logEntry);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleOpenLog = () => {
    if (this.props.onOpenLogDrawer) {
      this.props.onOpenLogDrawer();
    }
  };

  public render() {
    if (this.state.hasError) {
      const { error } = this.state;

      return (
        <div className="min-h-screen bg-[var(--bg-canvas)] text-white flex items-center justify-center p-6 font-mono">
          <div className="max-w-xl w-full bg-[var(--bg-surface)] border border-[#EF4444]/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-[#EF4444]">
              <div className="w-10 h-10 rounded bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-sm font-bold uppercase tracking-wider text-white">
                  Kritična Greška u Radu Sučelja
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  React komponenta je naišla na neočekivano stanje
                </p>
              </div>
            </div>

            <div className="p-3 bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-xs text-slate-300 space-y-1 overflow-x-auto">
              <div className="text-[#EF4444] font-bold">
                {error?.name || 'Error'}: {error?.message || 'Nepoznata greška'}
              </div>
              {error?.stack && (
                <pre className="text-[10px] text-[var(--text-muted)] mt-2 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {error.stack}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={this.handleOpenLog}
                className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-subtle)] text-white border border-[var(--border-subtle)] text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Terminal className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                Otvori Dnevnik Grešaka
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-3 py-1.5 bg-[var(--bg-canvas)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white border border-[var(--border-subtle)] text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Pokušaj ponovno
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-1.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Osvježi Stranicu (F5)
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
