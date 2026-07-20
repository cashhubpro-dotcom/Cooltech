import { useState } from 'react';
import { COLORS } from '../../constants/tokens';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import ActionDropdown from '../../components/ui/ActionDropdown';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import EditableDetailView from '../../components/ui/EditableDetailView';
import PDFPreview from '../../components/layout/PDFPreview';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { useAdCampaigns } from '../../hooks/useAdCampaigns';

// ─── Channel meta ──────────────────────────────────────────────────────────────
const CHANNEL_META = {
  facebook: {
    emoji: '📘',
    label: 'fb',
    color: "var(--brand-facebook)"
  },
  instagram: {
    emoji: '📸',
    label: 'ig',
    color: "var(--brand-instagram)"
  },
  twitter: {
    emoji: '🐦',
    label: 'tw',
    color: "var(--brand-twitter)"
  },
  linkedin: {
    emoji: '💼',
    label: 'li',
    color: "var(--brand-linkedin)"
  },
  youtube: {
    emoji: '▶️',
    label: 'yt',
    color: "var(--xff0000)"
  },
  google: {
    emoji: '⭐',
    label: 'gm',
    color: "var(--brand-google-yellow)"
  },
  whatsapp: {
    emoji: '💬',
    label: 'wa',
    color: "var(--brand-whatsapp)"
  }
};
const SM_CHANNELS = Object.entries(CHANNEL_META).map(([id, m]) => ({
  id,
  name: id.charAt(0).toUpperCase() + id.slice(1),
  connected: true,
  ...m
}));

// ─── Export columns ────────────────────────────────────────────────────────────
const CAMPAIGN_COLUMNS = [{
  label: 'Campaign Name',
  key: 'name',
  width: 28,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Goal',
  key: 'goal',
  width: 12,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Status',
  key: 'status',
  width: 10,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Budget (₹)',
  key: 'budget',
  width: 12,
  format: v => v,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Spent (₹)',
  key: 'spent',
  width: 12,
  format: v => v,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700
  }
}, {
  label: 'Impressions',
  key: 'impressions',
  width: 12,
  format: v => v,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Leads',
  key: 'leads',
  width: 8,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700
  }
}, {
  label: 'Conversions',
  key: 'conversions',
  width: 10,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Revenue (₹)',
  key: 'revenue',
  width: 12,
  format: v => v,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 800
  }
}, {
  label: 'Start Date',
  key: 'startDate',
  width: 11,
  tdStyle: {
    fontSize: 11
  }
}, {
  label: 'End Date',
  key: 'endDate',
  width: 11,
  tdStyle: {
    fontSize: 11
  }
}];

// ─── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  fontSize: 13,
  boxSizing: 'border-box',
  outline: 'none'
};
const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: COLORS.muted,
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: .4,
  display: 'block'
};
const modalOverlay = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,.5)',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
const modalBox = {
  background: COLORS.white,
  borderRadius: 16,
  padding: 28,
  width: 'min(440px, calc(100vw - 32px))',
  boxShadow: '0 20px 60px rgba(0,0,0,.25)'
};

// ─── ChannelIcon ───────────────────────────────────────────────────────────────
const ChannelIcon = ({
  id,
  size = 28
}) => {
  const meta = CHANNEL_META[id] || {
    emoji: '🌐',
    color: '#94A3B8'
  };
  return <div style={{
    width: size,
    height: size,
    background: meta.color + '22',
    fontSize: size * 0.5
  }} className="ap-campaign-page-1">
      {meta.emoji}
    </div>;
};

// ─── ChannelChips ──────────────────────────────────────────────────────────────
const ChannelChips = ({
  channels = []
}) => <div className="ap-campaign-page-2">
    {channels.map(ch => {
    const meta = CHANNEL_META[ch] || {
      emoji: '🌐',
      color: '#94A3B8',
      label: ch
    };
    return <span key={ch} style={{
      background: meta.color + '18',
      color: meta.color
    }} className="ap-campaign-page-3">
          {meta.emoji} {meta.label}
        </span>;
  })}
  </div>;

// ─── Loading skeleton ──────────────────────────────────────────────────────────
const SkeletonRow = () => <tr>
    {Array.from({
    length: 12
  }).map((_, i) => <td key={i} className="ap-campaign-page-4">
        <div className="ap-campaign-page-5" />
      </td>)}
  </tr>;

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PauseCampaignModal ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const PauseCampaignModal = ({
  camp,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
      onClose();
    } catch (e) {
      alert('Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  return <div onClick={onClose} className="ap-campaign-page-6">
      <div onClick={e => e.stopPropagation()} className="ap-campaign-page-7">
        <div className="ap-campaign-page-8">
          <div className="ap-campaign-page-9">⏸ Pause Campaign</div>
          <button onClick={onClose} className="ap-campaign-page-10">✕</button>
        </div>

        <div className="ap-campaign-page-11">
          <div className="ap-campaign-page-12">⚠ Pausing: {camp.name}</div>
          <div className="ap-campaign-page-13">All ad delivery will stop immediately. You can resume anytime.</div>
        </div>

        <div className="ap-campaign-page-14">
          <label className="ap-campaign-page-15">Reason for pausing (optional)</label>
          <select value={reason} onChange={e => setReason(e.target.value)} className="ap-campaign-page-16">
            <option value=''>Select a reason…</option>
            <option value='Budget exhausted'>Budget exhausted</option>
            <option value='Poor performance'>Poor performance</option>
            <option value='Seasonal pause'>Seasonal pause</option>
            <option value='Creative refresh needed'>Creative refresh needed</option>
            <option value='Manual review required'>Manual review required</option>
            <option value='Other'>Other</option>
          </select>
        </div>

        <div className="ap-campaign-page-17">
          <button onClick={handle} disabled={loading} style={{
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? "0.7" : "1"
        }} className="ap-campaign-page-18">
            {loading ? 'Pausing…' : '⏸ Confirm Pause'}
          </button>
          <button onClick={onClose} className="ap-campaign-page-19">
            Cancel
          </button>
        </div>
      </div>
    </div>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── EditBudgetModal ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const EditBudgetModal = ({
  camp,
  onClose,
  onConfirm
}) => {
  const [newBudget, setNewBudget] = useState(camp.budget || '');
  const [loading, setLoading] = useState(false);
  const spent = camp.spent || 0;
  const remaining = newBudget - spent;
  const handle = async () => {
    if (!newBudget || Number(newBudget) <= 0) return alert('Enter a valid budget');
    if (Number(newBudget) < spent) return alert(`Budget cannot be less than amount already spent (₹${spent.toLocaleString()})`);
    setLoading(true);
    try {
      await onConfirm(Number(newBudget));
      onClose();
    } catch (e) {
      alert('Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  return <div onClick={onClose} className="ap-campaign-page-6">
      <div onClick={e => e.stopPropagation()} className="ap-campaign-page-7">
        <div className="ap-campaign-page-20">
          <div className="ap-campaign-page-21">✏ Edit Budget</div>
          <button onClick={onClose} className="ap-campaign-page-22">✕</button>
        </div>

        {/* Current budget summary */}
        <div className="ap-campaign-page-23">
          {[['Current Budget', `₹${(camp.budget || 0).toLocaleString()}`, '#64748B'], ['Already Spent', `₹${spent.toLocaleString()}`, '#EA580C'], ['Remaining', `₹${(camp.budget - spent).toLocaleString()}`, '#16A34A']].map(([label, val, color]) => <div key={label} className="ap-campaign-page-24">
              <div className="ap-campaign-page-25">{label}</div>
              <div style={{
            color
          }} className="ap-campaign-page-26">{val}</div>
            </div>)}
        </div>

        <div className="ap-campaign-page-27">
          <label className="ap-campaign-page-15">New Total Budget (₹)</label>
          <input type='number' value={newBudget} onChange={e => setNewBudget(e.target.value)} placeholder={`Min ₹${spent.toLocaleString()} (already spent)`} min={spent} className="ap-campaign-page-28" />
        </div>

        {/* Live preview */}
        {newBudget > 0 && <div style={{
        background: remaining >= 0 ? "var(--success-bg)" : "var(--danger-bg)",
        border: `1px solid ${remaining >= 0 ? '#BBF7D0' : '#FECACA'}`
      }} className="ap-campaign-page-29">
            {remaining >= 0 ? <span className="ap-campaign-page-30">✓ ₹{remaining.toLocaleString()} will remain after current spend</span> : <span className="ap-campaign-page-31">✗ Budget too low — already spent ₹{spent.toLocaleString()}</span>}
          </div>}

        <div className="ap-campaign-page-32">
          <button onClick={handle} disabled={loading} style={{
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? "0.7" : "1"
        }} className="ap-campaign-page-33">
            {loading ? 'Saving…' : '💾 Update Budget'}
          </button>
          <button onClick={onClose} className="ap-campaign-page-34">
            Cancel
          </button>
        </div>
      </div>
    </div>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DuplicateCampaignModal ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const DuplicateCampaignModal = ({
  camp,
  onClose,
  onConfirm
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    name: `${camp.name} (Copy)`,
    startDate: today,
    endDate: '',
    budget: camp.budget || '',
    resetStats: true
  });
  const [loading, setLoading] = useState(false);
  const setF = key => e => setForm(p => ({
    ...p,
    [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }));
  const handle = async () => {
    if (!form.name.trim()) return alert('Campaign name is required');
    setLoading(true);
    try {
      await onConfirm(form);
      onClose();
    } catch (e) {
      alert('Failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  return <div onClick={onClose} className="ap-campaign-page-6">
      <div onClick={e => e.stopPropagation()} className="ap-campaign-page-35">
        <div className="ap-campaign-page-36">
          <div className="ap-campaign-page-37">🔄 Duplicate Campaign</div>
          <button onClick={onClose} className="ap-campaign-page-38">✕</button>
        </div>

        {/* Source badge */}
        <div className="ap-campaign-page-39">
          <span className="ap-campaign-page-40">Duplicating: </span>
          <span className="ap-campaign-page-41">{camp.name}</span>
          <span className="ap-campaign-page-42">{camp.goal}</span>
        </div>

        <div className="ap-campaign-page-43">
          <label className="ap-campaign-page-15">New Campaign Name</label>
          <input value={form.name} onChange={setF('name')} className="ap-campaign-page-28" />
        </div>

        <div className="ap-campaign-page-44">
          <div>
            <label className="ap-campaign-page-15">Start Date</label>
            <input type='date' value={form.startDate} onChange={setF('startDate')} className="ap-campaign-page-28" />
          </div>
          <div>
            <label className="ap-campaign-page-15">End Date</label>
            <input type='date' value={form.endDate} onChange={setF('endDate')} className="ap-campaign-page-28" />
          </div>
        </div>

        <div className="ap-campaign-page-45">
          <label className="ap-campaign-page-15">Budget (₹)</label>
          <input type='number' value={form.budget} onChange={setF('budget')} placeholder='Same as original if blank' className="ap-campaign-page-28" />
        </div>

        {/* Reset stats toggle */}
        <label className="ap-campaign-page-46">
          <input type='checkbox' checked={form.resetStats} onChange={setF('resetStats')} className="ap-campaign-page-47" />
          <span>Start with fresh stats (impressions, leads, spend reset to 0)</span>
        </label>

        <div className="ap-campaign-page-48">
          <button onClick={handle} disabled={loading} style={{
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? "0.7" : "1"
        }} className="ap-campaign-page-49">
            {loading ? 'Duplicating…' : '🔄 Create Duplicate'}
          </button>
          <button onClick={onClose} className="ap-campaign-page-50">
            Cancel
          </button>
        </div>
      </div>
    </div>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── NewCampaignModal ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const NewCampaignModal = ({
  onClose,
  onSave
}) => {
  const [selChannels, setSelChannels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    goal: 'Leads',
    budget: '',
    startDate: '',
    endDate: ''
  });
  const toggle = id => setSelChannels(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const setF = key => e => setForm(p => ({
    ...p,
    [key]: e.target.value
  }));
  const handleLaunch = async () => {
    if (!form.name.trim()) return alert('Campaign name is required');
    setSaving(true);
    try {
      await onSave({
        ...form,
        budget: Number(form.budget) || 0,
        channels: selChannels,
        spent: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        leads: 0,
        conversions: 0,
        revenue: 0,
        status: 'active'
      });
      onClose();
    } catch (err) {
      alert('Failed to create campaign: ' + err.message);
    } finally {
      setSaving(false);
    }
  };
  return <div onClick={onClose} className="ap-campaign-page-6">
      <div onClick={e => e.stopPropagation()} className="ap-campaign-page-51">
        <div className="ap-campaign-page-52">
          <div className="ap-campaign-page-53">Create New Campaign</div>
          <button onClick={onClose} className="ap-campaign-page-54">✕</button>
        </div>
        <div className="ap-campaign-page-55">
          <label className="ap-campaign-page-15">Campaign Name</label>
          <input value={form.name} onChange={setF('name')} placeholder='e.g. Summer AC Service Drive 2026' className="ap-campaign-page-28" />
        </div>
        <div className="ap-campaign-page-56">
          <div>
            <label className="ap-campaign-page-15">Goal</label>
            <select value={form.goal} onChange={setF('goal')} className="ap-campaign-page-57">
              {['Leads', 'Bookings', 'Calls', 'AMC Sign-ups', 'Brand Awareness', 'Followers'].map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="ap-campaign-page-15">Budget (₹)</label>
            <input type='number' value={form.budget} onChange={setF('budget')} placeholder='e.g. 15000' className="ap-campaign-page-28" />
          </div>
        </div>
        <div className="ap-campaign-page-58">
          <div>
            <label className="ap-campaign-page-15">Start Date</label>
            <input type='date' value={form.startDate} onChange={setF('startDate')} className="ap-campaign-page-28" />
          </div>
          <div>
            <label className="ap-campaign-page-15">End Date</label>
            <input type='date' value={form.endDate} onChange={setF('endDate')} className="ap-campaign-page-28" />
          </div>
        </div>
        <div className="ap-campaign-page-59">
          <label className="ap-campaign-page-15">Channels</label>
          <div className="ap-campaign-page-60">
            {SM_CHANNELS.map(ch => {
            const selected = selChannels.includes(ch.id);
            return <button key={ch.id} onClick={() => toggle(ch.id)} style={{
              border: `1.5px solid ${selected ? ch.color : '#E5E7EB'}`,
              background: selected ? ch.color + '18' : COLORS.bg
            }} className="ap-campaign-page-61">
                  <span className="ap-campaign-page-62">{ch.emoji}</span>
                  <span style={{
                color: selected ? ch.color : COLORS.body
              }} className="ap-campaign-page-63">{ch.name}</span>
                </button>;
          })}
          </div>
        </div>
        <div className="ap-campaign-page-64">
          <button onClick={handleLaunch} disabled={saving} style={{
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? "0.7" : "1"
        }} className="ap-campaign-page-65">
            {saving ? 'Launching…' : '🚀 Launch Campaign'}
          </button>
          <button onClick={onClose} className="ap-campaign-page-66">Cancel</button>
        </div>
      </div>
    </div>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CampaignDetail ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const CampaignDetail = ({
  camp,
  onBack,
  onSave,
  onDelete,
  initialEditMode,
  onUpdate
}) => {
  const [showPDF, setShowPDF] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const fields = [{
    key: 'name'
  }, {
    key: 'goal'
  }, {
    key: 'status'
  }, {
    key: 'startDate'
  }, {
    key: 'endDate'
  }, {
    key: 'budget'
  }, {
    key: 'spent'
  }, {
    key: 'revenue'
  }, {
    key: 'leads'
  }, {
    key: 'conversions'
  }, {
    key: 'impressions'
  }, {
    key: 'reach'
  }, {
    key: 'clicks'
  }];
  const roas = camp.spent > 0 ? (camp.revenue / camp.spent).toFixed(1) : '—';
  const cpl = camp.leads > 0 ? (camp.spent / camp.leads).toFixed(0) : 0;
  const convRate = camp.leads > 0 ? (camp.conversions / camp.leads * 100).toFixed(0) : 0;

  // ── Action handlers ──────────────────────────────────────────────────────────
  const handlePause = async reason => {
    await onUpdate(camp.id, {
      status: 'paused',
      pauseReason: reason
    });
  };
  const handleBudget = async newBudget => {
    await onUpdate(camp.id, {
      budget: newBudget
    });
  };
  const handleDuplicate = async form => {
    const payload = {
      name: form.name,
      goal: camp.goal,
      status: 'active',
      channels: camp.channels,
      budget: form.budget ? Number(form.budget) : camp.budget,
      startDate: form.startDate,
      endDate: form.endDate,
      // stats
      spent: form.resetStats ? 0 : camp.spent,
      impressions: form.resetStats ? 0 : camp.impressions,
      reach: form.resetStats ? 0 : camp.reach,
      clicks: form.resetStats ? 0 : camp.clicks,
      leads: form.resetStats ? 0 : camp.leads,
      conversions: form.resetStats ? 0 : camp.conversions,
      revenue: form.resetStats ? 0 : camp.revenue
    };
    await onUpdate('__duplicate__', payload); // signal to parent
    onBack();
  };
  return <>
      <EditableDetailView id={camp.displayId || camp.id} breadcrumb='Campaigns' onBack={onBack} fields={fields} data={camp} initialEditMode={initialEditMode} onSave={onSave} onDelete={() => onDelete(camp.id)}>
        {({
        editMode,
        editData,
        setEditData
      }) => {
        const val = key => editData[key] ?? camp[key] ?? '';
        const setK = key => e => setEditData(p => ({
          ...p,
          [key]: e.target.value
        }));
        return <div className="ap-campaign-page-67">

              {/* ── Main card ── */}
              <div className="ap-campaign-page-68">

                <div className="ap-campaign-page-69">
                  <div>
                    <div className="ap-campaign-page-70">
                      {editMode ? <select value={val('status')} onChange={setK('status')} className="ap-campaign-page-71">
                          {['active', 'paused', 'completed'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select> : <span style={{
                    background: camp.status === 'active' ? "var(--success-bg)" : "var(--bg)",
                    color: camp.status === 'active' ? "var(--success-text)" : "var(--text-muted)"
                  }} className="ap-campaign-page-72">● {camp.status}</span>}
                      {editMode ? <input value={val('goal')} onChange={setK('goal')} className="ap-campaign-page-73" /> : <span className="ap-campaign-page-74">{camp.goal}</span>}
                    </div>
                    {editMode ? <input value={val('name')} onChange={setK('name')} className="ap-campaign-page-75" /> : <div className="ap-campaign-page-76">{camp.name}</div>}
                    <div className="ap-campaign-page-77">
                      {editMode ? <>
                          <input value={val('startDate')} onChange={setK('startDate')} className="ap-campaign-page-78" />
                          <span className="ap-campaign-page-79">–</span>
                          <input value={val('endDate')} onChange={setK('endDate')} className="ap-campaign-page-80" />
                        </> : <div className="ap-campaign-page-81">{camp.startDate} – {camp.endDate}</div>}
                    </div>
                  </div>
                  <ChannelChips channels={camp.channels} />
                </div>

                {/* KPI tiles */}
                <div className="ap-campaign-page-82">
                  {[['ROAS', roas === '—' ? '—' : roas + 'x', 'Revenue per ₹1 spent', '#16A34A'], ['CPL', '₹' + cpl, 'Cost per lead', '#0369A1'], ['Conv. Rate', convRate + '%', 'Leads → Customers', '#7C3AED'], ['Leads', camp.leads, 'Generated', '#EA580C']].map(([k, v, sub, c]) => <div key={k} className="ap-campaign-page-83">
                      <div className="ap-campaign-page-84">{k}</div>
                      <div style={{
                  color: c
                }} className="ap-campaign-page-85">{v}</div>
                      <div className="ap-campaign-page-86">{sub}</div>
                    </div>)}
                </div>

                {/* Stat rows */}
                <div className="ap-campaign-page-87">
                  {[['Impressions', 'impressions'], ['Reach', 'reach'], ['Clicks', 'clicks'], ['Conversions', 'conversions']].map(([label, key]) => <div key={key} className="ap-campaign-page-88">
                      <span className="ap-campaign-page-89">{label}</span>
                      {editMode ? <input value={val(key)} onChange={setK(key)} className="ap-campaign-page-90" /> : <span className="ap-campaign-page-91">{Number(val(key)).toLocaleString()}</span>}
                    </div>)}
                </div>

                {/* Budget bar */}
                <div className="ap-campaign-page-92">
                  <div className="ap-campaign-page-93">
                    <span className="ap-campaign-page-94">Budget Utilisation</span>
                    <div className="ap-campaign-page-95">
                      {editMode ? <>
                          <input value={val('spent')} onChange={setK('spent')} className="ap-campaign-page-96" />
                          <span className="ap-campaign-page-97">/</span>
                          <input value={val('budget')} onChange={setK('budget')} className="ap-campaign-page-98" />
                        </> : <span className="ap-campaign-page-99">₹{(camp.spent || 0).toLocaleString()} / ₹{(camp.budget || 0).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="ap-campaign-page-100">
                    <div style={{
                  width: `${Math.min((camp.spent || 0) / (camp.budget || 1) * 100, 100)}%`
                }} className="ap-campaign-page-101" />
                  </div>
                  <div className="ap-campaign-page-102">
                    <span>{((camp.spent || 0) / (camp.budget || 1) * 100).toFixed(0)}% used</span>
                    <span>₹{((camp.budget || 0) - (camp.spent || 0)).toLocaleString()} remaining</span>
                  </div>
                </div>

                {/* Revenue */}
                <div className="ap-campaign-page-103">
                  <div className="ap-campaign-page-104">Revenue Generated</div>
                  {editMode ? <input value={val('revenue')} onChange={setK('revenue')} className="ap-campaign-page-105" /> : <div className="ap-campaign-page-106">₹{(camp.revenue || 0).toLocaleString()}</div>}
                  {roas !== '—' && <div className="ap-campaign-page-107">ROAS: {roas}x return on ad spend</div>}
                </div>
              </div>

              {/* ── Sidebar ── */}
              <div className="ap-campaign-page-108">
                <div className="ap-campaign-page-109">
                  <div className="ap-campaign-page-110">Campaign Actions</div>

                  {camp.status === 'active' ? <>
                      {/* ── Pause ── */}
                      <button className="btn ap-campaign-page-111" onClick={() => setShowPause(true)}>
                        ⏸ Pause Campaign
                      </button>
                      {/* ── Edit Budget ── */}
                      <button className="btn ap-campaign-page-112" onClick={() => setShowBudget(true)}>
                        ✏ Edit Budget
                      </button>
                      {/* ── Export ── */}
                      <button className="btn ap-campaign-page-113" onClick={() => setShowPDF(true)}>
                        📊 Export Report
                      </button>
                    </> : <>
                      {/* ── Duplicate ── */}
                      <button className="btn ap-campaign-page-114" onClick={() => setShowDuplicate(true)}>
                        🔄 Duplicate Campaign
                      </button>
                      {/* ── Export ── */}
                      <button className="btn ap-campaign-page-115" onClick={() => setShowPDF(true)}>
                        📊 Export Report
                      </button>
                    </>}
                </div>

                {/* Channels sidebar */}
                <div className="ap-campaign-page-116">
                  <div className="ap-campaign-page-117">Channels</div>
                  {(camp.channels || []).map(ch => {
                const meta = CHANNEL_META[ch];
                return meta ? <div key={ch} className="ap-campaign-page-118">
                        <ChannelIcon id={ch} size={24} />
                        <span className="ap-campaign-page-119">{ch}</span>
                      </div> : null;
              })}
                </div>
              </div>
            </div>;
      }}
      </EditableDetailView>

      {/* ── Modals ── */}
      {showPause && <PauseCampaignModal camp={camp} onClose={() => setShowPause(false)} onConfirm={handlePause} />}
      {showBudget && <EditBudgetModal camp={camp} onClose={() => setShowBudget(false)} onConfirm={handleBudget} />}
      {showDuplicate && <DuplicateCampaignModal camp={camp} onClose={() => setShowDuplicate(false)} onConfirm={handleDuplicate} />}

      <PDFPreview open={showPDF} onClose={() => setShowPDF(false)} title={`${camp.name} Report`} filename={`campaign-report-${camp.displayId || camp.id}`} template='campaign_report' data={camp} />
    </>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CampaignPage ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const CampaignPage = () => {
  const {
    campaigns,
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign
  } = useAdCampaigns();
  const [open, setOpen] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [initialEdit, setInitialEdit] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const camp = open ? campaigns.find(c => c.id === open) : null;
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: filteredCampaigns
  } = useTableSearch(campaigns, ['id', 'name', 'goal', 'status'], {
    status: '',
    goal: ''
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
  } = usePagination(filteredCampaigns, 10);
  const {
    exportProps
  } = useExport({
    title: 'Campaign Manager',
    filename: 'cooltech-campaigns',
    template: 'generic_list',
    subtitle: `AC Services Platform · Campaigns · ${filteredCampaigns.length} records`,
    docId: 'CAMP-EXPORT',
    columns: CAMPAIGN_COLUMNS,
    rows: filteredCampaigns,
    showTotals: true,
    totalColumns: ['budget', 'spent', 'impressions', 'leads', 'conversions', 'revenue']
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSave = async updated => {
    await updateCampaign(updated.id, updated);
    setOpen(null);
    setInitialEdit(false);
  };
  const handleDelete = async id => {
    await deleteCampaign(id);
    setOpen(null);
  };
  const handleBack = () => {
    setOpen(null);
    setInitialEdit(false);
  };

  // Handles both patch-update (pause/budget) and duplicate (creates new)
  const handleUpdate = async (id, payload) => {
    if (id === '__duplicate__') {
      await createCampaign(payload);
    } else {
      await updateCampaign(id, payload);
      // Refresh the open camp so UI reflects change instantly
      setOpen(prev => prev); // triggers re-find from updated campaigns array
    }
  };

  // ── Detail view ───────────────────────────────────────────────────────────────
  if (camp) {
    return <CampaignDetail camp={camp} onBack={handleBack} onSave={handleSave} onDelete={handleDelete} initialEditMode={initialEdit} onUpdate={handleUpdate} />;
  }
  const totalRevenue = campaigns.reduce((s, c) => s + (c.revenue || 0), 0);
  const totalSpend = campaigns.reduce((s, c) => s + (c.spent || 0), 0);
  const totalLeads = campaigns.reduce((s, c) => s + (c.leads || 0), 0);
  return <div className="fi ap-campaign-page-120">

      {/* Header */}
      <div className="ap-campaign-page-121">
        <SectionHdr title='Campaign Manager' sub={`${total} of ${campaigns.length} campaigns · ₹${(totalRevenue / 100000).toFixed(1)}L revenue`} />
        <button onClick={() => setShowCompose(true)} className="ap-campaign-page-122">
          + New Campaign
        </button>
      </div>

      {error && <div className="ap-campaign-page-123">
          ⚠ Could not load campaigns: {error}
        </div>}

      {/* KPI cards */}
      <div className="ap-campaign-page-124">
        <KCard label='Total Revenue' value={loading ? '…' : `₹${(totalRevenue / 100000).toFixed(1)}L`} sub='from campaigns' icon='💰' iconBg='#FEFCE8' color='#CA8A04' delay='' />
        <KCard label='Ad Spend' value={loading ? '…' : `₹${(totalSpend / 1000).toFixed(0)}K`} sub='total invested' icon='💸' iconBg='#FEF2F2' color='#DC2626' delay='1' />
        <KCard label='Total Leads' value={loading ? '…' : totalLeads} sub='generated' icon='🎯' iconBg='#FFF7ED' color='#EA580C' delay='2' />
        <KCard label='Overall ROAS' value={loading || !totalSpend ? '…' : `${(totalRevenue / totalSpend).toFixed(1)}x`} sub='return on spend' icon='📈' iconBg='#F0FDF4' color='#16A34A' delay='3' />
      </div>

      {/* Table */}
      <div className="ap-campaign-page-125">
        <div className="ap-campaign-page-126">
          <TableSearchBar value={q} onChange={setQ} placeholder='Search by name, goal, status…' />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={['active', 'paused', 'completed']} allLabel='All Statuses' />
          <FilterSelect value={activeFilters.goal} onChange={val => setFilter('goal', val)} options={['Leads', 'Bookings', 'Calls', 'AMC Sign-ups', 'Brand Awareness', 'Followers']} allLabel='All Goals' />
          <div className="ap-campaign-page-127"><ExportDropdown {...exportProps} /></div>
        </div>

        <div className="ap-campaign-page-128">
          <table className="ap-campaign-page-129">
            <Thead cols={['Campaign', 'Goal', 'Channels', 'Budget', 'Spent', 'Impressions', 'Leads', 'Conv.', 'Revenue', 'ROAS', 'Status', '']} />
            <tbody>
              {loading ? Array.from({
              length: 5
            }).map((_, i) => <SkeletonRow key={i} />) : paginated.map((c, i) => <tr key={c.id} className="row ap-campaign-page-130" onClick={() => {
              setInitialEdit(false);
              setOpen(c.id);
            }} style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                    <td className="ap-campaign-page-131">
                      <div className="ap-campaign-page-132">{c.name}</div>
                      <div className="ap-campaign-page-133">{c.startDate} – {c.endDate}</div>
                    </td>
                    <td className="ap-campaign-page-134"><span className="ap-campaign-page-135">{c.goal}</span></td>
                    <td className="ap-campaign-page-136"><ChannelChips channels={c.channels} /></td>
                    <td className="ap-campaign-page-137"><span className="ap-campaign-page-138">₹{(c.budget || 0).toLocaleString()}</span></td>
                    <td className="ap-campaign-page-139"><span className="ap-campaign-page-140">₹{(c.spent || 0).toLocaleString()}</span></td>
                    <td className="ap-campaign-page-141"><span className="ap-campaign-page-142">{(c.impressions || 0).toLocaleString()}</span></td>
                    <td className="ap-campaign-page-143"><span className="ap-campaign-page-144">{c.leads}</span></td>
                    <td className="ap-campaign-page-145"><span className="ap-campaign-page-146">{c.conversions}</span></td>
                    <td className="ap-campaign-page-147"><span className="ap-campaign-page-148">₹{(c.revenue || 0).toLocaleString()}</span></td>
                    <td className="ap-campaign-page-149"><span className="ap-campaign-page-150">{c.spent > 0 ? (c.revenue / c.spent).toFixed(1) + 'x' : '—'}</span></td>
                    <td className="ap-campaign-page-151">
                      <span style={{
                  background: c.status === 'active' ? "var(--success-bg)" : "var(--bg)",
                  color: c.status === 'active' ? "var(--success-text)" : "var(--text-muted)"
                }} className="ap-campaign-page-152">● {c.status}</span>
                    </td>
                    <td onClick={e => e.stopPropagation()} className="ap-campaign-page-153">
                      <ActionDropdown onView={() => {
                  setInitialEdit(false);
                  setOpen(c.id);
                }} onEdit={() => {
                  setInitialEdit(true);
                  setOpen(c.id);
                }} onDelete={() => setDeleteTarget(c.id)} />
                    </td>
                  </tr>)}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={async () => {
      await handleDelete(deleteTarget);
      setDeleteTarget(null);
    }} onCancel={() => setDeleteTarget(null)} message='This campaign and all its data will be permanently removed. You will not be able to recover the deleted record!' />

      {showCompose && <NewCampaignModal onClose={() => setShowCompose(false)} onSave={createCampaign} />}
    </div>;
};
export default CampaignPage;