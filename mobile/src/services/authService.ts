import api from './api';
import * as SecureStore from 'expo-secure-store';

// ─── Types ───────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'volunteer' | 'admin';
  phoneNumber?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ─── Service ─────────────────────────────────────────────────
export const authService = {
  /**
   * Register a new user.
   * Returns the created user and JWT token.
   */
  async registerUser(payload: RegisterPayload): Promise<{ user: User; token: string }> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return { user: data.data.user, token: data.data.accessToken };
  },

  /**
   * Login an existing user.
   * Returns the user and JWT token.
   */
  async loginUser(payload: LoginPayload): Promise<{ user: User; token: string }> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return { user: data.data.user, token: data.data.accessToken };
  },

  /**
   * Fetch the current user's profile using the stored JWT.
   */
  async getProfile(): Promise<User> {
    const { data } = await api.get<ProfileResponse>('/auth/profile');
    return data.data;
  },

  /**
   * Clear stored credentials.
   */
  async logoutUser(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
  },

  /**
   * Persist token + user to SecureStore after login/register.
   */
  async persistCredentials(token: string, user: User): Promise<void> {
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
  },

  /**
   * Restore token + user from SecureStore (app cold start).
   */
  async restoreCredentials(): Promise<{ token: string; user: User } | null> {
    const token = await SecureStore.getItemAsync('auth_token');
    const userJson = await SecureStore.getItemAsync('auth_user');
    
    if (token && userJson) {
      return {
        token: token,
        user: JSON.parse(userJson),
      };
    }
    return null;
  },
};
