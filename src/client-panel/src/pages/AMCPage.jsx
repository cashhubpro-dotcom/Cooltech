// AMCPage.jsx — Client Panel · AMC Contracts (backend-wired, matches real schema)
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { COLORS, FONTS } from '../constants/tokens';
import { clientAmcApi } from '../services/clientPortalApi';
import { Toast } from '../components/ui/Components';
const PLAN_COLORS = {
  Comprehensive: "var(--info)",
  Premium: "var(--purple)",
  Basic: "var(--success)"
};

// Your AMC schema doesn't store a per-contract coverage list — plan tiers are
// fixed offerings, so what's covered is derived from the plan, not the DB.
// Edit this map if the actual tiers differ.
const PLAN_COVERAGE = {
  Basic: ['Bi-annual service visits', 'Labour coverage', 'Filter cleaning'],
  Comprehensive: ['Quarterly service visits', '24hr emergency response', 'Labour coverage', 'Parts — compressor & PCB', 'Gas top-up (1 refill/unit/year)'],
  Premium: ['Tri-annual service visits', '24hr emergency response', 'Labour coverage', 'Parts — compressor & PCB', 'Priority scheduling']
};
const STATUS_STYLE = {
  active: {
    bg: "var(--success-bg)",
    fg: "var(--success-text)",
    border: "var(--success-border)",
    label: 'Active'
  },
  expiring: {
    bg: "var(--warning-bg)",
    fg: "var(--warning-text)",
    border: "var(--warning-border)",
    label: 'Expiring'
  },
  expired: {
    bg: "var(--bg)",
    fg: "var(--text-muted)",
    border: "var(--border)",
    label: 'Expired'
  },
  cancelled: {
    bg: "var(--danger-bg)",
    fg: "var(--danger-text)",
    border: "var(--danger-border)",
    label: 'Cancelled'
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
const normalize = c => ({
  ...c,
  startFmt: formatDate(c.start),
  endFmt: formatDate(c.end),
  nextVisitFmt: formatDate(c.nextVisit)
});

// ─── Small local building blocks ───────────────────────────────────────────
const StatusBadge = ({
  status
}) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.active;
  return <span style={{
    background: s.bg,
    color: s.fg,
    border: `1px solid ${s.border}`
  }} className="cp-amc-page-1">
      {s.label}
    </span>;
};
const PlanTag = ({
  plan
}) => <span style={{
  background: `${PLAN_COLORS[plan] || '#64748B'}18`,
  color: PLAN_COLORS[plan] || '#64748B',
  border: `1px solid ${PLAN_COLORS[plan] || '#64748B'}40`
}} className="cp-amc-page-2">
    {plan}
  </span>;
const KPI = ({
  icon,
  iconBg,
  color,
  label,
  value,
  sub
}) => <div className="card cp-amc-page-3">
    <div className="cp-amc-page-4">
      <div style={{
      background: iconBg
    }} className="cp-amc-page-5">{icon}</div>
      <div>
        <div style={{
        color: color || COLORS.h1
      }} className="cp-amc-page-6">{value}</div>
        <div className="cp-amc-page-7">{label}</div>
      </div>
    </div>
    {sub && <div className="cp-amc-page-8">{sub}</div>}
  </div>;
const ProgressBar = ({
  pct,
  color = COLORS.brand
}) => <div className="cp-amc-page-9">
    <div style={{
    width: `${pct}%`,
    background: color
  }} className="cp-amc-page-10" />
  </div>;

// ─── Printable contract template — captured offscreen for the PDF download ─
const ContractPrintable = ({
  contract
}) => {
  const coverage = PLAN_COVERAGE[contract.plan] || [];
  const s = STATUS_STYLE[contract.status] || STATUS_STYLE.active;
  const cell = (extra = {}) => ({
    border: '1px solid #1a2e5c',
    padding: '6px 10px',
    fontSize: 11,
    color: '#111',
    ...extra
  });
  return <div className="cp-amc-page-11">
      <div className="cp-amc-page-12">
        <div>
          <div className="cp-amc-page-13">❄ CoolTech AC Services</div>
          <div className="cp-amc-page-14">Annual Maintenance Contract</div>
        </div>
        <div className="cp-amc-page-15">
          Generated: {new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}
        </div>
      </div>

      <div className="cp-amc-page-16">
        <div className="cp-amc-page-17">
          <span style={{
          background: s.bg,
          color: s.fg,
          border: `1px solid ${s.border}`
        }} className="cp-amc-page-18">{s.label}</span>
          <span style={{
          background: `${PLAN_COLORS[contract.plan] || '#64748B'}18`,
          color: PLAN_COLORS[contract.plan] || '#64748B'
        }} className="cp-amc-page-19">{contract.plan} Plan</span>
        </div>
        <div className="cp-amc-page-20">{contract.amcId}</div>
        <div className="cp-amc-page-21">
          {contract.units} AC Unit{contract.units > 1 ? 's' : ''} · {contract.startFmt} to {contract.endFmt}
        </div>
        <div className="cp-amc-page-22">
          <div>
            <div className="cp-amc-page-23">Contract Value</div>
            <div className="cp-amc-page-24">₹{Number(contract.value).toLocaleString()}</div>
          </div>
          <div className="cp-amc-page-25">
            <div className="cp-amc-page-26">Visits</div>
            <div className="cp-amc-page-27">{contract.done} / {contract.visits} completed</div>
          </div>
        </div>
      </div>

      <table className="cp-amc-page-28">
        <thead>
          <tr className="cp-amc-page-29">
            <th colSpan={2} style={cell({
            color: 'white',
            fontWeight: 700,
            textAlign: 'center'
          })}>WHAT'S COVERED</th>
          </tr>
        </thead>
        <tbody>
          {coverage.map((item, i) => <tr key={i}>
              <td colSpan={2} style={cell()}>✓ {item}</td>
            </tr>)}
        </tbody>
      </table>

      {contract.acDetails?.length > 0 && <table className="cp-amc-page-30">
          <thead>
            <tr className="cp-amc-page-31">
              <th style={cell({
            color: 'white',
            fontWeight: 700
          })}>Brand / Model</th>
              <th style={cell({
            color: 'white',
            fontWeight: 700
          })}>Type</th>
              <th style={cell({
            color: 'white',
            fontWeight: 700
          })}>Serial No.</th>
            </tr>
          </thead>
          <tbody>
            {contract.acDetails.map((u, i) => <tr key={i}>
                <td style={cell()}>{u.brand} {u.model}</td>
                <td style={cell()}>{u.type || '—'}</td>
                <td style={cell()}>{u.serial || '—'}</td>
              </tr>)}
          </tbody>
        </table>}

      {contract.notes && <div className="cp-amc-page-32">
          <strong>Notes:</strong> {contract.notes}
        </div>}

      <div className="cp-amc-page-33">
        Thank you for choosing CoolTech AC Services
      </div>
    </div>;
};

// ─── Request Service Visit modal ───────────────────────────────────────────
const RequestServiceModal = ({
  contract,
  onClose,
  onSubmit,
  busy
}) => {
  const [preferredDate, setPreferredDate] = useState('');
  const [slot, setSlot] = useState('morning');
  const [note, setNote] = useState('');
  return <div className="camc-overlay" onClick={onClose}>
      <div className="modal-box cp-amc-page-34" onClick={e => e.stopPropagation()}>
        <div className="cp-amc-page-35">
          <div className="cp-amc-page-36">Request Service Visit</div>
          <div className="cp-amc-page-37">{contract.amcId} · {contract.units} AC Unit{contract.units > 1 ? 's' : ''}</div>
        </div>

        <div className="cp-amc-page-38">
          <div>
            <label className="camc-label">Preferred Date</label>
            <input type="date" className="form-input camc-input" value={preferredDate} min={new Date().toISOString().split('T')[0]} onChange={e => setPreferredDate(e.target.value)} />
          </div>
          <div>
            <label className="camc-label">Preferred Time</label>
            <select className="form-input camc-input" value={slot} onChange={e => setSlot(e.target.value)}>
              <option value="morning">Morning (9am–12pm)</option>
              <option value="afternoon">Afternoon (12pm–4pm)</option>
              <option value="evening">Evening (4pm–7pm)</option>
            </select>
          </div>
          <div>
            <label className="camc-label">Describe the issue (optional)</label>
            <textarea className="form-input camc-input" rows={3} placeholder="e.g. AC not cooling properly in the conference room" value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>

        <div className="cp-amc-page-39">
          <button className="camc-btn camc-btn-tiny camc-btn-tiny-soft cp-amc-page-40" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="camc-btn camc-btn-brand cp-amc-page-41" disabled={busy} onClick={() => onSubmit({
          preferredDate,
          slot,
          note
        })}>
            {busy ? 'Sending…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>;
};

// ─── Page ───────────────────────────────────────────────────────────────────
const AMCPage = () => {
  const [contracts, setContracts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [q, setQ] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [serviceModalContract, setServiceModalContract] = useState(null); // contract being requested via modal
  const [downloadingId, setDownloadingId] = useState(null);
  const [printTarget, setPrintTarget] = useState(null); // contract currently being rendered offscreen for PDF capture
  const printRef = useRef(null);
  const pageSize = 5;
  const notify = msg => {
    setToast(msg);
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 2600);
  };
  const loadAll = () => {
    setLoading(true);
    setErrorMsg(null);
    Promise.all([clientAmcApi.list(), clientAmcApi.summary()]).then(([listRes, summaryRes]) => {
      setContracts((listRes.data ?? []).map(normalize));
      setSummary(summaryRes);
    }).catch(err => setErrorMsg(err.message || 'Could not load your AMC contracts.')).finally(() => setLoading(false));
  };
  useEffect(() => {
    loadAll();
    window.addEventListener('focus', loadAll);
    return () => window.removeEventListener('focus', loadAll);
  }, []);
  const filtered = contracts.filter(c => {
    const matchesQ = !q || [c.amcId, c.plan, c.status].join(' ').toLowerCase().includes(q.toLowerCase());
    const matchesPlan = !planFilter || c.plan === planFilter;
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesQ && matchesPlan && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const from = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filtered.length);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const completion = summary && summary.visitsAll > 0 ? Math.round(summary.visitsDone / summary.visitsAll * 100) : 0;
  const selected = openId ? contracts.find(c => c._id === openId) : null;

  // ── Request Service Visit — now driven by the modal ──
  const handleSubmitServiceRequest = async payload => {
    if (!serviceModalContract) return;
    setActionBusy(true);
    try {
      await clientAmcApi.requestService(serviceModalContract._id, payload);
      setServiceModalContract(null);
      notify('Service visit requested — our team will confirm the schedule shortly.');
    } catch (err) {
      notify(err.message || 'Could not send the request. Please try again.');
    } finally {
      setActionBusy(false);
    }
  };
  const handleRequestRenewal = async id => {
    setActionBusy(true);
    try {
      await clientAmcApi.requestRenewal(id);
      notify('Renewal request sent to our team.');
    } catch (err) {
      notify(err.message || 'Could not send the request. Please try again.');
    } finally {
      setActionBusy(false);
    }
  };

  // ── Download Contract — renders ContractPrintable offscreen, captures it
  // with html2canvas, and embeds the image into a jsPDF document. ──
  useEffect(() => {
    if (!printTarget || !printRef.current) return;
    (async () => {
      try {
        const canvas = await html2canvas(printRef.current, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          unit: 'pt',
          format: 'a4'
        });
        const margin = 24;
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth - margin * 2;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        pdf.save(`${printTarget.amcId}.pdf`);
      } catch (err) {
        notify('Could not generate the PDF. Please try again.');
      } finally {
        setDownloadingId(null);
        setPrintTarget(null);
      }
    })();
  }, [printTarget]);
  const handleDownload = contract => {
    setDownloadingId(contract._id);
    setPrintTarget(contract);
  };
  if (loading) {
    return <div className="cp-amc-page-42">Loading your AMC contracts…</div>;
  }
  if (errorMsg) {
    return <div className="cp-amc-page-43">
        <ClientAMCStyles />
        <div className="cp-amc-page-44">{errorMsg}</div>
        <button className="camc-btn camc-btn-brand cp-amc-page-45" onClick={loadAll}>
          Try again
        </button>
      </div>;
  }

  // ── Detail view ──
  if (selected) {
    const pct = selected.visits > 0 ? Math.round(selected.done / selected.visits * 100) : 0;
    const coverage = PLAN_COVERAGE[selected.plan] || [];
    return <div className="fi camc-page">
        <ClientAMCStyles />
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

        <button className="camc-back" onClick={() => setOpenId(null)}>← Back to AMC Contracts</button>

        <div className="cp-amc-page-46">
          <div className="cp-amc-page-47">

            {/* Hero card */}
            <div className="card cp-amc-page-48">
              <div className="cp-amc-page-49">
                <div>
                  <div className="cp-amc-page-50">
                    <StatusBadge status={selected.status} />
                    <PlanTag plan={selected.plan} />
                  </div>
                  <div className="cp-amc-page-51">{selected.amcId}</div>
                  <div className="cp-amc-page-52">
                    {selected.units} AC Unit{selected.units > 1 ? 's' : ''} · {selected.startFmt} to {selected.endFmt}
                  </div>
                </div>
                <div className="cp-amc-page-53">
                  <div className="cp-amc-page-54">Annual Value</div>
                  <div className="cp-amc-page-55">
                    ₹{Number(selected.value).toLocaleString()}
                  </div>
                  <div className="cp-amc-page-56">₹{Math.round(selected.value / 12).toLocaleString()}/mo</div>
                </div>
              </div>
              <div className="cp-amc-page-57">
                {[['Total Visits/Year', selected.visits], ['Visits Done', selected.done], ['Remaining', selected.visits - selected.done], ['Next Visit', selected.status === 'active' || selected.status === 'expiring' ? selected.nextVisitFmt : '—']].map(([k, v]) => <div key={k}>
                    <div className="cp-amc-page-58">{k}</div>
                    <div className="cp-amc-page-59">{v}</div>
                  </div>)}
              </div>
            </div>

            {/* Visit progress */}
            <div className="card cp-amc-page-60">
              <div className="cp-amc-page-61">
                <div className="cp-amc-page-62">Visit Progress</div>
                <span className="cp-amc-page-63">{pct}%</span>
              </div>
              <ProgressBar pct={pct} />
              <div className="cp-amc-page-64">
                {Array.from({
                length: selected.visits
              }).map((_, i) => <div key={i} style={{
                background: i < selected.done ? "var(--success-bg)" : "var(--bg)",
                border: `1px solid ${i < selected.done ? '#BBF7D0' : COLORS.border}`
              }} className="cp-amc-page-65">
                    <div className="cp-amc-page-66">{i < selected.done ? '✅' : '📅'}</div>
                    <div style={{
                  color: i < selected.done ? "var(--success-text)" : "var(--text-faint)"
                }} className="cp-amc-page-67">Visit {i + 1}</div>
                    <div className="cp-amc-page-68">{i < selected.done ? 'Done' : 'Pending'}</div>
                  </div>)}
              </div>
            </div>

            {/* Coverage + AC units */}
            <div className="cp-amc-page-69">
              <div className="card">
                <div className="card-header"><div className="card-title">✅ What's Covered</div></div>
                <div className="card-body">
                  {coverage.map((item, i) => <div key={i} style={{
                  borderBottom: i < coverage.length - 1 ? "1px solid var(--border)" : "none"
                }} className="cp-amc-page-70">
                      <div className="cp-amc-page-71">✓</div>
                      <span className="cp-amc-page-72">{item}</span>
                    </div>)}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">❄️ AC Units Covered</div></div>
                <div className="card-body">
                  {(selected.acDetails || []).length === 0 && <div className="cp-amc-page-73">No unit details on file yet.</div>}
                  {(selected.acDetails || []).map((u, i) => <div key={i} style={{
                  borderBottom: i < selected.acDetails.length - 1 ? "1px solid var(--border)" : "none"
                }} className="cp-amc-page-74">
                      <div>
                        <div className="cp-amc-page-75">{u.brand} {u.model}</div>
                        <div className="cp-amc-page-76">{u.type}{u.serial ? ` · SN ${u.serial}` : ''}</div>
                      </div>
                    </div>)}
                </div>
              </div>
            </div>

            {selected.notes && <div className="card cp-amc-page-77">
                <div className="cp-amc-page-78">Notes from our team</div>
                <div className="cp-amc-page-79">{selected.notes}</div>
              </div>}
          </div>

          {/* Sidebar */}
          <div className="cp-amc-page-80">
            <div className="card cp-amc-page-81">
              <div className="cp-amc-page-82">Actions</div>
              <button className="camc-btn camc-btn-brand" disabled={selected.status === 'cancelled'} onClick={() => setServiceModalContract(selected)}>
                🛠 Request Service Visit
              </button>
              <button className="camc-btn camc-btn-soft" disabled={downloadingId === selected._id} onClick={() => handleDownload(selected)}>
                {downloadingId === selected._id ? '⏳ Preparing PDF…' : '📄 Download Contract'}
              </button>
              {(selected.status === 'expiring' || selected.status === 'expired') && <button className="camc-btn camc-btn-outline" disabled={actionBusy} onClick={() => handleRequestRenewal(selected._id)}>
                  🔄 Request Renewal
                </button>}
            </div>

            {(selected.status === 'active' || selected.status === 'expiring') && <div className="cp-amc-page-83">
                <div className="cp-amc-page-84">⏱ Next Visit</div>
                <div className="cp-amc-page-85">{selected.nextVisitFmt}</div>
                <div className="cp-amc-page-86">
                  {selected.units} unit{selected.units > 1 ? 's' : ''} to service
                </div>
              </div>}
          </div>
        </div>

        {serviceModalContract && <RequestServiceModal contract={serviceModalContract} busy={actionBusy} onClose={() => setServiceModalContract(null)} onSubmit={handleSubmitServiceRequest} />}

        {/* Hidden node rendered offscreen — captured by html2canvas for the PDF download */}
        {printTarget && <div className="cp-amc-page-87">
            <div ref={printRef}><ContractPrintable contract={printTarget} /></div>
          </div>}
      </div>;
  }

  // ── List view ──
  return <div className="fi camc-page">
      <ClientAMCStyles />
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      <div className="cp-amc-page-88">
        <div>
          <div className="section-title">AMC Contracts</div>
          <div className="section-sub">Your Annual Maintenance Contract details</div>
        </div>
        <button className="camc-btn camc-btn-brand cp-amc-page-89" onClick={() => notify('Your request has been sent — our team will reach out shortly.')}>
          + Request New AMC
        </button>
      </div>

      <div className="cp-amc-page-90">
        <KPI icon="📋" iconBg="#F0FDF4" color="#16A34A" label="Active Contracts" value={summary?.activeCount ?? 0} sub="currently live" />
        <KPI icon="⚠️" iconBg="#FFFBEB" color="#B45309" label="Expiring Soon" value={summary?.expiringCount ?? 0} sub="renew to avoid a gap" />
        <KPI icon="❄️" iconBg="#EFF6FF" color="#0369A1" label="Units Covered" value={summary?.totalUnits ?? 0} sub="across all contracts" />
        <KPI icon="✅" iconBg="#F0FDF4" color="#16A34A" label="Visit Completion" value={`${completion}%`} sub={`${summary?.visitsDone ?? 0}/${summary?.visitsAll ?? 0} visits done`} />
      </div>

      <div className="card cp-amc-page-91">
        <div className="cp-amc-page-92">
          <input className="camc-search" placeholder="Search by contract ID, plan…" value={q} onChange={e => {
          setQ(e.target.value);
          setPage(1);
        }} />
          <select className="camc-select" value={planFilter} onChange={e => {
          setPlanFilter(e.target.value);
          setPage(1);
        }}>
            <option value="">All Plans</option>
            {['Comprehensive', 'Premium', 'Basic'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="camc-select" value={statusFilter} onChange={e => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="cp-amc-page-93">{from}–{to} of {filtered.length} contracts</span>
        </div>

        <div className="cp-amc-page-94">
          <table className="cp-amc-page-95">
            <thead>
              <tr className="cp-amc-page-96">
                {['Contract ID', 'Plan', 'Units', 'Value', 'Period', 'Visits', 'Next Visit', 'Status', ''].map(h => <th key={h} className="cp-amc-page-97">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {paginated.map((c, i) => <tr key={c._id} className="camc-row cp-amc-page-98" onClick={() => setOpenId(c._id)} style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                  <td className="cp-amc-page-99">{c.amcId}</td>
                  <td className="cp-amc-page-100"><PlanTag plan={c.plan} /></td>
                  <td className="cp-amc-page-101">{c.units}</td>
                  <td className="cp-amc-page-102">₹{Number(c.value).toLocaleString()}</td>
                  <td className="cp-amc-page-103">{c.startFmt} – {c.endFmt}</td>
                  <td className="cp-amc-page-104">
                    <div className="cp-amc-page-105">
                      <div className="cp-amc-page-106">
                        <div style={{
                      width: `${c.visits > 0 ? c.done / c.visits * 100 : 0}%`
                    }} className="cp-amc-page-107" />
                      </div>
                      <span className="cp-amc-page-108">{c.done}/{c.visits}</span>
                    </div>
                  </td>
                  <td className="cp-amc-page-109">{c.nextVisitFmt}</td>
                  <td className="cp-amc-page-110"><StatusBadge status={c.status} /></td>
                  <td onClick={e => e.stopPropagation()} className="cp-amc-page-111">
                    <div className="cp-amc-page-112">
                      <button className="camc-btn camc-btn-tiny" onClick={() => setOpenId(c._id)}>View</button>
                      <button className="camc-btn camc-btn-tiny camc-btn-tiny-soft" disabled={downloadingId === c._id} onClick={() => handleDownload(c)}>
                        {downloadingId === c._id ? '⏳' : 'PDF'}
                      </button>
                    </div>
                  </td>
                </tr>)}
              {paginated.length === 0 && <tr>
                  <td colSpan={9} className="cp-amc-page-113">
                    No contracts match your search or filters.
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>

        <div className="cp-amc-page-114">
          <button className="camc-page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
          <span className="cp-amc-page-115">Page {page} of {totalPages}</span>
          <button className="camc-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>›</button>
        </div>
      </div>

      {/* Hidden node rendered offscreen — captured by html2canvas for the PDF download */}
      {printTarget && <div className="cp-amc-page-116">
          <div ref={printRef}><ContractPrintable contract={printTarget} /></div>
        </div>}
    </div>;
};
const ClientAMCStyles = () => <style>{`
    .camc-page { position: relative; }
    .camc-back { background: none; border: none; cursor: pointer; padding: 0; font-size: 13px; font-weight: 600; color: ${COLORS.brand}; }
    .camc-search { flex: 1; min-width: 220px; padding: 8px 12px; border-radius: 8px; border: 1.5px solid ${COLORS.border}; font-size: 13px; outline: none; background: #FAFAFA; }
    .camc-select { padding: 8px 10px; border-radius: 8px; border: 1.5px solid ${COLORS.border}; font-size: 13px; background: #FAFAFA; outline: none; }
    .camc-row:hover { filter: brightness(0.98); }
    .camc-btn { width: 100%; padding: 10px; border-radius: 9px; font-size: 13px; font-weight: 700; border: none; cursor: pointer; margin-bottom: 8px; text-align: center; }
    .camc-btn:disabled { opacity: .6; cursor: not-allowed; }
    .camc-btn:last-child { margin-bottom: 0; }
    .camc-btn-brand { background: linear-gradient(135deg, ${COLORS.brand}, ${COLORS.brandD}); color: white; }
    .camc-btn-soft { background: #F0F9FF; border: 1px solid #BAE6FD; color: #0369A1; }
    .camc-btn-outline { background: ${COLORS.brandL}; border: 1px solid ${COLORS.brand}30; color: ${COLORS.brand}; }
    .camc-btn-tiny { width: auto; margin: 0; padding: 5px 10px; border-radius: 6px; font-size: 11px; background: ${COLORS.brandL}; border: 1px solid ${COLORS.brand}30; color: ${COLORS.brand}; font-weight: 700; }
    .camc-btn-tiny-soft { background: #F8FAFC; border: 1px solid ${COLORS.border}; color: ${COLORS.muted}; }
    .camc-page-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid ${COLORS.border}; background: white; cursor: pointer; font-size: 14px; color: ${COLORS.h2}; }
    .camc-page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .camc-toast { position: fixed; top: 20px; right: 20px; z-index: 50; background: #1E293B; color: white; padding: 12px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,.18); animation: camc-toast-in .25s ease-out; }
    @keyframes camc-toast-in { from { opacity: 0; transform: translateY(-8px);} to { opacity: 1; transform: translateY(0);} }
    .camc-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; z-index: 60; padding: 16px; animation: camc-fade-in .15s ease-out; }
    @keyframes camc-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .camc-label { display: block; font-size: 11px; font-weight: 600; color: ${COLORS.faint}; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
    .camc-input { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 1.5px solid ${COLORS.border}; font-size: 13px; font-family: ${FONTS.sans || 'inherit'}; outline: none; background: #FAFAFA; resize: vertical; }
  `}</style>;
export default AMCPage;