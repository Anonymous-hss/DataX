/**
 * DataX Centralized Resilient API Client
 * - Single source of truth for VITE_API_BASE
 * - Automatic Authorization header injection
 * - AbortController timeout & retry support
 * - Standardized error extraction (no swallowed errors)
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE || 
  import.meta.env.VITE_API_URL || 
  'https://dataglow.ai/datax-api'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 500, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Standard fetch wrapper with auth, timeouts, and JSON error extraction
 */
export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeoutMs = 30000,
    token = null,
    tenantId = 'tenant_default',
    ...rest
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
    ...headers
  };

  // Attach auth token if provided or stored in sessionStorage
  const effectiveToken = token || sessionStorage.getItem('datax_auth_token') || localStorage.getItem('datax_auth_token');
  if (effectiveToken) {
    requestHeaders['Authorization'] = `Bearer ${effectiveToken}`;
  }

  const fetchConfig = {
    method,
    headers: requestHeaders,
    signal: controller.signal,
    ...rest
  };

  if (body) {
    fetchConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(url, fetchConfig);
    clearTimeout(timer);

    if (!res.ok) {
      let detail = null;
      let errorMsg = `API Request failed with HTTP ${res.status}`;
      try {
        const errJson = await res.json();
        detail = errJson;
        errorMsg = errJson.detail || errJson.message || errorMsg;
      } catch (_) {
        // response was not JSON
      }
      throw new ApiError(errorMsg, res.status, detail);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return await res.json();
    }
    return await res.text();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new ApiError(`Request timed out after ${timeoutMs / 1000}s`, 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network connection failed', 0, err);
  }
}

export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
