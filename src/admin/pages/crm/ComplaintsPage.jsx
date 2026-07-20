import { COMP_STATUS } from '../../constants/statusMaps';
import { complaintsApi } from '../../services/api';
import { useState, useEffect, useCallback } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Lightweight read-only detail modal ────────────────────────────────────
const ViewComplaintModal = ({ comp, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{
      background: COLORS.white, borderRadius: 14, padding: 22, width: 460,
      maxWidth: '92vw', boxShadow: '0 10px 40px rgba(0,0,0,.2)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.h1 }}>{comp.displayId}</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <SBadge s={comp.status} map={COMP_STATUS} />
        <SevBadge s={comp.severity} />
        <TypeTag type={comp.category} />
      </div>
      {[
        ['Customer', comp.customer],
        ['Technician', comp.tech],
        ['Job', comp.job],
        ['Logged', comp.date],
      ].map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={{ fontSize: 12, color: COLORS.faint }}>{k}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.h2 }}>{v}</span>
        </div>
      ))}
      <div style={{ marginTop: 14, fontSize: 13, color: COLORS.body, lineHeight: 1.6 }}>{comp.description}</div>
      {comp.resolution && (
        <div style={{ marginTop: 14, padding: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 12, color: '#166534' }}>
          <strong>Resolution: </strong>{comp.resolution}
        </div>
      )}
    </div>
  </div>
);

const normalizeComplaint = (c, idx) => ({
  ...c,
  id: c.id ?? c._id ?? `comp-${idx}`,              // Mongo _id — used for API calls & React key
  displayId: c.complaintId ?? c.id ?? c._id ?? `#${idx}`,  // human-readable CMP-xxx — used for UI text
  status: (c.status ?? 'open').toLowerCase(),
  customer: c.customerName || (typeof c.customer === 'object' ? c.customer?.name : null) || 'Unknown',
  customerId: typeof c.customer === 'object' ? c.customer?._id : c.customer,
  tech: c.techName || (typeof c.technician === 'object' ? c.technician?.name : null) || 'Unassigned',
  technicianId: typeof c.technician === 'object' ? c.technician?._id : c.technician,
  job: c.jobRef || (typeof c.job === 'object' ? c.job?.jobId : null) || '—',
  description: c.description ?? c.desc ?? '',
  severity: c.severity ?? 'medium',
  date: c.date ?? (c.createdAt ?fmtDateDMY(new Date(c.createdAt)) : ''),
});

const ComplaintsPage = ({ openModal }) => {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState('all');
  const [viewing, setViewing] = useState(null);

  const load = useCallback(() => {
    complaintsApi.list({ limit: 200 })
      .then(r => setComplaints((r.data ?? []).map(normalizeComplaint)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);

  const shown = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);
  const openC = complaints.filter(c => c.status === 'open').length;
  const inProgC = complaints.filter(c => c.status === 'in_progress').length;
  const resolvedC = complaints.filter(c => c.status === 'resolved').length;
  const closedC = complaints.filter(c => c.status === 'closed').length;
  const statusDot = status => COMP_STATUS[status]?.dot ?? '#E5E7EB';

  return (
    <div className="fi ap-complaints-page-1">
      <SectionHdr title="Complaints & Feedback" sub={`${complaints.length} total · ${openC} open`}
        action="+ Log Complaint" onAction={() => openModal('assign_complaint', { id: 'New' })} />

      <div className="ap-complaints-page-2">
        <KCard label="Open" value={openC} sub="need resolution" icon="🔴" iconBg="#FEF2F2" color="#DC2626" />
        <KCard label="In Progress" value={inProgC} sub="being resolved" icon="🟡" iconBg="#FFFBEB" color="#B45309" />
        <KCard label="Resolved" value={resolvedC} sub="this month" icon="🟢" iconBg="#F0FDF4" color="#16A34A" />
        <KCard label="Avg Resolution" value="2.3 days" sub="response time" icon="⏱" iconBg="#EFF6FF" color="#0369A1" />
      </div>

      <div className="ap-complaints-page-3">
        {[['all', 'All', complaints.length], ['open', 'Open', openC], ['in_progress', 'In Progress', inProgC],
          ['resolved', 'Resolved', resolvedC], ['closed', 'Closed', closedC]].map(([k, l, c]) => (
          <button key={k} onClick={() => setFilter(k)} className="ap-complaints-page-4">
            {l}<span className="ap-complaints-page-5">{c}</span>
          </button>
        ))}
      </div>

      <div className="ap-complaints-page-6">
        {shown.length === 0 && <div className="ap-complaints-page-7">No complaints match this filter.</div>}
        {shown.map(comp => (
          <div key={comp.id} style={{ borderLeft: `3px solid ${statusDot(comp.status)}` }} className="ap-complaints-page-8">
            <div className="ap-complaints-page-9">
              <div className="ap-complaints-page-10">
                <div className="ap-complaints-page-11">
                  <span className="ap-complaints-page-12">{comp.displayId}</span>
                  <SBadge s={comp.status} map={COMP_STATUS} />
                  <SevBadge s={comp.severity} />
                  <TypeTag type={comp.category} />
                  <span className="ap-complaints-page-13">{comp.date}</span>
                </div>
                <div className="ap-complaints-page-14">
                  <div><span className="ap-complaints-page-15">Customer: </span><span className="ap-complaints-page-16">{comp.customer}</span></div>
                  <div><span className="ap-complaints-page-17">Technician: </span><span className="ap-complaints-page-18">{comp.tech}</span></div>
                  <div><span className="ap-complaints-page-19">Job: </span><span className="ap-complaints-page-20">{comp.job}</span></div>
                </div>
                <div style={{ marginBottom: comp.resolution ? '10px' : '0' }} className="ap-complaints-page-21">{comp.description}</div>
                {comp.resolution && <div className="ap-complaints-page-22"><strong>Resolution: </strong>{comp.resolution}</div>}
              </div>
              <div className="ap-complaints-page-23">
                {comp.status === 'open' && (
                  <button className="btn ap-complaints-page-24" onClick={() => openModal('assign_complaint', { id: comp.id, displayId: comp.displayId })}>Assign</button>
                )}
                {['open', 'in_progress'].includes(comp.status) && (
                  <button className="btn ap-complaints-page-25" onClick={() => openModal('resolve_complaint', { id: comp.id, displayId: comp.displayId })}>Resolve</button>
                )}
                <button className="btn ap-complaints-page-26" onClick={() => setViewing(comp)}>View</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewing && <ViewComplaintModal comp={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
};

export default ComplaintsPage;