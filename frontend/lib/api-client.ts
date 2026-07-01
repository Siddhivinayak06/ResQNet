const DEFAULT_API_URL = 'http://localhost:5001/api/v1';

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

interface ApiFetchOptions extends RequestInit {
  token?: string | null;
}

function resolveToken(explicitToken?: string | null): string | null {
  if (explicitToken !== undefined) {
    return explicitToken;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('auth_access_token') || sessionStorage.getItem('auth_access_token');
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

/**
 * Reusable fetch wrapper that:
 * - Prepends the API base URL (/api/v1)
 * - Sets Content-Type for JSON bodies (skips for FormData)
 * - Attaches Bearer token from localStorage or explicit param
 * - Sends credentials for cookie-based auth
 */
export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { token, headers, ...rest } = options;
  const resolvedToken = resolveToken(token);

  const requestHeaders = new Headers(headers || {});
  const isFormDataBody = typeof FormData !== 'undefined' && rest.body instanceof FormData;

  if (!requestHeaders.has('Content-Type') && rest.body && !isFormDataBody) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (resolvedToken) {
    requestHeaders.set('Authorization', `Bearer ${resolvedToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    credentials: 'include',
  });

  return response;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function clearAllAuth() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_access_token');
  localStorage.removeItem('auth_refresh_token');
  localStorage.removeItem('auth_user');
  sessionStorage.removeItem('auth_access_token');
  sessionStorage.removeItem('auth_refresh_token');
  sessionStorage.removeItem('auth_user');
  window.dispatchEvent(new Event('auth:unauthorized'));
}

/**
 * Convenience wrapper that parses JSON and throws on errors.
 * Includes automatic token rotation on 401.
 */
export async function apiFetchJSON<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await apiFetch(path, options);
  
  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    if (typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('auth_refresh_token') || sessionStorage.getItem('auth_refresh_token');
      
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await apiFetch('/auth/refresh', {
              method: 'POST',
              body: JSON.stringify({ refreshToken }),
            });
            const refreshData = await refreshRes.json();
            
            if (refreshRes.ok && refreshData.data?.accessToken) {
              const newAccessToken = refreshData.data.accessToken;
              const newRefreshToken = refreshData.data.refreshToken || refreshToken;
              
              // Determine storage
              const storage = localStorage.getItem('auth_refresh_token') ? localStorage : sessionStorage;
              storage.setItem('auth_access_token', newAccessToken);
              storage.setItem('auth_refresh_token', newRefreshToken);
              
              // Also update the app via event so AuthContext can sync
              window.dispatchEvent(new CustomEvent('auth:rotated', { 
                detail: { accessToken: newAccessToken, refreshToken: newRefreshToken } 
              }));
              
              isRefreshing = false;
              onRefreshed(newAccessToken);
              
              // Retry the original request
              return apiFetchJSON(path, { ...options, token: newAccessToken });
            } else {
              throw new Error('Refresh failed');
            }
          } catch (e) {
            isRefreshing = false;
            refreshSubscribers = [];
            clearAllAuth();
            throw new Error('Session expired');
          }
        } else {
          // Wait for the refresh to complete
          return new Promise<T>((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              apiFetchJSON<T>(path, { ...options, token: newToken }).then(resolve).catch(reject);
            });
          });
        }
      } else {
        // No refresh token available, logout
        clearAllAuth();
      }
    }
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message = data.error || data.message || data.errors?.[0] || 'API request failed';
    const error = new Error(message) as Error & { status: number; data: any };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
