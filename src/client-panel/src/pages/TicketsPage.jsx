import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clientTicketsApi } from '../services/clientPortalApi';
// ^ Adjust this import path to wherever your real clientTicketsApi module
//   lives (you showed it importing `req` via '../../../services/api', which
//   implies it sits 3 folders deep — update the path above to match exactly).

/* ────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS
   Matches the admin panel's palette/spacing so the client portal reads as
   the same product family. Swap these for the shared ../constants/tokens
   import in the real app — kept local here so this file is self-contained.
   ──────────────────────────────────────────────────────────────────────── */
const COLORS = {
  brand: "var(--brand)",
  brandD: "var(--brand-dark)",
  brandL: "var(--brand-light)",
  h1: "var(--text-h1)",
  h2: "var(--text-h1)",
  muted: "var(--text-muted)",
  faint: "var(--text-faint)",
  border: "var(--border)",
  bg: "var(--bg)",
  white: "var(--white)"
};
const FONTS = {
  sans: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
  mono: `"SF Mono", "Roboto Mono", Menlo, Consolas, monospace`
};

/* Matches your real Ticket schema's enums exactly. */
const TKT_STATUS = {
  open: {
    label: 'Open',
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  },
  in_progress: {
    label: 'In Progress',
    color: "var(--warning-text)",
    bg: "var(--warning-bg)"
  },
  resolved: {
    label: 'Resolved',
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  closed: {
    label: 'Closed',
    color: "var(--text-muted)",
    bg: "var(--border)"
  }
};
const TKT_PRIORITY = {
  critical: {
    label: 'Critical',
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  },
  high: {
    label: 'High',
    color: "var(--brand-dark)",
    bg: "var(--brand-light)"
  },
  medium: {
    label: 'Medium',
    color: "var(--info-text)",
    bg: "var(--info-border)"
  },
  low: {
    label: 'Low',
    color: "var(--text-muted)",
    bg: "var(--border)"
  }
};
const TKT_CATEGORIES = {
  breakdown: {
    label: 'Breakdown',
    color: "var(--danger-text)",
    bg: "var(--danger-bg)",
    icon: '⚡'
  },
  scheduling: {
    label: 'Scheduling',
    color: "var(--info-text)",
    bg: "var(--info-bg)",
    icon: '📅'
  },
  billing: {
    label: 'Billing',
    color: "var(--success-text)",
    bg: "var(--success-border)",
    icon: '💰'
  },
  query: {
    label: 'General',
    color: "var(--info-text)",
    bg: "var(--info-border)",
    icon: '💬'
  },
  complaint: {
    label: 'Complaint',
    color: "var(--warning-text)",
    bg: "var(--warning-bg)",
    icon: '⚠️'
  },
  other: {
    label: 'Other',
    color: "var(--purple-text)",
    bg: "var(--purple-bg)",
    icon: '📋'
  }
};
const STEP_ORDER = ['open', 'in_progress', 'resolved', 'closed'];

/** Ticket.messages[].time and Ticket.createdAt/updatedAt come back as ISO strings. */
const fmt = d => d ? new Date(d).toLocaleString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit'
}) : '—';

/* ────────────────────────────────────────────────────────────────────────
   SMALL PRESENTATIONAL PIECES
   ──────────────────────────────────────────────────────────────────────── */
const Badge = ({
  meta
}) => <span className="ct-badge" style={{
  background: meta.bg,
  color: meta.color
}}>{meta.label}</span>;
const KCard = ({
  label,
  value,
  icon,
  color,
  iconBg
}) => <div className="ct-card ct-kcard">
    <div>
      <div className="ct-kcard-label">{label}</div>
      <div className="ct-kcard-value" style={{
      color
    }}>{value}</div>
    </div>
    <div className="ct-kcard-icon" style={{
    background: iconBg
  }}>{icon}</div>
  </div>;
const BackBtn = ({
  onClick
}) => <button className="ct-back-btn" onClick={onClick} aria-label="Back to ticket list">←</button>;

/* ────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ──────────────────────────────────────────────────────────────────────── */
const TicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0
  });
  const [openTicket, setOpenTicket] = useState(null); // full ticket doc, fetched on open
  const [filterStatus, setFilterStatus] = useState('all');
  const [reply, setReply] = useState('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'breakdown',
    priority: 'medium',
    description: ''
  });
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showToast = msg => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3000);
  };
  const loadTickets = useCallback(() => {
    setIsLoading(true);
    setLoadError('');
    Promise.all([clientTicketsApi.list({
      status: filterStatus
    }), clientTicketsApi.stats()]).then(([listRes, statsRes]) => {
      setTickets(listRes.data || []);
      setStats(statsRes.data || {
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0
      });
    }).catch(err => setLoadError(err.message || 'Could not load your tickets.')).finally(() => setIsLoading(false));
  }, [filterStatus]);
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);
  const openTicketId = openTicket?._id || null;
  const filtered = tickets; // filtering already happens server-side via `status` param

  const totalTickets = stats.open + stats.in_progress + stats.resolved + stats.closed;
  const handleOpenTicket = async id => {
    try {
      const r = await clientTicketsApi.get(id);
      setOpenTicket(r.data);
    } catch (err) {
      showToast(err.message || 'Could not open that ticket.');
    }
  };
  const handleSendReply = async () => {
    if (!reply.trim() || !openTicket) return;
    const text = reply.trim();
    setReply('');
    try {
      const r = await clientTicketsApi.reply(openTicket._id, text);
      setOpenTicket(r.data);
      setTickets(prev => prev.map(t => t._id === r.data._id ? r.data : t));
      showToast('Reply sent to CoolTech support!');
    } catch (err) {
      showToast(err.message || 'Could not send your reply.');
      setReply(text); // give it back so nothing's lost
    }
  };
  const handleSubmitTicket = async () => {
    if (!newTicket.subject.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const r = await clientTicketsApi.create(newTicket);
      setTickets(prev => [r.data, ...prev]);
      setStats(prev => ({
        ...prev,
        open: prev.open + 1
      }));
      setNewTicket({
        subject: '',
        category: 'breakdown',
        priority: 'medium',
        description: ''
      });
      setShowNewTicket(false);
      showToast('Ticket submitted! CoolTech will respond shortly.');
    } catch (err) {
      showToast(err.message || 'Could not submit your ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── DETAIL VIEW ───────────────────────────────────────────────────── */
  if (openTicket) {
    const st = TKT_STATUS[openTicket.status] || TKT_STATUS.open;
    const pr = TKT_PRIORITY[openTicket.priority] || TKT_PRIORITY.medium;
    const cat = TKT_CATEGORIES[openTicket.category] || TKT_CATEGORIES.other;
    const stepIdx = STEP_ORDER.indexOf(openTicket.status);
    return <div className="ct-root">
        <style>{CSS}</style>

        <div className="ct-crumbs">
          <BackBtn onClick={() => {
          setOpenTicket(null);
          setReply('');
          loadTickets();
        }} />
          <span className="ct-crumb-muted">Support Tickets /</span>
          <span className="ct-crumb-id">{openTicket.ticketId}</span>
        </div>

        <div className="ct-detail-grid">
          <div className="ct-detail-main">

            {/* Header card */}
            <div className="ct-card ct-pad">
              <div className="ct-badge-row">
                <Badge meta={st} /><Badge meta={pr} /><Badge meta={cat} />
              </div>
              <div className="ct-title-lg">{openTicket.subject}</div>
              <div className="ct-meta-line">SLA: {openTicket.sla || '—'} · Assigned: {openTicket.assignedTo || 'Unassigned'}</div>
            </div>

            {/* Conversation card */}
            <div className="ct-card ct-pad">
              <div className="ct-section-title">Conversation</div>
              <div className="ct-thread">
                {(!openTicket.messages || openTicket.messages.length === 0) && <div className="ct-empty">No messages yet. Say hello to get things started.</div>}
                {(openTicket.messages || []).map((m, i) => <div key={m._id || i} className={`ct-msg-row ${m.isClient ? 'client' : 'support'}`}>
                    <div className={`ct-avatar ${m.isClient ? 'client' : 'support'}`}>{m.isClient ? '👤' : '🛠'}</div>
                    <div className="ct-msg-col">
                      <div className={`ct-msg-meta ${m.isClient ? 'left' : 'right'}`}>{m.from} · {fmt(m.time)}</div>
                      <div className={`ct-bubble ${m.isClient ? 'client' : 'support'}`}>{m.msg}</div>
                    </div>
                  </div>)}
              </div>

              {openTicket.status !== 'closed' ? <div className="ct-reply-row">
                  <textarea className="ct-reply-input" rows={2} placeholder="Type your reply…" value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }} />
                  <button className="ct-btn ct-btn-primary ct-send-btn" onClick={handleSendReply}>Send</button>
                </div> : <div className="ct-closed-note">✅ This ticket has been resolved and closed.</div>}
            </div>
          </div>

          {/* Sidebar */}
          <div className="ct-detail-side">

            <div className="ct-card ct-pad-sm">
              <div className="ct-section-title">Ticket Info</div>
              {[['Ticket ID', openTicket.ticketId], ['Name', openTicket.customerName], ['Email', openTicket.email || '—'], ['Phone', openTicket.phone || '—'], ['Created', fmt(openTicket.createdAt)], ['Updated', fmt(openTicket.updatedAt)], ['Assigned', openTicket.assignedTo || 'Unassigned'], ['Linked Job', openTicket.job?.jobId || '—']].map(([k, v]) => <div key={k} className="ct-info-row">
                  <span className="ct-info-key">{k}</span>
                  <span className="ct-info-val">{v}</span>
                </div>)}
            </div>

            {/* Status progress — read only for the client */}
            <div className="ct-card ct-pad-sm">
              <div className="ct-section-title">Ticket Status</div>
              {STEP_ORDER.map((k, i) => {
              const s = TKT_STATUS[k];
              const isCurrent = k === openTicket.status;
              const isDone = i < stepIdx || k === 'closed' && openTicket.status === 'closed';
              return <div key={k} className="ct-status-step" style={{
                background: isCurrent ? s.bg : '#F9FAFB',
                color: isCurrent ? s.color : COLORS.muted,
                border: `1px solid ${isCurrent ? s.color + '30' : COLORS.border}`,
                fontWeight: isCurrent ? "700" : "500",
                opacity: isDone || isCurrent ? "1" : "0.55"
              }}>
                    {isCurrent ? '● ' : i < stepIdx ? '✓ ' : '○ '}{s.label}
                  </div>;
            })}
              <div className="ct-status-hint">Status is updated by the CoolTech team as your ticket progresses.</div>
            </div>

            {openTicket.job?.jobId && <div className="ct-linked-job">🔧 Linked to work order <b>{openTicket.job.jobId}</b></div>}
          </div>
        </div>

        {toast && createPortal(<div className="ct-toast">{toast}</div>, document.getElementById('client-portal-root') || document.body)}
      </div>;
  }

  /* ── LIST VIEW ─────────────────────────────────────────────────────── */
  return <div className="ct-root">
      <style>{CSS}</style>

      <div className="ct-header-row">
        <div>
          <div className="ct-page-title">Support Tickets</div>
          <div className="ct-page-sub">Raise issues, request services, or ask questions</div>
        </div>
        <button className="ct-btn ct-btn-primary" onClick={() => setShowNewTicket(true)}>+ New Ticket</button>
      </div>

      <div className="ct-kpi-grid">
        <KCard label="Open" value={stats.open} icon="🔴" color="#DC2626" iconBg="#FEF2F2" />
        <KCard label="In Progress" value={stats.in_progress} icon="🟡" color="#B45309" iconBg="#FFFBEB" />
        <KCard label="Resolved" value={stats.resolved} icon="🟢" color="#166534" iconBg="#F0FDF4" />
        <KCard label="Total Tickets" value={totalTickets} icon="🎫" color="#3B82F6" iconBg="#EFF6FF" />
      </div>

      <div className="ct-filter-row">
        {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => <button key={f} className={`ct-filter-pill ${filterStatus === f ? 'active' : ''}`} onClick={() => setFilterStatus(f)}>
            {f === 'all' ? 'All' : TKT_STATUS[f].label}
          </button>)}
      </div>

      {loadError && <div className="ct-card ct-pad cp-tickets-page-1">
          {loadError} — <button className="ct-view-link cp-tickets-page-2" onClick={loadTickets}>Retry</button>
        </div>}

      <div className="ct-ticket-list">
        {isLoading && tickets.length === 0 && <div className="ct-empty ct-card ct-pad">Loading your tickets…</div>}
        {!isLoading && !loadError && filtered.length === 0 && <div className="ct-empty ct-card ct-pad">No tickets in this filter yet.</div>}
        {filtered.map(t => {
        const st = TKT_STATUS[t.status] || TKT_STATUS.open;
        const pr = TKT_PRIORITY[t.priority] || TKT_PRIORITY.medium;
        const cat = TKT_CATEGORIES[t.category] || TKT_CATEGORIES.other;
        return <div key={t._id} className="ct-card ct-ticket-row" onClick={() => handleOpenTicket(t._id)}>
              <div className="ct-ticket-icon" style={{
            background: cat.bg,
            border: `1.5px solid ${cat.color}30`
          }}>
                {cat.icon}
              </div>
              <div className="ct-ticket-main">
                <div className="ct-badge-row">
                  <span className="ct-mono-id">{t.ticketId}</span>
                  <Badge meta={st} /><Badge meta={pr} /><Badge meta={cat} />
                </div>
                <div className="ct-ticket-subject">{t.subject}</div>
                <div className="ct-ticket-sub">Assigned: {t.assignedTo || 'Unassigned'} · SLA: {t.sla || '—'}</div>
              </div>
              <div className="ct-ticket-right">
                <div className="ct-ticket-count">{(t.messages || []).length} msg{(t.messages || []).length !== 1 ? 's' : ''}</div>
                <div className="ct-ticket-time">{fmt(t.updatedAt)}</div>
                <span className="ct-view-link">View & Reply →</span>
              </div>
            </div>;
      })}
      </div>

      {/* New ticket modal — rendered via portal so the overlay covers the
          entire viewport instead of being clipped by a parent container */}
      {showNewTicket && createPortal(<div className="ct-modal-overlay" onClick={() => setShowNewTicket(false)}>
          <div className="ct-modal" onClick={e => e.stopPropagation()}>
            <div className="ct-modal-title">Raise a New Support Ticket</div>

            <div className="ct-form-field">
              <label className="ct-form-label">Subject *</label>
              <input className="ct-form-input" placeholder="Briefly describe the issue…" value={newTicket.subject} onChange={e => setNewTicket(p => ({
            ...p,
            subject: e.target.value
          }))} />
            </div>

            <div className="ct-form-grid-2">
              <div className="ct-form-field">
                <label className="ct-form-label">Category</label>
                <select className="ct-form-input" value={newTicket.category} onChange={e => setNewTicket(p => ({
              ...p,
              category: e.target.value
            }))}>
                  <option value="breakdown">Breakdown / Emergency</option>
                  <option value="scheduling">Scheduling</option>
                  <option value="billing">Billing</option>
                  <option value="query">General Query</option>
                  <option value="complaint">Complaint</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="ct-form-field">
                <label className="ct-form-label">Priority</label>
                <select className="ct-form-input" value={newTicket.priority} onChange={e => setNewTicket(p => ({
              ...p,
              priority: e.target.value
            }))}>
                  <option value="critical">Critical (Emergency)</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="ct-form-field">
              <label className="ct-form-label">Description</label>
              <textarea className="ct-form-input" rows={4} placeholder="Describe the issue in detail: which unit, symptoms, since when…" value={newTicket.description} onChange={e => setNewTicket(p => ({
            ...p,
            description: e.target.value
          }))} />
            </div>

            <div className="ct-sla-note">⏱ Expected response time: within 2 business hours for medium priority · immediate for Critical/High.</div>

            <div className="ct-modal-actions">
              <button className="ct-btn ct-btn-primary ct-btn-sm" onClick={handleSubmitTicket} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Submit Ticket'}
              </button>
              <button className="ct-btn ct-btn-ghost ct-btn-sm" onClick={() => setShowNewTicket(false)}>Cancel</button>
            </div>
          </div>
        </div>, document.getElementById('client-portal-root') || document.body)}

      {toast && createPortal(<div className="ct-toast">{toast}</div>, document.getElementById('client-portal-root') || document.body)}
    </div>;
};

/* ────────────────────────────────────────────────────────────────────────
   STYLES — plain CSS, scoped with a `ct-` prefix. No Tailwind.
   ──────────────────────────────────────────────────────────────────────── */
const CSS = `
.ct-root {
  font-family: ${FONTS.sans};
  color: ${COLORS.h2};
  max-width: 1080px;
  margin: 0 auto;
  animation: ctFadeIn .25s ease both;
}
@keyframes ctFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.ct-card {
  background: ${COLORS.white};
  border-radius: 14px;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
}
.ct-pad { padding: 18px 20px; }
.ct-pad-sm { padding: 14px 16px; }

.ct-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; gap: 16px; flex-wrap: wrap; }
.ct-page-title { font-size: 20px; font-weight: 800; color: ${COLORS.h1}; }
.ct-page-sub { font-size: 13px; color: ${COLORS.muted}; margin-top: 2px; }

.ct-btn {
  font-family: inherit; font-size: 13px; font-weight: 700; border: none; border-radius: 9px;
  cursor: pointer; transition: filter .15s, transform .1s;
}
.ct-btn:active { transform: translateY(1px); }
.ct-btn:disabled { opacity: .6; cursor: not-allowed; }
.ct-btn-primary {
  padding: 10px 20px; color: #fff;
  background: linear-gradient(135deg, ${COLORS.brand}, ${COLORS.brandD});
  box-shadow: 0 3px 10px ${COLORS.brand}40;
}
.ct-btn-primary:hover { filter: brightness(1.05); }
.ct-btn-ghost { padding: 10px 18px; background: #F1F5F9; color: ${COLORS.muted}; }
.ct-btn-ghost:hover { background: #E5E7EB; }
.ct-btn-sm { padding: 8px 16px; font-size: 12px; }

.ct-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
.ct-kcard { padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; }
.ct-kcard-label { font-size: 12px; color: ${COLORS.muted}; font-weight: 600; margin-bottom: 4px; }
.ct-kcard-value { font-size: 22px; font-weight: 800; }
.ct-kcard-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }

.ct-filter-row { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.ct-filter-pill {
  padding: 6px 14px; border-radius: 8px; background: #F1F5F9; color: ${COLORS.muted};
  font-size: 12px; font-weight: 700; border: none; cursor: pointer; transition: all .15s; font-family: inherit;
}
.ct-filter-pill.active { background: ${COLORS.brand}; color: #fff; }

.ct-ticket-list { display: flex; flex-direction: column; gap: 10px; }
.ct-ticket-row {
  padding: 14px 18px; display: flex; align-items: center; gap: 16px; cursor: pointer; transition: box-shadow .15s, transform .1s;
}
.ct-ticket-row:hover { box-shadow: 0 4px 14px rgba(0,0,0,.08); transform: translateY(-1px); }
.ct-ticket-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.ct-ticket-main { flex: 1; min-width: 0; }
.ct-badge-row { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; margin-bottom: 6px; }
.ct-mono-id { font-family: ${FONTS.mono}; font-size: 11px; font-weight: 700; color: ${COLORS.brand}; }
.ct-ticket-subject { font-size: 14px; font-weight: 700; color: ${COLORS.h1}; margin-bottom: 2px; }
.ct-ticket-sub { font-size: 12px; color: ${COLORS.muted}; }
.ct-ticket-right { text-align: right; flex-shrink: 0; }
.ct-ticket-count { font-size: 11px; color: ${COLORS.faint}; margin-bottom: 4px; }
.ct-ticket-time { font-size: 11px; color: ${COLORS.faint}; margin-bottom: 6px; }
.ct-view-link { font-size: 12px; font-weight: 700; color: ${COLORS.brand}; }

.ct-badge {
  display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700;
}

.ct-crumbs { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.ct-crumb-muted { font-size: 14px; color: ${COLORS.muted}; }
.ct-crumb-id { font-size: 14px; font-weight: 700; color: ${COLORS.brand}; font-family: ${FONTS.mono}; }
.ct-back-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid ${COLORS.border}; background: #fff;
  cursor: pointer; font-size: 15px; color: ${COLORS.h2}; display: flex; align-items: center; justify-content: center;
}
.ct-back-btn:hover { background: ${COLORS.bg}; }

.ct-detail-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
.ct-detail-main { display: flex; flex-direction: column; gap: 14px; }
.ct-detail-side { display: flex; flex-direction: column; gap: 12px; }
@media (max-width: 760px) { .ct-detail-grid { grid-template-columns: 1fr; } }

.ct-title-lg { font-size: 17px; font-weight: 800; color: ${COLORS.h1}; margin-bottom: 4px; }
.ct-meta-line { font-size: 12px; color: ${COLORS.muted}; }
.ct-section-title { font-size: 13px; font-weight: 700; color: ${COLORS.h1}; margin-bottom: 14px; }

.ct-thread { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.ct-empty { font-size: 12px; color: ${COLORS.faint}; text-align: center; padding: 12px 0; }
.ct-msg-row { display: flex; gap: 10px; }
.ct-msg-row.client { flex-direction: row-reverse; }
.ct-avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
.ct-avatar.client { background: #FFF7ED; border: 1.5px solid #FED7AA; }
.ct-avatar.support { background: #EFF6FF; border: 1.5px solid #BFDBFE; }
.ct-msg-col { max-width: 70%; }
.ct-msg-meta { font-size: 10px; color: ${COLORS.faint}; margin-bottom: 3px; }
.ct-msg-meta.left { text-align: right; }
.ct-msg-meta.right { text-align: left; }
.ct-bubble { padding: 10px 14px; border-radius: 12px 4px 12px 12px; font-size: 13px; line-height: 1.5; box-shadow: 0 1px 4px rgba(0,0,0,.07); }
.ct-bubble.client { background: linear-gradient(135deg, ${COLORS.brand}, ${COLORS.brandD}); color: #fff; border-radius: 4px 12px 12px 12px; }
.ct-bubble.support { background: #fff; color: ${COLORS.h2}; border: 1px solid ${COLORS.border}; }

.ct-reply-row { display: flex; gap: 8px; }
.ct-reply-input {
  flex: 1; padding: 10px 12px; border-radius: 9px; border: 1px solid ${COLORS.border};
  font-size: 13px; font-family: inherit; color: ${COLORS.h2}; resize: none;
}
.ct-reply-input:focus { outline: none; border-color: ${COLORS.brand}; }
.ct-send-btn { align-self: flex-end; }
.ct-closed-note { background: #F0FDF4; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #166534; font-weight: 600; }

.ct-info-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid ${COLORS.border}; gap: 10px; }
.ct-info-row:last-child { border-bottom: none; }
.ct-info-key { font-size: 11px; color: ${COLORS.faint}; }
.ct-info-val { font-size: 11px; font-weight: 600; color: ${COLORS.h2}; max-width: 150px; text-align: right; word-break: break-word; }

.ct-status-step { width: 100%; margin-bottom: 5px; padding: 8px 12px; border-radius: 7px; font-size: 12px; text-align: left; }
.ct-status-hint { font-size: 10.5px; color: ${COLORS.faint}; margin-top: 8px; line-height: 1.5; }
.ct-linked-job { background: ${COLORS.brandL}; border: 1px solid ${COLORS.brand}30; border-radius: 12px; padding: 12px 14px; font-size: 12px; color: ${COLORS.brandD}; }

.ct-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; margin: 0; padding: 20px;
  background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center;
  z-index: 9999; box-sizing: border-box; animation: ctFadeIn .15s ease both;
}
.ct-modal { background: #fff; border-radius: 16px; padding: 24px; width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,.25); }
.ct-modal-title { font-size: 16px; font-weight: 800; color: ${COLORS.h1}; margin-bottom: 16px; }
.ct-form-field { margin-bottom: 14px; }
.ct-form-label { display: block; font-size: 12px; font-weight: 700; color: ${COLORS.muted}; margin-bottom: 6px; }
.ct-form-input {
  width: 100%; padding: 9px 12px; border-radius: 8px; border: 1px solid ${COLORS.border};
  font-size: 13px; font-family: inherit; color: ${COLORS.h2}; box-sizing: border-box; background: #fff;
}
.ct-form-input:focus { outline: none; border-color: ${COLORS.brand}; }
.ct-form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ct-sla-note { background: ${COLORS.brandL}; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: ${COLORS.brandD}; font-weight: 600; margin-bottom: 18px; }
.ct-modal-actions { display: flex; gap: 8px; }

.ct-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: ${COLORS.h1}; color: #fff; padding: 12px 20px; border-radius: 10px;
  font-size: 13px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,.2); z-index: 10000;
  animation: ctFadeIn .2s ease both;
}
`;
export default TicketsPage;