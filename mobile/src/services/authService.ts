import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    token: string;
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
  async registerUser(payload: RegisterPayload): Promise<AuthResponse['data']> {
    const { data } = await api.post<AuthResponse>('/api/auth/register', payload);
    return data.data;
  },

  /**
   * Login an existing user.
   * Returns the user and JWT token.
   */
  async loginUser(payload: LoginPayload): Promise<AuthResponse['data']> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', payload);
    return data.data;
  },

  /**
   * Fetch the current user's profile using the stored JWT.
   */
  async getProfile(): Promise<User> {
    const { data } = await api.get<ProfileResponse>('/api/auth/profile');
    return data.data;
  },

  /**
   * Clear stored credentials.
   */
  async logoutUser(): Promise<void> {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
  },

  /**
   * Persist token + user to AsyncStorage after login/register.
   */
  async persistCredentials(token: string, user: User): Promise<void> {
    await AsyncStorage.multiSet([
      ['auth_token', token],
      ['auth_user', JSON.stringify(user)],
    ]);
  },

  /**
   * Restore token + user from AsyncStorage (app cold start).
   */
  async restoreCredentials(): Promise<{ token: string; user: User } | null> {
    const [tokenEntry, userEntry] = await AsyncStorage.multiGet([
      'auth_token',
      'auth_user',
    ]);
    if (tokenEntry[1] && userEntry[1]) {
      return {
        token: tokenEntry[1],
        user: JSON.parse(userEntry[1]),
      };
    }
    return null;
  },
};
