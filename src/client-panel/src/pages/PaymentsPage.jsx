import { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clientPaymentsApi } from '../services/clientPortalApi'; // adjust the relative path to match where you place this in your project

/* ────────────────────────────────────────────────────────────────────────
   DESIGN TOKENS — mirrors the admin panel's palette so the client portal
   feels like the same product, just scoped to "my payments" instead of
   "all payments".
   ──────────────────────────────────────────────────────────────────────── */
const COLORS = {
  brand: "var(--brand)",
  brandDark: "var(--brand-dark)",
  brandLight: "var(--brand-light)",
  ink: "var(--text-h1)",
  sub: "var(--text-muted)",
  border: "var(--border)",
  bg: "var(--bg)"
};
const CLIENT = {
  name: 'Sunrise Hotel',
  code: 'CLI-1042'
};

/* CoolTech's own account — this is what the CLIENT needs in order to pay */
const BANK_DETAILS = {
  accountName: 'CoolTech AC Services Pvt Ltd',
  accountNumber: '1234567890123456',
  ifsc: 'HDFC0001234',
  bank: 'HDFC Bank',
  branch: 'Koramangala, Bengaluru',
  accountType: 'Current',
  upiId: 'cooltech@hdfcbank'
};
const STATUS_MAP = {
  received: {
    label: 'Received',
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  },
  pending: {
    label: 'Pending',
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    dot: "var(--warning)"
  },
  overdue: {
    label: 'Overdue',
    bg: "var(--danger-bg)",
    color: "var(--danger-text)",
    dot: "var(--danger)"
  }
};
const METHOD_ICON = {
  UPI: '📱',
  Cash: '💵',
  Cheque: '📋',
  'Bank Transfer': '🏦',
  'Credit Card': '💳',
  Razorpay: '⚡',
  '—': '—'
};
const METHOD_TILES = [{
  label: 'Razorpay',
  icon: '⚡',
  color: '#4F46E5',
  bg: '#EEF2FF'
}, {
  label: 'UPI',
  icon: '📱',
  color: '#7C3AED',
  bg: '#F5F3FF'
}, {
  label: 'Bank Transfer',
  icon: '🏦',
  color: '#1D4ED8',
  bg: '#EFF6FF'
}, {
  label: 'Credit Card',
  icon: '💳',
  color: '#DC2626',
  bg: '#FEF2F2'
}, {
  label: 'Cash',
  icon: '💵',
  color: '#16A34A',
  bg: '#ECFDF5'
}, {
  label: 'Cheque',
  icon: '📋',
  color: '#0369A1',
  bg: '#E0F2FE'
}];
const HOW_TO_PAY = [{
  n: '1',
  icon: '⚡',
  label: 'Pay Online via Razorpay',
  color: '#4F46E5',
  bg: '#EEF2FF',
  badge: 'Fastest',
  how: 'The quickest way to clear an invoice. Click "Pay Now" on any pending invoice and complete checkout on Razorpay\u2019s secure page — your payment reflects here instantly.',
  steps: ['Open the "Pay Online" tab or click Pay Now on an invoice', 'Choose UPI, Card, Netbanking or Wallet', 'Complete the payment on the secure checkout', 'Your invoice is marked Received immediately']
}, {
  n: '2',
  icon: '📱',
  label: 'UPI Direct',
  color: '#7C3AED',
  bg: '#F5F3FF',
  badge: null,
  how: 'Prefer your own UPI app? Send the amount directly to CoolTech\u2019s UPI ID and share the transaction reference.',
  steps: [`Send payment to ${BANK_DETAILS.upiId}`, 'Add your invoice number as a note', 'Share the UTR with our team', 'We confirm within a few hours']
}, {
  n: '3',
  icon: '🏦',
  label: 'Bank Transfer (NEFT / RTGS / IMPS)',
  color: '#1D4ED8',
  bg: '#EFF6FF',
  badge: null,
  how: 'Transfer directly to our company account from your net banking. Best for larger AMC or commercial invoices.',
  steps: ['Open the "Bank Transfer" tab for full account details', 'Transfer via your bank\u2019s NEFT / IMPS / RTGS', 'Use the invoice number as the transfer remark', 'Manual transfers are verified within 1 business day']
}, {
  n: '4',
  icon: '💳',
  label: 'Credit / Debit Card',
  color: '#DC2626',
  bg: '#FEF2F2',
  badge: null,
  how: 'Card payments are also routed through Razorpay\u2019s secure checkout — your card details never touch CoolTech\u2019s servers.',
  steps: ['Click Pay Now on any invoice', 'Choose Card at checkout', 'Enter card details + OTP on your bank\u2019s page', 'Instant confirmation']
}, {
  n: '5',
  icon: '💵',
  label: 'Cash',
  color: '#16A34A',
  bg: '#ECFDF5',
  badge: null,
  how: 'Pay our technician directly on the day of service and collect a physical receipt.',
  steps: ['Hand cash to the technician on-site', 'Collect your signed receipt', 'Ask them to note the invoice number', 'Your invoice is updated same-day']
}, {
  n: '6',
  icon: '📋',
  label: 'Cheque / Demand Draft',
  color: '#0369A1',
  bg: '#E0F2FE',
  badge: null,
  how: 'Issue a cheque in our company\u2019s name. Note that clearance takes a couple of business days.',
  steps: [`Cheque in favour of "${BANK_DETAILS.accountName}"`, 'Hand it to our team or courier it', 'Allow 2–3 business days for clearance', 'Invoice moves to Received after clearance']
}];
const formatDate = dateLike => {
  if (!dateLike) return '—';
  const d = new Date(dateLike);
  if (isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/* ── Maps a raw Payment doc from GET /api/client/payments into the exact
   shape this UI renders — keeps the JSX below free of backend field names */
const normalizePayment = doc => ({
  key: doc._id,
  _id: doc._id,
  id: doc.paymentId || doc._id,
  invoice: doc.invoice,
  amount: Number(doc.amount) || 0,
  method: doc.method || '—',
  gateway: doc.gateway || null,
  // NOTE: your Payment schema doesn't have a dueDate field — this falls
  // back to when the invoice was raised. If you want real due-date
  // tracking (e.g. NET 15/30 terms), add a `dueDate` field to Payment.js
  // and swap doc.createdAt below for doc.dueDate.
  date: doc.status === 'received' ? formatDate(doc.paidAt) : `Raised ${formatDate(doc.createdAt)}`,
  ref: doc.ref || '—',
  status: doc.status
});
const TABS = [['history', '📋 Payment History'], ['pay', '⚡ Pay Online'], ['bank', '🏦 Bank Transfer'], ['help', '❓ How to Pay']];
const fmt = n => `₹${Number(n).toLocaleString('en-IN')}`;

/* ════════════════════════════════════════════════════════════════════════ */

/* ── Loads Razorpay's Checkout.js once, on demand (same trick as admin) ── */
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
export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null); // disables the Pay Now button for the row currently checking out

  const [activeTab, setActiveTab] = useState('history');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [bankModal, setBankModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const copy = (key, text) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(k => k === key ? null : k), 1500);
  };

  /* ── Fetch this client's payments. Mirrors the admin panel's own
     "fetch up to N, filter/paginate client-side" pattern (see
     admin/PaymentsPage.jsx fetchPayments) rather than a paginated
     server query — plenty fast for a single client's history, and it
     keeps the KPI/method totals below trivially correct without a
     second round trip. Swap to /payments/summary + server pagination
     once a client's history grows into the hundreds. ── */
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientPaymentsApi.list({
        limit: 200
      });
      setPayments((res?.data || []).map(normalizePayment));
    } catch (err) {
      setError(err.message || 'Failed to load your payments.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);
  const totals = useMemo(() => {
    const received = payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
    const pending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    const overdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
    return {
      received,
      pending,
      overdue,
      total: received + pending + overdue
    };
  }, [payments]);
  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (methodFilter && p.method !== methodFilter) return false;
      if (q) {
        const hay = `${p.id} ${p.invoice} ${p.ref} ${p.method}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [payments, q, statusFilter, methodFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paginated = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);
  const outstanding = payments.filter(p => p.status !== 'received');

  /* ── Real Razorpay checkout: create an order server-side, open the
     official widget, verify the signature, then refetch so every number
     on this page (KPIs, method tiles, the row itself) comes from the
     database instead of an optimistic local patch. ── */
  const handlePayNow = async payment => {
    setBusyId(payment._id);
    try {
      await loadRazorpayScript();
      const order = await clientPaymentsApi.createOrder(payment._id);
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'CoolTech AC Services',
        description: `Invoice ${payment.invoice}`,
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
          } catch (err) {
            // Signature check failing here doesn't mean the money didn't
            // move — it means we couldn't confirm it from the browser.
            // The Razorpay webhook (server-side) will reconcile this
            // invoice on its own; we just can't promise it instantly.
            console.warn('verify() failed, webhook will reconcile:', err.message);
          } finally {
            await fetchPayments();
            setDetailModal(null);
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

  /* ── Print a standalone receipt (client-side only, matches admin format) */
  const printReceipt = p => {
    const w = window.open('', '_blank', 'width=440,height=640');
    if (!w) return;
    const rows = [['Invoice', p.invoice], ['Paid by', CLIENT.name], ['Method', p.method], ['Gateway', p.gateway || 'Manual'], ['Date', p.date], ['Ref / UTR', p.ref], ['Status', STATUS_MAP[p.status]?.label || p.status]].map(([k, v]) => `
      <tr>
        <td style="padding:8px 0;color:#64748B;font-size:13px;border-bottom:1px solid #E2E8F0;">${k}</td>
        <td style="padding:8px 0;font-weight:700;text-align:right;font-size:13px;border-bottom:1px solid #E2E8F0;">${v}</td>
      </tr>`).join('');
    w.document.open();
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${p.id}</title>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, Arial, sans-serif; padding: 32px; color:#0F172A; }
            .brand { font-size: 16px; font-weight: 800; color:#EA580C; }
            .id { color:#94A3B8; font-size: 12px; margin: 2px 0 18px; }
            .amount-label { color:#64748B; font-size: 12px; margin-bottom: 2px; }
            .amount { font-size: 28px; font-weight: 800; color:#EA580C; margin-bottom: 20px; }
            table { width:100%; border-collapse: collapse; }
            .footer { margin-top: 28px; font-size: 11px; color:#94A3B8; text-align:center; }
          </style>
        </head>
        <body>
          <div class="brand">❄ CoolTech AC Services</div>
          <div class="id">Payment Receipt · ${p.id}</div>
          <div class="amount-label">Amount Paid</div>
          <div class="amount">₹${p.amount.toLocaleString('en-IN')}</div>
          <table>${rows}</table>
          <div class="footer">This is a system-generated receipt and does not require a signature.</div>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  /* ── Timeline steps for the detail modal ──────────────────────────────── */
  const buildTimeline = p => {
    const isPaid = p.status === 'received';
    return [{
      label: 'Invoice generated',
      date: p.status === 'received' ? p.date : p.date.replace('Due ', ''),
      done: true
    }, {
      label: 'Payment initiated',
      date: isPaid ? p.date : '—',
      done: isPaid
    }, {
      label: 'Payment verified',
      date: isPaid ? p.date : '—',
      done: isPaid
    }, {
      label: isPaid ? 'Payment cleared' : p.status === 'overdue' ? 'Payment overdue' : 'Awaiting payment',
      date: isPaid ? p.date : '—',
      done: isPaid,
      warn: p.status === 'overdue'
    }];
  };
  return <div className="cpay-page">
      <style>{`
        .cpay-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:${COLORS.bg}; color:${COLORS.ink}; padding: 20px; border-radius: 16px; max-width: 1080px; margin: 0 auto; }
        .cpay-page * { box-sizing: border-box; }
        .cpay-alert { display:flex; align-items:center; gap:14px; background:linear-gradient(135deg,#FEF2F2,#FFF1F0); border:1px solid #FECACA; border-radius:14px; padding:14px 18px; margin-bottom:16px; }
        .cpay-alert-icon { font-size:22px; }
        .cpay-alert-body { flex:1; }
        .cpay-alert-title { font-weight:800; font-size:13.5px; color:#B91C1C; }
        .cpay-alert-sub { font-size:12px; color:#7F1D1D; margin-top:2px; }
        .cpay-hdr { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
        .cpay-title { font-size:21px; font-weight:800; letter-spacing:-0.3px; }
        .cpay-sub { font-size:13px; color:${COLORS.sub}; margin-top:3px; }
        .cpay-hdr-actions { display:flex; gap:8px; }
        .cpay-btn { border:none; border-radius:9px; font-size:12.5px; font-weight:700; padding:9px 14px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition: all .15s ease; white-space:nowrap; }
        .cpay-btn:disabled { opacity:.45; cursor:not-allowed; }
        .cpay-btn-primary { background:${COLORS.brand}; color:#fff; }
        .cpay-btn-primary:hover:not(:disabled) { background:${COLORS.brandDark}; }
        .cpay-btn-outline { background:#fff; color:${COLORS.ink}; border:1px solid ${COLORS.border}; }
        .cpay-btn-outline:hover { border-color:${COLORS.brand}; color:${COLORS.brand}; }
        .cpay-btn-ghost { background:transparent; color:${COLORS.sub}; padding:6px 10px; }
        .cpay-btn-ghost:hover { background:#F1F5F9; color:${COLORS.ink}; }
        .cpay-btn-sm { padding:6px 10px; font-size:11.5px; }
        .cpay-btn-success { background:#16A34A; color:#fff; }
        .cpay-btn-success:hover:not(:disabled) { background:#15803D; }

        .cpay-kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:14px; }
        .cpay-kpi { background:#fff; border:1px solid ${COLORS.border}; border-radius:14px; padding:16px; }
        .cpay-kpi-top { display:flex; justify-content:space-between; align-items:flex-start; }
        .cpay-kpi-label { font-size:12px; color:${COLORS.sub}; font-weight:600; }
        .cpay-kpi-icon { width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:14px; }
        .cpay-kpi-value { font-size:22px; font-weight:800; margin-top:10px; }
        .cpay-kpi-sub { font-size:11px; color:${COLORS.sub}; margin-top:2px; }

        .cpay-method-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; margin-bottom:18px; }
        .cpay-method-card { background:#fff; border:1px solid ${COLORS.border}; border-radius:14px; padding:14px 10px; text-align:center; }
        .cpay-method-icon { font-size:20px; }
        .cpay-method-label { font-size:12px; font-weight:800; margin-top:6px; }
        .cpay-method-desc { font-size:10px; color:${COLORS.sub}; margin-top:2px; min-height:24px; }
        .cpay-method-count { font-size:10.5px; font-weight:700; border-radius:20px; padding:3px 8px; display:inline-block; margin-top:8px; }

        .cpay-tabs { display:inline-flex; background:#F1F5F9; border-radius:11px; padding:4px; gap:2px; margin-bottom:16px; flex-wrap:wrap; }
        .cpay-tab { border:none; background:transparent; padding:8px 14px; border-radius:8px; font-size:12.5px; font-weight:700; color:${COLORS.sub}; cursor:pointer; }
        .cpay-tab.active { background:#fff; color:${COLORS.brand}; box-shadow:0 1px 3px rgba(0,0,0,.08); }

        .cpay-card { background:#fff; border:1px solid ${COLORS.border}; border-radius:14px; overflow:hidden; }
        .cpay-card-body { padding:18px; }
        .cpay-toolbar { display:flex; gap:8px; padding:12px 16px; border-bottom:1px solid ${COLORS.border}; flex-wrap:wrap; align-items:center; }
        .cpay-search { flex:1; min-width:180px; border:1px solid ${COLORS.border}; border-radius:8px; padding:8px 12px; font-size:12.5px; outline:none; }
        .cpay-search:focus { border-color:${COLORS.brand}; }
        .cpay-select { border:1px solid ${COLORS.border}; border-radius:8px; padding:8px 10px; font-size:12.5px; background:#fff; color:${COLORS.ink}; }

        .cpay-table-wrap { overflow-x:auto; }
        table.cpay-table { width:100%; border-collapse:collapse; font-size:12.5px; }
        table.cpay-table th { text-align:left; padding:10px 14px; font-size:10.5px; text-transform:uppercase; letter-spacing:.04em; color:${COLORS.sub}; border-bottom:1px solid ${COLORS.border}; white-space:nowrap; }
        table.cpay-table td { padding:11px 14px; border-bottom:1px solid #F1F5F9; vertical-align:middle; white-space:nowrap; }
        table.cpay-table tr:hover td { background:#FAFAFA; }
        .cpay-id-link { font-family:monospace; font-weight:700; color:${COLORS.brand}; background:none; border:none; cursor:pointer; padding:0; font-size:12.5px; }
        .cpay-id-link:hover { text-decoration:underline; }
        .cpay-mono { font-family:monospace; font-size:11.5px; color:${COLORS.sub}; }
        .cpay-amount { font-family:monospace; font-weight:800; color:${COLORS.brand}; }
        .cpay-method-cell { display:flex; align-items:center; gap:6px; }
        .cpay-gw-tag { font-size:10.5px; font-weight:700; color:#4F46E5; background:#EEF2FF; border-radius:6px; padding:2px 7px; }
        .cpay-manual-tag { font-size:10.5px; color:${COLORS.sub}; background:#F1F5F9; border-radius:6px; padding:2px 7px; }
        .cpay-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; border-radius:20px; padding:4px 10px; }
        .cpay-badge-dot { width:6px; height:6px; border-radius:50%; }
        .cpay-actions { display:flex; gap:6px; }
        .cpay-empty { text-align:center; padding:40px; color:#94A3B8; font-size:13px; }

        .cpay-pagination { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-top:1px solid ${COLORS.border}; font-size:12px; color:${COLORS.sub}; }
        .cpay-page-btns { display:flex; gap:6px; }
        .cpay-page-btn { border:1px solid ${COLORS.border}; background:#fff; border-radius:7px; padding:5px 10px; font-size:12px; cursor:pointer; }
        .cpay-page-btn:disabled { opacity:.4; cursor:not-allowed; }

        .cpay-banner { display:flex; gap:14px; align-items:center; background:linear-gradient(135deg,#EEF2FF,#F5F3FF); border:1px solid #C7D2FE; border-radius:14px; padding:16px 18px; margin-bottom:16px; }
        .cpay-banner-icon { font-size:26px; }
        .cpay-banner-title { font-weight:800; font-size:14px; color:#3730A3; }
        .cpay-banner-desc { font-size:12px; color:#4338CA; margin-top:2px; }

        .cpay-invoice-list { display:flex; flex-direction:column; gap:10px; }
        .cpay-invoice-row { display:flex; align-items:center; gap:12px; border:1px solid ${COLORS.border}; border-radius:12px; padding:12px 14px; }
        .cpay-invoice-main { flex:1; }
        .cpay-invoice-inv { font-weight:800; font-size:13px; }
        .cpay-invoice-due { font-size:11.5px; color:${COLORS.sub}; margin-top:2px; }
        .cpay-invoice-amt { font-family:monospace; font-weight:800; font-size:14px; color:${COLORS.ink}; margin-right:6px; }

        .cpay-bank-card { position:relative; overflow:hidden; background:linear-gradient(135deg,#1D2A4A,#33406B); color:#fff; border-radius:16px; padding:26px; margin-bottom:16px; }
        .cpay-bank-circle { position:absolute; border-radius:50%; background:rgba(255,255,255,.06); }
        .cpay-bank-eyebrow { font-size:11px; letter-spacing:.08em; opacity:.7; text-transform:uppercase; }
        .cpay-bank-name { font-size:19px; font-weight:800; margin-top:4px; }
        .cpay-bank-branch { font-size:12px; opacity:.75; margin-top:2px; margin-bottom:18px; }
        .cpay-bank-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; position:relative; z-index:1; }
        .cpay-bank-field-label { font-size:10px; opacity:.6; letter-spacing:.05em; text-transform:uppercase; }
        .cpay-bank-field-value { font-size:13.5px; font-weight:700; margin-top:3px; }
        .cpay-bank-mono { font-family:monospace; }
        .cpay-bank-upi { margin-top:18px; font-size:13px; position:relative; z-index:1; }

        .cpay-copy-list { display:flex; flex-direction:column; gap:8px; }
        .cpay-copy-row { display:flex; align-items:center; gap:10px; border:1px solid ${COLORS.border}; border-radius:10px; padding:9px 12px; }
        .cpay-copy-label { font-size:11.5px; color:${COLORS.sub}; width:120px; flex-shrink:0; }
        .cpay-copy-value { flex:1; font-size:12.5px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        .cpay-howto-card { border-radius:14px; padding:16px; border:1px solid; margin-bottom:12px; }
        .cpay-howto-hdr { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
        .cpay-howto-icon { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; color:#fff; flex-shrink:0; }
        .cpay-howto-label { font-weight:800; font-size:13.5px; }
        .cpay-howto-badge { font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; background:#16A34A; color:#fff; margin-left:8px; }
        .cpay-howto-how { font-size:12.5px; color:${COLORS.sub}; margin-bottom:10px; line-height:1.5; }
        .cpay-howto-step { display:flex; align-items:flex-start; gap:8px; font-size:12px; margin-bottom:6px; }
        .cpay-howto-step-num { width:18px; height:18px; border-radius:50%; color:#fff; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }

        .cpay-modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,.55); display:flex; align-items:center; justify-content:center; z-index:1000; padding:16px; }
        .cpay-modal { background:#fff; border-radius:16px; width:100%; max-width:440px; max-height:88vh; overflow-y:auto; }
        /* scrollbar-hiding for .cpay-modal is centralized in src/shared/base.css */
        .cpay-modal-hdr { display:flex; align-items:center; gap:12px; padding:18px; border-bottom:1px solid ${COLORS.border}; }
        .cpay-modal-hdr-icon { width:36px; height:36px; border-radius:10px; background:${COLORS.brandLight}; display:flex; align-items:center; justify-content:center; font-size:17px; }
        .cpay-modal-title { font-weight:800; font-size:14.5px; }
        .cpay-modal-sub { font-size:11.5px; color:${COLORS.sub}; margin-top:1px; }
        .cpay-modal-close { margin-left:auto; border:none; background:#F1F5F9; width:28px; height:28px; border-radius:8px; cursor:pointer; font-size:13px; color:${COLORS.sub}; }
        .cpay-modal-body { padding:18px; }

        .cpay-detail-amount-label { font-size:11.5px; color:${COLORS.sub}; }
        .cpay-detail-amount { font-size:30px; font-weight:800; color:${COLORS.brand}; margin:2px 0 16px; }
        .cpay-detail-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:18px; }
        .cpay-detail-field-label { font-size:10.5px; color:${COLORS.sub}; text-transform:uppercase; letter-spacing:.04em; }
        .cpay-detail-field-value { font-size:13px; font-weight:700; margin-top:2px; }

        .cpay-timeline { position:relative; padding-left:22px; margin-bottom:18px; }
        .cpay-timeline::before { content:''; position:absolute; left:6px; top:4px; bottom:4px; width:2px; background:${COLORS.border}; }
        .cpay-tl-step { position:relative; padding-bottom:16px; }
        .cpay-tl-step:last-child { padding-bottom:0; }
        .cpay-tl-dot { position:absolute; left:-22px; top:1px; width:14px; height:14px; border-radius:50%; border:2px solid ${COLORS.border}; background:#fff; }
        .cpay-tl-dot.done { border-color:#16A34A; background:#16A34A; }
        .cpay-tl-dot.warn { border-color:#DC2626; background:#DC2626; }
        .cpay-tl-label { font-size:12.5px; font-weight:700; color:${COLORS.ink}; }
        .cpay-tl-label.pending-txt { color:${COLORS.sub}; font-weight:600; }
        .cpay-tl-date { font-size:11px; color:${COLORS.sub}; margin-top:1px; }

        .cpay-pay-tiles { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; }
        .cpay-pay-tile { border:1.5px solid ${COLORS.border}; border-radius:12px; padding:12px; cursor:pointer; text-align:left; background:#fff; }
        .cpay-pay-tile.selected { border-color:${COLORS.brand}; background:${COLORS.brandLight}; }
        .cpay-pay-tile-icon { font-size:18px; }
        .cpay-pay-tile-label { font-size:12.5px; font-weight:800; margin-top:6px; }
        .cpay-pay-tile-desc { font-size:10.5px; color:${COLORS.sub}; margin-top:2px; }

        .cpay-spinner { width:44px; height:44px; border-radius:50%; border:4px solid #F1F5F9; border-top-color:${COLORS.brand}; animation:cpay-spin .8s linear infinite; margin:24px auto; }
        @keyframes cpay-spin { to { transform:rotate(360deg); } }
        .cpay-check { width:56px; height:56px; border-radius:50%; background:#DCFCE7; color:#16A34A; display:flex; align-items:center; justify-content:center; font-size:28px; margin:20px auto 12px; animation:cpay-pop .35s ease; }
        @keyframes cpay-pop { 0% { transform:scale(0.4); opacity:0; } 100% { transform:scale(1); opacity:1; } }
        .cpay-center { text-align:center; }

        @media (max-width: 760px) {
          .cpay-kpi-grid { grid-template-columns:repeat(2,1fr); }
          .cpay-method-grid { grid-template-columns:repeat(3,1fr); }
          .cpay-detail-grid { grid-template-columns:1fr; }
          .cpay-hdr { flex-direction:column; }
        }
      `}</style>

      {/* ── Overdue alert ── */}
      {totals.overdue > 0 && <div className="cpay-alert">
          <div className="cpay-alert-icon">⚠️</div>
          <div className="cpay-alert-body">
            <div className="cpay-alert-title">
              {fmt(totals.overdue)} overdue across {payments.filter(p => p.status === 'overdue').length} invoice(s)
            </div>
            <div className="cpay-alert-sub">Clear pending dues to keep your AMC and service visits uninterrupted.</div>
          </div>
          <button className="cpay-btn cpay-btn-primary" onClick={() => setActiveTab('pay')}>⚡ Pay Now</button>
        </div>}

      {/* ── Header ── */}
      <div className="cpay-hdr">
        <div>
          <div className="cpay-title">💳 Payments</div>
          <div className="cpay-sub">Your payment history with CoolTech AC Services</div>
        </div>
        <div className="cpay-hdr-actions">
          <button className="cpay-btn cpay-btn-outline" onClick={() => setBankModal(true)}>🏦 Bank Details</button>
          <button className="cpay-btn cpay-btn-primary" disabled={outstanding.length === 0} onClick={() => setActiveTab('pay')}>
            ⚡ Pay Outstanding
          </button>
        </div>
      </div>

      {error && <div className="cpay-card cpay-card-body cp-payments-page-1">
          ⚠️ {error} — <button className="cpay-btn cpay-btn-sm cpay-btn-outline" onClick={fetchPayments}>Retry</button>
        </div>}

      {/* ── KPI cards ── */}
      <div className="cpay-kpi-grid">
        {[{
        label: 'Total Paid',
        value: fmt(totals.received),
        sub: 'all time',
        icon: '✅',
        bg: '#F0FDF4',
        color: '#16A34A'
      }, {
        label: 'Pending',
        value: fmt(totals.pending),
        sub: 'awaiting payment',
        icon: '⏳',
        bg: '#FFFBEB',
        color: '#B45309'
      }, {
        label: 'Overdue',
        value: fmt(totals.overdue),
        sub: 'action needed',
        icon: '⚠️',
        bg: '#FEF2F2',
        color: '#DC2626'
      }, {
        label: 'Total Billed',
        value: fmt(totals.total),
        sub: 'all invoices',
        icon: '💰',
        bg: '#FFF7ED',
        color: COLORS.brand
      }].map(k => <div key={k.label} className="cpay-kpi">
            <div className="cpay-kpi-top">
              <div className="cpay-kpi-label">{k.label}</div>
              <div className="cpay-kpi-icon" style={{
            background: k.bg
          }}>{k.icon}</div>
            </div>
            <div className="cpay-kpi-value" style={{
          color: k.color
        }}>{k.value}</div>
            <div className="cpay-kpi-sub">{k.sub}</div>
          </div>)}
      </div>

      {/* ── Method summary ── */}
      <div className="cpay-method-grid">
        {METHOD_TILES.map(m => <div key={m.label} className="cpay-method-card">
            <div className="cpay-method-icon">{m.icon}</div>
            <div className="cpay-method-label" style={{
          color: m.color
        }}>{m.label}</div>
            <div className="cpay-method-desc">
              {payments.filter(p => p.method === m.label && p.status === 'received').length} payment(s)
            </div>
            <div className="cpay-method-count" style={{
          color: m.color,
          background: m.bg
        }}>
              {payments.filter(p => p.method === m.label && p.status === 'received').reduce((s, p) => s + p.amount, 0) > 0 ? fmt(payments.filter(p => p.method === m.label && p.status === 'received').reduce((s, p) => s + p.amount, 0)) : '—'}
            </div>
          </div>)}
      </div>

      {/* ── Tabs ── */}
      <div className="cpay-tabs">
        {TABS.map(([id, label]) => <button key={id} className={`cpay-tab${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id)}>
            {label}
          </button>)}
      </div>

      {/* ══ TAB: HISTORY ══ */}
      {activeTab === 'history' && <div className="cpay-card">
          <div className="cpay-toolbar">
            <input className="cpay-search" placeholder="Search by pay ID, invoice, ref…" value={q} onChange={e => {
          setQ(e.target.value);
          setPage(1);
        }} />
            <select className="cpay-select" value={statusFilter} onChange={e => {
          setStatusFilter(e.target.value);
          setPage(1);
        }}>
              <option value="">All Statuses</option>
              <option value="received">Received</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <select className="cpay-select" value={methodFilter} onChange={e => {
          setMethodFilter(e.target.value);
          setPage(1);
        }}>
              <option value="">All Methods</option>
              {['UPI', 'Cash', 'Cheque', 'Bank Transfer', 'Credit Card', 'Razorpay'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {loading ? <div className="cpay-empty">Loading your payments…</div> : <div className="cpay-table-wrap">
            <table className="cpay-table">
              <thead>
                <tr>
                  {['Pay ID', 'Invoice', 'Amount', 'Method', 'Gateway', 'Date', 'Ref / UTR', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => <tr key={p.key}>
                    <td><button className="cpay-id-link" onClick={() => setDetailModal(p)}>{p.id}</button></td>
                    <td><span className="cpay-mono">{p.invoice}</span></td>
                    <td><span className="cpay-amount">{fmt(p.amount)}</span></td>
                    <td>
                      <div className="cpay-method-cell">
                        <span>{METHOD_ICON[p.method] || '❓'}</span><span>{p.method}</span>
                      </div>
                    </td>
                    <td>{p.gateway ? <span className="cpay-gw-tag">⚡ {p.gateway}</span> : <span className="cpay-manual-tag">Manual</span>}</td>
                    <td className="cpay-mono">{p.date}</td>
                    <td><span className="cpay-mono">{p.ref}</span></td>
                    <td>
                      <span className="cpay-badge" style={{
                  background: STATUS_MAP[p.status].bg,
                  color: STATUS_MAP[p.status].color
                }}>
                        <span className="cpay-badge-dot" style={{
                    background: STATUS_MAP[p.status].dot
                  }} />{STATUS_MAP[p.status].label}
                      </span>
                    </td>
                    <td>
                      <div className="cpay-actions">
                        {p.status !== 'received' && <button className="cpay-btn cpay-btn-primary cpay-btn-sm" disabled={busyId === p._id} onClick={() => handlePayNow(p)}>
                            {busyId === p._id ? 'Opening…' : '⚡ Pay Now'}
                          </button>}
                        {p.status === 'received' && <button className="cpay-btn cpay-btn-outline cpay-btn-sm" onClick={() => printReceipt(p)}>⬇️ Receipt</button>}
                        <button className="cpay-btn cpay-btn-ghost cpay-btn-sm" onClick={() => setDetailModal(p)}>Details</button>
                      </div>
                    </td>
                  </tr>)}
                {paginated.length === 0 && <tr><td colSpan={9} className="cpay-empty">No payments match your search.</td></tr>}
              </tbody>
            </table>
          </div>}

          <div className="cpay-pagination">
            <span>Showing {paginated.length === 0 ? 0 : (pageSafe - 1) * pageSize + 1}–{(pageSafe - 1) * pageSize + paginated.length} of {filtered.length}</span>
            <div className="cpay-page-btns">
              <button className="cpay-page-btn" disabled={pageSafe <= 1} onClick={() => setPage(pg => pg - 1)}>← Prev</button>
              <button className="cpay-page-btn" disabled={pageSafe >= totalPages} onClick={() => setPage(pg => pg + 1)}>Next →</button>
            </div>
          </div>
        </div>}

      {/* ══ TAB: PAY ONLINE ══ */}
      {activeTab === 'pay' && <div>
          <div className="cpay-banner">
            <div className="cpay-banner-icon">🔒</div>
            <div>
              <div className="cpay-banner-title">Secured by Razorpay</div>
              <div className="cpay-banner-desc">256-bit encrypted checkout · UPI, Cards, Netbanking & Wallets supported</div>
            </div>
          </div>
          <div className="cpay-card cpay-card-body">
            <div className="cp-payments-page-2">Outstanding Invoices</div>
            <div className="cp-payments-page-3">Pick an invoice to pay instantly online.</div>
            <div className="cpay-invoice-list">
              {outstanding.map(p => <div key={p.key} className="cpay-invoice-row">
                  <div className="cpay-invoice-main">
                    <div className="cpay-invoice-inv">{p.invoice} · {p.id}</div>
                    <div className="cpay-invoice-due">{p.date}</div>
                  </div>
                  <span className="cpay-badge" style={{
              background: STATUS_MAP[p.status].bg,
              color: STATUS_MAP[p.status].color
            }}>
                    <span className="cpay-badge-dot" style={{
                background: STATUS_MAP[p.status].dot
              }} />{STATUS_MAP[p.status].label}
                  </span>
                  <div className="cpay-invoice-amt">{fmt(p.amount)}</div>
                  <button className="cpay-btn cpay-btn-primary cpay-btn-sm" disabled={busyId === p._id} onClick={() => handlePayNow(p)}>
                    {busyId === p._id ? 'Opening…' : '⚡ Pay Now'}
                  </button>
                </div>)}
              {outstanding.length === 0 && <div className="cpay-empty">🎉 All caught up! No pending payments.</div>}
            </div>
          </div>
        </div>}

      {/* ══ TAB: BANK TRANSFER ══ */}
      {activeTab === 'bank' && <div>
          <div className="cpay-bank-card">
            <div className="cpay-bank-circle cp-payments-page-4" />
            <div className="cpay-bank-circle cp-payments-page-5" />
            <div className="cpay-bank-eyebrow">Transfer To</div>
            <div className="cpay-bank-name">{BANK_DETAILS.bank}</div>
            <div className="cpay-bank-branch">{BANK_DETAILS.branch}</div>
            <div className="cpay-bank-grid">
              <div><div className="cpay-bank-field-label">Account Name</div><div className="cpay-bank-field-value">{BANK_DETAILS.accountName}</div></div>
              <div><div className="cpay-bank-field-label">Account Type</div><div className="cpay-bank-field-value">{BANK_DETAILS.accountType} Account</div></div>
              <div><div className="cpay-bank-field-label">Account Number</div><div className="cpay-bank-field-value cpay-bank-mono">{BANK_DETAILS.accountNumber}</div></div>
              <div><div className="cpay-bank-field-label">IFSC Code</div><div className="cpay-bank-field-value cpay-bank-mono">{BANK_DETAILS.ifsc}</div></div>
            </div>
            <div className="cpay-bank-upi"><b>UPI ID:</b> {BANK_DETAILS.upiId}</div>
          </div>

          <div className="cpay-card cpay-card-body">
            <div className="cp-payments-page-6">Quick Copy</div>
            <div className="cpay-copy-list">
              {[['Account Number', BANK_DETAILS.accountNumber], ['IFSC Code', BANK_DETAILS.ifsc], ['UPI ID', BANK_DETAILS.upiId]].map(([label, value]) => <div key={label} className="cpay-copy-row">
                  <div className="cpay-copy-label">{label}</div>
                  <div className="cpay-copy-value">{value}</div>
                  <button className="cpay-btn cpay-btn-outline cpay-btn-sm" onClick={() => copy(label, value)}>
                    {copiedKey === label ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>)}
            </div>
            <div className="cp-payments-page-7">
              💡 Please add your <b>invoice number</b> as the transfer remark/reference so we can match your payment quickly.
              Manual transfers are verified within 1 business day.
            </div>
          </div>
        </div>}

      {/* ══ TAB: HOW TO PAY ══ */}
      {activeTab === 'help' && <div className="cpay-card cpay-card-body">
          <div className="cp-payments-page-8">❓ Ways to Pay Your Invoice</div>
          <div className="cp-payments-page-9">Choose whichever works best for you — all six methods are accepted.</div>
          {HOW_TO_PAY.map(m => <div key={m.n} className="cpay-howto-card" style={{
        background: m.bg,
        borderColor: m.color + '30'
      }}>
              <div className="cpay-howto-hdr">
                <div className="cpay-howto-icon" style={{
            background: m.color
          }}>{m.icon}</div>
                <div>
                  <span className="cpay-howto-label" style={{
              color: m.color
            }}>{m.label}</span>
                  {m.badge && <span className="cpay-howto-badge">{m.badge}</span>}
                </div>
              </div>
              <div className="cpay-howto-how">{m.how}</div>
              {m.steps.map((s, i) => <div key={i} className="cpay-howto-step">
                  <span className="cpay-howto-step-num" style={{
            background: m.color
          }}>{i + 1}</span>
                  <span>{s}</span>
                </div>)}
            </div>)}
        </div>}

      {/* ══ BANK DETAILS MODAL ══ */}
      {bankModal && createPortal(<div className="cpay-modal-overlay" onClick={() => setBankModal(false)}>
          <div className="cpay-modal" onClick={e => e.stopPropagation()}>
            <div className="cpay-modal-hdr">
              <span className="cpay-modal-hdr-icon">🏦</span>
              <div>
                <div className="cpay-modal-title">Bank Account Details</div>
                <div className="cpay-modal-sub">Use these for a manual bank transfer</div>
              </div>
              <button className="cpay-modal-close" onClick={() => setBankModal(false)}>✕</button>
            </div>
            <div className="cpay-modal-body">
              <div className="cpay-copy-list">
                {[['Account Name', BANK_DETAILS.accountName], ['Bank', BANK_DETAILS.bank], ['Branch', BANK_DETAILS.branch], ['Account Number', BANK_DETAILS.accountNumber], ['IFSC Code', BANK_DETAILS.ifsc], ['Account Type', BANK_DETAILS.accountType], ['UPI ID', BANK_DETAILS.upiId]].map(([k, v]) => <div key={k} className="cpay-copy-row">
                    <div className="cpay-copy-label">{k}</div>
                    <div className="cpay-copy-value">{v}</div>
                    <button className="cpay-btn cpay-btn-outline cpay-btn-sm" onClick={() => copy(k, v)}>
                      {copiedKey === k ? '✓' : 'Copy'}
                    </button>
                  </div>)}
              </div>
              <button className="cpay-btn cpay-btn-primary cp-payments-page-10" onClick={() => copy('ALL', Object.values(BANK_DETAILS).join(' | '))}>
                {copiedKey === 'ALL' ? '✓ Copied All Details' : '📋 Copy All Details'}
              </button>
            </div>
          </div>
        </div>, document.getElementById('client-portal-root') || document.body)}

      {/* ══ DETAIL VIEW MODAL ══ */}
      {detailModal && createPortal(<div className="cpay-modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="cpay-modal" onClick={e => e.stopPropagation()}>
            <div className="cpay-modal-hdr">
              <span className="cpay-modal-hdr-icon">🧾</span>
              <div>
                <div className="cpay-modal-title">{detailModal.id}</div>
                <div className="cpay-modal-sub">{detailModal.invoice}</div>
              </div>
              <button className="cpay-modal-close" onClick={() => setDetailModal(null)}>✕</button>
            </div>
            <div className="cpay-modal-body">
              <div className="cpay-detail-amount-label">Amount</div>
              <div className="cpay-detail-amount">{fmt(detailModal.amount)}</div>

              <div className="cpay-detail-grid">
                <div><div className="cpay-detail-field-label">Method</div><div className="cpay-detail-field-value">{detailModal.method}</div></div>
                <div><div className="cpay-detail-field-label">Gateway</div><div className="cpay-detail-field-value">{detailModal.gateway || 'Manual'}</div></div>
                <div><div className="cpay-detail-field-label">Reference / UTR</div><div className="cpay-detail-field-value">{detailModal.ref}</div></div>
                <div>
                  <div className="cpay-detail-field-label">Status</div>
                  <span className="cpay-badge cp-payments-page-11" style={{
                background: STATUS_MAP[detailModal.status].bg,
                color: STATUS_MAP[detailModal.status].color
              }}>
                    <span className="cpay-badge-dot" style={{
                  background: STATUS_MAP[detailModal.status].dot
                }} />{STATUS_MAP[detailModal.status].label}
                  </span>
                </div>
              </div>

              <div className="cp-payments-page-12">Timeline</div>
              <div className="cpay-timeline">
                {buildTimeline(detailModal).map((step, i) => <div key={i} className="cpay-tl-step">
                    <div className={`cpay-tl-dot${step.done ? ' done' : ''}${step.warn ? ' warn' : ''}`} />
                    <div className={`cpay-tl-label${step.done ? '' : ' pending-txt'}`}>{step.label}</div>
                    <div className="cpay-tl-date">{step.date}</div>
                  </div>)}
              </div>

              <div className="cp-payments-page-13">
                {detailModal.status !== 'received' ? <button className="cpay-btn cpay-btn-primary cp-payments-page-14" disabled={busyId === detailModal._id} onClick={() => handlePayNow(detailModal)}>{busyId === detailModal._id ? 'Opening…' : '⚡ Pay Now'}</button> : <button className="cpay-btn cpay-btn-outline cp-payments-page-15" onClick={() => printReceipt(detailModal)}>⬇️ Download Receipt</button>}
              </div>
            </div>
          </div>
        </div>, document.getElementById('client-portal-root') || document.body)}

    </div>;
}