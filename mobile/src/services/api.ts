import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

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
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:5001/api/v1';

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
      const token = await SecureStore.getItemAsync('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore read failed — continue without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — normalize errors ─────────────────
let logoutCallback: (() => void) | null = null;

export function setLogoutCallback(cb: () => void) {
  logoutCallback = cb;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
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
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_user');
      logoutCallback?.();
      throw new ApiError(
        data?.error || 'Session expired. Please login again.',
        401,
        'UNAUTHORIZED'
      );
    }

    if (status === 400 && data?.errors?.length) {
      throw new ApiError(data.errors[0], 400, 'VALIDATION_ERROR');
    }

    const message =
      data?.error || `Server error (${status}). Please try again.`;
    throw new ApiError(message, status, 'SERVER_ERROR');
  }
);

export { API_BASE_URL };
export default api;
