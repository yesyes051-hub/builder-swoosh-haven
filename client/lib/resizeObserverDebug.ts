/**
 * Debug utility to monitor ResizeObserver activity
 * Use this to identify which components are triggering ResizeObserver issues
 */

interface ResizeObserverDebugOptions {
  enabled: boolean;
  logFrequency: number; // Log every N observations
  maxLogs: number; // Maximum number of logs to prevent spam
}

class ResizeObserverDebugger {
  private static instance: ResizeObserverDebugger;
  private options: ResizeObserverDebugOptions = {
    enabled: false, // Disabled by default
    logFrequency: 10,
    maxLogs: 20
  };
  private logCount = 0;
  private observationCount = 0;

  public static getInstance(): ResizeObserverDebugger {
    if (!ResizeObserverDebugger.instance) {
      ResizeObserverDebugger.instance = new ResizeObserverDebugger();
    }
    return ResizeObserverDebugger.instance;
  }

  public enable(options?: Partial<ResizeObserverDebugOptions>): void {
    this.options = { ...this.options, enabled: true, ...options };
    this.patchResizeObserver();
  }

  public disable(): void {
    this.options.enabled = false;
  }

  private patchResizeObserver(): void {
    if (typeof window === 'undefined' || !window.ResizeObserver) {
      return;
    }

    const OriginalResizeObserver = window.ResizeObserver;
    const debugInstance = this;

    window.ResizeObserver = class extends OriginalResizeObserver {
      private elementInfo: string;

      constructor(callback: ResizeObserverCallback) {
        super((entries, observer) => {
          if (debugInstance.options.enabled) {
            debugInstance.observationCount++;
            
            if (debugInstance.observationCount % debugInstance.options.logFrequency === 0 && 
                debugInstance.logCount < debugInstance.options.maxLogs) {
              
              console.group(`📏 ResizeObserver Activity #${debugInstance.observationCount}`);
              console.log('Entries:', entries.length);
              
              entries.forEach((entry, index) => {
                const element = entry.target;
                const rect = entry.contentRect;
                
                console.log(`Entry ${index + 1}:`, {
                  element: element.tagName,
                  className: element.className,
                  id: element.id,
                  size: { width: rect.width, height: rect.height },
                  position: { x: rect.x, y: rect.y }
                });
              });
              
              console.groupEnd();
              debugInstance.logCount++;
            }
          }

          try {
            callback(entries, observer);
          } catch (error) {
            if (debugInstance.options.enabled && error instanceof Error) {
              console.warn('🔴 ResizeObserver callback error:', error.message);
            }
            // Don't re-throw ResizeObserver errors
            if (!(error instanceof Error) || !error.message.includes('ResizeObserver')) {
              throw error;
            }
          }
        });

        this.elementInfo = '';
      }

      observe(target: Element, options?: ResizeObserverOptions): void {
        if (debugInstance.options.enabled) {
          const elementInfo = `${target.tagName}${target.id ? '#' + target.id : ''}${target.className ? '.' + target.className.split(' ').join('.') : ''}`;
          this.elementInfo = elementInfo;
          
          if (debugInstance.logCount < debugInstance.options.maxLogs) {
            console.log(`👀 ResizeObserver observing: ${elementInfo}`);
          }
        }
        
        super.observe(target, options);
      }

      unobserve(target: Element): void {
        if (debugInstance.options.enabled && debugInstance.logCount < debugInstance.options.maxLogs) {
          const elementInfo = `${target.tagName}${target.id ? '#' + target.id : ''}${target.className ? '.' + target.className.split(' ').join('.') : ''}`;
          console.log(`👁️‍🗨️ ResizeObserver unobserving: ${elementInfo}`);
        }
        
        super.unobserve(target);
      }
    };
  }

  public getStats(): { observations: number, logs: number } {
    return {
      observations: this.observationCount,
      logs: this.logCount
    };
  }

  public reset(): void {
    this.logCount = 0;
    this.observationCount = 0;
  }
}

// Export functions for easy use
export const enableResizeObserverDebug = (options?: Partial<ResizeObserverDebugOptions>): void => {
  ResizeObserverDebugger.getInstance().enable(options);
};

export const disableResizeObserverDebug = (): void => {
  ResizeObserverDebugger.getInstance().disable();
};

export const getResizeObserverStats = () => {
  return ResizeObserverDebugger.getInstance().getStats();
};

export const resetResizeObserverStats = (): void => {
  ResizeObserverDebugger.getInstance().reset();
};
