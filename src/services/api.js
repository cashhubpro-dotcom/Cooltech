const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Static/uploaded files (receipts, etc.) are served off the server root, not
// under /api — so strip the /api suffix to get the origin fileUrl() needs.
const ORIGIN = BASE.replace(/\/api\/?$/, '');

// ─── Panel key mapping ───────────────────────────────────────────────────────
// Every role belongs to exactly one panel. This is the single source of truth
// for which localStorage keys a given role's session lives under.
const PANEL_FOR_ROLE = {
  admin: 'admin',
  manager: 'admin',
  viewer: 'admin',
  technician: 'tech',
  client: 'portal',
};

const panelForRole = (role) => PANEL_FOR_ROLE[role] || null;

const tokenKey = (panel) => `${panel}_token`;
const userKey  = (panel) => `${panel}_user`;

export async function req(path, { method = 'GET', body, headers = {}, panel } = {}) {
  const token = panel ? localStorage.getItem(tokenKey(panel)) : null;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Same as req(), but for binary responses (file downloads) — the body must
// stay as a Blob rather than being JSON-parsed. Error responses are still
// assumed to be JSON (that's what every controller in this app sends on
// failure), so those are parsed normally; only the success path skips it.
export async function reqBlob(path, { method = 'GET', headers = {}, panel } = {}) {
  const token = panel ? localStorage.getItem(tokenKey(panel)) : null;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Request failed');
  }

  return res.blob();
}

// ── NEW ─────────────────────────────────────────────────────────────────────
// For multipart/form-data uploads (e.g. expense receipts). Deliberately does
// NOT set Content-Type — the browser needs to set it itself so it can
// include the multipart boundary; setting it manually breaks the upload.
export async function reqUpload(path, formData, { method = 'POST', headers = {}, panel } = {}) {
  const token = panel ? localStorage.getItem(tokenKey(panel)) : null;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
}

// ── NEW ─────────────────────────────────────────────────────────────────────
// Turns a server-relative path (e.g. "/uploads/receipts/xyz.png", as
// returned by the receipt-upload endpoint) into an absolute URL the browser
// can load directly — used for <img src> / download links. Already-absolute
// URLs are passed through untouched.
export function fileUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
// Login doesn't know the panel ahead of time — it finds out from the
// response, then stores the token/user under that panel's own keys.
export const login = async (email, password) => {
  const data = await req('/auth/login', { method: 'POST', body: { email, password } });
  const panel = panelForRole(data.user.role);
  if (!panel) throw new Error('Unrecognized account role.');
  localStorage.setItem(tokenKey(panel), data.token);
  localStorage.setItem(userKey(panel), JSON.stringify(data.user));
  sessionStorage.setItem(`${panel}_just_logged_in`, '1');
  window.dispatchEvent(new Event('authchange'));
  return data.user;
};

export const logout = (panel) => {
  localStorage.removeItem(tokenKey(panel));
  localStorage.removeItem(userKey(panel));
  window.dispatchEvent(new Event('authchange'));
};

export const getUser = (panel) => {
  const raw = localStorage.getItem(userKey(panel));
  return raw ? JSON.parse(raw) : null;
};

export const isLoggedIn = (panel) => !!localStorage.getItem(tokenKey(panel));

// Where a role lands after login
export const homeRouteForRole = (role) => {
  switch (role) {
    case 'admin':
    case 'manager':
    case 'viewer':
      return '/admin';
    case 'technician':
      return '/tech';
    case 'client':
      return '/portal';
    default:
      return '/login';
  }
};

export { panelForRole };

// ─── Password reset ────────────────────────────────────────────────────────
// Not panel-scoped — happens before any panel session exists.
export const forgotPassword = async (email) => {
  return req('/auth/forgot-password', { method: 'POST', body: { email } });
};

export const resetPassword = async (token, password) => {
  const data = await req(`/auth/reset-password/${token}`, { method: 'POST', body: { password } });
  const panel = panelForRole(data.user.role);
  if (panel) {
    localStorage.setItem(tokenKey(panel), data.token);
    localStorage.setItem(userKey(panel), JSON.stringify(data.user));
  }
  return data.user;
};