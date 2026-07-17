import { JOB_STATUS, TECH_STATUS } from '../constants/statusMaps';
import { techsApi, jobsApi, invoicesApi } from '../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag, PBadge, Avatar, Divider } from '../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../components/ui/Cards';
import ActionDropdown from '../components/ui/ActionDropdown';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import EditableDetailView from '../components/ui/EditableDetailView';
import { useTableSearch } from '../hooks/useTableSearch';
import { technicians, customers } from '../data/mockData';
import TableSearchBar from '../components/ui/TableSearchBar';
import FilterSelect from '../components/ui/FilterSelect';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import ExportDropdown from '../components/layout/ExportDropdown';
import useExport from '../hooks/useExport';
import { addToDeleted } from '../store/deletedStore';
import JobStatusModal from '../components/ui/JobStatusModal';

// ─── Breakpoint Hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width
  };
}
const FieldLabel = ({
  children
}) => <div className="ap-jobs-page-1">
    {children}
  </div>;
const inputStyle = {
  padding: '7px 10px',
  borderRadius: 8,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 13,
  color: COLORS.h2,
  background: "var(--bg)",
  fontFamily: FONTS.sans,
  width: '100%',
  outline: 'none',
  transition: 'border-color .15s',
  boxSizing: 'border-box'
};
const JOB_FIELDS = [{
  key: 'customer'
}, {
  key: 'address'
}, {
  key: 'ac'
}, {
  key: 'issue'
}, {
  key: 'date'
}, {
  key: 'time'
}, {
  key: 'tech'
}, {
  key: 'type'
}, {
  key: 'priority'
}, {
  key: 'status'
}, {
  key: 'notes',
  type: 'textarea'
}];
const JOB_COLUMNS = [{
  label: 'Job ID',
  key: 'id',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700,
    color: COLORS.brand,
    fontSize: 11
  }
}, {
  label: 'Customer',
  key: 'customer',
  width: 18,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Type',
  key: 'type',
  width: 12,
  render: val => <TypeTag type={val} />,
  format: val => val
}, {
  label: 'Issue',
  key: 'issue',
  width: 20,
  tdStyle: {
    fontSize: 12,
    color: COLORS.muted
  }
}, {
  label: 'AC Unit',
  key: 'ac',
  width: 16,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Technician',
  key: 'tech',
  width: 14,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Date',
  key: 'date',
  width: 12,
  tdStyle: {
    fontSize: 12,
    color: COLORS.muted
  }
}, {
  label: 'Amount',
  key: 'amount',
  width: 10,
  excelKey: 'Amount (₹)',
  render: val => <span className="ap-jobs-page-2">₹{Number(val).toLocaleString()}</span>,
  format: val => val,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700
  }
}, {
  label: 'Status',
  key: 'status',
  width: 12,
  render: val => <SBadge s={val} map={JOB_STATUS} />,
  format: val => JOB_STATUS[val]?.label ?? val
}];

// ── Cost constants used when computing a job's total. Currently hardcoded
// here (and duplicated between the 'completed' and 'invoiced' branches below)
// rather than pulled from your Settings → GST tab. See the explanation
// alongside this file for why that's worth revisiting.
const LABOUR_CHARGE = 1200;
const SERVICE_CHARGE = 500;
const GST_RATE = 0.18;

// ─── Normalise a raw job from the API ─────────────────────────────────────────
// Keeps BOTH the real ObjectId refs (customerId/technicianId) and the
// display-friendly strings (customer/tech). Saving must always use the IDs —
// the display strings are for rendering only and must never be sent back to
// the backend as `customer`/`technician`.
const normaliseJob = j => ({
  ...j,
  id: j.jobId || 'JOB-' + String(j._id).slice(-6).toUpperCase(),
  customerId: typeof j.customer === 'object' ? j.customer?._id : j.customer,
  customer: typeof j.customer === 'object' ? j.customer?.name : j.customerName || j.customer || '',
  technicianId: typeof j.technician === 'object' ? j.technician?._id : j.technician,
  tech: typeof j.technician === 'object' ? j.technician?.name : j.techName || j.tech || 'Unassigned',
  date: j.scheduledDate ? new Date(j.scheduledDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : j.date || '',
  time: j.scheduledTime || j.time || '',
  ac: j.ac || '',
  address: j.address || (typeof j.customer === 'object' ? j.customer?.address : '') || '',
  amount: j.amount ?? 0,
  parts: (j.parts || []).map(p => ({
    name: p.name,
    qty: p.qty,
    cost: p.cost
  })),
  // ── Checklist — mirrors the technician panel's shape (item/done/addedBy)
  // so admin, technician, and client all read the exact same subdocuments
  // off the Job document. `addedBy` defaults to 'template' for any items
  // that come back without it (shouldn't normally happen, just a safe fallback).
  checklist: (j.checklist || []).map(c => ({
    item: c.item,
    done: !!c.done,
    addedBy: c.addedBy || 'template'
  })),
  notes: j.remarks || ''
});

// ─── JobsPage ─────────────────────────────────────────────────────────────────
const JobsPage = ({
  openJob,
  setOpenJob,
  openModal
}) => {
  const {
    isMobile
  } = useBreakpoint();
  const [sf, setSf] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [liveTechs, setLiveTechs] = useState(technicians);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // ── Status modal state ────────────────────────────────────────────────────
  const [statusModal, setStatusModal] = useState(null); // { targetStatus }

  useEffect(() => {
    jobsApi.list({
      limit: 200
    }).then(r => setJobs((r.data ?? []).map(normaliseJob))).catch(() => {});
    techsApi.list({
      limit: 200
    }).then(r => {
      const apiTechs = (r.data ?? []).map(t => ({
        id: t._id,
        name: t.name,
        status: t.status || 'available'
      }));
      if (apiTechs.length) setLiveTechs(apiTechs);
    }).catch(() => {});
  }, []);
  const TECH_OPTIONS = [...new Set(jobs.map(j => j.tech).filter(t => t && t !== 'Unassigned'))].sort();
  const [initialEditMode, setInitialEditMode] = useState(false);
  const [parts, setParts] = useState([]);

  // ── Checklist working state — same pattern as `parts` below: local
  // draft while a job is open/being edited, seeded from the real job,
  // and only committed back to the server via handleSave (or the
  // status-change flow, for parts-on-completion).
  const [checklist, setChecklist] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // Seed the editable "Parts Used" and "Checklist" working lists from the
  // REAL job whenever it's opened — not from hardcoded demo values. This is
  // also what the Cost Summary / invoice math below reads from while editing.
  useEffect(() => {
    if (!openJob) {
      setParts([]);
      setChecklist([]);
      return;
    }
    const job = jobs.find(j => j._id === openJob);
    if (job) {
      setParts((job.parts || []).map(p => ({
        name: p.name,
        qty: p.qty,
        rate: p.cost
      })));
      setChecklist((job.checklist || []).map(c => ({
        item: c.item,
        done: !!c.done,
        addedBy: c.addedBy || 'template'
      })));
    }
    setNewChecklistItem('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openJob]);
  const counts = Object.keys(JOB_STATUS).reduce((a, s) => ({
    ...a,
    [s]: jobs.filter(j => j.status === s).length
  }), {});
  const handleDelete = async id => {
    const item = jobs.find(x => (x._id ?? x.id) === id);
    if (item) addToDeleted({
      id: item.id ?? item._id,
      name: item.name ?? item.customer ?? item.id,
      module: 'Job',
      by: 'Admin'
    });
    try {
      await jobsApi.remove(id);
      setJobs(prev => prev.filter(x => (x._id ?? x.id) !== id));
    } catch (e) {
      alert(e.message);
    }
  };
  const handleBack = () => {
    setOpenJob(null);
    setInitialEditMode(false);
  };
  const addChecklistItem = () => {
    const text = newChecklistItem.trim();
    if (!text) return;
    setChecklist(cs => [...cs, {
      item: text,
      done: false,
      addedBy: 'template'
    }]);
    setNewChecklistItem('');
  };

  // Whitelisted save — only ever sends fields the schema actually expects,
  // and NEVER sends the display-name `customer` string back as the ObjectId
  // ref field (that was the cause of the 400 CastError).
  //
  // `checklist` and `parts` are now included here too — previously this
  // payload silently dropped both, so editing them in the admin panel had
  // no effect unless the job happened to also be marked Completed (which
  // is the only other place `parts` got sent). Both now flow through the
  // same generic PUT /jobs/:id used for every other admin edit, so the
  // technician and client panels (which read straight off job.checklist /
  // job.parts) pick up admin changes on their next fetch automatically.
  //
  // NOTE: confirm your backend's admin job-update controller doesn't do
  // its own field whitelist that excludes `checklist`/`parts` — if it does,
  // add them there too or this will be silently ignored.
  const handleSave = async updated => {
    const blankPartRows = parts.filter(p => !p.name || !p.name.trim());
    if (blankPartRows.length > 0) {
      const proceed = window.confirm(`${blankPartRows.length} part row${blankPartRows.length > 1 ? 's are' : ' is'} missing a name and will be removed before saving. Continue?`);
      if (!proceed) return;
    }
    try {
      const payload = {
        type: updated.type,
        priority: updated.priority,
        status: updated.status,
        ac: updated.ac,
        issue: updated.issue,
        address: updated.address,
        remarks: updated.notes,
        scheduledDate: updated.date,
        scheduledTime: updated.time,
        customerName: updated.customer,
        // free-text label only — never `customer`
        checklist: checklist.filter(c => c.item && c.item.trim()).map(c => ({
          item: c.item.trim(),
          done: !!c.done,
          addedBy: c.addedBy || 'template'
        })),
        // Drop any blank "+ Add Part" rows the user left unfilled — the
        // schema requires `name` on every part, so sending an empty row
        // (name:'') fails validation and rejects the whole save. This was
        // previously invisible because `parts` was never sent from here at
        // all; now that it is, unfinished rows need to be filtered client-side.
        parts: parts.filter(p => p.name && p.name.trim()).map(p => ({
          name: p.name.trim(),
          qty: Number(p.qty) || 0,
          cost: Number(p.rate) || 0
        })),
        ...(updated.technicianId ? {
          technician: updated.technicianId,
          techName: updated.tech
        } : {})
      };
      const res = await jobsApi.update(updated._id, payload);
      const doc = normaliseJob(res); // jobsApi.update returns the raw job, no `.data` wrapper
      setJobs(prev => prev.map(j => j._id === doc._id ? doc : j));
    } catch (e) {
      alert(e.message);
    }
  };

  // ── Core status update ─────────────────────────────────────────────────────
  // Routes to the correct backend endpoint per target status instead of always
  // doing a generic field patch — /assign and /complete carry side effects
  // (technician availability, job counts, customer totals) that a generic
  // update would silently skip.
  const handleStatusUpdate = async (newStatus, note = '', technicianId = null) => {
    if (!openJob || statusUpdating) return;
    const job = jobs.find(j => j._id === openJob);
    if (!job) return;
    setStatusUpdating(true);
    try {
      let res;
      if (newStatus === 'assigned') {
        if (!technicianId) throw new Error('Please select a technician.');
        const tech = liveTechs.find(t => t.id === technicianId);
        res = await jobsApi.assign(job._id, {
          technicianId,
          techName: tech?.name || ''
        });
        setLiveTechs(prev => prev.map(t => t.id === technicianId ? {
          ...t,
          status: 'busy'
        } : t));
      } else if (newStatus === 'completed') {
        // Same filter as handleSave — drop any unfilled "+ Add Part" rows
        // before they hit the backend's required `name` validation.
        const validParts = parts.filter(p => p.name && p.name.trim());
        const partsTotal = validParts.reduce((sum, p) => sum + Number(p.qty) * Number(p.rate), 0);
        const amount = partsTotal + LABOUR_CHARGE + SERVICE_CHARGE;
        res = await jobsApi.complete(job._id, {
          remarks: note,
          amount,
          parts: validParts.map(p => ({
            name: p.name.trim(),
            qty: Number(p.qty) || 0,
            cost: Number(p.rate) || 0
          }))
        });
        if (job.technicianId) {
          setLiveTechs(prev => prev.map(t => t.id === job.technicianId ? {
            ...t,
            status: 'available'
          } : t));
        }
      } else {
        const payload = {
          status: newStatus
        };
        if (note) payload.statusNote = note;
        res = await jobsApi.update(job._id, payload);
      }
      const updated = normaliseJob(res); // no `.data` wrapper on any of these responses
      setJobs(prev => prev.map(j => j._id === updated._id ? updated : j));

      // Auto-create invoice when marked as invoiced
      if (newStatus === 'invoiced') {
        try {
          const partsTotal = (updated.parts || []).reduce((sum, p) => sum + Number(p.qty) * Number(p.cost), 0);
          const subtotal = partsTotal + LABOUR_CHARGE + SERVICE_CHARGE;
          const gst = Math.round(subtotal * GST_RATE);
          const total = subtotal + gst;
          await invoicesApi.create({
            job: job._id,
            jobRef: job.id,
            customerName: updated.customer,
            address: updated.address,
            items: [{
              description: 'Labour Charges',
              qty: 1,
              rate: LABOUR_CHARGE,
              amount: LABOUR_CHARGE
            }, {
              description: 'Service Charge',
              qty: 1,
              rate: SERVICE_CHARGE,
              amount: SERVICE_CHARGE
            }, ...(updated.parts || []).map(p => ({
              description: p.name,
              qty: Number(p.qty),
              rate: Number(p.cost),
              amount: Number(p.qty) * Number(p.cost)
            }))],
            subtotal,
            tax: gst,
            total,
            status: 'pending',
            notes: note || `Auto-generated from Job ${job.id}`
          });

          // Persist the final (post-GST) total onto the job itself — this is
          // what makes the Jobs table's Amount column populate correctly.
          const jobRes = await jobsApi.update(job._id, {
            amount: total
          });
          const jobDoc = normaliseJob(jobRes);
          setJobs(prev => prev.map(j => j._id === jobDoc._id ? jobDoc : j));
        } catch (invErr) {
          console.error('Invoice creation failed:', invErr);
          alert(`Status updated to Invoiced, but invoice creation failed:\n${invErr.message}`);
        }
      }
      setStatusModal(null); // close modal on success
    } catch (err) {
      alert('Status update failed: ' + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchedJobs
  } = useTableSearch(jobs, ['id', 'customer', 'address', 'type', 'issue', 'ac', 'tech', 'status'], {
    type: '',
    tech: ''
  });
  const filtered = searchedJobs.filter(j => sf === 'all' || j.status === sf);
  const {
    paginated,
    page,
    totalPages,
    setPage,
    pageSize,
    setPageSize,
    from,
    to,
    total
  } = usePagination(filtered, 10);
  const {
    exportProps
  } = useExport({
    title: 'Work Orders',
    filename: 'cooltech-workorders',
    template: 'generic_list',
    subtitle: `AC Services Platform · Work Orders · ${filtered.length} records`,
    docId: 'JB-EXPORT',
    columns: JOB_COLUMNS,
    rows: filtered,
    showTotals: true,
    totalColumns: ['amount']
  });

  // ── Detail / Edit view ────────────────────────────────────────────────────
  if (openJob) {
    const job = jobs.find(j => j._id === openJob);
    if (!job) return <div className="ap-jobs-page-3">
        <div className="ap-jobs-page-4">
          <div className="ap-jobs-page-5">⏳</div>
          <div>Loading job details…</div>
          <button onClick={handleBack} className="ap-jobs-page-6">
            ← Back to Jobs
          </button>
        </div>
      </div>;
    return <>
        <EditableDetailView id={job.jobId} breadcrumb="Jobs" onBack={handleBack} fields={JOB_FIELDS} data={{
        ...job,
        notes: job.notes || ''
      }} initialEditMode={initialEditMode} onSave={handleSave} onDelete={() => {
        handleDelete(job._id);
        setOpenJob(null);
      }}>
          {({
          editMode,
          editData,
          setEditData
        }) => {
          const set = key => e => setEditData(prev => ({
            ...prev,
            [key]: e.target.value
          }));
          return <div className="job-detail-grid">

                {/* ── Main card ── */}
                <div style={{
              border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
              padding: isMobile ? "14px" : "20px",
              boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.05)"
            }} className="ap-jobs-page-7">

                  <div className="ap-jobs-page-8">
                    <div className="ap-jobs-page-9">
                      {editMode ? <>
                          <select value={editData.type} onChange={set('type')} className="ap-jobs-page-10">
                            {['Service', 'Repair', 'Installation', 'AMC Visit'].map(t => <option key={t}>{t}</option>)}
                          </select>
                          <select value={editData.priority} onChange={set('priority')} className="ap-jobs-page-11">
                            {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p}>{p}</option>)}
                          </select>
                          <select value={editData.status} onChange={set('status')} className="ap-jobs-page-12">
                            {Object.entries(JOB_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </> : <>
                          <TypeTag type={job.type} />
                          <PBadge p={job.priority} />
                          <SBadge s={job.status} map={JOB_STATUS} />
                        </>}
                    </div>

                    <div style={{
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? "6px" : "12px"
                }} className="ap-jobs-page-13">
                      <div className="ap-jobs-page-14">
                        {editMode ? <input value={editData.customer} onChange={set('customer')} className="ap-jobs-page-15" /> : <div style={{
                      fontSize: isMobile ? "16px" : "18px"
                    }} className="ap-jobs-page-16">{job.customer}</div>}
                        <div className="ap-jobs-page-17">
                          {editMode ? <input value={editData.address} onChange={set('address')} className="ap-jobs-page-18" /> : <div className="ap-jobs-page-19">📍 {job.address}</div>}
                        </div>
                      </div>
                      <div style={{
                    textAlign: isMobile ? "left" : "right"
                  }} className="ap-jobs-page-20">
                        <div className="ap-jobs-page-21">{job.id}</div>
                        <div className="ap-jobs-page-22">Created {job.created}</div>
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div className="job-field-grid ap-jobs-page-23">
                    {editMode ? [['AC Unit', 'ac'], ['Issue', 'issue'], ['Date', 'date'], ['Time', 'time']].map(([label, key]) => <div key={key}>
                            <FieldLabel>{label}</FieldLabel>
                            <input value={editData[key]} onChange={set(key)} className="ap-jobs-page-24" />
                          </div>) : [['AC Unit', job.ac], ['Issue', job.issue], ['Scheduled', `${job.date}, ${job.time}`], ['Technician', job.tech]].map(([k, v]) => <div key={k}>
                            <FieldLabel>{k}</FieldLabel>
                            <div className="ap-jobs-page-25">{v}</div>
                          </div>)}
                  </div>

                  <Divider />

                  <div className="ap-jobs-page-26">
                    <div className="ap-jobs-page-27">Service Notes</div>
                    <textarea placeholder="Add work done, observations, parts used…" value={editMode ? editData.notes : undefined} onChange={editMode ? set('notes') : undefined} readOnly={!editMode} style={{
                  background: editMode ? "var(--bg)" : "var(--bg)",
                  cursor: editMode ? "text" : "default"
                }} className="ap-jobs-page-28" />
                  </div>

                  {/* ── Job Checklist ──
                       Mirrors the technician panel's checklist shape exactly
                       (item / done / addedBy) so it's the same subdocument
                       array on both sides — no separate admin-only field.
                       Edits here are local (`checklist` state) until Save is
                       clicked, same pattern as Parts Used below. ── */}
                  <div className="ap-jobs-page-29">
                    <div className="ap-jobs-page-30">
                      <div className="ap-jobs-page-31">Job Checklist</div>
                      <span className="ap-jobs-page-32">
                        {(editMode ? checklist : job.checklist || []).filter(c => c.done).length}
                        /{(editMode ? checklist : job.checklist || []).length}
                      </span>
                    </div>

                    {(editMode ? checklist : job.checklist || []).length === 0 && <div className="ap-jobs-page-33">No checklist items yet.</div>}

                    {(editMode ? checklist : job.checklist || []).map((c, i) => <div key={i} className="ap-jobs-page-34">
                        <div onClick={editMode ? () => setChecklist(cs => cs.map((x, j) => j === i ? {
                    ...x,
                    done: !x.done
                  } : x)) : undefined} style={{
                    border: `1.5px solid ${c.done ? COLORS.brand : COLORS.border}`,
                    background: c.done ? "var(--brand)" : "transparent",
                    cursor: editMode ? "pointer" : "default"
                  }} className="ap-jobs-page-35">
                          {c.done ? '✓' : ''}
                        </div>
                        <span style={{
                    color: c.done ? "var(--text-faint)" : "var(--text-h2)",
                    textDecoration: c.done ? "line-through" : "none"
                  }} className="ap-jobs-page-36">
                          {c.item}
                        </span>
                        {c.addedBy === 'technician' && <span className="ap-jobs-page-37">
                            Added on-site
                          </span>}
                        {editMode && <button onClick={() => setChecklist(cs => cs.filter((_, j) => j !== i))} className="ap-jobs-page-38">
                            ✕
                          </button>}
                      </div>)}

                    {editMode && <div className="ap-jobs-page-39">
                        <input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter') addChecklistItem();
                  }} placeholder="Add checklist item…" className="ap-jobs-page-40" />
                        <button onClick={addChecklistItem} className="ap-jobs-page-41">
                          + Add
                        </button>
                      </div>}
                  </div>

                  <div className="ap-jobs-page-42">
                    <div className="ap-jobs-page-43">Parts Used</div>
                    <div className="ap-jobs-page-44">
                      {(editMode ? parts : (job.parts || []).map(p => ({
                    name: p.name,
                    qty: p.qty,
                    rate: p.cost
                  }))).map((p, i) => <div key={i} className="ap-jobs-page-45">
                          <input value={p.name} readOnly={!editMode} onChange={editMode ? e => setParts(ps => ps.map((x, j) => j === i ? {
                      ...x,
                      name: e.target.value
                    } : x)) : undefined} style={{
                      border: `1px solid ${editMode ? COLORS.border : 'transparent'}`,
                      background: editMode ? "var(--bg)" : "transparent"
                    }} className="ap-jobs-page-46" />
                          <input value={p.qty} readOnly={!editMode} onChange={editMode ? e => setParts(ps => ps.map((x, j) => j === i ? {
                      ...x,
                      qty: e.target.value
                    } : x)) : undefined} style={{
                      border: `1px solid ${editMode ? COLORS.border : 'transparent'}`,
                      background: editMode ? "var(--bg)" : "transparent"
                    }} className="ap-jobs-page-47" />
                          <input value={p.rate} readOnly={!editMode} onChange={editMode ? e => setParts(ps => ps.map((x, j) => j === i ? {
                      ...x,
                      rate: e.target.value
                    } : x)) : undefined} style={{
                      border: `1px solid ${editMode ? COLORS.border : 'transparent'}`,
                      background: editMode ? "var(--bg)" : "transparent"
                    }} className="ap-jobs-page-48" />
                          {editMode ? <button onClick={() => setParts(ps => ps.filter((_, j) => j !== i))} className="ap-jobs-page-49">✕</button> : <div />}
                        </div>)}
                      {!editMode && (!job.parts || job.parts.length === 0) && <div className="ap-jobs-page-50">No parts logged for this job yet.</div>}
                    </div>
                    {editMode && <button onClick={() => setParts(ps => [...ps, {
                  name: '',
                  qty: 1,
                  rate: 0
                }])} className="ap-jobs-page-51">
                        + Add Part
                      </button>}
                  </div>

                  {/* ── Bottom action buttons ── */}
                  {!editMode && <div className="job-action-btns ap-jobs-page-52">

                      {/* Mark Complete → opens status modal for 'completed' */}
                      <button className="btn ap-jobs-page-53" onClick={() => setStatusModal({
                  targetStatus: 'completed'
                })}>
                        ✓ Mark Complete
                      </button>

                      {/* Invoice → opens status modal for 'invoiced' */}
                      <button className="btn ap-jobs-page-54" onClick={() => setStatusModal({
                  targetStatus: 'invoiced'
                })}>
                        📄 Invoice
                      </button>

                      {/* Quotation → existing modal */}
                      <button className="btn ap-jobs-page-55" onClick={() => openModal('new_quotation')}>
                        📋 Quotation
                      </button>

                      {/* Reschedule → existing modal */}
                      <button className="btn ap-jobs-page-56" onClick={() => openModal('mark_attendance')}>
                        📅 Reschedule
                      </button>

                      {/* Cancel → opens status modal for 'cancelled' */}
                      <button className="btn ap-jobs-page-57" onClick={() => setStatusModal({
                  targetStatus: 'cancelled'
                })}>
                        ✕ Cancel
                      </button>
                    </div>}
                </div>

                {/* ── Sidebar ── */}
                <div className="job-detail-sidebar">

                  {/* ── Update Status sidebar ── */}
                  {!editMode && <div className="ap-jobs-page-58">
                      <div className="ap-jobs-page-59">Update Status</div>

                      {[{
                  key: 'assigned',
                  icon: '📋'
                }, {
                  key: 'in_progress',
                  icon: '🔧'
                }, {
                  key: 'completed',
                  icon: '✅'
                }, {
                  key: 'invoiced',
                  icon: '📄'
                }].map(({
                  key,
                  icon
                }) => {
                  const m = JOB_STATUS[key];
                  const isCurrent = job.status === key;
                  return <button key={key} disabled={isCurrent} onClick={() => !isCurrent && setStatusModal({
                    targetStatus: key
                  })} style={{
                    background: isCurrent ? m.bg : '#FAFAF9',
                    color: isCurrent ? m.color : COLORS.h2,
                    fontWeight: isCurrent ? "700" : "500",
                    border: `1px solid ${isCurrent ? m.color + '55' : COLORS.border}`,
                    cursor: isCurrent ? "default" : "pointer",
                    ...(key === 'invoiced' && !isCurrent ? {
                      borderColor: '#BAE6FD',
                      color: '#0369A1'
                    } : {})
                  }} className="ap-jobs-page-60">
                            <span>{icon}</span>
                            <span className="ap-jobs-page-61">{isCurrent ? '● ' : '→ '}{m.label}</span>
                            {isCurrent && <span style={{
                      background: m.color + '22',
                      color: m.color
                    }} className="ap-jobs-page-62">
                                Current
                              </span>}
                            {key === 'invoiced' && !isCurrent && <span className="ap-jobs-page-63">
                                + invoice
                              </span>}
                          </button>;
                })}
                    </div>}

                  {/* ── Assign Technician ──
                       NOTE: this card is a manual, edit-mode-only technician
                       swap. The primary "assign a technician to a New job"
                       flow now happens via the Update Status → Assigned modal
                       (JobStatusModal), which calls jobsApi.assign() and
                       correctly updates technician availability/job counts.
                       This card is left for reassigning an already-assigned
                       job while editing — same technicianId capture applies. */}
                  <div style={{
                border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`
              }} className="ap-jobs-page-64">
                    <div className="ap-jobs-page-65">
                      Assign Technician
                      {editMode && <span className="ap-jobs-page-66">← click to assign</span>}
                    </div>
                    {liveTechs.map(t => {
                  const isSelected = editMode ? editData.tech === t.name : job.tech === t.name;
                  return <div key={t.id} onClick={editMode ? () => setEditData(prev => ({
                    ...prev,
                    tech: t.name,
                    technicianId: t.id
                  })) : undefined} style={{
                    background: isSelected ? "var(--brand-light)" : "var(--bg)",
                    border: `1px solid ${isSelected ? COLORS.brand : COLORS.border}`,
                    cursor: editMode ? "pointer" : "default"
                  }} className="ap-jobs-page-67">
                          <Avatar name={t.name} size={26} color={t.status === 'available' ? '#10B981' : COLORS.brand} />
                          <div className="ap-jobs-page-68">{t.name}</div>
                          <SBadge s={t.status} map={TECH_STATUS} />
                          {editMode && isSelected && <span className="ap-jobs-page-69">✓</span>}
                        </div>;
                })}
                  </div>

                  {/* ── Cost Summary — real numbers, not hardcoded demo values ── */}
                  <div className="ap-jobs-page-70">
                    <div className="ap-jobs-page-71">Cost Summary</div>

                    {job.parts && job.parts.length > 0 ? <>
                        <div className="ap-jobs-page-72">
                          <span className="ap-jobs-page-73">Labour</span>
                          <span className="ap-jobs-page-74">₹{LABOUR_CHARGE.toLocaleString()}</span>
                        </div>
                        {job.parts.map((p, i) => <div key={i} className="ap-jobs-page-75">
                            <span className="ap-jobs-page-76">{p.name} × {p.qty}</span>
                            <span className="ap-jobs-page-77">₹{(p.qty * p.cost).toLocaleString()}</span>
                          </div>)}
                        <div className="ap-jobs-page-78">
                          <span className="ap-jobs-page-79">Service Charge</span>
                          <span className="ap-jobs-page-80">₹{SERVICE_CHARGE.toLocaleString()}</span>
                        </div>
                      </> : <div className="ap-jobs-page-81">
                        No cost breakdown yet — will populate once this job is marked Completed.
                      </div>}

                    <div className="ap-jobs-page-82">
                      <span className="ap-jobs-page-83">
                        Total{job.status === 'invoiced' ? ' (incl. GST)' : ''}
                      </span>
                      <span className="ap-jobs-page-84">₹{Number(job.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>;
        }}
        </EditableDetailView>

        {/* ── Status modal — rendered outside EditableDetailView so it overlays everything ── */}
        {statusModal && <JobStatusModal job={jobs.find(j => j._id === openJob)} targetStatus={statusModal.targetStatus} technicians={liveTechs} loading={statusUpdating} onConfirm={handleStatusUpdate} onClose={() => setStatusModal(null)} />}
      </>;
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return <div className="fi ap-jobs-page-85">

      <div className="ap-jobs-page-86">
        <SectionHdr title="Work Orders" sub={`${total} of ${jobs.length} total jobs`} />
        <button onClick={() => openModal('new_job')} className="ap-jobs-page-87">
          + New Job
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="ap-jobs-page-88">
        <div className="ap-jobs-page-89">
          {[['all', 'All', jobs.length], ...Object.entries(JOB_STATUS).map(([k, v]) => [k, v.label, counts[k] || 0])].map(([k, l, c]) => <button key={k} onClick={() => setSf(k)} style={{
          padding: isMobile ? "6px 8px" : "6px 12px",
          fontSize: isMobile ? "11px" : "12px",
          background: sf === k ? "var(--brand-light)" : "transparent",
          color: sf === k ? "var(--brand)" : "var(--text-muted)"
        }} className="ap-jobs-page-90">
              {l}
              <span style={{
            background: sf === k ? "var(--xea580c20)" : "var(--border)",
            color: sf === k ? "var(--brand)" : "var(--text-faint)"
          }} className="ap-jobs-page-91">{c}</span>
            </button>)}
        </div>
      </div>

      {/* Table card */}
      <div className="ap-jobs-page-92">
        <div className="ap-jobs-page-93">
          <div style={{
          width: isMobile ? "60%" : "auto"
        }}>
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by job ID, customer, issue…" />
          </div>
          <FilterSelect value={activeFilters.type} onChange={val => setFilter('type', val)} options={['Service', 'Repair', 'Installation', 'AMC Visit']} allLabel="All Types" />
          <FilterSelect value={activeFilters.tech} onChange={val => setFilter('tech', val)} options={TECH_OPTIONS} allLabel="All Technicians" />
          <div className="ap-jobs-page-94"><ExportDropdown {...exportProps} /></div>
        </div>

        <div className="ap-jobs-page-95">
          <table className="ap-jobs-page-96">
            <Thead cols={['Job ID', 'Customer', 'Type', 'Issue / AC', 'Technician', 'Date', 'Amount', 'Status', '']} />
            <tbody>
              {paginated.map((job, i) => <tr key={job._id} className="row ap-jobs-page-97" onClick={() => {
              setInitialEditMode(false);
              setOpenJob(job._id);
            }} style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                  <td className="ap-jobs-page-98">
                    <span className="ap-jobs-page-99">{job.id}</span>
                  </td>
                  <td className="ap-jobs-page-100">
                    <div className="ap-jobs-page-101">{job.customer}</div>
                    <div className="ap-jobs-page-102">{job.address.split(',')[0]}</div>
                  </td>
                  <td className="ap-jobs-page-103"><TypeTag type={job.type} /></td>
                  <td className="ap-jobs-page-104">
                    <div className="ap-jobs-page-105">{job.issue}</div>
                    <div className="ap-jobs-page-106">{job.ac}</div>
                  </td>
                  <td className="ap-jobs-page-107">
                    {job.tech === 'Unassigned' ? <span className="ap-jobs-page-108">⚠ Unassigned</span> : <div className="ap-jobs-page-109">
                          <Avatar name={job.tech} size={24} />
                          <span className="ap-jobs-page-110">{job.tech}</span>
                        </div>}
                  </td>
                  <td className="ap-jobs-page-111">
                    <div className="ap-jobs-page-112">{job.date}</div>
                    <div className="ap-jobs-page-113">{job.time}</div>
                  </td>
                  <td className="ap-jobs-page-114">
                    <span className="ap-jobs-page-115">₹{job.amount.toLocaleString()}</span>
                  </td>
                  <td className="ap-jobs-page-116"><SBadge s={job.status} map={JOB_STATUS} /></td>
                  <td onClick={e => e.stopPropagation()} className="ap-jobs-page-117">
                    <ActionDropdown onView={() => {
                  setInitialEditMode(false);
                  setOpenJob(job._id);
                }} onEdit={() => {
                  setInitialEditMode(true);
                  setOpenJob(job._id);
                }} onDelete={() => setDeleteTarget(job._id)} />
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => {
      handleDelete(deleteTarget);
      setDeleteTarget(null);
    }} onCancel={() => setDeleteTarget(null)} message="This work order will be deleted permanently." />
    </div>;
};
export default JobsPage;