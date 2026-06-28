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

  return localStorage.getItem('auth_token');
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

/**
 * Convenience wrapper that parses JSON and throws on errors.
 * Includes basic 401 handling.
 */
export async function apiFetchJSON<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const response = await apiFetch(path, options);
  
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      // Automatic logout on token expiry
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:unauthorized'));
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
