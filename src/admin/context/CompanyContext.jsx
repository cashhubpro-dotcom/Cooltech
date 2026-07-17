import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../services/api';

const CompanyContext = createContext(null);

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

// Resolve relative logo paths to full URLs
export function resolveLogoUrl(logoUrl) {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  return `${BACKEND}${logoUrl}`;
}

export function CompanyProvider({ children }) {
  const [companyName, setCompanyName] = useState('CoolTech');
  const [companySubtitle, setCompanySubtitle] = useState('AC SERVICES PLATFORM');
  const [logoUrl, setLogoUrlRaw] = useState(null);
  const [brandColor, setBrandColor] = useState('#EA580C');
  const [loading, setLoading] = useState(true);

  const setLogoUrl = useCallback((url) => {
    setLogoUrlRaw(resolveLogoUrl(url));
  }, []);

  // Load from backend on mount — but only if we're actually logged in.
  // Without this guard, CompanyProvider (which wraps the whole app,
  // including the /login screen) fires this fetch before any token
  // exists, gets a 401, and — combined with the old aggressive 401
  // handler in api.js — caused an infinite reload loop on the login page.
  const loadSettings = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await settingsApi.getTab('company');
      const data = res?.data ?? res;           // ← unwrap { success, data: {...} }
      if (data) {
        if (data.name) setCompanyName(data.name);
        if (data.logoUrl && data.logoUrl.trim() !== '') {
          setLogoUrlRaw(resolveLogoUrl(data.logoUrl));
        }
      }

      const appRes = await settingsApi.getTab('appearance');
      const appearance = appRes?.data ?? appRes;   // ← same unwrap
      if (appearance?.brandColor) setBrandColor(appearance.brandColor);

    } catch {
      // silently fall back to defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Re-run once login succeeds and a token appears (e.g. call
  // `reload()` from your login success handler after storing the token).
  return (
    <CompanyContext.Provider value={{
      companyName,    setCompanyName,
      companySubtitle,setCompanySubtitle,
      logoUrl,        setLogoUrl,
      brandColor,     setBrandColor,
      loading,
      reload: loadSettings,
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used inside <CompanyProvider>');
  return ctx;
}