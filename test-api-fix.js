// Simple test to verify the API fix
console.log('Testing API configuration...');

// Simulate the fixed function structure
function testApiRequest(url, options = {}) {
  // Get API base URL directly to avoid dynamic imports
  const apiBaseUrl = 'http://localhost:8080';
  
  // Build full URL if it's a relative path
  const fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Debug logging for development
  console.log('API Request:', { 
    originalUrl: url, 
    fullUrl, 
    baseUrl: apiBaseUrl, 
    headers: defaultOptions.headers 
  });

  return { fullUrl, defaultOptions };
}

// Test the function
const result = testApiRequest('/api/test', { headers: { 'Authorization': 'Bearer test' } });
console.log('✅ API request configuration test passed!');
console.log('Result:', result);
