/**
 * Utility to suppress ResizeObserver errors that are common in React applications
 * These errors are typically non-critical and related to timing issues with DOM updates
 */

class ResizeObserverErrorSuppressor {
  private static instance: ResizeObserverErrorSuppressor;
  private isInitialized = false;

  public static getInstance(): ResizeObserverErrorSuppressor {
    if (!ResizeObserverErrorSuppressor.instance) {
      ResizeObserverErrorSuppressor.instance = new ResizeObserverErrorSuppressor();
    }
    return ResizeObserverErrorSuppressor.instance;
  }

  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Suppress console errors
    this.suppressConsoleErrors();
    
    // Suppress window error events
    this.suppressWindowErrors();
    
    // Patch ResizeObserver if available
    this.patchResizeObserver();

    this.isInitialized = true;
  }

  private suppressConsoleErrors(): void {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args[0];
      if (typeof message === 'string' && this.isResizeObserverError(message)) {
        return; // Suppress the error
      }
      originalError.apply(console, args);
    };
  }

  private suppressWindowErrors(): void {
    window.addEventListener('error', (event) => {
      if (event.message && this.isResizeObserverError(event.message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && 
          typeof event.reason === 'object' && 
          event.reason.message &&
          this.isResizeObserverError(event.reason.message)) {
        event.preventDefault();
        return false;
      }
    });
  }

  private patchResizeObserver(): void {
    if (!window.ResizeObserver) {
      return;
    }

    const OriginalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class extends OriginalResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        super((entries, observer) => {
          try {
            callback(entries, observer);
          } catch (error) {
            // Silently handle ResizeObserver-related errors
            if (error instanceof Error && 
                (error.message.includes('ResizeObserver') || 
                 error.name === 'ResizeObserverError')) {
              return;
            }
            throw error;
          }
        });
      }
    };
  }

  private isResizeObserverError(message: string): boolean {
    const resizeObserverPatterns = [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'ResizeObserver',
      'ResizeObserverError'
    ];

    return resizeObserverPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  public cleanup(): void {
    // Restore original console.error if needed
    // This method can be called when the app unmounts
    this.isInitialized = false;
  }
}

// Initialize the suppressor
export const initializeResizeObserverSuppression = (): void => {
  ResizeObserverErrorSuppressor.getInstance().initialize();
};

// Export for manual cleanup if needed
export const cleanupResizeObserverSuppression = (): void => {
  ResizeObserverErrorSuppressor.getInstance().cleanup();
};
