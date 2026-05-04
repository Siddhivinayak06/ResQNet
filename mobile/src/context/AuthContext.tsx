import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, User, RegisterPayload } from '../services/authService';
import { setLogoutCallback } from '../services/api';

// ─── Context Shape ───────────────────────────────────────────
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Re-export User type for convenience
export type { User };

// ─── Provider ────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // ── Logout (stable ref — used by API interceptor) ──
  const logout = useCallback(async () => {
    await authService.logoutUser();
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  // ── Wire up 401 auto-logout ──
  useEffect(() => {
    setLogoutCallback(logout);
    return () => setLogoutCallback(() => {});
  }, [logout]);

  // ── Restore session from AsyncStorage on cold start ──
  useEffect(() => {
    (async () => {
      try {
        const credentials = await authService.restoreCredentials();
        if (credentials) {
          // Validate the token is still accepted by the backend
          try {
            const freshUser = await authService.getProfile();
            await authService.persistCredentials(credentials.token, freshUser);
            setState({
              token: credentials.token,
              user: freshUser,
              isLoading: false,
              isAuthenticated: true,
            });
          } catch {
            // Token expired or invalid — clear and show login
            await authService.logoutUser();
            setState((s) => ({ ...s, isLoading: false }));
          }
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  // ── Login ──
  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await authService.loginUser({ email, password });
    await authService.persistCredentials(token, user);
    setState({ token, user, isLoading: false, isAuthenticated: true });
  }, []);

  // ── Register (auto-login after success) ──
  const register = useCallback(async (payload: RegisterPayload) => {
    const { token, user } = await authService.registerUser(payload);
    await authService.persistCredentials(token, user);
    setState({ token, user, isLoading: false, isAuthenticated: true });
  }, []);

  // ── Refresh profile data ──
  const refreshProfile = useCallback(async () => {
    try {
      const user = await authService.getProfile();
      await authService.persistCredentials(state.token!, user);
      setState((s) => ({ ...s, user }));
    } catch {
      // Silent fail
    }
  }, [state.token]);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
