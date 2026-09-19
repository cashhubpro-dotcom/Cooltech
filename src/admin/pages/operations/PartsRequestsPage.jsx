import { useState, useEffect, useMemo } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge } from '../../components/ui/Badges';
import { Thead } from '../../components/ui/Cards';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import Pagination from '../../components/ui/Pagination';
import ActionDropdown from '../../components/ui/ActionDropdown';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import EditableDetailView from '../../components/ui/EditableDetailView';
import { partRequestsApi } from '../../services/api';
import { fmtDateDMY } from '../../../shared/formatDate';

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
  return isNaN(d) ? String(val) : fmtDateDMY(d);
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

// ── API helpers — tolerate remove/delete/destroy and update/patch naming ─────
const callApi = (names, ...args) => {
  const key = names.find(n => typeof partRequestsApi[n] === 'function');
  if (!key) return Promise.reject(new Error(`partRequestsApi.${names[0]}() is not available.`));
  return partRequestsApi[key](...args);
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

  // ── row actions state ──
  const [selected, setSelected] = useState(null);      // request open in detail view
  const [detailEdit, setDetailEdit] = useState(false); // open detail straight in edit mode
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, statsRes] = await Promise.all([partRequestsApi.list({
        limit: 500
      }), partRequestsApi.stats()]);
      const rows = (listRes.data || []).map(normalizeRequest);
      setRequests(rows);
      setStats(statsRes.data || {
        pending: 0,
        approved: 0,
        rejected: 0,
        urgent: 0
      });
      // keep the open detail view in sync after an approve/reject/save
      setSelected(prev => prev ? rows.find(x => x._id === prev._id) || null : null);
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

  const handleDelete = async () => {
    const r = deleteTarget;
    if (!r) return;
    setBusyId(r._id);
    try {
      await callApi(['remove', 'delete', 'destroy'], r._id);
      setDeleteTarget(null);
      if (selected && selected._id === r._id) setSelected(null);
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to delete request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveDetail = async updated => {
    try {
      await callApi(['update', 'patch', 'edit'], updated._id, {
        qty: Number(updated.qty),
        linkedJob: updated.linkedJob,
        notes: updated.notes
      });
      await loadAll();
    } catch (err) {
      alert(err.message || 'Failed to save changes.');
    }
  };

  const openView = r => { setDetailEdit(false); setSelected(r); };
  const openEdit = r => { setDetailEdit(true); setSelected(r); };

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selected) {
    const detailFields = [
      { key: 'partName', label: 'Part', hero: true, type: 'readonly' },
      { key: 'status', label: 'Status', type: 'badge', badgeMap: STATUS_MAP },
      { key: 'techName', label: 'Technician', type: 'readonly',
        render: (_v, d) => <span>{d.techName}{d.techId ? ` · ${d.techId}` : ''}</span> },
      { key: 'qty', label: 'Quantity', type: 'number',
        render: (_v, d) => <span>{d.qty} {d.unit}</span> },
      { key: 'linkedJob', label: 'Linked job' },
      { key: 'urgent', label: 'Urgent', type: 'readonly',
        render: v => <span>{v ? '🚨 Yes' : 'No'}</span> },
      { key: 'date', label: 'Requested on', type: 'readonly' },
      { key: 'notes', label: 'Notes', type: 'textarea', span: 2 },
      ...(selected.status === 'rejected' && selected.rejectionReason
        ? [{ key: 'rejectionReason', label: 'Reason for rejection', type: 'readonly', span: 2 }]
        : [])
    ];

    return (
      <>
        <EditableDetailView
          id={selected.id}
          breadcrumb="Parts Requests"
          onBack={() => setSelected(null)}
          fields={detailFields}
          data={selected}
          initialEditMode={detailEdit}
          onSave={handleSaveDetail}
          onDelete={() => setDeleteTarget(selected)}
          actions={selected.status === 'pending' ? (
            <div className="ap-parts-requests-page-23">
              <button
                disabled={busyId === selected._id}
                onClick={() => handleApprove(selected)}
                className="ap-parts-requests-page-24"
              >
                Approve
              </button>
              <button
                disabled={busyId === selected._id}
                onClick={() => handleReject(selected)}
                className="ap-parts-requests-page-25"
              >
                Reject
              </button>
            </div>
          ) : null}
        />

        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          message={`Request ${deleteTarget?.id || ''} will be permanently removed and cannot be recovered.`}
        />
      </>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return <div className="pr-page">
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
                  <td className="ap-parts-requests-page-20" title={r.status === 'rejected' && r.rejectionReason ? r.rejectionReason : undefined}>
                    <SBadge s={r.status} map={STATUS_MAP} />
                  </td>
                  <td className="ap-parts-requests-page-21">{r.date}</td>

                  {/* ── Action column ── */}
                  <td className="ap-parts-requests-page-22">
                    <ActionDropdown
                      onView={() => openView(r)}
                      onEdit={() => openEdit(r)}
                      onDelete={() => setDeleteTarget(r)}
                      extraItems={r.status === 'pending' ? [
                        {
                          label: 'Approve',
                          icon: '✅',
                          onClick: () => handleApprove(r)
                        },
                        {
                          label: 'Reject',
                          icon: '❌',
                          onClick: () => handleReject(r),
                          danger: true
                        }
                      ] : []}
                    />
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={filtered.length} />}
      </div>

      {/* Delete confirm */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        message={`Request ${deleteTarget?.id || ''} will be permanently removed and cannot be recovered.`}
      />
    </div>;
};

export default PartsRequestsPage;