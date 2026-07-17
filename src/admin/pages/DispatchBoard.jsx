// DispatchBoard.jsx — wired to the real backend
//
// Technician.js has no `vehicle`, `battery`, `currentJob`, `nextJob`, or
// `lastUpdate` fields — those were mock-only. Dropped the ones with no real
// equivalent (battery, vehicle) and derived the ones that ARE derivable
// (current/next job) from the real Job list per technician instead of
// expecting them embedded on the technician document.
//
// Data flow:
//  - technicians -> techsApi.list()                         GET /technicians
//  - allJobs     -> jobsApi.list({ limit: 200 })             GET /jobs
//  - assign      -> jobsApi.assign(jobId, {technicianId,..}) PUT /jobs/:id/assign
//  - tech status -> techsApi.update(techId, { status })      PUT /technicians/:id
//  - tech edit   -> techsApi.update(techId, { name,area,phone }) PUT /technicians/:id

import { JOB_STATUS, TECH_STATUS } from '../constants/statusMaps';
import { jobsApi, techsApi } from '../services/api';
import { useState, useEffect, useCallback } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag, PBadge, Avatar, Divider } from '../components/ui/Badges';

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

// ─── Date helpers ────────────────────────────────────────────────────────────
const isSameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Transforms a raw Job document from the API into the flat shape this page uses.
const mapJob = (j, idx) => {
  const rawDate = j.scheduledDate ? new Date(j.scheduledDate) : null;
  return {
    ...j,
    _id: j._id,
    id: j.jobId || j._id || `job-${idx}`,
    technicianId: typeof j.technician === 'object' && j.technician ? j.technician._id : j.technician || null,
    tech: typeof j.technician === 'object' && j.technician ? j.technician.name : j.techName || 'Unassigned',
    customer: typeof j.customer === 'object' && j.customer ? j.customer.name : j.customerName || j.customer || '',
    address: typeof j.customer === 'object' && j.customer?.address || j.address || '',
    rawDate,
    date: rawDate ? rawDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : j.date || '',
    time: j.scheduledTime || j.time || ''
  };
};

// ─── FieldLabel ───────────────────────────────────────────────────────────────
const FieldLabel = ({
  children
}) => <div className="ap-dispatch-board-1">
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

// Statuses a technician can be set to — must match Technician.status enum
// exactly (available | busy | off | on_leave). The old mock UI had a
// 'break' option that isn't a real enum value and would fail validation.
const statusOptions = [{
  key: 'available',
  icon: '✅',
  label: 'Available',
  color: '#22C55E',
  bg: '#ECFDF5'
}, {
  key: 'busy',
  icon: '🔧',
  label: 'On Job',
  color: COLORS.brand,
  bg: COLORS.brandL
}, {
  key: 'off',
  icon: '💤',
  label: 'Off Duty',
  color: '#94A3B8',
  bg: '#F1F5F9'
}, {
  key: 'on_leave',
  icon: '🌴',
  label: 'On Leave',
  color: '#F59E0B',
  bg: '#FFFBEB'
}];

// ─── Stats config ─────────────────────────────────────────────────────────────
const getStats = (busy, available, offDuty, unassigned) => [{
  label: "On Job",
  value: busy.length,
  color: "#F59E0B",
  bg: "#FFFBEB",
  icon: "🔧"
}, {
  label: "Available",
  value: available.length,
  color: "#22C55E",
  bg: "#ECFDF5",
  icon: "✅"
}, {
  label: "Off Duty",
  value: offDuty.length,
  color: "#94A3B8",
  bg: "#F1F5F9",
  icon: "💤"
}, {
  label: "Unassigned Jobs",
  value: unassigned.length,
  color: "#EF4444",
  bg: "#FEF2F2",
  icon: "⚠"
}];

// ─── TechDetailView ───────────────────────────────────────────────────────────
const TechDetailView = ({
  tech,
  allJobs,
  onBack,
  openModal,
  isMobile,
  onRefresh
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: tech.name,
    area: tech.area,
    phone: tech.phone
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [toast, setToast] = useState('');
  const techJobs = allJobs.filter(j => j.technicianId === tech._id && j.status !== 'cancelled');
  const flash = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 2800);
  };
  const statusColor = tech.status === 'busy' ? COLORS.brand : tech.status === 'available' ? '#22C55E' : '#94A3B8';
  const statusBg = tech.status === 'busy' ? COLORS.brandL : tech.status === 'available' ? '#ECFDF5' : '#F1F5F9';
  const set = key => e => setEditData(prev => ({
    ...prev,
    [key]: e.target.value
  }));
  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await techsApi.update(tech._id, editData);
      setEditMode(false);
      flash('Technician updated successfully');
      await onRefresh();
    } catch (err) {
      setSaveError(err.message || 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  const handleStatusClick = async key => {
    if (key === tech.status || statusUpdating) return;
    setStatusUpdating(true);
    setStatusError('');
    try {
      await techsApi.update(tech._id, {
        status: key
      });
      await onRefresh();
      flash(`Status updated to ${statusOptions.find(s => s.key === key)?.label}`);
    } catch (err) {
      setStatusError(err.message || 'Could not update status.');
    } finally {
      setStatusUpdating(false);
    }
  };
  return <>
      {/* ── Back bar ── */}
      <div className="ap-dispatch-board-2">
        <button onClick={onBack} className="back-btn">←</button>
        <span className="ap-dispatch-board-3">Dispatch Board</span>
        <span className="ap-dispatch-board-4">›</span>
        <span className="ap-dispatch-board-5">{tech.name}</span>
        <span className="ap-dispatch-board-6">
          #{tech.techId}
        </span>

        <div className="ap-dispatch-board-7">
          {editMode ? <>
              <button onClick={() => {
            setEditMode(false);
            setEditData({
              name: tech.name,
              area: tech.area,
              phone: tech.phone
            });
            setSaveError('');
          }} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm" style={{
            background: saving ? "var(--xcbd5e1)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))"
          }}>
                {saving ? 'Saving…' : '💾 Save'}
              </button>
            </> : <button onClick={() => setEditMode(true)} className="btn btn-secondary btn-sm">
              ✏️ Edit
            </button>}
        </div>
      </div>

      {saveError && <div className="ap-dispatch-board-8">
          {saveError}
        </div>}

      {/* ── Detail grid ── */}
      <div className="job-detail-grid">

        {/* ── Main card ── */}
        <div style={{
        border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
        padding: isMobile ? "14px" : "20px",
        boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.05)"
      }} className="ap-dispatch-board-9">

          {/* ── Profile header ── */}
          <div style={{
          flexWrap: isMobile ? "wrap" : "nowrap"
        }} className="ap-dispatch-board-10">
            <div className="ap-dispatch-board-11">
              <Avatar name={tech.name} size={56} color={statusColor} />
              <div style={{
              background: statusColor
            }} className="ap-dispatch-board-12" />
            </div>
            <div className="ap-dispatch-board-13">
              <div className="ap-dispatch-board-14">
                <span style={{
                background: statusBg,
                color: statusColor
              }} className="ap-dispatch-board-15">
                  {TECH_STATUS[tech.status]?.label || tech.status}
                </span>
                {tech.updatedAt && <span className="ap-dispatch-board-16">
                    Last update: {new Date(tech.updatedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                  </span>}
              </div>
              {editMode ? <input value={editData.name} onChange={set('name')} className="ap-dispatch-board-17" /> : <div style={{
              fontSize: isMobile ? "16px" : "18px"
            }} className="ap-dispatch-board-18">{tech.name}</div>}
              <div className="ap-dispatch-board-19">
                {editMode ? <input value={editData.area} onChange={set('area')} placeholder="Area" className="ap-dispatch-board-20" /> : <span className="ap-dispatch-board-21">📍 {tech.area || '—'}</span>}
                {editMode ? <input value={editData.phone} onChange={set('phone')} placeholder="Phone" className="ap-dispatch-board-22" /> : <span className="ap-dispatch-board-23">📱 {tech.phone}</span>}
              </div>
            </div>
          </div>

          <Divider />

          {/* ── Performance snapshot ── */}
          <div className="job-field-grid ap-dispatch-board-24">
            <div>
              <FieldLabel>Rating</FieldLabel>
              <div className="ap-dispatch-board-25">⭐ {tech.rating?.toFixed(1) ?? '—'}</div>
            </div>
            <div>
              <FieldLabel>Jobs Target</FieldLabel>
              <div className="ap-dispatch-board-26">🎯 {tech.jobs ?? 0} / {tech.jobsTarget || '—'}</div>
            </div>
            <div>
              <FieldLabel>Today's Jobs</FieldLabel>
              <div className="ap-dispatch-board-27">{techJobs.length}</div>
            </div>
            <div>
              <FieldLabel>Completed</FieldLabel>
              <div className="ap-dispatch-board-28">{techJobs.filter(j => j.status === 'completed').length}</div>
            </div>
          </div>

          <Divider />

          {/* ── Current Job (derived from real jobs, not stored on technician) ── */}
          {(() => {
          const currentJob = techJobs.find(j => j.status === 'in_progress');
          if (!currentJob) return null;
          return <div className="ap-dispatch-board-29">
                <div className="ap-dispatch-board-30">Current Job</div>
                <div className="ap-dispatch-board-31">
                  <div className="ap-dispatch-board-32">
                    <span className="ap-dispatch-board-33">{currentJob.id}</span>
                    <SBadge s={currentJob.status} map={JOB_STATUS} />
                  </div>
                  <div className="ap-dispatch-board-34">{currentJob.customer}</div>
                  <div className="ap-dispatch-board-35">📍 {currentJob.address}</div>
                  <div className="ap-dispatch-board-36">🕑 Scheduled: <strong>{currentJob.time}</strong></div>
                </div>
              </div>;
        })()}

          {/* ── Next Job (derived) ── */}
          {(() => {
          const nextJob = techJobs.filter(j => j.status === 'assigned').sort((a, b) => (a.rawDate?.getTime() || 0) - (b.rawDate?.getTime() || 0))[0];
          if (!nextJob) return null;
          return <div className="ap-dispatch-board-37">
                <div className="ap-dispatch-board-38">Next Job</div>
                <div className="ap-dispatch-board-39">
                  <div className="ap-dispatch-board-40">
                    <span className="ap-dispatch-board-41">{nextJob.customer}</span>
                    {nextJob.priority === 'urgent' && <span className="ap-dispatch-board-42">🚨 URGENT</span>}
                  </div>
                  <div className="ap-dispatch-board-43">{nextJob.type} · {nextJob.date} · {nextJob.time}</div>
                </div>
              </div>;
        })()}

          {/* ── Assigned Jobs list ── */}
          <div className="ap-dispatch-board-44">
            <div className="ap-dispatch-board-45">Assigned Jobs ({techJobs.length})</div>
            {techJobs.length === 0 ? <div className="ap-dispatch-board-46">No jobs assigned</div> : <div className="ap-dispatch-board-47">
                <table className="ap-dispatch-board-48">
                  <thead>
                    <tr className="ap-dispatch-board-49">
                      {['Job ID', 'Customer', 'Type', 'Date', 'Status'].map(h => <th key={h} className="ap-dispatch-board-50">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {techJobs.map((j, i) => <tr key={j._id} style={{
                  background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
                }} className="ap-dispatch-board-51">
                        <td className="ap-dispatch-board-52"><span className="ap-dispatch-board-53">{j.id}</span></td>
                        <td className="ap-dispatch-board-54">{j.customer}</td>
                        <td className="ap-dispatch-board-55"><TypeTag type={j.type} /></td>
                        <td className="ap-dispatch-board-56">{j.date}</td>
                        <td className="ap-dispatch-board-57"><SBadge s={j.status} map={JOB_STATUS} /></td>
                      </tr>)}
                  </tbody>
                </table>
              </div>}
          </div>

          {/* ── Action buttons ── */}
          {!editMode && <div className="job-action-btns ap-dispatch-board-58">
              <button className="btn ap-dispatch-board-59" onClick={() => openModal('new_job')}>
                + Assign Job
              </button>
              <button className="btn ap-dispatch-board-60">
                📞 Call
              </button>
            </div>}
        </div>

        {/* ── Sidebar ── */}
        <div className="job-detail-sidebar">

          {/* ── Update Status ── */}
          {!editMode && <div className="ap-dispatch-board-61">
              <div className="ap-dispatch-board-62">Update Status</div>
              {statusError && <div className="ap-dispatch-board-63">{statusError}</div>}
              {statusOptions.map(({
            key,
            icon,
            label,
            color,
            bg
          }) => {
            const isCurrent = tech.status === key;
            return <button key={key} disabled={statusUpdating} onClick={() => handleStatusClick(key)} style={{
              background: isCurrent ? bg : '#FAFAF9',
              color: isCurrent ? color : COLORS.h2,
              fontWeight: isCurrent ? "700" : "500",
              border: `1px solid ${isCurrent ? color + '55' : COLORS.border}`,
              cursor: isCurrent || statusUpdating ? "default" : "pointer",
              opacity: statusUpdating && !isCurrent ? "0.6" : "1"
            }} className="ap-dispatch-board-64">
                    <span>{icon}</span>
                    <span className="ap-dispatch-board-65">{isCurrent ? '● ' : '→ '}{label}</span>
                    {isCurrent && <span style={{
                background: color + '22',
                color
              }} className="ap-dispatch-board-66">Current</span>}
                  </button>;
          })}
            </div>}

          {/* ── Performance stats ── */}
          <div className="ap-dispatch-board-67">
            <div className="ap-dispatch-board-68">Performance</div>
            {[['Total Jobs Today', techJobs.length, COLORS.h2], ['Completed', techJobs.filter(j => j.status === 'completed').length, '#22C55E'], ['In Progress', techJobs.filter(j => j.status === 'in_progress').length, COLORS.brand], ['Pending', techJobs.filter(j => j.status === 'assigned').length, '#F59E0B']].map(([k, v, c]) => <div key={k} className="ap-dispatch-board-69">
                <span className="ap-dispatch-board-70">{k}</span>
                <span style={{
              color: c
            }} className="ap-dispatch-board-71">{v}</span>
              </div>)}
          </div>

          {/* ── Quick Info ── */}
          <div style={{
          border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`
        }} className="ap-dispatch-board-72">
            <div className="ap-dispatch-board-73">Technician Info</div>
            {[['Area / Zone', 'area', tech.area || '—'], ['Phone', 'phone', tech.phone]].map(([label, key, display]) => <div key={key} className="ap-dispatch-board-74">
                <span className="ap-dispatch-board-75">{label}</span>
                {editMode ? <input value={editData[key] || ''} onChange={set(key)} className="ap-dispatch-board-76" /> : <span className="ap-dispatch-board-77">{display}</span>}
              </div>)}
            <div className="ap-dispatch-board-78">
              <span className="ap-dispatch-board-79">Techician ID</span>
              <span className="ap-dispatch-board-80">{tech.techId}</span>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">
          <span className="toast-check">✓</span>
          {toast}
        </div>}
    </>;
};

// ─── UnassignedJobCard ────────────────────────────────────────────────────────
// Its own local state so picking a technician on one card doesn't re-render
// (or reset) every other card in the list.
const UnassignedJobCard = ({
  job,
  available,
  onAssigned
}) => {
  const [techId, setTechId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const handleAssign = async () => {
    if (!techId || assigning) return;
    setAssigning(true);
    setError('');
    try {
      const tech = available.find(t => t._id === techId);
      await jobsApi.assign(job._id, {
        technicianId: techId,
        techName: tech?.name
      });
      await onAssigned();
    } catch (err) {
      setError(err.message || 'Could not assign this job.');
      setAssigning(false);
    }
  };
  return <div style={{
    border: `1px solid ${job.priority === 'urgent' ? '#EF444440' : '#2A2A4A'}`
  }} className="ap-dispatch-board-81">
      <div className="ap-dispatch-board-82">
        <span className="ap-dispatch-board-83">{job.id}</span>
        <PBadge p={job.priority} />
      </div>
      <div className="ap-dispatch-board-84">{job.customer}</div>
      <div className="ap-dispatch-board-85">{job.type} · {job.date} {job.time}</div>
      <div className="ap-dispatch-board-86">📍 {job.address}</div>

      {error && <div className="ap-dispatch-board-87">{error}</div>}

      <select value={techId} onChange={e => setTechId(e.target.value)} disabled={assigning} className="ap-dispatch-board-88">
        <option value="">Assign technician…</option>
        {available.map(t => <option key={t._id} value={t._id}>{t.name} – {t.area || 'Unassigned area'}</option>)}
      </select>

      <button className="btn ap-dispatch-board-89" disabled={!techId || assigning} onClick={handleAssign} style={{
      background: !techId || assigning ? "var(--text-h2)" : "var(--brand)",
      color: !techId || assigning ? "var(--text-faint)" : "white",
      cursor: !techId || assigning ? "not-allowed" : "pointer"
    }}>
        {assigning ? 'Assigning…' : '✓ Assign'}
      </button>
    </div>;
};

// ─── DispatchBoard ────────────────────────────────────────────────────────────
const DispatchBoard = ({
  openModal
}) => {
  const {
    isMobile
  } = useBreakpoint();
  const [selected, setSelected] = useState(null);
  const [openTech, setOpenTech] = useState(null); // tech._id for detail view
  const [allJobs, setAllJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const loadJobs = useCallback(async () => {
    const r = await jobsApi.list({
      limit: 200
    });
    const list = r?.data ?? r ?? [];
    setAllJobs(list.map(mapJob));
  }, []);
  const loadTechs = useCallback(async () => {
    const r = await techsApi.list({
      limit: 200
    });
    const list = r?.data ?? r ?? [];
    setTechnicians(list);
  }, []);
  const loadAll = useCallback(async () => {
    setErrorMsg('');
    try {
      await Promise.all([loadJobs(), loadTechs()]);
    } catch (err) {
      setErrorMsg(err.message || 'Could not load dispatch data.');
    }
  }, [loadJobs, loadTechs]);
  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);
  const unassigned = allJobs.filter(j => (j.tech === 'Unassigned' || !j.technicianId) && !['completed', 'cancelled', 'invoiced'].includes(j.status));
  const busy = technicians.filter(t => t.status === 'busy');
  const available = technicians.filter(t => t.status === 'available');
  const offDuty = technicians.filter(t => ['off', 'on_leave'].includes(t.status));
  const stats = getStats(busy, available, offDuty, unassigned);
  const today = new Date();

  // ── Detail view ───────────────────────────────────────────────────────────
  if (openTech) {
    const tech = technicians.find(t => t._id === openTech);
    if (!tech) {
      return <div className="ap-dispatch-board-90">
          <div className="ap-dispatch-board-91">
            <div className="ap-dispatch-board-92">⏳</div>
            <div>Loading technician details…</div>
            <button onClick={() => setOpenTech(null)} className="ap-dispatch-board-93">
              ← Back to Dispatch
            </button>
          </div>
        </div>;
    }
    return <TechDetailView tech={tech} allJobs={allJobs} onBack={() => setOpenTech(null)} openModal={openModal} isMobile={isMobile} onRefresh={loadAll} />;
  }

  // ── Initial loading state ──────────────────────────────────────────────────
  if (loading) {
    return <div className="ap-dispatch-board-94">
        <div className="ap-dispatch-board-95">
          <div className="ap-dispatch-board-96">⏳</div>
          Loading dispatch board…
        </div>
      </div>;
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return <div className="fu ap-dispatch-board-97">

      {/* ── Header ── */}
      <div className="ap-dispatch-board-98">
        <div>
          <div className="ap-dispatch-board-99">Dispatch Board</div>
          <div className="ap-dispatch-board-100">
            Live field operations — real-time technician tracking &amp; job assignment
          </div>
        </div>
        <div className="ap-dispatch-board-101">
          <div className="ap-dispatch-board-102">
            <span className="blink ap-dispatch-board-103" />
            <span className="ap-dispatch-board-104">Live</span>
          </div>
          <button className="btn ap-dispatch-board-105" onClick={() => openModal('new_job')}>
            + New Job
          </button>
        </div>
      </div>

      {errorMsg && <div className="ap-dispatch-board-106">
          {errorMsg}
        </div>}

      {/* ── Stats bar ── */}
      <div className="dispatch-stats-grid">
        {stats.map(s => <div key={s.label} style={{
        background: s.bg,
        border: `1px solid ${s.color}20`
      }} className="ap-dispatch-board-107">
            <div className="ap-dispatch-board-108">
              <div style={{
            color: s.color
          }} className="ap-dispatch-board-109">{s.value}</div>
              <span className="ap-dispatch-board-110">{s.icon}</span>
            </div>
            <div style={{
          color: s.color
        }} className="ap-dispatch-board-111">{s.label}</div>
          </div>)}
      </div>

      {/* ── Main grid ── */}
      <div className="dispatch-main-grid">

        {/* ── Technician cards ── */}
        <div className="ap-dispatch-board-112">
          {technicians.length === 0 ? <div className="ap-dispatch-board-113">
              No technicians found.
            </div> : technicians.map(tech => {
          const isSelected = selected === tech._id;
          const statusColor = tech.status === 'busy' ? COLORS.brand : tech.status === 'available' ? '#22C55E' : '#94A3B8';
          const statusBg = tech.status === 'busy' ? COLORS.brandL : tech.status === 'available' ? '#ECFDF5' : '#F1F5F9';
          const techJobs = allJobs.filter(j => j.technicianId === tech._id && j.status !== 'cancelled');
          const currentJob = techJobs.find(j => j.status === 'in_progress');
          const nextJob = techJobs.filter(j => j.status === 'assigned').sort((a, b) => (a.rawDate?.getTime() || 0) - (b.rawDate?.getTime() || 0))[0];
          return <div key={tech._id} onClick={() => setSelected(isSelected ? null : tech._id)} style={{
            border: `2px solid ${isSelected ? COLORS.brand : COLORS.border}`,
            boxShadow: isSelected ? "0 0 0 3px var(--xea580c20)" : "0 1px 4px rgba(0,0,0,.05)"
          }} className="ap-dispatch-board-114">
                <div className="dispatch-tech-card-inner">

                  <div className="ap-dispatch-board-115">
                    <Avatar name={tech.name} size={44} color={statusColor} />
                    <div style={{
                  background: statusColor
                }} className="ap-dispatch-board-116" />
                  </div>

                  <div className="ap-dispatch-board-117">
                    <div className="ap-dispatch-board-118">
                      <div className="ap-dispatch-board-119">{tech.name}</div>
                      <span style={{
                    background: statusBg,
                    color: statusColor
                  }} className="ap-dispatch-board-120">
                        {TECH_STATUS[tech.status]?.label || tech.status}
                      </span>
                    </div>
                    <div className="ap-dispatch-board-121">📍 {tech.area || '—'} · 📱 {tech.phone}</div>
                    <div className="ap-dispatch-board-122">⭐ {tech.rating?.toFixed(1) ?? '—'} · 🎯 {tech.jobs ?? 0}/{tech.jobsTarget || '—'} jobs</div>

                    {currentJob && <div className="ap-dispatch-board-123">
                        <div className="ap-dispatch-board-124">
                          <span className="ap-dispatch-board-125">CURRENT JOB</span>
                          <span className="ap-dispatch-board-126">{currentJob.id}</span>
                        </div>
                        <div className="ap-dispatch-board-127">{currentJob.customer}</div>
                        <div className="ap-dispatch-board-128">📍 {currentJob.address}</div>
                        <div className="ap-dispatch-board-129">🕑 Scheduled: {currentJob.time}</div>
                      </div>}

                    {nextJob && <div className="ap-dispatch-board-130">
                        <div className="ap-dispatch-board-131">NEXT JOB</div>
                        <div className="ap-dispatch-board-132">{nextJob.customer} — {nextJob.type}</div>
                        {nextJob.priority === 'urgent' && <span className="ap-dispatch-board-133">🚨 URGENT</span>}
                      </div>}

                    {!currentJob && !nextJob && tech.status === 'available' && <div className="ap-dispatch-board-134">
                        <span className="ap-dispatch-board-135">✅</span>
                        <span className="ap-dispatch-board-136">Available – ready to be assigned</span>
                      </div>}
                  </div>

                  <div className="dispatch-tech-actions">
                    <button className="btn ap-dispatch-board-137" onClick={e => {
                  e.stopPropagation();
                  setOpenTech(tech._id);
                }}>
                      👁 View
                    </button>
                    <button className="btn ap-dispatch-board-138" onClick={e => {
                  e.stopPropagation();
                  openModal('new_job');
                }}>
                      Assign Job
                    </button>
                    <button className="btn ap-dispatch-board-139" onClick={e => e.stopPropagation()}>
                      📞 Call
                    </button>
                    {tech.updatedAt && <div className="ap-dispatch-board-140">
                        Updated {new Date(tech.updatedAt).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                      </div>}
                  </div>

                </div>
              </div>;
        })}
        </div>

        {/* ── Right panel ── */}
        <div>

          {/* Unassigned jobs */}
          <div className="ap-dispatch-board-141">
            <div className="ap-dispatch-board-142">⚠️ Unassigned Jobs</div>
            {unassigned.length === 0 ? <div className="ap-dispatch-board-143">All jobs assigned ✓</div> : unassigned.map(j => <UnassignedJobCard key={j._id} job={j} available={available} onAssigned={loadAll} />)}
          </div>

          {/* Today's Job Flow */}
          <div className="ap-dispatch-board-144">
            <div className="ap-dispatch-board-145">Today's Job Flow</div>
            {(() => {
            const todaysJobs = allJobs.filter(j => isSameDay(j.rawDate, today));
            if (todaysJobs.length === 0) {
              return <div className="ap-dispatch-board-146">No jobs scheduled for today</div>;
            }
            return todaysJobs.map((j, i, arr) => <div key={j._id} style={{
              paddingBottom: i < arr.length - 1 ? "12px" : "0"
            }} className="ap-dispatch-board-147">
                  {i < arr.length - 1 && <div className="ap-dispatch-board-148" />}
                  <div style={{
                background: j.status === 'completed' ? '#22C55E' : j.status === 'in_progress' ? COLORS.brand : '#E2E8F0'
              }} className="ap-dispatch-board-149">
                    {i + 1}
                  </div>
                  <div className="ap-dispatch-board-150">
                    <div className="ap-dispatch-board-151">{j.customer}</div>
                    <div className="ap-dispatch-board-152">{j.tech} · {j.time}</div>
                  </div>
                  <SBadge s={j.status} map={JOB_STATUS} />
                </div>);
          })()}
          </div>

        </div>
      </div>
    </div>;
};
export default DispatchBoard;