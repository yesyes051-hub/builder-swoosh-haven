import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically designed to catch ResizeObserver-related errors
 * and prevent them from crashing the React application
 */
class ResizeObserverErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a ResizeObserver error
    const isResizeObserverError = error.message && (
      error.message.includes('ResizeObserver') ||
      error.message.includes('resizeobserver') ||
      error.name === 'ResizeObserverError'
    );

    if (isResizeObserverError) {
      // For ResizeObserver errors, don't change state - just suppress the error
      console.debug('ResizeObserver error caught and suppressed:', error.message);
      return { hasError: false };
    }

    // For other errors, let them bubble up normally
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if this is a ResizeObserver error
    const isResizeObserverError = error.message && (
      error.message.includes('ResizeObserver') ||
      error.message.includes('resizeobserver') ||
      error.name === 'ResizeObserverError'
    );

    if (isResizeObserverError) {
      // Suppress ResizeObserver errors
      console.debug('ResizeObserver error boundary caught:', error.message);
      // Reset the error state to continue normal operation
      this.setState({ hasError: false });
      return;
    }

    // For non-ResizeObserver errors, log them normally
    console.error('Error boundary caught:', error, errorInfo);
    this.setState({ hasError: true, error });
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Render fallback UI only for non-ResizeObserver errors
      return this.props.fallback || (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error.message}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ResizeObserverErrorBoundary;
