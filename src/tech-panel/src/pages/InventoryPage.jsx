import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/token';
import { Modal, Toast, SBadge } from '../components/ui/Components';

// ─── Fetch helper, scoped to the technician ('tech') panel session ──────────
// NOTE: if your technician panel already has its own services/api.js (mirroring
// the admin one), delete this block and import from there instead — the calls
// below (partRequestsApi.*, inventoryApi.*) are written so that swap is a
// one-line change.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const techReq = async (method, path, body) => {
  const token = localStorage.getItem('tech_token');
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? {
        Authorization: `Bearer ${token}`
      } : {})
    },
    ...(body ? {
      body: JSON.stringify(body)
    } : {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};
const partRequestsApi = {
  mine: () => techReq('GET', '/part-requests/mine'),
  create: body => techReq('POST', '/part-requests', body)
};
const inventoryApi = {
  list: () => techReq('GET', '/inventory')
};
const REQ_STATUS = {
  approved: {
    label: 'Approved',
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  },
  pending: {
    label: 'Pending',
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    dot: "var(--warning)"
  },
  rejected: {
    label: 'Rejected',
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  }
};

// ── normalizeRequest / normalizePart — guarantee display fields are defined
//    regardless of populated-vs-raw shape coming back from the API ─────────
const normalizeRequest = (r, idx) => ({
  ...r,
  id: r.reqId ?? r._id ?? `req-${idx}`,
  part: r.partName || (typeof r.part === 'object' ? r.part?.name : '') || '—',
  qty: r.qty ?? 0,
  unit: r.unit || '',
  job: r.linkedJob || '',
  date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : '—',
  urgent: Boolean(r.urgent),
  status: (r.status || 'pending').toLowerCase()
});
const normalizePart = (p, idx) => ({
  _id: p._id ?? `part-${idx}`,
  name: p.name || 'Unnamed Part',
  unit: p.unit || 'Piece',
  stock: p.qty ?? 0
});
const InventoryPage = () => {
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    part: '',
    qty: 1,
    unit: '',
    job: '',
    urgent: false,
    notes: ''
  });
  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, invRes] = await Promise.all([partRequestsApi.mine(), inventoryApi.list()]);
      setMyRequests((reqRes.data || []).map(normalizeRequest));
      setCatalog((invRes.data || []).map(normalizePart));
    } catch (err) {
      setError(err.message || 'Failed to load parts data.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAll();
  }, []);
  const selectPart = partId => {
    const p = catalog.find(c => c._id === partId);
    setForm(prev => ({
      ...prev,
      part: partId,
      unit: p?.unit ?? ''
    }));
  };
  const resetForm = () => setForm({
    part: '',
    qty: 1,
    unit: '',
    job: '',
    urgent: false,
    notes: ''
  });
  const handleSubmit = async () => {
    if (!form.part) {
      setError('Please select a part.');
      return;
    }
    if (!form.qty || Number(form.qty) < 1) {
      setError('Quantity must be at least 1.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await partRequestsApi.create({
        part: form.part,
        qty: Number(form.qty),
        linkedJob: form.job,
        urgent: form.urgent,
        notes: form.notes
      });
      setShowNew(false);
      resetForm();
      setToast('Parts request submitted!');
      await loadAll();
    } catch (err) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };
  const approvedCount = myRequests.filter(r => r.status === 'approved').length;
  const pendingCount = myRequests.filter(r => r.status === 'pending').length;
  const urgentCount = myRequests.filter(r => r.urgent).length;
  return <div>
      <div className="sec-hdr">
        <div>
          <div className="sec-title">Parts Request</div>
          <div className="sec-sub">Request parts and materials from the warehouse for your jobs</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ Request Parts</button>
      </div>

      {/* Summary */}
      <div className="grid-3 tp-inventory-page-1">
        {[{
        label: 'Approved',
        value: approvedCount,
        icon: '✅',
        bg: '#F0FDF4',
        color: '#16A34A'
      }, {
        label: 'Pending',
        value: pendingCount,
        icon: '⏳',
        bg: '#FFFBEB',
        color: '#D97706'
      }, {
        label: 'Urgent',
        value: urgentCount,
        icon: '🚨',
        bg: '#FEF2F2',
        color: '#DC2626'
      }].map(s => <div key={s.label} className="stat-card afu">
            <div className="tp-inventory-page-2">
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

      {error && <div className="tp-inventory-page-3">
          {error}
        </div>}

      {/* Requests list */}
      <div className="card afu1 tp-inventory-page-4">
        <div className="card-header"><div className="card-title">📦 My Part Requests</div></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{['Req ID', 'Part Name', 'Qty', 'Linked Job', 'Date', 'Urgent', 'Status'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {myRequests.length === 0 && <tr><td colSpan={7} className="tp-inventory-page-5">
                  {loading ? 'Loading…' : 'No part requests yet.'}
                </td></tr>}
              {myRequests.map(req => <tr key={req.id}>
                  <td className="tp-inventory-page-6">{req.id}</td>
                  <td className="tp-inventory-page-7">{req.part}</td>
                  <td className="tp-inventory-page-8">{req.qty} {req.unit}</td>
                  <td className="tp-inventory-page-9">{req.job || '—'}</td>
                  <td className="tp-inventory-page-10">{req.date}</td>
                  <td>{req.urgent ? <span className="tp-inventory-page-11">🚨 Yes</span> : <span className="tp-inventory-page-12">No</span>}</td>
                  <td><SBadge s={req.status} map={REQ_STATUS} /></td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parts Catalog */}
      <div className="card afu2">
        <div className="card-header"><div className="card-title">📋 Parts Catalog & Stock</div></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{['Part Name', 'Unit', 'In Stock', 'Availability', ''].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {catalog.length === 0 && <tr><td colSpan={5} className="tp-inventory-page-13">
                  {loading ? 'Loading…' : 'No parts in catalog.'}
                </td></tr>}
              {catalog.map(p => {
              const low = p.stock < 10;
              return <tr key={p._id}>
                    <td className="tp-inventory-page-14">{p.name}</td>
                    <td className="tp-inventory-page-15">{p.unit}</td>
                    <td style={{
                  color: low ? "var(--danger-text)" : "var(--success-text)"
                }} className="tp-inventory-page-16">{p.stock}</td>
                    <td>
                      <span className="badge" style={{
                    background: low ? "var(--danger-bg)" : "var(--success-bg)",
                    color: low ? "var(--danger-text)" : "var(--success-text)"
                  }}>
                        <span className="badge-dot" style={{
                      background: low ? "var(--danger)" : "var(--success)"
                    }} />
                        {low ? 'Low Stock' : 'Available'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => {
                    selectPart(p._id);
                    setShowNew(true);
                  }} className="tp-inventory-page-17">
                        Request →
                      </button>
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New request modal */}
      <Modal open={showNew} onClose={() => {
      setShowNew(false);
      setError('');
    }} title="Request Parts from Warehouse" footer={<div className="tp-inventory-page-18">
            <button className="btn btn-primary btn-sm" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => {
        setShowNew(false);
        setError('');
      }}>Cancel</button>
          </div>}>
        <div>
          <div className="form-field">
            <label className="form-label">Select Part</label>
            <select className="form-input" value={form.part} onChange={e => selectPart(e.target.value)}>
              <option value="">-- Select a part --</option>
              {catalog.map(p => <option key={p._id} value={p._id}>{p.name} ({p.stock} in stock)</option>)}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-field tp-inventory-page-19">
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" min="1" value={form.qty} onChange={e => setForm(p => ({
              ...p,
              qty: e.target.value
            }))} />
            </div>
            <div className="form-field tp-inventory-page-20">
              <label className="form-label">Unit</label>
              <input className="form-input tp-inventory-page-21" value={form.unit} readOnly />
            </div>
          </div>

          <div className="form-field tp-inventory-page-22">
            <label className="form-label">Linked Job (optional)</label>
            <input className="form-input" placeholder="JOB-XXXX" value={form.job} onChange={e => setForm(p => ({
            ...p,
            job: e.target.value
          }))} />
          </div>

          <div className="form-field">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} placeholder="Why do you need this part? Any special notes…" value={form.notes} onChange={e => setForm(p => ({
            ...p,
            notes: e.target.value
          }))} />
          </div>

          <div onClick={() => setForm(p => ({
          ...p,
          urgent: !p.urgent
        }))} style={{
          border: `1.5px solid ${form.urgent ? '#EF4444' : COLORS.border}`,
          background: form.urgent ? "var(--danger-bg)" : "var(--white)"
        }} className="tp-inventory-page-23">
            <div style={{
            background: form.urgent ? "var(--danger)" : "var(--white)",
            border: `2px solid ${form.urgent ? '#EF4444' : COLORS.border}`
          }} className="tp-inventory-page-24">
              {form.urgent && '✓'}
            </div>
            <div>
              <div style={{
              color: form.urgent ? "var(--danger-text)" : "var(--h2)"
            }} className="tp-inventory-page-25">🚨 Mark as Urgent</div>
              <div className="tp-inventory-page-26">Needed today / for active job</div>
            </div>
          </div>

          {error && <div className="tp-inventory-page-27">{error}</div>}
        </div>
      </Modal>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>;
};
export default InventoryPage;