import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  // Shown in the fallback UI so the user knows what broke (e.g. "Prospect Pipeline").
  moduleLabel: string;
  // Called when the user clicks "Try Again" — lets the caller reset whatever
  // state led to the crash (e.g. navigate back to the list) instead of just
  // re-rendering the same broken subtree.
  onReset?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Last-resort safety net: if a render crash slips past the narrower try/catch
// guards around individual data reads (localStorage parsing, etc.), this stops
// it from taking down the whole app — only the Prospect subtree goes blank,
// with a visible recovery action, instead of a silent white screen.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[${this.props.moduleLabel}] crashed:`, error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center">
        <AlertTriangle size={32} className="text-red-500 mb-3" />
        <h2 className="text-sm font-bold text-gray-900 mb-1">{this.props.moduleLabel} ran into a problem</h2>
        <p className="text-xs text-gray-500 max-w-sm mb-1">
          Something went wrong while loading this screen. Your data has not been changed.
        </p>
        <p className="text-[10px] text-gray-400 font-mono max-w-md mb-4 break-words">{this.state.error.message}</p>
        <button
          onClick={this.handleReset}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
        >
          <RotateCcw size={14} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }
}
