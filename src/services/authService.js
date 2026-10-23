const TOKEN_KEY = 'datax_jwt_token';
const USER_KEY = 'datax_user_profile';

export function getApiBase() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('dataglow.ai') || window.location.pathname.startsWith('/datax')) {
      return '/datax-api';
    }
  }
  return '';
}

export const authStorage = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.warn('Storage set error:', e);
    }
  },
  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Storage set user error:', e);
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
  }
};

export async function loginApi({ email, password }) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Failed to authenticate');
  }
  return data;
}

export async function registerApi({ email, password, fullName, tenantId }) {
  const base = getApiBase();
  const res = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName, tenantId })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Failed to create account');
  }
  return data;
}

export async function getMeApi(token) {
  const authToken = token || authStorage.getToken();
  if (!authToken) throw new Error('No authentication token available');

  const base = getApiBase();
  const res = await fetch(`${base}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Invalid session');
  }
  return data.user;
}
