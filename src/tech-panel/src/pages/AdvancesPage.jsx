import { useState, useMemo, useEffect } from 'react';
import { SBadge, Modal, Toast } from '../components/ui/Components';
import { ADVANCE_STATUS } from '../constants/statusMaps';
import { technicianAdvancesApi } from '../services/technicianPortalApi';
import { fmtDateDMY } from '../../../shared/formatDate';
const emptyForm = {
  amount: '',
  reason: ''
};
const emptySummary = {
  totalTaken: 0,
  totalPaid: 0,
  totalUnpaid: 0,
  totalPending: 0
};
const fmtMoney = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDisplay = raw => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return fmtDateDMY(d);
};
const RequestModal = ({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  saving
}) => <Modal open={open} onClose={onClose} title="Request an Advance">
    <div className="form-row">
      <label className="form-label">Amount *</label>
      <input className="form-input" type="number" min="1" placeholder="e.g. 5000" value={form.amount} onChange={e => setForm(f => ({
      ...f,
      amount: e.target.value
    }))} />
    </div>
    <div className="form-row">
      <label className="form-label">Reason *</label>
      <textarea className="form-input" rows={3} placeholder="e.g. Medical emergency, family expense..." value={form.reason} onChange={e => setForm(f => ({
      ...f,
      reason: e.target.value
    }))} />
    </div>
    <div className="adv-note-box">
      Your request goes to admin for approval. Once approved, the amount is recovered from a
      future payslip — you'll see it move from <strong>Outstanding</strong> to <strong>Paid</strong> here.
    </div>
    <div className="lv-modal-actions">
      <button className="btn btn-primary btn-sm" onClick={onSubmit} disabled={saving}>
        {saving ? 'Submitting…' : 'Submit Request'}
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
    </div>
  </Modal>;
const DetailModal = ({
  record,
  onClose
}) => <Modal open={!!record} onClose={onClose} title="Advance Details">
    {record && <div>
        <div className="lv-detail-head">
          <div className="lv-type-icon tp-advances-page-1">💰</div>
          <div className="tp-advances-page-2">
            <div className="lv-detail-head__title">{fmtMoney(record.amount)}</div>
            <div className="lv-detail-head__sub">{record.recordId}</div>
          </div>
          <SBadge s={record.status} map={ADVANCE_STATUS} />
        </div>
        <div className="lv-detail-grid">
          <div className="lv-detail-item">
            <div className="lv-detail-label">Requested On</div>
            <div className="lv-detail-value">{fmtDisplay(record.date || record.createdAt)}</div>
          </div>
          <div className="lv-detail-item">
            <div className="lv-detail-label">Month</div>
            <div className="lv-detail-value">{record.month || '—'}</div>
          </div>
          <div className="lv-detail-item tp-advances-page-3">
            <div className="lv-detail-label">Reason</div>
            <div className="lv-detail-value">{record.reason || '—'}</div>
          </div>
          {record.notes && <div className="lv-detail-item tp-advances-page-4">
              <div className="lv-detail-label">Note from admin</div>
              <div className="lv-detail-value">{record.notes}</div>
            </div>}
        </div>
        <div className="lv-modal-actions">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>}
  </Modal>;
const AdvancesPage = () => {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showRequest, setShowRequest] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const notify = msg => setToast(msg);
  const loadAll = async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([technicianAdvancesApi.list(), technicianAdvancesApi.summary()]);
      setRecords(listRes?.data ?? []);
      setSummary(sumRes ?? emptySummary);
    } catch (e) {
      notify(e.message || 'Could not load advance history');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAll();
  }, []);
  const statuses = useMemo(() => [...new Set(records.map(r => r.status).filter(Boolean))], [records]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return records.filter(r => {
      const matchQ = !term || `${r.reason} ${r.recordId}`.toLowerCase().includes(term);
      const matchStatus = !statusFilter || r.status === statusFilter;
      return matchQ && matchStatus;
    });
  }, [records, q, statusFilter]);
  const openRequest = () => {
    setForm(emptyForm);
    setShowRequest(true);
  };
  const submitRequest = async () => {
    if (!form.amount || Number(form.amount) <= 0 || !form.reason.trim()) {
      notify('Please fill in a valid amount and reason.');
      return;
    }
    setSaving(true);
    try {
      await technicianAdvancesApi.request({
        amount: Number(form.amount),
        reason: form.reason.trim()
      });
      setShowRequest(false);
      notify('Advance request submitted! Awaiting admin approval.');
      loadAll();
    } catch (e) {
      notify(e.message || 'Could not submit advance request');
    } finally {
      setSaving(false);
    }
  };
  return <div>
      <div className="sec-hdr">
        <div>
          <div className="sec-title">My Advances</div>
          <div className="sec-sub">Track how much you've taken, what's paid, and what's still outstanding</div>
        </div>
        <button className="btn btn-primary" onClick={openRequest}>+ Request Advance</button>
      </div>

      <div className="grid-3 tp-advances-page-5">
        <div className="card lv-kpi">
          <span className="lv-kpi__icon tp-advances-page-6">💰</span>
          <div>
            <div className="lv-kpi__value tp-advances-page-7">{fmtMoney(summary.totalTaken)}</div>
            <div className="lv-kpi__label">Total Taken (Lifetime)</div>
          </div>
        </div>
        <div className="card lv-kpi">
          <span className="lv-kpi__icon tp-advances-page-8">✅</span>
          <div>
            <div className="lv-kpi__value tp-advances-page-9">{fmtMoney(summary.totalPaid)}</div>
            <div className="lv-kpi__label">Paid (Settled)</div>
          </div>
        </div>
        <div className="card lv-kpi">
          <span className="lv-kpi__icon tp-advances-page-10">⏳</span>
          <div>
            <div className="lv-kpi__value tp-advances-page-11">{fmtMoney(summary.totalUnpaid)}</div>
            <div className="lv-kpi__label">Outstanding / Unpaid</div>
          </div>
        </div>
      </div>

      {summary.totalPending > 0 && <div className="adv-note-box tp-advances-page-12">
          ⏳ You also have <strong>{fmtMoney(summary.totalPending)}</strong> in requests still awaiting admin approval.
        </div>}

      <div className="lv-toolbar">
        <input className="form-input tp-advances-page-13" placeholder="Search by reason or ID..." value={q} onChange={e => setQ(e.target.value)} />
        <select className="form-input tp-advances-page-14" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{ADVANCE_STATUS[s]?.label || s}</option>)}
        </select>
      </div>

      <div className="card tp-advances-page-15">
        <table className="data-table">
          <thead>
            <tr><th>Record ID</th><th>Date</th><th>Amount</th><th>Reason</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="tp-advances-page-16">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="tp-advances-page-17">No advance requests yet.</td></tr>}
            {!loading && filtered.map(r => <tr key={r.recordId} onClick={() => setViewTarget(r)} className="tp-advances-page-18">
                <td>{r.recordId}</td>
                <td>{fmtDisplay(r.date || r.createdAt)}</td>
                <td>{fmtMoney(r.amount)}</td>
                <td className="tp-advances-page-19">{r.reason || '—'}</td>
                <td><SBadge s={r.status} map={ADVANCE_STATUS} /></td>
                <td className="tp-advances-page-20">View →</td>
              </tr>)}
          </tbody>
        </table>
      </div>

      <RequestModal open={showRequest} onClose={() => setShowRequest(false)} form={form} setForm={setForm} onSubmit={submitRequest} saving={saving} />
      <DetailModal record={viewTarget} onClose={() => setViewTarget(null)} />
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>;
};
export default AdvancesPage;