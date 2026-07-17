import { req, reqBlob } from '../../../services/api';

export const clientJobsApi = {
  list:        ()             => req('/client-portal/me/jobs', { panel: 'portal' }),
  get:         (id)           => req(`/client-portal/me/jobs/${id}`, { panel: 'portal' }),
  create:      (payload)      => req('/client-portal/me/jobs', { method: 'POST', body: payload, panel: 'portal' }),
  update:      (id, payload)  => req(`/client-portal/me/jobs/${id}`, { method: 'PATCH', body: payload, panel: 'portal' }),
  reschedule:  (id, payload)  => req(`/client-portal/me/jobs/${id}/reschedule`, { method: 'PATCH', body: payload, panel: 'portal' }),
  cancel:      (id)           => req(`/client-portal/me/jobs/${id}/cancel`, { method: 'PATCH', panel: 'portal' }),
  rate:        (id, payload)  => req(`/client-portal/me/jobs/${id}/rating`, { method: 'PATCH', body: payload, panel: 'portal' }),
  invoice:     (id)           => req(`/client-portal/me/jobs/${id}/invoice`, { panel: 'portal' }),
};

export const clientTicketsApi = {
  // ── existing ──
  create: (payload) => req('/client-portal/me/tickets', { method: 'POST', body: payload, panel: 'portal' }),

  // ── new — these are what TicketsPage.jsx needs for the list/detail/reply flows ──
  list:  (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/client-portal/me/tickets${qs ? '?' + qs : ''}`, { panel: 'portal' });
  },
  stats: ()           => req('/client-portal/me/tickets/stats', { panel: 'portal' }),
  get:   (id)         => req(`/client-portal/me/tickets/${id}`, { panel: 'portal' }),
  reply: (id, text)   => req(`/client-portal/me/tickets/${id}/messages`, { method: 'POST', body: { text }, panel: 'portal' }),
};

export const clientPaymentsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/client-portal/me/payments${qs ? '?' + qs : ''}`, { panel: 'portal' });
  },
  summary:     ()        => req('/client-portal/me/payments/summary', { panel: 'portal' }),
  createOrder: (id)      => req(`/client-portal/me/payments/${id}/create-order`, { method: 'POST', panel: 'portal' }),
  verify:      (payload) => req('/client-portal/me/payments/verify', { method: 'POST', body: payload, panel: 'portal' }),
};

export const clientRemindersApi = {
  list:           ()               => req('/client-portal/me/reminders', { panel: 'portal' }),
  requestService: (id, payload={}) => req(`/client-portal/me/reminders/${id}/request-service`, { method: 'PATCH', body: payload , panel: 'portal'}),
  snooze:         (id, days)       => req(`/client-portal/me/reminders/${id}/snooze`, { method: 'PATCH', body: { days } , panel: 'portal'}),
};

export const clientAmcApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/client-portal/me/amc${qs ? '?' + qs : ''}`, { panel: 'portal' });
  },
  summary: () => req('/client-portal/me/amc/summary', { panel: 'portal' }),
  get: (id) => req(`/client-portal/me/amc/${id}`, { panel: 'portal' }),
  requestService: (id, payload = {}) =>
    req(`/client-portal/me/amc/${id}/request-service`, { method: 'PATCH', body: payload, panel: 'portal' }),
  requestRenewal: (id, payload = {}) =>
    req(`/client-portal/me/amc/${id}/request-renewal`, { method: 'PATCH', body: payload, panel: 'portal' }),
};

export const clientContractsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/client-portal/me/contracts${qs ? '?' + qs : ''}`, { panel: 'portal' });
  },
  summary: () => req('/client-portal/me/contracts/summary', { panel: 'portal' }),
  get: (id) => req(`/client-portal/me/contracts/${id}`, { panel: 'portal' }),
  sign: (id) => req(`/client-portal/me/contracts/${id}/sign`, { method: 'PATCH', panel: 'portal' }),
  requestService: (id, payload = {}) =>
    req(`/client-portal/me/contracts/${id}/request-service`, { method: 'PATCH', body: payload, panel: 'portal' }),
  requestRenewal: (id, payload = {}) =>
    req(`/client-portal/me/contracts/${id}/request-renewal`, { method: 'PATCH', body: payload, panel: 'portal' }),
  download: (id) => reqBlob(`/client-portal/me/contracts/${id}/download`, { panel: 'portal' }),
};

export const clientQuotationsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/client-portal/me/quotations${qs ? '?' + qs : ''}`, { panel: 'portal' });
  },
  summary:      ()           => req('/client-portal/me/quotations/summary', { panel: 'portal' }),
  get:          (id)         => req(`/client-portal/me/quotations/${id}`, { panel: 'portal' }),
  updateStatus: (id, payload) =>
    req(`/client-portal/me/quotations/${id}/status`, { method: 'PATCH', body: payload, panel: 'portal' }),
  download: (id) => reqBlob(`/client-portal/me/quotations/${id}/download`, { panel: 'portal' }),
};

export const clientProfileApi = {
  get:              ()        => req('/client-portal/me/profile', { panel: 'portal' }),
  summary:          ()        => req('/client-portal/me/profile/summary', { panel: 'portal' }),
  update:           (payload) => req('/client-portal/me/profile', { method: 'PATCH', body: payload, panel: 'portal' }),
  changePassword:   (payload) => req('/client-portal/me/profile/password', { method: 'PATCH', body: payload, panel: 'portal' }),
  getNotifPrefs:    ()        => req('/client-portal/me/profile/notification-prefs', { panel: 'portal' }),
  updateNotifPrefs: (payload) => req('/client-portal/me/profile/notification-prefs', { method: 'PATCH', body: payload, panel: 'portal' }),
};

export const clientDashboardApi = {
  summary: () => req('/client-portal/me/dashboard-summary', { panel: 'portal' }),
 
  // NEW — powers the "This Month / Last Month / This Year" trend dropdown.
  // period: 'this_month' | 'last_month' | 'this_year'
  trend: (period = 'this_month') =>
    req(`/client-portal/me/dashboard-trend?period=${period}`, { panel: 'portal' }),
};

export const clientInvoicesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/client-portal/me/invoices${qs ? '?' + qs : ''}`, { panel: 'portal' });
  },
  summary: () => req('/client-portal/me/invoices/summary', { panel: 'portal' }),
  get:     (id) => req(`/client-portal/me/invoices/${id}`, { panel: 'portal' }),
  // Kicks off payment for THIS invoice — returns the same order shape
  // clientPaymentsApi.createOrder does. Follow it with the SAME
  // clientPaymentsApi.verify(...) call after Razorpay checkout closes.
  pay: (id) => req(`/client-portal/me/invoices/${id}/pay`, { method: 'POST', panel: 'portal' }),
  download: (id) => reqBlob(`/client-portal/me/invoices/${id}/download`, { panel: 'portal' }),
};

// ── Notifications ───────────────────────────────────────────────────────────
// Backend is role-agnostic (resolves off req.user._id), so this hits the
// SAME /notifications endpoints admin uses — just with the portal token.
export const clientNotificationsApi = {
  list:     (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/notifications${qs ? '?' + qs : ''}`, { panel: 'portal' });
  },
  markRead: (id) => req(`/notifications/${id}/read`, { method: 'PATCH', panel: 'portal' }),
  markAll:  ()   => req('/notifications/read-all', { method: 'PATCH', panel: 'portal' }),
};

export const clientReportsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req(`/client-portal/me/reports${qs ? '?' + qs : ''}`, { panel: 'portal' });
  },
  get: (id) => req(`/client-portal/me/reports/${id}`, { panel: 'portal' }),
 
  // Streams/redirects to the actual file — used by the "Download" and
  // "View" buttons in DocumentsPage.jsx (replacing the current fake
  // setToast(...) calls).
  download: (id) => reqBlob(`/client-portal/me/reports/${id}/download`, { panel: 'portal' }),
};