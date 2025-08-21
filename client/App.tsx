import "./global.css";

// Initialize ResizeObserver error suppression
import { initializeResizeObserverSuppression } from "@/lib/resizeObserverSuppress";
import "@/lib/resizeObserverTest"; // Make test utility available globally
initializeResizeObserverSuppression();

// Additional aggressive suppression for ResizeObserver and DOM errors
if (typeof window !== "undefined") {
  // Helper function to check for ResizeObserver errors
  const isResizeObserverError = (message: string) => {
    const msg = message.toLowerCase();
    return (
      msg.includes("resizeobserver") ||
      msg.includes("loop completed") ||
      msg.includes("undelivered notifications") ||
      msg.includes("loop limit exceeded") ||
      msg.includes("resize observer")
    );
  };

  // Helper function to check for DOM manipulation errors caused by external scripts
  const isDOMManipulationError = (message: string) => {
    const msg = message.toLowerCase();
    return (
      msg.includes("removechild") ||
      msg.includes("insertbefore") ||
      msg.includes("not a child of this node") ||
      msg.includes("failed to execute") ||
      (msg.includes("node") && (msg.includes("remove") || msg.includes("insert")))
    );
  };

  // Override the global error handler
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const msg = String(message || "");
    if (isResizeObserverError(msg) || isDOMManipulationError(msg)) {
      console.warn('Suppressed known error:', msg);
      return true; // Prevent default error handling
    }
    return originalOnError
      ? originalOnError(message, source, lineno, colno, error)
      : false;
  };

  // Override unhandled rejection handler
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function (event: PromiseRejectionEvent) {
    const msg = String(event.reason?.message || event.reason || "");
    if (isResizeObserverError(msg) || isDOMManipulationError(msg)) {
      console.warn('Suppressed known promise rejection:', msg);
      event.preventDefault();
      return;
    }
    if (originalOnUnhandledRejection) {
      originalOnUnhandledRejection.call(this, event);
    }
  };

  // Also catch errors during the error event itself
  window.addEventListener(
    "error",
    (event) => {
      const msg = String(event.message || event.error?.message || "");
      if (isResizeObserverError(msg) || isDOMManipulationError(msg)) {
        console.warn('Suppressed error event:', msg);
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    },
    true,
  );

  // Add a catch-all for any remaining console errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const msg = String(args[0] || "");
    if (isResizeObserverError(msg) || isDOMManipulationError(msg)) {
      return; // Suppress known console errors
    }
    originalConsoleError.apply(console, args);
  };
}

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ResizeObserverErrorBoundary from "./components/ResizeObserverErrorBoundary";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DailyUpdates from "./pages/DailyUpdates";
import Leaderboard from "./pages/Leaderboard";
import Interviews from "./pages/Interviews";
import PMSNew from "./pages/PMSNew";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4">
              <svg viewBox="0 0 50 50">
                <circle
                  className="opacity-30"
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  className="text-blue-600"
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray="100"
                  strokeDashoffset="75"
                />
              </svg>
            </div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    return user ? <>{children}</> : <Navigate to="/login" replace />;
  };

  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4">
              <svg viewBox="0 0 50 50">
                <circle
                  className="opacity-30"
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  className="text-blue-600"
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray="100"
                  strokeDashoffset="75"
                />
              </svg>
            </div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily-updates"
          element={
            <ProtectedRoute>
              <DailyUpdates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews"
          element={
            <ProtectedRoute>
              <Interviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pms"
          element={
            <ProtectedRoute>
              <PMSNew />
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ResizeObserverErrorBoundary>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ResizeObserverErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

// Prevent multiple createRoot calls during development hot reloads
const container = document.getElementById("root")!;

// Store root instance to prevent recreation
let root: ReturnType<typeof createRoot>;

// Check if root already exists (for hot module reloading in development)
if (!(container as any)._reactRoot) {
  root = createRoot(container);
  (container as any)._reactRoot = root;
} else {
  root = (container as any)._reactRoot;
}

root.render(<App />);
