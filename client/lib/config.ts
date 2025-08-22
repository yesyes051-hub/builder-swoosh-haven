// Environment configuration for API endpoints
export const config = {
  // API base URL - defaults to local development, can be overridden by environment variable
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 
              (import.meta.env.MODE === 'production' 
                ? 'https://your-render-app.onrender.com' 
                : 'http://localhost:8080'),
  
  // Other configuration options
  environment: import.meta.env.MODE,
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
};

// Helper function to build full API URLs
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${config.apiBaseUrl}/${cleanEndpoint}`;
};

// Log configuration in development
if (config.isDevelopment) {
  console.log('API Configuration:', {
    baseUrl: config.apiBaseUrl,
    environment: config.environment,
  });
}
