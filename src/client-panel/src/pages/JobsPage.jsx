import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clientJobsApi, clientTicketsApi } from '../services/clientPortalApi';
// ↑ adjust this relative path to wherever clientPortalApi.js actually lives
//   in your client app's folder structure (e.g. './services/clientPortalApi').

/* ────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — mirrors the admin panel's palette so both surfaces feel
   like one product. Plain CSS (no Tailwind) via an injected <style> block.
──────────────────────────────────────────────────────────────────────── */
const CSS = `
.cjp{ --brand:#EA580C; --brand-d:#C2410C; --brand-l:#FFF3EA;
      --bg:#F8FAFC; --white:#FFFFFF; --border:#E7EAEE;
      --h1:#0F172A; --h2:#1E293B; --muted:#64748B; --faint:#94A3B8;
      --mono:'SFMono-Regular',Consolas,'Liberation Mono',monospace;
      --sans:'Inter',system-ui,-apple-system,sans-serif;
      font-family:var(--sans); color:var(--h2); }

.cjp *{ box-sizing:border-box; }

/* ── header ── */
.cjp-hdr{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
.cjp-title{ font-size:22px; font-weight:800; color:var(--h1); letter-spacing:-.3px; }
.cjp-sub{ font-size:13px; color:var(--muted); margin-top:3px; }
.cjp-newbtn{ padding:9px 16px; border-radius:9px; border:none; font-size:13px; font-weight:700;
      background:linear-gradient(135deg,var(--brand),var(--brand-d)); color:#fff; cursor:pointer;
      box-shadow:0 4px 12px rgba(234,88,12,.28); }
.cjp-newbtn:hover{ filter:brightness(1.04); }

/* ── filter tabs ── */
.cjp-tabs-wrap{ overflow-x:auto; padding-bottom:2px; }
.cjp-tabs{ display:flex; background:var(--white); border:1px solid var(--border); border-radius:11px;
      padding:4px; width:max-content; min-width:100%; }
.cjp-tab{ padding:8px 14px; border-radius:8px; font-size:12.5px; font-weight:600; background:transparent;
      color:var(--muted); border:none; cursor:pointer; display:flex; gap:6px; align-items:center;
      white-space:nowrap; transition:all .15s; }
.cjp-tab.active{ background:var(--brand-l); color:var(--brand); }
.cjp-tab .cnt{ font-size:10px; background:#F1F5F9; color:var(--faint); padding:1px 7px; border-radius:99px; }
.cjp-tab.active .cnt{ background:rgba(234,88,12,.15); color:var(--brand); }

/* ── card / table ── */
.cjp-card{ background:var(--white); border:1px solid var(--border); border-radius:16px;
      box-shadow:0 1px 4px rgba(15,23,42,.05); overflow:clip; }
.cjp-toolbar{ padding:14px 16px; border-bottom:1px solid var(--border); display:flex; gap:10px;
      flex-wrap:wrap; align-items:center; }
.cjp-search{ position:relative; flex:1 1 220px; max-width:340px; }
.cjp-search input{ width:100%; padding:9px 12px 9px 32px; border-radius:9px; border:1.5px solid var(--border);
      font-size:13px; outline:none; background:var(--bg); font-family:var(--sans); }
.cjp-search input:focus{ border-color:var(--brand); background:#fff; }
.cjp-search svg{ position:absolute; left:10px; top:50%; transform:translateY(-50%); pointer-events:none; }

.cjp-table-wrap{ overflow-x:auto; }
table.cjp-table{ width:100%; border-collapse:collapse; min-width:720px; }
.cjp-table thead th{ text-align:left; font-size:11px; font-weight:700; letter-spacing:.4px; text-transform:uppercase;
      color:var(--faint); padding:12px 14px; border-bottom:1px solid var(--border); background:#FAFBFC; }
.cjp-table tbody tr{ cursor:pointer; border-bottom:1px solid #EEF1F5; transition:background .12s; }
.cjp-table tbody tr:hover{ background:#FFF8F3; }
.cjp-table td{ padding:13px 14px; vertical-align:middle; }

.cjp-viewbtn{ font-size:11.5px; color:var(--brand); background:none; border:none; cursor:pointer; font-weight:700; }

.cjp-empty{ padding:52px 20px; text-align:center; color:var(--faint); font-size:13px; }

/* ── badges / tags ── */
.cjp-badge{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; padding:4px 10px;
      border-radius:99px; white-space:nowrap; }
.cjp-badge .dot{ width:6px; height:6px; border-radius:99px; background:currentColor; }
.cjp-typetag{ font-size:11px; font-weight:700; padding:4px 10px; border-radius:8px; background:#F1F5F9; color:#475569; }

/* ── detail view ── */
.cjp-back{ display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--muted); background:none;
      border:none; cursor:pointer; font-weight:600; margin-bottom:14px; }
.cjp-back:hover{ color:var(--brand); }
.cjp-crumb{ font-size:12px; color:var(--faint); margin-bottom:4px; }

.cjp-detail-grid{ display:grid; grid-template-columns:1fr 300px; gap:16px; align-items:start; }
@media (max-width:900px){ .cjp-detail-grid{ grid-template-columns:1fr; } }

.cjp-main-card{ background:var(--white); border:1px solid var(--border); border-radius:16px; padding:22px;
      box-shadow:0 1px 4px rgba(15,23,42,.05); }
.cjp-side-card{ background:var(--white); border:1px solid var(--border); border-radius:16px; padding:18px;
      box-shadow:0 1px 4px rgba(15,23,42,.05); margin-bottom:14px; }
.cjp-side-title{ font-size:13px; font-weight:700; color:var(--h1); margin-bottom:12px; }

.cjp-jobid{ font-family:var(--mono); font-weight:700; color:var(--brand); font-size:12px; }
.cjp-customer-name{ font-size:19px; font-weight:800; color:var(--h1); }
.cjp-address{ font-size:12px; color:var(--muted); margin-top:5px; }

.cjp-divider{ height:1px; background:var(--border); margin:16px 0; }

.cjp-field-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:16px 20px; }
@media (max-width:520px){ .cjp-field-grid{ grid-template-columns:1fr; } }
.cjp-field-label{ font-size:10.5px; font-weight:700; color:var(--faint); text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
.cjp-field-value{ font-size:13.5px; color:var(--h2); line-height:1.5; }

.cjp-notes-box{ padding:12px 14px; border-radius:10px; border:1px solid var(--border); background:#F9FAFB;
      font-size:13px; color:var(--h2); line-height:1.6; min-height:60px; }

.cjp-parts-row{ display:grid; grid-template-columns:1fr 60px 90px 90px; gap:8px; padding:9px 0;
      border-top:1px solid var(--border); font-size:12.5px; align-items:center; }
.cjp-parts-row.head{ font-size:10.5px; font-weight:700; color:var(--faint); text-transform:uppercase;
      letter-spacing:.4px; border-top:none; padding-bottom:6px; }
.cjp-parts-amt{ font-family:var(--mono); font-weight:700; text-align:right; }

.cjp-actions{ display:flex; gap:10px; flex-wrap:wrap; margin-top:20px; }
.cjp-abtn{ flex:1 1 140px; padding:11px 14px; border-radius:10px; font-size:12.5px; font-weight:700;
      cursor:pointer; text-align:center; border:1px solid transparent; }
.cjp-abtn.primary{ background:linear-gradient(135deg,var(--brand),var(--brand-d)); color:#fff; border:none;
      box-shadow:0 4px 12px rgba(234,88,12,.28); }
.cjp-abtn.ghost{ background:#F0F9FF; border-color:#BAE6FD; color:#0369A1; }
.cjp-abtn.warn{ background:#FFFBEB; border-color:#FDE68A; color:#B45309; }
.cjp-abtn.subtle{ background:#F8FAFC; border-color:var(--border); color:var(--muted); }
.cjp-abtn.danger{ background:#FEF2F2; border-color:#FECACA; color:#DC2626; }
.cjp-abtn:disabled{ opacity:.5; cursor:not-allowed; }

.cjp-editbtn{ padding:8px 14px; border-radius:9px; font-size:12px; font-weight:700; cursor:pointer;
      background:var(--white); border:1.5px solid var(--brand); color:var(--brand); }
.cjp-editbtn:hover{ background:var(--brand-l); }

/* ── modal ── */
.cjp-modal-overlay{ position:fixed; inset:0; background:rgba(15,23,42,.5); z-index:1000; display:flex;
      align-items:center; justify-content:center; padding:20px; }
.cjp-modal{ background:var(--white); border-radius:16px; width:100%; max-width:600px; max-height:88vh;
      overflow-y:auto; box-shadow:0 24px 64px rgba(0,0,0,.25); }
/* scrollbar-hiding for .cjp-modal is centralized in src/shared/base.css */
.cjp-modal-hdr{ display:flex; justify-content:space-between; align-items:center; padding:18px 22px;
      border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--white); border-radius:16px 16px 0 0; }
.cjp-modal-title{ font-size:16px; font-weight:800; color:var(--h1); }
.cjp-modal-close{ background:#F3F4F6; border:none; width:28px; height:28px; border-radius:7px; font-size:15px;
      color:var(--muted); cursor:pointer; display:flex; align-items:center; justify-content:center; }
.cjp-modal-body{ padding:20px 22px; display:flex; flex-direction:column; gap:14px; }
.cjp-modal-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width:520px){ .cjp-modal-grid{ grid-template-columns:1fr; } }
.cjp-flabel{ display:block; font-size:10.5px; font-weight:700; color:var(--faint); letter-spacing:.06em;
      text-transform:uppercase; margin-bottom:6px; }
.cjp-finput, .cjp-fselect, .cjp-ftextarea{ width:100%; padding:9px 11px; border-radius:8px;
      border:1.5px solid var(--border); font-size:13px; color:var(--h2); background:#FAFAFA;
      font-family:var(--sans); outline:none; box-sizing:border-box; transition:border-color .15s; }
.cjp-finput:focus, .cjp-fselect:focus, .cjp-ftextarea:focus{ border-color:var(--brand); background:#fff; }
.cjp-ftextarea{ resize:vertical; min-height:80px; line-height:1.5; }
.cjp-modal-footer{ display:flex; justify-content:flex-end; gap:10px; padding:16px 22px;
      border-top:1px solid var(--border); position:sticky; bottom:0; background:var(--white); border-radius:0 0 16px 16px; }
.cjp-modal-btn{ padding:9px 20px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:none; }
.cjp-modal-btn.cancel{ background:var(--white); border:1px solid var(--border); color:var(--muted); }
.cjp-modal-btn.save{  background:#EA580C !important;
  color:#fff !important;
  border:none !important;
  box-shadow:0 4px 12px rgba(234,88,12,.28); }
.cjp-modal-err{ font-size:12px; font-weight:600; color:#DC2626; background:#FEF2F2; border:1px solid #FECACA;
      border-radius:8px; padding:9px 12px; }
.cjp-modal-note{ font-size:11.5px; color:var(--faint); margin-top:-6px; }

/* ── status timeline (read-only, client-facing) ── */
.cjp-tl{ display:flex; flex-direction:column; }
.cjp-tl-item{ display:flex; gap:10px; position:relative; padding-bottom:20px; }
.cjp-tl-item:last-child{ padding-bottom:0; }
.cjp-tl-line{ position:absolute; left:11px; top:24px; bottom:0; width:2px; background:var(--border); }
.cjp-tl-item.done .cjp-tl-line{ background:var(--brand); }
.cjp-tl-dot{ width:24px; height:24px; border-radius:99px; display:flex; align-items:center; justify-content:center;
      font-size:12px; flex-shrink:0; background:#F1F5F9; color:var(--faint); border:2px solid var(--border); z-index:1; }
.cjp-tl-item.done .cjp-tl-dot{ background:var(--brand); border-color:var(--brand); color:#fff; }
.cjp-tl-item.current .cjp-tl-dot{ background:var(--brand-l); border-color:var(--brand); color:var(--brand); }
.cjp-tl-label{ font-size:12.5px; font-weight:700; color:var(--h2); }
.cjp-tl-item.done .cjp-tl-label{ color:var(--h1); }
.cjp-tl-sub{ font-size:11px; color:var(--faint); margin-top:1px; }

/* ── technician card ── */
.cjp-tech-row{ display:flex; align-items:center; gap:10px; }
.cjp-avatar{ width:38px; height:38px; border-radius:99px; background:var(--brand-l); color:var(--brand);
      display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; flex-shrink:0; }
.cjp-tech-name{ font-size:13.5px; font-weight:700; color:var(--h1); }
.cjp-tech-role{ font-size:11.5px; color:var(--faint); margin-top:1px; }
.cjp-tech-unassigned{ font-size:12.5px; color:var(--muted); font-style:italic; }

/* ── cost summary ── */
.cjp-cost-row{ display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--border); font-size:12.5px; }
.cjp-cost-row span:last-child{ font-family:var(--mono); font-weight:600; color:var(--h2); }
.cjp-cost-total{ display:flex; justify-content:space-between; padding:10px 0 0; font-size:14.5px; font-weight:800; }
.cjp-cost-total span:last-child{ font-family:var(--mono); color:var(--brand); }

/* ── toast ── */
.cjp-toast{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 16px;
      border-radius:10px; font-size:13px; font-weight:600; margin-bottom:14px; animation:cjpFade .2s ease; }
.cjp-toast.success{ background:#ECFDF5; border:1px solid #A7F3D0; color:#047857; }
.cjp-toast.info{ background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; }
.cjp-toast.error{ background:#FEF2F2; border:1px solid #FECACA; color:#B91C1C; }
.cjp-toast-x{ background:none; border:none; cursor:pointer; font-size:15px; color:inherit; opacity:.6; line-height:1; }
.cjp-toast-x:hover{ opacity:1; }
@keyframes cjpFade{ from{ opacity:0; transform:translateY(-4px); } to{ opacity:1; transform:translateY(0); } }

/* ── star rating ── */
.cjp-stars{ display:flex; gap:6px; margin:6px 0 4px; }
.cjp-star{ font-size:30px; line-height:1; cursor:pointer; color:#E2E8F0; background:none; border:none; padding:0; transition:transform .1s; }
.cjp-star.filled{ color:#F59E0B; }
.cjp-star:hover{ transform:scale(1.12); }

/* ── generic confirm modal ── */
.cjp-confirm-icon{ width:44px; height:44px; border-radius:99px; display:flex; align-items:center; justify-content:center;
      font-size:20px; margin-bottom:12px; }

/* ── invoice preview ── */
.cjp-inv-hdr{ display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:14px; border-bottom:2px solid var(--h1); margin-bottom:14px; }
.cjp-inv-brand{ font-size:16px; font-weight:800; color:var(--h1); }
.cjp-inv-row{ display:flex; justify-content:space-between; padding:6px 0; font-size:12.5px; border-bottom:1px dashed var(--border); }
.cjp-inv-total{ display:flex; justify-content:space-between; padding:10px 0 0; font-size:15px; font-weight:800; color:var(--brand); }
`;

/* ── mock data (client's own jobs only) ─────────────────────────────── */
const STATUS_MAP = {
  new: {
    label: 'New',
    color: "var(--info-text)",
    bg: "var(--info-bg)"
  },
  assigned: {
    label: 'Assigned',
    color: "var(--warning)",
    bg: "var(--warning-bg)"
  },
  in_progress: {
    label: 'In Progress',
    color: "var(--purple-text)",
    bg: "var(--purple-bg)"
  },
  completed: {
    label: 'Completed',
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  invoiced: {
    label: 'Invoiced',
    color: "var(--info-text)",
    bg: "var(--info-bg)"
  },
  cancelled: {
    label: 'Cancelled',
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  }
};
const TIMELINE_STEPS = [{
  key: 'new',
  label: 'Request Received'
}, {
  key: 'assigned',
  label: 'Technician Assigned'
}, {
  key: 'in_progress',
  label: 'Service In Progress'
}, {
  key: 'completed',
  label: 'Service Completed'
}, {
  key: 'invoiced',
  label: 'Invoice Generated'
}];
const JOB_TYPES = ['Service', 'Repair', 'Installation', 'AMC Visit'];

/* ── Maps a raw Job document (as returned by /client-portal/me/jobs) to the
   shape this UI works with. Field names here match your actual Mongoose
   schema: `remarks` (not `notes`), `parts[].cost` (not `rate`), `technician`
   populated as { name }, `scheduledDate`/`scheduledTime`, etc. ───────────── */
const normaliseJob = j => ({
  _id: j._id,
  id: j.jobId || `JOB-${String(j._id).slice(-6).toUpperCase()}`,
  type: j.type || 'Service',
  ac: j.ac || '',
  issue: j.issue || '',
  address: j.address || '',
  date: j.scheduledDate ? new Date(j.scheduledDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : '',
  rawDate: j.scheduledDate ? new Date(j.scheduledDate).toISOString().slice(0, 10) : '',
  time: j.scheduledTime || '',
  tech: j.technician?.name || j.techName || 'Unassigned',
  techRole: j.technician?.role || '',
  amount: j.amount || 0,
  status: j.status || 'new',
  notes: j.remarks || '',
  parts: (j.parts || []).map(p => ({
    name: p.name,
    qty: p.qty,
    rate: p.cost,
    amount: (p.qty || 0) * (p.cost || 0)
  })),
  rating: j.rating,
  ratingComment: j.ratingComment,
  rescheduleRequest: j.rescheduleRequest
});

/* ── New Job modal — trimmed to what a client should control.
   No priority / technician / customer-select — those are dispatch
   decisions the admin makes, not the client. ─────────────────────────── */
const NewJobModal = ({
  open,
  onClose,
  onCreate,
  accountAddress,
  accountPhone
}) => {
  const EMPTY = {
    type: 'Service',
    ac: '',
    date: '',
    time: '10:00',
    issue: '',
    address: accountAddress || '',
    phone: accountPhone || ''
  };
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  if (!open) return null;
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const handleSave = () => {
    setError('');
    if (!form.ac.trim()) return setError('Please tell us which AC unit this is for.');
    if (!form.issue.trim()) return setError('Please describe the issue or request.');
    if (!form.date) return setError('Please pick a preferred date.');
    onCreate({
      ...form,
      rawDate: form.date,
      // ISO yyyy-mm-dd — what the backend actually needs
      date: new Date(form.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    });
    setForm(EMPTY);
  };
  const handleClose = () => {
    setForm(EMPTY);
    setError('');
    onClose();
  };
  return createPortal(<div className="cjp-modal-overlay" onClick={handleClose}>
      <div className="cjp-modal" onClick={e => e.stopPropagation()}>
        <div className="cjp-modal-hdr">
          <div className="cjp-modal-title">➕ Request New Job</div>
          <button className="cjp-modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="cjp-modal-body">
          <div className="cjp-modal-grid">
            <div>
              <label className="cjp-flabel">Job Type *</label>
              <select className="cjp-fselect" value={form.type} onChange={set('type')}>
                {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="cjp-flabel">AC Unit / Model *</label>
              <input className="cjp-finput" placeholder="e.g. Daikin 1.5T Inverter" value={form.ac} onChange={set('ac')} />
            </div>
            <div>
              <label className="cjp-flabel">Preferred Date *</label>
              <input className="cjp-finput" type="date" value={form.date} onChange={set('date')} />
            </div>
            <div>
              <label className="cjp-flabel">Preferred Time</label>
              <input className="cjp-finput" type="time" value={form.time} onChange={set('time')} />
            </div>
          </div>

          <div>
            <label className="cjp-flabel">Issue / Description *</label>
            <textarea className="cjp-ftextarea" placeholder="Tell us what's going on — noise, cooling issue, scheduled maintenance, new installation…" value={form.issue} onChange={set('issue')} />
          </div>

          <div className="cjp-modal-grid">
            <div>
              <label className="cjp-flabel">Site Address</label>
              <input className="cjp-finput" value={form.address} onChange={set('address')} />
            </div>
            <div>
              <label className="cjp-flabel">Contact Phone</label>
              <input className="cjp-finput" type="tel" value={form.phone} onChange={set('phone')} />
            </div>
          </div>
          <div className="cjp-modal-note">A technician will be assigned by our team once your request is reviewed.</div>

          {error && <div className="cjp-modal-err">{error}</div>}
        </div>

        <div className="cjp-modal-footer">
          <button className="cjp-modal-btn cancel" onClick={handleClose}>Cancel</button>
          <button className="cjp-modal-btn save" onClick={handleSave}>Submit Request</button>
        </div>
      </div>
    </div>, document.getElementById('client-portal-root') || document.body);
};

/* ── Edit Job modal — only ever opened for jobs still in "New" status,
   restricted to fields a client should be able to change themselves. ─── */
const EditJobModal = ({
  open,
  onClose,
  onSave,
  job
}) => {
  const [form, setForm] = useState(job || {});
  const [error, setError] = useState('');
  useEffect(() => {
    if (job) setForm(job);
  }, [job]);
  if (!open || !job) return null;
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const handleSave = () => {
    setError('');
    if (!form.ac.trim()) return setError('AC unit is required.');
    if (!form.issue.trim()) return setError('Issue description is required.');
    onSave(form);
  };
  return createPortal(<div className="cjp-modal-overlay" onClick={onClose}>
      <div className="cjp-modal" onClick={e => e.stopPropagation()}>
        <div className="cjp-modal-hdr">
          <div className="cjp-modal-title">✏️ Edit Request — {job.id}</div>
          <button className="cjp-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="cjp-modal-body">
          <div className="cjp-modal-grid">
            <div>
              <label className="cjp-flabel">Job Type</label>
              <select className="cjp-fselect" value={form.type} onChange={set('type')}>
                {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="cjp-flabel">AC Unit / Model *</label>
              <input className="cjp-finput" value={form.ac} onChange={set('ac')} />
            </div>
          </div>
          <div>
            <label className="cjp-flabel">Issue / Description *</label>
            <textarea className="cjp-ftextarea" value={form.issue} onChange={set('issue')} />
          </div>
          <div className="cjp-modal-grid">
            <div>
              <label className="cjp-flabel">Preferred Date</label>
              <input className="cjp-finput" type="date" value={form.rawDate || ''} onChange={set('rawDate')} />
            </div>
            <div>
              <label className="cjp-flabel">Preferred Time</label>
              <input className="cjp-finput" type="time" value={form.time} onChange={set('time')} />
            </div>
          </div>
          <div>
            <label className="cjp-flabel">Site Address</label>
            <input className="cjp-finput" value={form.address} onChange={set('address')} />
          </div>
          <div className="cjp-modal-note">You can only edit a request before it's been assigned to a technician.</div>

          {error && <div className="cjp-modal-err">{error}</div>}
        </div>

        <div className="cjp-modal-footer">
          <button className="cjp-modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="cjp-modal-btn save" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>, document.getElementById('client-portal-root') || document.body);
};

/* ── shared helper: trigger a plain-text file download (no backend) ──── */
const downloadText = (content, filename) => {
  const blob = new Blob([content], {
    type: 'text/plain'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ── Request Reschedule modal ─────────────────────────────────────────── */
const RescheduleModal = ({
  open,
  onClose,
  onConfirm,
  job
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setDate('');
      setTime('');
      setReason('');
      setError('');
    }
  }, [open]);
  if (!open || !job) return null;
  const submit = () => {
    if (!date) return setError('Please pick a new preferred date.');
    onConfirm({
      date: new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      time: time || job.time,
      reason
    });
  };
  return createPortal(<div className="cjp-modal-overlay" onClick={onClose}>
      <div className="cjp-modal cp-jobs-page-1" onClick={e => e.stopPropagation()}>
        <div className="cjp-modal-hdr">
          <div className="cjp-modal-title">📅 Request Reschedule</div>
          <button className="cjp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="cjp-modal-body">
          <div className="cjp-modal-note cp-jobs-page-2">
            Current schedule: <strong>{job.date}{job.time ? `, ${job.time}` : ''}</strong>
          </div>
          <div className="cjp-modal-grid">
            <div>
              <label className="cjp-flabel">New Preferred Date *</label>
              <input className="cjp-finput" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="cjp-flabel">New Preferred Time</label>
              <input className="cjp-finput" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="cjp-flabel">Reason (optional)</label>
            <textarea className="cjp-ftextarea cp-jobs-page-3" placeholder="e.g. Won't be available at the original time…" value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          {error && <div className="cjp-modal-err">{error}</div>}
        </div>
        <div className="cjp-modal-footer">
          <button className="cjp-modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="cjp-modal-btn save" onClick={submit}>Send Request</button>
        </div>
      </div>
    </div>, document.getElementById('client-portal-root') || document.body);
};

/* ── Rate This Service modal ──────────────────────────────────────────── */
const RatingModal = ({
  open,
  onClose,
  onSubmit,
  job
}) => {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setStars(job?.rating || 0);
      setComment(job?.ratingComment || '');
      setError('');
      setHover(0);
    }
  }, [open, job]);
  if (!open || !job) return null;
  const submit = () => {
    if (!stars) return setError('Please select a star rating.');
    onSubmit({
      rating: stars,
      ratingComment: comment
    });
  };
  return createPortal(<div className="cjp-modal-overlay" onClick={onClose}>
      <div className="cjp-modal cp-jobs-page-4" onClick={e => e.stopPropagation()}>
        <div className="cjp-modal-hdr">
          <div className="cjp-modal-title">★ Rate This Service</div>
          <button className="cjp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="cjp-modal-body">
          <div className="cjp-modal-note cp-jobs-page-5">
            How was the service for <strong>{job.id}</strong> — {job.ac}?
          </div>
          <div>
            <div className="cjp-stars">
              {[1, 2, 3, 4, 5].map(n => <button key={n} type="button" className={`cjp-star ${(hover || stars) >= n ? 'filled' : ''}`} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setStars(n)}>★</button>)}
            </div>
          </div>
          <div>
            <label className="cjp-flabel">Comments (optional)</label>
            <textarea className="cjp-ftextarea cp-jobs-page-6" placeholder="Tell us about your experience…" value={comment} onChange={e => setComment(e.target.value)} />
          </div>
          {error && <div className="cjp-modal-err">{error}</div>}
        </div>
        <div className="cjp-modal-footer">
          <button className="cjp-modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="cjp-modal-btn save" onClick={submit}>Submit Rating</button>
        </div>
      </div>
    </div>, document.getElementById('client-portal-root') || document.body);
};

/* ── Raise Support Ticket modal ───────────────────────────────────────── */
const TICKET_ISSUE_TYPES = ['Not Cooling', 'Water Leakage', 'Strange Noise', 'Billing Query', 'Reschedule Help', 'Other'];
const SupportTicketModal = ({
  open,
  onClose,
  onSubmit,
  job
}) => {
  const [subject, setSubject] = useState('');
  const [issueType, setIssueType] = useState(TICKET_ISSUE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setSubject('');
      setIssueType(TICKET_ISSUE_TYPES[0]);
      setDescription('');
      setError('');
    }
  }, [open]);
  if (!open) return null;
  const submit = () => {
    if (!subject.trim()) return setError('Please add a short subject.');
    if (!description.trim()) return setError('Please describe the issue.');
    onSubmit({
      subject: subject.trim(),
      issueType,
      description: description.trim()
    });
  };
  return createPortal(<div className="cjp-modal-overlay" onClick={onClose}>
      <div className="cjp-modal cp-jobs-page-7" onClick={e => e.stopPropagation()}>
        <div className="cjp-modal-hdr">
          <div className="cjp-modal-title">💬 Raise Support Ticket</div>
          <button className="cjp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="cjp-modal-body">
          {job && <div className="cjp-modal-note cp-jobs-page-8">Linked to job <strong>{job.id}</strong></div>}
          <div>
            <label className="cjp-flabel">Subject *</label>
            <input className="cjp-finput" placeholder="Brief description of the issue…" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="cjp-flabel">Issue Type</label>
            <select className="cjp-fselect" value={issueType} onChange={e => setIssueType(e.target.value)}>
              {TICKET_ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="cjp-flabel">Description *</label>
            <textarea className="cjp-ftextarea" placeholder="Give us the details…" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          {error && <div className="cjp-modal-err">{error}</div>}
        </div>
        <div className="cjp-modal-footer">
          <button className="cjp-modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="cjp-modal-btn save" onClick={submit}>Raise Ticket</button>
        </div>
      </div>
    </div>, document.getElementById('client-portal-root') || document.body);
};

/* ── generic confirm modal (used for Cancel Request) ──────────────────── */
const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false
}) => {
  if (!open) return null;
  return createPortal(<div className="cjp-modal-overlay" onClick={onClose}>
      <div className="cjp-modal cp-jobs-page-9" onClick={e => e.stopPropagation()}>
        <div className="cjp-modal-body cp-jobs-page-10">
          <div className="cjp-confirm-icon" style={{
          background: danger ? "var(--danger-bg)" : "var(--warning-bg)",
          color: danger ? "var(--danger-text)" : "var(--warning-text)"
        }}>
            {danger ? '✕' : '!'}
          </div>
          <div className="cp-jobs-page-11">{title}</div>
          <div className="cp-jobs-page-12">{message}</div>
        </div>
        <div className="cjp-modal-footer">
          <button className="cjp-modal-btn cancel" onClick={onClose}>Go Back</button>
          <button className="cjp-modal-btn save" style={danger ? {
          background: 'linear-gradient(135deg,#DC2626,#B91C1C)',
          boxShadow: '0 4px 12px rgba(220,38,38,.28)'
        } : {}} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>, document.getElementById('client-portal-root') || document.body);
};

/* ── Invoice preview modal — fetches the real Invoice document.
   Matches your actual Invoice.model.js: items are { name, qty, rate, gst },
   with subtotal/gstAmount/total computed server-side on save. ─────────── */
const InvoiceModal = ({
  open,
  onClose,
  job
}) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open || !job) return;
    setLoading(true);
    setError('');
    setInvoice(null);
    clientJobsApi.invoice(job._id).then(res => setInvoice(res.data)).catch(err => setError(err.message || 'Could not load the invoice.')).finally(() => setLoading(false));
  }, [open, job]);
  if (!open || !job) return null;
  const items = invoice?.items || [];
  const subtotal = invoice?.subtotal ?? job.amount;
  const gstAmount = invoice?.gstAmount ?? 0;
  const total = invoice?.total ?? job.amount;
  const download = () => {
    const lines = ['COOLTECH AC SERVICES', '='.repeat(32), `Invoice ${invoice?.invoiceNo || job.id}`, `Date: ${invoice?.date || job.date}`, '', `AC Unit: ${job.ac}`, `Address: ${job.address}`, '', '-'.repeat(32), ...items.map(it => `${it.name.padEnd(24)}${it.qty} x ₹${it.rate}  ₹${(it.qty * it.rate).toLocaleString()}`), '-'.repeat(32), `SUBTOTAL                  ₹${Number(subtotal).toLocaleString()}`, `GST                       ₹${Number(gstAmount).toLocaleString()}`, `TOTAL                     ₹${Number(total).toLocaleString()}`, '', 'Thank you for choosing CoolTech AC Services.'].filter(Boolean).join('\n');
    downloadText(lines, `${invoice?.invoiceNo || job.id}-invoice.txt`);
  };
  return createPortal(<div className="cjp-modal-overlay" onClick={onClose}>
      <div className="cjp-modal cp-jobs-page-13" onClick={e => e.stopPropagation()}>
        <div className="cjp-modal-hdr">
          <div className="cjp-modal-title">🧾 Invoice — {job.id}</div>
          <button className="cjp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="cjp-modal-body">
          {loading && <div className="cp-jobs-page-14">Loading invoice…</div>}
          {error && <div className="cjp-modal-err">{error}</div>}
          {!loading && !error && <>
              <div className="cjp-inv-hdr">
                <div>
                  <div className="cjp-inv-brand">CoolTech AC Services</div>
                  <div className="cp-jobs-page-15">{invoice?.date || job.date}</div>
                  {invoice?.dueDate && <div className="cp-jobs-page-16">Due: {invoice.dueDate}</div>}
                </div>
                <div className="cp-jobs-page-17">
                  <div className="cp-jobs-page-18">{invoice?.invoiceNo || job.id}</div>
                  {job.ac}
                  {invoice?.status && <div className="cp-jobs-page-19">
                      <SBadge s={invoice.status === 'paid' ? 'completed' : 'invoiced'} />
                    </div>}
                </div>
              </div>
              {items.length > 0 ? items.map((it, i) => <div className="cjp-inv-row" key={i}>
                    <span>{it.name} <span className="cp-jobs-page-20">× {it.qty}</span></span>
                    <span>₹{(it.qty * it.rate).toLocaleString()}</span>
                  </div>) : <div className="cjp-inv-row"><span>{job.type} — {job.issue}</span><span>₹{Number(total).toLocaleString()}</span></div>}
              {items.length > 0 && <>
                  <div className="cjp-inv-row"><span>Subtotal</span><span>₹{Number(subtotal).toLocaleString()}</span></div>
                  <div className="cjp-inv-row"><span>GST</span><span>₹{Number(gstAmount).toLocaleString()}</span></div>
                </>}
              <div className="cjp-inv-total"><span>Total</span><span>₹{Number(total).toLocaleString()}</span></div>
            </>}
        </div>
        <div className="cjp-modal-footer">
          <button className="cjp-modal-btn cancel" onClick={onClose}>Close</button>
          <button className="cjp-modal-btn save" disabled={loading || !!error} onClick={download}>⬇ Download</button>
        </div>
      </div>
    </div>, document.getElementById('client-portal-root') || document.body);
};
const SBadge = ({
  s
}) => {
  const m = STATUS_MAP[s] ?? {
    label: s,
    color: '#64748B',
    bg: '#F1F5F9'
  };
  return <span className="cjp-badge" style={{
    background: m.bg,
    color: m.color
  }}>
      <span className="dot" />{m.label}
    </span>;
};
const TypeTag = ({
  type
}) => <span className="cjp-typetag">{type}</span>;
const Avatar = ({
  name
}) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <div className="cjp-avatar">{initials}</div>;
};
const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>;

/* ── main component ──────────────────────────────────────────────────── */
export default function JobsPage() {
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [showNewJob, setShowNewJob] = useState(false);
  const [showEditJob, setShowEditJob] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [toast, setToast] = useState(null); // { type, msg }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  const fetchJobs = () => {
    setLoading(true);
    setLoadError('');
    clientJobsApi.list().then(res => setJobsList((res?.data || []).map(normaliseJob))).catch(err => setLoadError(err.message || 'Failed to load your jobs.')).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchJobs();
  }, []);
  const counts = Object.keys(STATUS_MAP).reduce((a, s) => ({
    ...a,
    [s]: jobsList.filter(j => j.status === s).length
  }), {});
  const filtered = jobsList.filter(j => filter === 'all' || j.status === filter).filter(j => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [j.id, j.type, j.ac, j.issue, j.tech].some(v => v.toLowerCase().includes(q));
  });

  // openId tracks the job's real Mongo _id — the jobId (e.g. "JOB-1042") is
  // just a display label and isn't guaranteed unique/stable to route on.
  const job = openId ? jobsList.find(j => j._id === openId) : null;
  const updateJob = (_id, patch) => setJobsList(prev => prev.map(j => j._id === _id ? {
    ...j,
    ...patch
  } : j));
  const handleCreateJob = form => {
    clientJobsApi.create({
      type: form.type,
      ac: form.ac,
      issue: form.issue,
      scheduledDate: form.rawDate,
      // ISO date the backend can parse
      scheduledTime: form.time,
      address: form.address
    }).then(res => {
      const newJob = normaliseJob(res.data);
      setJobsList(prev => [newJob, ...prev]);
      setShowNewJob(false);
      setToast({
        type: 'success',
        msg: `${newJob.id} submitted — our team will review and assign a technician shortly.`
      });
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not submit your request.'
    }));
  };
  const handleEditSave = updated => {
    clientJobsApi.update(updated._id, {
      type: updated.type,
      ac: updated.ac,
      issue: updated.issue,
      scheduledDate: updated.rawDate,
      scheduledTime: updated.time,
      address: updated.address
    }).then(res => {
      updateJob(updated._id, normaliseJob(res.data));
      setShowEditJob(false);
      setToast({
        type: 'success',
        msg: 'Your request has been updated.'
      });
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not update your request.'
    }));
  };
  const handleReschedule = ({
    date,
    time,
    reason
  }) => {
    clientJobsApi.reschedule(job._id, {
      requestedDate: date,
      requestedTime: time,
      reason
    }).then(res => {
      updateJob(job._id, normaliseJob(res.data));
      setShowReschedule(false);
      setToast({
        type: 'info',
        msg: `Reschedule requested for ${date}${time ? `, ${time}` : ''}. Awaiting confirmation from our team.`
      });
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not submit reschedule request.'
    }));
  };
  const handleRate = ({
    rating,
    ratingComment
  }) => {
    clientJobsApi.rate(job._id, {
      rating,
      ratingComment
    }).then(res => {
      updateJob(job._id, normaliseJob(res.data));
      setShowRating(false);
      setToast({
        type: 'success',
        msg: 'Thanks for rating our service!'
      });
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not submit your rating.'
    }));
  };
  const handleRaiseTicket = ({
    subject,
    issueType,
    description
  }) => {
    clientTicketsApi.create({
      subject,
      priority: 'medium',
      description,
      job: job?._id
    }).then(res => {
      const ticketId = res?.data?.ticketId || res?.data?._id;
      setShowTicket(false);
      setToast({
        type: 'success',
        msg: `Ticket ${ticketId} raised for "${subject}". Our support team will contact you shortly.`
      });
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not raise the ticket.'
    }));
  };
  const handleConfirmCancel = () => {
    clientJobsApi.cancel(job._id).then(res => {
      updateJob(job._id, normaliseJob(res.data));
      setShowCancelConfirm(false);
      setToast({
        type: 'info',
        msg: 'Your request has been cancelled.'
      });
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not cancel this request.'
    }));
  };
  const handlePrint = () => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${job.id} — Job Details</title>
      <style>
        body{ font-family:sans-serif; padding:32px; color:#0F172A; }
        h2{ font-size:18px; margin-bottom:2px; } p{ font-size:12px; color:#64748B; margin:0 0 20px; }
        table{ border-collapse:collapse; width:100%; font-size:13px; }
        td{ padding:8px 0; border-bottom:1px solid #E2E8F0; } td:first-child{ color:#64748B; width:160px; }
      </style></head><body>
      <h2>CoolTech AC Services — ${job.id}</h2>
      <p>${job.type} · ${STATUS_MAP[job.status]?.label ?? job.status}</p>
      <table>
        <tr><td>AC Unit</td><td>${job.ac}</td></tr>
        <tr><td>Issue</td><td>${job.issue}</td></tr>
        <tr><td>Scheduled</td><td>${job.date}${job.time ? ', ' + job.time : ''}</td></tr>
        <tr><td>Technician</td><td>${job.tech}</td></tr>
        <tr><td>Address</td><td>${job.address}</td></tr>
        <tr><td>Amount</td><td>₹${job.amount.toLocaleString()}</td></tr>
      </table>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  /* ── Loading / error states (initial fetch) ── */
  if (loading) {
    return <div className="cjp">
        <style>{CSS}</style>
        <div className="cp-jobs-page-21">
          Loading your service jobs…
        </div>
      </div>;
  }
  if (loadError) {
    return <div className="cjp">
        <style>{CSS}</style>
        <div className="cjp-toast error cp-jobs-page-22">
          <span>{loadError}</span>
          <button className="cjp-toast-x" onClick={fetchJobs}>↻ Retry</button>
        </div>
      </div>;
  }

  /* ── Detail view ── */
  if (job) {
    const stepIndex = TIMELINE_STEPS.findIndex(s => s.key === job.status);
    const isCancelled = job.status === 'cancelled';
    const canEdit = job.status === 'new';
    const reschedulePending = job.rescheduleRequest?.status === 'pending';
    const partsTotal = job.parts.reduce((s, p) => s + p.amount, 0);
    const labour = job.parts.length ? 1200 : 0;
    const serviceCharge = job.parts.length ? 500 : 0;
    const subtotal = partsTotal + labour + serviceCharge || job.amount;
    const gst = Math.round(subtotal * 0.18 / 1.18);
    return <div className="cjp">
        <style>{CSS}</style>

        <div className="cp-jobs-page-23">
          <button className="cjp-back" onClick={() => setOpenId(null)}>← Back to My Service Jobs</button>
          {canEdit && <button className="cjp-editbtn" onClick={() => setShowEditJob(true)}>✏️ Edit Request</button>}
        </div>

        {toast && <div className={`cjp-toast ${toast.type}`}>
            <span>{toast.msg}</span>
            <button className="cjp-toast-x" onClick={() => setToast(null)}>×</button>
          </div>}

        <div className="cjp-detail-grid">
          {/* main card */}
          <div className="cjp-main-card">
            <div className="cp-jobs-page-24">
              <TypeTag type={job.type} />
              <SBadge s={job.status} />
            </div>

            <div className="cp-jobs-page-25">
              <div>
                <div className="cjp-customer-name">{job.id}</div>
                <div className="cjp-address">📍 {job.address}</div>
              </div>
              <div className="cp-jobs-page-26">
                <div className="cjp-jobid">Amount ₹{job.amount.toLocaleString()}</div>
              </div>
            </div>

            <div className="cjp-divider" />

            <div className="cjp-field-grid">
              <div>
                <div className="cjp-field-label">AC Unit</div>
                <div className="cjp-field-value">{job.ac}</div>
              </div>
              <div>
                <div className="cjp-field-label">Issue / Description</div>
                <div className="cjp-field-value">{job.issue}</div>
              </div>
              <div>
                <div className="cjp-field-label">Scheduled</div>
                <div className="cjp-field-value">{job.date}{job.time ? `, ${job.time}` : ''}</div>
              </div>
              <div>
                <div className="cjp-field-label">Technician</div>
                <div className="cjp-field-value">{job.tech}</div>
              </div>
            </div>

            <div className="cjp-divider" />

            {reschedulePending && <div className="cjp-modal-note cp-jobs-page-27">
                ⏳ Reschedule requested for{' '}
                {job.rescheduleRequest.requestedDate ? new Date(job.rescheduleRequest.requestedDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }) : ''}
                {job.rescheduleRequest.requestedTime ? `, ${job.rescheduleRequest.requestedTime}` : ''} — awaiting confirmation.
              </div>}

            <div>
              <div className="cjp-side-title">Service Notes</div>
              <div className="cjp-notes-box">
                {job.notes || 'No notes added yet — the technician will update this after the visit.'}
              </div>
            </div>

            {job.parts.length > 0 && <div className="cp-jobs-page-28">
                <div className="cjp-side-title">Parts Used</div>
                <div className="cjp-parts-row head">
                  <span>Part</span><span>Qty</span><span className="cp-jobs-page-29">Rate</span><span className="cp-jobs-page-30">Amount</span>
                </div>
                {job.parts.map((p, i) => <div className="cjp-parts-row" key={i}>
                    <span>{p.name}</span>
                    <span>{p.qty}</span>
                    <span className="cjp-parts-amt">₹{p.rate.toLocaleString()}</span>
                    <span className="cjp-parts-amt">₹{p.amount.toLocaleString()}</span>
                  </div>)}
              </div>}

            {job.rating && <div className="cp-jobs-page-31">
                <div className="cjp-side-title">Your Rating</div>
                <div className="cp-jobs-page-32">
                  {'★'.repeat(job.rating)}{'☆'.repeat(5 - job.rating)}
                </div>
                {job.ratingComment && <div className="cp-jobs-page-33">{job.ratingComment}</div>}
              </div>}

            {/* client-facing actions */}
            <div className="cjp-actions">
              {job.status === 'invoiced' && <button className="cjp-abtn primary" onClick={() => setShowInvoice(true)}>⬇ Download Invoice</button>}
              {job.status === 'completed' && <button className="cjp-abtn primary" onClick={() => setShowRating(true)}>
                  {job.rating ? '★ Update Rating' : '★ Rate This Service'}
                </button>}
              {!isCancelled && job.status !== 'invoiced' && job.status !== 'completed' && <button className="cjp-abtn warn" disabled={reschedulePending} onClick={() => setShowReschedule(true)}>
                  📅 {reschedulePending ? 'Reschedule Pending' : 'Request Reschedule'}
                </button>}
              <button className="cjp-abtn ghost" onClick={() => setShowTicket(true)}>💬 Raise Support Ticket</button>
              {!isCancelled && job.status !== 'invoiced' && job.status !== 'completed' && <button className="cjp-abtn danger" onClick={() => setShowCancelConfirm(true)}>✕ Cancel Request</button>}
              <button className="cjp-abtn subtle" onClick={handlePrint}>🖨 Print Details</button>
            </div>
          </div>

          {/* sidebar */}
          <div>
            <div className="cjp-side-card">
              <div className="cjp-side-title">Job Status</div>
              {isCancelled ? <div className="cjp-tl-item done">
                  <div className="cjp-tl-dot cp-jobs-page-34">✕</div>
                  <div><div className="cjp-tl-label cp-jobs-page-35">Cancelled</div>
                    <div className="cjp-tl-sub">This visit was cancelled</div></div>
                </div> : <div className="cjp-tl">
                  {TIMELINE_STEPS.map((s, i) => {
                const done = i < stepIndex,
                  current = i === stepIndex;
                return <div className={`cjp-tl-item ${done ? 'done' : ''} ${current ? 'current' : ''}`} key={s.key}>
                        {i < TIMELINE_STEPS.length - 1 && <div className="cjp-tl-line" />}
                        <div className="cjp-tl-dot">{done ? '✓' : i + 1}</div>
                        <div>
                          <div className="cjp-tl-label">{s.label}</div>
                          {current && <div className="cjp-tl-sub">Current stage</div>}
                        </div>
                      </div>;
              })}
                </div>}
            </div>

            <div className="cjp-side-card">
              <div className="cjp-side-title">Assigned Technician</div>
              {job.tech && job.tech !== 'Unassigned' ? <div className="cjp-tech-row">
                  <Avatar name={job.tech} />
                  <div>
                    <div className="cjp-tech-name">{job.tech}</div>
                    <div className="cjp-tech-role">{job.techRole}</div>
                  </div>
                </div> : <div className="cjp-tech-unassigned">Not yet assigned</div>}
            </div>

            <div className="cjp-side-card">
              <div className="cjp-side-title">Cost Summary</div>
              {job.parts.length > 0 && <>
                  <div className="cjp-cost-row"><span>Labour</span><span>₹{labour.toLocaleString()}</span></div>
                  <div className="cjp-cost-row"><span>Parts</span><span>₹{partsTotal.toLocaleString()}</span></div>
                  <div className="cjp-cost-row"><span>Service Charge</span><span>₹{serviceCharge.toLocaleString()}</span></div>
                  <div className="cjp-cost-row"><span>GST (18%)</span><span>₹{gst.toLocaleString()}</span></div>
                </>}
              <div className="cjp-cost-total"><span>Total{job.parts.length ? ' (incl. GST)' : ''}</span><span>₹{job.amount.toLocaleString()}</span></div>
            </div>
          </div>
        </div>

        <EditJobModal open={showEditJob} job={job} onClose={() => setShowEditJob(false)} onSave={handleEditSave} />
        <RescheduleModal open={showReschedule} job={job} onClose={() => setShowReschedule(false)} onConfirm={handleReschedule} />
        <RatingModal open={showRating} job={job} onClose={() => setShowRating(false)} onSubmit={handleRate} />
        <SupportTicketModal open={showTicket} job={job} onClose={() => setShowTicket(false)} onSubmit={handleRaiseTicket} />
        <ConfirmModal open={showCancelConfirm} title="Cancel this request?" message={`This will cancel ${job.id}. You can always raise a new job request later.`} confirmLabel="Yes, Cancel Request" danger onClose={() => setShowCancelConfirm(false)} onConfirm={handleConfirmCancel} />
        <InvoiceModal open={showInvoice} job={job} onClose={() => setShowInvoice(false)} />
      </div>;
  }

  /* ── List view ── */
  return <div className="cjp">
      <style>{CSS}</style>

      <div className="cjp-hdr">
        <div>
          <div className="cjp-title">My Service Jobs</div>
          <div className="cjp-sub">All service visits and work orders for your account</div>
        </div>
        <button className="cjp-newbtn" onClick={() => setShowNewJob(true)}>+ New Job</button>
      </div>

      {toast && <div className={`cjp-toast ${toast.type}`}>
          <span>{toast.msg}</span>
          <button className="cjp-toast-x" onClick={() => setToast(null)}>×</button>
        </div>}

      <div className="cjp-tabs-wrap cp-jobs-page-36">
        <div className="cjp-tabs">
          {[['all', 'All Jobs', jobsList.length], ...Object.entries(STATUS_MAP).map(([k, v]) => [k, v.label, counts[k] || 0])].map(([k, label, c]) => <button key={k} className={`cjp-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
                {label}<span className="cnt">{c}</span>
              </button>)}
        </div>
      </div>

      <div className="cjp-card">
        <div className="cjp-toolbar">
          <div className="cjp-search">
            <SearchIcon />
            <input placeholder="Search by job ID, issue, technician…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </div>

        <div className="cjp-table-wrap">
          <table className="cjp-table">
            <thead>
              <tr>
                {['Job ID', 'Type', 'AC Unit', 'Date & Time', 'Technician', 'Amount', 'Status', ''].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => <tr key={j._id} onClick={() => setOpenId(j._id)}>
                  <td className="cjp-jobid">{j.id}</td>
                  <td><TypeTag type={j.type} /></td>
                  <td className="cp-jobs-page-37">{j.ac}</td>
                  <td className="cp-jobs-page-38">{j.date}<br /><span className="cp-jobs-page-39">{j.time}</span></td>
                  <td className="cp-jobs-page-40">
                    {j.tech && j.tech !== 'Unassigned' ? <><Avatar name={j.tech} /> {j.tech}</> : <span className="cp-jobs-page-41">⚠ Unassigned</span>}
                  </td>
                  <td className="cp-jobs-page-42">₹{j.amount.toLocaleString()}</td>
                  <td><SBadge s={j.status} /></td>
                  <td><button className="cjp-viewbtn">View →</button></td>
                </tr>)}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="cjp-empty">No jobs match your filters</div>}
        </div>
      </div>

      <NewJobModal open={showNewJob} onClose={() => setShowNewJob(false)} onCreate={handleCreateJob}
    // TODO: prefill from the logged-in customer's profile once available here
    // (e.g. via an AuthContext, or GET /api/auth/me + the linked Customer doc).
    // Left blank for now rather than reusing old mock/demo values.
    accountAddress="" accountPhone="" />
    </div>;
}