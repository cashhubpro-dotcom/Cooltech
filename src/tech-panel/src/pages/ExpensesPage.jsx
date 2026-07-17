import { useState, useRef, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/token';
import { EXP_STATUS } from '../constants/statusMaps';
import { SBadge, Modal, Toast } from '../components/ui/Components';
import { techExpensesApi, techJobsApi, fileUrl } from '../services/technicianPortalApi';
// Adjust this import path to wherever technicianPortalApi.js actually lives
// in your tree. techExpensesApi, techJobsApi, and fileUrl are all exported
// from that single file now — no separate technicianExpensesApi.js needed.

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND-CONNECTED. No more local mock state — every create/edit/delete
// goes to routes/technicianExpense.routes.js, and the list is refetched
// after every mutation so the server (expenseId generation, technician
// populate, status guard) stays the single source of truth.
//
// Category list matches the REAL Expense schema enum:
//   ['Fuel', 'Tools', 'Parts', 'Miscellaneous', 'Training', 'Office', 'Other']
// (earlier draft used 'Food'/'Misc', which aren't valid and would 400.)
// ─────────────────────────────────────────────────────────────────────────────

const CAT_META = {
  Fuel: {
    icon: '⛽',
    dot: "var(--info)",
    bg: "var(--info-bg)",
    text: "var(--info-text)"
  },
  Tools: {
    icon: '🔧',
    dot: "var(--success)",
    bg: "var(--success-bg)",
    text: "var(--success-text)"
  },
  Parts: {
    icon: '🔩',
    dot: "var(--purple)",
    bg: "var(--purple-bg)",
    text: "var(--purple-text)"
  },
  Miscellaneous: {
    icon: '📦',
    dot: "var(--muted)",
    bg: "var(--bg)",
    text: "var(--h2)"
  },
  Training: {
    icon: '📚',
    dot: "var(--brand)",
    bg: "var(--brand-l)",
    text: "var(--brand-d)"
  },
  Office: {
    icon: '🗂️',
    dot: "var(--info)",
    bg: "var(--info-bg)",
    text: "var(--info-text)"
  },
  Other: {
    icon: '❓',
    dot: "var(--faint)",
    bg: "var(--bg)",
    text: "var(--muted)"
  }
};
const CATEGORY_OPTIONS = Object.keys(CAT_META);
const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];
const inputStyle = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  fontSize: 13,
  fontFamily: FONTS.sans,
  color: COLORS.body,
  boxSizing: 'border-box',
  background: COLORS.white
};
const fieldLabelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: COLORS.muted,
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '.03em'
};
const Field = ({
  label,
  children
}) => <div className="tp-expenses-page-1">
    <label className="tp-expenses-page-2">{label}</label>
    {children}
  </div>;
const ghostBtn = {
  padding: '8px 16px',
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.white,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  fontFamily: FONTS.sans,
  color: COLORS.body
};
const primaryBtn = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: COLORS.brand,
  color: "var(--white)",
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
  fontFamily: FONTS.sans
};
const dangerBtn = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  background: "var(--danger-text)",
  color: "var(--white)",
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
  fontFamily: FONTS.sans
};
const fmtDate = d => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
// <input type="date"> needs yyyy-mm-dd
const toDateInput = d => {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
};

// ─── KPI card ──────────────────────────────────────────────────────────────
const KCard = ({
  label,
  value,
  sub,
  icon,
  iconBg,
  color
}) => <div className="stat-card afu tp-expenses-page-3">
    <div className="tp-expenses-page-4">
      <div className="stat-label tp-expenses-page-5">{label}</div>
      <div className="stat-icon tp-expenses-page-6" style={{
      background: iconBg
    }}>{icon}</div>
    </div>
    <div className="stat-value tp-expenses-page-7" style={{
    color
  }}>{value}</div>
    {sub && <div className="tp-expenses-page-8">{sub}</div>}
  </div>;
const CatTag = ({
  cat
}) => {
  const c = CAT_META[cat] || CAT_META.Other;
  return <span style={{
    background: c.bg,
    color: c.text
  }} className="tp-expenses-page-9">
      {c.icon} {cat}
    </span>;
};

// ─── Row actions kebab menu ─────────────────────────────────────────────────
const ActionsMenu = ({
  canEdit,
  onView,
  onEdit,
  onDelete
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const item = (label, icon, onClick, danger) => <button onClick={e => {
    e.stopPropagation();
    setOpen(false);
    onClick();
  }} style={{
    color: danger ? '#DC2626' : COLORS.body
  }} onMouseEnter={e => e.currentTarget.style.background = danger ? '#FEF2F2' : '#F5F5F5'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} className="tp-expenses-page-10">
      <span className="tp-expenses-page-11">{icon}</span>{label}
    </button>;
  return <div ref={ref} className="tp-expenses-page-12">
      <button onClick={e => {
      e.stopPropagation();
      setOpen(o => !o);
    }} aria-label="Row actions" className="tp-expenses-page-13">⋮</button>
      {open && <div className="tp-expenses-page-14">
          {item('View', '👁', onView)}
          {canEdit && item('Edit', '✎', onEdit)}
          {canEdit && item('Delete', '🗑', onDelete, true)}
        </div>}
    </div>;
};

// ─── Receipt upload box — now does a real upload and stores the server URL ─
const ReceiptUpload = ({
  receipt,
  fileName,
  uploading,
  onFileChange,
  onClear
}) => {
  const inputRef = useRef(null);
  return <div>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => {
      const file = e.target.files?.[0];
      if (file) onFileChange(file);
      e.target.value = '';
    }} className="tp-expenses-page-15" />
      <div onClick={() => !uploading && inputRef.current?.click()} style={{
      cursor: uploading ? "default" : "pointer"
    }} className="tp-expenses-page-16">
        {uploading ? <span>⏳ Uploading…</span> : receipt && fileName ? <span style={{
        color: COLORS.body
      }} className="tp-expenses-page-17">📎 {fileName} — click to replace</span> : receipt ? <span style={{
        color: COLORS.body
      }} className="tp-expenses-page-18">📎 Receipt on file — click to replace</span> : <span>📤 Click to upload receipt (JPG, PNG, PDF)</span>}
      </div>
      {receipt && !uploading && <div className="tp-expenses-page-19">
          <button type="button" onClick={onClear} className="tp-expenses-page-20">Remove receipt</button>
        </div>}
    </div>;
};

// ─── View modal ──────────────────────────────────────────────────────────────
const ViewModal = ({
  expense,
  onClose
}) => {
  const row = (label, value) => <div className="tp-expenses-page-21">
      <span className="tp-expenses-page-22">{label}</span>
      <span className="tp-expenses-page-23">{value ?? '—'}</span>
    </div>;
  return <Modal open onClose={onClose} title={`Claim ${expense.expenseId}`} footer={<button style={{
    color: COLORS.body
  }} onClick={onClose} className="tp-expenses-page-24">Close</button>}>
      <div>
        {row('Category', <CatTag cat={expense.category} />)}
        {row('Description', expense.description)}
        {row('Amount', <span className="tp-expenses-page-25">₹{expense.amount.toLocaleString()}</span>)}
        {row('Date', fmtDate(expense.date))}
        {row('Customer Name', expense.customerName || expense.job?.customerName || '—')}
        {row('Job ID', expense.job?.jobId || '—')}
        {row('Receipt', expense.receipt ? '📎 Attached' : <span className="tp-expenses-page-26">✗ Not attached</span>)}
        {expense.receipt && row('Receipt Link', expense.receiptUrl ? <a href={fileUrl(expense.receiptUrl)} target="_blank" rel="noreferrer" className="tp-expenses-page-27">View receipt ↗</a> : <span className="tp-expenses-page-28">No file on record</span>)}
        {row('Status', <SBadge s={expense.status} map={EXP_STATUS} />)}
        {row('Notes', expense.notes || 'No additional notes')}
        {row('Submitted', fmtDate(expense.createdAt || expense.date))}
      </div>
      {expense.status !== 'pending' && <div className="tp-expenses-page-29">
          This claim has been {expense.status} and can no longer be edited or withdrawn.
        </div>}
    </Modal>;
};

// ─── Edit modal (only ever opened for pending claims) ───────────────────────
const EditModal = ({
  expense,
  jobs,
  onClose,
  onSaved
}) => {
  const [form, setForm] = useState({
    category: expense.category,
    description: expense.description,
    amount: expense.amount,
    date: toDateInput(expense.date),
    customerName: expense.customerName || expense.job?.customerName || '',
    jobId: expense.job?._id || '',
    receipt: expense.receipt,
    receiptFileName: '',
    receiptUrl: expense.receiptUrl || '',
    notes: expense.notes || ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const handleFile = async file => {
    setUploading(true);
    setError('');
    try {
      const res = await techExpensesApi.uploadReceipt(file);
      set('receipt', true);
      set('receiptFileName', file.name);
      set('receiptUrl', res.url);
    } catch (err) {
      setError(err?.message || 'Receipt upload failed.');
    } finally {
      setUploading(false);
    }
  };
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await techExpensesApi.update(expense._id, {
        category: form.category,
        description: form.description,
        amount: Number(form.amount) || 0,
        date: form.date,
        customerName: form.customerName,
        job: form.jobId || null,
        receipt: form.receipt,
        receiptUrl: form.receiptUrl,
        notes: form.notes
      });
      onSaved(updated);
    } catch (err) {
      setError(err?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };
  return <Modal open onClose={onClose} title={`Edit ${expense.expenseId}`} footer={<div className="tp-expenses-page-30">
          <button style={{
      opacity: saving || uploading ? "0.7" : "1"
    }} disabled={saving || uploading} onClick={handleSave} className="tp-expenses-page-31">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button onClick={onClose} className="tp-expenses-page-24">Cancel</button>
        </div>}>
      <div className="grid-2">
        <Field label="Category">
          <select style={{
          color: COLORS.body
        }} value={form.category} onChange={e => set('category', e.target.value)} className="tp-expenses-page-32">
            {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Amount (₹)">
          <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className="tp-expenses-page-32" />
        </Field>
      </div>
      <Field label="Description">
        <input value={form.description} onChange={e => set('description', e.target.value)} className="tp-expenses-page-32" />
      </Field>
      <div className="grid-2">
        <Field label="Date">
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="tp-expenses-page-32" />
        </Field>
        <Field label="Customer Name">
          <input placeholder="e.g. Ramesh Kumar" value={form.customerName} onChange={e => set('customerName', e.target.value)} className="tp-expenses-page-32" />
        </Field>
      </div>
      <Field label="Linked Job (optional)">
        <select value={form.jobId} onChange={e => {
        const jobId = e.target.value;
        const job = jobs.find(j => j._id === jobId);
        set('jobId', jobId);
        if (job?.customerName && !form.customerName) set('customerName', job.customerName);
      }} className="tp-expenses-page-32">
          <option value="">— No linked job —</option>
          {jobs.map(j => <option key={j._id} value={j._id}>{j.jobId} · {j.customerName || 'Unknown customer'}</option>)}
        </select>
      </Field>
      <Field label="Receipt">
        <ReceiptUpload receipt={form.receipt} fileName={form.receiptFileName} uploading={uploading} onFileChange={handleFile} onClear={() => setForm(f => ({
        ...f,
        receipt: false,
        receiptFileName: '',
        receiptUrl: ''
      }))} />
      </Field>
      <Field label="Notes (optional)">
        <textarea style={{
        color: COLORS.body
      }} value={form.notes} onChange={e => set('notes', e.target.value)} className="tp-expenses-page-33" />
      </Field>
      {error && <div className="tp-expenses-page-34">{error}</div>}
    </Modal>;
};

// ─── Delete confirm modal ────────────────────────────────────────────────────
const DeleteModal = ({
  expense,
  onClose,
  onDeleted
}) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await techExpensesApi.remove(expense._id);
      onDeleted(expense._id);
    } catch (err) {
      setError(err?.message || 'Failed to delete.');
      setDeleting(false);
    }
  };
  return <Modal open onClose={onClose} title="Delete claim" footer={<div className="tp-expenses-page-35">
          <button style={{
      opacity: deleting ? "0.7" : "1"
    }} disabled={deleting} onClick={handleDelete} className="tp-expenses-page-36">
            {deleting ? 'Deleting…' : 'Delete claim'}
          </button>
          <button onClick={onClose} className="tp-expenses-page-24">Cancel</button>
        </div>}>
      <p style={{
      color: COLORS.body
    }} className="tp-expenses-page-37">
        Delete <strong>{expense.expenseId}</strong> ({expense.category}, ₹{expense.amount.toLocaleString()})? This cannot be undone.
      </p>
      {error && <div className="tp-expenses-page-38">{error}</div>}
    </Modal>;
};

// ─── New Claim modal ─────────────────────────────────────────────────────────
const NewClaimModal = ({
  jobs,
  onClose,
  onCreated
}) => {
  const [form, setForm] = useState({
    category: 'Fuel',
    description: '',
    amount: '',
    date: toDateInput(new Date()),
    customerName: '',
    jobId: '',
    receipt: false,
    receiptFileName: '',
    receiptUrl: '',
    notes: ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const handleFile = async file => {
    setUploading(true);
    setError('');
    try {
      const res = await techExpensesApi.uploadReceipt(file);
      set('receipt', true);
      set('receiptFileName', file.name);
      set('receiptUrl', res.url);
    } catch (err) {
      setError(err?.message || 'Receipt upload failed.');
    } finally {
      setUploading(false);
    }
  };
  const handleSubmit = async () => {
    if (!form.description.trim() || !form.amount) {
      setError('Description and amount are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await techExpensesApi.create({
        category: form.category,
        description: form.description,
        amount: Number(form.amount) || 0,
        date: form.date,
        customerName: form.customerName,
        job: form.jobId || null,
        receipt: form.receipt,
        receiptUrl: form.receiptUrl,
        notes: form.notes
      });
      onCreated(created);
    } catch (err) {
      setError(err?.message || 'Failed to submit claim.');
    } finally {
      setSaving(false);
    }
  };
  return <Modal open onClose={onClose} title="Submit New Expense Claim" footer={<div className="tp-expenses-page-39">
          <button className="btn btn-primary btn-sm" disabled={saving || uploading} onClick={handleSubmit} style={{
      opacity: saving || uploading ? "0.7" : "1"
    }}>
            {saving ? 'Submitting…' : 'Submit Claim'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
        </div>}>
      <div>
        <div className="grid-2">
          <div className="form-field tp-expenses-page-40">
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-field tp-expenses-page-41">
            <label className="form-label">Amount (₹)</label>
            <input className="form-input" type="number" placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </div>
        </div>

        <div className="form-field tp-expenses-page-42">
          <label className="form-label">Description</label>
          <input className="form-input" placeholder="Brief description of the expense…" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        <div className="grid-2">
          <div className="form-field tp-expenses-page-43">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className="form-field tp-expenses-page-44">
            <label className="form-label">Customer Name</label>
            <input className="form-input" placeholder="e.g. Ramesh Kumar" value={form.customerName} onChange={e => set('customerName', e.target.value)} />
          </div>
        </div>

        <div className="form-field tp-expenses-page-45">
          <label className="form-label">Linked Job (optional)</label>
          <select className="form-input" value={form.jobId} onChange={e => {
          const jobId = e.target.value;
          const job = jobs.find(j => j._id === jobId);
          set('jobId', jobId);
          if (job?.customerName && !form.customerName) set('customerName', job.customerName);
        }}>
            <option value="">— No linked job —</option>
            {jobs.map(j => <option key={j._id} value={j._id}>{j.jobId} · {j.customerName || 'Unknown customer'}</option>)}
          </select>
        </div>

        <div className="form-field tp-expenses-page-46">
          <label className="form-label">Receipt</label>
          <ReceiptUpload receipt={form.receipt} fileName={form.receiptFileName} uploading={uploading} onFileChange={handleFile} onClear={() => setForm(f => ({
          ...f,
          receipt: false,
          receiptFileName: '',
          receiptUrl: ''
        }))} />
        </div>

        {!form.receipt && <div className="tp-expenses-page-47">
            ⚠️ Claims without receipts may not be approved. Please attach a receipt when possible.
          </div>}
        {error && <div className="tp-expenses-page-48">{error}</div>}
      </div>
    </Modal>;
};

// ─── Main page ───────────────────────────────────────────────────────────────
const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [rowModal, setRowModal] = useState(null); // { type: 'view'|'edit'|'delete', expense }
  const [toast, setToast] = useState(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [catFilter, setCatFilter] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const loadExpenses = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await techExpensesApi.list();
      setExpenses(res.data ?? res ?? []);
    } catch (err) {
      setLoadError(err?.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  };
  const loadJobs = async () => {
    try {
      const res = await techJobsApi.list();
      setJobs(res.data ?? res ?? []);
    } catch {
      setJobs([]); // job dropdown is a nice-to-have — don't block the page on it
    }
  };
  useEffect(() => {
    loadExpenses();
    loadJobs();
  }, []);
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const byCat = CATEGORY_OPTIONS.map(c => ({
    cat: c,
    total: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0),
    count: expenses.filter(e => e.category === c).length
  })).filter(x => x.total > 0);
  const maxCatTotal = Math.max(...byCat.map(c => c.total), 1);
  const filtered = expenses.filter(e => !statusFilter || e.status === statusFilter).filter(e => !catFilter || e.category === catFilter).filter(e => {
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return (e.description || '').toLowerCase().includes(t) || (e.expenseId || '').toLowerCase().includes(t) || (e.category || '').toLowerCase().includes(t) || (e.job?.jobId || '').toLowerCase().includes(t) || (e.customerName || '').toLowerCase().includes(t);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const paginated = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);
  const handleCreated = created => {
    setExpenses(prev => [created, ...prev]);
    setShowNew(false);
    setToast('Expense claim submitted for approval!');
  };
  const handleSaved = updated => {
    setExpenses(prev => prev.map(e => e._id === updated._id ? updated : e));
    setRowModal(null);
    setToast('Claim updated.');
  };
  const handleDeleted = id => {
    setExpenses(prev => prev.filter(e => e._id !== id));
    setRowModal(null);
    setToast('Claim deleted.');
  };
  return <div>
      <div className="sec-hdr">
        <div>
          <div className="sec-title">Expenses</div>
          <div className="sec-sub">Submit and track your field expense claims</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New Claim</button>
      </div>

      {loadError && <div className="tp-expenses-page-49">
          <span>⚠️ {loadError}</span>
          <button onClick={loadExpenses} style={{
        color: COLORS.body
      }} className="tp-expenses-page-50">Retry</button>
        </div>}

      {/* KPI cards */}
      <div className="tp-expenses-page-51">
        <KCard label="Total Claimed" value={`₹${totalAll.toLocaleString()}`} sub="all time" icon="💸" iconBg={COLORS.brandL} color={COLORS.brand} />
        <KCard label="Approved" value={`₹${totalApproved.toLocaleString()}`} sub="cleared" icon="✅" iconBg="#F0FDF4" color="#16A34A" />
        <KCard label="Pending" value={`₹${totalPending.toLocaleString()}`} sub="awaiting review" icon="⏳" iconBg="#FFFBEB" color="#D97706" />
        <KCard label="Total Claims" value={expenses.length} sub="submitted" icon="🧾" iconBg={COLORS.brandL} color={COLORS.brand} />
      </div>

      <div className="card afu1 tp-expenses-page-52">

        {/* Toolbar */}
        <div className="tp-expenses-page-53">
          <input style={{
          color: COLORS.body
        }} placeholder="Search by description, ID, job, customer…" value={q} onChange={e => {
          setQ(e.target.value);
          setPage(1);
        }} className="tp-expenses-page-54" />
          <select style={{
          color: COLORS.body
        }} value={statusFilter} onChange={e => {
          setStatusFilter(e.target.value);
          setPage(1);
        }} className="tp-expenses-page-55">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          {(q || statusFilter || catFilter) && <button onClick={() => {
          setQ('');
          setStatusFilter('');
          setCatFilter(null);
          setPage(1);
        }} style={{
          color: COLORS.body
        }} className="tp-expenses-page-56">✕ Clear filters</button>}
        </div>

        {/* By Category summary */}
        {byCat.length > 0 && <div className="tp-expenses-page-57">
            <div className="tp-expenses-page-58">
              <span className="tp-expenses-page-59">By Category</span>
              <span className="tp-expenses-page-60">
                Total approved:&nbsp;<strong className="tp-expenses-page-61">₹{totalApproved.toLocaleString()}</strong>
              </span>
            </div>
            <div style={{
          gridTemplateColumns: `repeat(${byCat.length}, 1fr)`
        }} className="tp-expenses-page-62">
              {byCat.map(({
            cat,
            total,
            count
          }) => {
            const c = CAT_META[cat];
            const isActive = catFilter === cat;
            return <div key={cat} onClick={() => {
              setCatFilter(isActive ? null : cat);
              setPage(1);
            }} style={{
              background: isActive ? c.bg : COLORS.white,
              border: `1px solid ${isActive ? c.dot + '55' : COLORS.border}`
            }} className="tp-expenses-page-63">
                    <div className="tp-expenses-page-64">
                      <span style={{
                  background: c.dot
                }} className="tp-expenses-page-65" />
                      <span style={{
                  color: isActive ? c.text : COLORS.body
                }} className="tp-expenses-page-66">{cat}</span>
                    </div>
                    <div className="tp-expenses-page-67">
                      <div style={{
                  width: `${total / maxCatTotal * 100}%`,
                  background: c.dot
                }} className="tp-expenses-page-68" />
                    </div>
                    <div className="tp-expenses-page-69">
                      <span className="tp-expenses-page-70">{count} claim{count > 1 ? 's' : ''}</span>
                      <span style={{
                  color: isActive ? c.text : COLORS.h1
                }} className="tp-expenses-page-71">₹{total.toLocaleString()}</span>
                    </div>
                  </div>;
          })}
            </div>
          </div>}

        {/* Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{['Exp ID', 'Category', 'Description', 'Date', 'Job ID', 'Receipt', 'Amount', 'Status', ''].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="tp-expenses-page-72">Loading expenses…</td></tr>}
              {!loading && paginated.length === 0 && <tr><td colSpan={9} className="tp-expenses-page-73">No expenses match your filters.</td></tr>}
              {!loading && paginated.map(exp => <tr key={exp._id}>
                  <td className="tp-expenses-page-74">{exp.expenseId}</td>
                  <td><CatTag cat={exp.category} /></td>
                  <td className="tp-expenses-page-75">{exp.description}</td>
                  <td className="tp-expenses-page-76">{fmtDate(exp.date)}</td>
                  <td className="tp-expenses-page-77">{exp.job?.jobId || '—'}</td>
                  <td className="tp-expenses-page-78">{exp.receipt ? '📎 Yes' : <span className="tp-expenses-page-79">✗ No</span>}</td>
                  <td className="tp-expenses-page-80">₹{exp.amount.toLocaleString()}</td>
                  <td><SBadge s={exp.status} map={EXP_STATUS} /></td>
                  <td className="tp-expenses-page-81">
                    <ActionsMenu canEdit={exp.status === 'pending'} onView={() => setRowModal({
                  type: 'view',
                  expense: exp
                })} onEdit={() => setRowModal({
                  type: 'edit',
                  expense: exp
                })} onDelete={() => setRowModal({
                  type: 'delete',
                  expense: exp
                })} />
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && <div className="tp-expenses-page-82">
            <span className="tp-expenses-page-83">
              Showing {(curPage - 1) * pageSize + 1}–{Math.min(curPage * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="tp-expenses-page-84">
              <button disabled={curPage === 1} onClick={() => setPage(p => p - 1)} style={{
            color: COLORS.body,
            opacity: curPage === 1 ? "0.5" : "1"
          }} className="tp-expenses-page-85">‹ Prev</button>
              <button disabled={curPage === totalPages} onClick={() => setPage(p => p + 1)} style={{
            color: COLORS.body,
            opacity: curPage === totalPages ? "0.5" : "1"
          }} className="tp-expenses-page-86">Next ›</button>
            </div>
          </div>}
      </div>

      {showNew && <NewClaimModal jobs={jobs} onClose={() => setShowNew(false)} onCreated={handleCreated} />}
      {rowModal?.type === 'view' && <ViewModal expense={rowModal.expense} onClose={() => setRowModal(null)} />}
      {rowModal?.type === 'edit' && <EditModal expense={rowModal.expense} jobs={jobs} onClose={() => setRowModal(null)} onSaved={handleSaved} />}
      {rowModal?.type === 'delete' && <DeleteModal expense={rowModal.expense} onClose={() => setRowModal(null)} onDeleted={handleDeleted} />}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>;
};
export default ExpensesPage;