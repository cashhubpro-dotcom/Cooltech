import { req, reqBlob, reqUpload, fileUrl } from '../../../services/api';
// Re-exported so pages can pull the receipt-link helper from this one file
// instead of importing services/api directly.
export { fileUrl };

export const technicianAmcApi = {
  list:    ()       => req('/technician/amc', { panel: 'tech' }),
  summary: ()        => req('/technician/amc/summary', { panel: 'tech' }),
  get:     (id)       => req(`/technician/amc/${id}`, { panel: 'tech' }),

  updateChecklist: (id, payload) =>
    req(`/technician/amc/${id}/checklist`, { method: 'PATCH', body: payload, panel: 'tech' }),

  completeVisit: (id, payload = {}) =>
    req(`/technician/amc/${id}/complete-visit`, { method: 'PATCH', body: payload, panel: 'tech' }),
};

export const techJobsApi = {
  list:      (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/technician-portal/me/jobs${qs ? '?' + qs : ''}`, { panel: 'tech' });
  },
  get:       (id)          => req(`/technician-portal/me/jobs/${id}`, { panel: 'tech' }),
  start:     (id)           => req(`/technician-portal/me/jobs/${id}/start`, { method: 'PATCH', panel: 'tech' }),
  complete:  (id, parts)    => req(`/technician-portal/me/jobs/${id}/complete`, { method: 'PATCH', body: { parts }, panel: 'tech' }),
  saveRemark:(id, remarks)  => req(`/technician-portal/me/jobs/${id}/remark`, { method: 'PATCH', body: { remarks }, panel: 'tech' }),
 
  toggleChecklistItem: (jobId, itemId, done) =>
    req(`/technician-portal/me/jobs/${jobId}/checklist/${itemId}`, { method: 'PATCH', body: { done }, panel: 'tech' }),
  addChecklistItem:    (jobId, item) =>
    req(`/technician-portal/me/jobs/${jobId}/checklist`, { method: 'POST', body: { item }, panel: 'tech' }),
  removeChecklistItem: (jobId, itemId) =>
    req(`/technician-portal/me/jobs/${jobId}/checklist/${itemId}`, { method: 'DELETE', panel: 'tech' }),
};
 
export const techInventoryApi = {
  search: (query = '') =>
    req(`/technician-portal/me/inventory${query ? '?search=' + encodeURIComponent(query) : ''}`, { panel: 'tech' }),
};

export const scheduleApi = {
  week:  (fromISO, toISO) => req(`/technician-portal/me/schedule?from=${fromISO}&to=${toISO}`, { panel: 'tech' }),
  month: (month, year)    => req(`/technician-portal/me/schedule/month?month=${month}&year=${year}`, { panel: 'tech' }),
  stats: ()                => req('/technician-portal/me/schedule/stats', { panel: 'tech' }),
  requestReschedule: (id, { requestedDate, requestedTime, reason }) =>
    req(`/technician-portal/me/jobs/${id}/reschedule-request`, {
      method: 'PATCH',
      body: { requestedDate, requestedTime, reason },
      panel: 'tech',
    }),
};

// ── Attendance & Clock In/Out ──────────────────────────────────────────────
// Backed by routes/technicianAttendanceRoutes.js, mounted in server.js as
//   app.use('/api/technician/attendance', technicianAttendanceRoutes)
// — flat, same convention as technicianAmcApi above ('/technician/amc'), NOT
// the '/technician-portal/me/*' prefix jobs/inventory/schedule use. Every one
// of these resolves to req.user/req.technician on the server; there's no id
// parameter to pass because there's nothing to scope — a technician only
// ever has one "me".
export const techAttendanceApi = {
  // Clock actions
  clockIn:    (ipAddress) =>
    req('/technician/attendance/clock-in', { method: 'POST', body: { ipAddress }, panel: 'tech' }),
  breakStart: () =>
    req('/technician/attendance/break-start', { method: 'POST', panel: 'tech' }),
  breakEnd:   () =>
    req('/technician/attendance/break-end', { method: 'POST', panel: 'tech' }),
  clockOut:   () =>
    req('/technician/attendance/clock-out', { method: 'POST', panel: 'tech' }),

  // Read-only views
  activeSession: () =>
    req('/technician/attendance/session', { panel: 'tech' }),
  sessions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/technician/attendance/sessions${qs ? '?' + qs : ''}`, { panel: 'tech' });
  },
  reports: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/technician/attendance/reports${qs ? '?' + qs : ''}`, { panel: 'tech' });
  },
  // month is 0-11, matching JS Date — pass new Date().getMonth()/getFullYear()
  summary: (month, year) =>
    req(`/technician/attendance/summary?month=${month}&year=${year}`, { panel: 'tech' }),
  settings: () =>
    req('/technician/attendance/settings', { panel: 'tech' }),

  // Correction requests — a technician can never edit a clock record
  // directly; this is the only write path into attendance history, and it
  // only ever proposes a change for an admin to approve/reject.
  requestCorrection: ({ targetDate, reason, sessionId, requestedClockIn, requestedClockOut } = {}) =>
    req('/technician/attendance/corrections', {
      method: 'POST',
      body: { targetDate, reason, sessionId, requestedClockIn, requestedClockOut },
      panel: 'tech',
    }),
  corrections: () =>
    req('/technician/attendance/corrections', { panel: 'tech' }),
};

// ── Leaves ──────────────────────────────────────────────────────────────────
// Backed by routes/technicianLeaveRoutes.js, mounted in server.js as
//   app.use('/api/technician/leaves', technicianLeaveRoutes)
// — flat, same convention as technicianAmcApi / techAttendanceApi above, NOT
// the '/technician-portal/me/*' prefix jobs/schedule use. Every route
// resolves req.technician server-side (see attachTechnician middleware), so
// there's nothing to scope by except the leave's own id for get/update/withdraw.
export const leavesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/technician/leaves${qs ? '?' + qs : ''}`, { panel: 'tech' });
  },
  balance:  ()            => req('/technician/leaves/balance', { panel: 'tech' }),
  get:      (id)           => req(`/technician/leaves/${id}`, { panel: 'tech' }),
  create:   (payload)      => req('/technician/leaves', { method: 'POST', body: payload, panel: 'tech' }),
  update:   (id, payload)  => req(`/technician/leaves/${id}`, { method: 'PUT', body: payload, panel: 'tech' }),
  withdraw: (id)           => req(`/technician/leaves/${id}`, { method: 'DELETE', panel: 'tech' }),
};

export const technicianSalaryApi = {
  list:    ()   => req('/technician-portal/me/salary', { panel: 'tech' }),
  summary: ()   => req('/technician-portal/me/salary/summary', { panel: 'tech' }),
  detail:  (id) => req(`/technician-portal/me/salary/${id}`, { panel: 'tech' }),
 
  // Binary — goes through reqBlob, not req(), but shares the exact same
  // BASE + tech_token auth as every other call in this object.
  download: (id) => reqBlob(`/technician-portal/me/salary/${id}/download`, { panel: 'tech' }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────
// Backed by the new GET /dashboard route added to technicianPortal.routes.js,
// mounted under the same '/technician-portal/me' base as jobs/schedule/salary.
export const technicianDashboardApi = {
  // params: { month: 0-11, year: YYYY } — omit both for the current month.
  get: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/technician-portal/me/dashboard${qs ? '?' + qs : ''}`, { panel: 'tech' });
  },
};

export const technicianProfileApi = {
  get:         ()        => req('/technician-portal/me/profile', { panel: 'tech' }),
  update:      (payload) => req('/technician-portal/me/profile', { method: 'PUT', body: payload, panel: 'tech' }),
  performance: ()        => req('/technician-portal/me/performance-summary', { panel: 'tech' }),
};

export const authApi = {
  changePassword: (payload) =>
    req('/auth/change-password', { method: 'PUT', body: payload, panel: 'tech' }),
};

// ── Expenses ────────────────────────────────────────────────────────────────
// Backed by routes/technicianExpense.routes.js, mounted in server.js as
//   app.use('/api/technician/expenses', technicianExpenseRoutes)
// Flat convention, same as techAttendanceApi / leavesApi above — every call
// resolves to req.technician server-side, so a technician only ever
// sees/touches their own claims. Edit/delete come back as a 403 with a
// message once a claim leaves 'pending' — callers should surface
// err.message rather than assume success.
export const techExpensesApi = {
  // Pulls a high limit and lets ExpensesPage do search/filter/pagination
  // client-side, same convention the admin panel's own expense list uses.
  list: (params = {}) => {
    const qs = new URLSearchParams({ limit: 500, ...params }).toString();
    return req(`/technician/expenses?${qs}`, { panel: 'tech' });
  },
  get: (id) => req(`/technician/expenses/${id}`, { panel: 'tech' }),

  create: (payload) =>
    req('/technician/expenses', { method: 'POST', body: payload, panel: 'tech' }),

  update: (id, payload) =>
    req(`/technician/expenses/${id}`, { method: 'PUT', body: payload, panel: 'tech' }),

  remove: (id) =>
    req(`/technician/expenses/${id}`, { method: 'DELETE', panel: 'tech' }),

  // Uses reqUpload, NOT req — req() always JSON.stringifies the body and
  // forces 'Content-Type: application/json', which would corrupt a
  // FormData/file payload. See services/api.js for reqUpload.
  uploadReceipt: (file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return reqUpload('/technician/expenses/upload-receipt', formData, { panel: 'tech' });
  },
};

export const technicianAdvancesApi = {
  list:    ()        => req('/technician-portal/me/advances', { panel: 'tech' }),
  summary: ()        => req('/technician-portal/me/advances/summary', { panel: 'tech' }),
  request: (payload) => req('/technician-portal/me/advances', { method: 'POST', body: payload, panel: 'tech' }),
};

// ── Notifications ───────────────────────────────────────────────────────────
// Same backend endpoint as admin/client — resolves off req.user._id.
export const technicianNotificationsApi = {
  list:     (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/notifications${qs ? '?' + qs : ''}`, { panel: 'tech' });
  },
  markRead: (id) => req(`/notifications/${id}/read`, { method: 'PATCH', panel: 'tech' }),
  markAll:  ()   => req('/notifications/read-all', { method: 'PATCH', panel: 'tech' }),
};

