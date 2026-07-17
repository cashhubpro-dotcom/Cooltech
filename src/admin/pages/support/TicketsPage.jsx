import { TKT_STATUS, TKT_PRIORITY, TKT_CATEGORIES } from '../../constants/statusMaps';
import { ticketsApi, jobsApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge } from '../../components/ui/Badges';
import { KCard, BackBtn } from '../../components/ui/Cards';
import { NewTicketModal, StatusUpdateModal } from '../../components/modals/Modals';

// ─── TicketsPage ───────────────────────────────────────────────────────────────

const TicketsPage = ({
  openModal
}) => {
  const [tickets, setTickets] = useState([]);
  useEffect(() => {
    ticketsApi.list({
      limit: 200
    }).then(r => setTickets((r.data ?? []).map(t => ({
      ...t,
      id: t._id,
      displayId: t.ticketId || t._id,
      customerRef: t.customer?._id || (typeof t.customer === 'string' ? t.customer : null),
      customer: t.customer?.name || t.customerName || '—',
      customerId: t.customer?.customerId || '—',
      contact: t.contact || t.customer?.email || t.email || '—',
      phone: t.phone || t.customer?.phone || '—',
      created: t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }) : '—',
      updated: t.updatedAt ? new Date(t.updatedAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }) : '—',
      assignedTo: t.assignedTo || 'Unassigned',
      job: t.job?.jobId || null
    })))).catch(() => {});
  }, []);
  const [open, setOpen] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const ticket = open ? tickets.find(t => (t.id ?? t._id) === open) : null;
  const filtered = filterStatus === "all" ? tickets : tickets.filter(t => t.status === filterStatus);

  /**
   * THE FIX: this was previously just `onClick={() => setReply("")}` on the
   * Send button — it cleared the textarea but never called the API, so no
   * message was ever persisted or broadcast anywhere.
   *
   * Posts to POST /api/tickets/:id/messages (ticketsApi.addMessage), which
   * your backend's generic ticket router already handles via
   * `$push: { messages: { ...req.body, time: new Date() } }` — it returns
   * the full updated ticket, which we use to refresh local state so the
   * conversation re-renders immediately without a full re-fetch.
   */
  const handleSendReply = async () => {
    if (!reply.trim() || !ticket || sendingReply) return;
    const realId = ticket._id || ticket.id;
    const text = reply.trim();
    setSendingReply(true);
    try {
      const updated = await ticketsApi.addMessage(realId, {
        from: 'CoolTech Support',
        msg: text,
        isClient: false
      });
      setTickets(prev => prev.map(t => (t.id ?? t._id) === realId ? {
        ...t,
        messages: updated.messages,
        updated: updated.updatedAt ? new Date(updated.updatedAt).toLocaleString() : t.updated
      } : t));
      setReply("");
    } catch (err) {
      console.error('Failed to send reply:', err);
      // reply text intentionally left in the box so nothing typed is lost
    } finally {
      setSendingReply(false);
    }
  };
  const handleConfirmStatus = async newStatus => {
    const realId = ticket._id || ticket.id;
    const updated = newStatus === "resolved" ? await ticketsApi.resolve(realId) : await ticketsApi.update(realId, {
      status: newStatus
    });
    setTickets(prev => prev.map(t => t.id === realId ? {
      ...t,
      status: updated.status,
      resolvedAt: updated.resolvedAt,
      updated: updated.updatedAt ? new Date(updated.updatedAt).toLocaleString() : t.updated
      // customer, customerId, contact, phone, displayId intentionally NOT overwritten
      // from this response — they stay as originally normalized from the list fetch
    } : t));
  };
  const handleCreateTicket = async ({
    autoCreateJob,
    ...payload
  }) => {
    const createdRes = await ticketsApi.create(payload);
    const created = createdRes.data ?? createdRes;
    if (autoCreateJob) {
      try {
        const jobRes = await jobsApi.create({
          customer: payload.customer,
          customerName: payload.customerName,
          type: "Repair",
          priority: payload.priority === 'critical' ? 'urgent' : payload.priority === 'high' ? 'high' : 'normal',
          technician: undefined,
          techName: payload.assignedTo || "Unassigned",
          ac: payload.ac,
          issue: payload.subject,
          address: payload.address
        });
        const newJob = jobRes.data ?? jobRes;
        await ticketsApi.update(created._id, {
          job: newJob._id
        }).catch(() => {});
      } catch (e) {
        console.error('Auto work-order creation failed:', e);
      }
    }
    const r = await ticketsApi.list({
      limit: 200
    });
    setTickets((r.data ?? []).map(t => ({
      ...t,
      id: t._id,
      displayId: t.ticketId || t._id,
      customerRef: t.customer?._id || (typeof t.customer === 'string' ? t.customer : null),
      customer: t.customer?.name || t.customerName || '—',
      customerId: t.customer?.customerId || '—',
      contact: t.contact || t.customer?.email || t.email || '—',
      phone: t.phone || t.customer?.phone || '—',
      created: t.createdAt ? new Date(t.createdAt).toLocaleString() : '—',
      updated: t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '—',
      assignedTo: t.assignedTo || 'Unassigned',
      job: t.job?.jobId || null
    })));
    setShowNewTicket(false);
  };

  // ── DETAIL VIEW ─────────────────────────────────────────────────────────────
  if (ticket) {
    const st = TKT_STATUS[ticket.status] || TKT_STATUS.open;
    const pr = TKT_PRIORITY[ticket.priority] || TKT_PRIORITY.medium;
    const cat = TKT_CATEGORIES[ticket.category] || TKT_CATEGORIES.general;
    return <div className="fi ap-tickets-page-1">
        <div className="ap-tickets-page-2">
          <BackBtn onClick={() => setOpen(null)} />
          <span className="ap-tickets-page-3">Support Tickets /</span>
          <span className="ap-tickets-page-4">{ticket.displayId}</span>
        </div>

        <div className="ap-tickets-page-5">
          <div className="ap-tickets-page-6">

            {/* Header card */}
            <div className="ap-tickets-page-7">
              <div className="ap-tickets-page-8">
                <span className="badge" style={{
                background: st.bg,
                color: st.color
              }}>{st.label}</span>
                <span className="badge" style={{
                background: pr.bg,
                color: pr.color
              }}>{pr.label}</span>
                <span className="badge" style={{
                background: cat.bg,
                color: cat.color
              }}>{cat.label}</span>
              </div>
              <div className="ap-tickets-page-9">{ticket.subject}</div>
              <div className="ap-tickets-page-10">
                {ticket.customer} · SLA: {ticket.sla} · Assigned: {ticket.assignedTo}
              </div>
            </div>

            {/* Conversation card */}
            <div className="ap-tickets-page-11">
              <div className="ap-tickets-page-12">Conversation</div>

              <div className="ap-tickets-page-13">
                {ticket.messages.map((m, i) => <div key={m._id ?? `msg-${i}`} style={{
                flexDirection: m.isClient ? "row" : "row-reverse"
              }} className="ap-tickets-page-14">
                    <div style={{
                  background: m.isClient ? "var(--info-bg)" : "var(--brand-light)",
                  border: `1.5px solid ${m.isClient ? "#BFDBFE" : "#FED7AA"}`
                }} className="ap-tickets-page-15">
                      {m.isClient ? "👤" : "🛠"}
                    </div>
                    <div className="ap-tickets-page-16">
                      <div style={{
                    textAlign: m.isClient ? "left" : "right"
                  }} className="ap-tickets-page-17">
                        {m.from} · {m.time ? new Date(m.time).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    }) : ''}
                      </div>
                      <div style={{
                    background: m.isClient ? "var(--white)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
                    color: m.isClient ? "var(--text-h2)" : "white",
                    borderRadius: m.isClient ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                    border: m.isClient ? "1px solid var(--border)" : "none"
                  }} className="ap-tickets-page-18">
                        {m.msg}
                      </div>
                    </div>
                  </div>)}
              </div>

              {ticket.status !== "closed" && <div className="ap-tickets-page-19">
                  <textarea value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }} placeholder="Type your reply…" rows={2} className="ap-tickets-page-20" />
                  <button className="btn ap-tickets-page-21" onClick={handleSendReply} disabled={sendingReply || !reply.trim()} style={{
                opacity: sendingReply || !reply.trim() ? "0.6" : "1",
                cursor: sendingReply || !reply.trim() ? "not-allowed" : "pointer"
              }}>
                    {sendingReply ? 'Sending…' : 'Send'}
                  </button>
                </div>}
            </div>
          </div>

          {/* Sidebar */}
          <div className="ap-tickets-page-22">

            {/* Ticket info */}
            <div className="ap-tickets-page-23">
              <div className="ap-tickets-page-24">Ticket Info</div>
              {[["Customer Id", ticket.customerId], ["Name", ticket.customer], ["Email", ticket.email], ["Phone", ticket.phone], ["Created", ticket.created], ["Updated", ticket.updated], ["Assigned", ticket.assignedTo], ["Linked Job", ticket.job || "—"]].map(([k, v]) => <div key={k} className="ap-tickets-page-25">
                  <span className="ap-tickets-page-26">{k}</span>
                  <span className="ap-tickets-page-27">{v}</span>
                </div>)}
            </div>

            {/* Update Status */}
            <div className="ap-tickets-page-28">
              <div className="ap-tickets-page-29">Update Status</div>
              {Object.entries(TKT_STATUS).map(([k, s]) => <button key={k} className="btn ap-tickets-page-30" onClick={() => {
              if (k === ticket.status) return;
              setPendingStatus(k);
            }} style={{
              background: ticket.status === k ? s.bg : "#F9FAFB",
              color: ticket.status === k ? s.color : COLORS.muted,
              fontWeight: ticket.status === k ? "700" : "500",
              border: `1px solid ${ticket.status === k ? s.color + "30" : COLORS.border}`,
              cursor: ticket.status === k ? "default" : "pointer"
            }}>
                  {ticket.status === k ? "● " : "○ "}{s.label}
                </button>)}
            </div>

            {/* ── Status confirmation modal ── */}
            <StatusUpdateModal open={!!pendingStatus} onClose={() => setPendingStatus(null)} onConfirm={handleConfirmStatus} ticket={ticket} newStatus={pendingStatus} statusMeta={pendingStatus ? TKT_STATUS[pendingStatus] : null} />

            <button className="btn ap-tickets-page-31" onClick={() => openModal('new_job', {
            fromTicket: {
              id: ticket.id,
              customer: ticket.customerRef,
              customerName: ticket.customer,
              issue: ticket.subject,
              priority: ticket.priority,
              address: ticket.address || '',
              ac: ticket.acUnit || ''
            }
          })}>
              🔧 Create Work Order
            </button>
          </div>
        </div>
      </div>;
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;
  return <div className="fu">

      {/* ── Header ── */}
      <div className="ap-tickets-page-32">
        <div>
          <div className="ap-tickets-page-33">Support Tickets</div>
          <div className="ap-tickets-page-34">Customer support requests &amp; issue resolution</div>
        </div>

        <button className="btn ap-tickets-page-35" onClick={() => setShowNewTicket(true)}>
          + New Ticket
        </button>
      </div>

      {/* ── KPI cards ── */}
      <div className="ap-tickets-page-36">
        {[{
        label: "Open",
        value: openCount,
        icon: "🔴",
        color: "#DC2626",
        bg: "#FEF2F2"
      }, {
        label: "In Progress",
        value: inProgCount,
        icon: "🟡",
        color: "#B45309",
        bg: "#FFFBEB"
      }, {
        label: "Resolved",
        value: resolvedCount,
        icon: "🟢",
        color: "#166534",
        bg: "#F0FDF4"
      }, {
        label: "Avg Response",
        value: "2.3h",
        icon: "⚡",
        color: "#3B82F6",
        bg: "#EFF6FF"
      }].map(s => <KCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} iconBg={s.bg} />)}
      </div>

      {/* ── Status filters ── */}
      <div className="ap-tickets-page-37">
        {["all", "open", "in_progress", "resolved", "closed"].map(f => <button key={f} onClick={() => setFilterStatus(f)} style={{
        background: filterStatus === f ? "var(--brand)" : "var(--bg)",
        color: filterStatus === f ? "white" : "var(--text-muted)"
      }} className="ap-tickets-page-38">
            {f === "all" ? "All" : TKT_STATUS[f]?.label || f}
          </button>)}
      </div>

      {/* ── Ticket list ── */}
      <div className="ap-tickets-page-39">
        {filtered.map(t => {
        const st = TKT_STATUS[t.status] || TKT_STATUS.open;
        const pr = TKT_PRIORITY[t.priority] || TKT_PRIORITY.medium;
        const cat = TKT_CATEGORIES[t.category] || TKT_CATEGORIES.general;
        return <div key={t.id} className="card ap-tickets-page-40" onClick={() => setOpen(t.id || t._id)}>
              <div style={{
            background: cat.bg,
            border: `1.5px solid ${cat.color}30`
          }} className="ap-tickets-page-41">
                {t.category === "breakdown" ? "⚡" : t.category === "quality" ? "🔧" : t.category === "billing" ? "💰" : "📅"}
              </div>

              <div className="ap-tickets-page-42">
                <div className="ap-tickets-page-43">
                  <span className="ap-tickets-page-44">{t.displayId}</span>
                  <span key="status" className="badge" style={{
                background: st.bg,
                color: st.color
              }}>{st.label}</span>
                  <span key="priority" className="badge" style={{
                background: pr.bg,
                color: pr.color
              }}>{pr.label}</span>
                  <span key="category" className="badge" style={{
                background: cat.bg,
                color: cat.color
              }}>{cat.label}</span>
                </div>
                <div className="ap-tickets-page-45">{t.subject}</div>
                <div className="ap-tickets-page-46">
                  {t.customer} · Assigned: {t.assignedTo} · SLA: {t.sla}
                </div>
              </div>

              <div className="ap-tickets-page-47">
                <div className="ap-tickets-page-48">{t.messages.length} msgs</div>
                <div className="ap-tickets-page-49">{t.updated}</div>
              </div>
            </div>;
      })}
      </div>

      {/* ── NEW TICKET MODAL ── */}
      <NewTicketModal open={showNewTicket} onClose={() => setShowNewTicket(false)} onSave={handleCreateTicket} />
    </div>;
};
export default TicketsPage;