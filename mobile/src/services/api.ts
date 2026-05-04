import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────
export interface ApiErrorResponse {
  success: false;
  error?: string;
  errors?: string[];
}

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// ─── Base URL ────────────────────────────────────────────────
// Priority: env var > fallback
// Android emulator: 10.0.2.2 | Physical device: your LAN IP
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://resqnet-jos9.onrender.com';

// ─── Axios Instance ──────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor — attach JWT ────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // AsyncStorage read failed — continue without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — normalize errors ─────────────────
let logoutCallback: (() => void) | null = null;

/** Called by AuthContext to wire up auto-logout on 401 */
export function setLogoutCallback(cb: () => void) {
  logoutCallback = cb;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    // Network / timeout error
    if (!error.response) {
      throw new ApiError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    const { status, data } = error.response;

    // Unauthorized — auto-logout
    if (status === 401) {
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
      logoutCallback?.();
      throw new ApiError(
        data?.error || 'Session expired. Please login again.',
        401,
        'UNAUTHORIZED'
      );
    }

    // Validation errors (array)
    if (status === 400 && data?.errors?.length) {
      throw new ApiError(data.errors[0], 400, 'VALIDATION_ERROR');
    }

    // Generic server error
    const message =
      data?.error || `Server error (${status}). Please try again.`;
    throw new ApiError(message, status, 'SERVER_ERROR');
  }
);

export { API_BASE_URL };
export default api;
