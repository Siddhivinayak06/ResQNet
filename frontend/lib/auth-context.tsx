'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from './auth-types';
import { apiFetch } from './api-client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  canAccess: (requiredRole: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeTokenPayload(token: string): { exp?: number } | null {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }

    const normalizedPayload = tokenParts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');

    const decodedPayload = atob(paddedPayload);
    return JSON.parse(decodedPayload);
  } catch (error) {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const payload = decodeTokenPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setAuthState = (accessToken: string, refreshToken: string, authUser: User, rememberMe: boolean = true) => {
    setToken(accessToken);
    setUser(authUser);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('auth_access_token', accessToken);
    storage.setItem('auth_refresh_token', refreshToken);
    storage.setItem('auth_user', JSON.stringify(authUser));
  };

  const clearAuthState = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');
      sessionStorage.removeItem('auth_access_token');
      sessionStorage.removeItem('auth_refresh_token');
      sessionStorage.removeItem('auth_user');
    }
  };

  // Initialize auth from storage
  useEffect(() => {
    const storage = localStorage.getItem('auth_refresh_token') ? localStorage : sessionStorage;
    const storedAccessToken = storage.getItem('auth_access_token');
    const storedRefreshToken = storage.getItem('auth_refresh_token');
    const storedUser = storage.getItem('auth_user');

    if (storedAccessToken && storedUser) {
      try {
        if (!isTokenExpired(storedAccessToken)) {
          setToken(storedAccessToken);
          setUser(JSON.parse(storedUser));
        } else if (storedRefreshToken) {
          // Token expired but we have a refresh token. Let the api client handle rotation.
          setToken(storedAccessToken);
          setUser(JSON.parse(storedUser));
        } else {
          clearAuthState();
        }
      } catch (error) {
        clearAuthState();
      }
    }

    setIsLoading(false);

    const handleRotated = (e: any) => {
      setToken(e.detail.accessToken);
    };
    const handleUnauthorized = () => {
      clearAuthState();
    };

    window.addEventListener('auth:rotated', handleRotated);
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('auth:rotated', handleRotated);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    setIsLoading(true);

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.errors?.[0] || 'Login failed');
      }

      setAuthState(data.data.accessToken, data.data.refreshToken, data.data.user, rememberMe);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }, rememberMe: boolean = true) => {
    setIsLoading(true);

    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.errors?.[0] || 'Registration failed');
      }

      setAuthState(data.data.accessToken, data.data.refreshToken, data.data.user, rememberMe);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const storage = localStorage.getItem('auth_refresh_token') ? localStorage : sessionStorage;
      const currentToken = storage.getItem('auth_access_token');
      
      await apiFetch('/auth/logout', {
        method: 'POST',
        token: currentToken,
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthState();
    }
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  const canAccess = (requiredRole: UserRole | UserRole[]): boolean => {
    return hasRole(requiredRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a safe default to prevent crashes
    return {
      user: null,
      token: null,
      isLoading: true,
      login: async () => { throw new Error('useAuth must be used within AuthProvider'); },
      register: async () => { throw new Error('useAuth must be used within AuthProvider'); },
      logout: async () => {},
      hasRole: () => false,
      canAccess: () => false,
    };
  }
  return context;
}
