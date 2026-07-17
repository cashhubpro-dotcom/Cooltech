// AMCPage.jsx — SearchBar + FilterDropdowns + ExportDropdown + Pagination + PDF (matches detail view)
import { amcApi, invoicesApi } from '../services/api';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../constants/tokens';
import { KCard, Thead } from '../components/ui/Cards';
import EditableDetailView from '../components/ui/EditableDetailView';
import ActionDropdown from '../components/ui/ActionDropdown';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import PDFPreview from '../components/layout/PDFPreview';
import { useTableSearch } from '../hooks/useTableSearch';
import TableSearchBar from '../components/ui/TableSearchBar';
import FilterSelect from '../components/ui/FilterSelect';
import ExportDropdown from '../components/layout/ExportDropdown';
import useExport from '../hooks/useExport';
import { usePagination } from '../hooks/usePagination'; // ← NEW
import Pagination from '../components/ui/Pagination'; // ← NEW
import { addToDeleted } from '../store/deletedStore';
import logoImg from '../assets/logo.png';
import signatureImg from '../assets/signature.png';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAN_COLORS = {
  Comprehensive: "var(--info)",
  Premium: "var(--purple)",
  Basic: "var(--success)"
};
const NAVY = "#1a2e5c";
const ORANGE = "#F97316";
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

// Best-effort parse of a formatted display date ("31 Mar 2027") or ISO date
// back into a yyyy-mm-dd string for <input type="date">. Used only to
// pre-fill sensible defaults in the action modals below — always editable,
// so a parse miss just falls back to "today" rather than breaking anything.
const toDateInputValue = val => {
  const d = val ? new Date(val) : new Date();
  return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
};
const normalizeContract = c => ({
  ...c,
  id: c.amcId || 'AMC-' + String(c._id).slice(-6).toUpperCase(),
  customer: typeof c.customer === 'object' && c.customer !== null ? c.customer.name : c.customerName || c.customer || '',
  customerId: typeof c.customer === 'object' && c.customer !== null ? c.customer._id : c.customerId,
  start: formatDate(c.start || c.startDate),
  end: formatDate(c.end || c.endDate),
  nextVisit: formatDate(c.nextVisit || c.nextVisitDate),
  value: c.value ?? 0,
  units: c.units ?? 1,
  visits: c.visits ?? 0,
  done: c.done ?? 0,
  plan: c.plan || 'Basic',
  status: c.status || 'active',
  autoRenew: c.autoRenew ?? false
});

// ─── Column config for export ─────────────────────────────────────────────────
const AMC_COLUMNS = [{
  label: "Contract ID",
  key: "id",
  width: 12,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: COLORS.brand,
    fontSize: 11
  }
}, {
  label: "Customer",
  key: "customer",
  width: 20,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: "Plan",
  key: "plan",
  width: 14,
  format: v => v
}, {
  label: "Units",
  key: "units",
  width: 8,
  tdStyle: {
    fontFamily: "monospace",
    textAlign: "center"
  },
  format: v => v
}, {
  label: "Value (₹)",
  key: "value",
  width: 12,
  excelKey: "Value (₹)",
  format: v => v,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: COLORS.brand
  }
}, {
  label: "Start",
  key: "start",
  width: 10,
  tdStyle: {
    fontSize: 11,
    color: COLORS.muted
  }
}, {
  label: "End",
  key: "end",
  width: 10,
  tdStyle: {
    fontSize: 11,
    color: COLORS.muted
  }
}, {
  label: "Visits/Yr",
  key: "visits",
  width: 8,
  tdStyle: {
    fontFamily: "monospace",
    textAlign: "center"
  },
  format: v => v
}, {
  label: "Done",
  key: "done",
  width: 8,
  tdStyle: {
    fontFamily: "monospace",
    textAlign: "center"
  },
  format: v => v
}, {
  label: "Next Visit",
  key: "nextVisit",
  width: 10,
  tdStyle: {
    fontSize: 11
  }
}, {
  label: "Status",
  key: "status",
  width: 10,
  format: v => v === "active" ? "Active" : "Expiring"
}];

// ─── AMC PDF Template — mirrors the detail view screenshot exactly ────────────
// Register this in documentTemplates.jsx:  amc_contract: AMCContractPDFTemplate
export const AMCContractPDFTemplate = ({
  data: c
}) => {
  const planColor = PLAN_COLORS[c.plan] || "#64748B";
  const isActive = c.status === "active" || c.status === "Active";
  const pct = c.visits > 0 ? Math.round(c.done / c.visits * 100) : 0;
  const cell = (extra = {}) => ({
    border: `1px solid ${NAVY}`,
    padding: "6px 10px",
    fontSize: 11,
    color: "#111",
    verticalAlign: "top",
    ...extra
  });
  return <div className="ap-amc-page-1">

      {/* ── Header: logo + company info ── */}
      <div className="ap-amc-page-2">
        <div>
          <div className="ap-amc-page-3">❄ CoolTech AC Services</div>
          <div className="ap-amc-page-4">GSTIN: 29AABCT1234A1Z5 · +91 98765 43210</div>
          <div className="ap-amc-page-5">Bengaluru, Karnataka · cooltech@services.com</div>
        </div>
        <div className="ap-amc-page-6">
          <img src={logoImg} alt="Logo" className="ap-amc-page-7" />
          <div className="ap-amc-page-8">Date: {c.start}</div>
        </div>
      </div>

      {/* ── Title bar ── */}
      <div className="ap-amc-page-9">
        <span className="ap-amc-page-10">
          AMC CONTRACT — {c.plan} Plan
        </span>
      </div>

      {/* ── Hero card: mirrors the top white card from screenshot ── */}
      <div className="ap-amc-page-11">
        <div className="ap-amc-page-12">
          <div>
            {/* Status + Plan badges */}
            <div className="ap-amc-page-13">
              <span style={{
              background: isActive ? "var(--success-bg)" : "var(--warning-bg)",
              color: isActive ? "var(--success-text)" : "var(--warning-text)",
              border: `1px solid ${isActive ? "#BBF7D0" : "#FDE68A"}`
            }} className="ap-amc-page-14">
                {isActive ? "Active" : "Expiring"}
              </span>
              <span style={{
              background: `${planColor}18`,
              color: planColor,
              border: `1px solid ${planColor}40`
            }} className="ap-amc-page-15">
                {c.plan} Plan
              </span>
            </div>
            {/* Customer name — large, like in screenshot */}
            <div className="ap-amc-page-16">{c.customer}</div>
            <div className="ap-amc-page-17">{c.units} AC Units · {c.start} to {c.end}</div>
          </div>
          {/* Contract value — right-aligned, orange, big */}
          <div className="ap-amc-page-18">
            <div className="ap-amc-page-19">Contract Value</div>
            <div className="ap-amc-page-20">
              ₹{Number(c.value).toLocaleString()}
            </div>
            <div className="ap-amc-page-21">₹{Math.round(c.value / 12).toLocaleString()}/mo</div>
          </div>
        </div>

        {/* 4-stat grid — mirrors TOTAL VISITS/YEAR · VISITS DONE · REMAINING · NEXT VISIT */}
        <div className="ap-amc-page-22">
          {[["TOTAL VISITS/YEAR", c.visits], ["VISITS DONE", c.done], ["REMAINING", c.visits - c.done], ["NEXT VISIT", c.nextVisit]].map(([label, value]) => <div key={label} className="ap-amc-page-23">
              <div className="ap-amc-page-24">{label}</div>
              <div className="ap-amc-page-25">{value}</div>
            </div>)}
        </div>
      </div>

      {/* ── Visit Progress — mirrors the Visit Progress card ── */}
      <div className="ap-amc-page-26">
        <div className="ap-amc-page-27">
          <div className="ap-amc-page-28">Visit Progress</div>
          <span className="ap-amc-page-29">{pct}%</span>
        </div>
        {/* Progress bar */}
        <div className="ap-amc-page-30">
          <div style={{
          width: `${pct}%`
        }} className="ap-amc-page-31" />
        </div>
        {/* Visit cards — same as screenshot */}
        <div className="ap-amc-page-32">
          {Array.from({
          length: c.visits
        }).map((_, i) => <div key={i} style={{
          background: i < c.done ? "var(--success-bg)" : "var(--bg)",
          border: `1px solid ${i < c.done ? "#BBF7D0" : "#E2E8F0"}`
        }} className="ap-amc-page-33">
              <div className="ap-amc-page-34">{i < c.done ? "✅" : "📅"}</div>
              <div style={{
            color: i < c.done ? "var(--success-text)" : "var(--text-faint)"
          }} className="ap-amc-page-35">Visit {i + 1}</div>
              <div className="ap-amc-page-36">{i < c.done ? "Done" : "Pending"}</div>
            </div>)}
        </div>
      </div>

      {/* ── Contract details table ── */}
      <table className="ap-amc-page-37">
        <thead>
          <tr className="ap-amc-page-38">
            <th colSpan={4} style={{
            ...cell({
              color: "white",
              fontWeight: 700,
              textAlign: "center",
              fontSize: 12
            })
          }}>
              CONTRACT DETAILS
            </th>
          </tr>
        </thead>
        <tbody>
          {[["Contract ID", <span className="ap-amc-page-39">{c.id}</span>, "Plan", <span style={{
          background: `${planColor}18`,
          color: planColor
        }} className="ap-amc-page-40">{c.plan}</span>], ["Customer", <strong>{c.customer}</strong>, "Status", <span style={{
          background: isActive ? "var(--success-bg)" : "var(--warning-bg)",
          color: isActive ? "var(--success-text)" : "var(--warning-text)"
        }} className="ap-amc-page-41">{isActive ? "Active" : "Expiring"}</span>], ["AC Units", <span className="ap-amc-page-42">{c.units}</span>, "Contract Value", <span className="ap-amc-page-43">₹{Number(c.value).toLocaleString()}</span>], ["Start Date", c.start, "End Date", c.end], ["Visits / Year", <span className="ap-amc-page-44">{c.visits}</span>, "Next Visit", <span className="ap-amc-page-45">{c.nextVisit}</span>], ["Monthly Value", <span className="ap-amc-page-46">₹{Math.round(c.value / 12).toLocaleString()}/mo</span>, "Auto-Renew", "Yes"]].map(([k1, v1, k2, v2], idx) => <tr key={idx}>
              <td style={{
            ...cell({
              fontWeight: 700,
              background: "#EEF2FF",
              width: "22%"
            })
          }}>{k1}</td>
              <td style={{
            ...cell({
              width: "28%"
            })
          }}>{v1}</td>
              <td style={{
            ...cell({
              fontWeight: 700,
              background: "#EEF2FF",
              width: "22%"
            })
          }}>{k2}</td>
              <td style={{
            ...cell({
              width: "28%"
            })
          }}>{v2}</td>
            </tr>)}
        </tbody>
      </table>

      {/* ── Terms ── */}
      <table className="ap-amc-page-47">
        <thead>
          <tr className="ap-amc-page-48">
            <th style={{
            ...cell({
              color: "white",
              fontWeight: 700,
              textAlign: "left",
              fontSize: 12
            })
          }}>
              TERMS &amp; CONDITIONS
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{
            ...cell({
              lineHeight: 1.9,
              color: "#333"
            })
          }}>
              This Annual Maintenance Contract covers <strong>{c.units}</strong> AC unit(s) under the <strong>{c.plan} Plan</strong> for the
              period <strong>{c.start}</strong> to <strong>{c.end}</strong>. Total <strong>{c.visits}</strong> scheduled service visits per year.
              Contract value <strong>₹{Number(c.value).toLocaleString()}</strong> (₹{Math.round(c.value / 12).toLocaleString()}/mo).
              Services include preventive maintenance, filter cleaning, gas top-up checks, and priority breakdown support.
              Any parts/consumables required during visits will be charged separately as per actuals.
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Signature footer ── */}
      <div className="ap-amc-page-49">
        <div className="ap-amc-page-50">
          <div>Thanking You,</div>
          <div className="ap-amc-page-51">Mr. VAKIL YADAV</div>
          <div>9724763909</div>
          <div>From: Alisha Engineering</div>
        </div>
        <div className="ap-amc-page-52">
          <img src={signatureImg} alt="Signature" className="ap-amc-page-53" />
          <div className="ap-amc-page-54">
            [Authorized Signatory]
          </div>
        </div>
      </div>

      <div className="ap-amc-page-55">
        Thank you for choosing CoolTech AC Services · cooltech@services.com · +91 98765 43210
      </div>
    </div>;
};

/* ────────────────────────────────────────────────────────────────────────
   ACTION MODALS — Schedule Next Visit / Generate Invoice / Renew Contract
   Self-contained: each modal IS the confirmation step (details + explicit
   confirm button), and each onConfirm handler in AMCDetail below hits the
   real backend (amcApi.update via the onPatch prop, or invoicesApi.create)
   and surfaces success/failure via a toast rather than a raw alert().
──────────────────────────────────────────────────────────────────────── */
const MODAL_CSS = `
.amc-modal-overlay{ position:fixed; inset:0; background:rgba(15,23,42,.5); z-index:1000; display:flex;
      align-items:center; justify-content:center; padding:20px; }
.amc-modal{ background:#fff; border-radius:16px; width:100%; max-width:440px; max-height:88vh; overflow-y:auto;
      box-shadow:0 24px 64px rgba(0,0,0,.25); font-family:${FONTS.sans}; }
.amc-modal-hdr{ display:flex; justify-content:space-between; align-items:center; padding:18px 22px;
      border-bottom:1px solid ${COLORS.border}; position:sticky; top:0; background:#fff; border-radius:16px 16px 0 0; }
.amc-modal-title{ font-size:16px; font-weight:800; color:${COLORS.h1}; }
.amc-modal-close{ background:#F3F4F6; border:none; width:28px; height:28px; border-radius:7px; font-size:15px;
      color:${COLORS.muted}; cursor:pointer; }
.amc-modal-close:disabled{ opacity:.5; cursor:not-allowed; }
.amc-modal-body{ padding:20px 22px; display:flex; flex-direction:column; gap:14px; }
.amc-modal-note{ font-size:12.5px; color:${COLORS.muted}; line-height:1.5; }
.amc-modal-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.amc-flabel{ display:block; font-size:10.5px; font-weight:700; color:${COLORS.faint}; letter-spacing:.06em;
      text-transform:uppercase; margin-bottom:6px; }
.amc-finput{ width:100%; padding:9px 11px; border-radius:8px; border:1.5px solid ${COLORS.border}; font-size:13px;
      color:${COLORS.h2}; background:#FAFAFA; font-family:${FONTS.sans}; outline:none; box-sizing:border-box; }
.amc-finput:focus{ border-color:${COLORS.brand}; background:#fff; }
.amc-toggle{ flex:1; padding:9px 10px; border-radius:8px; border:1.5px solid ${COLORS.border}; background:#fff;
      color:${COLORS.muted}; font-size:12.5px; font-weight:700; cursor:pointer; }
.amc-toggle.active{ border-color:${COLORS.brand}; background:${COLORS.brandL}; color:${COLORS.brand}; }
.amc-inv-row{ display:flex; justify-content:space-between; padding:6px 0; font-size:12.5px; color:${COLORS.muted};
      border-bottom:1px dashed ${COLORS.border}; }
.amc-inv-total{ display:flex; justify-content:space-between; padding:10px 0 0; font-size:15px; font-weight:800; color:${COLORS.brand}; }
.amc-modal-footer{ display:flex; justify-content:flex-end; gap:10px; padding:16px 22px;
      border-top:1px solid ${COLORS.border}; position:sticky; bottom:0; background:#fff; border-radius:0 0 16px 16px; }
.amc-modal-btn{ padding:9px 20px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:none; }
.amc-modal-btn.cancel{ background:#fff; border:1px solid ${COLORS.border}; color:${COLORS.muted}; }
.amc-modal-btn.save{ background:linear-gradient(135deg,${COLORS.brand},${COLORS.brandD}); color:#fff;
      box-shadow:0 4px 12px ${COLORS.brand}40; }
.amc-modal-btn:disabled{ opacity:.55; cursor:not-allowed; }
.amc-toast{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 16px;
      border-radius:10px; font-size:13px; font-weight:600; margin-bottom:14px; }
.amc-toast.success{ background:#ECFDF5; border:1px solid #A7F3D0; color:#047857; }
.amc-toast.error{ background:#FEF2F2; border:1px solid #FECACA; color:#B91C1C; }
.amc-toast-x{ background:none; border:none; cursor:pointer; font-size:15px; color:inherit; opacity:.6; }
`;
const ScheduleVisitModal = ({
  open,
  contract,
  onClose,
  onConfirm,
  busy
}) => {
  const [date, setDate] = useState('');
  useEffect(() => {
    if (open) setDate('');
  }, [open]);
  if (!open || !contract) return null;
  return createPortal(<div className="amc-modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="amc-modal" onClick={e => e.stopPropagation()}>
        <div className="amc-modal-hdr">
          <div className="amc-modal-title">📅 Schedule Next Visit</div>
          <button className="amc-modal-close" disabled={busy} onClick={onClose}>×</button>
        </div>
        <div className="amc-modal-body">
          <div className="amc-modal-note">For <strong>{contract.customer}</strong> — {contract.id}. This updates the contract's Next Visit date.</div>
          <div>
            <label className="amc-flabel">Next Visit Date *</label>
            <input type="date" className="amc-finput" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="amc-modal-footer">
          <button className="amc-modal-btn cancel" disabled={busy} onClick={onClose}>Cancel</button>
          <button className="amc-modal-btn save" disabled={busy || !date} onClick={() => onConfirm(date)}>
            {busy ? 'Saving…' : 'Confirm Schedule'}
          </button>
        </div>
      </div>
    </div>, document.body);
};
const GenerateInvoiceModal = ({
  open,
  contract,
  onClose,
  onConfirm,
  busy
}) => {
  const [basis, setBasis] = useState('full'); // 'full' | 'monthly'
  useEffect(() => {
    if (open) setBasis('full');
  }, [open]);
  if (!open || !contract) return null;
  const subtotal = basis === 'full' ? contract.value : Math.round(contract.value / 12);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  return createPortal(<div className="amc-modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="amc-modal" onClick={e => e.stopPropagation()}>
        <div className="amc-modal-hdr">
          <div className="amc-modal-title">💰 Generate Invoice</div>
          <button className="amc-modal-close" disabled={busy} onClick={onClose}>×</button>
        </div>
        <div className="amc-modal-body">
          <div className="amc-modal-note">For <strong>{contract.customer}</strong> — {contract.id}</div>
          <div>
            <label className="amc-flabel">Invoice For</label>
            <div className="ap-amc-page-56">
              <button type="button" className={`amc-toggle ${basis === 'full' ? 'active' : ''}`} onClick={() => setBasis('full')}>Full Contract</button>
              <button type="button" className={`amc-toggle ${basis === 'monthly' ? 'active' : ''}`} onClick={() => setBasis('monthly')}>Monthly</button>
            </div>
          </div>
          <div>
            <div className="amc-inv-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
            <div className="amc-inv-row"><span>GST (18%)</span><span>₹{gst.toLocaleString()}</span></div>
            <div className="amc-inv-total"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
          </div>
        </div>
        <div className="amc-modal-footer">
          <button className="amc-modal-btn cancel" disabled={busy} onClick={onClose}>Cancel</button>
          <button className="amc-modal-btn save" disabled={busy} onClick={() => onConfirm({
          basis,
          subtotal,
          gst,
          total
        })}>
            {busy ? 'Creating…' : 'Generate Invoice'}
          </button>
        </div>
      </div>
    </div>, document.body);
};
const RenewContractModal = ({
  open,
  contract,
  onClose,
  onConfirm,
  busy
}) => {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  useEffect(() => {
    if (!open || !contract) return;
    const currentEnd = new Date(contract.end);
    const baseEnd = !isNaN(currentEnd.getTime()) ? currentEnd : new Date();
    const newStart = new Date(baseEnd);
    newStart.setDate(newStart.getDate() + 1);
    const newEnd = new Date(newStart);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    setStart(newStart.toISOString().slice(0, 10));
    setEnd(newEnd.toISOString().slice(0, 10));
  }, [open, contract]);
  if (!open || !contract) return null;
  return createPortal(<div className="amc-modal-overlay" onClick={busy ? undefined : onClose}>
      <div className="amc-modal" onClick={e => e.stopPropagation()}>
        <div className="amc-modal-hdr">
          <div className="amc-modal-title">🔄 Renew Contract</div>
          <button className="amc-modal-close" disabled={busy} onClick={onClose}>×</button>
        </div>
        <div className="amc-modal-body">
          <div className="amc-modal-note">
            This resets visit progress to <strong>0/{contract.visits}</strong> and extends the contract period for <strong>{contract.customer}</strong> — {contract.id}. Plan and value stay the same.
          </div>
          <div className="amc-modal-grid">
            <div>
              <label className="amc-flabel">New Start Date</label>
              <input type="date" className="amc-finput" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <label className="amc-flabel">New End Date</label>
              <input type="date" className="amc-finput" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="amc-modal-footer">
          <button className="amc-modal-btn cancel" disabled={busy} onClick={onClose}>Cancel</button>
          <button className="amc-modal-btn save" disabled={busy || !start || !end} onClick={() => onConfirm({
          start,
          end
        })}>
            {busy ? 'Renewing…' : 'Confirm Renewal'}
          </button>
        </div>
      </div>
    </div>, document.body);
};

// ─── AMCDetail ────────────────────────────────────────────────────────────────
const AMCDetail = ({
  contract,
  onBack,
  onSave,
  onPatch,
  openModal,
  initialEditMode
}) => {
  const [showPDF, setShowPDF] = useState(false);

  // ── Action modal state ──────────────────────────────────────────────────
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // `onPatch` (amcApi.update + re-normalise, provided by AMCPage) is used
  // here instead of `onSave` because onPatch rethrows on failure so these
  // handlers can show a proper toast — onSave swallows errors internally
  // with alert() for the generic edit-form flow and shouldn't be changed,
  // since EditableDetailView's own save button relies on that behaviour.
  const handleScheduleConfirm = async date => {
    setBusy(true);
    try {
      await onPatch(contract._id, {
        nextVisit: date
      });
      setScheduleOpen(false);
      setToast({
        type: 'success',
        msg: `Next visit scheduled for ${new Date(date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })}.`
      });
    } catch (e) {
      setToast({
        type: 'error',
        msg: e.message || 'Could not schedule the visit.'
      });
    } finally {
      setBusy(false);
    }
  };
  const handleInvoiceConfirm = async ({
    basis,
    subtotal,
    gst,
    total
  }) => {
    setBusy(true);
    try {
      await invoicesApi.create({
        customerName: contract.customer,
        amcRef: contract.id,
        items: [{
          description: `AMC ${contract.plan} Plan (${basis === 'full' ? 'Full Contract' : 'Monthly'}) — ${contract.id}`,
          qty: 1,
          rate: subtotal,
          amount: subtotal
        }],
        subtotal,
        tax: gst,
        total,
        status: 'pending',
        notes: `Auto-generated from AMC ${contract.id}`
      });
      setInvoiceOpen(false);
      setToast({
        type: 'success',
        msg: `Invoice generated for ₹${total.toLocaleString()}.`
      });
    } catch (e) {
      setToast({
        type: 'error',
        msg: e.message || 'Could not generate the invoice.'
      });
    } finally {
      setBusy(false);
    }
  };
  const handleRenewConfirm = async ({
    start,
    end
  }) => {
    setBusy(true);
    try {
      await onPatch(contract._id, {
        start,
        end,
        done: 0,
        status: 'active'
      });
      setRenewOpen(false);
      setToast({
        type: 'success',
        msg: 'Contract renewed.'
      });
    } catch (e) {
      setToast({
        type: 'error',
        msg: e.message || 'Could not renew the contract.'
      });
    } finally {
      setBusy(false);
    }
  };
  const fields = [{
    key: "customer"
  }, {
    key: "plan"
  }, {
    key: "status"
  }, {
    key: "value"
  }, {
    key: "units"
  }, {
    key: "start"
  }, {
    key: "end"
  }, {
    key: "nextVisit"
  }];
  const iStyle = (extra = {}) => ({
    padding: "6px 10px",
    borderRadius: 7,
    border: `1.5px solid ${COLORS.border}`,
    fontSize: 13,
    color: COLORS.h2,
    background: "#FAFAFA",
    fontFamily: FONTS.sans,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    ...extra
  });
  const FL = ({
    children
  }) => <div className="ap-amc-page-57">
      {children}
    </div>;
  return <>
      <style>{MODAL_CSS}</style>

      {toast && <div className={`amc-toast ${toast.type}`}>
          <span>{toast.msg}</span>
          <button className="amc-toast-x" onClick={() => setToast(null)}>×</button>
        </div>}

      <EditableDetailView id={contract.id} breadcrumb="AMC Contracts" onBack={onBack} fields={fields} data={contract} initialEditMode={initialEditMode} onSave={onSave}>
        {({
        editMode,
        editData,
        setEditData
      }) => {
        const val = key => editData[key] ?? contract[key] ?? "";
        const setK = key => e => setEditData(p => ({
          ...p,
          [key]: e.target.value
        }));
        const pct = Math.round(contract.done / contract.visits * 100);
        const planColor = PLAN_COLORS[editMode ? val("plan") : contract.plan] || "#64748B";
        const isActive = (editMode ? val("status") : contract.status) === "active";
        const sidebar = <div className="ap-amc-page-58">
              <div className="ap-amc-page-59">
                <div className="ap-amc-page-60">Actions</div>
                {!editMode ? <>
                    <button className="btn ap-amc-page-61" onClick={() => setScheduleOpen(true)}>
                      📅 Schedule Next Visit
                    </button>
                    <button className="btn ap-amc-page-62" onClick={() => setInvoiceOpen(true)}>
                      💰 Generate Invoice
                    </button>
                    <button className="btn ap-amc-page-63" onClick={() => setRenewOpen(true)}>
                      🔄 Renew Contract
                    </button>
                    {/* ── Download Contract → opens PDF with AMC detail layout ── */}
                    <button className="btn ap-amc-page-64" onClick={() => setShowPDF(true)}>
                      📄 Download Contract
                    </button>
                  </> : <div className="ap-amc-page-65">
                    Actions available in view mode
                  </div>}
              </div>

              <div className="ap-amc-page-66">
                <div className="ap-amc-page-67">⏱ Next Visit Due</div>
                {editMode ? <input value={val("nextVisit")} onChange={setK("nextVisit")} style={iStyle({
              fontSize: 14,
              fontWeight: 800,
              color: "#B45309",
              background: "#FFFBEB",
              border: "1.5px solid #FDE68A"
            })} /> : <>
                    <div className="ap-amc-page-68">{contract.nextVisit}</div>
                    <div className="ap-amc-page-69">{contract.units} unit{contract.units > 1 ? "s" : ""} to service</div>
                  </>}
              </div>
            </div>;
        return <div className="ap-amc-page-70">
              <div className="ap-amc-page-71">
                <div style={{
              border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
              boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.05)"
            }} className="ap-amc-page-72">
                  <div className="ap-amc-page-73">
                    <div className="ap-amc-page-74">
                      <div className="ap-amc-page-75">
                        {editMode ? <>
                            <select value={val("status")} onChange={setK("status")} className="ap-amc-page-76">
                              <option value="active">Active</option>
                              <option value="expiring">Expiring</option>
                            </select>
                            <select value={val("plan")} onChange={setK("plan")} className="ap-amc-page-77">
                              {["Comprehensive", "Premium", "Basic"].map(p => <option key={p}>{p}</option>)}
                            </select>
                          </> : <>
                            <span style={{
                        background: isActive ? "var(--success-bg)" : "var(--warning-bg)",
                        color: isActive ? "var(--success-text)" : "var(--warning-text)"
                      }} className="ap-amc-page-78">
                              {isActive ? "Active" : "Expiring"}
                            </span>
                            <span style={{
                        background: `${planColor}15`,
                        color: planColor
                      }} className="ap-amc-page-79">
                              {contract.plan} Plan
                            </span>
                          </>}
                      </div>
                      {editMode ? <input value={val("customer")} onChange={setK("customer")} style={iStyle({
                    fontSize: 18,
                    fontWeight: 800,
                    marginBottom: 6
                  })} /> : <div className="ap-amc-page-80">{contract.customer}</div>}
                      {editMode ? <div className="ap-amc-page-81">
                          <div className="ap-amc-page-82">
                            <FL>Units</FL>
                            <input value={val("units")} onChange={setK("units")} type="number" style={iStyle({
                        fontSize: 12
                      })} />
                          </div>
                          <div className="ap-amc-page-83">
                            <FL>Start Date</FL>
                            <input value={val("start")} onChange={setK("start")} style={iStyle({
                        fontSize: 12
                      })} />
                          </div>
                          <div className="ap-amc-page-84">
                            <FL>End Date</FL>
                            <input value={val("end")} onChange={setK("end")} style={iStyle({
                        fontSize: 12
                      })} />
                          </div>
                        </div> : <div className="ap-amc-page-85">
                          {contract.units} AC Units · {contract.start} to {contract.end}
                        </div>}
                    </div>
                    <div className="ap-amc-page-86">
                      <div className="ap-amc-page-87">Contract Value</div>
                      {editMode ? <input value={val("value")} onChange={setK("value")} type="number" style={iStyle({
                    fontSize: 22,
                    fontWeight: 800,
                    color: COLORS.brand,
                    fontFamily: FONTS.mono,
                    textAlign: "right",
                    width: 160
                  })} /> : <>
                            <div className="ap-amc-page-88">₹{contract.value.toLocaleString()}</div>
                            <div className="ap-amc-page-89">₹{Math.round(contract.value / 12).toLocaleString()}/mo</div>
                          </>}
                    </div>
                  </div>
                  <div className="ap-amc-page-90">
                    {[["Total Visits/Year", contract.visits], ["Visits Done", contract.done], ["Remaining", contract.visits - contract.done], ["Next Visit", contract.nextVisit]].map(([k, v]) => <div key={k}>
                        <div className="ap-amc-page-91">{k}</div>
                        <div className="ap-amc-page-92">{v}</div>
                      </div>)}
                  </div>
                </div>

                <div className="ap-amc-page-93">
                  <div className="ap-amc-page-94">
                    <div className="ap-amc-page-95">Visit Progress</div>
                    <span className="ap-amc-page-96">{pct}%</span>
                  </div>
                  <div className="ap-amc-page-97">
                    <div style={{
                  width: `${pct}%`
                }} className="ap-amc-page-98" />
                  </div>
                  <div className="ap-amc-page-99">
                    {Array.from({
                  length: contract.visits
                }).map((_, i) => <div key={i} style={{
                  background: i < contract.done ? "var(--success-bg)" : "var(--bg)",
                  border: `1px solid ${i < contract.done ? "#BBF7D0" : COLORS.border}`
                }} className="ap-amc-page-100">
                        <div className="ap-amc-page-101">{i < contract.done ? "✅" : "📅"}</div>
                        <div style={{
                    color: i < contract.done ? "var(--success-text)" : "var(--text-faint)"
                  }} className="ap-amc-page-102">Visit {i + 1}</div>
                        <div className="ap-amc-page-103">{i < contract.done ? "Done" : "Pending"}</div>
                      </div>)}
                  </div>
                </div>
              </div>
              {sidebar}
            </div>;
      }}
      </EditableDetailView>

      {/* ── PDF Preview — amc_contract template (matches detail view) ── */}
      <PDFPreview open={showPDF} onClose={() => setShowPDF(false)} title={contract.id} filename={`amc-contract-${contract.id}`} template="amc_contract" data={contract} />

      {/* ── Action modals ── */}
      <ScheduleVisitModal open={scheduleOpen} contract={contract} busy={busy} onClose={() => !busy && setScheduleOpen(false)} onConfirm={handleScheduleConfirm} />
      <GenerateInvoiceModal open={invoiceOpen} contract={contract} busy={busy} onClose={() => !busy && setInvoiceOpen(false)} onConfirm={handleInvoiceConfirm} />
      <RenewContractModal open={renewOpen} contract={contract} busy={busy} onClose={() => !busy && setRenewOpen(false)} onConfirm={handleRenewConfirm} />
    </>;
};

// ─── AMCPage ──────────────────────────────────────────────────────────────────
const AMCPage = ({
  openModal
}) => {
  const [open, setOpen] = useState(null);
  const [tab, setTab] = useState("contracts");
  const [contracts, setContracts] = useState([]);
  const fetchContracts = () => {
    amcApi.list({
      limit: 200
    }).then(r => setContracts((r.data ?? []).map(normalizeContract))).catch(() => {});
  };
  useEffect(() => {
    fetchContracts();
    window.addEventListener('focus', fetchContracts);
    return () => window.removeEventListener('focus', fetchContracts);
  }, []);
  const [initialEditMode, setInitialEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Search + filters ──────────────────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: filteredContracts
  } = useTableSearch(contracts, ['id', 'customer', 'plan', 'status', 'nextVisit'], {
    plan: '',
    status: ''
  });

  // ── Pagination — contracts tab ────────────────────────────────────────────
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
  } = usePagination(filteredContracts, 10);

  // ── Pagination — visits tab (separate state) ──────────────────────────────
  const {
    paginated: paginatedVisits,
    page: visitsPage,
    totalPages: visitsTotalPages,
    setPage: setVisitsPage,
    pageSize: visitsPageSize,
    setPageSize: setVisitsPageSize,
    from: visitsFrom,
    to: visitsTo,
    total: visitsTotal
  } = usePagination(filteredContracts, 10);

  // ── Export ────────────────────────────────────────────────────────────────
  const {
    exportProps
  } = useExport({
    title: "AMC Contracts",
    filename: "amc-contracts",
    template: "generic_list",
    subtitle: `CoolTech AC Services · AMC Contracts · ${filteredContracts.length} records`,
    docId: "AMC-EXPORT",
    columns: AMC_COLUMNS,
    rows: filteredContracts,
    showTotals: true,
    totalColumns: ["value"]
  });
  const contract = open ? contracts.find(c => c._id === open) : null;
  const totalVal = contracts.reduce((s, c) => s + c.value, 0);
  const totalUnits = contracts.reduce((s, c) => s + c.units, 0);
  const visitsAllTotal = contracts.reduce((s, c) => s + c.visits, 0);
  const visitsDone = contracts.reduce((s, c) => s + c.done, 0);
  const planBreakdown = ["Comprehensive", "Premium", "Basic"].map(p => ({
    plan: p,
    count: contracts.filter(c => c.plan === p).length,
    value: contracts.filter(c => c.plan === p).reduce((s, c) => s + c.value, 0)
  }));

  // Low-level patch helper — calls the backend, re-normalises the response,
  // and updates local state, but (unlike handleSave below) RETHROWS on
  // failure so callers can show their own error UI. Used by the sidebar
  // actions (Schedule / Renew) inside AMCDetail via the `onPatch` prop.
  const saveContract = async (id, patch) => {
    const doc = await amcApi.update(id, patch);
    const normalized = normalizeContract(doc);
    setContracts(prev => prev.map(c => c._id === normalized._id ? normalized : c));
    return normalized;
  };
  const handleSave = async updated => {
    try {
      await saveContract(updated._id, updated);
    } catch (e) {
      alert(e.message);
    }
  };
  const handleBack = () => {
    setOpen(null);
    setInitialEditMode(false);
  };
  const handleDelete = async id => {
    const item = contracts.find(x => (x._id ?? x.id) === id);
    if (item) addToDeleted({
      id: item.id ?? item._id,
      name: item.name ?? item.customer ?? item.id,
      module: 'AMC Contracts',
      by: 'Admin'
    });
    try {
      await amcApi.remove(id);
      setContracts(prev => prev.filter(x => (x._id ?? x.id) !== id));
    } catch (e) {
      alert(e.message);
    }
  };
  if (contract) {
    return <AMCDetail contract={contract} onBack={handleBack} onSave={handleSave} onPatch={saveContract} openModal={openModal} initialEditMode={initialEditMode} />;
  }
  return <div className="fi ap-amc-page-104">
      <div className="ap-amc-page-105">
        <div>
          <div className="ap-amc-page-106">AMC Contracts</div>
          <div className="ap-amc-page-107">Annual Maintenance Contracts · ₹{(totalVal / 100000).toFixed(1)}L recurring revenue</div>
        </div>
        <button className="btn ap-amc-page-108" onClick={() => openModal("new_amc")}>
          + New AMC
        </button>
      </div>

      {/* KPI cards */}
      <div className="ap-amc-page-109">
        <KCard label="Active Contracts" value={contracts.filter(c => c.status === "active").length} sub="live" icon="📋" iconBg="#F0FDF4" color="#16A34A" delay="" />
        <KCard label="Expiring Soon" value={contracts.filter(c => c.status === "expiring").length} sub="renew now" icon="⚠️" iconBg="#FFFBEB" color="#B45309" delay="1" />
        <KCard label="Units Covered" value={totalUnits} sub="AC units" icon="❄️" iconBg="#EFF6FF" color="#0369A1" delay="2" />
        <KCard label="Visit Completion" value={`${Math.round(visitsDone / visitsAllTotal * 100)}%`} sub={`${visitsDone}/${visitsAllTotal} done`} icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="3" />
        <KCard label="Monthly Revenue" value={`₹${(totalVal / 12 / 1000).toFixed(0)}K`} sub="recurring" icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="3" />
      </div>

      {/* Plan breakdown + renewal pipeline */}
      <div className="ap-amc-page-110">
        <div className="ap-amc-page-111">
          <div className="ap-amc-page-112">Plan Breakdown</div>
          {planBreakdown.map(p => <div key={p.plan} className="ap-amc-page-113">
              <div className="ap-amc-page-114">
                <span className="ap-amc-page-115">{p.plan}</span>
                <span className="ap-amc-page-116">{p.count} contracts · ₹{(p.value / 1000).toFixed(0)}K</span>
              </div>
              <div className="ap-amc-page-117">
                <div style={{
              width: `${p.value / totalVal * 100}%`,
              background: PLAN_COLORS[p.plan] || "#64748B"
            }} className="ap-amc-page-118" />
              </div>
            </div>)}
        </div>

        <div className="ap-amc-page-119">
          <div className="ap-amc-page-120">Renewal Pipeline</div>
          {contracts.filter(c => c.status === "expiring").map(c => <div key={c._id} className="ap-amc-page-121">
              <div className="ap-amc-page-122">⚠️</div>
              <div className="ap-amc-page-123">
                <div className="ap-amc-page-124">{c.customer}</div>
                <div className="ap-amc-page-125">{c.units} units · {c.plan} · expires {c.end}</div>
              </div>
              <button className="btn ap-amc-page-126" onClick={() => {
            setInitialEditMode(false);
            setOpen(c._id);
          }}>Renew</button>
            </div>)}
          {contracts.filter(c => c.status === "expiring").length === 0 && <div className="ap-amc-page-127">No contracts expiring soon ✓</div>}
        </div>
      </div>

      {/* Table */}
      <div className="ap-amc-page-128">

        <div className="ap-amc-page-129">
          {["contracts", "visits"].map(t => <button key={t} onClick={() => setTab(t)} style={{
          background: tab === t ? "var(--brand-light)" : "var(--bg)",
          color: tab === t ? "var(--brand)" : "var(--text-muted)",
          border: `1px solid ${tab === t ? COLORS.brand : COLORS.border}`
        }} className="ap-amc-page-130">
              {t}
            </button>)}
          <span className="ap-amc-page-131">
            {from}–{to} of {total} contracts
          </span>
        </div>

        {/* ── Search + Filter + Export ── */}
          <div className="ap-amc-page-132">
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by customer, contract ID, plan…" />
            <FilterSelect value={activeFilters.plan} onChange={val => setFilter("plan", val)} options={["Comprehensive", "Premium", "Basic"]} allLabel="All Plans" />
            <FilterSelect value={activeFilters.status} onChange={val => setFilter("status", val)} options={["active", "expiring"]} allLabel="All Status" />
            <div className="ap-amc-page-133">
                <ExportDropdown {...exportProps} />
              </div>
          </div>

        {/* ── Contracts tab ── */}
        {tab === "contracts" && <>
            <div className="ap-amc-page-134">
              <table className="ap-amc-page-135">
                <Thead cols={["Contract ID", "Customer", "Units", "Plan", "Value", "Period", "Visits", "Next Visit", "Status", ""]} />
                <tbody>
                  {paginated.map((c, i) => <tr key={c._id} className="row ap-amc-page-136" onClick={() => {
                setInitialEditMode(false);
                setOpen(c._id);
              }} style={{
                background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
              }}>
                      <td className="ap-amc-page-137"><span className="ap-amc-page-138">{c.id}</span></td>
                      <td className="ap-amc-page-139">{c.customer}</td>
                      <td className="ap-amc-page-140"><span className="ap-amc-page-141">{c.units}</span></td>
                      <td className="ap-amc-page-142">
                        <span style={{
                    background: `${PLAN_COLORS[c.plan] || "#64748B"}15`,
                    color: PLAN_COLORS[c.plan] || "#64748B"
                  }} className="ap-amc-page-143">{c.plan}</span>
                      </td>
                      <td className="ap-amc-page-144"><span className="ap-amc-page-145">₹{c.value.toLocaleString()}</span></td>
                      <td className="ap-amc-page-146">{c.start} – {c.end}</td>
                      <td className="ap-amc-page-147">
                        <div className="ap-amc-page-148">
                          <div className="ap-amc-page-149">
                            <div style={{
                        width: `${c.done / c.visits * 100}%`
                      }} className="ap-amc-page-150" />
                          </div>
                          <span className="ap-amc-page-151">{c.done}/{c.visits}</span>
                        </div>
                      </td>
                      <td className="ap-amc-page-152">{c.nextVisit}</td>
                      <td className="ap-amc-page-153">
                        <span style={{
                    background: c.status === "active" ? "var(--success-bg)" : "var(--warning-bg)",
                    color: c.status === "active" ? "var(--success-text)" : "var(--warning-text)"
                  }} className="ap-amc-page-154">
                          {c.status === "active" ? "Active" : "Expiring"}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()} className="ap-amc-page-155">
                        <div className="ap-amc-page-156">
                          <button className="btn ap-amc-page-157" onClick={e => {
                      e.stopPropagation();
                      setInitialEditMode(false);
                      setOpen(c._id);
                    }}>
                            📅 Schedule
                          </button>
                          <ActionDropdown onView={() => {
                      setInitialEditMode(false);
                      setOpen(c._id);
                    }} onEdit={() => {
                      setInitialEditMode(true);
                      setOpen(c._id);
                    }} onDelete={() => setDeleteTarget(c._id)} />
                        </div>
                      </td>
                    </tr>)}
                  {paginated.length === 0 && <tr>
                      <td colSpan={10} className="ap-amc-page-158">
                        No contracts match your search or filters.
                      </td>
                    </tr>}
                </tbody>
              </table>
            </div>
            {/* ── Pagination ── */}
            <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
          </>}

        {/* ── Visits tab ── */}
        {tab === "visits" && <>
            <div className="ap-amc-page-159">
              <table className="ap-amc-page-160">
                <Thead cols={["Contract", "Customer", "Plan", "Visits/Year", "Done", "Remaining", "% Complete", "Next Visit", "Action"]} />
                <tbody>
                  {paginatedVisits.map((c, i) => {
                const pct = Math.round(c.done / c.visits * 100);
                return <tr key={c._id} className="row ap-amc-page-161" style={{
                  background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
                }}>
                        <td className="ap-amc-page-162"><span className="ap-amc-page-163">{c.id}</span></td>
                        <td className="ap-amc-page-164">{c.customer}</td>
                        <td className="ap-amc-page-165">
                          <span style={{
                      background: `${PLAN_COLORS[c.plan] || "#64748B"}15`,
                      color: PLAN_COLORS[c.plan] || "#64748B"
                    }} className="ap-amc-page-166">{c.plan}</span>
                        </td>
                        <td className="ap-amc-page-167">{c.visits}</td>
                        <td className="ap-amc-page-168">{c.done}</td>
                        <td style={{
                    color: c.visits - c.done > 0 ? "var(--warning-text)" : "var(--text-faint)"
                  }} className="ap-amc-page-169">{c.visits - c.done}</td>
                        <td className="ap-amc-page-170">
                          <div className="ap-amc-page-171">
                            <div className="ap-amc-page-172">
                              <div style={{
                          width: `${pct}%`,
                          background: pct === 100 ? "var(--success)" : "var(--brand)"
                        }} className="ap-amc-page-173" />
                            </div>
                            <span style={{
                        color: pct === 100 ? "var(--success-text)" : "var(--brand)"
                      }} className="ap-amc-page-174">{pct}%</span>
                          </div>
                        </td>
                        <td className="ap-amc-page-175">{c.nextVisit}</td>
                        <td className="ap-amc-page-176">
                          <button className="btn ap-amc-page-177" onClick={() => {
                      setInitialEditMode(false);
                      setOpen(c._id);
                    }}>📅 Book</button>
                        </td>
                      </tr>;
              })}
                  {paginatedVisits.length === 0 && <tr>
                      <td colSpan={9} className="ap-amc-page-178">
                        No contracts match your search or filters.
                      </td>
                    </tr>}
                </tbody>
              </table>
            </div>
            {/* ── Pagination for visits tab ── */}
            <Pagination page={visitsPage} totalPages={visitsTotalPages} setPage={setVisitsPage} pageSize={visitsPageSize} setPageSize={setVisitsPageSize} from={visitsFrom} to={visitsTo} total={visitsTotal} />
          </>}
      </div>

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} message="This AMC contract will be permanently removed." />
    </div>;
};
export default AMCPage;