import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(readable);
      if (parsed && typeof parsed === 'object' && 'error' in parsed) {
        if (String(parsed.error).includes('Quota exceeded')) {
          readable =
            'Firestore daily free-tier quota has been reached. Quota resets automatically the next day.';
        } else if (String(parsed.error).includes('Missing or insufficient permissions')) {
          readable = `Permission denied while performing ${parsed.operationType || 'access'} on ${
            parsed.path || 'database'
          }. Ensure your email is verified and your plan supports this action.`;
        } else {
          readable = String(parsed.error);
        }
      }
    } catch {
      // Plain error string
    }
    return { hasError: true, message: readable };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Return Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
