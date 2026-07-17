import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(
    // Check both storages — localStorage for "remember me", sessionStorage otherwise
    () => localStorage.getItem('ct_token') || sessionStorage.getItem('ct_token')
  );
  const [loading, setLoading] = useState(true);

  // ── Restore session from stored token on mount ────────────────────────────
  useEffect(() => {
    if (!token) { setLoading(false); return; }

    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else clearAuth();
      })
      .catch(clearAuth)
      .finally(() => setLoading(false));
  }, []);

  // ── Save token to the right storage based on rememberMe ──────────────────
  const saveAuth = (tkn, usr, rememberMe = false) => {
    if (rememberMe) {
      // Persists across browser restarts
      localStorage.setItem('ct_token', tkn);
      sessionStorage.removeItem('ct_token');
    } else {
      // Cleared when tab/browser is closed
      sessionStorage.setItem('ct_token', tkn);
      localStorage.removeItem('ct_token');
    }
    setToken(tkn);
    setUser(usr);
  };

  const clearAuth = useCallback(() => {
    localStorage.removeItem('ct_token');
    sessionStorage.removeItem('ct_token');
    setToken(null);
    setUser(null);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password, rememberMe = false) => {
    const res  = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    saveAuth(data.token, data.user, rememberMe);
    return data.user;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    if (token) {
      fetch(`${API}/auth/logout`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearAuth();
  };

  // ── Authenticated fetch helper ────────────────────────────────────────────
  const authFetch = useCallback(
    (url, options = {}) =>
      fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      }),
    [token]
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};