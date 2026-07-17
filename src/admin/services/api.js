// ─── Central API Service ──────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('admin_token')
    ? { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
    : {}),
});

// const req = async (method, path, body) => {
//   const res = await fetch(`${BASE}${path}`, {
//     method,
//     headers: headers(),
//     ...(body ? { body: JSON.stringify(body) } : {}),
//   });

//   if (res.status === 401) {
//     const hasToken = !!localStorage.getItem('token');
//     const onLoginPage = window.location.pathname === '/' || window.location.pathname === '/login';
//     if (hasToken && !onLoginPage) {
//       localStorage.clear();
//       window.location.href = '/';
//     }
//     throw new Error('Unauthorized');
//   }

//   const data = await res.json();
//   if (!res.ok) throw new Error(data.message || 'Request failed');
//   return data;
// };

const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    const hasToken = !!localStorage.getItem('admin_token');
    const onLoginPage = window.location.pathname === '/' || window.location.pathname === '/login';
    if (hasToken && !onLoginPage) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ── NEW — for binary responses (PDF/zip downloads), same auth as req()
// above but skips JSON parsing on success since the body is a file.
const reqBlob = async (method, path) => {
  const res = await fetch(`${BASE}${path}`, { method, headers: headers() });

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Request failed');
  }
  return res.blob();
};

export const crud = (resource) => ({
  list:    (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/${resource}${qs ? '?' + qs : ''}`);
  },
  get:     (id)       => req('GET',    `/${resource}/${id}`),
  create:  (body)     => req('POST',   `/${resource}`, body),
  update:  (id, body) => req('PUT',    `/${resource}/${id}`, body),
  remove:  (id)       => req('DELETE', `/${resource}/${id}`),
  restore: (id)       => req('PUT',    `/${resource}/${id}/restore`),
});

// ── Existing APIs ─────────────────────────────────────────────────────────────
export const customersApi  = crud('customers');
export const techsApi      = crud('technicians');
export const jobsApi = {
  ...crud('jobs'),
  assign: (jobId, { technicianId, techName }) =>
    req('PUT', `/jobs/${jobId}/assign`, { technicianId, techName }),
  complete: (id, b) => req('PUT', `/jobs/${id}/complete`, b),
  listRescheduleRequests: () =>
    req('GET', '/jobs/reschedule-requests'),
  respondToReschedule: (jobId, action) => // action: 'approve' | 'reject'
    req('PUT', `/jobs/${jobId}/reschedule/respond`, { action }),
};
export const amcApi        = crud('amc');
export const quotationsApi = {
  ...crud('quotations'),
  convert: (id) => req('POST', `/quotations/${id}/convert`),
  updateStatus:(id, b)  => req('PATCH', `/quotations/${id}/status`, b),
  sendEmail:  (id, b)   => req('POST',  `/quotations/${id}/send-email`, b),
  magicImport: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${BASE}/quotations/magic-import`, {
      method: "POST",
      headers: localStorage.getItem("admin_token")
        ? { Authorization: `Bearer ${localStorage.getItem("admin_token")}` }
        : {},
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Magic import failed.");
    }

    return data;
  },
};
export const invoicesApi = {
  ...crud('invoices'),
  pay:         (id, b)    => req('PUT',   `/invoices/${id}/pay`, b),
  updateStatus: (id, body) => req('PATCH', `/invoices/${id}/status`, body),
};

// ── Payments (Razorpay-backed) ─────────────────────────────────────────────────
export const paymentsApi = {
  ...crud('payments'),
  // Direct Razorpay Checkout.js flow
  createOrder: (body)      => req('POST', '/payments/create-order', body),
  verify:      (body)      => req('POST', '/payments/verify', body),
  // Shareable Razorpay Payment Link flow
  createPaymentLink: (body) => req('POST', '/payments/payment-link', body),
  // Manual mark-as-paid (cash / cheque / bank transfer)
  markPaid:    (id, body)  => req('PUT', `/payments/${id}/mark-paid`, body),
  // KPI summary
  stats:       ()          => req('GET', '/payments/stats/summary'),
};

export const uploadApi = {
  upload: async (file) => {
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: localStorage.getItem('admin_token')
        ? { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
        : {},
      body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload failed');
    return json;
  },
};

export const expensesApi = {
  ...crud('expenses'),
  approve:       (id)        => req('PUT', `/expenses/${id}/approve`),
  reject:        (id)        => req('PUT', `/expenses/${id}/reject`),
  softDelete:    (id)        => req('PUT', `/expenses/${id}/soft-delete`),
  restore:       (id)        => req('PUT', `/expenses/${id}/restore`),
};
export const inventoryApi  = {
  ...crud('inventory'),
  adjustStock: (id, adj) => req('PUT', `/inventory/${id}/stock`, { adjustment: adj }),
  lowStock:    ()        => req('GET', '/inventory/alerts/low-stock'),
};
export const leadsApi      = {
  ...crud('leads'),
  addActivity: (id, b) => req('POST', `/leads/${id}/activities`, b),
  convert:     (id)    => req('POST', `/leads/${id}/convert`),
};
export const complaintsApi = {
  ...crud('complaints'),
  assign:  (id, payload) => req('PUT', `/complaints/${id}/assign`, payload),
  resolve: (id, payload) => req('PUT', `/complaints/${id}/resolve`, payload),
};
export const ticketsApi    = {
  ...crud('tickets'),
  addMessage: (id, b) => req('POST', `/tickets/${id}/messages`, b),
  resolve:    (id)    => req('PUT',  `/tickets/${id}/resolve`),
};
export const attendanceApi = {
  list:   (p)    => req('GET',    `/attendance?${new URLSearchParams(p)}`),
  upsert: (b)    => req('POST',   `/attendance/upsert`, b),
  update: (id,b) => req('PUT',    `/attendance/${id}`, b),
  delete: (b)    => req('DELETE', `/attendance?technician=${b.technician}&date=${encodeURIComponent(b.date)}`),
};
export const salaryApi     = {
  ...crud('salary'),
  pay: (id) => req('PUT', `/salary/${id}/pay`),
};
export const payrollApi = {
  preview:  (body) => req('POST', '/payroll/preview', body),
  generate: (body) => req('POST', '/payroll/generate', body),
  // ── NEW — admin Salary page ────────────────────────────────────────────
  listRuns: (period) => req('GET', `/payroll/runs?period=${encodeURIComponent(period)}`),
  markPaid: (id)     => req('PATCH', `/payroll/runs/${id}/pay`),
  downloadOne: (id)  => reqBlob('GET', `/payroll/runs/${id}/download`),
  downloadPayslips: async (runIds) => {
    const res = await fetch(`${BASE}/payroll/payslips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('admin_token')
          ? { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
          : {}),
      },
      body: JSON.stringify({ runIds }),
    });
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to download payslips');
    }
    return res.blob();
  },
};
export const payrollSettingsApi = {
  get:    ()     => req('GET', '/payroll-settings'),
  update: (body) => req('PUT', '/payroll-settings', body),
};
export const suppliersApi  = { ...crud('suppliers'),
  stats: () => req('GET', '/suppliers/stats/summary'),
}
export const purchaseApi   = crud('purchase-orders');
export const assetsApi     = crud('assets');
export const contractsApi = {
  ...crud('contracts'),
  sign: (id) => req('PUT', `/contracts/${id}/sign`),
  clone: (id) => req('POST', `/contracts/${id}/clone`),
  sendSignature: (id, signatories) => req('POST', `/contracts/${id}/send-signature`, { signatories }),
  markSignatorySigned: (id, index) => req('PUT', `/contracts/${id}/signatories/${index}/mark-signed`),
  addClause: (id, text) => req('POST', `/contracts/${id}/clauses`, { text }),
  scheduleVisit: (id, payload) => req('PUT', `/contracts/${id}/schedule-visit`, payload),
  getAuditTrail: (id) => req('GET', `/contracts/${id}/audit`),
};
export const remindersApi  = crud('reminders');
export const servicesApi   = crud('services');
export const priceItemsApi = crud('pricelist');
export const usersApi      = crud('users');
export const dashboardApi  = () => req('GET', '/dashboard/stats');
export const dashboardOverviewApi = () => req('GET', '/dashboard/overview');

export const leavesApi = {
  list:    (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/leaves${qs ? '?' + qs : ''}`);
  },
  stats:   ()            => req('GET',   '/leaves/stats'),
  get:     (id)          => req('GET',   `/leaves/${id}`),
  create:  (body)        => req('POST',  `/leaves`, body),
  update:  (id, body)    => req('PUT',   `/leaves/${id}`, body),
  delete:  (id)          => req('DELETE',`/leaves/${id}`),
  approve: (id, body={}) => req('PATCH', `/leaves/${id}/approve`, body),
  reject:  (id, body={}) => req('PATCH', `/leaves/${id}/reject`,  body),
};

export const timelogsApi = crud('timelogs');

export const chatApi = {
  getChannels:   ()            => req('GET',   '/chat/channels'),
  createChannel: (body)        => req('POST',  '/chat/channels', body),
  deleteChannel: (id)          => req('DELETE',`/chat/channels/${id}`),
  clearUnread:   (id)          => req('PATCH', `/chat/channels/${id}/clear-unread`),
  getOrCreateDM: (techName)    => req('POST',  '/chat/channels/dm', { techName }),
  getMessages:   (channel, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/chat/messages/${channel}${qs ? '?' + qs : ''}`);
  },
  sendMessage:  (body)         => req('POST',  '/chat/messages', body),
  deleteMessage:(id)           => req('DELETE',`/chat/messages/${id}`),
  markRead:     (id, userName) => req('PATCH', `/chat/messages/${id}/read`, { userName }),
  stats:        ()             => req('GET',   '/chat/stats'),
};

export const feedbackApi = {
  ...crud('feedback'),
  stats:           ()       => req('GET',  '/feedback/stats'),
  reply:           (id, r)  => req('PUT',  `/feedback/${id}/reply`,       { reply: r }),
  followUp:        (id, n)  => req('PUT',  `/feedback/${id}/follow-up`,   { note: n }),
  requestFeedback: (body)   => req('POST', '/feedback/request-feedback',  body),
};

export const tasksApi = {
  list:         (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/tasks${qs ? '?' + qs : ''}`);
  },
  stats:        ()            => req('GET',   '/tasks/stats'),
  get:          (id)          => req('GET',   `/tasks/${id}`),
  create:       (body)        => req('POST',  '/tasks', body),
  update:       (id, body)    => req('PUT',   `/tasks/${id}`, body),
  updateStatus: (id, status)  => req('PATCH', `/tasks/${id}/status`, { status }),
  delete:       (id)          => req('DELETE',`/tasks/${id}`),
  restore:      (id)          => req('PUT',   `/tasks/${id}/restore`),

  addComment:    (id, text, author)  => req('POST',   `/tasks/${id}/comments`, { text, author }),
  deleteComment: (id, commentId)     => req('DELETE', `/tasks/${id}/comments/${commentId}`),

  uploadAttachment: async (id, file, uploadedBy = 'Admin') => {
    const form = new FormData();
    form.append('file', file);
    form.append('uploadedBy', uploadedBy);

    const res = await fetch(`${BASE}/tasks/${id}/attachments`, {
      method: 'POST',
      headers: localStorage.getItem('admin_token')
        ? { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
        : {},
      body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload failed');
    return json;
  },

  deleteAttachment: (id, attachmentId) => req('DELETE', `/tasks/${id}/attachments/${attachmentId}`),
};

export const calendarApi = {
  getEvents:   (month)      => req('GET',    `/calendar${month ? `?month=${month}` : ''}`),
  getAllEvents: ()           => req('GET',    '/calendar/all'),
  stats:       (month)      => req('GET',    `/calendar/stats${month ? `?month=${month}` : ''}`),
  create:      (body)       => req('POST',   '/calendar', body),
  update:      (id, body)   => req('PUT',    `/calendar/${id}`, body),
  delete:      (id)         => req('DELETE', `/calendar/${id}`),
};

export const holidaysApi = {
  // GET /api/holidays/:year
  getByYear: (year) => req('GET', `/holidays/${year}`),
};

export const noticesApi = {
  ...crud('notices'),
  pin:    (id) => req('PUT',  `/notices/${id}/pin`),
  markRead:(id)=> req('POST', `/notices/${id}/read`),
};

export const notificationsApi = {
  list:     (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/notifications${qs ? '?' + qs : ''}`);
  },
  create:   (body)  => req('POST',   '/notifications', body),
  markRead: (id)    => req('PATCH',  `/notifications/${id}/read`),
  markAll:  ()      => req('PATCH',  '/notifications/read-all'),
  delete:   (id)    => req('DELETE', `/notifications/${id}`),
  clearAll: ()      => req('DELETE', '/notifications'),
};

export const recruitmentApi = {
  ...crud('recruitment'),
  addApplicant:    (jobId, body)               => req('POST',   `/recruitment/${jobId}/applicants`, body),
  updateApplicant: (jobId, applicantId, body)  => req('PUT',    `/recruitment/${jobId}/applicants/${applicantId}`, body),
  removeApplicant: (jobId, applicantId)        => req('DELETE', `/recruitment/${jobId}/applicants/${applicantId}`),
};

export const performanceApi = {
  ...crud('performance'),
  calculate: (body) => req('POST', '/performance/calculate', body),
};

export const advanceIncentiveApi = {
  ...crud('advance-incentive'),
  approve:  (id, body)   => req('PUT', `/advance-incentive/${id}/approve`, body),
  reject:   (id, body)   => req('PUT', `/advance-incentive/${id}/reject`, body),
  pay:      (id, body)   => req('PUT', `/advance-incentive/${id}/pay`, body),
  summary:  (techId, p)  => req('GET', `/advance-incentive/summary/${techId}${p?.month ? `?month=${p.month}` : ''}`),
};

export const gaslogApi = {
  ...crud('gaslog'),
  usageStats: () => req('GET', '/gaslog/stats/usage'),
};

export const gasPurchaseApi = {
  ...crud('gas-purchases'),
  stats: (gasType) => req('GET', `/gas-purchases/stats/summary${gasType ? `?gasType=${gasType}` : ''}`),
};

export const gasRateApi = {
  current: ()               => req('GET',  '/gas-rates'),
  history: (gasType)        => req('GET',  `/gas-rates/${gasType}/history`),
  set:     (body)           => req('POST', '/gas-rates', body),
};

export const warrantyApi = {
  ...crud('warranty'),
  expiring: (days = 30) => req('GET', `/warranty/alerts/expiring?days=${days}`),
  claim:    (id)        => req('PUT', `/warranty/${id}/claim`),
};

export const partWarrantyApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/part-warranties${qs ? '?' + qs : ''}`);
  },
  getOne: (id) => req('GET', `/part-warranties/${id}`),
  create: (body) => req('POST', '/part-warranties', body),
  update: (id, body) => req('PUT', `/part-warranties/${id}`, body),
  remove: (id) => req('DELETE', `/part-warranties/${id}`),
};

export const projectsApi = {
  ...crud('projects'),
  updateProgress: (id, progress) => req('PUT', `/projects/${id}/progress`, { progress }),
  stats:          ()             => req('GET', '/projects/stats/summary'),
  toggleMilestone: (id, milestoneId, completed) =>
    req('PATCH', `/projects/${id}/milestones/${milestoneId}`, { completed }),
};

export const customerTypesApi = crud('customer-types');
export const contractTypesApi = crud('contract-types');
export const contractPlansApi = crud('contract-plans');

// ── Option Sets (DynamicSelect-backed, admin-editable dropdown lists) ─────────
// NOTE ON CONSOLIDATION: several of these intentionally back MORE THAN ONE
// modal/field, rather than one option-set per modal. Before this pass, item
// categories were 4 separate hardcoded lists (Inventory/PO/SO/Supplier) and
// service types were 3 separate lists (Job/ConvertToJob/Quotation). Splitting
// them again into per-modal API resources would reintroduce the exact drift
// problem (e.g. "VRF Installation" added in PO but not Inventory) this
// refactor exists to fix — keep them merged unless the underlying business
// concept actually diverges. Lead Type reuses customerTypesApi above, not a
// new resource — see NewLeadModal.
export const jobTypesApi          = crud('job-types');          // Job/Service Type — shared by NewJobModal, ConvertToJobModal, NewQuotationModal
export const itemCategoriesApi    = crud('item-categories');    // Product/Item Category — shared by AddInventoryModal, NewPOModal, NewSOModal, NewSupplierModal
export const inventoryUnitsApi    = crud('inventory-units');    // Unit of measure — AddInventoryModal
export const expenseCategoriesApi = crud('expense-categories'); // AddExpenseModal
export const poTypesApi           = crud('po-types');           // NewPOModal PO Type
export const vehicleSubtypesApi   = crud('vehicle-subtypes');   // NewAssetModal
export const equipmentSubtypesApi = crud('equipment-subtypes'); // NewAssetModal
export const partTypesApi         = crud('part-types');         // RegisterWarrantyModal
export const acTypesApi           = crud('ac-types');           // RegisterWarrantyModal
export const unitWarrantyTypesApi = crud('unit-warranty-types');// RegisterWarrantyModal
export const partWarrantyTypesApi = crud('part-warranty-types');// RegisterWarrantyModal
export const noticeCategoriesApi  = crud('notice-categories');  // NewNoticeModal
export const ticketIssueTypesApi  = crud('ticket-issue-types'); // NewTicketModal
export const ticketChannelsApi    = crud('ticket-channels');    // NewTicketModal
export const adminRolesApi        = crud('admin-roles');        // AddAdminUserModal
export const paymentMethodsApi    = crud('payment-methods');    // HR RecordPaymentModal
export const priceItemCategoriesApi = crud('price-item-categories'); // HR NewPriceItemModal
export const priceItemUnitsApi    = crud('price-item-units');   // HR NewPriceItemModal
export const reminderTypesApi     = crud('reminder-types');     // HR NewReminderModal
export const leaveTypesApi        = crud('leave-types');        // HR ApplyLeaveModal
export const gasTypesApi          = crud('gas-types');          // HR LogGasModal
export const gasReasonsApi        = crud('gas-reasons');        // HR LogGasModal
export const gasRegulationRefsApi = crud('gas-regulation-refs');// HR LogGasModal
export const gasDisposalMethodsApi= crud('gas-disposal-methods');// HR LogGasModal
export const taskCategoriesApi    = crud('task-categories');    // HR NewTaskModal
export const taskLabelsApi        = crud('task-labels');        // HR NewTaskModal
export const activityTypesApi     = crud('activity-types');     // HR LogTimeModal
export const recoveryPlansApi = crud('recovery-plans'); // HR NewRequestModal (Advance) Recovery Plan

export const leadSourcesApi = {
  ...crud('lead-sources'),
  performance: () => req('GET', '/lead-sources/stats/performance'),
};

export const campaignsApi = {
  ...crud('campaigns'),
  launch:  (id) => req('PUT', `/campaigns/${id}/launch`),
  pause:   (id) => req('PUT', `/campaigns/${id}/pause`),
  stats:   ()   => req('GET', '/campaigns/stats/overview'),
};

export const reviewsApi = {
  ...crud('reviews'),
  respond: (id, response) => req('PUT', `/reviews/${id}/respond`, { response }),
  stats:   ()             => req('GET', '/reviews/stats/summary'),
};

export const postsApi = {
  ...crud('posts'),
  publish:  (id)  => req('PUT', `/posts/${id}/publish`),
  stats:    ()    => req('GET', '/posts/stats/overview'),
};

export const errorCodesApi = {
  ...crud('error-codes'),
  bulkImport: (codes) => req('POST', '/error-codes/bulk', { codes }),
};

export const contentLibraryApi = {
  ...crud('content-library'),
  use: (id) => req('PUT', `/content-library/${id}/use`),
};

export const whatsappApi = {
  ...crud('whatsapp'),
  bulkSend: (body) => req('POST', '/whatsapp/bulk-send', body),
  stats:    ()     => req('GET',  '/whatsapp/stats/overview'),
};

export const reportsApi = {
  overview: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/reports/overview${qs ? '?' + qs : ''}`);
  },
  monthly: (year) => req('GET', `/reports/monthly${year ? `?year=${year}` : ''}`),
};

export const deletedItemsApi = {
  list: () => req('GET', '/deleted-items'),
};

export const technicianLookupsApi = {
  list:     (category = '')   => req('GET',    `/technician-lookups${category ? `?category=${category}` : ''}`),
  create:   (body)            => req('POST',   '/technician-lookups', body),
  update:   (id, body)        => req('PUT',    `/technician-lookups/${id}`, body),
  remove:   (id)              => req('DELETE', `/technician-lookups/${id}`),
  seed:     ()                => req('POST',   '/technician-lookups/seed'),
  reset:    (category)        => req('POST',   `/technician-lookups/reset/${category}`),
};

export const settingsApi = {
  get:              ()           => req('GET',   '/settings'),
  getTab:           (tab)        => req('GET',   `/settings/${tab}`),
  saveCompany:      (body)       => req('PATCH', '/settings/company',          body),
  saveGst:          (body)       => req('PATCH', '/settings/gst',              body),
  saveNotifications:(body)       => req('PATCH', '/settings/notifications',    body),
  saveRoles:        (body)       => req('PATCH', '/settings/rolesPermissions', body),
  saveSms:          (body)       => req('PATCH', '/settings/sms',              body),
  saveAppearance:   (body)       => req('PATCH', '/settings/appearance',       body),
  saveIntegrations: (body)       => req('PATCH', '/settings/integrations',     body),
  toggleIntegration:(name, body) => req('PATCH', `/settings/integrations/${encodeURIComponent(name)}`, body),
  triggerBackup:    (body)       => req('POST',  '/settings/backup/trigger',   body),
  saveBackup:       (body)       => req('PATCH', '/settings/backup',           body),
  uploadLogo: async (file) => {
    const form = new FormData();
    form.append('logo', file);
    const res = await fetch(`${BASE}/settings/company/logo`, {
      method: 'POST',
      headers: localStorage.getItem('admin_token')
        ? { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
        : {},
      body: form,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Upload failed');
    return json;
  },
};

// ── GST / Tax Rate Categories ──────────────────────────────────────────────
// Not using crud() here because update is PATCH (not PUT) and there are two
// extra read endpoints (audit history + server-side calculator).
export const gstApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/gst/categories${qs ? '?' + qs : ''}`);
  },
  get:      (id)       => req('GET',    `/gst/categories/${id}`),
  create:   (body)     => req('POST',   '/gst/categories', body),
  update:   (id, body) => req('PATCH',  `/gst/categories/${id}`, body),
  remove:   (id)       => req('DELETE', `/gst/categories/${id}`),
  history:  (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/gst/history${qs ? '?' + qs : ''}`);
  },
  calculate: (body)    => req('POST', '/gst/calculate', body),
};

export const clientPortalApi = {
  getCustomers: () => req('GET', '/client-portal/customers'),
  getPortalData: (customerId) => req('GET', `/client-portal/${customerId}`),
  raiseTicket: (customerId, body) => req('POST', `/client-portal/${customerId}/tickets`, body),
  signContract: (customerId, contractId) =>
    req('PUT', `/client-portal/${customerId}/contracts/${contractId}/sign`),
};

const SERVER_ORIGIN = BASE.replace(/\/api\/?$/, '');

export const fileUrl = (path) => {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const partRequestsApi = {
  ...crud('part-requests'),
  approve: (id)         => req('PUT', `/part-requests/${id}/approve`),
  reject:  (id, reason) => req('PUT', `/part-requests/${id}/reject`, { reason }),
  stats:   ()           => req('GET', '/part-requests/stats/summary'),
};