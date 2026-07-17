import { useState, useEffect, useMemo } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge } from '../../components/ui/Badges';
import { Thead } from '../../components/ui/Cards';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import Pagination from '../../components/ui/Pagination';
import { partRequestsApi } from '../../services/api';
const STATUS_MAP = {
  pending: {
    label: 'Pending',
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    dot: "var(--warning)"
  },
  approved: {
    label: 'Approved',
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  },
  rejected: {
    label: 'Rejected',
    bg: "var(--danger-bg)",
    color: "var(--danger-text)",
    dot: "var(--danger)"
  }
};
const fmtDate = val => {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d) ? String(val) : d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// ── normalizeRequest — guarantees every display field is defined, resolves
//    populated vs raw-id shapes for `part` / `technician` / `decidedBy` ──────
const normalizeRequest = (r, idx) => {
  const partObj = typeof r.part === 'object' && r.part !== null ? r.part : null;
  const techObj = typeof r.technician === 'object' && r.technician !== null ? r.technician : null;
  return {
    ...r,
    id: r.reqId ?? r._id ?? `req-${idx}`,
    partName: r.partName || partObj?.name || '—',
    unit: r.unit || partObj?.unit || '',
    qty: r.qty ?? 0,
    techName: techObj?.name || '—',
    techId: techObj?.techId || '',
    linkedJob: r.linkedJob || '',
    urgent: Boolean(r.urgent),
    notes: r.notes || '',
    status: (r.status || 'pending').toLowerCase(),
    date: fmtDate(r.createdAt),
    rejectionReason: r.rejectionReason || ''
  };
};
const PartsRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    urgent: 0
  });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null); // request currently being approved/rejected
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, statsRes] = await Promise.all([partRequestsApi.list({
        limit: 500
      }), partRequestsApi.stats()]);
      setRequests((listRes.data || []).map(normalizeRequest));
      setStats(statsRes.data || {
        pending: 0,
        approved: 0,
        rejected: 0,
        urgent: 0
      });
    } catch (err) {
      setError(err.message || 'Failed to load parts requests.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAll();
  }, []);
  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (q) {
        const hay = `${r.id} ${r.partName} ${r.techName} ${r.linkedJob}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [requests, q, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const from = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filtered.length);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => {
    setPage(1);
  }, [q, statusFilter]);
  const handleApprove = async r => {
    setBusyId(r._id);
    try {
      await partRequestsApi.approve(r._id);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to approve request.');
    } finally {
      setBusyId(null);
    }
  };
  const handleReject = async r => {
    const reason = window.prompt(`Reason for rejecting ${r.id} (optional):`, '');
    if (reason === null) return; // cancelled
    setBusyId(r._id);
    try {
      await partRequestsApi.reject(r._id, reason);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to reject request.');
    } finally {
      setBusyId(null);
    }
  };
  return <div>
      <div className="sec-hdr">
        <div>
          <div className="sec-title">Parts Requests</div>
          <div className="sec-sub">Review and action part requests raised by technicians</div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-3 ap-parts-requests-page-1">
        {[{
        label: 'Pending',
        value: stats.pending,
        icon: '⏳',
        bg: '#FFFBEB',
        color: '#D97706'
      }, {
        label: 'Approved',
        value: stats.approved,
        icon: '✅',
        bg: '#F0FDF4',
        color: '#16A34A'
      }, {
        label: 'Rejected',
        value: stats.rejected,
        icon: '❌',
        bg: '#FEF2F2',
        color: '#DC2626'
      }].map(s => <div key={s.label} className="stat-card">
            <div className="ap-parts-requests-page-2">
              <div className="stat-label">{s.label}</div>
              <div className="stat-icon" style={{
            background: s.bg
          }}>{s.icon}</div>
            </div>
            <div className="stat-value" style={{
          color: s.color
        }}>{s.value}</div>
          </div>)}
      </div>

      {stats.urgent > 0 && <div className="ap-parts-requests-page-3">
          🚨 {stats.urgent} urgent request{stats.urgent > 1 ? 's' : ''} awaiting review
        </div>}

      <div className="ap-parts-requests-page-4">
        <div className="ap-parts-requests-page-5">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search req ID, part, technician, job…" />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={['pending', 'approved', 'rejected']} allLabel="All Statuses" labelMap={{
          pending: 'Pending',
          approved: 'Approved',
          rejected: 'Rejected'
        }} />
        </div>

        {error && <div className="ap-parts-requests-page-6">{error}</div>}

        <div className="ap-parts-requests-page-7">
          <table className="ap-parts-requests-page-8">
            <Thead cols={['Req ID', 'Technician', 'Part', 'Qty', 'Linked Job', 'Urgent', 'Status', 'Date', '']} />
            <tbody>
              {paginated.length === 0 && <tr>
                  <td colSpan={9} className="ap-parts-requests-page-9">
                    {loading ? 'Loading…' : 'No parts requests match your filters.'}
                  </td>
                </tr>}
              {paginated.map((r, i) => <tr key={r._id} style={{
              background: r.urgent && r.status === 'pending' ? '#FFFBF7' : i % 2 === 0 ? COLORS.white : '#FAFAFA'
            }} className="ap-parts-requests-page-10">
                  <td className="ap-parts-requests-page-11">{r.id}</td>
                  <td className="ap-parts-requests-page-12">
                    {r.techName}{r.techId ? <span className="ap-parts-requests-page-13"> · {r.techId}</span> : null}
                  </td>
                  <td className="ap-parts-requests-page-14">{r.partName}</td>
                  <td className="ap-parts-requests-page-15">{r.qty} {r.unit}</td>
                  <td className="ap-parts-requests-page-16">{r.linkedJob || '—'}</td>
                  <td className="ap-parts-requests-page-17">
                    {r.urgent ? <span className="ap-parts-requests-page-18">🚨 Yes</span> : <span className="ap-parts-requests-page-19">No</span>}
                  </td>
                  <td className="ap-parts-requests-page-20"><SBadge s={r.status} map={STATUS_MAP} /></td>
                  <td className="ap-parts-requests-page-21">{r.date}</td>
                  <td className="ap-parts-requests-page-22">
                    {r.status === 'pending' ? <div className="ap-parts-requests-page-23">
                        <button disabled={busyId === r._id} onClick={() => handleApprove(r)} className="ap-parts-requests-page-24">
                          Approve
                        </button>
                        <button disabled={busyId === r._id} onClick={() => handleReject(r)} className="ap-parts-requests-page-25">
                          Reject
                        </button>
                      </div> : <span className="ap-parts-requests-page-26">
                        {r.status === 'rejected' && r.rejectionReason ? r.rejectionReason : '—'}
                      </span>}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={filtered.length} />}
      </div>
    </div>;
};
export default PartsRequestsPage;