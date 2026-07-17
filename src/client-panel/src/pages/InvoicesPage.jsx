import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../constants/tokens';
import { STATUS_MAPS } from '../data/mockData';
import { SBadge, Modal, Toast } from '../components/ui/Components';
import { clientInvoicesApi, clientPaymentsApi } from '../services/clientPortalApi';
import logoImg from '../assets/logo.png';
import qrImg from '../assets/qrcode.png';
import signatureImg from '../assets/signature.png';

/* ────────────────────────────────────────────────────────────────────────
   COMPANY (Bill From) — same as the admin "Alisha Engineering" template
──────────────────────────────────────────────────────────────────────── */
const CO = {
  name: 'Alisha Engineering',
  tag1: 'Installation Maintenance & Repair of Air Conditioning,',
  tag2: 'Electronics Appliance, Fabrication & Insulation Works.',
  address: 'L.I.G-II -164 G.I.D.C HOUSING BOARD NEAR CHHOTALAL CHAR RASTA BESIDE SWAMINARAYAN MANDIR ODAHAV AHMEDABAD-382415',
  contact: 'Vakil Yadav',
  phone: '9724763909',
  email: 'alishaengrineering@gmail.com',
  bank: 'Bank of Baroda',
  account: '06780200000745',
  ifsc: 'BARB0ODHAVE',
  branch: 'Odhav Branch',
  signatory: 'Mr. VAKIL YADAV'
};

/* Fallback "Bill To" block — your Invoice schema has no billTo* fields
   (those only exist in the admin template's normaliser, unused by the
   actual DB doc), so this fills the template sensibly until/unless you
   add real billing-contact fields to Invoice.model.js. */
const BILL_TO_FALLBACK = {
  address: '',
  contact: '',
  phone: '',
  email: ''
};
const B = '1px solid #000';
const BL = '1px solid #bbb';

/* ────────────────────────────────────────────────────────────────────────
   Number → Indian words
──────────────────────────────────────────────────────────────────────── */
const toWords = n => {
  if (!n) return '';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const conv = num => {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + ' ' + ones[num % 10] + ' ';
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + conv(num % 100);
    if (num < 100000) return conv(Math.floor(num / 1000)) + 'Thousand ' + conv(num % 1000);
    if (num < 10000000) return conv(Math.floor(num / 100000)) + 'Lakh ' + conv(num % 100000);
    return conv(Math.floor(num / 10000000)) + 'Crore ' + conv(num % 10000000);
  };
  return conv(Math.round(n)).trim() + ' Rupees Only';
};

/* ────────────────────────────────────────────────────────────────────────
   normalizeInvoice — maps the REAL Invoice.model.js doc (as returned by
   clientInvoiceController.list/get) into what InvoiceTemplate renders.
   Your backend already sends `computedStatus` (paid/pending/overdue) —
   see the "no overdue enum value" note in the controller — so this
   doesn't recompute it client-side.
──────────────────────────────────────────────────────────────────────── */
const normalizeInvoice = doc => {
  const items = Array.isArray(doc.items) && doc.items.length > 0 ? doc.items.map((it, i) => ({
    sr: i + 1,
    desc: it.name || '',
    qty: it.qty ?? 1,
    rate: it.rate ?? 0
  })) : [];
  return {
    _id: doc._id,
    id: doc.invoiceNo,
    customer: doc.customer,
    amount: doc.subtotal ?? 0,
    tax: doc.gstAmount ?? 0,
    total: doc.total ?? 0,
    date: doc.date || '',
    due: doc.dueDate || '',
    status: doc.computedStatus || (doc.paid ? 'paid' : 'pending'),
    items,
    subject: doc.subject || '',
    notes: doc.notes || '',
    terms: doc.terms || '* Payment due within 10 days of invoice date. Late payments may attract additional charges.',
    billToAddress: BILL_TO_FALLBACK.address,
    billToContact: BILL_TO_FALLBACK.contact,
    billToPhone: BILL_TO_FALLBACK.phone,
    billToEmail: BILL_TO_FALLBACK.email
  };
};

/* ── Loads Razorpay's Checkout.js once, on demand (same as Payments page) ── */
let rzpScriptPromise = null;
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (rzpScriptPromise) return rzpScriptPromise;
  rzpScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load the payment gateway. Check your connection and try again.'));
    document.body.appendChild(script);
  });
  return rzpScriptPromise;
};

/* ────────────────────────────────────────────────────────────────────────
   InvoiceTemplate — the physical invoice document. View-only.
──────────────────────────────────────────────────────────────────────── */
const InvoiceTemplate = ({
  invoice
}) => {
  const rows = invoice.items || [];
  const subtotal = invoice.amount > 0 ? invoice.amount : rows.reduce((s, r) => s + (r.qty || 0) * (r.rate || 0), 0);
  const gst = invoice.tax > 0 ? invoice.tax : Math.round(subtotal * 0.18);
  const grandTotal = invoice.total > 0 ? invoice.total : subtotal + gst;
  return <div className="cp-invoices-page-1">

      {/* Header */}
      <table className="cp-invoices-page-2">
        <tbody>
          <tr>
            <td className="cp-invoices-page-3">
              <div className="cp-invoices-page-4">{CO.tag1}</div>
              <div className="cp-invoices-page-5">{CO.tag2}</div>
              <div className="cp-invoices-page-6">{CO.address}</div>
            </td>
            <td className="cp-invoices-page-7">
              <img src={logoImg} alt="Alisha Engineering" onError={e => {
              e.target.outerHTML = `<div style="font-size:22px;font-weight:900;color:#1E3A5F;font-family:Arial;text-align:right;line-height:1.2">ALISHA<br/>ENGINEERING</div>`;
            }} className="cp-invoices-page-8" />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="cp-invoices-page-9" />

      {/* Invoice # / Date */}
      <table className="cp-invoices-page-10">
        <tbody>
          <tr>
            <td className="cp-invoices-page-11">
              {'Invoice #: '}<strong>{invoice.id}</strong>
            </td>
            <td className="cp-invoices-page-12">
              {'Invoice Date: '}<span>{invoice.date}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Subject */}
      {invoice.subject && <div className="cp-invoices-page-13">
          <span className="cp-invoices-page-14">INVOICE SUBJECT:</span>
          <span className="cp-invoices-page-15">{invoice.subject}</span>
        </div>}

      {/* Bill From / To */}
      <table className="cp-invoices-page-16">
        <tbody>
          <tr>
            <td className="cp-invoices-page-17">Bill From:</td>
            <td className="cp-invoices-page-18">Bill To:</td>
          </tr>
          {[['Company Name', CO.name, invoice.customer || '—'], ['Address', CO.address, invoice.billToAddress || '—'], ['Contact Person', CO.contact, invoice.billToContact || '—'], ['Phone No', CO.phone, invoice.billToPhone || '—'], ['Email', CO.email, invoice.billToEmail || '—']].map(([label, fromVal, toVal]) => <tr key={label}>
              <td className="cp-invoices-page-19">
                <span className="cp-invoices-page-20">{label}: </span>{fromVal}
              </td>
              <td className="cp-invoices-page-21">
                <span className="cp-invoices-page-22">{label}: </span>
                <span style={{
              color: toVal === '—' ? "var(--text-faint)" : "inherit"
            }}>{toVal}</span>
              </td>
            </tr>)}
        </tbody>
      </table>

      {/* Line Items */}
      <table className="cp-invoices-page-23">
        <thead>
          <tr>
            {[{
            h: 'SR. NO',
            w: '7%',
            align: 'center'
          }, {
            h: 'DESCRIPTION',
            w: '51%',
            align: 'left'
          }, {
            h: 'QTY',
            w: '10%',
            align: 'center'
          }, {
            h: 'RATE',
            w: '16%',
            align: 'right'
          }, {
            h: 'TOTAL',
            w: '16%',
            align: 'right'
          }].map(col => <th key={col.h} style={{
            textAlign: col.align,
            width: col.w
          }} className="cp-invoices-page-24">
                {col.h}
              </th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
          const rowTotal = (parseFloat(row.qty) || 0) * (parseFloat(row.rate) || 0);
          return <tr key={i}>
                <td className="cp-invoices-page-25">{row.sr}</td>
                <td className="cp-invoices-page-26">{row.desc}</td>
                <td className="cp-invoices-page-27">{row.qty}</td>
                <td className="cp-invoices-page-28">
                  {row.rate ? `₹${Number(row.rate).toLocaleString()}` : ''}
                </td>
                <td className="cp-invoices-page-29">
                  {rowTotal ? `₹${rowTotal.toLocaleString()}` : ''}
                </td>
              </tr>;
        })}
        </tbody>
      </table>

      {/* Bank / QR / Totals */}
      <table className="cp-invoices-page-30">
        <tbody>
          <tr>
            <td className="cp-invoices-page-31">
              <div className="cp-invoices-page-32">Bank Details:</div>
              {[['Bank', CO.bank, false], ['Account No', CO.account, true], ['IFSC', CO.ifsc, true], ['Branch', CO.branch, false]].map(([label, value, mono]) => <div key={label} className="cp-invoices-page-33">
                  <span className="cp-invoices-page-34">{label}: </span>
                  <span style={{
                fontFamily: mono ? "Fira Code, monospace" : "inherit",
                fontSize: mono ? "11px" : "12px"
              }}>{value}</span>
                </div>)}
            </td>
            <td className="cp-invoices-page-35">
              <img src={qrImg} alt="Pay using UPI" onError={e => {
              e.target.style.display = 'none';
            }} className="cp-invoices-page-36" />
              <div className="cp-invoices-page-37">Pay using UPI:</div>
            </td>
            <td className="cp-invoices-page-38">
              <table className="cp-invoices-page-39">
                <tbody>
                  <tr className="cp-invoices-page-40">
                    <td className="cp-invoices-page-41">SUBTOTAL</td>
                    <td className="cp-invoices-page-42">₹{subtotal.toLocaleString()}</td>
                  </tr>
                  <tr className="cp-invoices-page-43">
                    <td className="cp-invoices-page-44">GST (18%)</td>
                    <td className="cp-invoices-page-45">₹{gst.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="cp-invoices-page-46">TOTAL</td>
                    <td className="cp-invoices-page-47">₹{grandTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Total in words */}
      <table className="cp-invoices-page-48">
        <tbody>
          <tr>
            <td className="cp-invoices-page-49">
              <span className="cp-invoices-page-50">Total amount (in words): </span>
              <span>{toWords(grandTotal)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Notes */}
      {invoice.notes && <table className="cp-invoices-page-51">
          <tbody>
            <tr>
              <td className="cp-invoices-page-52">
                <span className="cp-invoices-page-53">Notes: </span><span>{invoice.notes}</span>
              </td>
            </tr>
          </tbody>
        </table>}

      {/* Terms */}
      <table className="cp-invoices-page-54">
        <tbody>
          <tr>
            <td className="cp-invoices-page-55">
              Terms &amp; Conditions
            </td>
          </tr>
          <tr>
            <td className="cp-invoices-page-56">{invoice.terms}</td>
          </tr>
        </tbody>
      </table>

      {/* Signature */}
      <div className="cp-invoices-page-57">
        <div>Thanking You,</div>
        <div className="cp-invoices-page-58">{CO.signatory}</div>
        <div>{CO.phone}</div>
        <div>From: {CO.name}</div>
        <img src={signatureImg} alt="Signature" onError={e => {
        e.target.style.display = 'none';
      }} className="cp-invoices-page-59" />
        <div className="cp-invoices-page-60">
          [Authorized Signatory]
        </div>
      </div>
    </div>;
};

/* ────────────────────────────────────────────────────────────────────────
   InvoicePDFModal
──────────────────────────────────────────────────────────────────────── */
const InvoicePDFModal = ({
  open,
  onClose,
  invoice
}) => {
  useEffect(() => {
    if (!open) return;
    const h = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  if (!open || !invoice) return null;
  const handlePrint = () => {
    const content = document.getElementById('client-invoice-pdf-content')?.innerHTML;
    if (!content) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>invoice-${invoice.id}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:white;padding:32px}@media print{body{padding:16px;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>
</head><body>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };
  return createPortal(<>
      <div onClick={onClose} className="cp-invoices-page-61" />
      <div className="cp-invoices-page-62">
        <div className="cp-invoices-page-63">
          <span className="cp-invoices-page-64">📄 PDF Preview</span>
          <span className="cp-invoices-page-65">{invoice.id}</span>
          <div className="cp-invoices-page-66">
            <button onClick={handlePrint} className="cp-invoices-page-67">⬇ Download PDF</button>
            <button onClick={onClose} className="cp-invoices-page-68">✕</button>
          </div>
        </div>
        <div className="cp-invoices-page-69">
          <div id="client-invoice-pdf-content" className="cp-invoices-page-70">
            <InvoiceTemplate invoice={invoice} />
          </div>
        </div>
      </div>
    </>, document.getElementById('client-portal-root') || document.body);
};

/* ────────────────────────────────────────────────────────────────────────
   Small shared building blocks
──────────────────────────────────────────────────────────────────────── */
const KCard = ({
  label,
  value,
  icon,
  iconBg,
  color
}) => <div className="animate-fade-up cp-invoices-page-71">
    <div className="cp-invoices-page-72">
      <div className="cp-invoices-page-73">{label}</div>
      <div style={{
      background: iconBg
    }} className="cp-invoices-page-74">{icon}</div>
    </div>
    <div style={{
    color
  }} className="cp-invoices-page-75">{value}</div>
  </div>;
const Thead = ({
  cols
}) => <thead>
    <tr>
      {cols.map(c => <th key={c} className="cp-invoices-page-76">
          {c}
        </th>)}
    </tr>
  </thead>;
const SearchBar = ({
  value,
  onChange,
  placeholder
}) => <div className="cp-invoices-page-77">
    <span className="cp-invoices-page-78">🔍</span>
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="cp-invoices-page-79" />
  </div>;
const FilterSelect = ({
  value,
  onChange,
  options,
  allLabel
}) => <select value={value} onChange={e => onChange(e.target.value)} className="cp-invoices-page-80">
    <option value="">{allLabel}</option>
    {options.map(o => <option key={o} value={o}>{STATUS_MAPS.invoice[o]?.label ?? o}</option>)}
  </select>;
const SimplePagination = ({
  page,
  totalPages,
  setPage,
  total,
  from,
  to
}) => <div className="cp-invoices-page-81">
    <span className="cp-invoices-page-82">Showing {total === 0 ? 0 : from}-{to} of {total}</span>
    <div className="cp-invoices-page-83">
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{
      cursor: page <= 1 ? "default" : "pointer",
      opacity: page <= 1 ? "0.4" : "1"
    }} className="cp-invoices-page-84">‹</button>
      <div className="cp-invoices-page-85">{page}</div>
      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{
      cursor: page >= totalPages ? "default" : "pointer",
      opacity: page >= totalPages ? "0.4" : "1"
    }} className="cp-invoices-page-86">›</button>
    </div>
  </div>;

/* ────────────────────────────────────────────────────────────────────────
   InvoiceDetail
──────────────────────────────────────────────────────────────────────── */
const InvoiceDetail = ({
  invoice,
  onBack,
  onPay,
  payBusy,
  onDownload
}) => {
  return <div className="fi cp-invoices-page-87">
      <div className="cp-invoices-page-88">
        <button onClick={onBack} className="cp-invoices-page-89">←</button>
        <div className="cp-invoices-page-90">
          Invoices <span className="cp-invoices-page-91">/</span>
          <span className="cp-invoices-page-92">{invoice.id}</span>
        </div>
      </div>

      <div className="cp-invoices-page-93">
        <div className="cp-invoices-page-94">
          <InvoiceTemplate invoice={invoice} />
        </div>

        <div className="cp-invoices-page-95">
          <div className="cp-invoices-page-96">
            <div className="cp-invoices-page-97">Actions</div>
            <button onClick={onDownload} className="cp-invoices-page-98">
              ⬇ Download PDF
            </button>
            {['pending', 'overdue'].includes(invoice.status) && <button onClick={onPay} disabled={payBusy} style={{
            cursor: payBusy ? "not-allowed" : "pointer",
            opacity: payBusy ? "0.6" : "1"
          }} className="cp-invoices-page-99">
                {payBusy ? 'Opening…' : '💳 Pay Now'}
              </button>}
            <button onClick={() => window.open(`mailto:${CO.email}?subject=${encodeURIComponent('Query on Invoice ' + invoice.id)}`, '_blank')} className="cp-invoices-page-100">
              ✉️ Raise a Query
            </button>
          </div>

          <div style={{
          background: invoice.status === 'overdue' ? '#FEF2F2' : invoice.status === 'paid' ? '#F0FDF4' : '#FFFBEB',
          border: `1px solid ${invoice.status === 'overdue' ? '#FECACA' : invoice.status === 'paid' ? '#BBF7D0' : '#FDE68A'}`
        }} className="cp-invoices-page-101">
            <div style={{
            color: invoice.status === 'overdue' ? '#991B1B' : invoice.status === 'paid' ? '#166534' : '#92400E'
          }} className="cp-invoices-page-102">
              Payment Status
            </div>
            <SBadge s={invoice.status} map={STATUS_MAPS.invoice} />
            <div className="cp-invoices-page-103">
              Due date: <strong className="cp-invoices-page-104">{invoice.due}</strong>
              {invoice.status === 'overdue' && <span className="cp-invoices-page-105">⚠</span>}
            </div>
          </div>

          <div className="cp-invoices-page-106">
            <div className="cp-invoices-page-107">Summary</div>
            {[['Subtotal', `₹${invoice.amount?.toLocaleString()}`], ['GST @ 18%', `₹${invoice.tax?.toLocaleString()}`]].map(([k, v]) => <div key={k} className="cp-invoices-page-108">
                <span>{k}</span>
                <span className="cp-invoices-page-109">{v}</span>
              </div>)}
            <div className="cp-invoices-page-110">
              <span>Total</span>
              <span className="cp-invoices-page-111">₹{invoice.total?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>;
};

/* ────────────────────────────────────────────────────────────────────────
   InvoicesPage — real data, real Razorpay checkout
──────────────────────────────────────────────────────────────────────── */
const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [pdfTarget, setPdfTarget] = useState(null);
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientInvoicesApi.list({
        limit: 200
      });
      setInvoices((res?.data || []).map(normalizeInvoice));
    } catch (err) {
      setError(err.message || 'Failed to load your invoices.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);
  const invoice = openId ? invoices.find(i => i._id === openId) : null;
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchesStatus = !statusFilter || inv.status === statusFilter;
      const s = q.trim().toLowerCase();
      const matchesQ = !s || [inv.id, inv.subject, inv.customer].some(v => (v || '').toLowerCase().includes(s));
      return matchesStatus && matchesQ;
    });
  }, [invoices, q, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const from = filtered.length === 0 ? 0 : (pageClamped - 1) * pageSize + 1;
  const to = Math.min(filtered.length, pageClamped * pageSize);
  const paginated = filtered.slice((pageClamped - 1) * pageSize, pageClamped * pageSize);
  const tot = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
  const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total ?? 0), 0);
  const pend = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.total ?? 0), 0);
  const over = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total ?? 0), 0);
  const totalGST = invoices.reduce((s, i) => s + (i.tax ?? 0), 0);

  /* ── Real Razorpay checkout — mirrors the Payments page exactly, but
     starts from clientInvoicesApi.pay() instead of clientPaymentsApi.createOrder()
     so ownership is checked against the Invoice, not a bare Payment id. ── */
  const handlePayNow = async inv => {
    setBusyId(inv._id);
    try {
      await loadRazorpayScript();
      const order = await clientInvoicesApi.pay(inv._id);
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'CoolTech AC Services',
        description: `Invoice ${inv.id}`,
        theme: {
          color: COLORS.brand
        },
        handler: async response => {
          try {
            await clientPaymentsApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentDocId: order.paymentDocId
            });
            setToast('Payment successful — invoice marked as paid!');
          } catch (err) {
            // The webhook will reconcile this even if verify() itself
            // couldn't confirm from the browser — see razorpayWebhook.js.
            console.warn('verify() failed, webhook will reconcile:', err.message);
          } finally {
            await fetchInvoices();
          }
        },
        modal: {
          ondismiss: () => setBusyId(null)
        }
      });
      rzp.open();
    } catch (err) {
      alert('Could not start checkout: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };
  const handleDownload = inv => setPdfTarget(inv);
  if (invoice) {
    return <>
        <InvoiceDetail invoice={invoice} onBack={() => setOpenId(null)} onPay={() => handlePayNow(invoice)} payBusy={busyId === invoice._id} onDownload={() => handleDownload(invoice)} />
        <InvoicePDFModal open={!!pdfTarget} onClose={() => setPdfTarget(null)} invoice={pdfTarget} />
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </>;
  }
  return <div className="fi cp-invoices-page-112">

      {/* Header */}
      <div className="cp-invoices-page-113">
        <div>
          <div className="cp-invoices-page-114">Invoices</div>
          <div className="cp-invoices-page-115">
            View and pay your invoices online · {filtered.length} of {invoices.length} invoices
          </div>
        </div>
      </div>

      {error && <div className="cp-invoices-page-116">
          ⚠️ {error} — <button onClick={fetchInvoices} className="cp-invoices-page-117">Retry</button>
        </div>}

      {/* KPI cards */}
      <div className="cp-invoices-page-118">
        <KCard label="Total Invoiced" value={`₹${(tot / 1000).toFixed(1)}K`} icon="📊" iconBg={COLORS.brandL} color={COLORS.brand} />
        <KCard label="Paid" value={`₹${(paid / 1000).toFixed(1)}K`} icon="✅" iconBg="#F0FDF4" color="#16A34A" />
        <KCard label="Pending" value={`₹${(pend / 1000).toFixed(1)}K`} icon="⏳" iconBg="#FFFBEB" color="#B45309" />
        <KCard label="Overdue" value={`₹${(over / 1000).toFixed(1)}K`} icon="⚠️" iconBg="#FEF2F2" color="#DC2626" />
        <KCard label="GST Paid" value={`₹${(totalGST / 1000).toFixed(1)}K`} icon="🧾" iconBg="#F5F3FF" color="#7C3AED" />
      </div>

      {/* Table card */}
      <div className="cp-invoices-page-119">
        <div className="cp-invoices-page-120">
          <SearchBar value={q} onChange={v => {
          setQ(v);
          setPage(1);
        }} placeholder="Search by invoice #, subject…" />
          <FilterSelect value={statusFilter} onChange={v => {
          setStatusFilter(v);
          setPage(1);
        }} options={['pending', 'overdue', 'paid']} allLabel="All Statuses" />
        </div>

        {loading ? <div className="cp-invoices-page-121">Loading your invoices…</div> : <div className="cp-invoices-page-122">
          <table className="cp-invoices-page-123">
            <Thead cols={['Invoice #', 'Subject', 'Amount', 'GST', 'Total', 'Date', 'Due', 'Status', 'Action']} />
            <tbody>
              {paginated.map((inv, i) => <tr key={inv._id} onClick={() => setOpenId(inv._id)} style={{
              background: inv.status === 'overdue' ? '#FFFBF7' : i % 2 === 0 ? COLORS.white : '#FAFAFA'
            }} className="cp-invoices-page-124">
                  <td className="cp-invoices-page-125">
                    <span className="cp-invoices-page-126">{inv.id}</span>
                  </td>
                  <td className="cp-invoices-page-127">{inv.subject || '—'}</td>
                  <td className="cp-invoices-page-128">
                    <span className="cp-invoices-page-129">₹{inv.amount.toLocaleString()}</span>
                  </td>
                  <td className="cp-invoices-page-130">
                    <span className="cp-invoices-page-131">₹{inv.tax.toLocaleString()}</span>
                  </td>
                  <td className="cp-invoices-page-132">
                    <span className="cp-invoices-page-133">₹{inv.total.toLocaleString()}</span>
                  </td>
                  <td className="cp-invoices-page-134">{inv.date}</td>
                  <td className="cp-invoices-page-135">
                    <span style={{
                  color: inv.status === 'overdue' ? "var(--danger-text)" : "var(--text-muted)"
                }} className="cp-invoices-page-136">
                      {inv.due}{inv.status === 'overdue' && <span className="cp-invoices-page-137">⚠</span>}
                    </span>
                  </td>
                  <td className="cp-invoices-page-138"><SBadge s={inv.status} map={STATUS_MAPS.invoice} /></td>
                  <td onClick={e => e.stopPropagation()} className="cp-invoices-page-139">
                    {['pending', 'overdue'].includes(inv.status) ? <button onClick={() => handlePayNow(inv)} disabled={busyId === inv._id} style={{
                  cursor: busyId === inv._id ? "not-allowed" : "pointer",
                  opacity: busyId === inv._id ? "0.6" : "1"
                }} className="cp-invoices-page-140">
                        {busyId === inv._id ? 'Opening…' : 'Pay Now'}
                      </button> : <button onClick={() => handleDownload(inv)} className="cp-invoices-page-141">
                        ⬇ Download
                      </button>}
                  </td>
                </tr>)}
              {paginated.length === 0 && <tr>
                  <td colSpan={9} className="cp-invoices-page-142">
                    No invoices match your search or filters.
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>}

        {/* GST footer */}
        <div className="cp-invoices-page-143">
          <span className="cp-invoices-page-144">GST Summary:</span>
          <span className="cp-invoices-page-145">
            Taxable: <strong className="cp-invoices-page-146">₹{invoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}</strong>
          </span>
          <span className="cp-invoices-page-147">
            CGST 9%: <strong className="cp-invoices-page-148">₹{Math.round(totalGST / 2).toLocaleString()}</strong>
          </span>
          <span className="cp-invoices-page-149">
            SGST 9%: <strong className="cp-invoices-page-150">₹{Math.round(totalGST / 2).toLocaleString()}</strong>
          </span>
          <span className="cp-invoices-page-151">
            Total GST: ₹{totalGST.toLocaleString()}
          </span>
        </div>

        <SimplePagination page={pageClamped} totalPages={totalPages} setPage={setPage} total={filtered.length} from={from} to={to} />
      </div>

      <InvoicePDFModal open={!!pdfTarget} onClose={() => setPdfTarget(null)} invoice={pdfTarget} />
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>;
};
export default InvoicesPage;