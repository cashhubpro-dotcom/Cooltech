import { useState, useEffect, useRef } from 'react';
import { techsApi, leavesApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, Avatar } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { LEAVE_BALANCE, LEAVE_DATA, LEAVE_STATUS, TECHNICIANS } from '../../data/mockData';

// ─── Column config for export ──────────────────────────────────────────────────
const LEAVE_COLUMNS = [{
  label: 'ID',
  key: 'id',
  width: 12
}, {
  label: 'Technician',
  key: 'tech',
  width: 20
}, {
  label: 'Type',
  key: 'type',
  width: 14
}, {
  label: 'From',
  key: 'from',
  width: 14
}, {
  label: 'To',
  key: 'to',
  width: 14
}, {
  label: 'Days',
  key: 'days',
  width: 8
}, {
  label: 'Reason',
  key: 'reason',
  width: 28
}, {
  label: 'Approved By',
  key: 'approvedBy',
  width: 18
}, {
  label: 'Status',
  key: 'status',
  width: 12,
  format: v => LEAVE_STATUS[v]?.label ?? v
}];

// ─── Date helpers ──────────────────────────────────────────────────────────────
const calcDays = (f, t) => {
  if (!f || !t) return 0;
  const diff = Math.ceil((new Date(t) - new Date(f)) / 86400000) + 1;
  return diff > 0 ? diff : 0;
};

// "Mar 10, 2026" OR "2026-03-10" OR ISO → always "2026-03-10" for <input type="date">
const toISO = raw => {
  if (!raw) return '';
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  // Use UTC to avoid timezone shift
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// For display in table & view modal
const fmtDisplay = raw => {
  if (!raw) return '—';
  const iso = toISO(raw);
  if (!iso) return String(raw);
  const [y, m, d] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[+m - 1]} ${+d}, ${y}`;
};

// ─── Input style ───────────────────────────────────────────────────────────────
const IS = (focused = false) => ({
  width: '100%',
  boxSizing: 'border-box',
  border: `1px solid ${focused ? COLORS.brand : COLORS.border}`,
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 13.5,
  color: COLORS.h1,
  background: COLORS.bg,
  outline: 'none',
  fontFamily: FONTS.sans,
  transition: 'border-color .15s'
});

// ─── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({
  label,
  children
}) => <div className="ap-leave-management-page-1">
    <label className="ap-leave-management-page-2">
      {label}
    </label>
    {children}
  </div>;

// ─── Focus-aware input components ─────────────────────────────────────────────
const FInput = ({
  type = 'text',
  value,
  onChange,
  placeholder
}) => {
  const [f, setF] = useState(false);
  return <input type={type} value={value ?? ''} onChange={onChange} placeholder={placeholder} onFocus={() => setF(true)} onBlur={() => setF(false)} style={IS(f)} />;
};
const FSelect = ({
  value,
  onChange,
  children
}) => {
  const [f, setF] = useState(false);
  return <select value={value ?? ''} onChange={onChange} onFocus={() => setF(true)} onBlur={() => setF(false)} style={{
    ...IS(f)
  }} className="ap-leave-management-page-3">
      {children}
    </select>;
};
const FTextarea = ({
  value,
  onChange,
  placeholder,
  rows = 3
}) => {
  const [f, setF] = useState(false);
  return <textarea value={value ?? ''} onChange={onChange} placeholder={placeholder} rows={rows} onFocus={() => setF(true)} onBlur={() => setF(false)} style={{
    ...IS(f)
  }} className="ap-leave-management-page-4" />;
};

// ─── Button ────────────────────────────────────────────────────────────────────
const Btn = ({
  children,
  onClick,
  variant = 'primary',
  small,
  disabled
}) => {
  const V = {
    primary: {
      background: COLORS.brand,
      color: "var(--white)",
      border: 'none'
    },
    ghost: {
      background: 'transparent',
      color: COLORS.body,
      border: `1px solid ${COLORS.border}`
    },
    success: {
      background: "var(--success-text)",
      color: "var(--white)",
      border: 'none'
    },
    danger: {
      background: "var(--danger-text)",
      color: "var(--white)",
      border: 'none'
    },
    'outline-success': {
      background: "var(--success-bg)",
      color: "var(--success-text)",
      border: '1px solid #BBF7D0'
    },
    'outline-danger': {
      background: "var(--danger-bg)",
      color: "var(--danger-text)",
      border: '1px solid #FECACA'
    },
    'outline-gray': {
      background: COLORS.bg,
      color: COLORS.body,
      border: `1px solid ${COLORS.border}`
    }
  };
  return <button onClick={onClick} disabled={disabled} style={{
    ...V[variant],
    padding: small ? "4px 11px" : "9px 20px",
    fontSize: small ? "11.5px" : "13.5px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? "0.6" : "1"
  }} className="ap-leave-management-page-5">
      {children}
    </button>;
};

// ─── Modal shell ───────────────────────────────────────────────────────────────
const Modal = ({
  show,
  onClose,
  title,
  width = 480,
  children
}) => {
  if (!show) return null;
  return <>
      <div onClick={onClose} className="ap-leave-management-page-6" />
      <div onClick={e => e.stopPropagation()} style={{
      width: `min(96vw,${width}px)`
    }} className="ap-leave-management-page-7">
        <div className="ap-leave-management-page-8">
          <span className="ap-leave-management-page-9">{title}</span>
          <button onClick={onClose} className="ap-leave-management-page-10">×</button>
        </div>
        {children}
      </div>
    </>;
};

// ─── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({
  t
}) => {
  if (!t) return null;
  const bg = {
    success: "var(--success-text)",
    error: "var(--danger-text)",
    info: COLORS.brand
  };
  return <div style={{
    background: bg[t.type] || bg.info
  }} className="ap-leave-management-page-11">
      {t.type === 'success' ? '✓ ' : t.type === 'error' ? '✕ ' : 'ℹ '}{t.msg}
    </div>;
};

// ─── Row ⋯ dropdown ────────────────────────────────────────────────────────────
const ActionMenu = ({
  leave,
  onView,
  onEdit,
  onDelete
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const item = (label, color, cb) => <button key={label} onClick={() => {
    cb();
    setOpen(false);
  }} style={{
    color: color || COLORS.body
  }} onMouseEnter={e => e.currentTarget.style.background = COLORS.bg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} className="ap-leave-management-page-12">{label}</button>;
  return <div ref={ref} className="ap-leave-management-page-13">
      <button onClick={() => setOpen(o => !o)} className="ap-leave-management-page-14">⋯</button>
      {open && <div className="ap-leave-management-page-15">
          {item('👁  View', COLORS.h2, () => onView(leave))}
          {item('✏️  Edit', COLORS.h2, () => onEdit(leave))}
          {item('🗑  Delete', '#DC2626', () => onDelete(leave))}
        </div>}
    </div>;
};

// ─── View Modal ────────────────────────────────────────────────────────────────
const ViewModal = ({
  leave,
  onClose
}) => {
  const SC = {
    approved: "var(--success-text)",
    pending: "var(--warning)",
    rejected: "var(--danger-text)"
  };
  const SBG = {
    approved: "var(--success-bg)",
    pending: "var(--warning-bg)",
    rejected: "var(--danger-bg)"
  };
  const TBG = {
    sick: "var(--brand-light)",
    casual: "var(--info-bg)",
    earned: "var(--success-bg)"
  };
  const TC = {
    sick: "var(--brand-dark)",
    casual: "var(--info-text)",
    earned: "var(--success-text)"
  };
  return <Modal show={!!leave} title="Leave Request Details" onClose={onClose} width={440}>
      {leave && <>
          <div className="ap-leave-management-page-16">
            <Avatar name={leave.tech || leave.technicianName || '?'} size={42} />
            <div>
              <div className="ap-leave-management-page-17">{leave.tech || leave.technicianName}</div>
              <div className="ap-leave-management-page-18">Technician</div>
            </div>
            <span style={{
          background: SBG[leave.status] || '#F3F4F6',
          color: SC[leave.status] || COLORS.body,
          border: `1px solid ${SC[leave.status] || COLORS.border}44`
        }} className="ap-leave-management-page-19">
              {LEAVE_STATUS[leave.status]?.label || leave.status}
            </span>
          </div>

          <div className="ap-leave-management-page-20">
            {[['Leave Type', <span style={{
          background: TBG[leave.type] || '#F3F4F6',
          color: TC[leave.type] || COLORS.body
        }} className="ap-leave-management-page-21">
                  {leave.type}
                </span>], ['Duration', <strong className="ap-leave-management-page-22">{leave.days} day{leave.days > 1 ? 's' : ''}</strong>], ['From', <span className="ap-leave-management-page-23">{fmtDisplay(leave.from)}</span>], ['To', <span className="ap-leave-management-page-24">{fmtDisplay(leave.to)}</span>], ['Reason', leave.reason || '—'], ['Approved By', leave.approvedBy || '—']].map(([k, v]) => <div key={k}>
                <div className="ap-leave-management-page-25">{k}</div>
                <div className="ap-leave-management-page-26">{v}</div>
              </div>)}
          </div>

          <div className="ap-leave-management-page-27">
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
          </div>
        </>}
    </Modal>;
};

// ─── Leave Form — KEY fix: useEffect resets form when `initial` changes ────────
const LeaveForm = ({
  initial,
  technicians,
  onSave,
  onCancel,
  loading
}) => {
  const blank = {
    tech: '',
    type: 'sick',
    from: '',
    to: '',
    reason: ''
  };
  const [form, setForm] = useState(blank);

  // Reset whenever the modal opens with new data (or blank for Apply)
  useEffect(() => {
    if (initial) {
      setForm({
        tech: initial.tech || initial.technicianName || '',
        type: initial.type || 'sick',
        from: toISO(initial.from),
        // ← normalise date format
        to: toISO(initial.to),
        // ← normalise date format
        reason: initial.reason || ''
      });
    } else {
      setForm(blank);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);
  const s = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const days = calcDays(form.from, form.to);
  const handleSave = () => {
    if (!form.tech) return alert('Please select a technician');
    if (!form.from) return alert('Please select a start date');
    if (!form.to) return alert('Please select an end date');
    if (!form.reason) return alert('Please enter a reason');
    onSave({
      ...form,
      days
    });
  };
  return <>
      <Field label="Technician">
        <FSelect value={form.tech} onChange={e => s('tech', e.target.value)}>
          <option value="">Select technician</option>
          {technicians.map(t => <option key={t.id || t._id} value={t.name}>{t.name}</option>)}
        </FSelect>
      </Field>

      <Field label="Leave Type">
        <FSelect value={form.type} onChange={e => s('type', e.target.value)}>
          {['sick', 'casual', 'earned'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)} Leave</option>)}
        </FSelect>
      </Field>

      <div className="ap-leave-management-page-28">
        <Field label="From">
          <FInput type="date" value={form.from} onChange={e => s('from', e.target.value)} />
        </Field>
        <Field label="To">
          <FInput type="date" value={form.to} onChange={e => s('to', e.target.value)} />
        </Field>
      </div>

      {days > 0 && <p className="ap-leave-management-page-29">
          Duration: <strong className="ap-leave-management-page-30">{days} day{days > 1 ? 's' : ''}</strong>
        </p>}

      <Field label="Reason">
        <FInput value={form.reason} onChange={e => s('reason', e.target.value)} placeholder="e.g. Fever and flu" />
      </Field>

      <div className="ap-leave-management-page-31">
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save Changes' : 'Submit Request'}
        </Btn>
      </div>
    </>;
};

// ─── Apply Modal ───────────────────────────────────────────────────────────────
const ApplyModal = ({
  show,
  onClose,
  onSave,
  loading,
  technicians
}) => <Modal show={show} title="Apply Leave" onClose={onClose}>
    {/* Unmount form when closed so state resets cleanly */}
    {show && <LeaveForm initial={null} technicians={technicians} onSave={onSave} onCancel={onClose} loading={loading} />}
  </Modal>;

// ─── Edit Modal ────────────────────────────────────────────────────────────────
const EditModal = ({
  leave,
  onClose,
  onSave,
  loading,
  technicians
}) => <Modal show={!!leave} title="Edit Leave Request" onClose={onClose}>
    {leave && <LeaveForm initial={leave} technicians={technicians} onSave={onSave} onCancel={onClose} loading={loading} />}
  </Modal>;

// ─── Delete Modal ──────────────────────────────────────────────────────────────
const DeleteModal = ({
  leave,
  onClose,
  onConfirm,
  loading
}) => <Modal show={!!leave} title="Delete Leave Request" onClose={onClose} width={400}>
    {leave && <>
        <div className="ap-leave-management-page-32">
          Are you sure you want to delete <strong>{leave.tech || leave.technicianName}</strong>'s{' '}
          <strong>{leave.type}</strong> leave ({leave.days} day{leave.days > 1 ? 's' : ''})?
          <br /><span className="ap-leave-management-page-33">This action cannot be undone.</span>
        </div>
        <div className="ap-leave-management-page-34">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Delete'}
          </Btn>
        </div>
      </>}
  </Modal>;

// ─── Approve / Reject Modal ────────────────────────────────────────────────────
const ActionModal = ({
  target,
  onClose,
  onConfirm,
  loading
}) => {
  const [note, setNote] = useState('');
  const isApprove = target?.action === 'approve';
  const handleClose = () => {
    setNote('');
    onClose();
  };
  const handleConfirm = () => {
    onConfirm(target.action, note);
    setNote('');
  };
  return <Modal show={!!target} title={isApprove ? '✓ Approve Leave Request' : '✗ Reject Leave Request'} onClose={handleClose} width={420}>
      {target && <>
          <div className="ap-leave-management-page-35">
            <div className="ap-leave-management-page-36">
              <Avatar name={target.leave.tech || target.leave.technicianName || '?'} size={36} />
              <div>
                <div className="ap-leave-management-page-37">{target.leave.tech || target.leave.technicianName}</div>
                <div className="ap-leave-management-page-38">
                  {target.leave.type} leave · {target.leave.days} day{target.leave.days > 1 ? 's' : ''}
                </div>
              </div>
              <TypeTag type={target.leave.type} className="ap-leave-management-page-39" />
            </div>
            <div className="ap-leave-management-page-40">
              <div><span className="ap-leave-management-page-41">From: </span>{fmtDisplay(target.leave.from)}</div>
              <div><span className="ap-leave-management-page-42">To: </span>{fmtDisplay(target.leave.to)}</div>
              <div className="ap-leave-management-page-43"><span className="ap-leave-management-page-44">Reason: </span>{target.leave.reason}</div>
            </div>
          </div>

          <Field label={isApprove ? 'Approval note (optional)' : 'Rejection reason (optional)'}>
            <FTextarea value={note} onChange={e => setNote(e.target.value)} placeholder={isApprove ? 'Add a note for the technician…' : 'Explain the rejection…'} />
          </Field>

          <div className="ap-leave-management-page-45">
            <Btn variant="ghost" onClick={handleClose}>Cancel</Btn>
            <Btn variant={isApprove ? 'success' : 'danger'} onClick={handleConfirm} disabled={loading}>
              {loading ? 'Processing…' : isApprove ? '✓ Confirm Approve' : '✗ Confirm Reject'}
            </Btn>
          </div>
        </>}
    </Modal>;
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const LeaveManagementPage = ({
  openModal
}) => {
  const [leaves, setLeaves] = useState(LEAVE_DATA);
  const [technicians, setTechnicians] = useState(TECHNICIANS);
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingAct, setLoadingAct] = useState(false);
  const [toast, setToast] = useState(null);

  // modal state
  const [showApply, setShowApply] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const notify = (msg, type = 'success') => {
    setToast({
      msg,
      type
    });
    setTimeout(() => setToast(null), 3200);
  };

  // ── fetch on mount ────────────────────────────────────────────────────────────
  useEffect(() => {
    leavesApi.list({
      limit: 200
    }).then(r => {
      const rows = Array.isArray(r) ? r : r?.data ?? [];
      if (rows.length) {
        setLeaves(rows.map(l => ({
          ...l,
          id: l.id || l._id || '',
          tech: l.tech || l.technicianName || l.technician?.name || '?',
          from: l.from ? String(l.from).slice(0, 10) : '',
          to: l.to ? String(l.to).slice(0, 10) : ''
        })));
      }
    }).catch(() => {});
    techsApi.list({
      limit: 200
    }).then(r => {
      const rows = Array.isArray(r) ? r : r?.data ?? [];
      if (rows.length) {
        // normalize: ensure both id and _id exist
        setTechnicians(rows.map(t => ({
          ...t,
          id: t.id || t._id || t.techId || ''
        })));
      }
    }).catch(() => {});
  }, []);

  // ── search + filter ───────────────────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchFiltered
  } = useTableSearch(leaves, ['id', 'tech', 'type', 'reason'], {
    type: ''
  });
  const filtered = searchFiltered.filter(l => !statusFilter || l.status === statusFilter);

  // ── pagination ────────────────────────────────────────────────────────────
  const {
    paginated,
    page,
    totalPages,
    setPage,
    pageSize,
    setPageSize,
    from,
    to,
    total
  } = usePagination(filtered, 10);

  // ── export ────────────────────────────────────────────────────────────────
  const {
    exportProps
  } = useExport({
    title: 'Leave Management',
    filename: 'cooltech-leave-requests',
    template: 'generic_list',
    subtitle: `AC Services Platform · Leave Requests · ${filtered.length} records`,
    docId: 'LEAVE-EXPORT',
    columns: LEAVE_COLUMNS,
    rows: filtered,
    showTotals: true,
    totalColumns: ['days']
  });
  const leaveTypes = [...new Set(leaves.map(l => l.type).filter(Boolean))];

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  // Apply (Create)
  const handleApply = async form => {
    setLoadingAct(true);
    const newLeave = {
      id: `LV-${Date.now()}`,
      tech: form.tech,
      technicianName: form.tech,
      type: form.type,
      from: form.from,
      to: form.to,
      days: form.days,
      reason: form.reason,
      approvedBy: '',
      status: 'pending'
    };
    // Optimistic
    setLeaves(prev => [newLeave, ...prev]);
    setShowApply(false);
    notify('Leave request submitted');
    try {
      const r = await leavesApi.create({
        technicianName: form.tech,
        type: form.type,
        from: form.from,
        to: form.to,
        days: form.days,
        reason: form.reason
      });
      const saved = r?.data || r;
      if (saved?._id || saved?.id) {
        setLeaves(prev => prev.map(l => l.id === newLeave.id ? {
          ...saved,
          id: saved.id || saved._id,
          tech: saved.technicianName || form.tech
        } : l));
      }
    } catch {
      notify('Saved locally — backend unavailable', 'info');
    } finally {
      setLoadingAct(false);
    }
  };

  // Edit (Update)
  const handleEdit = async form => {
    setLoadingAct(true);
    const id = editTarget.id || editTarget._id;
    // Optimistic
    setLeaves(prev => prev.map(l => l.id === id || l._id === id ? {
      ...l,
      tech: form.tech,
      technicianName: form.tech,
      type: form.type,
      from: form.from,
      to: form.to,
      days: form.days,
      reason: form.reason
    } : l));
    setEditTarget(null);
    notify('Leave updated');
    try {
      await leavesApi.update(id, {
        technicianName: form.tech,
        type: form.type,
        from: form.from,
        to: form.to,
        days: form.days,
        reason: form.reason
      });
    } catch {
      notify('Updated locally — backend unavailable', 'info');
    } finally {
      setLoadingAct(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    setLoadingAct(true);
    const id = deleteTarget.id || deleteTarget._id;
    setLeaves(prev => prev.filter(l => l.id !== id && l._id !== id));
    setDeleteTarget(null);
    notify('Leave deleted');
    try {
      await leavesApi.delete(id);
    } catch {
      notify('Deleted locally — backend unavailable', 'info');
    } finally {
      setLoadingAct(false);
    }
  };

  // Approve / Reject
  const handleAction = async (action, note) => {
    setLoadingAct(true);
    const leave = actionTarget.leave;
    const id = leave.id || leave._id;
    setLeaves(prev => prev.map(l => l.id === id || l._id === id ? {
      ...l,
      status: action === 'approve' ? 'approved' : 'rejected',
      approvedBy: action === 'approve' ? 'Admin User' : '',
      approvalNote: note
    } : l));
    notify(action === 'approve' ? 'Leave approved!' : 'Leave rejected.', action === 'approve' ? 'success' : 'error');
    setActionTarget(null);
    try {
      await leavesApi[action === 'approve' ? 'approve' : 'reject'](id, {
        note,
        approvedBy: 'Admin User'
      });
    } catch {
      notify(`${action === 'approve' ? 'Approved' : 'Rejected'} locally — backend unavailable`, 'info');
    } finally {
      setLoadingAct(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return <div className="fi ap-leave-management-page-46">

      <SectionHdr title="Leave Management" sub="Manage technician leave requests" action="+ Apply Leave" onAction={() => setShowApply(true)} />

      {/* KPI cards */}
      <div className="ap-leave-management-page-47">
        <KCard label="Pending" value={leaves.filter(l => l.status === 'pending').length} sub="to review" icon="⏳" iconBg="#FFFBEB" color="#B45309" delay="" />
        <KCard label="Approved" value={leaves.filter(l => l.status === 'approved').length} sub="this month" icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="1" />
        <KCard label="Total Days" value={leaves.reduce((s, l) => s + (l.days || 0), 0)} sub="days off taken" icon="📅" iconBg="#EFF6FF" color="#0369A1" delay="2" />
        <KCard label="On Leave" value={leaves.filter(l => l.status === 'approved' && l.days >= 2).length} sub="today" icon="🌴" iconBg="#FFF7ED" color={COLORS.brand} delay="3" />
      </div>

      {/* Leave Balance */}
      <div className="ap-leave-management-page-48">
        <div className="ap-leave-management-page-49">Leave Balance – March 2026</div>
        <div className="ap-leave-management-page-50">
          {technicians.map(t => {
          const tid = t.id || t._id;
          const bal = LEAVE_BALANCE[tid] || LEAVE_BALANCE[t.techId] || LEAVE_BALANCE[t.name] || {
            casual: 10,
            sick: 6,
            earned: 12
          };
          return <div key={tid} className="ap-leave-management-page-51">
                <div className="ap-leave-management-page-52">
                  <Avatar name={t.name} size={28} />
                  <div className="ap-leave-management-page-53">
                    {t.name.split(' ')[0]}
                  </div>
                </div>
                {[['Casual', bal.casual, 10], ['Sick', bal.sick, 7], ['Earned', bal.earned, 12]].map(([k, v, tot]) => <div key={k} className="ap-leave-management-page-54">
                    <div className="ap-leave-management-page-55">
                      <span>{k}</span>
                      <span className="ap-leave-management-page-56">{v}/{tot}</span>
                    </div>
                    <div className="ap-leave-management-page-57">
                      <div style={{
                  width: `${v / tot * 100}%`
                }} className="ap-leave-management-page-58" />
                    </div>
                  </div>)}
              </div>;
        })}
        </div>
      </div>

      {/* Table */}
      <div className="ap-leave-management-page-59">

        {/* filter bar */}
        <div className="ap-leave-management-page-60">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by technician, type, reason…" />
          <FilterSelect value={activeFilters.type} onChange={val => setFilter('type', val)} options={leaveTypes} allLabel="All Types" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={['pending', 'approved', 'rejected']} allLabel="All Statuses" />
          <div className="ap-leave-management-page-61"><ExportDropdown {...exportProps} /></div>
        </div>

        {/* table */}
        <div className="ap-leave-management-page-62">
          <table className="ap-leave-management-page-63">
            <Thead cols={['ID', 'Technician', 'Type', 'From', 'To', 'Days', 'Reason', 'Approved By', 'Status', '']} />
            <tbody>
              {paginated.length === 0 && <tr>
                  <td colSpan={10} className="ap-leave-management-page-64">
                    No leave requests match your filters.
                  </td>
                </tr>}
              {paginated.map((l, i) => <tr key={l.id || l._id || i} className="row ap-leave-management-page-65" style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>

                  <td className="ap-leave-management-page-66">
                    <span className="ap-leave-management-page-67">{l.id?.length > 10 ? `LV-${l.id.slice(-6).toUpperCase()}` : l.id}</span>
                  </td>

                  <td className="ap-leave-management-page-68">
                    <div className="ap-leave-management-page-69">
                      <Avatar name={l.tech || l.technicianName || '?'} size={26} />
                      <span className="ap-leave-management-page-70">{l.tech || l.technicianName}</span>
                    </div>
                  </td>

                  <td className="ap-leave-management-page-71"><TypeTag type={l.type} /></td>

                  {/* ← fmtDisplay handles "Mar 10, 2026" AND "2026-03-10" */}
                  <td className="ap-leave-management-page-72">{fmtDisplay(l.from)}</td>
                  <td className="ap-leave-management-page-73">{fmtDisplay(l.to)}</td>

                  <td className="ap-leave-management-page-74">
                    <span className="ap-leave-management-page-75">{l.days}</span>
                  </td>

                  <td className="ap-leave-management-page-76">
                    {l.reason}
                  </td>

                  <td className="ap-leave-management-page-77">{l.approvedBy || ''}</td>

                  <td className="ap-leave-management-page-78"><SBadge s={l.status} map={LEAVE_STATUS} /></td>

                  <td className="ap-leave-management-page-79">
                    <div className="ap-leave-management-page-80">
                      {l.status === 'pending' && <>
                          <button onClick={() => setActionTarget({
                      leave: l,
                      action: 'approve'
                    })} className="ap-leave-management-page-81">✓ Approve</button>
                          <button onClick={() => setActionTarget({
                      leave: l,
                      action: 'reject'
                    })} className="ap-leave-management-page-82">✗ Reject</button>
                        </>}
                      <ActionMenu leave={l} onView={setViewTarget} onEdit={setEditTarget} onDelete={setDeleteTarget} />
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}
      </div>

      {/* ══ Modals ══════════════════════════════════════════════════════════ */}
      <ApplyModal show={showApply} onClose={() => setShowApply(false)} onSave={handleApply} loading={loadingAct} technicians={technicians} />
      <ViewModal leave={viewTarget} onClose={() => setViewTarget(null)} />
      <EditModal leave={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} loading={loadingAct} technicians={technicians} />
      <DeleteModal leave={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={loadingAct} />
      <ActionModal target={actionTarget} onClose={() => setActionTarget(null)} onConfirm={handleAction} loading={loadingAct} />

      <Toast t={toast} />
    </div>;
};
export default LeaveManagementPage;