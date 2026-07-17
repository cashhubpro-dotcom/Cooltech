import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { jobsApi, techsApi, customersApi } from '../../services/api';

// ─── Constants — matched exactly to Job model enums ───────────────────────────
const priorityColor = {
  normal: "var(--text-muted)",
  high: "var(--brand)",
  urgent: "var(--danger)"
};

// Kanban columns mapped to Job model status enum values
const kanbanCols = [{
  id: 'new',
  label: 'New',
  color: '#6B7280',
  bg: '#F9FAFB'
}, {
  id: 'assigned',
  label: 'Assigned',
  color: '#3B82F6',
  bg: '#EFF6FF'
}, {
  id: 'in_progress',
  label: 'In Progress',
  color: '#F97316',
  bg: '#FFF7ED'
}, {
  id: 'completed',
  label: 'Completed',
  color: '#22C55E',
  bg: '#F0FDF4'
}, {
  id: 'invoiced',
  label: 'Invoiced',
  color: '#8B5CF6',
  bg: '#F5F3FF'
}, {
  id: 'cancelled',
  label: 'Cancelled',
  color: '#EF4444',
  bg: '#FFF1F2'
}];

// ─── KanbanCard ───────────────────────────────────────────────────────────────
const KanbanCard = ({
  job,
  onDragStart,
  onDragEnd,
  isDragging,
  onEdit,
  onDelete
}) => {
  const pr = priorityColor[job.priority] || '#6B7280';
  const jid = job._id || job.id;

  // Format scheduled date nicely
  const dateStr = job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short'
  }) : '';
  return <div className={`kb-card${isDragging ? ' kb-card--dragging' : ''}`} style={{
    borderLeftColor: pr
  }} draggable onDragStart={e => onDragStart(e, jid)} onDragEnd={onDragEnd}>
      <div className="kb-card-top">
        <span className="kb-card-id">{job.jobId || jid}</span>
        <span className="kb-card-dot" style={{
        background: pr
      }} />
      </div>
      <div className="kb-card-title">
        {job.issue || job.customerName || 'No description'}
      </div>
      <div className="kb-card-meta">
        {job.type} · {job.techName || 'Unassigned'}
      </div>
      {dateStr && <div className="kb-card-date">📅 {dateStr}</div>}

      <div className="kb-card-actions">
        <button className="kb-card-btn kb-card-btn--edit" onClick={e => {
        e.stopPropagation();
        onEdit(job);
      }} title="Edit">✎</button>
        <button className="kb-card-btn kb-card-btn--del" onClick={e => {
        e.stopPropagation();
        onDelete(job);
      }} title="Delete">✕</button>
      </div>
    </div>;
};

// ─── JobModal ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  customerName: '',
  customer: '',
  // ObjectId — required by model
  issue: '',
  type: 'Service',
  priority: 'normal',
  status: 'new',
  technician: '',
  // ObjectId
  techName: '',
  scheduledDate: '',
  scheduledTime: '',
  ac: '',
  address: '',
  remarks: ''
};
const JobModal = ({
  job,
  onClose,
  onSave,
  technicians,
  customers
}) => {
  const isEdit = Boolean(job);

  // Normalise existing job fields into form shape
  const initForm = () => {
    if (!job) return {
      ...EMPTY_FORM
    };
    return {
      ...EMPTY_FORM,
      ...job,
      customer: job.customer?._id || job.customer || '',
      technician: job.technician?._id || job.technician || '',
      scheduledDate: job.scheduledDate ? new Date(job.scheduledDate).toISOString().split('T')[0] : ''
    };
  };
  const [form, setForm] = useState(initForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = e => {
    const {
      name,
      value
    } = e.target;
    setForm(f => {
      const next = {
        ...f,
        [name]: value
      };
      // Auto-fill techName when technician dropdown changes
      if (name === 'technician') {
        const tech = technicians.find(t => (t._id || t.id) === value);
        next.techName = tech ? tech.name : '';
      }
      // Auto-fill customerName when customer dropdown changes
      if (name === 'customer') {
        const cust = customers.find(c => (c._id || c.id) === value);
        next.customerName = cust ? cust.name : '';
        next.address = cust ? cust.address || '' : '';
      }
      return next;
    });
  };
  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      // Build clean payload matching the Job model exactly
      const payload = {
        customer: form.customer || undefined,
        customerName: form.customerName,
        issue: form.issue,
        type: form.type,
        priority: form.priority,
        status: form.status,
        technician: form.technician || undefined,
        techName: form.techName || 'Unassigned',
        scheduledDate: form.scheduledDate || undefined,
        scheduledTime: form.scheduledTime || undefined,
        ac: form.ac,
        address: form.address,
        remarks: form.remarks
      };

      // customer is required by the model
      if (!payload.customer) {
        throw new Error('Please select a customer.');
      }
      await onSave(payload, isEdit ? job._id || job.id : null);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  return createPortal(<div className="modal-overlay" onClick={onClose}>
      <div className="modal-box ap-kanban-page-1" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Job' : 'New Job'}</span>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="ap-kanban-page-2">
              ⚠ {error}
            </div>}

          {/* Customer dropdown — required */}
          <div className="form-row">
            <label className="form-label">Customer *</label>
            <select className="form-select" name="customer" value={form.customer} onChange={handle} required>
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Issue / description */}
          <div className="form-row">
            <label className="form-label">Issue / Description</label>
            <input className="form-input" name="issue" value={form.issue} onChange={handle} placeholder="Describe the job or issue" />
          </div>

          {/* Address */}
          <div className="form-row">
            <label className="form-label">Address</label>
            <input className="form-input" name="address" value={form.address} onChange={handle} placeholder="Service address" />
          </div>

          {/* Type + Priority */}
          <div className="grid-form-2 ap-kanban-page-3">
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" name="type" value={form.type} onChange={handle}>
                <option value="Service">Service</option>
                <option value="Repair">Repair</option>
                <option value="Installation">Installation</option>
                <option value="AMC Visit">AMC Visit</option>
                <option value="Inspection">Inspection</option>
              </select>
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select className="form-select" name="priority" value={form.priority} onChange={handle}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Status + Technician */}
          <div className="grid-form-2 ap-kanban-page-4">
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" name="status" value={form.status} onChange={handle}>
                {kanbanCols.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Assign Technician</label>
              <select className="form-select" name="technician" value={form.technician} onChange={handle}>
                <option value="">— Unassigned —</option>
                {technicians.map(t => <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Scheduled date + time */}
          <div className="grid-form-2 ap-kanban-page-5">
            <div>
              <label className="form-label">Scheduled Date</label>
              <input className="form-input" type="date" name="scheduledDate" value={form.scheduledDate} onChange={handle} />
            </div>
            <div>
              <label className="form-label">Scheduled Time</label>
              <input className="form-input" type="time" name="scheduledTime" value={form.scheduledTime} onChange={handle} />
            </div>
          </div>

          {/* AC unit */}
          <div className="form-row">
            <label className="form-label">AC Unit / Model</label>
            <input className="form-input" name="ac" value={form.ac} onChange={handle} placeholder="e.g. Daikin 1.5T Split" />
          </div>

          {/* Remarks */}
          <div className="form-row">
            <label className="form-label">Remarks</label>
            <textarea className="form-textarea" name="remarks" value={form.remarks} onChange={handle} rows={2} placeholder="Additional notes..." />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Update Job' : 'Create Job'}
            </button>
          </div>
        </div>

      </div>
    </div>, document.body);
};

// ─── KanbanPage ───────────────────────────────────────────────────────────────
const KanbanPage = ({
  openModal: _openModal
}) => {
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null); // null | 'new' | job-object
  const [draggingId, setDraggingId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [overCard, setOverCard] = useState(null);
  const dragColRef = useRef(null);

  // ── fetch jobs + technicians + customers on mount ──
  useEffect(() => {
    fetchAll();
  }, []);
  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [jobsData, techData, custData] = await Promise.all([jobsApi.list(), techsApi.list(), customersApi.list()]);
      setJobs(Array.isArray(jobsData) ? jobsData : jobsData.data ?? []);
      setTechnicians(Array.isArray(techData) ? techData : techData.data ?? []);
      setCustomers(Array.isArray(custData) ? custData : custData.data ?? []);
    } catch (err) {
      setError('Failed to load data. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // ── CRUD ──
  const handleCreate = async payload => {
    const created = await jobsApi.create(payload);
    setJobs(prev => [created, ...prev]);
  };
  const handleUpdate = async (payload, id) => {
    const updated = await jobsApi.update(id, payload);
    setJobs(prev => prev.map(j => (j._id || j.id) === id ? updated : j));
  };
  const handleDelete = async job => {
    const id = job._id || job.id;
    if (!window.confirm(`Delete job ${job.jobId || id}?`)) return;
    await jobsApi.remove(id);
    setJobs(prev => prev.filter(j => (j._id || j.id) !== id));
  };

  // ── Drag: persist status change ──
  const persistStatus = async (jobId, newStatus) => {
    try {
      await jobsApi.update(jobId, {
        status: newStatus
      });
    } catch {
      fetchAll();
    }
  };

  // ── Drag handlers ──
  const handleDragStart = (e, jid) => {
    setDraggingId(jid);
    dragColRef.current = jobs.find(j => (j._id || j.id) === jid)?.status;
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setOverCol(null);
    setOverCard(null);
  };
  const handleColDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverCol(colId);
  };
  const handleCardDragOver = (e, cardId) => {
    e.preventDefault();
    e.stopPropagation();
    setOverCard(cardId);
  };
  const handleDrop = (e, colId) => {
    e.preventDefault();
    if (!draggingId) return;
    const prevStatus = dragColRef.current;
    setJobs(prev => {
      const updated = prev.map(j => (j._id || j.id) === draggingId ? {
        ...j,
        status: colId
      } : j);
      if (overCard && overCard !== draggingId) {
        const dragged = updated.find(j => (j._id || j.id) === draggingId);
        const rest = updated.filter(j => (j._id || j.id) !== draggingId);
        const targetIdx = rest.findIndex(j => (j._id || j.id) === overCard);
        if (targetIdx !== -1) {
          rest.splice(targetIdx, 0, dragged);
          return rest;
        }
      }
      return updated;
    });
    if (prevStatus !== colId) persistStatus(draggingId, colId);
    setDraggingId(null);
    setOverCol(null);
    setOverCard(null);
  };
  const handleColDragLeave = e => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setOverCol(null);
      setOverCard(null);
    }
  };
  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.type === filter);
  return <div className="page-body">

      {/* Header */}
      <div className="kb-header">
        <div>
          <div className="section-title">Kanban Board</div>
          <div className="section-sub">Visual pipeline of all work orders by status</div>
        </div>
        <div className="kb-header-actions">
          <select className="form-select kb-filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Types</option>
            <option value="Service">Service</option>
            <option value="Repair">Repair</option>
            <option value="Installation">Installation</option>
            <option value="AMC Visit">AMC Visit</option>
            <option value="Inspection">Inspection</option>
          </select>
          <button className="btn btn-primary" onClick={() => setModal('new')}>+ New Job</button>
          <button className="btn btn-secondary" onClick={fetchAll} title="Refresh">↺</button>
        </div>
      </div>

      {/* Priority legend */}
      <div className="kb-legend">
        {Object.entries(priorityColor).map(([k, c]) => <div key={k} className="kb-legend-item">
            <span className="kb-legend-dot" style={{
          background: c
        }} />
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </div>)}
      </div>

      {/* States */}
      {loading && <div className="kb-state-msg">Loading jobs…</div>}
      {error && <div className="kb-state-msg kb-state-msg--error">
          {error}
          <button className="btn btn-secondary btn-sm ap-kanban-page-6" onClick={fetchAll}>Retry</button>
        </div>}

      {/* Board */}
      {!loading && !error && <div className="kb-board">
          {kanbanCols.map(col => {
        const colJobs = filtered.filter(j => j.status === col.id);
        const isOver = overCol === col.id;
        return <div key={col.id} className={`kb-col${isOver ? ' kb-col--over' : ''}`} style={{
          borderColor: col.color + '33',
          background: col.bg
        }} onDragOver={e => handleColDragOver(e, col.id)} onDragLeave={handleColDragLeave} onDrop={e => handleDrop(e, col.id)}>
                <div className="kb-col-hdr">
                  <div className="kb-col-label" style={{
              color: col.color
            }}>{col.label}</div>
                  <div className="kb-col-count" style={{
              background: col.color
            }}>{colJobs.length}</div>
                </div>

                {isOver && draggingId && colJobs.length === 0 && <div className="kb-drop-indicator" style={{
            borderColor: col.color
          }} />}

                <div className="kb-cards">
                  {colJobs.length === 0 && !isOver ? <div className="kb-empty">No jobs</div> : colJobs.map(j => {
              const jid = j._id || j.id;
              return <div key={jid} className={`kb-card-wrap${overCard === jid && draggingId !== jid ? ' kb-card-wrap--over' : ''}`} onDragOver={e => handleCardDragOver(e, jid)}>
                            {overCard === jid && draggingId !== jid && <div className="kb-drop-line" style={{
                  background: col.color
                }} />}
                            <KanbanCard job={j} isDragging={draggingId === jid} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onEdit={setModal} onDelete={handleDelete} />
                          </div>;
            })}
                </div>
              </div>;
      })}
        </div>}

      {/* Modal */}
      {modal && <JobModal job={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={handleCreate.length === 1 ? (payload, id) => id ? handleUpdate(payload, id) : handleCreate(payload) : (payload, id) => id ? handleUpdate(payload, id) : handleCreate(payload)} technicians={technicians} customers={customers} />}
    </div>;
};
export default KanbanPage;