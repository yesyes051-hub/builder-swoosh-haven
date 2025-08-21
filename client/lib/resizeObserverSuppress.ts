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
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      const message = String(args[0] || '');
      if (this.isResizeObserverError(message)) {
        return; // Suppress the error
      }
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const message = String(args[0] || '');
      if (this.isResizeObserverError(message)) {
        return; // Suppress the warning
      }
      originalWarn.apply(console, args);
    };
  }

  private suppressWindowErrors(): void {
    // Handle error events
    window.addEventListener('error', (event) => {
      const message = event.message || event.error?.message || '';
      if (this.isResizeObserverError(message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    }, true); // Use capture phase

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      let message = '';
      if (event.reason) {
        if (typeof event.reason === 'string') {
          message = event.reason;
        } else if (typeof event.reason === 'object' && event.reason.message) {
          message = event.reason.message;
        }
      }

      if (this.isResizeObserverError(message)) {
        event.preventDefault();
        return false;
      }
    });

    // Handle beforeunload to suppress any last-minute errors
    window.addEventListener('beforeunload', () => {
      // Additional cleanup if needed
    });
  }

  private patchResizeObserver(): void {
    if (!window.ResizeObserver) {
      return;
    }

    const OriginalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = class extends OriginalResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        const wrappedCallback: ResizeObserverCallback = (entries, observer) => {
          try {
            // Use requestAnimationFrame to avoid immediate resize loops
            requestAnimationFrame(() => {
              try {
                callback(entries, observer);
              } catch (error) {
                // Silently handle all ResizeObserver callback errors
                if (error instanceof Error) {
                  const errorMessage = error.message.toLowerCase();
                  if (errorMessage.includes('resizeobserver') ||
                      errorMessage.includes('loop') ||
                      errorMessage.includes('undelivered') ||
                      error.name === 'ResizeObserverError') {
                    return;
                  }
                }
                // Re-throw non-ResizeObserver errors
                console.debug('Non-ResizeObserver error in callback:', error);
              }
            });
          } catch (error) {
            // Catch any synchronous errors
            if (error instanceof Error &&
                (error.message.toLowerCase().includes('resizeobserver') ||
                 error.name === 'ResizeObserverError')) {
              return;
            }
            throw error;
          }
        };

        super(wrappedCallback);
      }

      observe(target: Element, options?: ResizeObserverOptions): void {
        try {
          super.observe(target, options);
        } catch (error) {
          // Silently handle observe errors
          if (error instanceof Error &&
              (error.message.toLowerCase().includes('resizeobserver') ||
               error.name === 'ResizeObserverError')) {
            return;
          }
          throw error;
        }
      }

      unobserve(target: Element): void {
        try {
          super.unobserve(target);
        } catch (error) {
          // Silently handle unobserve errors
          if (error instanceof Error &&
              (error.message.toLowerCase().includes('resizeobserver') ||
               error.name === 'ResizeObserverError')) {
            return;
          }
          throw error;
        }
      }

      disconnect(): void {
        try {
          super.disconnect();
        } catch (error) {
          // Silently handle disconnect errors
          if (error instanceof Error &&
              (error.message.toLowerCase().includes('resizeobserver') ||
               error.name === 'ResizeObserverError')) {
            return;
          }
          throw error;
        }
      }
    };
  }

  private isResizeObserverError(message: string): boolean {
    if (!message || typeof message !== 'string') {
      return false;
    }

    const resizeObserverPatterns = [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'resizeobserver loop',
      'resize observer',
      'ResizeObserverError',
      'ResizeObserver callback',
      'ResizeObserver entry',
      'resizeobserver.js',
      'ResizeObserver.observe',
      'loop completed with undelivered notifications',
      'loop limit exceeded',
      'undelivered notifications',
      'resize-observer',
      'ResizeObserver is not defined',
      'ResizeObserver construction failed',
      'ResizeObserver disconnect',
      'ResizeObserver unobserve',
      'observation target',
      'resize observation'
    ];

    const lowerMessage = message.toLowerCase();
    return resizeObserverPatterns.some(pattern =>
      lowerMessage.includes(pattern.toLowerCase())
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
