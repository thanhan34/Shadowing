import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#232323] flex flex-col items-center justify-center p-4">
          <div className="bg-[#2b2b2b] p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-[#fc5d01] text-xl font-bold mb-4">Something went wrong</h2>
            <div className="text-white mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#fc5d01] text-white rounded hover:bg-[#ff6a28] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
