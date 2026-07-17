// AMCPage.jsx — Technician Panel · AMC Visits (backend-wired)
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { technicianAmcApi } from '../services/technicianPortalApi';

// ─── Tokens (mirrors the brand/navy language used across Admin + Client panels) ──
const COLORS = {
  brand: "var(--brand)",
  brandD: "var(--brand)",
  brandL: "var(--brand-l)",
  h1: "var(--h2)",
  h2: "var(--h2)",
  body: "var(--h2)",
  muted: "var(--muted)",
  faint: "var(--faint)",
  border: "var(--border)",
  bg: "var(--bg)",
  white: "var(--white)"
};
const FONTS = {
  mono: "'SFMono-Regular',Consolas,'Liberation Mono',monospace",
  sans: "inherit"
};
const PLAN_COLORS = {
  Comprehensive: "var(--info)",
  Premium: "var(--purple)",
  Basic: "var(--success)"
};
const STATUS_STYLE = {
  active: {
    bg: "var(--success-bg)",
    fg: "var(--success-text)",
    border: "var(--success-border)",
    label: 'Active',
    dot: "var(--success)"
  },
  expiring: {
    bg: "var(--warning-bg)",
    fg: "var(--warning-text)",
    border: "var(--warning-border)",
    label: 'Expiring',
    dot: "var(--warning)"
  },
  expired: {
    bg: "var(--bg)",
    fg: "var(--muted)",
    border: "var(--border)",
    label: 'Expired',
    dot: "var(--faint)"
  },
  cancelled: {
    bg: "var(--danger-bg)",
    fg: "var(--danger-text)",
    border: "var(--danger-border)",
    label: 'Cancelled',
    dot: "var(--danger)"
  }
};
const formatDate = val => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
const TABS = [{
  key: 'today',
  label: 'Due Today'
}, {
  key: 'upcoming',
  label: 'Upcoming'
}, {
  key: 'completed',
  label: 'Serviced'
}, {
  key: 'all',
  label: 'All'
}];

// ─── Small building blocks ──────────────────────────────────────────────────
const Badge = ({
  s
}) => {
  const st = STATUS_STYLE[s] || STATUS_STYLE.active;
  return <span style={{
    background: st.bg,
    color: st.fg,
    border: `1px solid ${st.border}`
  }} className="tp-amc-page-1">
      <span style={{
      background: st.dot
    }} className="tp-amc-page-2" />
      {st.label}
    </span>;
};
const PlanTag = ({
  plan
}) => <span style={{
  background: `${PLAN_COLORS[plan] || '#64748B'}18`,
  color: PLAN_COLORS[plan] || '#64748B',
  border: `1px solid ${PLAN_COLORS[plan] || '#64748B'}40`
}} className="tp-amc-page-3">
    {plan}
  </span>;
const KPI = ({
  icon,
  iconBg,
  color,
  label,
  value,
  sub
}) => <div className="tamc-card tp-amc-page-4">
    <div className="tp-amc-page-5">
      <div style={{
      background: iconBg
    }} className="tp-amc-page-6">
        {icon}
      </div>
      <div>
        <div style={{
        color: color || COLORS.h1
      }} className="tp-amc-page-7">{value}</div>
        <div className="tp-amc-page-8">{label}</div>
      </div>
    </div>
    {sub && <div className="tp-amc-page-9">{sub}</div>}
  </div>;
const ProgressBar = ({
  pct,
  color = COLORS.brand
}) => <div className="tp-amc-page-10">
    <div style={{
    width: `${pct}%`,
    background: color
  }} className="tp-amc-page-11" />
  </div>;

// ─── Page ───────────────────────────────────────────────────────────────────
const AMCPage = () => {
  const [contracts, setContracts] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [q, setQ] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [tab, setTab] = useState('today');
  const [openId, setOpenId] = useState(null);
  const [reportInput, setReportInput] = useState('');
  const [toast, setToast] = useState(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const notify = msg => {
    setToast(msg);
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 2600);
  };
  const loadAll = () => {
    setLoading(true);
    setErrorMsg(null);
    Promise.all([technicianAmcApi.list(), technicianAmcApi.summary()]).then(([listRes, summaryRes]) => {
      setContracts(listRes.data ?? []);
      setSummaryData(summaryRes);
    }).catch(err => setErrorMsg(err.message || 'Could not load your assigned AMC visits.')).finally(() => setLoading(false));
  };
  useEffect(() => {
    loadAll();
    window.addEventListener('focus', loadAll);
    return () => window.removeEventListener('focus', loadAll);
  }, []);
  const updateContractInState = updated => {
    setContracts(prev => prev.map(c => c._id === updated._id ? updated : c));
  };
  const filtered = useMemo(() => contracts.filter(v => {
    const matchesQ = !q || [v.id, v.customer, v.plan, v.address].join(' ').toLowerCase().includes(q.toLowerCase());
    const matchesPlan = !planFilter || v.plan === planFilter;
    const matchesTab = tab === 'all' || v.priority === tab;
    return matchesQ && matchesPlan && matchesTab;
  }), [contracts, q, planFilter, tab]);
  const dueTodayCount = summaryData?.dueTodayCount ?? 0;
  const upcomingCount = summaryData?.upcomingCount ?? 0;
  const totalUnits = summaryData?.totalUnits ?? 0;
  const visitsDone = summaryData?.visitsDone ?? 0;
  const visitsAll = summaryData?.visitsAll ?? 0;
  const completion = visitsAll > 0 ? Math.round(visitsDone / visitsAll * 100) : 0;
  const selected = openId ? contracts.find(c => c._id === openId) : null;
  const checkedCount = selected ? selected.checklist.filter(c => c.checked).length : 0;
  const openDetail = id => {
    setOpenId(id);
    const c = contracts.find(x => x._id === id);
    setReportInput(c?.reportText || '');
  };
  const toggleChecklistItem = async idx => {
    if (!selected || actionBusy) return;
    const nextChecked = !selected.checklist[idx].checked;

    // Optimistic update — flip immediately, reconcile with the server's
    // response (or roll back) once the request settles.
    const optimistic = {
      ...selected,
      checklist: selected.checklist.map((c, i) => i === idx ? {
        ...c,
        checked: nextChecked
      } : c)
    };
    updateContractInState(optimistic);
    try {
      const {
        data
      } = await technicianAmcApi.updateChecklist(selected._id, {
        itemIndex: idx,
        checked: nextChecked
      });
      updateContractInState(data);
    } catch (err) {
      updateContractInState(selected); // roll back
      notify(err.message || 'Could not update checklist item.');
    }
  };
  const handleSubmitReport = async () => {
    if (!selected) return;
    setActionBusy(true);
    try {
      const {
        data
      } = await technicianAmcApi.completeVisit(selected._id, {
        reportText: reportInput
      });
      updateContractInState(data);
      notify(`Visit report submitted for ${selected.id} ✓`);
      setReportInput('');
      setOpenId(null);
    } catch (err) {
      notify(err.message || 'Could not submit the visit report. Please try again.');
    } finally {
      setActionBusy(false);
    }
  };
  const confirmMarkComplete = async () => {
    if (!selected) return;
    setActionBusy(true);
    try {
      const {
        data
      } = await technicianAmcApi.completeVisit(selected._id, {});
      updateContractInState(data);
      notify(`Marked one visit complete for ${selected.id}`);
    } catch (err) {
      notify(err.message || 'Could not mark this visit complete. Please try again.');
    } finally {
      setActionBusy(false);
      setShowCompleteConfirm(false);
    }
  };
  if (loading) {
    return <div className="tp-amc-page-12">Loading your assigned AMC visits…</div>;
  }
  if (errorMsg) {
    return <div className="tp-amc-page-13">
        <TechAMCStyles />
        <div className="tp-amc-page-14">{errorMsg}</div>
        <button className="tamc-btn tamc-btn-brand tp-amc-page-15" onClick={loadAll}>
          Try again
        </button>
      </div>;
  }

  // ── Detail view ──
  if (selected) {
    const pct = selected.total > 0 ? Math.round(selected.done / selected.total * 100) : 0;
    return <div className="fi tamc-page">
        <TechAMCStyles />
        {toast && <div className="tamc-toast">{toast}</div>}

        <button className="tamc-back" onClick={() => setOpenId(null)}>← Back to AMC Visits</button>

        <div className="tp-amc-page-16">
          <div className="tp-amc-page-17">

            {/* Hero card */}
            <div className="tamc-card tp-amc-page-18">
              <div className="tp-amc-page-19">
                <div>
                  <div className="tp-amc-page-20">
                    <Badge s={selected.status} />
                    <PlanTag plan={selected.plan} />
                    <span className="tp-amc-page-21">{selected.id}</span>
                  </div>
                  <div className="tp-amc-page-22">{selected.customer}</div>
                  <div className="tp-amc-page-23">📍 {selected.address || '—'}</div>
                  <div className="tp-amc-page-24">📞 {selected.phone || '—'}</div>
                  {selected.notes && <div className="tp-amc-page-25">📝 {selected.notes}</div>}
                </div>
                <div className="tp-amc-page-26">
                  <div className="tp-amc-page-27">AC Units</div>
                  <div className="tp-amc-page-28">❄️ {selected.units}</div>
                </div>
              </div>
              <div className="tp-amc-page-29">
                {[['Total Visits/Yr', selected.total], ['Visits Done', selected.done], ['Remaining', selected.total - selected.done], ['Next Visit', formatDate(selected.nextVisit)]].map(([k, v]) => <div key={k}>
                    <div className="tp-amc-page-30">{k}</div>
                    <div className="tp-amc-page-31">{v}</div>
                  </div>)}
              </div>
            </div>

            {/* Visit progress */}
            <div className="tamc-card tp-amc-page-32">
              <div className="tp-amc-page-33">
                <div className="tp-amc-page-34">Visit Progress</div>
                <span className="tp-amc-page-35">{pct}%</span>
              </div>
              <ProgressBar pct={pct} />
              <div className="tp-amc-page-36">
                {Array.from({
                length: selected.total
              }).map((_, i) => <div key={i} style={{
                background: i < selected.done ? "var(--success-bg)" : "var(--bg)",
                border: `1px solid ${i < selected.done ? '#BBF7D0' : COLORS.border}`
              }} className="tp-amc-page-37">
                    <div className="tp-amc-page-38">{i < selected.done ? '✅' : '📅'}</div>
                    <div style={{
                  color: i < selected.done ? "var(--success-text)" : "var(--faint)"
                }} className="tp-amc-page-39">Visit {i + 1}</div>
                    <div className="tp-amc-page-40">{i < selected.done ? 'Done' : 'Pending'}</div>
                  </div>)}
              </div>
            </div>

            {/* Checklist — reflects the current pending visit from the backend */}
            <div className="tamc-card tp-amc-page-41">
              <div className="tp-amc-page-42">
                <div className="tp-amc-page-43">
                  Visit {selected.currentVisitNumber || selected.total} Checklist
                </div>
                <span style={{
                color: checkedCount === selected.checklist.length ? "var(--success-text)" : "var(--muted)"
              }} className="tp-amc-page-44">
                  {checkedCount}/{selected.checklist.length}
                </span>
              </div>
              {selected.done >= selected.total ? <div className="tp-amc-page-45">
                  All scheduled visits for this contract are complete ✓
                </div> : selected.checklist.map((item, i) => <div key={item.label} onClick={() => toggleChecklistItem(i)} style={{
              borderBottom: i < selected.checklist.length - 1 ? "1px solid var(--border)" : "none"
            }} className="tp-amc-page-46">
                    <div style={{
                border: `2px solid ${item.checked ? COLORS.brand : COLORS.border}`,
                background: item.checked ? "var(--brand)" : "transparent"
              }} className="tp-amc-page-47">
                      {item.checked ? '✓' : ''}
                    </div>
                    <span style={{
                color: item.checked ? "var(--faint)" : "var(--h2)",
                textDecoration: item.checked ? "line-through" : "none"
              }} className="tp-amc-page-48">
                      {item.label}
                    </span>
                  </div>)}
            </div>

            {/* Visit report */}
            {selected.done < selected.total && <div className="tamc-card tp-amc-page-49">
                <div className="tp-amc-page-50">Visit Report / Observations</div>
                <textarea className="tamc-textarea" rows={4} placeholder="Describe the service done, parts used, any issues found…" value={reportInput} onChange={e => setReportInput(e.target.value)} />
                <button className="tamc-btn tamc-btn-brand tp-amc-page-51" disabled={actionBusy} onClick={handleSubmitReport}>
                  📋 Submit Visit Report
                </button>
              </div>}
          </div>

          {/* Sidebar */}
          <div className="tp-amc-page-52">
            <div className="tamc-card tp-amc-page-53">
              <div className="tp-amc-page-54">Actions</div>
              <a className="tamc-btn tamc-btn-brand" href={`tel:${selected.phone}`}>📞 Call Customer</a>
              <a className="tamc-btn tamc-btn-soft" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.address || selected.customer)}`} target="_blank" rel="noreferrer">
                🧭 Get Directions
              </a>
              <button className="tamc-btn tamc-btn-outline" disabled={actionBusy || selected.done >= selected.total} onClick={() => setShowCompleteConfirm(true)}>
                ✅ Mark Visit Complete
              </button>
            </div>

            {(selected.status === 'active' || selected.status === 'expiring') && selected.done < selected.total && <div className="tp-amc-page-55">
                <div className="tp-amc-page-56">⏱ Next Visit Due</div>
                <div className="tp-amc-page-57">{formatDate(selected.nextVisit)}</div>
                <div className="tp-amc-page-58">
                  {selected.units} unit{selected.units > 1 ? 's' : ''} to service
                </div>
              </div>}

            <div className="tamc-card tp-amc-page-59">
              <div className="tp-amc-page-60">Contract Info</div>
              {[['Plan', selected.plan], ['Units', selected.units], ['Visits/Yr', selected.total]].map(([k, v]) => <div key={k} className="tp-amc-page-61">
                  <span className="tp-amc-page-62">{k}</span>
                  <span className="tp-amc-page-63">{v}</span>
                </div>)}
            </div>
          </div>
        </div>

        {showCompleteConfirm && createPortal(<div className="tamc-modal-overlay" onClick={() => !actionBusy && setShowCompleteConfirm(false)}>
            <div className="tamc-modal" onClick={e => e.stopPropagation()}>
              <div className="tp-amc-page-64">✅</div>
              <div className="tp-amc-page-65">Mark this visit complete?</div>
              <div className="tp-amc-page-66">
                This will record one completed visit for <strong>{selected.customer}</strong> ({selected.id}),
                bringing progress to <strong>{Math.min(selected.total, selected.done + 1)}/{selected.total}</strong>.
                This can't be undone from here.
              </div>
              <div className="tp-amc-page-67">
                <button className="tamc-btn tamc-btn-ghost tp-amc-page-68" disabled={actionBusy} onClick={() => setShowCompleteConfirm(false)}>
                  Cancel
                </button>
                <button className="tamc-btn tamc-btn-brand tp-amc-page-69" disabled={actionBusy} onClick={confirmMarkComplete}>
                  {actionBusy ? 'Confirming…' : '✅ Confirm Complete'}
                </button>
              </div>
            </div>
          </div>, document.getElementById('tech-portal-root') || document.body)}
      </div>;
  }

  // ── List view ──
  return <div className="fi tamc-page">
      <TechAMCStyles />
      {toast && <div className="tamc-toast">{toast}</div>}

      <div className="tp-amc-page-70">
        <div>
          <div className="tamc-section-title">AMC Visits</div>
          <div className="tamc-section-sub">Your assigned Annual Maintenance Contract accounts</div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="tp-amc-page-71">
        <KPI icon="📅" iconBg="#FFFBEB" color="#B45309" label="Due Today" value={dueTodayCount} sub="visits scheduled today" />
        <KPI icon="🕒" iconBg="#EFF6FF" color="#0369A1" label="Upcoming" value={upcomingCount} sub="in the coming days" />
        <KPI icon="❄️" iconBg="#F0F9FF" color="#0369A1" label="Total Units" value={totalUnits} sub="across all accounts" />
        <KPI icon="✅" iconBg="#F0FDF4" color="#16A34A" label="Visit Completion" value={`${completion}%`} sub={`${visitsDone}/${visitsAll} done`} />
      </div>

      {/* Filters */}
      <div className="tamc-card tp-amc-page-72">
        <div className="tp-amc-page-73">
          {TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)} className="tamc-tab" style={{
          background: tab === t.key ? "var(--brand-l)" : "var(--bg)",
          color: tab === t.key ? "var(--brand)" : "var(--muted)",
          border: `1px solid ${tab === t.key ? COLORS.brand : COLORS.border}`
        }}>
              {t.label}
            </button>)}
          <span className="tp-amc-page-74">{filtered.length} account{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="tp-amc-page-75">
          <input className="tamc-search" placeholder="Search by customer, contract ID, area…" value={q} onChange={e => setQ(e.target.value)} />
          <select className="tamc-select" value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
            <option value="">All Plans</option>
            {['Comprehensive', 'Premium', 'Basic'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Visit cards */}
        <div className="tp-amc-page-76">
          {filtered.map(v => {
          const pct = v.total > 0 ? Math.round(v.done / v.total * 100) : 0;
          return <div key={v._id} className="tamc-visit-card" onClick={() => openDetail(v._id)}>
                <div className="tp-amc-page-77">
                  <div className="tp-amc-page-78">
                    <div className="tp-amc-page-79">
                      <span className="tp-amc-page-80">{v.id}</span>
                      <Badge s={v.status} />
                      <PlanTag plan={v.plan} />
                    </div>
                    <div className="tp-amc-page-81">{v.customer}</div>
                    <div className="tp-amc-page-82">📍 {v.address || '—'} · 📞 {v.phone || '—'}</div>
                    <div className="tp-amc-page-83">❄️ {v.units} AC Units</div>
                    {v.notes && <div className="tp-amc-page-84">📝 {v.notes}</div>}
                  </div>
                  <div className="tp-amc-page-85">
                    <div className="tp-amc-page-86">Next Visit</div>
                    <div className="tp-amc-page-87">📅 {formatDate(v.nextVisit)}</div>
                    <button className="tamc-btn tamc-btn-tiny tp-amc-page-88" onClick={e => {
                  e.stopPropagation();
                  openDetail(v._id);
                }}>
                      View Details →
                    </button>
                  </div>
                </div>

                <div className="tp-amc-page-89">
                  <div className="tp-amc-page-90">
                    <span className="tp-amc-page-91">Visits Completed</span>
                    <span className="tp-amc-page-92">{v.done}/{v.total}</span>
                  </div>
                  <ProgressBar pct={pct} color={v.status === 'expiring' ? '#F59E0B' : COLORS.brand} />
                </div>
              </div>;
        })}

          {filtered.length === 0 && <div className="tp-amc-page-93">
              No AMC accounts match your search or filters.
            </div>}
        </div>
      </div>
    </div>;
};
const TechAMCStyles = () => <style>{`
    .tamc-page { position: relative; }
    .tamc-section-title { font-size: 20px; font-weight: 800; color: ${COLORS.h1}; }
    .tamc-section-sub { font-size: 13px; color: ${COLORS.muted}; margin-top: 2px; }
    .tamc-card { background: ${COLORS.white}; border-radius: 14px; border: 1px solid ${COLORS.border}; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
    .tamc-back { background: none; border: none; cursor: pointer; padding: 0; font-size: 13px; font-weight: 600; color: ${COLORS.brand}; }
    .tamc-search { flex: 1; min-width: 220px; padding: 8px 12px; border-radius: 8px; border: 1.5px solid ${COLORS.border}; font-size: 13px; outline: none; background: #FAFAFA; font-family: inherit; }
    .tamc-select { padding: 8px 10px; border-radius: 8px; border: 1.5px solid ${COLORS.border}; font-size: 13px; background: #FAFAFA; outline: none; font-family: inherit; }
    .tamc-textarea { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px; border: 1.5px solid ${COLORS.border}; font-size: 13px; outline: none; background: #FAFAFA; font-family: inherit; resize: vertical; }
    .tamc-textarea:focus { border-color: ${COLORS.brand}; }
    .tamc-tab { padding: 6px 14px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .tamc-visit-card { background: #FCFCFD; border-radius: 12px; border: 1px solid ${COLORS.border}; padding: 16px; cursor: pointer; transition: border-color .15s, box-shadow .15s; }
    .tamc-visit-card:hover { border-color: ${COLORS.brand}60; box-shadow: 0 2px 10px rgba(249,115,22,.08); }
    .tamc-btn { display: block; width: 100%; box-sizing: border-box; padding: 10px; border-radius: 9px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; margin-bottom: 8px; text-align: center; font-family: inherit; text-decoration: none; }
    .tamc-btn:last-child { margin-bottom: 0; }
    .tamc-btn:disabled { opacity: .5; cursor: not-allowed; }
    .tamc-btn-brand { background: linear-gradient(135deg, ${COLORS.brand}, ${COLORS.brandD}); color: white; }
    .tamc-btn-soft { background: #F0F9FF; border: 1px solid #BAE6FD; color: #0369A1; }
    .tamc-btn-outline { background: ${COLORS.brandL}; border: 1px solid ${COLORS.brand}30; color: ${COLORS.brand}; }
    .tamc-btn-tiny { width: auto; margin: 0; padding: 6px 14px; border-radius: 8px; background: ${COLORS.brand}; color: white; font-size: 12px; }
    .tamc-btn-ghost { background: ${COLORS.white}; border: 1.5px solid ${COLORS.border}; color: ${COLORS.h2}; }
    .tamc-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; z-index: 60; padding: 16px; animation: tamc-fade-in .15s ease-out; }
    .tamc-modal { background: ${COLORS.white}; border-radius: 16px; padding: 24px; width: 100%; max-width: 380px; box-shadow: 0 20px 50px rgba(0,0,0,.25); text-align: center; animation: tamc-modal-in .18s ease-out; }
    @keyframes tamc-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes tamc-modal-in { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .tamc-toast { position: fixed; top: 20px; right: 20px; z-index: 50; background: #1E293B; color: white; padding: 12px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,.18); animation: tamc-toast-in .25s ease-out; }
    @keyframes tamc-toast-in { from { opacity: 0; transform: translateY(-8px);} to { opacity: 1; transform: translateY(0);} }
    @media (max-width: 860px) {
      .tamc-page div[style*="grid-template-columns: 1fr 300px"] { grid-template-columns: 1fr !important; }
      .tamc-page div[style*="repeat(4,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
    }
  `}</style>;
export default AMCPage;