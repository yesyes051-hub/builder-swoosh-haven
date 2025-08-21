// Development mode protection against external service interference

export const initializeDevModeProtection = () => {
  if (typeof window === 'undefined') return;

  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') return;

  console.log('🛡️ Development mode protection enabled');

  // Block common analytics and tracking scripts that might interfere
  const blockedServices = [
    'fullstory',
    'google-analytics',
    'googletagmanager',
    'hotjar',
    'mixpanel',
    'segment',
    'amplitude',
    'intercom'
  ];

  // Override script creation to block external services in development
  const originalCreateElement = document.createElement;
  document.createElement = function (tagName: string, ...args: any[]) {
    const element = originalCreateElement.apply(this, [tagName, ...args]);
    
    if (tagName.toLowerCase() === 'script') {
      const script = element as HTMLScriptElement;
      
      // Monitor script src changes
      const originalSetAttribute = script.setAttribute;
      script.setAttribute = function (name: string, value: string) {
        if (name === 'src' && typeof value === 'string') {
          const lowerSrc = value.toLowerCase();
          const isBlocked = blockedServices.some(service => lowerSrc.includes(service));
          
          if (isBlocked) {
            console.warn(`🚫 Blocked external service in development: ${value}`);
            return; // Don't set the src attribute
          }
        }
        return originalSetAttribute.call(this, name, value);
      };

      // Monitor direct src assignment
      Object.defineProperty(script, 'src', {
        set: function (value: string) {
          if (typeof value === 'string') {
            const lowerSrc = value.toLowerCase();
            const isBlocked = blockedServices.some(service => lowerSrc.includes(service));
            
            if (isBlocked) {
              console.warn(`🚫 Blocked external service in development: ${value}`);
              return; // Don't set the src
            }
          }
          // Call the original setter
          Object.defineProperty(this, 'src', {
            value: value,
            writable: true,
            enumerable: true,
            configurable: true
          });
        },
        get: function () {
          return this.getAttribute('src');
        },
        enumerable: true,
        configurable: true
      });
    }
    
    return element;
  };

  // Prevent external services from overriding fetch
  let fetchOverrideAttempts = 0;
  const originalFetch = window.fetch;
  
  Object.defineProperty(window, 'fetch', {
    set: function (newFetch) {
      fetchOverrideAttempts++;
      console.warn(`⚠️ External service attempted to override fetch (attempt ${fetchOverrideAttempts}). Keeping original fetch for development stability.`);
      // Don't allow fetch to be overridden in development
    },
    get: function () {
      return originalFetch;
    },
    enumerable: true,
    configurable: false // Prevent reconfiguration
  });

  // Block common tracking pixels and beacons
  const originalSendBeacon = navigator.sendBeacon;
  if (originalSendBeacon) {
    navigator.sendBeacon = function (url: string | URL, data?: BodyInit | null): boolean {
      const urlString = url.toString().toLowerCase();
      const isTracking = blockedServices.some(service => urlString.includes(service));
      
      if (isTracking) {
        console.warn(`🚫 Blocked tracking beacon in development: ${url}`);
        return true; // Pretend it succeeded
      }
      
      return originalSendBeacon.call(this, url, data);
    };
  }

  // Provide a way to temporarily disable protection
  (window as any).__disableDevProtection = () => {
    console.log('🔓 Development mode protection disabled');
    document.createElement = originalCreateElement;
    Object.defineProperty(window, 'fetch', {
      value: originalFetch,
      writable: true,
      enumerable: true,
      configurable: true
    });
    if (originalSendBeacon) {
      navigator.sendBeacon = originalSendBeacon;
    }
  };

  console.log('🛡️ Development mode protection initialized. Use __disableDevProtection() to disable if needed.');
};
