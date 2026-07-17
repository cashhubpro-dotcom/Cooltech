// LeadsPage.jsx — fully responsive for mobile & tablet

import { leadsApi, jobsApi } from '../../services/api';
import { useState, useRef, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import ActionDropdown from '../../components/ui/ActionDropdown';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import EditableDetailView from '../../components/ui/EditableDetailView';
import TableSearchBar from '../../components/ui/TableSearchBar';
import { useTableSearch } from '../../hooks/useTableSearch';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { LEAD_ACTIVITIES } from '../../data/mockData';

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

// ─── Local constants ──────────────────────────────────────────────────────────
const LEAD_STAGES = {
  new: {
    label: 'New',
    color: "var(--info)",
    bg: "var(--info-bg)"
  },
  follow_up: {
    label: 'Follow Up',
    color: "var(--warning)",
    bg: "var(--warning-bg)"
  },
  proposal_sent: {
    label: 'Proposal Sent',
    color: "var(--purple)",
    bg: "var(--purple-bg)"
  },
  negotiation: {
    label: 'Negotiation',
    color: "var(--brand)",
    bg: "var(--brand-light)"
  },
  won: {
    label: 'Won',
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  lost: {
    label: 'Lost',
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  }
};
const stageOrder = ['new', 'follow_up', 'proposal_sent', 'negotiation', 'won', 'lost'];
const ACT_ICONS = {
  call: '📞',
  email: '📧',
  whatsapp: '💬',
  visit: '🚗',
  note: '📝',
  quote: '📄'
};
const SOURCE_OPTIONS = [...new Set([].map(l => l.source).filter(Boolean))].sort();
const TYPE_OPTIONS = [...new Set([].map(l => l.type).filter(Boolean))].sort();

// ─── Export column config ─────────────────────────────────────────────────────
const LEAD_COLUMNS = [{
  label: 'Lead ID',
  key: 'id',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700,
    color: '#EA580C',
    fontSize: 11
  }
}, {
  label: 'Company',
  key: 'name',
  width: 20,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Contact',
  key: 'contact',
  width: 16,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Phone',
  key: 'phone',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace',
    fontSize: 11
  }
}, {
  label: 'Type',
  key: 'type',
  width: 12,
  render: val => <TypeTag type={val} />,
  format: val => val
}, {
  label: 'Stage',
  key: 'stage',
  width: 14,
  render: val => <SBadge s={val} map={LEAD_STAGES} />,
  format: val => LEAD_STAGES[val]?.label ?? val
}, {
  label: 'Source',
  key: 'source',
  width: 14,
  tdStyle: {
    fontSize: 12,
    color: COLORS.muted
  }
}, {
  label: 'Value',
  key: 'value',
  width: 12,
  excelKey: 'Value (₹)',
  render: val => <span className="ap-leads-page-1">₹{Number(val).toLocaleString()}</span>,
  format: val => val,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 800,
    color: '#EA580C'
  }
}, {
  label: 'Assigned',
  key: 'assignedTo',
  width: 14,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Last Contact',
  key: 'lastContact',
  width: 12,
  tdStyle: {
    fontSize: 12,
    color: COLORS.muted
  }
}];

// ─── ScoreBadge ───────────────────────────────────────────────────────────────
const ScoreBadge = ({
  score,
  temp
}) => {
  const tempColor = {
    hot: '#DC2626',
    warm: '#F59E0B',
    cold: '#3B82F6'
  }[temp] || COLORS.muted;
  const tempBg = {
    hot: '#FEF2F2',
    warm: '#FFFBEB',
    cold: '#EFF6FF'
  }[temp] || COLORS.bg;
  const tempIcon = {
    hot: '🔥',
    warm: '☀️',
    cold: '❄️'
  }[temp] || '';
  return <div className="ap-leads-page-2">
      <span className="ap-leads-page-3">{score}</span>
      <span style={{
      background: tempBg,
      color: tempColor
    }} className="ap-leads-page-4">{tempIcon} {temp}</span>
    </div>;
};

// ─── MoveStageModal ───────────────────────────────────────────────────────────
const MoveStageModal = ({
  lead,
  targetStage,
  onClose,
  onConfirm
}) => {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  if (!targetStage) return null;
  const m = LEAD_STAGES[targetStage];
  const stageIcon = {
    new: '🆕',
    follow_up: '🔄',
    proposal_sent: '📄',
    negotiation: '🤝',
    won: '🏆',
    lost: '❌'
  };
  const handle = async () => {
    setSaving(true);
    await onConfirm(targetStage, note);
    setSaving(false);
    onClose();
  };
  return <div onClick={onClose} className="ap-leads-page-5">
      <div style={{
      border: `2px solid ${m.color}30`
    }} onClick={e => e.stopPropagation()} className="ap-leads-page-6">
        {/* Header */}
        <div className="ap-leads-page-7">
          <div style={{
          background: m.bg
        }} className="ap-leads-page-8">
            {stageIcon[targetStage]}
          </div>
          <div>
            <div className="ap-leads-page-9">
              Move to <span style={{
              color: m.color
            }}>{m.label}</span>
            </div>
            <div className="ap-leads-page-10">
              {lead.name} · {lead.id}
            </div>
          </div>
        </div>

        {/* Stage transition pill */}
        <div className="ap-leads-page-11">
          <span style={{
          background: LEAD_STAGES[lead.stage]?.bg,
          color: LEAD_STAGES[lead.stage]?.color
        }} className="ap-leads-page-12">
            {LEAD_STAGES[lead.stage]?.label}
          </span>
          <span className="ap-leads-page-13">→</span>
          <span style={{
          background: m.bg,
          color: m.color
        }} className="ap-leads-page-14">
            {m.label}
          </span>
        </div>

        {/* Note */}
        <div className="ap-leads-page-15">
          <label className="ap-leads-page-16">
            Add a note (optional)
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={`Reason for moving to ${m.label}…`} rows={3} onFocus={e => e.target.style.borderColor = m.color} onBlur={e => e.target.style.borderColor = COLORS.border} className="ap-leads-page-17" />
        </div>

        {/* Actions */}
        <div className="ap-leads-page-18">
          <button onClick={onClose} className="ap-leads-page-19">
            Cancel
          </button>
          <button onClick={handle} disabled={saving} style={{
          background: saving ? COLORS.muted : `linear-gradient(135deg,${m.color},${m.color}cc)`,
          cursor: saving ? "not-allowed" : "pointer",
          boxShadow: saving ? 'none' : `0 4px 14px ${m.color}40`
        }} className="ap-leads-page-20">
            {saving ? 'Updating…' : `Confirm → ${m.label}`}
          </button>
        </div>
      </div>
    </div>;
};

// ─── WonModal — convert lead to Job ──────────────────────────────────────────
const WonModal = ({
  lead,
  onClose,
  onConfirm
}) => {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null); // { jobId } after success
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    type: 'Installation',
    priority: 'normal',
    scheduledDate: '',
    scheduledTime: '',
    ac: '',
    amount: lead.value || '',
    issue: '',
    note: ''
  });
  const set = k => e => setForm(p => ({
    ...p,
    [k]: e.target.value
  }));
  const fieldStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: `1.5px solid ${COLORS.border}`,
    fontSize: 13,
    fontFamily: FONTS.sans,
    color: COLORS.h2,
    background: "var(--bg)",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s'
  };
  const focusGreen = e => e.target.style.borderColor = '#16A34A';
  const blurBorder = e => e.target.style.borderColor = COLORS.border;
  const handle = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await onConfirm(form);
      setDone(result.job);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setSaving(false);
  };
  const LabelEl = ({
    children
  }) => <label className="ap-leads-page-21">
      {children}
    </label>;
  return <div onClick={!done ? onClose : undefined} className="ap-leads-page-22">
      <div onClick={e => e.stopPropagation()} className="ap-leads-page-23">

        {/* ── Header ── */}
        <div className="ap-leads-page-24">
          <div className="ap-leads-page-25">
            🏆
          </div>
          <div className="ap-leads-page-26">
            <div className="ap-leads-page-27">Mark as Won & Create Job</div>
            <div className="ap-leads-page-28">
              {lead.name} · {lead.id}
            </div>
          </div>
          {!done && <button onClick={onClose} className="ap-leads-page-29">
              ✕
            </button>}
        </div>

        {/* ── Success screen ── */}
        {done ? <div className="ap-leads-page-30">
            <div className="ap-leads-page-31">🎉</div>
            <div className="ap-leads-page-32">
              Job Created Successfully!
            </div>
            <div className="ap-leads-page-33">
              Lead marked as <strong className="ap-leads-page-34">Won</strong> · Job is now live in the Jobs page
            </div>
            <div className="ap-leads-page-35">
              <span className="ap-leads-page-36">Job ID</span>
              <span className="ap-leads-page-37">
                {done.jobId}
              </span>
            </div>
            <div className="ap-leads-page-38">
              <button onClick={onClose} className="ap-leads-page-39">
                Done
              </button>
            </div>
          </div> : (/* ── Form ── */
      <div className="ap-leads-page-40">

          {/* Lead summary */}
          <div className="ap-leads-page-41">
            {[['📍', (lead.address || '').split(',')[0] || '—'], ['📞', lead.phone || '—'], ['💰', `₹${Number(lead.value || 0).toLocaleString()}`], ['🔌', `${lead.units || 1} unit(s)`], ['👤', lead.assignedTo || '—']].map(([icon, val]) => <span key={icon} className="ap-leads-page-42">
                {icon} {val}
              </span>)}
          </div>

          {/* Row 1: Type + Priority */}
          <div className="ap-leads-page-43">
            <div>
              <LabelEl>Job Type *</LabelEl>
              <select value={form.type} onChange={set('type')} onFocus={focusGreen} onBlur={blurBorder} className="ap-leads-page-44">
                {['Installation', 'Service', 'Repair', 'AMC Visit', 'Inspection'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <LabelEl>Priority *</LabelEl>
              <select value={form.priority} onChange={set('priority')} onFocus={focusGreen} onBlur={blurBorder} className="ap-leads-page-44">
                <option value="normal">🟢 Normal</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>

          {/* Row 2: Scheduled Date + Time */}
          <div className="ap-leads-page-45">
            <div>
              <LabelEl>Scheduled Date</LabelEl>
              <input type="date" value={form.scheduledDate} onChange={set('scheduledDate')} onFocus={focusGreen} onBlur={blurBorder} className="ap-leads-page-44" />
            </div>
            <div>
              <LabelEl>Time Slot</LabelEl>
              <select value={form.scheduledTime} onChange={set('scheduledTime')} onFocus={focusGreen} onBlur={blurBorder} className="ap-leads-page-44">
                <option value="">— Select —</option>
                {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: AC Model + Amount */}
          <div className="ap-leads-page-46">
            <div>
              <LabelEl>AC / Unit Model</LabelEl>
              <input value={form.ac} onChange={set('ac')} placeholder="e.g. Daikin 1.5T Split" onFocus={focusGreen} onBlur={blurBorder} className="ap-leads-page-44" />
            </div>
            <div>
              <LabelEl>Job Amount (₹)</LabelEl>
              <input type="number" value={form.amount} onChange={set('amount')} placeholder="0" onFocus={focusGreen} onBlur={blurBorder} className="ap-leads-page-47" />
            </div>
          </div>

          {/* Issue / Scope */}
          <div className="ap-leads-page-48">
            <LabelEl>Issue / Scope of Work</LabelEl>
            <textarea value={form.issue} onChange={set('issue')} placeholder="Describe the work to be done…" rows={2} onFocus={focusGreen} onBlur={blurBorder} className="ap-leads-page-49" />
          </div>

          {/* Internal note */}
          <div className="ap-leads-page-50">
            <LabelEl>Internal Note (optional)</LabelEl>
            <input value={form.note} onChange={set('note')} placeholder="Logged to lead activity…" onFocus={focusGreen} onBlur={blurBorder} className="ap-leads-page-44" />
          </div>

          {/* Error */}
          {error && <div className="ap-leads-page-51">
              ⚠️ {error}
            </div>}

          {/* Action buttons */}
          <div className="ap-leads-page-52">
            <button onClick={onClose} className="ap-leads-page-53">
              Cancel
            </button>
            <button onClick={handle} disabled={saving} style={{
            background: saving ? "var(--text-faint)" : "linear-gradient(135deg,var(--success-text),var(--success-text))",
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: saving ? "none" : "0 4px 16px rgba(22,163,74,.4)"
          }} className="ap-leads-page-54">
              {saving ? '⏳ Creating Job…' : '🏆 Confirm Won & Create Job'}
            </button>
          </div>
        </div>)}
      </div>
    </div>;
};

// ─── LeadDetail ───────────────────────────────────────────────────────────────
const LeadDetail = ({
  lead: initialLead,
  onBack,
  onSave,
  onDelete,
  openModal,
  initialEditMode
}) => {
  const {
    isMobile,
    isTablet
  } = useBreakpoint();

  // Local lead copy so stage changes reflect immediately without refetch
  const [lead, setLead] = useState(initialLead);
  const [stageModal, setStageModal] = useState(null); // targetStage key or null
  const [wonModal, setWonModal] = useState(false); // boolean

  // Keep in sync if parent passes new lead data
  useEffect(() => {
    setLead(initialLead);
  }, [initialLead?.id, initialLead?.stage]);

  // ── Handler: non-won stage change ─────────────────────────────────────────
  const handleStageConfirm = async (targetStage, note) => {
    try {
      const patch = {
        stage: targetStage
      };
      if (note) {
        patch.notes = (lead.notes ? lead.notes + '\n' : '') + `[→ ${LEAD_STAGES[targetStage].label}] ${note}`;
      }
      await leadsApi.update(lead._id, patch);
      const updated = {
        ...lead,
        ...patch
      };
      setLead(updated);
      onSave(updated);
    } catch (err) {
      console.error('Stage update failed', err);
    }
  };

  // ── Handler: Won — create Job via dedicated endpoint ──────────────────────
  const handleWonConfirm = async form => {
    const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE}/leads/${lead._id}/convert-to-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? {
          Authorization: `Bearer ${token}`
        } : {})
      },
      body: JSON.stringify({
        customerName: lead.name,
        address: lead.address || '',
        type: form.type,
        priority: form.priority,
        scheduledDate: form.scheduledDate || undefined,
        scheduledTime: form.scheduledTime || '',
        ac: form.ac || '',
        amount: Number(form.amount) || lead.value || 0,
        issue: form.issue || '',
        note: form.note || ''
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create job');

    // Sync stage locally + to parent list (skip handleSave to avoid double-PUT)
    const updated = {
      ...lead,
      stage: 'won'
    };
    setLead(updated);
    // Update parent list directly without triggering leadsApi.update
    onSave(updated, {
      skipBackend: true
    });
    return data; // { job: { jobId, … } }
  };
  const inputStyle = (extra = {}) => ({
    padding: '6px 10px',
    borderRadius: 7,
    border: `1.5px solid ${COLORS.border}`,
    fontSize: 12,
    color: COLORS.h2,
    background: '#FAFAFA',
    fontFamily: FONTS.sans,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    ...extra
  });
  const sidebar = <>
      {/* Move Stage */}
      <div className="ap-leads-page-55">
        <div className="ap-leads-page-56">Move Stage</div>
        {stageOrder.map(s => {
        const m = LEAD_STAGES[s];
        const isCurrent = lead.stage === s;
        return <button key={s} className="btn ap-leads-page-57" onClick={() => {
          if (isCurrent) return;
          if (s === 'won') setWonModal(true);else setStageModal(s);
        }} style={{
          background: isCurrent ? m.bg : '#F9FAFB',
          color: isCurrent ? m.color : COLORS.muted,
          fontWeight: isCurrent ? "700" : "500",
          border: `1px solid ${isCurrent ? m.color + '30' : COLORS.border}`,
          cursor: isCurrent ? "default" : "pointer"
        }}>
              <span>{isCurrent ? '● ' : '○ '}{m.label}</span>
              {s === 'won' && !isCurrent && <span className="ap-leads-page-58">→ Job</span>}
            </button>;
      })}
      </div>

      {/* Contact Info */}
      <div className="ap-leads-page-59">
        <div className="ap-leads-page-60">Contact Info</div>
        {[['Contact', lead.contact], ['Phone', lead.phone], ['Email', lead.email], ['Assigned', lead.assignedTo]].map(([k, v]) => <div key={k} className="ap-leads-page-61">
            <span className="ap-leads-page-62">{k}</span>
            <span className="ap-leads-page-63">{v}</span>
          </div>)}
      </div>

      {/* Schedule Follow-up */}
      <div className="ap-leads-page-64">
        <div className="ap-leads-page-65">Schedule Follow-up</div>
        <input type="date" defaultValue="2026-03-10" className="ap-leads-page-66" />
        <select className="ap-leads-page-67">
          <option>📞 Call</option><option>💬 WhatsApp</option><option>📧 Email</option><option>🏠 Site Visit</option>
        </select>
        <button className="btn ap-leads-page-68" onClick={() => openModal('set_reminder')}>
          Set Reminder
        </button>
      </div>
    </>;
  const activityAndActions = <>
      {/* Activity Log */}
      <div className="ap-leads-page-69">
        <div className="ap-leads-page-70">Activity Log</div>
        {(LEAD_ACTIVITIES[lead.id] || [{
        date: '—',
        by: 'Admin',
        note: 'No activity yet.',
        type: 'note'
      }]).map((a, i) => <div key={i} className="ap-leads-page-71">
            <div className="ap-leads-page-72">
              {ACT_ICONS[a.type] || '📝'}
            </div>
            <div className="ap-leads-page-73">
              <div className="ap-leads-page-74">{a.note}</div>
              <div className="ap-leads-page-75">{a.by}</div>
            </div>
            <div className="ap-leads-page-76">{a.date}</div>
          </div>)}
        <div className="ap-leads-page-77">
          <select className="ap-leads-page-78">
            <option>📞 Call</option><option>📧 Email</option><option>💬 WhatsApp</option><option>🚗 Visit</option><option>📝 Note</option>
          </select>
          <textarea placeholder="Add follow-up note…" className="ap-leads-page-79" />
          <button className="btn ap-leads-page-80" onClick={() => openModal('set_reminder')}>Log</button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="ap-leads-page-81">
        <button className="btn ap-leads-page-82" onClick={() => openModal('new_quotation')}>
          📄 Create Quote
        </button>
        <button className="btn ap-leads-page-83" onClick={() => setWonModal(true)}>
          🏆 Won
        </button>
        <button className="btn ap-leads-page-84" onClick={() => setStageModal('lost')}>
          ✗ Lost
        </button>
      </div>
    </>;
  const fieldKeys = ['contact', 'phone', 'email', 'units', 'source', 'assignedTo'];
  const fieldLabels = {
    contact: 'Contact',
    phone: 'Phone',
    email: 'Email',
    units: 'Units',
    source: 'Source',
    assignedTo: 'Assigned To'
  };
  const fields = [{
    key: 'stage'
  }, {
    key: 'type'
  }, {
    key: 'name'
  }, {
    key: 'address'
  }, {
    key: 'value'
  }, {
    key: 'contact'
  }, {
    key: 'phone'
  }, {
    key: 'email'
  }, {
    key: 'units'
  }, {
    key: 'source'
  }, {
    key: 'assignedTo'
  }, {
    key: 'notes'
  }];
  return <>
      <EditableDetailView id={lead.id} breadcrumb="Leads" onBack={onBack} fields={fields} data={lead} initialEditMode={initialEditMode} onSave={onSave} onDelete={() => onDelete(lead.id)}>
        {({
        editMode,
        editData,
        setEditData
      }) => {
        const val = key => editData[key] ?? lead[key] ?? '';
        const setK = key => e => setEditData(p => ({
          ...p,
          [key]: e.target.value
        }));
        const editSidebar = <div className="ap-leads-page-85">
              <div className="ap-leads-page-86">
                Contact Info <span className="ap-leads-page-87">← editable</span>
              </div>
              {[['Contact', 'contact'], ['Phone', 'phone'], ['Email', 'email'], ['Assigned To', 'assignedTo']].map(([label, key]) => <div key={key} className="ap-leads-page-88">
                  <div className="ap-leads-page-89">{label}</div>
                  <input value={val(key)} onChange={setK(key)} style={inputStyle()} />
                </div>)}
            </div>;
        const isDesktop = !isMobile && !isTablet;
        const detailGridStyle = {
          display: 'grid',
          gridTemplateColumns: isDesktop ? '1fr 300px' : '1fr',
          gap: isMobile ? 12 : 16,
          minWidth: 0
        };
        const sidebarStyle = {
          display: isTablet ? 'grid' : 'flex',
          gridTemplateColumns: isTablet ? '1fr 1fr' : undefined,
          flexDirection: isTablet ? undefined : 'column',
          gap: 12,
          alignItems: 'start',
          minWidth: 0
        };
        return <div style={{
          gridTemplateColumns: isDesktop ? "1fr 300px" : "1fr",
          gap: isMobile ? "12px" : "16px"
        }} className="ap-leads-page-90">

              {/* ── Main card ── */}
              <div style={{
            border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
            padding: isMobile ? "14px 14px" : "20px 24px",
            boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.05)"
          }} className="ap-leads-page-91">

                {/* Badges row */}
                <div className="ap-leads-page-92">
                  {editMode ? <>
                      <select value={val('stage')} onChange={setK('stage')} className="ap-leads-page-93">
                        {stageOrder.map(s => <option key={s} value={s}>{LEAD_STAGES[s].label}</option>)}
                      </select>
                      <select value={val('type')} onChange={setK('type')} className="ap-leads-page-94">
                        {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </> : <><SBadge s={lead.stage} map={LEAD_STAGES} /><TypeTag type={lead.type} /></>}
                </div>

                {/* Company name + value */}
                <div style={{
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "flex-start",
              gap: isMobile ? "8px" : "16px"
            }} className="ap-leads-page-95">
                  <div className="ap-leads-page-96">
                    {editMode ? <input value={val('name')} onChange={setK('name')} style={inputStyle({
                  fontSize: isMobile ? 16 : 18,
                  fontWeight: 800,
                  marginBottom: 6
                })} /> : <div style={{
                  fontSize: isMobile ? "16px" : "20px"
                }} className="ap-leads-page-97">{lead.name}</div>}
                    {editMode ? <input value={val('address')} onChange={setK('address')} placeholder="Address" style={inputStyle({
                  marginTop: 6
                })} /> : <div className="ap-leads-page-98">📍 {lead.address}</div>}
                  </div>
                  <div style={{
                textAlign: isMobile ? "left" : "right"
              }} className="ap-leads-page-99">
                    <div className="ap-leads-page-100">Potential Value</div>
                    {editMode ? <input value={val('value')} type="number" onChange={setK('value')} style={inputStyle({
                  fontSize: isMobile ? 16 : 20,
                  fontWeight: 800,
                  color: COLORS.brand,
                  fontFamily: FONTS.mono,
                  textAlign: isMobile ? 'left' : 'right',
                  width: isMobile ? '100%' : 160
                })} /> : <div style={{
                  fontSize: isMobile ? "22px" : "26px"
                }} className="ap-leads-page-101">₹{lead.value.toLocaleString()}</div>}
                  </div>
                </div>

                {/* Fields grid */}
                <div className="job-field-grid ap-leads-page-102">
                  {fieldKeys.map(key => <div key={key}>
                      <div className="ap-leads-page-103">{fieldLabels[key]}</div>
                      {editMode ? <input value={val(key)} onChange={setK(key)} style={inputStyle()} /> : <div className="ap-leads-page-104">{lead[key]}</div>}
                    </div>)}
                  <div>
                    <div className="ap-leads-page-105">Lead Score</div>
                    <ScoreBadge score={lead.score} temp={lead.temp} />
                  </div>
                  <div>
                    <div className="ap-leads-page-106">Touchpoints</div>
                    <div className="ap-leads-page-107">📞{lead.calls} · 📧{lead.emails} · 🚗{lead.visits}</div>
                  </div>
                  <div>
                    <div className="ap-leads-page-108">Created</div>
                    <div className="ap-leads-page-109">{lead.created}</div>
                  </div>
                  <div>
                    <div className="ap-leads-page-110">Last Contact</div>
                    <div className="ap-leads-page-111">{lead.lastContact}</div>
                  </div>
                </div>

                {/* Notes */}
                <div className="ap-leads-page-112">
                  <div className="ap-leads-page-113">Notes</div>
                  {editMode ? <textarea value={val('notes')} onChange={setK('notes')} className="ap-leads-page-114" /> : <textarea defaultValue={lead.notes} readOnly className="ap-leads-page-115" />}
                </div>

                {!editMode && activityAndActions}
              </div>

              {/* ── Sidebar ── */}
              <div style={{
            display: isTablet ? "grid" : "flex",
            gridTemplateColumns: isTablet ? '1fr 1fr' : undefined,
            flexDirection: isTablet ? undefined : 'column'
          }} className="ap-leads-page-116">
                {editMode ? editSidebar : sidebar}
              </div>

            </div>;
      }}
      </EditableDetailView>

      {/* ── MoveStageModal (non-won stages) ── */}
      {stageModal && <MoveStageModal lead={lead} targetStage={stageModal} onConfirm={handleStageConfirm} onClose={() => setStageModal(null)} />}

      {/* ── WonModal ── */}
      {wonModal && <WonModal lead={lead} onClose={() => setWonModal(false)} onConfirm={handleWonConfirm} />}
    </>;
};

// ─── LeadsPage ────────────────────────────────────────────────────────────────
const LeadsPage = ({
  openModal
}) => {
  const {
    isMobile,
    isTablet,
    isDesktop
  } = useBreakpoint();
  const [view, setView] = useState('table');
  const [open, setOpen] = useState(null);
  const [initialEditMode, setInitialEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [leads, setLeads] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null);
  const dragGhost = useRef(null);

  // ── Normalise backend lead → UI shape ──────────────────────────────────────
  const normaliseLead = l => ({
    ...l,
    id: l.leadId || l._id,
    value: l.value ?? 0,
    score: l.score ?? 0,
    calls: l.calls ?? 0,
    emails: l.emails ?? 0,
    visits: l.visits ?? 0,
    activities: Array.isArray(l.activities) ? l.activities : [],
    lastContact: l.lastContact ? new Date(l.lastContact).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : '—'
  });

  // ── Fetch leads from backend ───────────────────────────────────────────────
  const fetchLeads = () => {
    leadsApi.list({
      limit: 200
    }).then(r => setLeads((r.data ?? []).map(normaliseLead))).catch(() => {});
  };
  useEffect(() => {
    fetchLeads();
    window.addEventListener('focus', fetchLeads);
    return () => window.removeEventListener('focus', fetchLeads);
  }, []);
  const totalPipeline = leads.filter(l => !['won', 'lost'].includes(l.stage)).reduce((s, l) => s + (l.value || 0), 0);
  const wonValue = leads.filter(l => l.stage === 'won').reduce((s, l) => s + (l.value || 0), 0);
  const lead = open ? leads.find(l => l.id === open || l._id === open) : null;
  const handleSave = async (updated, opts = {}) => {
    // Skip backend call when the update was already handled
    // (e.g. convert-to-job already patched the lead server-side)
    if (opts.skipBackend) {
      setLeads(prev => prev.map(l => l.id === updated.id || l._id === updated._id ? {
        ...l,
        ...updated
      } : l));
      return;
    }
    try {
      const mongoId = leads.find(l => l.id === (updated.id || open))?._id || updated._id;
      const doc = await leadsApi.update(mongoId, updated);
      setLeads(prev => prev.map(l => l._id === doc._id ? normaliseLead(doc) : l));
    } catch {
      setLeads(prev => prev.map(l => l.id === updated.id ? {
        ...l,
        ...updated
      } : l));
    }
  };
  const handleDelete = async id => {
    try {
      const mongoId = leads.find(l => l.id === id || l._id === id)?._id || id;
      await leadsApi.remove(mongoId);
    } catch {/* optimistic */}
    setLeads(prev => prev.filter(l => l.id !== id && l._id !== id));
    setOpen(null);
  };
  const handleBack = () => {
    setOpen(null);
    setInitialEditMode(false);
  };
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchedLeads
  } = useTableSearch(leads, ['id', 'name', 'contact', 'phone', 'email', 'address', 'type', 'source', 'stage', 'assignedTo', 'notes'], {
    type: '',
    stage: ''
  });
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
  } = usePagination(searchedLeads, 10);
  const {
    exportProps
  } = useExport({
    title: 'Leads & CRM',
    filename: 'cooltech-leads',
    template: 'generic_list',
    subtitle: `AC Services Platform · Leads · ${searchedLeads.length} records`,
    docId: 'LD-EXPORT',
    columns: LEAD_COLUMNS,
    rows: searchedLeads,
    summaryPills: [{
      label: 'Total Leads',
      value: searchedLeads.length
    }, {
      label: 'Won',
      value: searchedLeads.filter(l => l.stage === 'won').length
    }, {
      label: 'Pipeline',
      value: `₹${searchedLeads.filter(l => !['won', 'lost'].includes(l.stage)).reduce((s, l) => s + l.value, 0).toLocaleString()}`
    }, {
      label: 'Total Value',
      value: `₹${searchedLeads.reduce((s, l) => s + l.value, 0).toLocaleString()}`
    }],
    showTotals: true,
    totalColumns: ['value']
  });

  // ── Kanban drag handlers ──────────────────────────────────────────────────
  const handleDragStart = (e, leadId) => {
    setDraggingId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
    const el = e.currentTarget,
      rect = el.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    ghost.style.cssText = `position:fixed;top:-1000px;left:-1000px;width:${rect.width}px;opacity:.85;transform:rotate(2deg) scale(1.02);box-shadow:0 12px 32px rgba(0,0,0,.18);border-radius:10px;pointer-events:none;z-index:9999;`;
    document.body.appendChild(ghost);
    dragGhost.current = ghost;
    e.dataTransfer.setDragImage(ghost, rect.width / 2, 30);
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
    setDropIndicator(null);
    if (dragGhost.current) {
      document.body.removeChild(dragGhost.current);
      dragGhost.current = null;
    }
  };
  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      setLeads(prev => prev.map(l => l.id === id ? {
        ...l,
        stage: targetStage
      } : l));
      const mongoId = leads.find(l => l.id === id)?._id;
      if (mongoId) leadsApi.update(mongoId, {
        stage: targetStage
      }).catch(() => {});
    }
    setDraggingId(null);
    setDragOverCol(null);
    setDropIndicator(null);
  };

  // ── Detail view ───────────────────────────────────────────────────────────
  if (lead) {
    return <LeadDetail lead={lead} onBack={handleBack} onSave={handleSave} onDelete={handleDelete} openModal={openModal} initialEditMode={initialEditMode} />;
  }

  // ── List / Kanban view ────────────────────────────────────────────────────
  return <div className="fi ap-leads-page-117">

      {/* ── Header ── */}
      <div className="ap-leads-page-118">
        <SectionHdr title="Leads & CRM" sub={`${total} of ${leads.length} leads`} />
        <div className="ap-leads-page-119">
          {/* View toggle */}
          <div className="ap-leads-page-120">
            {[['table', 'Table'], ['kanban', 'Kanban']].map(([k, l]) => <button key={k} onClick={() => setView(k)} style={{
            padding: isMobile ? "5px 10px" : "5px 14px",
            background: view === k ? "var(--white)" : "transparent",
            color: view === k ? "var(--text-h1)" : "var(--text-muted)",
            border: `1px solid ${view === k ? COLORS.border : 'transparent'}`
          }} className="ap-leads-page-121">
                {l}
              </button>)}
          </div>
          <button className="btn ap-leads-page-122" style={{
          padding: isMobile ? "8px 14px" : "9px 22px"
        }} onClick={() => openModal('new_lead')}>
            + New Lead
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="quot-kpi-grid">
        <KCard label="Pipeline Value" value={`₹${(totalPipeline / 1000).toFixed(0)}K`} sub="active leads" icon="🎯" iconBg="#FFF7ED" color="#EA580C" delay="" />
        <KCard label="Won This Month" value={`₹${(wonValue / 1000).toFixed(0)}K`} sub={`${leads.filter(l => l.stage === 'won').length} closed`} icon="🏆" iconBg="#F0FDF4" color="#16A34A" delay="1" />
        <KCard label="Open Leads" value={leads.filter(l => !['won', 'lost'].includes(l.stage)).length} sub="in progress" icon="📊" iconBg="#EFF6FF" color="#0369A1" delay="2" />
        <KCard label="Conversion" value="42%" sub="to customer" icon="📈" iconBg="#F5F3FF" color="#7C3AED" delay="3" />
      </div>

      {/* ── Kanban ── */}
      {view === 'kanban' ? <div className="ap-leads-page-123">
          <div style={{
        minWidth: isMobile ? "900px" : "auto"
      }} className="ap-leads-page-124">
            {stageOrder.map(stage => {
          const m = LEAD_STAGES[stage],
            sl = leads.filter(l => l.stage === stage),
            isOver = dragOverCol === stage;
          return <div key={stage} onDragOver={e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverCol(stage);
          }} onDrop={e => handleDrop(e, stage)} style={{
            minWidth: isMobile ? "160px" : "200px",
            background: isOver ? m.bg : '#F9FAFB',
            border: `2px ${isOver ? 'dashed' : 'solid'} ${isOver ? m.color : COLORS.border}`
          }} className="ap-leads-page-125">
                  <div className="ap-leads-page-126">
                    <span style={{
                color: m.color
              }} className="ap-leads-page-127">{m.label}</span>
                    <span style={{
                background: m.bg,
                color: m.color
              }} className="ap-leads-page-128">{sl.length}</span>
                  </div>
                  {sl.length === 0 && isOver && <div style={{
              border: `2px dashed ${m.color}60`
            }} className="ap-leads-page-129">
                      <span style={{
                color: m.color
              }} className="ap-leads-page-130">Drop here</span>
                    </div>}
                  {sl.map((l, idx) => {
              const isDragging = draggingId === l.id;
              return <div key={l.id}>
                        {isOver && dropIndicator?.col === stage && dropIndicator?.index === idx && !isDragging && <div style={{
                  background: m.color
                }} className="ap-leads-page-131" />}
                        <div draggable onDragStart={e => handleDragStart(e, l.id)} onDragEnd={handleDragEnd} onDragOver={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropIndicator({
                    col: stage,
                    index: idx
                  });
                }} onClick={() => !isDragging && setOpen(l.id)} className="card ap-leads-page-132" style={{
                  cursor: isDragging ? "grabbing" : "grab",
                  boxShadow: isDragging ? "none" : "0 1px 3px rgba(0,0,0,.05)",
                  opacity: isDragging ? "0.3" : "1",
                  transform: isDragging ? "scale(0.97)" : "scale(1)"
                }}>
                          <div className="ap-leads-page-133">
                            <div className="ap-leads-page-134">{l.name}</div>
                            <div className="ap-leads-page-135">⠿</div>
                          </div>
                          <div className="ap-leads-page-136">{l.contact} · {l.units}u</div>
                          <div className="ap-leads-page-137">
                            <span className="ap-leads-page-138">₹{(l.value ?? 0).toLocaleString()}</span>
                            <span className="ap-leads-page-139">{l.source}</span>
                          </div>
                        </div>
                      </div>;
            })}
                  {isOver && dropIndicator?.col === stage && dropIndicator?.index === sl.length && sl.length > 0 && <div style={{
              background: m.color
            }} className="ap-leads-page-140" />}
                  {sl.length === 0 && !isOver && <div className="ap-leads-page-141">Empty</div>}
                </div>;
        })}
          </div>
        </div> : (/* ── Table ── */
    <div className="ap-leads-page-142">
          <div className="ap-leads-page-143">

            {/* Search + filters */}
            <div className="ap-leads-page-144">
              <div style={{
            flex: isMobile ? "0 0 100%" : "1 1 180px",
            minWidth: isMobile ? "100%" : "140px"
          }}>
                <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, contact, phone, source…" />
              </div>
              <FilterSelect value={activeFilters.type} onChange={val => setFilter('type', val)} options={TYPE_OPTIONS} allLabel="All Types" />
              <FilterSelect value={activeFilters.stage} onChange={val => setFilter('stage', val)} options={stageOrder} allLabel="All Stages" />
              <div style={{
            marginLeft: isMobile ? "0" : "auto",
            width: isMobile ? "100%" : "auto"
          }}>
                <ExportDropdown {...exportProps} />
              </div>
            </div>

            {/* Table */}
            <div className="ap-leads-page-145">
              <table className="ap-leads-page-146">
                <Thead cols={['ID', 'Company', 'Contact', 'Type', 'Units', 'Source', 'Value', 'Score', 'Assigned', 'Stage', 'Last Contact', '']} />
                <tbody>
                  {paginated.map((l, i) => <tr key={l.id} className="row ap-leads-page-147" onClick={() => {
                setInitialEditMode(false);
                setOpen(l.id);
              }} style={{
                background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
              }}>
                      <td className="ap-leads-page-148">
                        <span className="ap-leads-page-149">{l.id}</span>
                      </td>
                      <td className="ap-leads-page-150">
                        <div className="ap-leads-page-151">{l.name}</div>
                        <div className="ap-leads-page-152">{(l.address || '').split(',')[0]}</div>
                      </td>
                      <td className="ap-leads-page-153">
                        <div className="ap-leads-page-154">{l.contact}</div>
                        <div className="ap-leads-page-155">{l.phone}</div>
                      </td>
                      <td className="ap-leads-page-156"><TypeTag type={l.type} /></td>
                      <td className="ap-leads-page-157">
                        <span className="ap-leads-page-158">{l.units}</span>
                      </td>
                      <td className="ap-leads-page-159">{l.source}</td>
                      <td className="ap-leads-page-160">
                        <span className="ap-leads-page-161">₹{(l.value ?? 0).toLocaleString()}</span>
                      </td>
                      <td className="ap-leads-page-162"><ScoreBadge score={l.score} temp={l.temp} /></td>
                      <td className="ap-leads-page-163">{l.assignedTo}</td>
                      <td className="ap-leads-page-164"><SBadge s={l.stage} map={LEAD_STAGES} /></td>
                      <td className="ap-leads-page-165">{l.lastContact}</td>
                      <td onClick={e => e.stopPropagation()} className="ap-leads-page-166">
                        <ActionDropdown onView={() => {
                    setInitialEditMode(false);
                    setOpen(l.id);
                  }} onEdit={() => {
                    setInitialEditMode(true);
                    setOpen(l.id);
                  }} onDelete={() => setDeleteTarget(l.id)} />
                      </td>
                    </tr>)}
                  {paginated.length === 0 && <tr>
                      <td colSpan={12} className="ap-leads-page-167">
                        No leads match your search.
                      </td>
                    </tr>}
                </tbody>
              </table>
            </div>

            <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
          </div>
        </div>)}

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => {
      handleDelete(deleteTarget);
      setDeleteTarget(null);
    }} onCancel={() => setDeleteTarget(null)} message="This lead will be removed permanently." />
    </div>;
};
export default LeadsPage;