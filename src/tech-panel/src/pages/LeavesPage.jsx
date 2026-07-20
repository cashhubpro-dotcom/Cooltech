import { useState, useMemo, useEffect, useRef } from 'react';
import { COLORS } from '../constants/token';
import { LEAVE_STATUS } from '../constants/statusMaps';
import { SBadge, Modal, Toast, ProgressBar } from '../components/ui/Components';
import { leavesApi } from '../services/technicianPortalApi'; // update to your actual path/filename for the file above
import { fmtDateDMY } from '../../../shared/formatDate';
// import './leaves-page.css';

// ─── Static config — matches the Leave model's lowercase enums ────────────────
const LEAVE_TYPES = ['casual', 'sick', 'earned'];
const TYPE_LABEL = {
  casual: 'Casual Leave',
  sick: 'Sick Leave',
  earned: 'Earned Leave'
};
const TYPE_ICON = {
  casual: '📅',
  sick: '🤒',
  earned: '🏖'
};
const TYPE_BG = {
  casual: "var(--info-bg)",
  sick: "var(--danger-bg)",
  earned: "var(--success-bg)"
};
const TYPE_FG = {
  casual: "var(--info-text)",
  sick: "var(--brand-d)",
  earned: "var(--success-text)"
};
const emptyForm = {
  type: 'casual',
  from: '',
  to: '',
  reason: ''
};
const emptyBalance = {
  casual: {
    total: 0,
    used: 0,
    balance: 0
  },
  sick: {
    total: 0,
    used: 0,
    balance: 0
  },
  earned: {
    total: 0,
    used: 0,
    balance: 0
  }
};

// ─── Date helpers ──────────────────────────────────────────────────────────────
const calcDays = (f, t) => {
  if (!f || !t) return 0;
  const diff = Math.ceil((new Date(t) - new Date(f)) / 86400000) + 1;
  return diff > 0 ? diff : 0;
};
const fmtDisplay = raw => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return fmtDateDMY(d);
};
const isPending = status => status === 'pending';

// ─── Action menu (⋯) ───────────────────────────────────────────────────────────
const ActionMenu = ({
  leave,
  onView,
  onEdit,
  onWithdraw
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
  const item = (label, cb, danger) => <button key={label} className={`lv-menu-item${danger ? ' lv-menu-item--danger' : ''}`} onClick={() => {
    cb();
    setOpen(false);
  }}>
      {label}
    </button>;
  return <div ref={ref} className="lv-menu-wrap">
      <button className="lv-menu-btn" onClick={() => setOpen(o => !o)} aria-label="Row actions">⋯</button>
      {open && <div className="lv-menu">
          {item('👁  View', () => onView(leave))}
          {isPending(leave.status) && item('✏️  Edit', () => onEdit(leave))}
          {isPending(leave.status) && item('🗑  Withdraw', () => onWithdraw(leave), true)}
        </div>}
    </div>;
};

// ─── Leave form (shared by Apply + Edit) ───────────────────────────────────────
const LeaveForm = ({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitLabel,
  balance,
  saving
}) => {
  const s = (k, v) => setForm(p => ({
    ...p,
    [k]: v
  }));
  const days = calcDays(form.from, form.to);
  return <div>
      <div className="form-field">
        <label className="form-label">Leave Type</label>
        <select className="form-input" value={form.type} onChange={e => s('type', e.target.value)}>
          {LEAVE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </select>
      </div>

      <div className="grid-2">
        <div className="form-field tp-leaves-page-1">
          <label className="form-label">From Date</label>
          <input className="form-input" type="date" value={form.from} onChange={e => s('from', e.target.value)} />
        </div>
        <div className="form-field tp-leaves-page-2">
          <label className="form-label">To Date</label>
          <input className="form-input" type="date" value={form.to} onChange={e => s('to', e.target.value)} />
        </div>
      </div>

      {days > 0 && <p className="lv-duration">Duration: <strong>{days} day{days > 1 ? 's' : ''}</strong></p>}

      <div className="form-field tp-leaves-page-3">
        <label className="form-label">Reason</label>
        <textarea className="form-input" rows={3} placeholder="Briefly explain the reason for leave…" value={form.reason} onChange={e => s('reason', e.target.value)} />
      </div>

      <div className="lv-balance-reminder">
        <div className="lv-balance-reminder__label">Your Leave Balance</div>
        <div className="tp-leaves-page-4">
          <span>Casual: <strong>{balance.casual.balance}</strong></span>
          <span>Sick: <strong>{balance.sick.balance}</strong></span>
          <span>Earned: <strong>{balance.earned.balance}</strong></span>
        </div>
      </div>

      <div className="lv-modal-actions">
        <button className="btn btn-primary btn-sm" onClick={onSubmit} disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>;
};

// ─── View (detail) modal ────────────────────────────────────────────────────────
const ViewModal = ({
  leave,
  onClose
}) => <Modal open={!!leave} onClose={onClose} title="Leave Request Details">
    {leave && <div>
        <div className="lv-detail-head">
          <div className="lv-type-icon" style={{
        background: TYPE_BG[leave.type] || '#F3F4F6'
      }}>
            {TYPE_ICON[leave.type] || '📅'}
          </div>
          <div className="tp-leaves-page-5">
            <div className="lv-detail-head__title">{TYPE_LABEL[leave.type] || leave.type}</div>
            <div className="lv-detail-head__sub">{leave.id}</div>
          </div>
          <SBadge s={leave.status} map={LEAVE_STATUS} />
        </div>

        <div className="lv-detail-grid">
          <div className="lv-detail-item">
            <div className="lv-detail-label">From</div>
            <div className="lv-detail-value">{fmtDisplay(leave.from)}</div>
          </div>
          <div className="lv-detail-item">
            <div className="lv-detail-label">To</div>
            <div className="lv-detail-value">{fmtDisplay(leave.to)}</div>
          </div>
          <div className="lv-detail-item">
            <div className="lv-detail-label">Duration</div>
            <div className="lv-detail-value">{leave.days} day{leave.days !== 1 ? 's' : ''}</div>
          </div>
          <div className="lv-detail-item">
            <div className="lv-detail-label">Applied On</div>
            <div className="lv-detail-value">{fmtDisplay(leave.appliedOn)}</div>
          </div>
          <div className="lv-detail-item tp-leaves-page-6">
            <div className="lv-detail-label">Reason</div>
            <div className="lv-detail-value">{leave.reason || '—'}</div>
          </div>
          {leave.status === 'approved' && leave.approvedBy && <div className="lv-detail-item">
              <div className="lv-detail-label">Approved By</div>
              <div className="lv-detail-value">{leave.approvedBy}</div>
            </div>}
          {leave.approvalNote && <div className="lv-detail-item tp-leaves-page-7">
              <div className="lv-detail-label">{leave.status === 'rejected' ? 'Rejection Note' : 'Note'}</div>
              <div className={`lv-detail-value${leave.status === 'rejected' ? ' lv-detail-value--danger' : ''}`}>
                {leave.approvalNote}
              </div>
            </div>}
        </div>

        <div className="lv-modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>}
  </Modal>;

// ─── Withdraw (delete) confirm modal ───────────────────────────────────────────
const WithdrawModal = ({
  leave,
  onClose,
  onConfirm,
  saving
}) => <Modal open={!!leave} onClose={onClose} title="Withdraw Leave Request">
    {leave && <div>
        <div className="lv-warning-box">
          Are you sure you want to withdraw your <strong>{TYPE_LABEL[leave.type]}</strong> request
          ({leave.days} day{leave.days !== 1 ? 's' : ''}, {fmtDisplay(leave.from)}
          {leave.from !== leave.to ? ` → ${fmtDisplay(leave.to)}` : ''})?
          <div className="lv-warning-box__note">This action cannot be undone.</div>
        </div>
        <div className="lv-modal-actions">
          <button className="btn btn-danger btn-sm" onClick={onConfirm} disabled={saving}>
            {saving ? 'Withdrawing…' : 'Withdraw'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>}
  </Modal>;

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
const LeavesPage = () => {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(emptyBalance);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // filters
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // modal state
  const [showApply, setShowApply] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const notify = msg => setToast(msg);

  // ── initial load ──────────────────────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true);
    try {
      const [leaveRes, balRes] = await Promise.all([leavesApi.list({
        limit: 200
      }), leavesApi.balance()]);
      setLeaves(leaveRes?.data ?? []);
      setBalance(balRes?.data ?? emptyBalance);
    } catch (e) {
      notify(e.message || 'Could not load leave data');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAll();
  }, []);

  // ── client-side search/filter over the loaded page ───────────────────────
  const statuses = useMemo(() => [...new Set(leaves.map(l => l.status).filter(Boolean))], [leaves]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leaves.filter(l => {
      const matchQ = !term || `${l.type} ${l.reason} ${l.id}`.toLowerCase().includes(term);
      const matchType = !typeFilter || l.type === typeFilter;
      const matchStatus = !statusFilter || l.status === statusFilter;
      return matchQ && matchType && matchStatus;
    });
  }, [leaves, q, typeFilter, statusFilter]);
  const pendingCount = leaves.filter(l => isPending(l.status)).length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const totalDaysTaken = leaves.filter(l => l.status === 'approved').reduce((s, l) => s + (l.days || 0), 0);

  // ── Apply ──
  const openApply = () => {
    setForm(emptyForm);
    setShowApply(true);
  };
  const submitApply = async () => {
    if (!form.from || !form.to || !form.reason) {
      notify('Please fill in all fields');
      return;
    }
    setSaving(true);
    try {
      const res = await leavesApi.create(form);
      setLeaves(prev => [res.data, ...prev]);
      setShowApply(false);
      notify('Leave request submitted! Awaiting approval.');
      loadAll(); // refresh balance too, in case a total changed server-side
    } catch (e) {
      notify(e.message || 'Could not submit leave request');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ──
  const openEdit = l => {
    setForm({
      type: l.type,
      from: l.from,
      to: l.to,
      reason: l.reason
    });
    setEditTarget(l);
  };
  const submitEdit = async () => {
    if (!form.from || !form.to || !form.reason) {
      notify('Please fill in all fields');
      return;
    }
    setSaving(true);
    try {
      const res = await leavesApi.update(editTarget.id, form);
      setLeaves(prev => prev.map(l => l.id === editTarget.id ? res.data : l));
      setEditTarget(null);
      notify('Leave request updated.');
    } catch (e) {
      notify(e.message || 'Could not update leave request');
    } finally {
      setSaving(false);
    }
  };

  // ── Withdraw ──
  const confirmWithdraw = async () => {
    setSaving(true);
    try {
      await leavesApi.withdraw(withdrawTarget.id);
      setLeaves(prev => prev.filter(l => l.id !== withdrawTarget.id));
      setWithdrawTarget(null);
      notify('Leave request withdrawn.');
      loadAll(); // balance frees up
    } catch (e) {
      notify(e.message || 'Could not withdraw leave request');
    } finally {
      setSaving(false);
    }
  };
  return <div>
      <div className="sec-hdr">
        <div>
          <div className="sec-title">Leave Requests</div>
          <div className="sec-sub">Apply for leaves and track their approval status</div>
        </div>
        <button className="btn btn-primary" onClick={openApply}>+ Apply Leave</button>
      </div>

      {/* KPI strip */}
      <div className="grid-3 tp-leaves-page-8">
        <div className="card lv-kpi">
          <span className="lv-kpi__icon tp-leaves-page-9">⏳</span>
          <div>
            <div className="lv-kpi__value tp-leaves-page-10">{pendingCount}</div>
            <div className="lv-kpi__label">Pending Approval</div>
          </div>
        </div>
        <div className="card lv-kpi">
          <span className="lv-kpi__icon tp-leaves-page-11">✅</span>
          <div>
            <div className="lv-kpi__value tp-leaves-page-12">{approvedCount}</div>
            <div className="lv-kpi__label">Approved Requests</div>
          </div>
        </div>
        <div className="card lv-kpi">
          <span className="lv-kpi__icon tp-leaves-page-13">📅</span>
          <div>
            <div className="lv-kpi__value tp-leaves-page-14">{totalDaysTaken}</div>
            <div className="lv-kpi__label">Days Taken (Approved)</div>
          </div>
        </div>
      </div>

      {/* Leave balance cards */}
      <div className="grid-3 tp-leaves-page-15">
        {[{
        key: 'casual',
        label: 'Casual Leave',
        color: '#3B82F6'
      }, {
        key: 'sick',
        label: 'Sick Leave',
        color: '#EF4444'
      }, {
        key: 'earned',
        label: 'Earned Leave',
        color: '#16A34A'
      }].map(s => <div key={s.key} className="card afu tp-leaves-page-16">
            <div className="tp-leaves-page-17">
              <div className="tp-leaves-page-18">{s.label}</div>
              <span style={{
            color: s.color
          }} className="tp-leaves-page-19">{balance[s.key].balance}</span>
            </div>
            <ProgressBar value={balance[s.key].balance} max={balance[s.key].total || 1} color={s.color} />
            <div className="tp-leaves-page-20">
              <span>Used: <strong className="tp-leaves-page-21">{balance[s.key].used}</strong></span>
              <span>Total: <strong className="tp-leaves-page-22">{balance[s.key].total}</strong></span>
              <span>Balance: <strong style={{
              color: s.color
            }}>{balance[s.key].balance}</strong></span>
            </div>
          </div>)}
      </div>

      {/* History table */}
      <div className="card afu1">
        <div className="card-header"><div className="card-title">📋 Leave History</div></div>

        <div className="lv-toolbar">
          <input className="lv-search" placeholder="Search by type, reason, ID…" value={q} onChange={e => setQ(e.target.value)} />
          <select className="lv-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {LEAVE_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
          <select className="lv-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{LEAVE_STATUS[s]?.label || s}</option>)}
          </select>
        </div>

        <div className="lv-table-wrap">
          <table className="lv-table">
            <thead>
              <tr>
                <th>ID</th><th>Type</th><th>From</th><th>To</th><th>Days</th>
                <th>Reason</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="lv-empty">Loading your leave requests…</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} className="lv-empty">No leave requests match your filters.</td></tr>}
              {!loading && filtered.map(l => <tr key={l.id}>
                  <td className="lv-mono">{l.id.length > 10 ? `LV-${l.id.slice(-6).toUpperCase()}` : l.id}</td>
                  <td>
                    <span className="lv-type-pill" style={{
                  background: TYPE_BG[l.type],
                  color: TYPE_FG[l.type]
                }}>
                      {TYPE_ICON[l.type]} {TYPE_LABEL[l.type] || l.type}
                    </span>
                  </td>
                  <td className="lv-muted">{fmtDisplay(l.from)}</td>
                  <td className="lv-muted">{fmtDisplay(l.to)}</td>
                  <td className="lv-mono lv-days">{l.days}</td>
                  <td className="lv-reason" title={l.reason}>{l.reason}</td>
                  <td><SBadge s={l.status} map={LEAVE_STATUS} /></td>
                  <td>
                    <ActionMenu leave={l} onView={setViewTarget} onEdit={openEdit} onWithdraw={setWithdrawTarget} />
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply modal */}
      <Modal open={showApply} onClose={() => !saving && setShowApply(false)} title="Apply for Leave">
        <LeaveForm form={form} setForm={setForm} balance={balance} saving={saving} onSubmit={submitApply} onCancel={() => setShowApply(false)} submitLabel="Submit Request" />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTarget} onClose={() => !saving && setEditTarget(null)} title="Edit Leave Request">
        <LeaveForm form={form} setForm={setForm} balance={balance} saving={saving} onSubmit={submitEdit} onCancel={() => setEditTarget(null)} submitLabel="Save Changes" />
      </Modal>

      <ViewModal leave={viewTarget} onClose={() => setViewTarget(null)} />
      <WithdrawModal leave={withdrawTarget} onClose={() => setWithdrawTarget(null)} onConfirm={confirmWithdraw} saving={saving} />

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>;
};
export default LeavesPage;