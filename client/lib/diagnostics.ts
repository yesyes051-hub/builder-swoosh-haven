// Network and API diagnostics utility

export interface DiagnosticResult {
  test: string;
  success: boolean;
  message: string;
  duration?: number;
  details?: any;
}

export class NetworkDiagnostics {
  static async runAll(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // Test 1: Basic connectivity
    results.push(await this.testBasicConnectivity());

    // Test 2: API base URL configuration
    results.push(await this.testConfiguration());

    // Test 3: CORS preflight
    results.push(await this.testCORS());

    // Test 4: Auth endpoint
    results.push(await this.testAuthEndpoint());

    // Test 5: Network conditions
    results.push(await this.testNetworkConditions());

    return results;
  }

  private static async testBasicConnectivity(): Promise<DiagnosticResult> {
    const startTime = performance.now();
    try {
      // Test relative URL first (preferred for development)
      const response = await fetch('/api/ping', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const duration = performance.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          test: 'Basic Connectivity',
          success: true,
          message: `Connected successfully (${Math.round(duration)}ms)`,
          duration,
          details: data
        };
      } else {
        return {
          test: 'Basic Connectivity',
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
          duration
        };
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        test: 'Basic Connectivity',
        success: false,
        message: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  private static async testConfiguration(): Promise<DiagnosticResult> {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
                         (import.meta.env.MODE === 'production'
                           ? 'https://your-render-app.onrender.com'
                           : '');

      const details = {
        apiBaseUrl: apiBaseUrl || 'relative URLs (development)',
        mode: import.meta.env.MODE,
        isDevelopment: import.meta.env.MODE === 'development',
        isProduction: import.meta.env.MODE === 'production',
        envVar: import.meta.env.VITE_API_BASE_URL,
        usingRelativeUrls: !apiBaseUrl
      };

      const isValidConfig = import.meta.env.MODE === 'development' ? true :
                           (apiBaseUrl && (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')));

      return {
        test: 'Configuration',
        success: isValidConfig,
        message: isValidConfig ? 'Configuration looks good' : 'Invalid API configuration for production',
        details
      };
    } catch (error) {
      return {
        test: 'Configuration',
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private static async testCORS(): Promise<DiagnosticResult> {
    const startTime = performance.now();
    try {
      // Test OPTIONS request (CORS preflight) using relative URL
      const response = await fetch('/api/ping', {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      const duration = performance.now() - startTime;

      return {
        test: 'CORS Preflight',
        success: response.ok,
        message: response.ok ? 'CORS configured correctly' : `CORS issue: ${response.status}`,
        duration,
        details: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        test: 'CORS Preflight',
        success: false,
        message: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  private static async testAuthEndpoint(): Promise<DiagnosticResult> {
    const startTime = performance.now();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test', password: 'test' })
      });
      const duration = performance.now() - startTime;

      // We expect a 401 or similar for invalid credentials, not a connection error
      const isReachable = response.status === 401 || response.status === 400 || response.ok;

      return {
        test: 'Auth Endpoint',
        success: isReachable,
        message: isReachable ? 'Auth endpoint reachable' : `Unexpected status: ${response.status}`,
        duration,
        details: { status: response.status, statusText: response.statusText }
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        test: 'Auth Endpoint',
        success: false,
        message: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  private static async testNetworkConditions(): Promise<DiagnosticResult> {
    try {
      const connection = (navigator as any).connection;
      const onlineStatus = navigator.onLine;

      const details = {
        online: onlineStatus,
        connectionType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 'unknown',
        rtt: connection?.rtt || 'unknown',
        userAgent: navigator.userAgent.slice(0, 100) + '...'
      };

      return {
        test: 'Network Conditions',
        success: onlineStatus,
        message: onlineStatus ? 'Network appears online' : 'Network appears offline',
        details
      };
    } catch (error) {
      return {
        test: 'Network Conditions',
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }
}
