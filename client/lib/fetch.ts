// Robust fetch wrapper to handle external service interference
class RobustFetch {
  private static instance: RobustFetch;
  private originalFetch: typeof fetch;

  constructor() {
    this.originalFetch = window.fetch.bind(window);
  }

  static getInstance(): RobustFetch {
    if (!RobustFetch.instance) {
      RobustFetch.instance = new RobustFetch();
    }
    return RobustFetch.instance;
  }

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use the original fetch to bypass any external interceptors
        const response = await this.originalFetch(input, init);
        
        // If we get a response, return it
        if (response) {
          return response;
        }
        
        throw new Error('No response received');
      } catch (error) {
        console.warn(`Fetch attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          // Check if the error is due to external service interference
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('FullStory') || errorMessage.includes('analytics')) {
            console.error('Fetch failed due to external service interference. Consider disabling analytics or adding fetch bypass.');
          }
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw new Error('All fetch attempts failed');
  }
}

// Create a safer fetch function that handles external interference
export const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const robustFetch = RobustFetch.getInstance();
  return robustFetch.fetch(input, init);
};

// Enhanced fetch with better error handling and retries
export const apiRequest = async <T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  // Get API base URL directly to avoid dynamic imports
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
                     (import.meta.env.MODE === 'production'
                       ? 'https://your-render-app.onrender.com'
                       : 'http://localhost:8080');

  // Build full URL if it's a relative path
  const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;

  // Debug logging for development
  if (import.meta.env.MODE === 'development') {
    console.log('API Request:', { url, fullUrl, baseUrl: apiBaseUrl });
  }

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await safeFetch(fullUrl, defaultOptions);

    // Handle different response types
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use the status text
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      
      throw new Error(errorMessage);
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // For non-JSON responses, return the response text
    const text = await response.text();
    return text as unknown as T;
  } catch (error) {
    console.error('API request failed:', error);
    console.error('Request details:', { url: fullUrl, options: defaultOptions });

    // Enhance error message for better debugging
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        // Check if it's a local development issue
        if (fullUrl.includes('localhost')) {
          throw new Error('Network error: Unable to connect to local server. Please ensure the dev server is running on port 8080.');
        }
        throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      }
      if (error.message.includes('NetworkError')) {
        throw new Error('Network error: Request blocked or server unavailable.');
      }
      throw error;
    }

    throw new Error('An unexpected error occurred during the API request.');
  }
};

// Utility to check if fetch is being intercepted by external services
export const checkFetchIntegrity = (): boolean => {
  const originalFetch = window.fetch;
  const nativeFetchString = originalFetch.toString();
  
  // Check if fetch has been modified (native code should contain [native code])
  const isNative = nativeFetchString.includes('[native code]');
  
  if (!isNative) {
    console.warn('Fetch has been modified by external services. This may cause API request issues.');
    return false;
  }
  
  return true;
};

// Initialize fetch integrity check
if (typeof window !== 'undefined') {
  // Run the check after a short delay to allow external services to load
  setTimeout(() => {
    checkFetchIntegrity();
  }, 2000);
}
