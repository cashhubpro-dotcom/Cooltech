import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Search, Download, CheckCircle2, XCircle, ArrowLeft, Phone, Mail, MapPin, ChevronRight, X, MessageSquare, Loader2 } from 'lucide-react';
import { clientQuotationsApi } from '../services/clientPortalApi';

/* ────────────────────────────────────────────────────────────────────────
   BRAND ASSETS — same two files the admin panel uses, so both portals
   render an identical letterhead.
──────────────────────────────────────────────────────────────────────── */
import logoImg from '../assets/logo.png';
import signatureImg from '../assets/signature.png';
import { fmtDateDMY } from '../../../shared/formatDate';
const Logo = () => <img src={logoImg} alt="Alisha Engineering" className="cp-quotations-page-1" />;
const Signature = () => <img src={signatureImg} alt="Signature" className="cp-quotations-page-2" />;

/* ────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — mirrors the brand used across the CoolTech admin panel
   (orange brand accent, slate neutrals). Swap this object for your real
   '../constants/tokens' import when you drop this into the project.
──────────────────────────────────────────────────────────────────────── */
const COLORS = {
  brand: "var(--brand)",
  brandD: "var(--brand-dark)",
  brandL: "var(--brand-light)",
  h1: "var(--text-h1)",
  h2: "var(--text-h2)",
  body: "var(--text-muted)",
  muted: "var(--text-muted)",
  faint: "var(--text-faint)",
  border: "var(--border)",
  bg: "var(--bg)",
  white: "var(--white)",
  success: "var(--success-text)",
  successBg: "var(--success-bg)",
  successBorder: "var(--success-border)",
  danger: "var(--danger-text)",
  dangerBg: "var(--danger-bg)",
  dangerBorder: "var(--danger-border)",
  info: "var(--info-text)",
  infoBg: "var(--info-bg)",
  infoBorder: "var(--info-border)"
};
const FONTS = {
  sans: "'Inter', -apple-system, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, Menlo, monospace"
};

/* ────────────────────────────────────────────────────────────────────────
   VENDOR — exact values from the admin panel's QuotationsPage.jsx, so both
   portals render an identical letterhead alongside the shared logo/signature.
──────────────────────────────────────────────────────────────────────── */
const VENDOR = {
  company: 'Alisha Engineering',
  address: 'L.I.G-II -164 G.I.D.C HOUSING BOARD NEAR CHHOTALAL CHAR RASTA BESIDE SWAMINARAYAN MANDIR ODAHAV AHMEDABAD-382415',
  contact: 'Vakil Yadav',
  phone: '9724763909',
  email: 'alishaengineering@gmail.com'
};
const STATUS_MAP = {
  sent: {
    label: 'Pending your approval',
    color: "var(--warning-text)",
    bg: "var(--warning-bg)",
    border: "var(--warning-border)"
  },
  approved: {
    label: 'Approved',
    color: COLORS.success,
    bg: COLORS.successBg,
    border: COLORS.successBorder
  },
  rejected: {
    label: 'Rejected',
    color: COLORS.danger,
    bg: COLORS.dangerBg,
    border: COLORS.dangerBorder
  },
  expired: {
    label: 'Expired',
    color: "var(--text-muted)",
    bg: "var(--bg)",
    border: "var(--border)"
  }
};

/* ────────────────────────────────────────────────────────────────────────
   normaliseQuot — maps a raw Quotation doc from GET /me/quotations into the
   shape the templates/table use. Mirrors the admin panel's normaliseQuot()
   so both portals render an identical letterhead from the same record.
──────────────────────────────────────────────────────────────────────── */
const normaliseQuot = q => ({
  ...q,
  id: q.quotId || q._id,
  customer: typeof q.customer === 'object' ? q.customer?.name || q.customerName : q.customerName || '',
  contact: q.contact || '',
  phone: q.phone || '',
  email: q.email || '',
  address: q.address || '',
  type: q.type || 'Service',
  items: Array.isArray(q.items) ? q.items : [],
  subtotal: q.subtotal ?? 0,
  gst: q.gst ?? 0,
  taxPercent: q.taxPercent ?? '',
  total: q.total ?? 0,
  status: q.status || 'sent',
  created: q.createdAt ?fmtDateDMY(new Date(q.createdAt)) : q.created || '',
  valid: q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : q.valid || '',
  template: q.template || 'alisha',
  fields: Array.isArray(q.fields) ? q.fields : [],
  notes: q.notes || '',
  terms: q.terms || '',
  statusNote: q.statusNote || ''
});

/* ────────────────────────────────────────────────────────────────────────
   SMALL UI PRIMITIVES
──────────────────────────────────────────────────────────────────────── */
const SBadge = ({
  s
}) => {
  const m = STATUS_MAP[s] || STATUS_MAP.sent;
  return <span style={{
    background: m.bg,
    color: m.color,
    border: `1px solid ${m.border}`
  }} className="cp-quotations-page-3">
      <span style={{
      background: m.color
    }} className="cp-quotations-page-4" />{m.label}
    </span>;
};
const TypeTag = ({
  type
}) => <span className="cp-quotations-page-5">{type}</span>;
const KCard = ({
  label,
  value,
  sub,
  icon,
  color,
  delay
}) => <div className={`${`fade-up d${delay}`} cp-quotations-page-6`}>
    <div className="cp-quotations-page-7">
      <span className="cp-quotations-page-8">{label}</span>
      <span style={{
      background: `${color}17`,
      color
    }} className="cp-quotations-page-9">{icon}</span>
    </div>
    <div className="cp-quotations-page-10">{value}</div>
    <div className="cp-quotations-page-11">{sub}</div>
  </div>;
const Toast = ({
  msg,
  onClose
}) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className="cp-quotations-page-12">
      <CheckCircle2 size={16} color="#4ADE80" /> {msg}
    </div>;
};

/* Generic modal shell */
const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  wide
}) => {
  if (!open) return null;
  return <div onClick={onClose} className="cp-quotations-page-13">
      <div onClick={e => e.stopPropagation()} style={{
      width: wide ? "640px" : "440px"
    }} className="cp-quotations-page-14">
        <div className="cp-quotations-page-15">
          <div className="cp-quotations-page-16">{title}</div>
          <button onClick={onClose} className="cp-quotations-page-17"><X size={18} /></button>
        </div>
        <div className="cp-quotations-page-18">{children}</div>
        {footer && <div className="cp-quotations-page-19">{footer}</div>}
      </div>
    </div>;
};

/* ────────────────────────────────────────────────────────────────────────
   DOCUMENT TEMPLATES — same rendering logic/branching as the admin panel
   (quot.template === 'alisha' | 'generic'), read-only for the client view.
──────────────────────────────────────────────────────────────────────── */
const LetterDocView = ({
  quot
}) => {
  const NAVY = '#1a2e5c';
  const fm = FONTS.mono;
  const cell = (extra = {}) => ({
    border: `1px solid ${NAVY}`,
    padding: '5px 8px',
    fontSize: 12,
    color: '#111',
    verticalAlign: 'top',
    ...extra
  });
  return <div className="cp-quotations-page-20">
      <div className="cp-quotations-page-21">
        <div className="cp-quotations-page-22">
          <div className="cp-quotations-page-23">
            Installation Maintenance &amp; Repair of Air Conditioning,<br />Electronics Appliance, Fabrication &amp; Insulation Works.
          </div>
          <div className="cp-quotations-page-24">{VENDOR.address}</div>
        </div>
        <div className="cp-quotations-page-25"><Logo /></div>
      </div>
      <div className="cp-quotations-page-26">
        <div className="cp-quotations-page-27"><strong>Date:</strong> {quot.created}</div>
        <br />
        <span className="cp-quotations-page-28">
          SUBJECT: QUOTATION FOR&nbsp;<span className="cp-quotations-page-29">{quot.type}</span>
        </span>
      </div>
      <table className="cp-quotations-page-30">
        <tbody>
          <tr>
            <td style={cell({
            background: NAVY,
            color: 'white',
            fontWeight: 700,
            textAlign: 'center',
            width: '50%',
            fontSize: 12
          })}>Vendor Details:</td>
            <td style={cell({
            background: NAVY,
            color: 'white',
            fontWeight: 700,
            textAlign: 'center',
            fontSize: 12
          })}>Client Details:</td>
          </tr>
          <tr>
            <td style={cell()}><b>Company Name: </b>{VENDOR.company}</td>
            <td style={cell()}><b>Company Name: </b>{quot.customer}</td>
          </tr>
          <tr>
            <td style={cell()}><b>Address: </b>{VENDOR.address}</td>
            <td style={cell()}><b>Address: </b>{quot.address || '—'}</td>
          </tr>
          <tr>
            <td style={cell()}><b>Contact Person: </b>{VENDOR.contact}</td>
            <td style={cell()}><b>Contact Person: </b>{quot.contact}</td>
          </tr>
          <tr>
            <td style={cell()}><b>Phone No: </b>{VENDOR.phone}</td>
            <td style={cell()}><b>Phone No: </b>{quot.phone}</td>
          </tr>
          <tr>
            <td style={cell()}><b>Email: </b>{VENDOR.email}</td>
            <td style={cell()}><b>Email: </b>{quot.email || '—'}</td>
          </tr>
        </tbody>
      </table>
      <table className="cp-quotations-page-31">
        <thead>
          <tr className="cp-quotations-page-32">
            {[{
            l: 'SR. NO',
            w: '9%'
          }, {
            l: 'DESCRIPTION',
            w: '42%'
          }, {
            l: 'QTY',
            w: '10%'
          }, {
            l: 'RATE',
            w: '17%'
          }, {
            l: 'TOTAL',
            w: '22%'
          }].map(c => <th key={c.l} style={{
            width: c.w
          }} className="cp-quotations-page-33">{c.l}</th>)}
          </tr>
        </thead>
        <tbody>
          {quot.items.map((item, i) => <tr key={i}>
              <td style={cell({
            textAlign: 'center',
            fontFamily: fm
          })}>{i + 1}</td>
              <td style={cell()}>{item.desc}</td>
              <td style={cell({
            textAlign: 'center',
            fontFamily: fm
          })}>{item.qty}</td>
              <td style={cell({
            textAlign: 'right',
            fontFamily: fm
          })}>₹{Number(item.rate).toLocaleString()}</td>
              <td style={cell({
            textAlign: 'right',
            fontFamily: fm,
            fontWeight: 700
          })}>₹{(item.qty * item.rate).toLocaleString()}</td>
            </tr>)}
          <tr><td colSpan={3} className="cp-quotations-page-34" /><td style={cell({
            textAlign: 'right',
            fontWeight: 700
          })}>SUBTOTAL</td><td style={cell({
            textAlign: 'right',
            fontFamily: fm
          })}>₹{quot.subtotal.toLocaleString()}</td></tr>
          <tr><td colSpan={3} className="cp-quotations-page-35" /><td style={cell({
            textAlign: 'right',
            fontWeight: 700
          })}>GST</td><td style={cell({
            textAlign: 'right',
            fontFamily: fm
          })}>₹{quot.gst.toLocaleString()}</td></tr>
          <tr><td colSpan={3} className="cp-quotations-page-36" /><td style={cell({
            textAlign: 'right',
            fontWeight: 700,
            fontSize: 13
          })}>TOTAL</td><td style={cell({
            textAlign: 'right',
            fontFamily: fm,
            fontWeight: 800,
            fontSize: 13
          })}>₹{quot.total.toLocaleString()}</td></tr>
        </tbody>
      </table>
      {(quot.notes || quot.terms) && <div className="cp-quotations-page-37">
          {quot.notes && <div className="cp-quotations-page-38"><div className="cp-quotations-page-39">NOTES</div><div className="cp-quotations-page-40">{quot.notes}</div></div>}
          {quot.terms && <div><div className="cp-quotations-page-41">TERMS &amp; CONDITIONS</div><div className="cp-quotations-page-42">{quot.terms}</div></div>}
        </div>}
      <div className="cp-quotations-page-43">
        <div className="cp-quotations-page-44">
          <div>Thanking You,</div><div className="cp-quotations-page-45">Mr. {VENDOR.contact}</div><div>{VENDOR.phone}</div><div>From: {VENDOR.company}</div>
        </div>
        <div className="cp-quotations-page-46"><Signature /></div>
        <div className="cp-quotations-page-47">[Authorized Signatory]</div>
      </div>
    </div>;
};
const GenericDocView = ({
  quot
}) => {
  const fm = FONTS.mono;
  const cell = (extra = {}) => ({
    border: `1px solid ${COLORS.border}`,
    padding: '8px 10px',
    fontSize: 13,
    color: COLORS.body,
    verticalAlign: 'top',
    ...extra
  });
  const label = {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: .4
  };
  return <div className="cp-quotations-page-48">
      <div className="cp-quotations-page-49">
        <div>
          <div className="cp-quotations-page-50">{VENDOR.company}</div>
          <div className="cp-quotations-page-51">Quotation</div>
        </div>
        <div className="cp-quotations-page-52">{quot.id}</div>
      </div>
      <div className="cp-quotations-page-53">
        <div><div className="cp-quotations-page-54">Date</div><div className="cp-quotations-page-55">{quot.created}</div></div>
        {!(quot.fields || []).some(f => f.label?.toLowerCase().includes('valid')) && <div><div className="cp-quotations-page-54">Valid Till</div><div className="cp-quotations-page-56">{quot.valid}</div></div>}
        {(quot.fields || []).map((f, i) => <div key={i}><div className="cp-quotations-page-54">{f.label}</div><div className="cp-quotations-page-57">{f.value}</div></div>)}
      </div>
      <div className="cp-quotations-page-58">
        <div className="cp-quotations-page-54">For</div>
        <div className="cp-quotations-page-59">{quot.customer}</div>
        <div className="cp-quotations-page-60">{quot.address || '—'}</div>
      </div>
      <table className="cp-quotations-page-61">
        <thead>
          <tr className="cp-quotations-page-62">
            {['Item Description', 'Qty', 'Price', 'Amount'].map(h => <th key={h} style={{
            textAlign: h === 'Item Description' ? "left" : "right"
          }} className="cp-quotations-page-63">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {quot.items.map((item, i) => <tr key={i}>
              <td style={cell()}>{item.desc}</td>
              <td style={cell({
            textAlign: 'right',
            fontFamily: fm
          })}>{item.qty}</td>
              <td style={cell({
            textAlign: 'right',
            fontFamily: fm
          })}>₹{Number(item.rate).toLocaleString()}</td>
              <td style={cell({
            textAlign: 'right',
            fontFamily: fm,
            fontWeight: 700
          })}>₹{(item.qty * item.rate).toLocaleString()}</td>
            </tr>)}
        </tbody>
      </table>
      <div className="cp-quotations-page-64">
        <div className="cp-quotations-page-65">
          <div className="cp-quotations-page-54">Terms &amp; Conditions</div>
          <div className="cp-quotations-page-66">{quot.terms || '—'}</div>
        </div>
        <div className="cp-quotations-page-67">
          {[['Subtotal', `₹${quot.subtotal.toLocaleString()}`], ['Tax', quot.taxPercent ? `${quot.taxPercent}%` : '—'], ['Tax Amount', `₹${quot.gst.toLocaleString()}`]].map(([k, v]) => <div key={k} className="cp-quotations-page-68">
              <span className="cp-quotations-page-69">{k}</span><span className="cp-quotations-page-70">{v}</span>
            </div>)}
          <div className="cp-quotations-page-71">
            <span className="cp-quotations-page-72">Total</span><span className="cp-quotations-page-73">₹{quot.total.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="cp-quotations-page-74">
        <div className="cp-quotations-page-75">Prepared By</div>
        <div className="cp-quotations-page-76">Customer Signature</div>
      </div>
    </div>;
};
const DocFrame = ({
  quot
}) => <div id="quot-print-area" className="cp-quotations-page-77">
    {quot.template === 'generic' ? <GenericDocView quot={quot} /> : <LetterDocView quot={quot} />}
  </div>;

/* ────────────────────────────────────────────────────────────────────────
   PDF PREVIEW MODAL — uses the exact same doc template as above, prints
   only the document via @media print (this is where a real backend would
   swap in a generated PDF file).
──────────────────────────────────────────────────────────────────────── */
const PDFPreviewModal = ({
  quot,
  onClose
}) => {
  if (!quot) return null;
  return createPortal(<div className="pdf-modal-overlay cp-quotations-page-78">
      <div className="pdf-modal cp-quotations-page-79">
        <div className="no-print cp-quotations-page-80">
          <div className="cp-quotations-page-81">Quotation Preview — {quot.id}</div>
          <div className="cp-quotations-page-82">
            <button onClick={() => window.print()} className="cp-quotations-page-83">
              <Download size={13} /> Download PDF
            </button>
            <button onClick={onClose} className="cp-quotations-page-84"><X size={18} /></button>
          </div>
        </div>
        <div className="pdf-modal-body cp-quotations-page-85">
          <DocFrame quot={quot} />
        </div>
      </div>
    </div>, document.getElementById('client-portal-root') || document.body);
};

/* ────────────────────────────────────────────────────────────────────────
   BREAKPOINT HOOK
──────────────────────────────────────────────────────────────────────── */
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return {
    isMobile: w < 720
  };
}

/* ────────────────────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────────────────────── */
const ClientQuotationsPage = () => {
  const {
    isMobile
  } = useBreakpoint();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [toast, setToast] = useState(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const fetchQuotations = () => {
    setLoading(true);
    setLoadError(null);
    clientQuotationsApi.list().then(res => setQuotations((res.data || []).map(normaliseQuot))).catch(err => setLoadError(err.message || 'Could not load quotations.')).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchQuotations();
  }, []);
  const quot = openId ? quotations.find(x => x.id === openId) : null;
  const filtered = useMemo(() => quotations.filter(x => (!q || `${x.id} ${x.type} ${x.customer}`.toLowerCase().includes(q.toLowerCase())) && (!statusFilter || x.status === statusFilter) && (!typeFilter || x.type === typeFilter)), [quotations, q, statusFilter, typeFilter]);
  const counts = {
    total: quotations.length,
    pending: quotations.filter(x => x.status === 'sent').length,
    approved: quotations.filter(x => x.status === 'approved').length,
    value: quotations.filter(x => x.status === 'approved').reduce((s, x) => s + x.total, 0)
  };
  const updateQuotStatus = async (status, reason) => {
    setActionBusy(true);
    try {
      // _id is the raw Mongo id; normaliseQuot keeps it alongside the friendly `id` (quotId).
      const res = await clientQuotationsApi.updateStatus(quot._id || quot.id, {
        status,
        reason
      });
      setQuotations(prev => prev.map(x => x.id === quot.id ? normaliseQuot(res.data) : x));
      return true;
    } catch (err) {
      setToast(err.message || `Could not update ${quot.id}. Please try again.`);
      return false;
    } finally {
      setActionBusy(false);
    }
  };
  const handleApprove = async () => {
    const ok = await updateQuotStatus('approved');
    setShowApprove(false);
    if (ok) setToast(`${quot.id} approved — the vendor has been notified.`);
  };
  const handleReject = async () => {
    const ok = await updateQuotStatus('rejected', rejectReason);
    setShowReject(false);
    if (ok) setToast(`${quot.id} rejected. The vendor will follow up.`);
    setRejectReason('');
  };

  /* ── Detail view ──────────────────────────────────────────────────── */
  if (quot) {
    const m = STATUS_MAP[quot.status];
    return <div className="qp-root">
        <style>{CSS}</style>
        <div className="fade-up cp-quotations-page-86">
          <div className="quot-top-bar">
            <button onClick={() => setOpenId(null)} className="back-btn"><ArrowLeft size={15} /> Back</button>
            <span className="cp-quotations-page-87">Quotations <ChevronRight size={12} className="cp-quotations-page-88" /></span>
            <span className="cp-quotations-page-89">{quot.id}</span>
            {/* <div className="quot-top-actions">
              {quot.status === 'sent' && (
                <>
                  <button onClick={() => setShowReject(true)} className="btn btn-danger-ghost"><XCircle size={14} /> Reject</button>
                  <button onClick={() => setShowApprove(true)} className="btn btn-primary"><CheckCircle2 size={14} /> Approve</button>
                </>
              )}
              <button onClick={() => setShowPDF(true)} className="btn btn-info"><Download size={14} /> Download PDF</button>
             </div> */}
          </div>

          {quot.status === 'sent' && <div className="notice-bar">⏳ This quotation is awaiting your approval. Review the details below before you approve or reject it.</div>}

          <div className="quot-detail-grid">
            <DocFrame quot={quot} />

            <div className="quot-detail-sidebar">
              <div className="side-card">
                <div className="side-title">Actions</div>
                <div className="cp-quotations-page-90">
                  {quot.status === 'sent' && <button onClick={() => setShowApprove(true)} className="btn btn-primary cp-quotations-page-91"><CheckCircle2 size={14} /> Approve Quotation</button>}
                  {quot.status === 'sent' && <button onClick={() => setShowReject(true)} className="btn btn-danger-ghost cp-quotations-page-92"><XCircle size={14} /> Reject Quotation</button>}
                  <button onClick={() => setShowPDF(true)} className="btn btn-info cp-quotations-page-93"><Download size={14} /> Download PDF</button>
                  <button onClick={() => setShowContact(true)} className="btn btn-ghost cp-quotations-page-94"><MessageSquare size={14} /> Contact Vendor</button>
                </div>
              </div>

              <div className="side-card">
                <div className="side-title">Quote Info</div>
                {[['Quote ID', quot.id], ['Type', quot.type], ['Created', quot.created], ['Valid Till', quot.valid], ['Items', `${quot.items.length} line items`]].map(([k, v]) => <div key={k} className="info-row"><span>{k}</span><span style={{
                  fontFamily: k === 'Quote ID' ? "'JetBrains Mono', ui-monospace, Menlo, monospace" : "'Inter', -apple-system, 'Segoe UI', sans-serif"
                }} className="cp-quotations-page-95">{v}</span></div>)}
                <div className="info-row cp-quotations-page-96"><span>Status</span><SBadge s={quot.status} /></div>
              </div>

              {/* <div className="side-card">
                <div className="side-title">Vendor</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 8 }}>{VENDOR.company}</div>
                <div className="contact-line"><Phone size={12} /> {VENDOR.phone}</div>
                <div className="contact-line"><Mail size={12} /> {VENDOR.email}</div>
                <div className="contact-line"><MapPin size={12} /> {VENDOR.address}</div>
               </div> */}

              <div className="total-card">
                <div className="cp-quotations-page-97">Total (incl. GST)</div>
                <div className="cp-quotations-page-98">₹{quot.total.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Approve modal */}
        <Modal open={showApprove} onClose={() => !actionBusy && setShowApprove(false)} title="Approve quotation?" footer={<>
            <button onClick={() => setShowApprove(false)} className="btn btn-ghost" disabled={actionBusy}>Cancel</button>
            <button onClick={handleApprove} className="btn btn-primary" disabled={actionBusy}>
              {actionBusy ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />} {actionBusy ? 'Approving…' : 'Yes, Approve'}
            </button>
          </>}>
          <p className="cp-quotations-page-99">
            You're about to approve <strong>{quot.id}</strong> for <strong>₹{quot.total.toLocaleString()}</strong>. {VENDOR.company} will be notified and may proceed with scheduling the work.
          </p>
        </Modal>

        {/* Reject modal */}
        <Modal open={showReject} onClose={() => !actionBusy && setShowReject(false)} title="Reject quotation?" footer={<>
            <button onClick={() => setShowReject(false)} className="btn btn-ghost" disabled={actionBusy}>Cancel</button>
            <button onClick={handleReject} className="btn btn-danger" disabled={actionBusy}>
              {actionBusy ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />} {actionBusy ? 'Rejecting…' : 'Reject'}
            </button>
          </>}>
          <p className="cp-quotations-page-100">Let {VENDOR.company} know why — this helps them send a revised quotation.</p>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} placeholder="e.g. Price is above budget, please revise…" className="cp-quotations-page-101" />
        </Modal>

        {/* Contact vendor modal */}
        <Modal open={showContact} onClose={() => setShowContact(false)} title={`Contact ${VENDOR.company}`}>
          <div className="contact-line cp-quotations-page-102"><Phone size={14} /> {VENDOR.phone}</div>
          <div className="contact-line cp-quotations-page-103"><Mail size={14} /> {VENDOR.email}</div>
          <div className="contact-line cp-quotations-page-104"><MapPin size={14} /> {VENDOR.address}</div>
        </Modal>

        {showPDF && <PDFPreviewModal quot={quot} onClose={() => setShowPDF(false)} />}
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </div>;
  }

  /* ── List view ────────────────────────────────────────────────────── */
  return <div className="qp-root">
      <style>{CSS}</style>
      <div className="fade-up cp-quotations-page-105">
        <div className="cp-quotations-page-106">
          <div>
            <div className="cp-quotations-page-107">Quotations</div>
            <div className="cp-quotations-page-108">Review and approve service quotations sent by {VENDOR.company}</div>
          </div>
        </div>

        <div className="quot-kpi-grid">
          <KCard label="Total Quotes" value={counts.total} sub="all time" icon={<FileText size={15} />} color={COLORS.brand} delay="1" />
          <KCard label="Pending Approval" value={counts.pending} sub="needs your review" icon={<CheckCircle2 size={15} />} color="#B45309" delay="2" />
          <KCard label="Approved" value={counts.approved} sub="in progress / scheduled" icon={<CheckCircle2 size={15} />} color={COLORS.success} delay="3" />
          <KCard label="Approved Value" value={`₹${(counts.value / 1000).toFixed(0)}K`} sub="total approved spend" icon={<FileText size={15} />} color="#CA8A04" delay="4" />
        </div>

        <div className="table-card">
          <div className="table-toolbar">
            <div className="search-box">
              <Search size={14} color={COLORS.faint} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by quote ID or type…" />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="filter-select">
              <option value="">All Types</option>
              {['Service', 'Repair', 'Installation', 'AMC'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
              <option value="">All Status</option>
              {Object.keys(STATUS_MAP).map(s => <option key={s} value={s}>{STATUS_MAP[s].label}</option>)}
            </select>
          </div>

          {loading && <div className="cp-quotations-page-109">
              <Loader2 size={16} className="spin" /> Loading your quotations…
            </div>}

          {!loading && loadError && <div className="cp-quotations-page-110">
              <div className="cp-quotations-page-111">{loadError}</div>
              <button onClick={fetchQuotations} className="btn btn-ghost btn-sm">Try again</button>
            </div>}

          {!loading && !loadError && !isMobile && <div className="cp-quotations-page-112">
              <table className="quot-table">
                <thead>
                  <tr>{['Quote ID', 'Type', 'Items', 'Total', 'Valid Till', 'Status', ''].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => <tr key={r.id} className="row" onClick={() => setOpenId(r.id)} style={{
                background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
              }}>
                      <td><span className="cp-quotations-page-113">{r.id}</span></td>
                      <td><TypeTag type={r.type} /></td>
                      <td className="cp-quotations-page-114">{r.items.length} items</td>
                      <td><span className="cp-quotations-page-115">₹{r.total.toLocaleString()}</span></td>
                      <td style={{
                  color: r.status === 'expired' ? "var(--danger-text)" : "var(--text-muted)"
                }} className="cp-quotations-page-116">{r.valid}</td>
                      <td><SBadge s={r.status} /></td>
                      <td onClick={e => e.stopPropagation()}>
                        {r.status === 'sent' ? <button onClick={() => setOpenId(r.id)} className="btn btn-primary btn-sm">View &amp; Approve →</button> : <button onClick={() => setOpenId(r.id)} className="btn btn-ghost btn-sm">View →</button>}
                      </td>
                    </tr>)}
                  {filtered.length === 0 && <tr><td colSpan={7} className="cp-quotations-page-117">No quotations match your filters.</td></tr>}
                </tbody>
              </table>
            </div>}

          {!loading && !loadError && isMobile && <div className="cp-quotations-page-118">
              {filtered.map(r => <div key={r.id} onClick={() => setOpenId(r.id)} className="mobile-card">
                  <div className="cp-quotations-page-119">
                    <div>
                      <div className="cp-quotations-page-120">
                        <span className="cp-quotations-page-121">{r.id}</span>
                        <TypeTag type={r.type} />
                      </div>
                      <SBadge s={r.status} />
                    </div>
                    <div className="cp-quotations-page-122">
                      <div className="cp-quotations-page-123">Total</div>
                      <div className="cp-quotations-page-124">₹{r.total.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="cp-quotations-page-125">Valid until {r.valid} · {r.items.length} items</div>
                </div>)}
              {filtered.length === 0 && <div className="cp-quotations-page-126">No quotations match your filters.</div>}
            </div>}
        </div>
      </div>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>;
};
const CSS = `
  .qp-root { font-family: ${FONTS.sans}; color: ${COLORS.body}; }
  .fade-up { animation: fadeUp .35s ease both; }
  .fade-up.d1 { animation-delay: .02s; } .fade-up.d2 { animation-delay: .06s; }
  .fade-up.d3 { animation-delay: .10s; } .fade-up.d4 { animation-delay: .14s; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .spin { animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .quot-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  @media (max-width: 900px) { .quot-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px) { .quot-kpi-grid { grid-template-columns: 1fr; } }

  .table-card { background: ${COLORS.white}; border-radius: 14px; border: 1px solid ${COLORS.border}; box-shadow: 0 1px 4px rgba(0,0,0,.05); overflow: hidden; }
  .table-toolbar { padding: 12px 16px; border-bottom: 1px solid ${COLORS.border}; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .search-box { display: flex; align-items: center; gap: 8px; border: 1px solid ${COLORS.border}; border-radius: 9px; padding: 7px 12px; background: ${COLORS.bg}; flex: 1; min-width: 180px; }
  .search-box input { border: none; background: none; outline: none; font-size: 13px; width: 100%; font-family: inherit; color: ${COLORS.h2}; }
  .filter-select { border: 1px solid ${COLORS.border}; border-radius: 9px; padding: 7px 10px; font-size: 12px; font-family: inherit; color: ${COLORS.h2}; background: ${COLORS.white}; cursor: pointer; }

  .quot-table { width: 100%; border-collapse: collapse; min-width: 720px; }
  .quot-table th { text-align: left; padding: 11px 14px; font-size: 11px; font-weight: 700; color: ${COLORS.faint}; text-transform: uppercase; letter-spacing: .3px; border-bottom: 1px solid ${COLORS.border}; }
  .quot-table td { padding: 13px 14px; border-bottom: 1px solid ${COLORS.border}22; font-size: 13px; }
  .quot-table tr.row { cursor: pointer; transition: background .15s; }
  .quot-table tr.row:hover { background: ${COLORS.brandL} !important; }

  .mobile-card { border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 14px; cursor: pointer; transition: box-shadow .15s, transform .15s; background: ${COLORS.white}; }
  .mobile-card:active { transform: scale(.98); }

  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 9px; font-size: 12px; font-weight: 700; cursor: pointer; border: none; font-family: inherit; white-space: nowrap; transition: filter .15s; }
  .btn:hover { filter: brightness(.96); }
  .btn-sm { padding: 6px 12px; }
  .btn-primary { background: linear-gradient(135deg, ${COLORS.brand}, ${COLORS.brandD}); color: #fff; box-shadow: 0 3px 10px ${COLORS.brand}40; }
  .btn-info { background: ${COLORS.infoBg}; color: ${COLORS.info}; border: 1px solid ${COLORS.infoBorder}; }
  .btn-danger { background: ${COLORS.danger}; color: #fff; }
  .btn-danger-ghost { background: ${COLORS.dangerBg}; color: ${COLORS.danger}; border: 1px solid ${COLORS.dangerBorder}; }
  .btn-ghost { background: ${COLORS.white}; color: ${COLORS.body}; border: 1px solid ${COLORS.border}; }

  .quot-top-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .quot-top-actions { display: flex; gap: 8px; margin-left: auto; flex-wrap: wrap; }
  .back-btn { display: flex; align-items: center; gap: 6px; border: 1px solid ${COLORS.border}; background: ${COLORS.white}; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; color: ${COLORS.body}; }

  .notice-bar { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 10px 14px; font-size: 12px; color: #92400E; }

  .quot-detail-grid { display: grid; grid-template-columns: 1.7fr 1fr; gap: 16px; align-items: start; }
  @media (max-width: 900px) { .quot-detail-grid { grid-template-columns: 1fr; } }
  .quot-detail-sidebar { display: flex; flex-direction: column; gap: 12px;}

  .side-card { background: ${COLORS.white}; border-radius: 12px; border: 1px solid ${COLORS.border}; padding: 14px 16px; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
  .side-title { font-size: 13px; font-weight: 700; color: ${COLORS.h1}; margin-bottom: 10px; }
  .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid ${COLORS.border}; font-size: 12px; color: ${COLORS.muted}; gap: 8px; }
  .contact-line { display: flex; align-items: center; gap: 7px; font-size: 12px; color: ${COLORS.body}; margin-bottom: 6px; }
  .total-card { background: linear-gradient(135deg, ${COLORS.brand}, ${COLORS.brandD}); color: #fff; border-radius: 12px; padding: 16px; }

  @media print {
    body * { visibility: hidden; }
    #quot-print-area, #quot-print-area * { visibility: visible; }
    #quot-print-area { position: absolute; left: 0; top: 0; width: 100%; }
    .no-print { display: none !important; }
  }
`;
export default ClientQuotationsPage;