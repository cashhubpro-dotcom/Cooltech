import { useState, useEffect, useMemo, useCallback } from 'react';
import { fmtDateDMY } from '../../shared/formatDate';
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── All soft-deletable resources ────────────────────────────────────────────
const RESOURCES = [{
  key: 'customers',
  label: 'Customer',
  module: 'Customer'
}, {
  key: 'jobs',
  label: 'Job',
  module: 'Job'
}, {
  key: 'quotations',
  label: 'Quotation',
  module: 'Quotation'
}, {
  key: 'invoices',
  label: 'Invoice',
  module: 'Invoice'
}, {
  key: 'tickets',
  label: 'Support Ticket',
  module: 'Support Ticket'
}, {
  key: 'leads',
  label: 'Lead',
  module: 'Lead'
}, {
  key: 'contracts',
  label: 'Contract',
  module: 'Contract'
}, {
  key: 'amc',
  label: 'AMC Contract',
  module: 'AMC Contract'
}, {
  key: 'purchase-orders',
  label: 'Work Order',
  module: 'Work Order'
}, {
  key: 'attendance/sessions',
  label: 'Attendance Session',
  module: 'Attendance Session'
}, {
  key: 'chat/channels',
  label: 'Chat Channel',
  module: 'Chat Channel'
}, {
  key: 'chat/messages',
  label: 'Chat Message',
  module: 'Chat Message'
}, {
  key: 'notices',
  label: 'Notice',
  module: 'Notice'
}, {
  key: 'warranty',
  label: 'Warranty',
  module: 'Warranty'
}, {
  key: 'gaslog',
  label: 'Gas Log',
  module: 'Gas Log'
}, {
  key: 'gas-purchases',
  label: 'Gas Purchase',
  module: 'Gas Purchase'
}, {
  key: 'projects',
  label: 'Project',
  module: 'Project'
}, {
  key: 'recruitment',
  label: 'Applicant',
  module: 'Applicant'
}, {
  key: 'customer-types',
  label: 'Customer Type',
  module: 'Customer Type'
}, {
  key: 'lead-sources',
  label: 'Lead Source',
  module: 'Lead Source'
}, {
  key: 'performance',
  label: 'Performance',
  module: 'Performance'
}, {
  key: 'advance-incentive',
  label: 'Advance/Incentive',
  module: 'Advance/Incentive'
}, {
  key: 'ad-campaigns',
  label: 'Ad Campaign',
  module: 'Ad Campaign'
}, {
  key: 'reviews',
  label: 'Review',
  module: 'Review'
}, {
  key: 'posts',
  label: 'Post',
  module: 'Post'
}, {
  key: 'error-codes',
  label: 'AC Error Code',
  module: 'AC Error Code'
}, {
  key: 'content-library',
  label: 'Content',
  module: 'Content'
}, {
  key: 'whatsapp',
  label: 'WhatsApp Message',
  module: 'WhatsApp Message'
}, {
  key: 'technicians',
  label: 'Technician',
  module: 'Technician'
}, {
  key: 'tasks',
  label: 'Task',
  module: 'Task'
}, {
  key: 'expenses',
  label: 'Expense',
  module: 'Expense'
}, {
  key: 'assets',
  label: 'Asset',
  module: 'Asset'
}, {
  key: 'inventory',
  label: 'Inventory Item',
  module: 'Inventory Item'
}, {
  key: 'suppliers',
  label: 'Supplier',
  module: 'Supplier'
}];
const MODULE_STYLE = {
  'Customer': {
    bg: "var(--xeaf3de)",
    color: "var(--x3b6d11)"
  },
  'Job': {
    bg: "var(--xe6f1fb)",
    color: "var(--x185fa5)"
  },
  'Quotation': {
    bg: "var(--xfaeeda)",
    color: "var(--x854f0b)"
  },
  'Invoice': {
    bg: "var(--xfcebeb)",
    color: "var(--xa32d2d)"
  },
  'Support Ticket': {
    bg: "var(--xeeedfe)",
    color: "var(--x3c3489)"
  },
  'Lead': {
    bg: "var(--xfbeaf0)",
    color: "var(--x72243e)"
  },
  'Contract': {
    bg: "var(--xe1f5ee)",
    color: "var(--x0f6e56)"
  },
  'AMC Contract': {
    bg: "var(--xe1f8ee)",
    color: "var(--x0f5e56)"
  },
  'Work Order': {
    bg: "var(--xf1efe8)",
    color: "var(--x5f5e5a)"
  },
  'Attendance Session': {
    bg: "var(--xfff3e0)",
    color: "var(--xe65100)"
  },
  'Chat Channel': {
    bg: "var(--xe8f4fd)",
    color: "var(--x1565c0)"
  },
  'Chat Message': {
    bg: "var(--xf3e5f5)",
    color: "var(--x6a1b9a)"
  },
  'Task': {
    bg: "var(--brand-light)",
    color: "var(--brand-dark)"
  },
  'Notice': {
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  'Warranty': {
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  'Gas Log': {
    bg: "var(--xfdf4ff)",
    color: "var(--x7e22ce)"
  },
  'Gas Purchase': {
    bg: "var(--purple-bg)",
    color: "var(--purple-text)"
  },
  'Project': {
    bg: "var(--brand-light)",
    color: "var(--x9a3412)"
  },
  'Applicant': {
    bg: "var(--info-bg)",
    color: "var(--x0c4a6e)"
  },
  'Customer Type': {
    bg: "var(--brand-light)",
    color: "var(--brand-dark)"
  },
  'Lead Source': {
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  'Performance': {
    bg: "var(--purple-bg)",
    color: "var(--purple-text)"
  },
  'Advance/Incentive': {
    bg: "var(--xfff1f2)",
    color: "var(--xbe123c)"
  },
  'Ad Campaign': {
    bg: "var(--success-bg)",
    color: "var(--x065f46)"
  },
  'Review': {
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  'Post': {
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  'AC Error Code': {
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  'Content': {
    bg: "var(--info-bg)",
    color: "var(--x1e40af)"
  },
  'WhatsApp Message': {
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  'Technician': {
    bg: "var(--brand-light)",
    color: "var(--brand-dark)"
  },
  'Expense': {
    bg: "var(--xfef9c3)",
    color: "var(--x854d0e)"
  },
  'Asset': {
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  'Inventory Item': {
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  'Supplier': {
    bg: "var(--xfdf4ff)",
    color: "var(--x7e22ce)"
  }
};
const ALL_MODULES = RESOURCES.map(r => r.module);

// ─── API helpers ──────────────────────────────────────────────────────────────
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('admin_token') ? {
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`
  } : {})
});
async function fetchDeleted(resourceKey) {
  const res = await fetch(`${BASE}/${resourceKey}/deleted`, {
    headers: authHeaders()
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}
async function restoreItem(resourceKey, id) {
  const res = await fetch(`${BASE}/${resourceKey}/${id}/restore`, {
    method: 'PUT',
    // ← PUT (not PATCH)
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Restore failed');
  return res.json();
}
async function hardDeleteItem(resourceKey, id) {
  const res = await fetch(`${BASE}/${resourceKey}/${id}/hard`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

// ─── Normalise a raw doc into a display row ───────────────────────────────────
function normalise(doc, resource) {
  // ── Technician ─────────────────────────────────────────────────────────────
  if (resource.key === 'technicians') {
    return {
      _id: doc._id,
      id: doc.techId || 'TECH-' + String(doc._id).slice(-6).toUpperCase(),
      name: doc.name || doc.techName || 'Unknown Technician',
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Attendance Session ─────────────────────────────────────────────────────
  if (resource.key === 'attendance/sessions') {
    const userName = typeof doc.userId === 'object' && doc.userId !== null ? doc.userId.name || doc.userId.email || 'Unknown User' : 'Unknown User';
    const dateStr =fmtDateDMY(doc.date || new Date(doc.clockInTime));
    const inTime = doc.clockInTime ? new Date(doc.clockInTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) : '—';
    return {
      _id: doc._id,
      id: `ATT-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${userName} — ${dateStr} (In: ${inTime})`,
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Chat Channel ───────────────────────────────────────────────────────────
  if (resource.key === 'chat/channels') {
    return {
      _id: doc._id,
      id: `CH-${doc.id || String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.icon || '💬'} ${doc.label}`,
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.updatedAt ?fmtDateDMY(new Date(doc.updatedAt)) : '—',
      rawDate: doc.updatedAt ?? doc.createdAt
    };
  }

  // ── Chat Message ───────────────────────────────────────────────────────────
  if (resource.key === 'chat/messages') {
    return {
      _id: doc._id,
      id: `MSG-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `[#${doc.channel}] ${doc.from}: ${(doc.msg || '').slice(0, 60)}${(doc.msg || '').length > 60 ? '…' : ''}`,
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? doc.from ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Task ───────────────────────────────────────────────────────────────────
  if (resource.key === 'tasks') {
    return {
      _id: doc._id,
      id: doc.taskId || `TSK-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.title || '—',
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Expense ────────────────────────────────────────────────────────────────
  if (resource.key === 'expenses') {
    return {
      _id: doc._id,
      id: doc.expId || `EXP-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.category || '—'} — ${doc.tech || doc.techName || '—'} (₹${doc.amount || 0})`,
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Asset ──────────────────────────────────────────────────────────────────
  if (resource.key === 'assets') {
    return {
      _id: doc._id,
      id: doc.assetId || `AST-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  if (resource.key === 'inventory') {
    return {
      _id: doc._id,
      id: doc.sku || `INV-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Supplier ───────────────────────────────────────────────────────────────
  if (resource.key === 'suppliers') {
    return {
      _id: doc._id,
      id: doc.supplierId || `SUP-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Customer Type ──────────────────────────────────────────────────────────
  if (resource.key === 'customer-types') {
    return {
      _id: doc._id,
      id: doc.typeId || `CT-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Lead Source ────────────────────────────────────────────────────────────
  if (resource.key === 'lead-sources') {
    return {
      _id: doc._id,
      id: doc.sourceId || `LS-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Performance ────────────────────────────────────────────────────────────
  if (resource.key === 'performance') {
    return {
      _id: doc._id,
      id: doc.perfId || `PRF-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.techName || 'Unknown'} — ${doc.period || ''}`,
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Advance/Incentive ──────────────────────────────────────────────────────
  if (resource.key === 'advance-incentive') {
    return {
      _id: doc._id,
      id: doc.recordId || `ADV-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.techName || 'Unknown'} — ${doc.type} ₹${doc.amount}`,
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Ad Campaign ────────────────────────────────────────────────────────────
  if (resource.key === 'ad-campaigns') {
    return {
      _id: doc._id,
      id: doc.adCampaignId || `ADC-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.name || '—',
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Review ─────────────────────────────────────────────────────────────────
  if (resource.key === 'reviews') {
    return {
      _id: doc._id,
      id: doc.reviewId || `REV-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.customerName || 'Unknown'} — ${'★'.repeat(doc.rating || 0)}`,
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Post ───────────────────────────────────────────────────────────────────
  if (resource.key === 'posts') {
    return {
      _id: doc._id,
      id: doc.postId || `PST-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.title || '—',
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── AC Error Code ──────────────────────────────────────────────────────────
  if (resource.key === 'error-codes') {
    return {
      _id: doc._id,
      id: doc.codeId || `EC-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `[${doc.code || '?'}] ${(doc.description || '').slice(0, 60) || '—'}`,
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Content Library ────────────────────────────────────────────────────────
  if (resource.key === 'content-library') {
    return {
      _id: doc._id,
      id: doc.contentId || `CON-${String(doc._id).slice(-6).toUpperCase()}`,
      name: doc.title || '—',
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── WhatsApp Message ───────────────────────────────────────────────────────
  if (resource.key === 'whatsapp') {
    return {
      _id: doc._id,
      id: doc.msgId || `WA-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.recipientName || doc.recipient || 'Unknown'} (${doc.phone || '—'})`,
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Gas Purchase ───────────────────────────────────────────────────────────
  if (resource.key === 'gas-purchases') {
    return {
      _id: doc._id,
      id: doc.purchaseId || `PUR-${String(doc._id).slice(-6).toUpperCase()}`,
      name: `${doc.supplier || 'Unknown supplier'} — ${doc.gasType || '—'} (${doc.kgPurchased || 0} kg)`,
      module: resource.module,
      resourceKey: resource.key,
      by: doc.deletedBy ?? 'Admin',
      date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
      rawDate: doc.deletedAt ?? doc.createdAt
    };
  }

  // ── Generic fallback ───────────────────────────────────────────────────────
  
let id = resource.key === 'customers' ? doc.customerId : null;
id = id ?? doc.invoiceNo ?? doc.quotationId ?? doc.invoiceId ?? doc.ticketId ?? doc.leadId ?? doc.contractId;
if (!id && resource.key === 'amc') id = doc.amcId || 'AMC-' + String(doc._id).slice(-6).toUpperCase();
else if (!id && resource.key === 'jobs') id = doc.jobId || 'JOB-' + String(doc._id).slice(-6).toUpperCase();
else if (!id && resource.key === 'purchase-orders') id = doc.poId || 'PO-' + String(doc._id).slice(-6).toUpperCase();
else if (!id && resource.key === 'notices') id = doc.noticeId || 'NOT-' + String(doc._id).slice(-6).toUpperCase();
else if (!id && resource.key === 'warranty') id = doc.warrantyId || 'WR-' + String(doc._id).slice(-6).toUpperCase();
else if (!id && resource.key === 'gaslog') id = doc.logId || 'GAS-' + String(doc._id).slice(-6).toUpperCase();
else if (!id && resource.key === 'projects') id = doc.projectId || 'PRJ-' + String(doc._id).slice(-6).toUpperCase();
else if (!id && resource.key === 'recruitment') id = doc.appId || 'REC-' + String(doc._id).slice(-6).toUpperCase();
id = id ?? doc._id; 
  const customerName = typeof doc.customer === 'object' && doc.customer !== null ? doc.customer.name : doc.customerName ?? doc.customer ?? null;
  const name = customerName ?? doc.name ?? doc.title ?? doc.issue ?? doc.subject ?? doc.company ?? '—';
  return {
    _id: doc._id,
    id,
    name,
    module: resource.module,
    resourceKey: resource.key,
    by: doc.deletedBy ?? 'Admin',
    date: doc.deletedAt ?fmtDateDMY(new Date(doc.deletedAt)) : '—',
    rawDate: doc.deletedAt ?? doc.createdAt
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Badge({
  module
}) {
  const s = MODULE_STYLE[module] || {
    bg: '#F1EFE8',
    color: '#5F5E5A'
  };
  return <span style={{
    background: s.bg,
    color: s.color
  }} className="ap-deleted-items-page-1">
      {module}
    </span>;
}
function Checkbox({
  checked,
  indeterminate = false,
  onChange
}) {
  return <input type="checkbox" checked={checked} ref={el => {
    if (el) el.indeterminate = indeterminate;
  }} onChange={e => onChange(e.target.checked)} className="ap-deleted-items-page-2" />;
}
function Toast({
  msg
}) {
  if (!msg) return null;
  return <div className="ap-deleted-items-page-3">
      {msg}
    </div>;
}
function ConfirmModal({
  modal,
  onConfirm,
  onCancel
}) {
  if (!modal) return null;
  return <div className="ap-deleted-items-page-4">
      <div className="ap-deleted-items-page-5">
        <div className="ap-deleted-items-page-6">
          Permanently delete {modal.count} item{modal.count > 1 ? 's' : ''}?
        </div>
        <div className="ap-deleted-items-page-7">
          This cannot be undone. The item{modal.count > 1 ? 's' : ''} will be removed from the database forever.
        </div>
        <div className="ap-deleted-items-page-8">
          <button onClick={onCancel} className="ap-deleted-items-page-9">Cancel</button>
          <button onClick={onConfirm} className="ap-deleted-items-page-10">Yes, delete permanently</button>
        </div>
      </div>
    </div>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const DeletedItemsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const [searchQ, setSearchQ] = useState('');
  const [modFilter, setModFilter] = useState('');
  const [toast, setToast] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled(RESOURCES.map(r => fetchDeleted(r.key).then(docs => docs.map(d => normalise(d, r))).catch(() => [])));
      const all = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value).sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
      setData(all);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadAll();
  }, [loadAll]);
  const filtered = useMemo(() => data.filter(r => {
    if (searchQ && !String(r.id).toLowerCase().includes(searchQ.toLowerCase()) && !r.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
    if (modFilter && r.module !== modFilter) return false;
    return true;
  }), [data, searchQ, modFilter]);
  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };
  const setItemLoading = (id, on) => setActionLoading(prev => {
    const next = new Set(prev);
    on ? next.add(id) : next.delete(id);
    return next;
  });
  const toggleRow = (id, checked) => setSelected(prev => {
    const next = new Set(prev);
    checked ? next.add(id) : next.delete(id);
    return next;
  });
  const toggleAll = checked => setSelected(checked ? new Set(filtered.map(r => r._id)) : new Set());
  const allChecked = filtered.length > 0 && filtered.every(r => selected.has(r._id));
  const someChecked = filtered.some(r => selected.has(r._id));
  const selectedInView = filtered.filter(r => selected.has(r._id)).length;
  const recoverOne = async row => {
    setItemLoading(row._id, true);
    try {
      await restoreItem(row.resourceKey, row._id);
      setData(prev => prev.filter(r => r._id !== row._id));
      setSelected(prev => {
        const n = new Set(prev);
        n.delete(row._id);
        return n;
      });
      showToast(`${row.name} restored`);
    } catch {
      showToast('Restore failed. Try again.');
    } finally {
      setItemLoading(row._id, false);
    }
  };
  const deleteOne = row => setConfirmModal({
    rows: [row],
    count: 1
  });
  const confirmDelete = async () => {
    const {
      rows
    } = confirmModal;
    setConfirmModal(null);
    for (const row of rows) {
      setItemLoading(row._id, true);
      try {
        await hardDeleteItem(row.resourceKey, row._id);
        setData(prev => prev.filter(r => r._id !== row._id));
        setSelected(prev => {
          const n = new Set(prev);
          n.delete(row._id);
          return n;
        });
      } catch {
        showToast(`Failed to delete ${row.name}`);
      } finally {
        setItemLoading(row._id, false);
      }
    }
    showToast(`${rows.length} item${rows.length > 1 ? 's' : ''} permanently deleted`);
  };
  const bulkRecover = async () => {
    const rows = filtered.filter(r => selected.has(r._id));
    if (!rows.length) return;
    let ok = 0;
    for (const row of rows) {
      try {
        await restoreItem(row.resourceKey, row._id);
        setData(prev => prev.filter(r => r._id !== row._id));
        ok++;
      } catch {/* continue */}
    }
    setSelected(new Set());
    showToast(`${ok} item${ok > 1 ? 's' : ''} recovered`);
  };
  const bulkDelete = () => {
    const rows = filtered.filter(r => selected.has(r._id));
    if (rows.length) setConfirmModal({
      rows,
      count: rows.length
    });
  };
  const S = {
    page: {
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      padding: '24px',
      color: "var(--x1a1a1a)",
      minHeight: '100vh',
      background: "var(--xf7f6f3)"
    },
    card: {
      background: "var(--white)",
      borderRadius: 14,
      border: '0.5px solid #e2e0db',
      overflow: 'hidden'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20
    },
    h1: {
      fontSize: 20,
      fontWeight: 700,
      color: "var(--text-h1)",
      margin: 0
    },
    sub: {
      fontSize: 13,
      color: "var(--text-faint)",
      marginTop: 3
    },
    toolbar: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      alignItems: 'center',
      padding: '14px 16px',
      borderBottom: '0.5px solid #ece9e4'
    },
    input: {
      padding: '7px 11px',
      fontSize: 13,
      borderRadius: 8,
      border: '0.5px solid #d8d5cf',
      background: "var(--xfafaf9)",
      color: "var(--text-h1)",
      flex: 1,
      minWidth: 180,
      outline: 'none'
    },
    select: {
      padding: '7px 10px',
      fontSize: 13,
      borderRadius: 8,
      border: '0.5px solid #d8d5cf',
      background: "var(--xfafaf9)",
      color: "var(--text-h1)",
      outline: 'none',
      cursor: 'pointer'
    },
    th: {
      padding: '10px 14px',
      textAlign: 'left',
      fontSize: 11,
      fontWeight: 600,
      color: "var(--x999)",
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      background: "var(--xfafaf9)",
      borderBottom: '0.5px solid #ece9e4',
      whiteSpace: 'nowrap'
    },
    td: {
      padding: '11px 14px',
      fontSize: 13,
      color: "var(--text-h1)",
      borderBottom: '0.5px solid #f0ede8',
      verticalAlign: 'middle'
    },
    btnRecover: {
      padding: '5px 11px',
      fontSize: 12,
      borderRadius: 7,
      border: '0.5px solid #0F6E56',
      color: "var(--x0f6e56)",
      background: 'transparent',
      cursor: 'pointer',
      fontWeight: 600
    },
    btnDel: {
      padding: '5px 11px',
      fontSize: 12,
      borderRadius: 7,
      border: '0.5px solid #A32D2D',
      color: "var(--xa32d2d)",
      background: 'transparent',
      cursor: 'pointer',
      fontWeight: 600
    },
    btnBulkRecover: {
      padding: '8px 15px',
      fontSize: 13,
      borderRadius: 8,
      border: 'none',
      color: "var(--white)",
      background: "var(--xe8520a)",
      cursor: 'pointer',
      fontWeight: 500,
      opacity: selectedInView > 0 ? 1 : 0.4
    },
    btnBulkDel: {
      padding: '8px 15px',
      fontSize: 13,
      borderRadius: 8,
      border: '0.5px solid #A32D2D',
      color: "var(--white)",
      background: "var(--xa32d2d)",
      cursor: 'pointer',
      fontWeight: 500,
      opacity: selectedInView > 0 ? 1 : 0.4
    },
    btnRefresh: {
      padding: '8px 12px',
      fontSize: 13,
      borderRadius: 8,
      border: '0.5px solid #d8d5cf',
      color: "var(--text-muted)",
      background: 'transparent',
      cursor: 'pointer'
    }
  };
  return <div className="ap-deleted-items-page-11">
      <div className="ap-deleted-items-page-12">
        <div>
          <div className="ap-deleted-items-page-13">🗑 Deleted Items</div>
          <div className="ap-deleted-items-page-14">{loading ? 'Loading…' : `${filtered.length} of ${data.length} deleted items`}</div>
        </div>
        <div className="ap-deleted-items-page-15">
          <button onClick={loadAll} className="ap-deleted-items-page-16">↻ Refresh</button>
          <button style={{
          opacity: selectedInView > 0 ? "1" : "0.4"
        }} disabled={selectedInView === 0} onClick={bulkRecover} className="ap-deleted-items-page-17">
            Recover{selectedInView > 0 ? ` (${selectedInView})` : ' selected'}
          </button>
          <button style={{
          opacity: selectedInView > 0 ? "1" : "0.4"
        }} disabled={selectedInView === 0} onClick={bulkDelete} className="ap-deleted-items-page-18">
            Delete permanently{selectedInView > 0 ? ` (${selectedInView})` : ''}
          </button>
        </div>
      </div>

      <div className="ap-deleted-items-page-19">
        <div className="ap-deleted-items-page-20">
          <input type="text" placeholder="Search by name or ID…" value={searchQ} onChange={e => setSearchQ(e.target.value)} className="ap-deleted-items-page-21" />
          <select value={modFilter} onChange={e => setModFilter(e.target.value)} className="ap-deleted-items-page-22">
            <option value="">All modules</option>
            {ALL_MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="ap-deleted-items-page-23">{filtered.length} of {data.length} items</span>
        </div>

        <div className="ap-deleted-items-page-24">
          <table className="ap-deleted-items-page-25">
            <colgroup>
              <col className="ap-deleted-items-page-26" /><col className="ap-deleted-items-page-27" /><col className="ap-deleted-items-page-28" />
              <col className="ap-deleted-items-page-29" /><col className="ap-deleted-items-page-30" /><col className="ap-deleted-items-page-31" /><col className="ap-deleted-items-page-32" />
            </colgroup>
            <thead>
              <tr>
                <th className="ap-deleted-items-page-33"><Checkbox checked={allChecked} indeterminate={!allChecked && someChecked} onChange={toggleAll} /></th>
                <th className="ap-deleted-items-page-33">ID</th>
                <th className="ap-deleted-items-page-33">Name / Title</th>
                <th className="ap-deleted-items-page-33">Module</th>
                <th className="ap-deleted-items-page-33">Deleted by</th>
                <th className="ap-deleted-items-page-33">Deleted on</th>
                <th className="ap-deleted-items-page-34">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="ap-deleted-items-page-35">Loading deleted items…</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="ap-deleted-items-page-36">
                  {searchQ || modFilter ? 'No items match your filters.' : 'No deleted items found.'}
                </td></tr> : filtered.map(r => {
              const busy = actionLoading.has(r._id);
              return <tr key={r._id} style={{
                background: selected.has(r._id) ? "var(--xfdf9f6)" : "transparent",
                opacity: busy ? "0.5" : "1"
              }}>
                    <td className="ap-deleted-items-page-37"><Checkbox checked={selected.has(r._id)} onChange={v => toggleRow(r._id, v)} /></td>
                    <td className="ap-deleted-items-page-38" data-label="ID">{r.id}</td>
                    <td className="ap-deleted-items-page-37" data-label="Name / Title">
                      <div className="ap-deleted-items-page-39">{r.name}</div>
                      {/* <div className="ap-deleted-items-page-40">{r.module}</div> */}
                    </td>
                    <td className="ap-deleted-items-page-37" data-label="Module"><Badge module={r.module} /></td>
                    <td className="ap-deleted-items-page-41" data-label="Deleted by">{r.by}</td>
                    <td className="ap-deleted-items-page-42" data-label="Deleted on">{r.date}</td>
                    <td className="ap-deleted-items-page-43">
                      <div className="ap-deleted-items-page-44">
                        <button style={{
                      opacity: busy ? "0.5" : "1"
                    }} disabled={busy} onClick={() => recoverOne(r)} className="ap-deleted-items-page-45">
                          {busy ? '…' : 'Recover'}
                        </button>
                        <button style={{
                      opacity: busy ? "0.5" : "1"
                    }} disabled={busy} onClick={() => deleteOne(r)} className="ap-deleted-items-page-46">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal modal={confirmModal} onConfirm={confirmDelete} onCancel={() => setConfirmModal(null)} />
      <Toast msg={toast} />
    </div>;
};
export default DeletedItemsPage;