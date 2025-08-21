import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorMessage = error.message || "";

    // Check if this is a known React DOM error we can ignore
    const isKnownReactDOMError =
      errorMessage.includes("removeChild") ||
      errorMessage.includes("not a child of this node") ||
      errorMessage.includes(
        "createRoot() on a container that has already been passed",
      );

    if (isKnownReactDOMError) {
      console.warn("Suppressed known React DOM error:", error.message);
      // Reset error state for known errors
      this.setState({ hasError: false, error: null, errorInfo: null });
      return;
    }

    console.error("ErrorBoundary caught an error:", error);
    console.error("Error info:", errorInfo);

    // Filter out known React DOM manipulation errors caused by external scripts
    const isDOMError =
      error.message?.includes("removeChild") ||
      error.message?.includes("insertBefore") ||
      error.message?.includes("not a child of this node");

    if (isDOMError) {
      console.warn(
        "DOM manipulation error detected, likely caused by external scripts. Attempting recovery...",
      );
      // Try to recover from DOM manipulation errors
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, 100);
      return;
    }

    this.setState({ errorInfo });

    // Call the optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Check if we have a custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Check if this is a DOM manipulation error that we can recover from
      const isDOMError =
        this.state.error?.message?.includes("removeChild") ||
        this.state.error?.message?.includes("insertBefore") ||
        this.state.error?.message?.includes("not a child of this node");

      if (isDOMError) {
        // For DOM errors, try to render a minimal recovery UI
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  Temporary Issue Detected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  A temporary interface issue occurred. This is usually resolved
                  automatically.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={this.handleReset}
                    size="sm"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    size="sm"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // For other errors, show a more detailed error screen
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                An unexpected error occurred in the application. Our team has
                been notified.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <summary className="font-medium text-red-800 cursor-pointer">
                    Error Details (Development Mode)
                  </summary>
                  <div className="mt-3 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline">
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
