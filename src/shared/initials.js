// src/shared/initials.js
// Small helpers shared by the client and technician headers.

// "Sunrise Hotel" -> "SH", "Ramesh Kumar" -> "RK", "" -> "?"
export const getInitials = (name = '') =>
  String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';

// Reads the user object the login page saved in localStorage
// (client panel: 'portal_user', technician panel: 'tech_user').
// Returns {} when nothing is stored or the value is not valid JSON.
export const readStoredUser = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
  catch { return {}; }
};