import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { techJobsApi, techInventoryApi } from '../services/technicianPortalApi';
// ↑ adjust this relative path to wherever technicianApi.js actually lives
//   in your technician panel's folder structure.

/* ────────────────────────────────────────────────────────────────────────
   TECHNICIAN PANEL — JOBS MODULE (API-wired)

   Mock data is gone — this now talks to routes/technicianPortal.routes.js
   via services/technicianApi.js. Two things changed shape vs the mock
   version because they now mirror the real backend exactly:

   - `job.customer` comes back populated ({ name, phone, address }) rather
     than flat strings, since GET /me/jobs does `.populate('customer', ...)`.
   - checklist items and parts are real Mongo subdocuments now (`_id` from
     the server), not array-index-addressed mock objects — every checklist
     action (toggle/add/remove) is a real API call, not local-only state.

   Parts Used supports BOTH flows: pick from Inventory (auto-fills name/cost
   and — server-side, on completion — deducts stock) or add a custom/
   non-stock part by hand. Either way, the parts list is only sent to the
   server when the job is marked Complete (PATCH .../complete), matching how
   the admin panel already handles parts.
──────────────────────────────────────────────────────────────────────── */

const CSS = `
.tjp{ --brand:#EA580C; --brand-d:#C2410C; --brand-l:#FFF3EA;
      --bg:#F8FAFC; --white:#FFFFFF; --border:#E7EAEE;
      --h1:#0F172A; --h2:#1E293B; --muted:#64748B; --faint:#94A3B8;
      --mono:'SFMono-Regular',Consolas,'Liberation Mono',monospace;
      --sans:'Inter',system-ui,-apple-system,sans-serif;
      font-family:var(--sans); color:var(--h2); }
.tjp *{ box-sizing:border-box; }

/* ── header ── */
.tjp-hdr{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
.tjp-title{ font-size:22px; font-weight:800; color:var(--h1); letter-spacing:-.3px; }
.tjp-sub{ font-size:13px; color:var(--muted); margin-top:3px; }

/* ── tabs ── */
.tjp-tabs-wrap{ overflow-x:auto; padding-bottom:2px; margin-bottom:14px; }
.tjp-tabs{ display:flex; background:var(--white); border:1px solid var(--border); border-radius:11px;
      padding:4px; width:max-content; min-width:100%; }
.tjp-tab{ padding:8px 14px; border-radius:8px; font-size:12.5px; font-weight:600; background:transparent;
      color:var(--muted); border:none; cursor:pointer; display:flex; gap:6px; align-items:center;
      white-space:nowrap; transition:all .15s; }
.tjp-tab.active{ background:var(--brand-l); color:var(--brand); }
.tjp-tab .cnt{ font-size:10px; background:#F1F5F9; color:var(--faint); padding:1px 7px; border-radius:99px; }
.tjp-tab.active .cnt{ background:rgba(234,88,12,.15); color:var(--brand); }

/* ── search ── */
.tjp-search{ position:relative; flex:1 1 240px; max-width:360px; margin-bottom:16px; }
.tjp-search input{ width:100%; padding:9px 12px 9px 32px; border-radius:9px; border:1.5px solid var(--border);
      font-size:13px; outline:none; background:var(--white); font-family:var(--sans); }
.tjp-search input:focus{ border-color:var(--brand); }
.tjp-search svg{ position:absolute; left:10px; top:50%; transform:translateY(-50%); pointer-events:none; }

/* ── job cards (list view) ── */
.tjp-list{ display:flex; flex-direction:column; gap:12px; }
.tjp-card{ background:var(--white); border:1px solid var(--border); border-radius:14px; padding:16px 18px;
      box-shadow:0 1px 4px rgba(15,23,42,.05); cursor:pointer; transition:transform .15s, box-shadow .15s; }
.tjp-card:hover{ transform:translateY(-2px); box-shadow:0 8px 22px rgba(15,23,42,.09); }
.tjp-card-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
.tjp-card-left{ display:flex; gap:13px; align-items:flex-start; flex:1; min-width:0; }
.tjp-icon{ width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:19px; flex-shrink:0; }
.tjp-card-meta{ display:flex; align-items:center; gap:7px; margin-bottom:5px; flex-wrap:wrap; }
.tjp-jobid{ font-family:var(--mono); font-size:12.5px; font-weight:700; color:var(--brand); }
.tjp-customer{ font-size:15px; font-weight:800; color:var(--h1); margin-bottom:3px; }
.tjp-addr{ font-size:12px; color:var(--muted); }
.tjp-when{ font-size:11.5px; color:var(--faint); margin-top:2px; }
.tjp-amount{ font-size:15px; font-weight:800; color:var(--brand); font-family:var(--mono); margin-top:6px; }
.tjp-card-checklist{ margin-top:12px; padding-top:12px; border-top:1px solid var(--border); }
.tjp-cl-row{ display:flex; justify-content:space-between; margin-bottom:6px; }
.tjp-cl-label{ font-size:11px; color:var(--muted); font-weight:600; }
.tjp-cl-frac{ font-size:11px; font-weight:700; }
.tjp-issue-preview{ margin-top:8px; font-size:12px; color:var(--faint); font-style:italic; }

.tjp-empty{ text-align:center; padding:52px 20px; color:var(--faint); font-size:13px; }
.tjp-empty .em{ font-size:34px; margin-bottom:10px; opacity:.4; }
.tjp-loading{ text-align:center; padding:60px 20px; color:var(--muted); font-size:13px; }

/* ── progress bar ── */
.tjp-bar{ height:6px; border-radius:99px; background:#F1F5F9; overflow:hidden; }
.tjp-bar-fill{ height:100%; border-radius:99px; transition:width .25s ease; }

/* ── badges / tags ── */
.tjp-badge{ display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; padding:4px 10px;
      border-radius:99px; white-space:nowrap; }
.tjp-badge .dot{ width:6px; height:6px; border-radius:99px; background:currentColor; }
.tjp-typetag{ font-size:11px; font-weight:700; padding:4px 10px; border-radius:8px; background:#F1F5F9; color:#475569; }
.tjp-ptag{ font-size:11px; font-weight:700; padding:4px 10px; border-radius:8px; }

/* ── detail view ── */
.tjp-back{ display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--muted); background:none;
      border:none; cursor:pointer; font-weight:600; margin-bottom:14px; }
.tjp-back:hover{ color:var(--brand); }

.tjp-detail-grid{ display:grid; grid-template-columns:1fr 300px; gap:16px; align-items:start; }
@media (max-width:900px){ .tjp-detail-grid{ grid-template-columns:1fr; } }

.tjp-main-card{ background:var(--white); border:1px solid var(--border); border-radius:16px; padding:22px;
      box-shadow:0 1px 4px rgba(15,23,42,.05); }
.tjp-side-card{ background:var(--white); border:1px solid var(--border); border-radius:16px; padding:18px;
      box-shadow:0 1px 4px rgba(15,23,42,.05); margin-bottom:14px; }
.tjp-side-title{ font-size:13px; font-weight:700; color:var(--h1); margin-bottom:12px; }

.tjp-customer-name{ font-size:19px; font-weight:800; color:var(--h1); }
.tjp-divider{ height:1px; background:var(--border); margin:16px 0; }

.tjp-field-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:16px 20px; }
@media (max-width:520px){ .tjp-field-grid{ grid-template-columns:1fr; } }
.tjp-field-label{ font-size:10.5px; font-weight:700; color:var(--faint); text-transform:uppercase; letter-spacing:.5px; margin-bottom:4px; }
.tjp-field-value{ font-size:13.5px; color:var(--h2); line-height:1.5; }

.tjp-notes-box{ padding:12px 14px; border-radius:10px; border:1px solid var(--border); background:#F9FAFB;
      font-size:13px; color:var(--h2); line-height:1.6; min-height:44px; }
.tjp-notes-label{ font-size:11px; font-weight:700; color:var(--muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:.4px; }

/* checklist */
.tjp-check-item{ display:flex; align-items:center; gap:10px; padding:9px 0; border-bottom:1px solid #F1F5F9; }
.tjp-check-item:last-child{ border-bottom:none; }
.tjp-checkbox{ width:20px; height:20px; border-radius:6px; border:1.5px solid var(--border); flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-size:12px; color:#fff; transition:all .15s; cursor:pointer; }
.tjp-checkbox.done{ background:var(--brand); border-color:var(--brand); }
.tjp-check-label{ font-size:13px; color:var(--h2); flex:1; cursor:pointer; }
.tjp-check-label.done{ color:var(--faint); text-decoration:line-through; }
.tjp-check-src{ font-size:9.5px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:var(--faint);
      background:#F1F5F9; padding:2px 6px; border-radius:5px; flex-shrink:0; }
.tjp-item-del{ background:none; border:none; color:#DC2626; cursor:pointer; font-size:13px; padding:2px 6px; flex-shrink:0; opacity:.7; }
.tjp-item-del:hover{ opacity:1; }
.tjp-add-check-row{ display:flex; gap:8px; margin-top:10px; }
.tjp-add-check-row input{ flex:1; padding:8px 10px; border-radius:7px; border:1.5px solid var(--border); font-size:12.5px;
      font-family:var(--sans); outline:none; }
.tjp-add-check-row input:focus{ border-color:var(--brand); }
.tjp-add-check-btn{ padding:8px 14px; border-radius:7px; font-size:12px; font-weight:700; cursor:pointer;
      background:var(--brand-l); border:1px solid transparent; color:var(--brand); white-space:nowrap; }
.tjp-add-check-btn:disabled{ opacity:.5; cursor:not-allowed; }

/* parts */
.tjp-parts-section-hdr{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px; }
.tjp-mini-tabs{ display:flex; gap:6px; }
.tjp-mini-tab{ font-size:11px; padding:5px 11px; border-radius:7px; border:1px solid var(--border); background:#fff;
      cursor:pointer; color:var(--muted); font-weight:700; }
.tjp-mini-tab.active{ background:var(--brand-l); border-color:var(--brand); color:var(--brand); }
.tjp-parts-row{ display:grid; grid-template-columns:1fr 50px 80px 80px 26px; gap:8px; padding:9px 0;
      border-top:1px solid var(--border); font-size:12.5px; align-items:center; }
.tjp-parts-row.head{ font-size:10.5px; font-weight:700; color:var(--faint); text-transform:uppercase;
      letter-spacing:.4px; border-top:none; padding-bottom:6px; }
.tjp-parts-row input{ padding:5px 7px; border-radius:6px; border:1px solid var(--border); font-size:12px;
      font-family:var(--sans); width:100%; }
.tjp-parts-amt{ font-family:var(--mono); font-weight:700; text-align:right; }
.tjp-parts-empty{ font-size:12px; color:var(--faint); padding:8px 0; }
.tjp-inv-search{ margin-top:8px; }
.tjp-inv-search input{ width:100%; padding:8px 11px; border-radius:8px; border:1.5px solid var(--border); font-size:12.5px;
      font-family:var(--sans); outline:none; }
.tjp-inv-search input:focus{ border-color:var(--brand); }
.tjp-inv-results{ border:1px solid var(--border); border-radius:8px; max-height:190px; overflow-y:auto; margin-top:8px; }
.tjp-inv-row{ display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:1px solid #F1F5F9; font-size:12px; }
.tjp-inv-row:last-child{ border-bottom:none; }
.tjp-inv-meta{ color:var(--faint); font-size:11px; margin-top:1px; }
.tjp-inv-add-btn{ font-size:11px; padding:5px 10px; border-radius:6px; background:var(--brand-l); color:var(--brand);
      border:1px solid transparent; cursor:pointer; font-weight:700; flex-shrink:0; }
.tjp-custom-form{ display:grid; grid-template-columns:1fr 60px 80px auto; gap:8px; margin-top:8px; align-items:center; }
.tjp-custom-form input{ padding:8px 9px; border-radius:7px; border:1.5px solid var(--border); font-size:12.5px; font-family:var(--sans); }
.tjp-custom-add{ padding:8px 12px; border-radius:7px; font-size:12px; font-weight:700; cursor:pointer;
      background:var(--brand); color:#fff; border:none; white-space:nowrap; }
.tjp-custom-add:disabled{ opacity:.5; cursor:not-allowed; }
.tjp-locked-note{ font-size:12px; color:var(--faint); padding:8px 0; }

/* remark textarea */
.tjp-textarea{ width:100%; padding:11px 13px; border-radius:8px; border:1.5px solid var(--border);
      font-size:13px; color:var(--h2); background:#FAFAFA; resize:vertical; min-height:78px;
      font-family:var(--sans); outline:none; box-sizing:border-box; transition:border-color .15s; }
.tjp-textarea:focus{ border-color:var(--brand); background:#fff; }

/* actions */
.tjp-actions{ display:flex; gap:10px; flex-wrap:wrap; margin-top:20px; }
.tjp-abtn{ flex:1 1 140px; padding:11px 14px; border-radius:10px; font-size:12.5px; font-weight:700;
      cursor:pointer; text-align:center; border:1px solid transparent; }
.tjp-abtn.primary{ background:linear-gradient(135deg,var(--brand),var(--brand-d)); color:#fff; border:none;
      box-shadow:0 4px 12px rgba(234,88,12,.28); }
.tjp-abtn.success{ background:linear-gradient(135deg,#059669,#047857); color:#fff; border:none;
      box-shadow:0 4px 12px rgba(5,150,105,.28); }
.tjp-abtn.ghost{ background:#F0F9FF; border-color:#BAE6FD; color:#0369A1; }
.tjp-abtn.subtle{ background:#F8FAFC; border-color:var(--border); color:var(--muted); }
.tjp-abtn:disabled{ opacity:.5; cursor:not-allowed; box-shadow:none; }
.tjp-hint{ width:100%; font-size:11.5px; color:var(--faint); margin-top:-4px; }

.tjp-savebtn{ margin-top:9px; padding:8px 16px; border-radius:8px; font-size:12.5px; font-weight:700;
      cursor:pointer; background:var(--white); border:1.5px solid var(--brand); color:var(--brand); }
.tjp-savebtn:hover{ background:var(--brand-l); }
.tjp-savebtn:disabled{ opacity:.5; cursor:not-allowed; }

/* timeline */
.tjp-tl{ display:flex; flex-direction:column; }
.tjp-tl-item{ display:flex; gap:10px; position:relative; padding-bottom:20px; }
.tjp-tl-item:last-child{ padding-bottom:0; }
.tjp-tl-line{ position:absolute; left:11px; top:24px; bottom:0; width:2px; background:var(--border); }
.tjp-tl-item.done .tjp-tl-line{ background:var(--brand); }
.tjp-tl-dot{ width:24px; height:24px; border-radius:99px; display:flex; align-items:center; justify-content:center;
      font-size:12px; flex-shrink:0; background:#F1F5F9; color:var(--faint); border:2px solid var(--border); z-index:1; }
.tjp-tl-item.done .tjp-tl-dot{ background:var(--brand); border-color:var(--brand); color:#fff; }
.tjp-tl-item.current .tjp-tl-dot{ background:var(--brand-l); border-color:var(--brand); color:var(--brand); }
.tjp-tl-label{ font-size:12.5px; font-weight:700; color:var(--h2); }
.tjp-tl-item.done .tjp-tl-label{ color:var(--h1); }
.tjp-tl-sub{ font-size:11px; color:var(--faint); margin-top:1px; }

/* customer contact card */
.tjp-contact-name{ font-size:14px; font-weight:700; color:var(--h1); margin-bottom:2px; }
.tjp-contact-sub{ font-size:12px; color:var(--muted); margin-bottom:12px; }
.tjp-contact-btns{ display:flex; gap:8px; }
.tjp-cbtn{ flex:1; padding:9px 10px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer;
      text-align:center; text-decoration:none; display:block; border:1px solid transparent; }
.tjp-cbtn.call{ background:#ECFDF5; border-color:#A7F3D0; color:#047857; }
.tjp-cbtn.nav{ background:#F0F9FF; border-color:#BAE6FD; color:#0369A1; }

/* cost row */
.tjp-cost-row{ display:flex; justify-content:space-between; padding:7px 0; border-bottom:1px solid var(--border); font-size:12.5px; }
.tjp-cost-row span:last-child{ font-family:var(--mono); font-weight:600; color:var(--h2); }
.tjp-cost-total{ display:flex; justify-content:space-between; padding:10px 0 0; font-size:14.5px; font-weight:800; }
.tjp-cost-total span:last-child{ font-family:var(--mono); color:var(--brand); }

/* toast */
.tjp-toast{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 16px;
      border-radius:10px; font-size:13px; font-weight:600; margin-bottom:14px; animation:tjpFade .2s ease; }
.tjp-toast.success{ background:#ECFDF5; border:1px solid #A7F3D0; color:#047857; }
.tjp-toast.info{ background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; }
.tjp-toast.error{ background:#FEF2F2; border:1px solid #FECACA; color:#B91C1C; }
.tjp-toast-x{ background:none; border:none; cursor:pointer; font-size:15px; color:inherit; opacity:.6; line-height:1; }
.tjp-toast-x:hover{ opacity:1; }
@keyframes tjpFade{ from{ opacity:0; transform:translateY(-4px); } to{ opacity:1; transform:translateY(0); } }

/* confirm modal */
.tjp-modal-overlay{ position:fixed; inset:0; background:rgba(15,23,42,.5); z-index:1000; display:flex;
      align-items:center; justify-content:center; padding:20px; animation:tjpFade .15s ease; }
.tjp-modal{ background:var(--white); border-radius:16px; width:100%; max-width:400px;
      box-shadow:0 24px 64px rgba(0,0,0,.25); }
.tjp-modal-body{ padding:26px 22px 20px; }
.tjp-modal-icon{ width:44px; height:44px; border-radius:99px; display:flex; align-items:center; justify-content:center;
      font-size:20px; margin-bottom:12px; }
.tjp-modal-title{ font-size:15px; font-weight:800; color:var(--h1); margin-bottom:6px; }
.tjp-modal-msg{ font-size:13px; color:var(--muted); line-height:1.5; }
.tjp-modal-footer{ display:flex; justify-content:flex-end; gap:10px; padding:16px 22px;
      border-top:1px solid var(--border); }
.tjp-modal-btn{ padding:9px 18px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:none; }
.tjp-modal-btn.cancel{ background:var(--white); border:1px solid var(--border); color:var(--muted); }
.tjp-modal-btn.confirm{ background:linear-gradient(135deg,var(--brand),var(--brand-d)); color:#fff;
      box-shadow:0 4px 12px rgba(234,88,12,.28); }
.tjp-modal-btn.confirm.success{ background:linear-gradient(135deg,#059669,#047857); box-shadow:0 4px 12px rgba(5,150,105,.28); }
.tjp-modal-btn:disabled{ opacity:.6; cursor:not-allowed; }
`;

/* ── status + priority + type maps ─────────────────────────────────── */
const JOB_STATUS = {
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
  }
};
const PRIORITY = {
  urgent: "var(--purple-text)",
  high: "var(--danger-text)",
  normal: "var(--info)"
};
const PRIORITY_LABEL = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal'
};
const TYPE_ICON = {
  'AMC Visit': '📋',
  Repair: '🔧',
  Installation: '📦',
  Service: '❄️',
  Inspection: '🔍'
};
const TIMELINE_STEPS = [{
  key: 'assigned',
  label: 'Job Assigned'
}, {
  key: 'in_progress',
  label: 'In Progress'
}, {
  key: 'completed',
  label: 'Completed'
}, {
  key: 'invoiced',
  label: 'Invoiced'
}];

/* ── maps a raw Job doc (as returned by the technician-portal API) to the
   shape this UI works with ─────────────────────────────────────────── */
const normaliseJob = j => ({
  _id: j._id,
  id: j.jobId || `JOB-${String(j._id).slice(-6).toUpperCase()}`,
  type: j.type || 'Service',
  priority: j.priority || 'normal',
  status: j.status || 'assigned',
  customerName: j.customer?.name || j.customerName || '',
  phone: j.customer?.phone || '',
  address: j.customer?.address || j.address || '',
  ac: j.ac || '',
  issue: j.issue || '',
  date: j.scheduledDate ? new Date(j.scheduledDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : '',
  time: j.scheduledTime || '',
  amount: j.amount || 0,
  remarks: j.remarks || '',
  checklist: (j.checklist || []).map(c => ({
    _id: c._id,
    item: c.item,
    done: c.done,
    addedBy: c.addedBy
  })),
  parts: (j.parts || []).map(p => ({
    _id: p._id,
    name: p.name,
    qty: p.qty,
    cost: p.cost,
    inventoryItem: p.inventoryItem || null
  }))
});

/* ── tiny building blocks ─────────────────────────────────────────── */
const SBadge = ({
  s
}) => {
  const m = JOB_STATUS[s] ?? {
    label: s,
    color: '#64748B',
    bg: '#F1F5F9'
  };
  return <span className="tjp-badge" style={{
    background: m.bg,
    color: m.color
  }}><span className="dot" />{m.label}</span>;
};
const PTag = ({
  p
}) => {
  const color = PRIORITY[p] ?? '#64748B';
  return <span className="tjp-ptag" style={{
    background: `${color}18`,
    color
  }}>{PRIORITY_LABEL[p] || p}</span>;
};
const TypeTag = ({
  type
}) => <span className="tjp-typetag">{type}</span>;
const ProgressBar = ({
  value,
  max,
  color
}) => <div className="tjp-bar"><div className="tjp-bar-fill" style={{
    width: `${max ? value / max * 100 : 0}%`,
    background: color
  }} /></div>;
const SearchIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>;

/* generic yes/no confirmation modal — used for Mark Complete & Save Remark */
const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  icon,
  iconBg,
  iconColor,
  title,
  message,
  confirmLabel,
  tone = 'primary',
  busy
}) => {
  if (!open) return null;
  return createPortal(<div className="tjp-modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="tjp-modal" onClick={e => e.stopPropagation()}>
        <div className="tjp-modal-body">
          <div className="tjp-modal-icon" style={{
          background: iconBg,
          color: iconColor
        }}>{icon}</div>
          <div className="tjp-modal-title">{title}</div>
          <div className="tjp-modal-msg">{message}</div>
        </div>
        <div className="tjp-modal-footer">
          <button className="tjp-modal-btn cancel" disabled={busy} onClick={onClose}>Go Back</button>
          <button className={`tjp-modal-btn confirm ${tone}`} disabled={busy} onClick={onConfirm}>
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>, document.getElementById('tech-portal-root') || document.body);
};

/* ── main component ──────────────────────────────────────────────── */
export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [remarkDraft, setRemarkDraft] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { type: 'complete' | 'remark' }
  const [busy, setBusy] = useState(false);

  // ── Parts Used draft state (only meaningful while a job is open) ──────────
  const [draftParts, setDraftParts] = useState([]);
  const [partsMode, setPartsMode] = useState('inventory'); // 'inventory' | 'custom'
  const [invQuery, setInvQuery] = useState('');
  const [invResults, setInvResults] = useState([]);
  const [invLoading, setInvLoading] = useState(false);
  const [customPart, setCustomPart] = useState({
    name: '',
    qty: 1,
    cost: ''
  });

  // ── Add-checklist-item draft ────────────────────────────────────────────
  const [newCheckItem, setNewCheckItem] = useState('');
  const fetchJobs = () => {
    setLoading(true);
    setLoadError('');
    techJobsApi.list().then(res => setJobs((res.data || []).map(normaliseJob))).catch(err => setLoadError(err.message || 'Failed to load your jobs.')).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchJobs();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const job = openId ? jobs.find(j => j._id === openId) : null;
  useEffect(() => {
    if (!job) return;
    setRemarkDraft(job.remarks || '');
    setDraftParts(job.parts.map(p => ({
      ...p
    })));
    setPartsMode('inventory');
    setInvQuery('');
    setInvResults([]);
    setCustomPart({
      name: '',
      qty: 1,
      cost: ''
    });
    setNewCheckItem('');
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateJob = raw => {
    const updated = normaliseJob(raw);
    setJobs(prev => prev.map(j => j._id === updated._id ? updated : j));
  };
  const counts = Object.keys(JOB_STATUS).reduce((a, s) => ({
    ...a,
    [s]: jobs.filter(j => j.status === s).length
  }), {});
  const filtered = jobs.filter(j => filter === 'all' || j.status === filter).filter(j => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [j.id, j.customerName, j.issue, j.ac].some(v => v.toLowerCase().includes(q));
  });

  /* ── checklist actions — each is a live API call ── */
  const toggleCheck = item => {
    techJobsApi.toggleChecklistItem(job._id, item._id, !item.done).then(res => updateJob(res.data)).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not update checklist item.'
    }));
  };
  const addCheckItem = () => {
    const text = newCheckItem.trim();
    if (!text) return;
    techJobsApi.addChecklistItem(job._id, text).then(res => {
      updateJob(res.data);
      setNewCheckItem('');
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not add checklist item.'
    }));
  };
  const removeCheckItem = item => {
    techJobsApi.removeChecklistItem(job._id, item._id).then(res => updateJob(res.data)).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not remove checklist item.'
    }));
  };

  /* ── job status actions ── */
  const startJob = () => {
    techJobsApi.start(job._id).then(res => {
      updateJob(res.data);
      setToast({
        type: 'success',
        msg: 'Job started.'
      });
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not start job.'
    }));
  };
  const confirmComplete = () => {
    setBusy(true);
    const payload = draftParts.map(p => ({
      name: p.name,
      qty: Number(p.qty),
      cost: Number(p.cost),
      inventoryItem: p.inventoryItem || null
    }));
    techJobsApi.complete(job._id, payload).then(res => {
      updateJob(res.data);
      setConfirmModal(null);
      setToast({
        type: res.inventoryWarnings?.length ? 'info' : 'success',
        msg: res.inventoryWarnings?.length ? `Job marked complete. ${res.inventoryWarnings.join(' ')}` : 'Job marked complete.'
      });
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not mark job complete.'
    })).finally(() => setBusy(false));
  };
  const confirmSaveRemark = () => {
    setBusy(true);
    techJobsApi.saveRemark(job._id, remarkDraft.trim()).then(res => {
      updateJob(res.data);
      setConfirmModal(null);
      setToast({
        type: 'success',
        msg: 'Remark saved to job record.'
      });
    }).catch(err => setToast({
      type: 'error',
      msg: err.message || 'Could not save remark.'
    })).finally(() => setBusy(false));
  };

  /* ── parts draft helpers ── */
  const searchInventory = q => {
    setInvQuery(q);
    if (!q.trim()) {
      setInvResults([]);
      return;
    }
    setInvLoading(true);
    techInventoryApi.search(q).then(res => setInvResults(res.data || [])).catch(() => setInvResults([])).finally(() => setInvLoading(false));
  };
  const addInventoryPart = item => {
    setDraftParts(prev => [...prev, {
      name: item.name,
      qty: 1,
      cost: item.cost,
      inventoryItem: item._id,
      _key: `inv-${item._id}-${Date.now()}`
    }]);
    setToast({
      type: 'success',
      msg: `${item.name} added from inventory.`
    });
  };
  const addCustomPart = () => {
    if (!customPart.name.trim() || !customPart.cost) return;
    setDraftParts(prev => [...prev, {
      name: customPart.name.trim(),
      qty: Number(customPart.qty) || 1,
      cost: Number(customPart.cost),
      inventoryItem: null,
      _key: `custom-${Date.now()}`
    }]);
    setCustomPart({
      name: '',
      qty: 1,
      cost: ''
    });
  };
  const removeDraftPart = key => setDraftParts(prev => prev.filter(p => (p._key || p._id) !== key));
  const updateDraftPart = (key, field, value) => setDraftParts(prev => prev.map(p => (p._key || p._id) === key ? {
    ...p,
    [field]: value
  } : p));

  /* ── loading / error states ── */
  if (loading) {
    return <div className="tjp"><style>{CSS}</style><div className="tjp-loading">Loading your jobs…</div></div>;
  }
  if (loadError) {
    return <div className="tjp">
        <style>{CSS}</style>
        <div className="tjp-toast error">
          <span>{loadError}</span>
          <button className="tjp-toast-x" onClick={fetchJobs}>↻ Retry</button>
        </div>
      </div>;
  }

  /* ── detail view ── */
  if (job) {
    const checksDone = job.checklist.filter(c => c.done).length;
    const checksTotal = job.checklist.length;
    const allChecked = checksTotal === 0 || checksDone === checksTotal;
    const stepIndex = TIMELINE_STEPS.findIndex(s => s.key === job.status);
    const partsTotal = draftParts.reduce((s, p) => s + Number(p.qty) * Number(p.cost), 0);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`;
    const canEditParts = job.status === 'in_progress';
    const canEditChecklist = job.status === 'assigned' || job.status === 'in_progress';
    return <div className="tjp">
        <style>{CSS}</style>

        <button className="tjp-back" onClick={() => setOpenId(null)}>← Back to My Jobs</button>

        {toast && <div className={`tjp-toast ${toast.type}`}>
            <span>{toast.msg}</span>
            <button className="tjp-toast-x" onClick={() => setToast(null)}>×</button>
          </div>}

        <div className="tjp-detail-grid">
          {/* main card */}
          <div className="tjp-main-card">
            <div className="tp-jobs-page-1">
              <TypeTag type={job.type} />
              <PTag p={job.priority} />
              <SBadge s={job.status} />
            </div>

            <div className="tp-jobs-page-2">
              <div>
                <div className="tjp-customer-name">{job.customerName}</div>
                <div className="tp-jobs-page-3">📍 {job.address}</div>
              </div>
              <div className="tp-jobs-page-4">
                <div className="tp-jobs-page-5">{job.id}</div>
                <div className="tp-jobs-page-6">₹{job.amount.toLocaleString()}</div>
              </div>
            </div>

            <div className="tjp-divider" />

            <div className="tjp-field-grid">
              <div>
                <div className="tjp-field-label">AC Unit</div>
                <div className="tjp-field-value">{job.ac}</div>
              </div>
              <div>
                <div className="tjp-field-label">Issue / Task</div>
                <div className="tjp-field-value">{job.issue}</div>
              </div>
              <div>
                <div className="tjp-field-label">Scheduled</div>
                <div className="tjp-field-value">{job.date}{job.time ? `, ${job.time}` : ''}</div>
              </div>
              <div>
                <div className="tjp-field-label">Customer Phone</div>
                <div className="tjp-field-value">{job.phone || '—'}</div>
              </div>
            </div>

            {job.remarks && <>
                <div className="tjp-divider" />
                <div className="tjp-notes-label">Remarks on file</div>
                <div className="tjp-notes-box">{job.remarks}</div>
              </>}

            {/* checklist */}
            <div className="tp-jobs-page-7">
              <div className="tp-jobs-page-8">
                <div className="tjp-side-title tp-jobs-page-9">Job Checklist</div>
                <span className="tp-jobs-page-10">{checksDone}/{checksTotal}</span>
              </div>
              {checksTotal > 0 && <ProgressBar value={checksDone} max={checksTotal} color="var(--brand)" />}
              <div className="tp-jobs-page-11">
                {job.checklist.map(c => <div key={c._id} className="tjp-check-item">
                    <div className={`tjp-checkbox ${c.done ? 'done' : ''}`} onClick={() => toggleCheck(c)}>{c.done ? '✓' : ''}</div>
                    <span className={`tjp-check-label ${c.done ? 'done' : ''}`} onClick={() => toggleCheck(c)}>{c.item}</span>
                    {c.addedBy === 'technician' && <span className="tjp-check-src">Added</span>}
                    {c.addedBy === 'technician' && canEditChecklist && <button className="tjp-item-del" onClick={() => removeCheckItem(c)} title="Remove">✕</button>}
                  </div>)}
                {checksTotal === 0 && <div className="tjp-parts-empty">No checklist items yet.</div>}
              </div>
              {canEditChecklist && <div className="tjp-add-check-row">
                  <input placeholder="Add a checklist item you found on-site…" value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCheckItem()} />
                  <button className="tjp-add-check-btn" disabled={!newCheckItem.trim()} onClick={addCheckItem}>+ Add</button>
                </div>}
            </div>

            {/* parts used */}
            <div className="tp-jobs-page-12">
              <div className="tjp-parts-section-hdr">
                <div className="tjp-side-title tp-jobs-page-13">Parts Used</div>
                {canEditParts && <div className="tjp-mini-tabs">
                    <button className={`tjp-mini-tab ${partsMode === 'inventory' ? 'active' : ''}`} onClick={() => setPartsMode('inventory')}>From Inventory</button>
                    <button className={`tjp-mini-tab ${partsMode === 'custom' ? 'active' : ''}`} onClick={() => setPartsMode('custom')}>Custom Part</button>
                  </div>}
              </div>

              {draftParts.length > 0 ? <>
                  <div className="tjp-parts-row head">
                    <span>Part</span><span>Qty</span><span className="tp-jobs-page-14">Rate</span><span className="tp-jobs-page-15">Amount</span><span />
                  </div>
                  {draftParts.map(p => {
                const key = p._key || p._id;
                return <div className="tjp-parts-row" key={key}>
                        <span>{p.name} {p.inventoryItem && <span className="tjp-check-src tp-jobs-page-16">Stock</span>}</span>
                        {canEditParts ? <input type="number" min="1" value={p.qty} onChange={e => updateDraftPart(key, 'qty', e.target.value)} /> : <span>{p.qty}</span>}
                        {canEditParts ? <input type="number" min="0" value={p.cost} onChange={e => updateDraftPart(key, 'cost', e.target.value)} /> : <span className="tjp-parts-amt">₹{p.cost.toLocaleString()}</span>}
                        <span className="tjp-parts-amt">₹{(Number(p.qty) * Number(p.cost)).toLocaleString()}</span>
                        {canEditParts ? <button className="tjp-item-del" onClick={() => removeDraftPart(key)} title="Remove">✕</button> : <span />}
                      </div>;
              })}
                </> : <div className="tjp-parts-empty">
                  {canEditParts ? 'No parts added yet — pick from inventory or add a custom part below.' : 'No parts logged for this job.'}
                </div>}

              {canEditParts && partsMode === 'inventory' && <div className="tjp-inv-search">
                  <input placeholder="Search inventory by part name…" value={invQuery} onChange={e => searchInventory(e.target.value)} />
                  {invLoading && <div className="tjp-parts-empty">Searching…</div>}
                  {!invLoading && invResults.length > 0 && <div className="tjp-inv-results">
                      {invResults.map(item => <div className="tjp-inv-row" key={item._id}>
                          <div>
                            <div>{item.name}</div>
                            <div className="tjp-inv-meta">{item.qty} {item.unit || 'pcs'} in stock · ₹{item.cost}</div>
                          </div>
                          <button className="tjp-inv-add-btn" onClick={() => addInventoryPart(item)}>+ Add</button>
                        </div>)}
                    </div>}
                  {!invLoading && invQuery.trim() && invResults.length === 0 && <div className="tjp-parts-empty">No matching inventory items.</div>}
                </div>}

              {canEditParts && partsMode === 'custom' && <div className="tjp-custom-form">
                  <input placeholder="Part name" value={customPart.name} onChange={e => setCustomPart(f => ({
                ...f,
                name: e.target.value
              }))} />
                  <input type="number" min="1" placeholder="Qty" value={customPart.qty} onChange={e => setCustomPart(f => ({
                ...f,
                qty: e.target.value
              }))} />
                  <input type="number" min="0" placeholder="Rate ₹" value={customPart.cost} onChange={e => setCustomPart(f => ({
                ...f,
                cost: e.target.value
              }))} />
                  <button className="tjp-custom-add" disabled={!customPart.name.trim() || !customPart.cost} onClick={addCustomPart}>+ Add</button>
                </div>}

              {!canEditParts && job.status === 'assigned' && <div className="tjp-locked-note">Start this job to begin logging parts used.</div>}
            </div>

            {/* remark */}
            <div className="tp-jobs-page-17">
              <div className="tjp-side-title">Add Remark / Observation</div>
              <textarea className="tjp-textarea" placeholder="Describe what was done, parts used, any issues found…" value={remarkDraft} onChange={e => setRemarkDraft(e.target.value)} />
              <button className="tjp-savebtn" disabled={!remarkDraft.trim() || remarkDraft.trim() === job.remarks} onClick={() => setConfirmModal({
              type: 'remark'
            })}>
                Save Remark
              </button>
            </div>

            {job.status !== 'completed' && job.status !== 'invoiced' && <div className="tjp-actions">
                {job.status === 'assigned' && <button className="tjp-abtn primary" onClick={startJob}>▶ Start Job</button>}
                {job.status === 'in_progress' && <>
                    <button className="tjp-abtn success" disabled={!allChecked} onClick={() => setConfirmModal({
                type: 'complete'
              })}>
                      ✅ Mark Complete
                    </button>
                    {!allChecked && <div className="tjp-hint">Finish all checklist items before marking this job complete.</div>}
                  </>}
                <a className="tjp-abtn ghost tp-jobs-page-18" href={`tel:${job.phone}`}>📞 Call Customer</a>
                <a className="tjp-abtn subtle tp-jobs-page-19" href={mapsUrl} target="_blank" rel="noreferrer">🧭 Navigate</a>
              </div>}
          </div>

          {/* sidebar */}
          <div>
            <div className="tjp-side-card">
              <div className="tjp-side-title">Job Status</div>
              <div className="tjp-tl">
                {TIMELINE_STEPS.map((s, i) => {
                const done = i < stepIndex,
                  current = i === stepIndex;
                return <div className={`tjp-tl-item ${done ? 'done' : ''} ${current ? 'current' : ''}`} key={s.key}>
                      {i < TIMELINE_STEPS.length - 1 && <div className="tjp-tl-line" />}
                      <div className="tjp-tl-dot">{done ? '✓' : i + 1}</div>
                      <div>
                        <div className="tjp-tl-label">{s.label}</div>
                        {current && <div className="tjp-tl-sub">Current stage</div>}
                      </div>
                    </div>;
              })}
              </div>
            </div>

            <div className="tjp-side-card">
              <div className="tjp-side-title">Customer</div>
              <div className="tjp-contact-name">{job.customerName}</div>
              <div className="tjp-contact-sub">📍 {job.address}</div>
              <div className="tjp-contact-btns">
                <a className="tjp-cbtn call" href={`tel:${job.phone}`}>📞 Call</a>
                <a className="tjp-cbtn nav" href={mapsUrl} target="_blank" rel="noreferrer">🧭 Navigate</a>
              </div>
            </div>

            <div className="tjp-side-card">
              <div className="tjp-side-title">Job Summary</div>
              {draftParts.length > 0 && <div className="tjp-cost-row"><span>Parts</span><span>₹{partsTotal.toLocaleString()}</span></div>}
              <div className="tjp-cost-row"><span>Checklist</span><span>{checksDone}/{checksTotal || '—'}</span></div>
              <div className="tjp-cost-total"><span>Job Amount</span><span>₹{job.amount.toLocaleString()}</span></div>
            </div>
          </div>
        </div>

        <ConfirmModal open={confirmModal?.type === 'complete'} onClose={() => !busy && setConfirmModal(null)} onConfirm={confirmComplete} busy={busy} icon="✅" iconBg="#ECFDF5" iconColor="#059669" title="Mark this job complete?" message={`${job.id} will move to Completed with ${draftParts.length} part${draftParts.length === 1 ? '' : 's'} logged. Stock will be deducted for any inventory-linked parts. This can't be undone from here.`} confirmLabel="Yes, Mark Complete" tone="success" />
        <ConfirmModal open={confirmModal?.type === 'remark'} onClose={() => !busy && setConfirmModal(null)} onConfirm={confirmSaveRemark} busy={busy} icon="📝" iconBg="var(--brand-l)" iconColor="var(--brand)" title="Save this remark?" message="This will be added to the job record and visible to the office team. You can still edit it later." confirmLabel="Yes, Save Remark" />
      </div>;
  }

  /* ── list view ── */
  return <div className="tjp">
      <style>{CSS}</style>

      <div className="tjp-hdr">
        <div>
          <div className="tjp-title">My Jobs</div>
          <div className="tjp-sub">{jobs.length} total jobs assigned to you</div>
        </div>
      </div>

      {toast && <div className={`tjp-toast ${toast.type}`}>
          <span>{toast.msg}</span>
          <button className="tjp-toast-x" onClick={() => setToast(null)}>×</button>
        </div>}

      <div className="tjp-tabs-wrap">
        <div className="tjp-tabs">
          {[['all', 'All', jobs.length], ...Object.entries(JOB_STATUS).map(([k, v]) => [k, v.label, counts[k] || 0])].map(([k, label, c]) => <button key={k} className={`tjp-tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
                {label}<span className="cnt">{c}</span>
              </button>)}
        </div>
      </div>

      <div className="tjp-search">
        <SearchIcon />
        <input placeholder="Search by job ID, customer, issue…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="tjp-list">
        {filtered.map(j => {
        const color = JOB_STATUS[j.status]?.color ?? '#94A3B8';
        const checksDone = j.checklist.filter(c => c.done).length;
        return <div key={j._id} className="tjp-card" style={{
          borderLeft: `4px solid ${color}`
        }} onClick={() => setOpenId(j._id)}>
              <div className="tjp-card-top">
                <div className="tjp-card-left">
                  <div className="tjp-icon" style={{
                background: `${color}18`
              }}>{TYPE_ICON[j.type] || '❄️'}</div>
                  <div className="tp-jobs-page-20">
                    <div className="tjp-card-meta">
                      <span className="tjp-jobid">{j.id}</span>
                      <TypeTag type={j.type} />
                      <PTag p={j.priority} />
                    </div>
                    <div className="tjp-customer">{j.customerName}</div>
                    <div className="tjp-addr">📍 {j.address}</div>
                    <div className="tjp-when">🕐 {j.date}{j.time ? ` · ${j.time}` : ''} · {j.ac}</div>
                  </div>
                </div>
                <div className="tp-jobs-page-21">
                  <SBadge s={j.status} />
                  <div className="tjp-amount">₹{j.amount.toLocaleString()}</div>
                </div>
              </div>

              {j.checklist.length > 0 && <div className="tjp-card-checklist">
                  <div className="tjp-cl-row">
                    <span className="tjp-cl-label">Checklist</span>
                    <span className="tjp-cl-frac" style={{
                color
              }}>{checksDone}/{j.checklist.length}</span>
                  </div>
                  <ProgressBar value={checksDone} max={j.checklist.length} color={color} />
                </div>}

              <div className="tjp-issue-preview">Issue: {j.issue}</div>
            </div>;
      })}

        {filtered.length === 0 && <div className="tjp-empty">
            <div className="em">🔧</div>
            No jobs match this filter
          </div>}
      </div>
    </div>;
}