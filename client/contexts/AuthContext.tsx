import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse, LoginRequest, ApiResponse } from '@shared/api';

// Store native fetch to avoid interference from browser extensions or third-party scripts
const nativeFetch = window.fetch.bind(window);

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('trackzen_token');
    if (storedToken) {
      setToken(storedToken);
      fetchProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (authToken: string) => {
    try {
      // Add retry logic for network issues
      let response;
      let lastError;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Create abort controller for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          response = await nativeFetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          break; // Success, exit retry loop
        } catch (fetchError) {
          lastError = fetchError;
          if (attempt < 3) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            console.log(`Fetch attempt ${attempt} failed, retrying...`);
          }
        }
      }

      if (!response) {
        throw lastError || new Error('Failed to fetch after multiple attempts');
      }

      if (response.ok) {
        const data: ApiResponse<User> = await response.json();
        if (data.success && data.data) {
          setUser(data.data);
        } else {
          // Invalid response format, clear token
          console.warn('Invalid response format from profile endpoint');
          localStorage.removeItem('trackzen_token');
          setToken(null);
        }
      } else if (response.status === 401) {
        // Invalid token, clear it
        console.log('Token expired or invalid, clearing auth');
        localStorage.removeItem('trackzen_token');
        setToken(null);
      } else {
        // Other HTTP error
        console.error(`Profile fetch failed with status: ${response.status}`);
        localStorage.removeItem('trackzen_token');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);

      // Don't clear token on network errors - user might be offline temporarily
      if (error instanceof Error && (
        error.name === 'AbortError' ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      )) {
        console.log('Network error detected, keeping token for retry later');
        // Keep the token but don't set user - this allows retry on next app load
      } else {
        // Clear token for other errors
        localStorage.removeItem('trackzen_token');
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    setLoading(true);
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await nativeFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse error response, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data: ApiResponse<AuthResponse> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.data) {
        const { token: authToken, user: userData } = data.data;
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('trackzen_token', authToken);
      } else {
        throw new Error('Invalid login response format');
      }
    } catch (error) {
      console.error('Login error:', error);

      // Clear any existing auth state on login failure
      setToken(null);
      setUser(null);
      localStorage.removeItem('trackzen_token');

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('trackzen_token');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
