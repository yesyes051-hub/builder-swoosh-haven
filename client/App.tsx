import "./global.css";

// Initialize ResizeObserver error suppression
import { initializeResizeObserverSuppression } from '@/lib/resizeObserverSuppress';
import '@/lib/resizeObserverTest'; // Make test utility available globally
initializeResizeObserverSuppression();

// Additional aggressive suppression for ResizeObserver errors
if (typeof window !== 'undefined') {
  // Override the global error handler
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    const msg = String(message || '');
    if (msg.toLowerCase().includes('resizeobserver')) {
      return true; // Prevent default error handling
    }
    return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
  };

  // Override unhandled rejection handler
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const msg = String(event.reason?.message || event.reason || '');
    if (msg.toLowerCase().includes('resizeobserver')) {
      event.preventDefault();
      return;
    }
    if (originalOnUnhandledRejection) {
      originalOnUnhandledRejection(event);
    }
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
                <circle className="opacity-30" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" fill="none" />
                <circle className="text-blue-600" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" fill="none" strokeDasharray="100" strokeDashoffset="75" />
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
                <circle className="opacity-30" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" fill="none" />
                <circle className="text-blue-600" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" fill="none" strokeDasharray="100" strokeDashoffset="75" />
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
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/daily-updates" element={
          <ProtectedRoute>
            <DailyUpdates />
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        } />
        <Route path="/interviews" element={
          <ProtectedRoute>
            <Interviews />
          </ProtectedRoute>
        } />
        <Route path="/pms" element={
          <ProtectedRoute>
            <PMSNew />
          </ProtectedRoute>
        } />
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

createRoot(document.getElementById("root")!).render(<App />);
