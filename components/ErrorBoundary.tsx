import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  // FIX: Use class property for state initialization. This is the modern and recommended approach in React,
  // making the code more concise and avoiding potential issues with `this` context in the constructor.
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-red-900/20 text-red-300">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Axiomatic Fault</h1>
            <p>A critical error occurred. Please refresh the environment.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
