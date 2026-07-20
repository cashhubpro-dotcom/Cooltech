import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clientRemindersApi } from '../services/clientPortalApi';
import { fmtDateDMY } from '../../../shared/formatDate';

/* ────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — same palette used across the client portal (Jobs page)
   so this feels like the same product. Plain CSS, no Tailwind.
──────────────────────────────────────────────────────────────────────── */
const CSS = `
.crp{ --brand:#EA580C; --brand-d:#C2410C; --brand-l:#FFF3EA;
      --bg:#F8FAFC; --white:#FFFFFF; --border:#E7EAEE;
      --h1:#0F172A; --h2:#1E293B; --muted:#64748B; --faint:#94A3B8;
      --mono:'SFMono-Regular',Consolas,'Liberation Mono',monospace;
      --sans:'Inter',system-ui,-apple-system,sans-serif;
      font-family:var(--sans); color:var(--h2); }
.crp *{ box-sizing:border-box; }

.crp-title{ font-size:22px; font-weight:800; color:var(--h1); letter-spacing:-.3px; }
.crp-sub{ font-size:13px; color:var(--muted); margin-top:3px; margin-bottom:18px; }

.crp-kpis{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
@media (max-width:700px){ .crp-kpis{ grid-template-columns:repeat(2,1fr); } }
.crp-kpi{ background:var(--white); border:1px solid var(--border); border-radius:14px; padding:14px 16px;
      box-shadow:0 1px 4px rgba(15,23,42,.05); }
.crp-kpi-hdr{ display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.crp-kpi-label{ font-size:11px; font-weight:700; color:var(--faint); text-transform:uppercase; letter-spacing:.4px; }
.crp-kpi-icon{ width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; }
.crp-kpi-value{ font-size:24px; font-weight:800; }
.crp-kpi-sub{ font-size:11px; color:var(--faint); margin-top:2px; }

.crp-toolbar{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:14px; }
.crp-search{ position:relative; flex:1 1 220px; max-width:320px; }
.crp-search input{ width:100%; padding:9px 12px 9px 32px; border-radius:9px; border:1.5px solid var(--border);
      font-size:13px; outline:none; background:var(--white); font-family:var(--sans); }
.crp-search input:focus{ border-color:var(--brand); }
.crp-search svg{ position:absolute; left:10px; top:50%; transform:translateY(-50%); pointer-events:none; }
.crp-tabs{ display:flex; background:var(--white); border:1px solid var(--border); border-radius:11px; padding:4px; gap:2px; flex-wrap:wrap; }
.crp-tab{ padding:8px 13px; border-radius:8px; font-size:12.5px; font-weight:600; background:transparent;
      color:var(--muted); border:none; cursor:pointer; display:flex; gap:6px; align-items:center; white-space:nowrap; }
.crp-tab.active{ background:var(--brand-l); color:var(--brand); }
.crp-tab .cnt{ font-size:10px; background:#F1F5F9; color:var(--faint); padding:1px 7px; border-radius:99px; }
.crp-tab.active .cnt{ background:rgba(234,88,12,.15); color:var(--brand); }

.crp-list{ display:flex; flex-direction:column; gap:10px; }
.crp-card{ background:var(--white); border:1px solid var(--border); border-radius:14px; padding:16px;
      box-shadow:0 1px 4px rgba(15,23,42,.05); cursor:pointer; transition:box-shadow .15s, border-color .15s; display:flex; gap:14px; align-items:flex-start; }
.crp-card:hover{ border-color:var(--brand); box-shadow:0 4px 14px rgba(234,88,12,.10); }
.crp-icon{ width:42px; height:42px; border-radius:11px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:19px; }
.crp-card-body{ flex:1; min-width:0; }
.crp-card-top{ display:flex; align-items:center; gap:8px; margin-bottom:5px; flex-wrap:wrap; }
.crp-card-type{ font-size:14px; font-weight:800; color:var(--h1); }
.crp-card-note{ font-size:12px; color:var(--muted); }
.crp-card-due{ text-align:right; flex-shrink:0; }
.crp-card-due-label{ font-size:10.5px; color:var(--faint); margin-bottom:2px; }
.crp-card-due-date{ font-size:13px; font-weight:700; }
.crp-card-id{ font-size:10.5px; color:var(--faint); margin-top:3px; font-family:var(--mono); }

.crp-empty{ text-align:center; padding:44px 20px; color:var(--faint); font-size:13px; background:var(--white);
      border:1px solid var(--border); border-radius:14px; }
.crp-loading{ text-align:center; padding:60px 20px; color:var(--muted); font-size:13px; }

.crp-badge{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; padding:3px 9px; border-radius:99px; white-space:nowrap; }
.crp-badge .dot{ width:6px; height:6px; border-radius:99px; background:currentColor; }
.crp-priority{ font-size:10px; font-weight:700; padding:2px 8px; border-radius:99px; text-transform:uppercase; letter-spacing:.3px; }

.crp-back{ display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--muted); background:none;
      border:none; cursor:pointer; font-weight:600; margin-bottom:14px; }
.crp-back:hover{ color:var(--brand); }

.crp-detail-card{ background:var(--white); border:1px solid var(--border); border-radius:16px; padding:24px;
      box-shadow:0 1px 4px rgba(15,23,42,.05); } 
.crp-detail-hdr{ display:flex; gap:16px; align-items:flex-start; margin-bottom:18px; }
.crp-detail-icon{ width:56px; height:56px; border-radius:14px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:26px; }
.crp-detail-type{ font-size:19px; font-weight:800; color:var(--h1); margin-bottom:6px; }

.crp-divider{ height:1px; background:var(--border); margin:16px 0; }
.crp-field-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:16px 20px; }
@media (max-width:520px){ .crp-field-grid{ grid-template-columns:1fr; } }
.crp-field-label{ font-size:10.5px; font-weight:700; color:var(--faint); text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
.crp-field-value{ font-size:13.5px; color:var(--h2); line-height:1.5; }
.crp-note-box{ padding:12px 14px; border-radius:10px; border:1px solid var(--border); background:#F9FAFB; font-size:13px; color:var(--h2); line-height:1.6; }

.crp-actions{ display:flex; gap:10px; flex-wrap:wrap; margin-top:20px; }
.crp-abtn{ flex:1 1 140px; padding:11px 14px; border-radius:10px; font-size:12.5px; font-weight:700; cursor:pointer; text-align:center; border:1px solid transparent; }
.crp-abtn.primary{ background:linear-gradient(135deg,var(--brand),var(--brand-d)); color:#fff; border:none; box-shadow:0 4px 12px rgba(234,88,12,.28); }
.crp-abtn.ghost{ background:#FFFBEB; border-color:#FDE68A; color:#B45309; }
.crp-abtn:disabled{ opacity:.5; cursor:not-allowed; }

.crp-toast{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 16px; border-radius:10px;
      font-size:13px; font-weight:600; margin-bottom:14px; }
.crp-toast.success{ background:#ECFDF5; border:1px solid #A7F3D0; color:#047857; }
.crp-toast.info{ background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; }
.crp-toast.error{ background:#FEF2F2; border:1px solid #FECACA; color:#B91C1C; }
.crp-toast-x{ background:none; border:none; cursor:pointer; font-size:15px; color:inherit; opacity:.6; }

.crp-modal-overlay{ position:fixed; inset:0; background:rgba(15,23,42,.5); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
.crp-modal{ background:var(--white); border-radius:16px; width:100%; max-width:420px; box-shadow:0 24px 64px rgba(0,0,0,.25); }
.crp-modal-hdr{ display:flex; justify-content:space-between; align-items:center; padding:18px 22px; border-bottom:1px solid var(--border); }
.crp-modal-title{ font-size:15px; font-weight:800; color:var(--h1); }
.crp-modal-close{ background:#F3F4F6; border:none; width:26px; height:26px; border-radius:7px; font-size:14px; color:var(--muted); cursor:pointer; }
.crp-modal-body{ padding:18px 22px; display:flex; flex-direction:column; gap:12px; }
.crp-modal-note{ font-size:12.5px; color:var(--muted); line-height:1.5; }
.crp-chip-row{ display:flex; gap:8px; flex-wrap:wrap; }
.crp-chip{ padding:8px 14px; border-radius:9px; font-size:12.5px; font-weight:600; border:1.5px solid var(--border); background:#FAFAFA; cursor:pointer; color:var(--h2); }
.crp-chip.active{ border-color:var(--brand); background:var(--brand-l); color:var(--brand); }
.crp-finput{ width:100%; padding:9px 11px; border-radius:8px; border:1.5px solid var(--border); font-size:13px; color:var(--h2); background:#FAFAFA; outline:none; box-sizing:border-box; }
.crp-modal-footer{ display:flex; justify-content:flex-end; gap:10px; padding:16px 22px; border-top:1px solid var(--border); }
.crp-modal-btn{ padding:9px 18px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:none; }
.crp-modal-btn.cancel{ background:var(--white); border:1px solid var(--border); color:var(--muted); }
.crp-modal-btn.save{
  background:#EA580C !important;
  color:#fff !important;
  border:none !important;
  box-shadow:0 4px 12px rgba(234,88,12,.28);
}
.crp-modal-btn:disabled{ opacity:.6; cursor:not-allowed; }
`;

/* ── Reminder type enum → display label + icon.
   Matches the real schema: type is one of amc_renewal|follow_up|payment|visit|custom ── */
const TYPE_META = {
  amc_renewal: {
    label: 'AMC Renewal',
    icon: '📋'
  },
  follow_up: {
    label: 'Follow-up',
    icon: '📞'
  },
  payment: {
    label: 'Payment Reminder',
    icon: '💳'
  },
  visit: {
    label: 'Service Visit',
    icon: '📅'
  },
  custom: {
    label: 'Reminder',
    icon: '🔔'
  }
};
const URGENCY_MAP = {
  overdue: {
    label: 'Overdue',
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  },
  due_soon: {
    label: 'Due Soon',
    color: "var(--warning-text)",
    bg: "var(--warning-bg)"
  },
  upcoming: {
    label: 'Upcoming',
    color: "var(--brand)",
    bg: "var(--brand-light)"
  }
};
const DONE_META = {
  label: 'Completed',
  color: "var(--success-text)",
  bg: "var(--success-bg)"
};
const PRIORITY_META = {
  high: {
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  },
  medium: {
    color: "var(--warning-text)",
    bg: "var(--warning-bg)"
  },
  low: {
    color: "var(--text-muted)",
    bg: "var(--bg)"
  }
};

/* ── Maps a raw Reminder document to the shape this UI works with.
   Real schema has NO ac-unit or lastService fields — those were mock-only
   guesses in the first draft and are dropped here. ─────────────────────── */
const normaliseReminder = r => ({
  _id: r._id,
  id: r.reminderId || r._id,
  title: r.title || '',
  description: r.description || '',
  type: r.type || 'custom',
  priority: r.priority || 'medium',
  status: r.status || 'pending',
  // 'pending' | 'done' | 'snoozed' — real stored value
  urgency: r.urgency || null,
  // 'overdue' | 'due_soon' | 'upcoming' | null — computed server-side
  dueDate: r.dueDate ?fmtDateDMY(new Date(r.dueDate)) : ''
});
const SBadge = ({
  reminder
}) => {
  if (reminder.status === 'done') {
    return <span className="crp-badge cp-reminders-page-1"><span className="dot" />{DONE_META.label}</span>;
  }
  const m = URGENCY_MAP[reminder.urgency] || URGENCY_MAP.upcoming;
  return <span className="crp-badge" style={{
    background: m.bg,
    color: m.color
  }}><span className="dot" />{m.label}</span>;
};
const PriorityTag = ({
  priority
}) => {
  const m = PRIORITY_META[priority] || PRIORITY_META.medium;
  return <span className="crp-priority" style={{
    background: m.bg,
    color: m.color
  }}>{priority}</span>;
};
const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>;

/* ── Request Service modal — creates a real Job on confirm ─────────────── */
const RequestServiceModal = ({
  open,
  onClose,
  onConfirm,
  reminder,
  saving
}) => {
  const [date, setDate] = useState('');
  useEffect(() => {
    if (open) setDate('');
  }, [open]);
  if (!open || !reminder) return null;
  const meta = TYPE_META[reminder.type] || TYPE_META.custom;
  return createPortal(<div className="crp-modal-overlay" onClick={onClose}>
      <div className="crp-modal" onClick={e => e.stopPropagation()}>
        <div className="crp-modal-hdr">
          <div className="crp-modal-title">🔧 Request Service</div>
          <button className="crp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="crp-modal-body">
          <div className="crp-modal-note">
            This will create a service request for <strong>{meta.label}</strong>{reminder.title ? ` — ${reminder.title}` : ''}. Our team will review and schedule a technician.
          </div>
          <div>
            <label className="cp-reminders-page-2">
              Preferred Date (optional)
            </label>
            <input className="crp-finput" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="crp-modal-footer">
          <button className="crp-modal-btn cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="crp-modal-btn save" onClick={() => onConfirm(date)} disabled={saving}>
            {saving ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>, document.getElementById('client-portal-root') || document.body);
};

/* ── Snooze modal — pushes the real dueDate forward on the server ──────── */
const SnoozeModal = ({
  open,
  onClose,
  onConfirm,
  saving
}) => {
  const [days, setDays] = useState(7);
  useEffect(() => {
    if (open) setDays(7);
  }, [open]);
  if (!open) return null;
  return createPortal(<div className="crp-modal-overlay" onClick={onClose}>
      <div className="crp-modal" onClick={e => e.stopPropagation()}>
        <div className="crp-modal-hdr">
          <div className="crp-modal-title">⏰ Snooze Reminder</div>
          <button className="crp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="crp-modal-body">
          <div className="crp-modal-note">Push this reminder's due date forward. We'll remind you again later.</div>
          <div className="crp-chip-row">
            {[7, 14, 30].map(d => <button key={d} className={`crp-chip ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>+{d} days</button>)}
          </div>
        </div>
        <div className="crp-modal-footer">
          <button className="crp-modal-btn cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="crp-modal-btn save" onClick={() => onConfirm(days)} disabled={saving}>
            {saving ? 'Saving…' : 'Snooze'}
          </button>
        </div>
      </div>
    </div>, document.getElementById('client-portal-root') || document.body);
};

/* ── main component ─────────────────────────────────────────────────── */
export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const fetchReminders = () => {
    setLoading(true);
    setLoadError('');
    clientRemindersApi.list().then(res => setReminders((res?.data || []).map(normaliseReminder))).catch(err => setLoadError(err.message || 'Failed to load your reminders.')).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchReminders();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  // Filter tabs operate on display status: 'done', or urgency for anything else
  const displayStatus = r => r.status === 'done' ? 'done' : r.urgency || 'upcoming';
  const counts = ['overdue', 'due_soon', 'upcoming', 'done'].reduce((a, s) => ({
    ...a,
    [s]: reminders.filter(r => displayStatus(r) === s).length
  }), {});
  const filtered = reminders.filter(r => filter === 'all' || displayStatus(r) === filter).filter(r => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const meta = TYPE_META[r.type] || TYPE_META.custom;
    return [meta.label, r.title, r.description].some(v => (v || '').toLowerCase().includes(q));
  });
  const reminder = openId ? reminders.find(r => r._id === openId) : null;
  const updateReminder = (_id, patch) => setReminders(prev => prev.map(r => r._id === _id ? {
    ...r,
    ...patch
  } : r));
  const handleRequestService = preferredDate => {
    setActionSaving(true);
    clientRemindersApi.requestService(reminder._id, preferredDate ? {
      preferredDate
    } : {}).then(res => {
      updateReminder(reminder._id, {
        status: 'done',
        urgency: null
      });
      setShowRequest(false);
      setToast({
        type: 'success',
        msg: `Service request sent${res?.data?.jobId ? ` — ${res.data.jobId}` : ''}. Our team will confirm shortly.`
      });
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not send the request.'
    })).finally(() => setActionSaving(false));
  };
  const handleSnooze = days => {
    setActionSaving(true);
    clientRemindersApi.snooze(reminder._id, days).then(res => {
      updateReminder(reminder._id, normaliseReminder(res.data));
      setShowSnooze(false);
      setToast({
        type: 'info',
        msg: `Reminder snoozed by ${days} days.`
      });
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not snooze this reminder.'
    })).finally(() => setActionSaving(false));
  };

  /* ── Loading / error ── */
  if (loading) {
    return <div className="crp">
        <style>{CSS}</style>
        <div className="crp-loading">Loading your service reminders…</div>
      </div>;
  }
  if (loadError) {
    return <div className="crp">
        <style>{CSS}</style>
        <div className="crp-toast error">
          <span>{loadError}</span>
          <button className="crp-toast-x" onClick={fetchReminders}>↻ Retry</button>
        </div>
      </div>;
  }

  /* ── Detail view ── */
  if (reminder) {
    const isDone = reminder.status === 'done';
    const meta = TYPE_META[reminder.type] || TYPE_META.custom;
    const badgeColor = isDone ? DONE_META : URGENCY_MAP[reminder.urgency] || URGENCY_MAP.upcoming;
    return <div className="crp">
        <style>{CSS}</style>
        <button className="crp-back" onClick={() => setOpenId(null)}>← Back to Service Reminders</button>

        {toast && <div className={`crp-toast ${toast.type}`}>
            <span>{toast.msg}</span>
            <button className="crp-toast-x" onClick={() => setToast(null)}>×</button>
          </div>}

        <div className="crp-detail-card">
          <div className="crp-detail-hdr">
            <div className="crp-detail-icon" style={{
            background: badgeColor.bg
          }}>{meta.icon}</div>
            <div className="cp-reminders-page-3">
              <div className="crp-detail-type">{reminder.title || meta.label}</div>
              <div className="cp-reminders-page-4">
                <PriorityTag priority={reminder.priority} />
                {reminder.status === 'snoozed' && <span className="crp-priority cp-reminders-page-5">Snoozed</span>}
              </div>
            </div>
            <SBadge reminder={reminder} />
          </div>

          {reminder.description && <div className="crp-note-box">{reminder.description}</div>}

          <div className="crp-divider" />

          <div className="crp-field-grid">
            <div>
              <div className="crp-field-label">Type</div>
              <div className="crp-field-value">{meta.label}</div>
            </div>
            <div>
              <div className="crp-field-label">{isDone ? 'Actioned' : 'Due Date'}</div>
              <div className="crp-field-value" style={{
              color: reminder.urgency === 'overdue' && !isDone ? '#DC2626' : undefined,
              fontWeight: reminder.urgency === 'overdue' && !isDone ? "700" : "400"
            }}>
                {reminder.dueDate}
              </div>
            </div>
            <div>
              <div className="crp-field-label">Reference ID</div>
              <div className="crp-field-value cp-reminders-page-6">{reminder.id}</div>
            </div>
          </div>

          {!isDone && <div className="crp-actions">
              <button className="crp-abtn primary" onClick={() => setShowRequest(true)}>🔧 Request Service</button>
              <button className="crp-abtn ghost" onClick={() => setShowSnooze(true)}>⏰ Snooze</button>
            </div>}
        </div>

        <RequestServiceModal open={showRequest} reminder={reminder} saving={actionSaving} onClose={() => setShowRequest(false)} onConfirm={handleRequestService} />
        <SnoozeModal open={showSnooze} saving={actionSaving} onClose={() => setShowSnooze(false)} onConfirm={handleSnooze} />
      </div>;
  }

  /* ── List view ── */
  return <div className="crp">
      <style>{CSS}</style>

      <div className="crp-title">Service Reminders</div>
      <div className="crp-sub">Upcoming and completed service reminders for your account</div>

      {toast && <div className={`crp-toast ${toast.type}`}>
          <span>{toast.msg}</span>
          <button className="crp-toast-x" onClick={() => setToast(null)}>×</button>
        </div>}

      <div className="crp-kpis">
        <div className="crp-kpi">
          <div className="crp-kpi-hdr"><span className="crp-kpi-label">Overdue</span><span className="crp-kpi-icon cp-reminders-page-7">🔴</span></div>
          <div className="crp-kpi-value cp-reminders-page-8">{counts.overdue || 0}</div>
          <div className="crp-kpi-sub">action needed</div>
        </div>
        <div className="crp-kpi">
          <div className="crp-kpi-hdr"><span className="crp-kpi-label">Due Soon</span><span className="crp-kpi-icon cp-reminders-page-9">🟡</span></div>
          <div className="crp-kpi-value cp-reminders-page-10">{counts.due_soon || 0}</div>
          <div className="crp-kpi-sub">within 2 weeks</div>
        </div>
        <div className="crp-kpi">
          <div className="crp-kpi-hdr"><span className="crp-kpi-label">Upcoming</span><span className="crp-kpi-icon cp-reminders-page-11">🔔</span></div>
          <div className="crp-kpi-value cp-reminders-page-12">{counts.upcoming || 0}</div>
          <div className="crp-kpi-sub">tracked</div>
        </div>
        <div className="crp-kpi">
          <div className="crp-kpi-hdr"><span className="crp-kpi-label">Completed</span><span className="crp-kpi-icon cp-reminders-page-13">✅</span></div>
          <div className="crp-kpi-value cp-reminders-page-14">{counts.done || 0}</div>
          <div className="crp-kpi-sub">actioned</div>
        </div>
      </div>

      <div className="crp-toolbar">
        <div className="crp-search">
          <SearchIcon />
          <input placeholder="Search reminders…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="crp-tabs">
          {[['all', 'All', reminders.length], ['overdue', 'Overdue', counts.overdue || 0], ['due_soon', 'Due Soon', counts.due_soon || 0], ['upcoming', 'Upcoming', counts.upcoming || 0], ['done', 'Completed', counts.done || 0]].map(([k, label, c]) => <button key={k} className={`crp-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
                {label}<span className="cnt">{c}</span>
              </button>)}
        </div>
      </div>

      <div className="crp-list">
        {filtered.map(r => {
        const meta = TYPE_META[r.type] || TYPE_META.custom;
        const badgeColor = r.status === 'done' ? DONE_META : URGENCY_MAP[r.urgency] || URGENCY_MAP.upcoming;
        return <div className="crp-card" key={r._id} onClick={() => setOpenId(r._id)}>
              <div className="crp-icon" style={{
            background: badgeColor.bg
          }}>{meta.icon}</div>
              <div className="crp-card-body">
                <div className="crp-card-top">
                  <span className="crp-card-type">{r.title || meta.label}</span>
                  <SBadge reminder={r} />
                  <PriorityTag priority={r.priority} />
                </div>
                {r.description && <div className="crp-card-note">{r.description}</div>}
              </div>
              <div className="crp-card-due">
                <div className="crp-card-due-label">{r.status === 'done' ? 'Actioned' : 'Due Date'}</div>
                <div className="crp-card-due-date" style={{
              color: badgeColor.color
            }}>📅 {r.dueDate}</div>
                <div className="crp-card-id">{r.id}</div>
              </div>
            </div>;
      })}
        {filtered.length === 0 && <div className="crp-empty">No reminders match your filters</div>}
      </div>
    </div>;
}