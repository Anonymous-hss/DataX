import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authStorage, loginApi, registerApi, getMeApi } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => authStorage.getToken());
  const [rawUser, setRawUser] = useState(() => authStorage.getUser());
  const [isLoaded, setIsLoaded] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Synchronize and verify token with backend on mount
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const storedToken = authStorage.getToken();
      if (!storedToken) {
        if (isMounted) setIsLoaded(true);
        return;
      }
      try {
        const freshUser = await getMeApi(storedToken);
        if (isMounted) {
          setRawUser(freshUser);
          authStorage.setUser(freshUser);
        }
      } catch (err) {
        console.warn('[DataX Auth] Session validation failed:', err.message);
        if (isMounted) {
          authStorage.clear();
          setToken(null);
          setRawUser(null);
        }
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    verifySession();
    return () => { isMounted = false; };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const { token: newToken, user: newUser } = await loginApi({ email, password });
      authStorage.setToken(newToken);
      authStorage.setUser(newUser);
      setToken(newToken);
      setRawUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      const msg = err.message || 'Login failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async ({ email, password, fullName, tenantId }) => {
    setAuthError(null);
    try {
      const { token: newToken, user: newUser } = await registerApi({ email, password, fullName, tenantId });
      authStorage.setToken(newToken);
      authStorage.setUser(newUser);
      setToken(newToken);
      setRawUser(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback((options = {}) => {
    authStorage.clear();
    setToken(null);
    setRawUser(null);
    setAuthError(null);
    if (options.redirectUrl) {
      window.location.hash = options.redirectUrl.includes('#') 
        ? options.redirectUrl.split('#')[1] 
        : '#login';
    }
  }, []);

  // Format user object with backwards-compatible getters (for Clerk compatibility)
  const user = useMemo(() => {
    if (!rawUser) return null;
    const nameParts = (rawUser.fullName || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    return {
      id: rawUser.id,
      fullName: rawUser.fullName,
      firstName,
      lastName,
      primaryEmailAddress: {
        emailAddress: rawUser.email
      },
      email: rawUser.email,
      imageUrl: rawUser.avatarUrl || null,
      role: rawUser.role || 'data_engineer',
      tenantId: rawUser.tenantId || 'tenant_enterprise',
      createdAt: rawUser.createdAt
    };
  }, [rawUser]);

  const value = useMemo(() => ({
    user,
    token,
    isLoaded,
    isSignedIn: Boolean(token && user),
    authError,
    setAuthError,
    login,
    register,
    logout,
    signOut: logout
  }), [user, token, isLoaded, authError, login, register, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// For drop-in convenience where useUser was previously imported
export function useUser() {
  const { user, isLoaded, isSignedIn } = useAuth();
  return { user, isLoaded, isSignedIn };
}
