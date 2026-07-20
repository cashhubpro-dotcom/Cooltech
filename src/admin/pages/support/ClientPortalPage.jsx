// pages/ClientPortalPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, FONTS } from '../../constants/tokens';
import { clientPortalApi } from '../../services/api';
import { fmtDateDMY } from '../../../shared/formatDate';

// ── Status maps ───────────────────────────────────────────────────────────────
const JOB_STATUS = {
  pending: {
    label: 'Pending',
    dot: "var(--warning)",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  assigned: {
    label: 'Assigned',
    dot: "var(--info)",
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  inprogress: {
    label: 'In Progress',
    dot: "var(--purple)",
    bg: "var(--purple-bg)",
    color: "var(--purple-text)"
  },
  completed: {
    label: 'Completed',
    dot: "var(--success)",
    bg: "var(--success-bg)",
    color: "var(--x065f46)"
  },
  cancelled: {
    label: 'Cancelled',
    dot: "var(--danger)",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  }
};
const INV_STATUS = {
  pending: {
    label: 'Pending',
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  paid: {
    label: 'Paid',
    bg: "var(--success-bg)",
    color: "var(--x065f46)"
  },
  overdue: {
    label: 'Overdue',
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  draft: {
    label: 'Draft',
    bg: "var(--bg)",
    color: "var(--text-muted)"
  }
};
const TKT_STATUS = {
  open: {
    label: 'Open',
    bg: "var(--info-bg)",
    color: "var(--info-text)"
  },
  in_progress: {
    label: 'In Progress',
    bg: "var(--purple-bg)",
    color: "var(--purple-text)"
  },
  resolved: {
    label: 'Resolved',
    bg: "var(--success-bg)",
    color: "var(--x065f46)"
  },
  closed: {
    label: 'Closed',
    bg: "var(--bg)",
    color: "var(--text-muted)"
  }
};
const CON_STATUS = {
  active: {
    label: 'Active',
    bg: "var(--success-bg)",
    color: "var(--x065f46)"
  },
  pending: {
    label: 'Pending',
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  pending_signature: {
    label: 'Pending Signature',
    bg: "var(--brand-light)",
    color: "var(--brand-dark)"
  },
  expired: {
    label: 'Expired',
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  draft: {
    label: 'Draft',
    bg: "var(--bg)",
    color: "var(--text-muted)"
  },
  cancelled: {
    label: 'Cancelled',
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  }
};
const AMC_STATUS = {
  active: {
    label: 'Active',
    bg: "var(--success-bg)",
    color: "var(--x065f46)"
  },
  expired: {
    label: 'Expired',
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  pending: {
    label: 'Pending',
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ?fmtDateDMY(new Date(d)) : '—';
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
const StatusBadge = ({
  status,
  map
}) => {
  const s = map?.[status] || {
    label: status || '—',
    bg: '#F1F5F9',
    color: '#64748B'
  };
  return <span style={{
    background: s.bg,
    color: s.color
  }} className="ap-client-portal-page-1">
      {s.label}
    </span>;
};

// ── Section card ──────────────────────────────────────────────────────────────
const Section = ({
  title,
  action,
  children,
  viewAllPath,
  count
}) => {
  const navigate = useNavigate();
  return <div className="ap-client-portal-page-2">
      <div className="ap-client-portal-page-3">
        <span className="ap-client-portal-page-4">
          {title}
          {count > 0 && <span className="ap-client-portal-page-5">
              {count}
            </span>}
        </span>
        <div className="ap-client-portal-page-6">
          {action}
          {viewAllPath && <button onClick={() => navigate(viewAllPath)} className="ap-client-portal-page-7">
              View All →
            </button>}
        </div>
      </div>
      {children}
    </div>;
};
const Empty = ({
  msg
}) => <div className="ap-client-portal-page-8">
    {msg}
  </div>;

// ═════════════════════════════════════════════════════════════════════════════
const ClientPortalPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [custLoading, setCustLoading] = useState(true);
  const [raisingTicket, setRaisingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [signingId, setSigningId] = useState(null);
  const [toast, setToast] = useState('');
  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };

  // ── Load customer dropdown ─────────────────────────────────────────────────
  useEffect(() => {
    clientPortalApi.getCustomers().then(res => {
      const list = res?.data ?? res ?? [];
      setCustomers(list);
      if (list.length > 0) setSelectedId(String(list[0]._id));
    }).catch(() => {}).finally(() => setCustLoading(false));
  }, []);

  // ── Load portal data when customer changes ─────────────────────────────────
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setPortalData(null);
    setShowTicketForm(false);
    clientPortalApi.getPortalData(selectedId).then(res => setPortalData(res?.data ?? res)).catch(() => {}).finally(() => setLoading(false));
  }, [selectedId]);
  const {
    customer,
    jobs = [],
    invoices = [],
    tickets = [],
    contracts = [],
    amcs = []
  } = portalData || {};

  // ── Raise ticket ───────────────────────────────────────────────────────────
  const handleRaiseTicket = async () => {
    if (!ticketForm.subject.trim()) return;
    setRaisingTicket(true);
    try {
      const res = await clientPortalApi.raiseTicket(selectedId, ticketForm);
      const newTicket = res?.data ?? res;
      setPortalData(prev => ({
        ...prev,
        tickets: [newTicket, ...(prev.tickets || [])]
      }));
      setTicketForm({
        subject: '',
        description: '',
        priority: 'medium'
      });
      setShowTicketForm(false);
      showToast('✅ Ticket raised — visible in Support Tickets module');
    } catch {
      showToast('❌ Failed to raise ticket');
    } finally {
      setRaisingTicket(false);
    }
  };

  // ── Sign contract ──────────────────────────────────────────────────────────
  const handleSignContract = async contractId => {
    setSigningId(contractId);
    try {
      await clientPortalApi.signContract(selectedId, contractId);
      setPortalData(prev => ({
        ...prev,
        contracts: (prev.contracts || []).map(c => String(c._id) === String(contractId) ? {
          ...c,
          signed: true,
          status: 'active'
        } : c)
      }));
      showToast('✅ Contract signed successfully!');
    } catch {
      showToast('❌ Failed to sign contract');
    } finally {
      setSigningId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return <div className="ap-client-portal-page-9">

      {/* Toast */}
      {toast && <div className="ap-client-portal-page-10">
          {toast}
        </div>}

      {/* ── Admin banner ──────────────────────────────────────────────────── */}
      <div className="ap-client-portal-page-11">
        <span className="ap-client-portal-page-12">👁</span>
        <div className="ap-client-portal-page-13">
          <div className="ap-client-portal-page-14">
            Admin Preview Mode — Client Portal
          </div>
          <div className="ap-client-portal-page-15">
            You are previewing what the customer sees when they log in to their portal.
          </div>
        </div>
        {custLoading ? <span className="ap-client-portal-page-16">Loading…</span> : <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="ap-client-portal-page-17">
            {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>}
      </div>

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && <div className="ap-client-portal-page-18">
          Loading portal data…
        </div>}

      {/* ── Portal UI ─────────────────────────────────────────────────────── */}
      {!loading && customer && <div className="ap-client-portal-page-19">

          {/* Header */}
          <div className="ap-client-portal-page-20">
            <div className="ap-client-portal-page-21">
              {initials(customer.name)}
            </div>
            <div>
              <div className="ap-client-portal-page-22">
                {customer.name}
              </div>
              <div className="ap-client-portal-page-23">
                {customer.contact} · {customer.email}
              </div>
            </div>
            <div className="ap-client-portal-page-24">
              <div className="ap-client-portal-page-25">Customer Since</div>
              <div className="ap-client-portal-page-26">
                {fmtDate(customer.customerSince)}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="ap-client-portal-page-27">
            {[{
          label: 'Total Jobs',
          value: customer.totalJobs || jobs.length,
          icon: '🔧'
        }, {
          label: 'Total Spent',
          value: `₹${((customer.totalSpent || 0) / 1000).toFixed(0)}K`,
          icon: '💰'
        }, {
          label: 'AC Units',
          value: customer.units || 0,
          icon: '❄️'
        }, {
          label: 'AMC Active',
          value: customer.amc ? 'Yes' : 'No',
          icon: '📋'
        }].map((s, i) => <div key={s.label} style={{
          borderRight: i < 3 ? "1px solid var(--border)" : "none"
        }} className="ap-client-portal-page-28">
                <div className="ap-client-portal-page-29">{s.icon}</div>
                <div className="ap-client-portal-page-30">{s.value}</div>
                <div className="ap-client-portal-page-31">{s.label}</div>
              </div>)}
          </div>

          {/* Content grid */}
          <div className="ap-client-portal-page-32">

            {/* ── Jobs ──────────────────────────────────────────────────── */}
            <Section title="Recent Service Visits" viewAllPath="/admin/jobs" count={jobs.length}>
              {jobs.length === 0 ? <Empty msg="No jobs yet" /> : jobs.slice(0, 5).map(j => <div key={j._id} className="ap-client-portal-page-33">
                    <div style={{
              background: JOB_STATUS[j.status]?.dot || '#94A3B8'
            }} className="ap-client-portal-page-34" />
                    <div className="ap-client-portal-page-35">
                      <div className="ap-client-portal-page-36">
                        {j.type || 'Service'}{j.ac ? ` – ${j.ac}` : ''}
                      </div>
                      <div className="ap-client-portal-page-37">
                        {fmtDate(j.date || j.scheduledDate)} · {j.tech || j.technician || '—'}
                      </div>
                    </div>
                    <StatusBadge status={j.status} map={JOB_STATUS} />
                  </div>)}
              {jobs.length > 5 && <div className="ap-client-portal-page-38">
                  +{jobs.length - 5} more — click View All
                </div>}
            </Section>

            {/* ── Invoices ──────────────────────────────────────────────── */}
            <Section title="Invoices" viewAllPath="/admin/invoices" count={invoices.length}>
              {invoices.length === 0 ? <Empty msg="No invoices" /> : invoices.slice(0, 5).map(i => <div key={i._id} className="ap-client-portal-page-39">
                    <div className="ap-client-portal-page-40">
                      <div className="ap-client-portal-page-41">
                        {i.invoiceNo || i._id}
                      </div>
                      <div className="ap-client-portal-page-42">
                        {fmtDate(i.date)} · Due {fmtDate(i.dueDate)}
                      </div>
                    </div>
                    <div className="ap-client-portal-page-43">
                      <div className="ap-client-portal-page-44">
                        ₹{(i.total || 0).toLocaleString('en-IN')}
                      </div>
                      <StatusBadge status={i.paid ? 'paid' : i.status} map={INV_STATUS} />
                    </div>
                  </div>)}
              {invoices.length > 5 && <div className="ap-client-portal-page-45">
                  +{invoices.length - 5} more — click View All
                </div>}
            </Section>

            {/* ── Tickets ───────────────────────────────────────────────── */}
            <Section title="Support Tickets" viewAllPath="/admin/tickets" count={tickets.length} action={<button onClick={() => setShowTicketForm(p => !p)} className="ap-client-portal-page-46">
                  {showTicketForm ? '✕ Cancel' : '+ Raise Ticket'}
                </button>}>
              {/* Raise ticket form */}
              {showTicketForm && <div className="ap-client-portal-page-47">
                  <input value={ticketForm.subject} onChange={e => setTicketForm(p => ({
              ...p,
              subject: e.target.value
            }))} placeholder="Subject *" className="ap-client-portal-page-48" />
                  <textarea value={ticketForm.description} onChange={e => setTicketForm(p => ({
              ...p,
              description: e.target.value
            }))} placeholder="Describe the issue…" rows={2} className="ap-client-portal-page-49" />
                  <div className="ap-client-portal-page-50">
                    <select value={ticketForm.priority} onChange={e => setTicketForm(p => ({
                ...p,
                priority: e.target.value
              }))} className="ap-client-portal-page-51">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <button onClick={handleRaiseTicket} disabled={raisingTicket || !ticketForm.subject.trim()} style={{
                background: raisingTicket || !ticketForm.subject.trim() ? "var(--xcbd5e1)" : "var(--brand)",
                cursor: raisingTicket ? "not-allowed" : "pointer"
              }} className="ap-client-portal-page-52">
                      {raisingTicket ? 'Submitting…' : 'Submit Ticket'}
                    </button>
                    <button onClick={() => navigate('/admin/tickets')} className="ap-client-portal-page-53">
                      View All Tickets
                    </button>
                  </div>
                </div>}

              {tickets.length === 0 ? <Empty msg="No open tickets" /> : tickets.slice(0, 5).map(t => <div key={t._id} className="ap-client-portal-page-54">
                    <div className="ap-client-portal-page-55">
                      <div className="ap-client-portal-page-56">
                        {(t.subject || '').slice(0, 42)}{(t.subject || '').length > 42 ? '…' : ''}
                      </div>
                      <div className="ap-client-portal-page-57">
                        {t.ticketId} · {fmtDate(t.updatedAt || t.createdAt)}
                      </div>
                    </div>
                    <StatusBadge status={t.status} map={TKT_STATUS} />
                  </div>)}
              {tickets.length > 5 && <div className="ap-client-portal-page-58">
                  +{tickets.length - 5} more — click View All
                </div>}
            </Section>

            {/* ── Contracts & AMC ───────────────────────────────────────── */}
            <Section title="Contracts & AMC" viewAllPath="/admin/amc" count={contracts.length + amcs.length}>
              {/* AMC entries */}
              {amcs.map(a => <div key={a._id} className="ap-client-portal-page-59">
                  <div className="ap-client-portal-page-60">
                    <div className="ap-client-portal-page-61">
                      {a.planName || a.amcId} · {a.units || 0} units
                    </div>
                    <StatusBadge status={a.status} map={AMC_STATUS} />
                  </div>
                  <div className="ap-client-portal-page-62">
                    ₹{(a.amount || 0).toLocaleString('en-IN')} · {fmtDate(a.startDate)} – {fmtDate(a.endDate)}
                    {a.nextService && ` · Next: ${fmtDate(a.nextService)}`}
                  </div>
                </div>)}

              {/* Contract entries */}
              {contracts.map(c => <div key={c._id} className="ap-client-portal-page-63">
                  <div className="ap-client-portal-page-64">
                    <div className="ap-client-portal-page-65">
                      {c.title || c.contractId}
                    </div>
                    <StatusBadge status={c.status} map={CON_STATUS} />
                  </div>
                  <div className="ap-client-portal-page-66">
                    ₹{(c.value || 0).toLocaleString('en-IN')} · {fmtDate(c.startDate)} – {fmtDate(c.endDate)}
                  </div>
                  {!c.signed && <button onClick={() => handleSignContract(c._id)} disabled={signingId === String(c._id)} className="ap-client-portal-page-67">
                      {signingId === String(c._id) ? 'Signing…' : '✍ Sign Contract'}
                    </button>}
                  {c.signed && <div className="ap-client-portal-page-68">
                      ✓ Signed
                    </div>}
                </div>)}

              {contracts.length === 0 && amcs.length === 0 && <Empty msg="No contracts or AMC" />}

              {contracts.length + amcs.length > 5 && <div className="ap-client-portal-page-69">
                  Click View All to see everything
                </div>}
            </Section>

          </div>
        </div>}

      {/* Empty state */}
      {!loading && !customer && !custLoading && <div className="ap-client-portal-page-70">
          No customers found. Add customers first.
        </div>}
    </div>;
};
export default ClientPortalPage;