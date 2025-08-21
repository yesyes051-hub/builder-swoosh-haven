// DOM Error Suppression Utility
// This handles known React DOM issues in development and production

export const initializeDOMErrorSuppression = () => {
  if (typeof window === "undefined") return;

  // Track if we've already initialized
  if ((window as any).__domErrorSuppressionInitialized) return;
  (window as any).__domErrorSuppressionInitialized = true;

  // Helper function to check for React DOM errors
  const isReactDOMError = (message: string) => {
    const msg = message.toLowerCase();
    return (
      msg.includes("removechild") ||
      msg.includes("not a child of this node") ||
      msg.includes("createroot() on a container") ||
      msg.includes("failed to execute") ||
      msg.includes("insertbefore") ||
      (msg.includes("node") && msg.includes("remove"))
    );
  };

  // Override console.error to suppress React DOM errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = String(args[0] || "");
    if (isReactDOMError(message)) {
      // Log as warning instead of error
      console.warn("Suppressed React DOM error:", message);
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Add global error event listener
  window.addEventListener(
    "error",
    (event) => {
      const message = String(event.message || event.error?.message || "");
      if (isReactDOMError(message)) {
        console.warn("Suppressed DOM error event:", message);
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    },
    { capture: true }
  );

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const message = String(event.reason?.message || event.reason || "");
    if (isReactDOMError(message)) {
      console.warn("Suppressed unhandled rejection:", message);
      event.preventDefault();
      return;
    }
  });

  console.log("✅ DOM error suppression initialized");
};

// Auto-initialize when imported
initializeDOMErrorSuppression();
