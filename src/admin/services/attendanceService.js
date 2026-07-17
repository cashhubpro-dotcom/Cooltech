// src/services/attendanceService.js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Get token from wherever your app stores it ──────────────────────────────
// Adjust this function to match YOUR auth setup (localStorage key, etc.)
function getToken() {
  return localStorage.getItem("admin_token") || null;
}

// ─── Base request with auth header ───────────────────────────────────────────
async function request(method, path, body) {
  const token = getToken();

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 globally — redirect to login if token expired
  if (res.status === 401) {
    console.warn("Attendance API: 401 Unauthorized — token may be expired");
    // Optional: uncomment to auto-redirect to login
    // window.location.href = "/login";
    throw { error: "Unauthorized — please log in again", status: 401 };
  }

  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

// ─── Clock Actions ────────────────────────────────────────────────────────────
export const clockIn    = (userId, ipAddress) =>
  request("POST", "/attendance/clock-in", { userId, ipAddress });

export const breakStart = (userId) =>
  request("POST", "/attendance/break-start", { userId });

export const breakEnd   = (userId) =>
  request("POST", "/attendance/break-end", { userId });

export const clockOut   = (userId) =>
  request("POST", "/attendance/clock-out", { userId });

// ─── Sessions ────────────────────────────────────────────────────────────────
export const getSessions = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request("GET", `/attendance/sessions${qs ? `?${qs}` : ""}`);
};

export const getActiveSession = (userId) =>
  request("GET", `/attendance/sessions/active?userId=${userId}`);

export const getSessionById = (id) =>
  request("GET", `/attendance/sessions/${id}`);

export const updateSession = (id, updates) =>
  request("PUT", `/attendance/sessions/${id}`, updates);

export const deleteSession = (id) =>
  request("DELETE", `/attendance/sessions/${id}`);

// ─── Team Status ─────────────────────────────────────────────────────────────
export const getTeamStatus = () =>
  request("GET", "/attendance/team-status");

// ─── Reports ─────────────────────────────────────────────────────────────────
export const getReports = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request("GET", `/attendance/reports${qs ? `?${qs}` : ""}`);
};

// ─── Settings ────────────────────────────────────────────────────────────────
export const getSettings    = ()     => request("GET",    "/attendance/settings");
export const updateSettings = (body) => request("PUT",    "/attendance/settings", body);
export const addIP          = (ip)   => request("POST",   "/attendance/settings/add-ip", { ip });
export const removeIP       = (ip)   => request("DELETE", "/attendance/settings/remove-ip", { ip });