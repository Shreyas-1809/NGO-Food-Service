import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F3F0EA] dark:bg-[#0F1A33] p-6 text-center">
          <div className="bg-white dark:bg-[#0F1A33] p-8 rounded-2xl shadow-xl max-w-xl w-full border border-[#E5E1D8] dark:border-[#1E2D52]/30">
            <div className="w-16 h-16 bg-[#F3F0EA] dark:bg-[#0F1A33]/30 text-[#18315E] dark:text-[#D9B65D] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[#18315E] dark:text-white mb-2">Something went wrong</h1>
            <p className="text-[#60708B] dark:text-slate-300 mb-6">
              The application encountered an unexpected error.
            </p>
            {this.state.error && (
              <div className="bg-[#F3F0EA] dark:bg-[#0F1A33] rounded-lg p-4 mb-6 text-left overflow-auto max-h-48 text-xs text-[#18315E] dark:text-slate-300 font-mono">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white font-bold rounded-xl transition-colors w-full sm:w-auto"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;








