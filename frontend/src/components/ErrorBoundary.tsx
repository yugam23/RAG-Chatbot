/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console (future: send to monitoring service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // Future: Send to error monitoring service
    // errorReportingService.log({ error, errorInfo });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-black p-4">
          <div className="text-center max-w-md w-full p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
            <AlertTriangle size={48} className="text-amber-500 mb-4 mx-auto drop-shadow-lg" />
            <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-6">We're sorry, but something unexpected happened.</p>

            {(this.props.showDetails ?? import.meta.env.DEV) && this.state.error && (
              <details className="text-left mb-6 bg-black/40 p-4 rounded-lg max-h-48 overflow-auto border border-white/5">
                <summary className="cursor-pointer text-slate-300 font-medium mb-2 hover:text-white transition-colors">
                  Error Details
                </summary>
                <pre className="text-xs text-red-300 whitespace-pre-wrap break-all font-mono">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="text-xs text-slate-500 mt-2 whitespace-pre-wrap break-all font-mono">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-medium hover:translate-y-[-2px] hover:shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95"
              onClick={this.handleRetry}
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
