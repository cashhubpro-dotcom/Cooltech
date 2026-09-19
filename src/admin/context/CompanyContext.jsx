import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { settingsApi } from '../services/api';

const CompanyContext = createContext(null);

const BACKEND = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Resolve relative logo paths to full URLs
export function resolveLogoUrl(logoUrl) {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  return `${BACKEND}${logoUrl}`;
}

// ─── Brand color → CSS variables ───────────────────────────────────────────
// shared/base.css defines --brand / --brand-light / --brand-dark (+
// --shadow-brand) twice: once in the default `:root` block, once again in
// `[data-theme="dark"]` with different tints. Whatever Brand Color the user
// picks needs to win over BOTH — so instead of editing a stylesheet, we push
// it as an inline style on <html>. Inline styles always beat selector-based
// rules in the cascade, so this overrides either block regardless of which
// one is active, and we recompute whenever the color OR the resolved theme
// changes, since light and dark want different tints of the same hue (the
// defaults show this: dark mode's --brand is a *lightened* version of the
// hex, not the raw color — a raw saturated orange has poor contrast on a
// near-black background).
const hexToRgb = hex => {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const clamp255 = n => Math.max(0, Math.min(255, Math.round(n)));
const rgbToHex = ({ r, g, b }) =>
  '#' + [r, g, b].map(v => clamp255(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const mixToward = (hex, target, t) => {
  const a = hexToRgb(hex);
  return rgbToHex({
    r: a.r + (target.r - a.r) * t,
    g: a.g + (target.g - a.g) * t,
    b: a.b + (target.b - a.b) * t,
  });
};
const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };
const withAlpha = (hex, alphaHex) => `${hex}${alphaHex}`;

// NOTE: base.css also has a long tail of `--xea580cXX` tokens (translucent
// orange at various fixed opacities, used for subtle chip/badge tints) plus
// a hand-tuned *solid* replacement for each in [data-theme="dark"]. Those
// aren't touched here — recomputing all of them from an arbitrary chosen
// color risks fighting the dark-theme-specific solid colors that were
// deliberately picked (a translucent overlay on near-black often looks
// worse than a designed solid). This covers the primary, highly-visible
// brand surfaces (buttons, active nav state, links, table "brand" cells,
// focus rings) — the small decorative tints keep their default orange base.
function applyBrandColor(hex, isDark) {
  if (!hex) return;
  const style = document.documentElement.style;
  const brand      = isDark ? mixToward(hex, WHITE, 0.35) : hex;
  const brandLight = isDark ? mixToward(hex, BLACK, 0.88) : mixToward(hex, WHITE, 0.96);
  const brandDark  = isDark ? hex                          : mixToward(hex, BLACK, 0.17);

  style.setProperty('--brand', brand);
  style.setProperty('--brand-light', brandLight);
  style.setProperty('--brand-dark', brandDark);
  style.setProperty('--shadow-brand', `0 3px 10px ${withAlpha(brand, '66')}`);
  style.setProperty('--brand-overlay-strong', withAlpha(brand, '30'));
  style.setProperty('--brand-overlay-soft', withAlpha(brand, '22'));
}

// ─── Theme (Light / Dark / System) ──────────────────────────────────────────
const THEME_KEY = 'cooltech_theme';

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const resolveTheme = theme => (theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme);

export function CompanyProvider({ children }) {
  const [companyName, setCompanyName] = useState('CoolTech');
  const [companySubtitle, setCompanySubtitle] = useState('AC SERVICES PLATFORM');
  const [logoUrl, setLogoUrlRaw] = useState(null);
  const [brandColor, setBrandColor] = useState('#EA580C');

  // Seed from localStorage synchronously so the very first render already
  // has the right theme (no wait on the network round-trip below).
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'light';
    } catch {
      return 'light';
    }
  });

  const [loading, setLoading] = useState(true);

  const resolvedTheme = useMemo(() => resolveTheme(theme), [theme]);

  const setLogoUrl = useCallback((url) => {
    setLogoUrlRaw(resolveLogoUrl(url));
  }, []);

  // Applies + caches the theme immediately (no network call here — callers
  // that need it persisted, like Account Settings' Save button, send it to
  // the backend themselves). This is what makes clicking a theme swatch
  // repaint the whole app before the user even hits Save.
  const setTheme = useCallback((next) => {
    setThemeState(next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  }, []);

  // ── Apply theme to <html data-theme="dark">, tracking the OS live
  //    while "System" is selected ──
  useEffect(() => {
    const apply = () => {
      if (resolveTheme(theme) === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    };
    apply();
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  // ── Apply brand color (re-derive whenever the color or the resolved
  //    theme changes, since each theme wants different tints) ──
  useEffect(() => {
    applyBrandColor(brandColor, resolvedTheme === 'dark');
  }, [brandColor, resolvedTheme]);

  // Load from backend on mount — but only if we're actually logged in.
  // Without this guard, CompanyProvider (which wraps the whole app,
  // including the /login screen) fires this fetch before any token
  // exists, gets a 401, and — combined with the old aggressive 401
  // handler in api.js — caused an infinite reload loop on the login page.
  const loadSettings = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
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

      // Per-user theme preference lives on the account, not the company, so
      // it's fetched directly rather than via settingsApi. This is only a
      // reconciliation step — the theme applied on first render already
      // came from localStorage — so a fresh browser or a different device
      // picks up the saved preference instead of always defaulting to light.
      try {
        const pRes = await fetch(`${API}/account/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pRes.ok) {
          const prefs = await pRes.json();
          if (prefs?.theme) setTheme(prefs.theme);
        }
      } catch {
        // keep whatever theme is already applied
      }

    } catch {
      // silently fall back to defaults
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Re-run once login succeeds and a token appears (e.g. call
  // `reload()` from your login success handler after storing the token).
  return (
    <CompanyContext.Provider value={{
      companyName,    setCompanyName,
      companySubtitle,setCompanySubtitle,
      logoUrl,        setLogoUrl,
      brandColor,     setBrandColor,
      theme,          setTheme,        resolvedTheme,
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