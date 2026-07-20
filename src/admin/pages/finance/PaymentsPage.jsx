import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../../constants/tokens';
import { fmtDateDMY } from '../../../shared/formatDate';
import { SBadge, TypeTag } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { paymentsApi } from '../../services/api';

/* ── Bank Details (static, not backend-driven) ───────────────────────────── */
const BANK_DETAILS = {
  accountName: 'CoolTech AC Services Pvt Ltd',
  accountNumber: '1234567890123456',
  ifsc: 'HDFC0001234',
  bank: 'HDFC Bank',
  branch: 'Koramangala, Bengaluru',
  accountType: 'Current',
  upiId: 'cooltech@hdfcbank'
};
const PAY_STATUS_MAP = {
  received: {
    label: 'Received',
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  pending: {
    label: 'Pending',
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  overdue: {
    label: 'Overdue',
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  }
};
const METHOD_ICON = {
  UPI: '📱',
  Cash: '💵',
  Cheque: '📋',
  'Bank Transfer': '🏦',
  'Credit Card': '💳',
  Razorpay: '⚡',
  '—': '❓'
};
const PAYMENT_COLUMNS = [{
  label: "Pay ID",
  key: "id",
  width: 12,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: COLORS.brand,
    fontSize: 11
  }
}, {
  label: "Invoice",
  key: "invoice",
  width: 12,
  tdStyle: {
    fontFamily: "monospace",
    fontSize: 11
  }
}, {
  label: "Customer",
  key: "customer",
  width: 16,
  tdStyle: {
    fontWeight: 700,
    fontSize: 13
  }
}, {
  label: "Amount (₹)",
  key: "amount",
  width: 12,
  format: v => v,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 800,
    color: COLORS.brand
  }
}, {
  label: "Method",
  key: "method",
  width: 14,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Gateway",
  key: "gateway",
  width: 12,
  format: v => v || "Manual",
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Date",
  key: "date",
  width: 12,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Ref / UTR",
  key: "ref",
  width: 14,
  tdStyle: {
    fontFamily: "monospace",
    fontSize: 11
  }
}, {
  label: "Status",
  key: "status",
  width: 10,
  format: v => v,
  tdStyle: {
    fontSize: 12
  }
}];
const copy = text => navigator.clipboard?.writeText(text).catch(() => {});
const formatToday = () => fmtDateDMY(new Date());
const formatDisplayDate = dateLike => fmtDateDMY(dateLike);

// ── Normalizes a backend Payment doc into the shape the UI expects ─────────
const normalizePayment = (doc, idx) => ({
  _id: doc._id || doc.id,
  id: doc.paymentId || doc.id || `PAY-${idx}`,
  invoice: doc.invoice ?? '—',
  customer: doc.customer ?? 'Unknown',
  amount: Number(doc.amount) || 0,
  method: doc.method || '—',
  date: formatDisplayDate(doc.paidAt),
  ref: doc.ref || '—',
  status: doc.status || 'pending',
  gateway: doc.gateway || null,
  payLink: doc.payLink || null
});

// ── Dynamically loads Razorpay's Checkout.js only once, on demand ──────────
let rzpScriptPromise = null;
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (rzpScriptPromise) return rzpScriptPromise;
  rzpScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
    document.body.appendChild(script);
  });
  return rzpScriptPromise;
};

/* ── PaymentsPage ─────────────────────────────────────────── */
const PaymentsPage = ({
  openModal
}) => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [bankModal, setBankModal] = useState(false);
  const [markPaidModal, setMarkPaidModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [recordModal, setRecordModal] = useState(null);
  const [linkModal, setLinkModal] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null); // disables buttons mid-request

  // ── Fetch payments from backend ────────────────────────────────────────
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.list({
        limit: 500
      });
      const rows = (res?.data || []).map(normalizePayment);
      setPayments(rows);
    } catch (err) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // ── Copy helper with visual "Copied!" feedback ─────────────────────────
  const handleCopy = (key, text) => {
    copy(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(prev => prev === key ? null : prev), 1500);
  };
  const received = payments.filter(p => p.status === 'received').reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const overdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);

  // ── Search + filter hooks ────────────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: filteredPayments
  } = useTableSearch(payments, ['id', 'invoice', 'customer', 'method', 'ref', 'status'], {
    status: '',
    method: ''
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
  } = usePagination(filteredPayments, 10);
  const {
    exportProps
  } = useExport({
    title: "Payments & Collections",
    filename: "cooltech-payments",
    template: "generic_list",
    subtitle: `AC Services Platform · Payments · ${filteredPayments.length} records`,
    docId: "PAY-EXPORT",
    columns: PAYMENT_COLUMNS,
    rows: filteredPayments,
    showTotals: true,
    totalColumns: ["amount"]
  });

  // ── Build & print a standalone receipt document ─────────────────────────
  const printReceipt = p => {
    const w = window.open('', '_blank', 'width=440,height=640');
    if (!w) return;
    const rows = [['Invoice', p.invoice], ['Customer', p.customer], ['Method', p.method], ['Gateway', p.gateway || 'Manual'], ['Date', p.date], ['Ref / UTR', p.ref], ['Status', PAY_STATUS_MAP[p.status]?.label || p.status]].map(([k, v]) => `
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
          <div class="amount">₹${p.amount.toLocaleString()}</div>
          <table>${rows}</table>
          <div class="footer">This is a system-generated receipt and does not require a signature.</div>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  // ── REAL Razorpay Checkout.js flow ──────────────────────────────────────
  const handleRazorpayCheckout = async p => {
    setBusyId(p._id);
    try {
      await loadRazorpayScript();
      const order = await paymentsApi.createOrder({
        amount: p.amount,
        invoice: p.invoice,
        customer: p.customer,
        paymentDocId: p._id
      });
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'CoolTech AC Services',
        description: `Invoice ${p.invoice}`,
        prefill: {
          name: p.customer
        },
        theme: {
          color: '#EA580C'
        },
        handler: async response => {
          try {
            await paymentsApi.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentDocId: order.paymentDocId || p._id
            });
            await fetchPayments();
          } catch (err) {
            alert('Payment captured but verification failed: ' + err.message);
          }
        },
        modal: {
          ondismiss: () => setBusyId(null)
        }
      });
      rzp.open();
    } catch (err) {
      alert('Could not start Razorpay checkout: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ── REAL Razorpay Payment Link generation ───────────────────────────────
  const handleGeneratePaymentLink = async (p, {
    silent
  } = {}) => {
    setBusyId(p._id);
    try {
      const res = await paymentsApi.createPaymentLink({
        paymentDocId: p._id,
        invoice: p.invoice,
        customer: p.customer,
        amount: p.amount
      });
      await fetchPayments();
      if (!silent) handleCopy('rzp-link-' + p._id, res.link);
      return res.link;
    } catch (err) {
      alert('Could not generate payment link: ' + err.message);
      return null;
    } finally {
      setBusyId(null);
    }
  };

  // ── Standalone "Generate Payment Link" modal submit ─────────────────────
  // Creates a pending Payment row first (so it shows up in the transactions
  // table immediately), then generates the real Razorpay link against that
  // row's _id — so once the customer pays, the SAME row flips to Received
  // instead of the payment floating around disconnected from any record.
  const submitLinkModal = async () => {
    if (!linkModal) return;
    if (!linkModal.invoice || !linkModal.customer || !linkModal.amount) {
      alert('Invoice, customer and amount are required.');
      return;
    }
    setBusyId('link');
    try {
      const amountNum = Number(linkModal.amount);

      // 1. Create the pending row
      const created = await paymentsApi.create({
        invoice: linkModal.invoice,
        customer: linkModal.customer,
        amount: amountNum,
        method: 'Razorpay',
        status: 'pending',
        paidAt: null
      });
      const paymentDocId = created?._id;

      // 2. Generate the real Razorpay link, attached to that row
      const res = await paymentsApi.createPaymentLink({
        paymentDocId,
        invoice: linkModal.invoice,
        customer: linkModal.customer,
        amount: amountNum,
        contact: linkModal.contact || undefined,
        email: linkModal.email || undefined
      });
      setLinkModal(m => ({
        ...m,
        resultLink: res.link
      }));
      await fetchPayments(); // new pending row (with payLink) shows up immediately
    } catch (err) {
      alert('Could not generate payment link: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ── Manual Mark Paid (cash / cheque / bank transfer) ────────────────────
  const submitMarkPaid = async () => {
    if (!markPaidModal) return;
    setBusyId(markPaidModal._id);
    try {
      await paymentsApi.markPaid(markPaidModal._id, {
        method: markPaidModal.method,
        ref: markPaidModal.ref,
        date: markPaidModal.date,
        gateway: markPaidModal.method === 'Razorpay' ? 'Razorpay' : null
      });
      await fetchPayments();
      setMarkPaidModal(null);
    } catch (err) {
      alert('Failed to mark as paid: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ── Record Payment (create) ──────────────────────────────────────────────
  const submitRecordPayment = async () => {
    if (!recordModal) return;
    if (!recordModal.invoice || !recordModal.customer || !recordModal.amount) {
      alert('Invoice, customer and amount are required.');
      return;
    }
    setBusyId('new');
    try {
      await paymentsApi.create({
        invoice: recordModal.invoice,
        customer: recordModal.customer,
        amount: Number(recordModal.amount),
        method: recordModal.method,
        ref: recordModal.ref || undefined,
        status: recordModal.status,
        paidAt: recordModal.status === 'received' ? new Date().toISOString() : null
      });
      await fetchPayments();
      setRecordModal(null);
    } catch (err) {
      alert('Failed to record payment: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  // ── Soft delete ───────────────────────────────────────────────────────────
  const handleDelete = async p => {
    if (!window.confirm(`Move ${p.id} to trash?`)) return;
    setBusyId(p._id);
    try {
      await paymentsApi.remove(p._id);
      await fetchPayments();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };
  return <div className="page-body">

      {/* ── Page Header ── */}
      <div className="pay-page-hdr">
        <div>
          <div className="section-title">💳 Payments &amp; Collections</div>
          <div className="section-sub">Manage all incoming payments — online and offline</div>
        </div>
        <div className="section-actions">
          <button className="btn pay-btn-bank" onClick={() => setBankModal(true)}>🏦 Bank Details</button>
          <button className="btn pay-btn-rzp" onClick={() => setLinkModal({
          invoice: '',
          customer: '',
          amount: '',
          contact: '',
          email: '',
          resultLink: null
        })}>⚡ Razorpay Link</button>
          <button className="btn btn-primary" onClick={() => setRecordModal({
          invoice: '',
          customer: '',
          amount: '',
          method: 'Cash',
          ref: '',
          status: 'received'
        })}>+ Record Payment</button>
        </div>
      </div>

      {error && <div className="card card-body ap-payments-page-1">
          ⚠️ {error} — <button className="btn btn-sm" onClick={fetchPayments}>Retry</button>
        </div>}

      {/* ── KPI Cards ── */}
      <div className="kpi-grid-4">
        <KCard label="Received" value={`₹${(received / 1000).toFixed(1)}K`} sub="this month" icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="" />
        <KCard label="Pending" value={`₹${(pending / 1000).toFixed(1)}K`} sub="awaiting" icon="⏳" iconBg="#FFFBEB" color="#B45309" delay="1" />
        <KCard label="Overdue" value={`₹${(overdue / 1000).toFixed(1)}K`} sub="action needed" icon="⚠️" iconBg="#FEF2F2" color="#DC2626" delay="2" />
        <KCard label="Total Billed" value={`₹${((received + pending + overdue) / 1000).toFixed(1)}K`} sub="all invoices" icon="💰" iconBg="#FFF7ED" color={COLORS.brand} delay="3" />
      </div>

      {/* ── Method Summary Cards ── */}
      <div className="pay-method-grid">
        {[{
        label: 'Razorpay',
        icon: '⚡',
        color: '#4F46E5',
        bg: '#EEF2FF',
        desc: 'Cards · UPI · Netbanking'
      }, {
        label: 'UPI',
        icon: '📱',
        color: '#7C3AED',
        bg: '#F5F3FF',
        desc: 'GPay · PhonePe · Paytm'
      }, {
        label: 'Bank Transfer',
        icon: '🏦',
        color: '#1D4ED8',
        bg: '#EFF6FF',
        desc: 'NEFT · RTGS · IMPS'
      }, {
        label: 'Credit Card',
        icon: '💳',
        color: '#DC2626',
        bg: '#FEF2F2',
        desc: 'Visa · Mastercard · Amex'
      }, {
        label: 'Cash',
        icon: '💵',
        color: '#16A34A',
        bg: '#ECFDF5',
        desc: 'On-site collection'
      }, {
        label: 'Cheque',
        icon: '📋',
        color: '#0369A1',
        bg: '#E0F2FE',
        desc: 'Demand draft / PDC'
      }].map(m => <div key={m.label} className="pay-method-card" style={{
        '--mc': m.color,
        '--mb': m.bg
      }}>
            <div className="pay-method-icon">{m.icon}</div>
            <div className="pay-method-label" style={{
          color: m.color
        }}>{m.label}</div>
            <div className="pay-method-desc">{m.desc}</div>
            <div className="pay-method-count" style={{
          color: m.color,
          background: m.bg
        }}>
              {payments.filter(p => p.method === m.label && p.status === 'received').length} payments
            </div>
          </div>)}
      </div>

      {/* ── Tabs ── */}
      <div className="page-tabs">
        {[['transactions', '📋 All Transactions'], ['razorpay', '⚡ Razorpay Gateway'], ['bank', '🏦 Bank Transfer'], ['methods', '💡 How to Accept Payment']].map(([id, lbl]) => <button key={id} className={`page-tab${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id)}>{lbl}</button>)}
      </div>

      {/* ══ TAB: ALL TRANSACTIONS ══ */}
      {activeTab === 'transactions' && <div className="card">
          <div className="ap-payments-page-2">
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by pay ID, invoice, customer, ref…" />
            <FilterSelect value={activeFilters.status} onChange={val => setFilter("status", val)} options={["received", "pending", "overdue"]} allLabel="All Statuses" />
            <FilterSelect value={activeFilters.method} onChange={val => setFilter("method", val)} options={["UPI", "Cash", "Cheque", "Bank Transfer", "Credit Card", "Razorpay"]} allLabel="All Methods" />
            <div className="ap-payments-page-3">
              <ExportDropdown {...exportProps} />
              <button className="btn pay-btn-remind" onClick={() => openModal?.('send_reminder_all')}>📤 Send Reminders</button>
            </div>
          </div>

          {loading ? <div className="ap-payments-page-4">Loading payments…</div> : <>
              <div className="table-wrap">
                <table className="data-table">
                  <Thead cols={['Pay ID', 'Invoice', 'Customer', 'Amount', 'Method', 'Gateway', 'Date', 'Ref / UTR', 'Status', 'Actions']} />
                  <tbody>
                    {paginated.map((p, i) => <tr key={p._id} className={i % 2 === 0 ? '' : 'row-alt'}>
                        <td><span className="td-brand">{p.id}</span></td>
                        <td><span className="td-mono">{p.invoice}</span></td>
                        <td><span className="td-bold">{p.customer}</span></td>
                        <td><span className="td-amount">₹{p.amount.toLocaleString()}</span></td>
                        <td>
                          <div className="pay-method-cell">
                            <span>{METHOD_ICON[p.method] || '❓'}</span>
                            <span className="pay-method-name">{p.method}</span>
                          </div>
                        </td>
                        <td>
                          {p.gateway ? <span className="pay-gateway-tag">⚡ {p.gateway}</span> : <span className="pay-manual-tag">Manual</span>}
                        </td>
                        <td className="td-mono">{p.date}</td>
                        <td><span className="td-mono">{p.ref}</span></td>
                        <td><SBadge s={p.status} map={PAY_STATUS_MAP} /></td>
                        <td>
                          <div className="pay-actions">
                            {p.status !== 'received' && <button className="btn btn-sm btn-success" disabled={busyId === p._id} onClick={() => setMarkPaidModal({
                      _id: p._id,
                      id: p.id,
                      invoice: p.invoice,
                      customer: p.customer,
                      amount: p.amount,
                      method: p.method && p.method !== '—' ? p.method : 'Cash',
                      ref: '',
                      date: formatToday()
                    })}>Mark Paid</button>}
                            {p.status !== 'received' && <button className="btn btn-sm pay-btn-link" disabled={busyId === p._id} onClick={() => handleRazorpayCheckout(p)}>⚡ Pay Now</button>}
                            {p.status === 'overdue' && <button className="btn btn-sm btn-danger" onClick={() => openModal?.('send_quotation', {
                      id: p.invoice
                    })}>Remind</button>}
                            <button className="btn btn-sm btn-ghost" onClick={() => setReceiptModal(p)}>Receipt</button>
                            <button className="btn btn-sm btn-ghost" disabled={busyId === p._id} onClick={() => handleDelete(p)}>🗑️</button>
                          </div>
                        </td>
                      </tr>)}
                    {paginated.length === 0 && <tr><td colSpan={10} className="ap-payments-page-5">No payments found.</td></tr>}
                  </tbody>
                </table>
              </div>

              <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
            </>}
        </div>}

      {/* ══ TAB: RAZORPAY GATEWAY ══ */}
      {activeTab === 'razorpay' && <div className="page-body">

          <div className="pay-rzp-banner">
            <div className="pay-rzp-banner-icon">⚡</div>
            <div className="pay-rzp-banner-body">
              <div className="pay-rzp-banner-title">Razorpay Payment Gateway</div>
              <div className="pay-rzp-banner-desc">Accept UPI, Credit/Debit Cards, Net Banking, Wallets and EMI in one integration. Send instant payment links via SMS or WhatsApp.</div>
            </div>
            <div className="pay-rzp-banner-actions">
              <button className="btn pay-btn-rzp-test" onClick={() => handleRazorpayCheckout({
            _id: null,
            invoice: 'INV-TEST',
            customer: 'Test Customer',
            amount: 1
          })}>🧪 Test Checkout (₹1)</button>
              <button className="btn pay-btn-rzp-docs" onClick={() => window.open('https://razorpay.com/docs/', '_blank')}>📖 API Docs →</button>
            </div>
          </div>

          {/* Payment link generator — wired to real Payment Links */}
          <div className="card card-body">
            <div className="card-hdr-title">Generate Payment Link</div>
            <div className="section-sub ap-payments-page-6">
              Pick an unpaid invoice below and generate a real, shareable Razorpay payment link.
            </div>
            <div className="pay-copy-list">
              {payments.filter(p => p.status !== 'received').slice(0, 6).map(p => <div key={p._id} className="pay-copy-row">
                  <div className="pay-copy-label">{p.invoice} — {p.customer}</div>
                  <div className="pay-copy-value">₹{p.amount.toLocaleString()}</div>
                  {p.payLink ? <button className="btn btn-sm pay-btn-copy" onClick={() => handleCopy('rzp-link-' + p._id, p.payLink)}>
                      {copiedKey === 'rzp-link-' + p._id ? '✓ Copied' : '📋 Copy Link'}
                    </button> : <button className="btn btn-sm pay-btn-rzp" disabled={busyId === p._id} onClick={() => handleGeneratePaymentLink(p)}>
                      ⚡ Generate Link
                    </button>}
                </div>)}
              {payments.filter(p => p.status !== 'received').length === 0 && <div className="ap-payments-page-7">No unpaid invoices right now.</div>}
            </div>
          </div>

          {/* Accepted modes */}
          <div className="card card-body">
            <div className="card-hdr-title ap-payments-page-8">What Razorpay Accepts</div>
            <div className="pay-accept-grid">
              {[{
            icon: '📱',
            label: 'UPI',
            desc: 'GPay, PhonePe, Paytm, BHIM',
            color: '#7C3AED',
            bg: '#F5F3FF'
          }, {
            icon: '💳',
            label: 'Cards',
            desc: 'Visa, Mastercard, RuPay, Amex',
            color: '#DC2626',
            bg: '#FEF2F2'
          }, {
            icon: '🏦',
            label: 'Net Banking',
            desc: 'All major banks — HDFC, SBI, ICICI',
            color: '#1D4ED8',
            bg: '#EFF6FF'
          }, {
            icon: '👜',
            label: 'Wallets',
            desc: 'Paytm, Amazon Pay, Freecharge',
            color: '#16A34A',
            bg: '#ECFDF5'
          }, {
            icon: '📅',
            label: 'EMI',
            desc: 'No-cost EMI on cards 3–24 months',
            color: '#D97706',
            bg: '#FFFBEB'
          }, {
            icon: '🤝',
            label: 'Buy Now Pay Later',
            desc: 'Simpl, LazyPay, ePayLater',
            color: '#0369A1',
            bg: '#E0F2FE'
          }, {
            icon: '🌐',
            label: 'International Cards',
            desc: 'For global / NRI clients',
            color: '#64748B',
            bg: '#F8FAFC'
          }, {
            icon: '🔗',
            label: 'Payment Links',
            desc: 'No website needed — share link',
            color: '#4F46E5',
            bg: '#EEF2FF'
          }].map(m => <div key={m.label} className="pay-accept-card" style={{
            background: m.bg,
            borderColor: m.color + '30'
          }}>
                  <div className="pay-accept-icon">{m.icon}</div>
                  <div className="pay-accept-label" style={{
              color: m.color
            }}>{m.label}</div>
                  <div className="pay-accept-desc">{m.desc}</div>
                </div>)}
            </div>
          </div>
        </div>}

      {/* ══ TAB: BANK TRANSFER ══ */}
      {activeTab === 'bank' && <div className="page-body">
          <div className="pay-bank-card">
            <div className="pay-bank-circle pay-bank-circle-1" />
            <div className="pay-bank-circle pay-bank-circle-2" />
            <div className="pay-bank-eyebrow">COMPANY BANK ACCOUNT</div>
            <div className="pay-bank-name">{BANK_DETAILS.bank}</div>
            <div className="pay-bank-branch">{BANK_DETAILS.branch}</div>
            <div className="pay-bank-details-grid">
              <div>
                <div className="pay-bank-field-label">ACCOUNT NAME</div>
                <div className="pay-bank-field-value">{BANK_DETAILS.accountName}</div>
              </div>
              <div>
                <div className="pay-bank-field-label">ACCOUNT TYPE</div>
                <div className="pay-bank-field-value">{BANK_DETAILS.accountType} Account</div>
              </div>
              <div>
                <div className="pay-bank-field-label">ACCOUNT NUMBER</div>
                <div className="pay-bank-field-value pay-bank-mono">{BANK_DETAILS.accountNumber}</div>
              </div>
              <div>
                <div className="pay-bank-field-label">IFSC CODE</div>
                <div className="pay-bank-field-value pay-bank-mono">{BANK_DETAILS.ifsc}</div>
              </div>
            </div>
            <div className="pay-bank-upi-row">
              <span className="pay-bank-upi-label">UPI ID:</span>
              <span className="pay-bank-upi-value">{BANK_DETAILS.upiId}</span>
            </div>
          </div>

          <div className="card card-body">
            <div className="card-hdr-title ap-payments-page-9">Quick Copy for Customer Communication</div>
            <div className="pay-copy-list">
              {[{
            label: 'Account Number',
            value: BANK_DETAILS.accountNumber
          }, {
            label: 'IFSC Code',
            value: BANK_DETAILS.ifsc
          }, {
            label: 'UPI ID',
            value: BANK_DETAILS.upiId
          }, {
            label: 'Full Details',
            value: `Account: ${BANK_DETAILS.accountName}\nBank: ${BANK_DETAILS.bank}\nAccount No: ${BANK_DETAILS.accountNumber}\nIFSC: ${BANK_DETAILS.ifsc}\nUPI: ${BANK_DETAILS.upiId}`
          }].map(f => <div key={f.label} className="pay-copy-row">
                  <div className="pay-copy-label">{f.label}</div>
                  <div className="pay-copy-value">{f.value.split('\n')[0]}{f.value.includes('\n') && '…'}</div>
                  <button className="btn btn-sm pay-btn-copy" onClick={() => handleCopy(f.label, f.value)}>
                    {copiedKey === f.label ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>)}
            </div>
          </div>

          <div className="card card-body">
            <div className="card-hdr-title ap-payments-page-10">Bank Transfer Types Accepted</div>
            <div className="grid-2">
              {[{
            type: 'NEFT',
            full: 'National Electronic Funds Transfer',
            limit: 'No limit',
            time: '30 min – 2 hrs',
            icon: '🏦',
            color: '#1D4ED8',
            bg: '#EFF6FF',
            best: 'Regular payments'
          }, {
            type: 'RTGS',
            full: 'Real Time Gross Settlement',
            limit: 'Min ₹2 Lakh',
            time: 'Real-time',
            icon: '⚡',
            color: '#16A34A',
            bg: '#ECFDF5',
            best: 'Large B2B amounts'
          }, {
            type: 'IMPS',
            full: 'Immediate Payment Service',
            limit: 'Up to ₹5 Lakh',
            time: 'Instant 24×7',
            icon: '🚀',
            color: '#7C3AED',
            bg: '#F5F3FF',
            best: 'Quick transfers'
          }, {
            type: 'UPI',
            full: 'Unified Payments Interface',
            limit: 'Up to ₹1 Lakh',
            time: 'Instant',
            icon: '📱',
            color: '#D97706',
            bg: '#FFFBEB',
            best: 'Small & medium amounts'
          }].map(t => <div key={t.type} className="pay-transfer-card" style={{
            background: t.bg,
            borderColor: t.color + '30'
          }}>
                  <div className="pay-transfer-hdr">
                    <span className="pay-transfer-icon">{t.icon}</span>
                    <div>
                      <div className="pay-transfer-type" style={{
                  color: t.color
                }}>{t.type}</div>
                      <div className="pay-transfer-full">{t.full}</div>
                    </div>
                  </div>
                  <div className="pay-transfer-meta">
                    {[['Limit', t.limit], ['Settlement', t.time], ['Best for', t.best]].map(([k, v]) => <div key={k}>
                        <div className="pay-transfer-meta-key">{k}</div>
                        <div className="pay-transfer-meta-val">{v}</div>
                      </div>)}
                  </div>
                </div>)}
            </div>
          </div>

          <div className="card card-body">
            <div className="card-hdr-title">WhatsApp Payment Message Template</div>
            <div className="section-sub ap-payments-page-11">Send this to customers requesting bank transfer instructions.</div>
            <div className="pay-wa-template">{`Dear Customer,\n\nThank you for choosing CoolTech AC Services! 🙏❄️\n\nPlease transfer the invoice amount to:\n\n🏦 Bank: ${BANK_DETAILS.bank}\n📋 Account Name: ${BANK_DETAILS.accountName}\n🔢 Account No: ${BANK_DETAILS.accountNumber}\n🏷 IFSC: ${BANK_DETAILS.ifsc}\n📱 UPI ID: ${BANK_DETAILS.upiId}\n\nAfter transfer, please share the UTR/reference number so we can confirm receipt.\n\nThank you! 😊`}</div>
            <button className="btn btn-success pay-wa-copy-btn" onClick={() => handleCopy('wa-template', `Dear Customer,\n\nThank you for choosing CoolTech AC Services!\n\nBank: ${BANK_DETAILS.bank}\nAccount: ${BANK_DETAILS.accountNumber}\nIFSC: ${BANK_DETAILS.ifsc}\nUPI: ${BANK_DETAILS.upiId}`)}>{copiedKey === 'wa-template' ? '✓ Copied' : '📋 Copy Message'}</button>
          </div>
        </div>}

      {/* ══ TAB: HOW TO ACCEPT PAYMENTS ══ (unchanged, static reference content) */}
      {activeTab === 'methods' && <div className="card card-body">
          <div className="section-title ap-payments-page-12">💡 All Payment Methods — How Customers Pay You</div>
          <div className="section-sub ap-payments-page-13">CoolTech supports 6 ways for customers to pay their invoices.</div>
          <div className="page-body">
            {[{
          n: '1',
          icon: '⚡',
          label: 'Razorpay Online Gateway',
          color: '#4F46E5',
          bg: '#EEF2FF',
          how: "Admin generates a payment link from the Razorpay tab → shares via WhatsApp/SMS → customer clicks, chooses UPI / card / netbanking → payment credited instantly.",
          steps: ["Click 'Generate Link' → link created via Razorpay API", "System stores the real rzp.io/l/... link on the payment record", "Share link via WhatsApp to customer", "Customer pays online in under 30 seconds", "Razorpay webhook / verify call auto-marks the invoice received"],
          fee: '1.75% + GST per transaction',
          suitable: 'All invoice amounts, remote customers'
        }, {
          n: '2',
          icon: '📱',
          label: 'UPI (GPay / PhonePe / Paytm)',
          color: '#7C3AED',
          bg: '#F5F3FF',
          how: 'Customer scans your UPI QR or sends to your UPI ID directly from any UPI app. Admin records payment with UTR number.',
          steps: ['Share UPI ID: ' + BANK_DETAILS.upiId, 'Customer sends amount from any UPI app', 'Customer shares UTR/transaction ID', "Admin clicks 'Mark Paid' → selects UPI → enters UTR", 'Invoice marked Paid'],
          fee: 'Free (no MDR on UPI since 2022)',
          suitable: '₹1 – ₹1 Lakh, residential customers'
        }, {
          n: '3',
          icon: '🏦',
          label: 'Bank Transfer (NEFT / RTGS / IMPS)',
          color: '#1D4ED8',
          bg: '#EFF6FF',
          how: "Customer transfers directly to your bank account. Admin confirms via bank statement and records the UTR/NEFT reference.",
          steps: ["Share bank details from 'Bank Transfer' tab", "Customer does NEFT/IMPS from their bank", "Customer shares transaction reference (UTR)", "Admin verifies in bank statement", "Admin records payment with UTR reference"],
          fee: 'Free (bank charges may apply to sender)',
          suitable: '₹2 Lakh+ commercial clients (RTGS), all amounts (NEFT/IMPS)'
        }, {
          n: '4',
          icon: '💳',
          label: 'Credit / Debit Card',
          color: '#DC2626',
          bg: '#FEF2F2',
          how: "Via Razorpay checkout only. Generate a payment link or use Pay Now — customer completes card payment on Razorpay's secure checkout.",
          steps: ['Generate a Razorpay link or click Pay Now', 'Customer opens link, selects Card', 'Enters card details on Razorpay secure page', 'OTP verification on bank page', 'Payment confirmed — admin notified instantly'],
          fee: '1.75–2% + GST (Razorpay charges)',
          suitable: 'One-time payments, AMC renewals'
        }, {
          n: '5',
          icon: '💵',
          label: 'Cash',
          color: '#16A34A',
          bg: '#ECFDF5',
          how: 'Technician or admin collects cash on-site. Admin records cash receipt manually.',
          steps: ['Technician completes job, collects cash', 'Issue manual cash receipt to customer', "Admin opens Payments → 'Record Payment'", 'Select method: Cash, enter amount + date', 'Invoice marked Paid, cash logged'],
          fee: 'Free',
          suitable: 'Small residential jobs, on-site collection'
        }, {
          n: '6',
          icon: '📋',
          label: 'Cheque / Demand Draft',
          color: '#0369A1',
          bg: '#E0F2FE',
          how: 'Customer issues a cheque. Admin deposits it, waits for clearance (2-3 days), then marks the invoice paid after realisation.',
          steps: ['Customer gives cheque in favour of "' + BANK_DETAILS.accountName + '"', 'Admin records payment as Pending + Cheque method', 'Deposit cheque at ' + BANK_DETAILS.bank, 'Wait for clearance (2-3 business days)', 'After clearance: Mark Paid'],
          fee: 'Free (possible bank charges for outstation)',
          suitable: 'Commercial clients, large AMC amounts, PDC'
        }].map(m => <div key={m.n} className="pay-howto-card" style={{
          background: m.bg,
          borderColor: m.color + '30'
        }}>
                <div className="pay-howto-hdr">
                  <div className="pay-howto-icon-wrap" style={{
              background: m.color
            }}>{m.icon}</div>
                  <div>
                    <div className="pay-howto-label" style={{
                color: m.color
              }}>{m.label}</div>
                    <div className="pay-howto-meta">Fee: {m.fee} · Best for: {m.suitable}</div>
                  </div>
                </div>
                <div className="pay-howto-how">{m.how}</div>
                <div className="pay-howto-steps">
                  {m.steps.map((s, i) => <div key={i} className="pay-howto-step">
                      <span className="pay-howto-step-num" style={{
                background: m.color
              }}>{i + 1}</span>
                      <span className="pay-howto-step-text">{s}</span>
                    </div>)}
                </div>
              </div>)}
          </div>
        </div>}

      {/* ══ GENERATE PAYMENT LINK MODAL (standalone, real Razorpay link) ══ */}
      {linkModal && createPortal(<div className="modal-overlay" onClick={() => setLinkModal(null)}>
          <div className="modal-box ap-payments-page-14" onClick={e => e.stopPropagation()}>
            <div className="pay-bank-modal-hdr">
              <span className="pay-bank-modal-hdr-icon">⚡</span>
              <div>
                <div className="pay-bank-modal-title">Generate Payment Link</div>
                <div className="pay-bank-modal-sub">Creates a real, shareable Razorpay link</div>
              </div>
              <button className="pay-rzp-modal-close" onClick={() => setLinkModal(null)}>✕</button>
            </div>

            {!linkModal.resultLink ? <div className="modal-body">
                <div className="form-row">
                  <label className="form-label">Customer Name</label>
                  <input className="form-input" placeholder="Meera Iyer" value={linkModal.customer} onChange={e => setLinkModal(m => ({
              ...m,
              customer: e.target.value
            }))} />
                </div>
                <div className="form-row">
                  <label className="form-label">Invoice</label>
                  <input className="form-input" placeholder="INV-2041" value={linkModal.invoice} onChange={e => setLinkModal(m => ({
              ...m,
              invoice: e.target.value
            }))} />
                </div>
                <div className="form-row">
                  <label className="form-label">Amount (₹)</label>
                  <input className="form-input pay-mono-input" type="number" placeholder="5310" value={linkModal.amount} onChange={e => setLinkModal(m => ({
              ...m,
              amount: e.target.value
            }))} />
                </div>
                <div className="form-row">
                  <label className="form-label">Customer Mobile (optional — for SMS notify)</label>
                  <input className="form-input" placeholder="9999999999" value={linkModal.contact} onChange={e => setLinkModal(m => ({
              ...m,
              contact: e.target.value
            }))} />
                </div>
                <div className="form-row">
                  <label className="form-label">Customer Email (optional — for email notify)</label>
                  <input className="form-input" placeholder="customer@example.com" value={linkModal.email} onChange={e => setLinkModal(m => ({
              ...m,
              email: e.target.value
            }))} />
                </div>
                <button onClick={submitLinkModal} disabled={busyId === 'link'} style={{
            cursor: busyId === 'link' ? "not-allowed" : "pointer",
            opacity: busyId === 'link' ? "0.6" : "1"
          }} className="ap-payments-page-15">{busyId === 'link' ? 'Generating…' : '⚡ Generate Link'}</button>
              </div> : <div className="modal-body">
                <div className="pay-link-row">
                  <div className="pay-link-url">{linkModal.resultLink}</div>
                  <button className="btn btn-sm pay-btn-copy" onClick={() => handleCopy('new-rzp-link', linkModal.resultLink)}>
                    {copiedKey === 'new-rzp-link' ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button className="btn btn-sm btn-success" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi ${linkModal.customer}, please pay ₹${Number(linkModal.amount).toLocaleString()} for ${linkModal.invoice} via this secure link: ${linkModal.resultLink}`)}`, '_blank')}>📲 WhatsApp</button>
                </div>
                <button className="btn ap-payments-page-16" onClick={() => setLinkModal(null)}>Done</button>
              </div>}
          </div>
        </div>, document.body)}

      {/* ══ RECORD PAYMENT MODAL (create) ══ */}
      {recordModal && createPortal(<div className="modal-overlay" onClick={() => setRecordModal(null)}>
          <div className="modal-box ap-payments-page-17" onClick={e => e.stopPropagation()}>
            <div className="pay-bank-modal-hdr">
              <span className="pay-bank-modal-hdr-icon">➕</span>
              <div>
                <div className="pay-bank-modal-title">Record Payment</div>
                <div className="pay-bank-modal-sub">Manually add a payment entry</div>
              </div>
              <button className="pay-rzp-modal-close" onClick={() => setRecordModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label className="form-label">Invoice</label>
                <input className="form-input" placeholder="INV-2043" value={recordModal.invoice} onChange={e => setRecordModal(m => ({
              ...m,
              invoice: e.target.value
            }))} />
              </div>
              <div className="form-row">
                <label className="form-label">Customer</label>
                <input className="form-input" placeholder="Customer name" value={recordModal.customer} onChange={e => setRecordModal(m => ({
              ...m,
              customer: e.target.value
            }))} />
              </div>
              <div className="form-row">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input pay-mono-input" type="number" placeholder="0" value={recordModal.amount} onChange={e => setRecordModal(m => ({
              ...m,
              amount: e.target.value
            }))} />
              </div>
              <div className="form-row">
                <label className="form-label">Method</label>
                <select className="form-input" value={recordModal.method} onChange={e => setRecordModal(m => ({
              ...m,
              method: e.target.value
            }))}>
                  {['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Cheque', 'Razorpay'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Status</label>
                <select className="form-input" value={recordModal.status} onChange={e => setRecordModal(m => ({
              ...m,
              status: e.target.value
            }))}>
                  <option value="received">Received</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Reference / UTR (optional)</label>
                <input className="form-input" placeholder="Leave blank to auto-generate" value={recordModal.ref} onChange={e => setRecordModal(m => ({
              ...m,
              ref: e.target.value
            }))} />
              </div>
              <button onClick={submitRecordPayment} disabled={busyId === 'new'} style={{
            cursor: busyId === 'new' ? "not-allowed" : "pointer",
            opacity: busyId === 'new' ? "0.6" : "1"
          }} className="ap-payments-page-18">{busyId === 'new' ? 'Saving…' : '➕ Save Payment'}</button>
            </div>
          </div>
        </div>, document.body)}

      {/* ══ MARK PAID MODAL ══ */}
      {markPaidModal && createPortal(<div className="modal-overlay" onClick={() => setMarkPaidModal(null)}>
          <div className="modal-box ap-payments-page-19" onClick={e => e.stopPropagation()}>
            <div className="pay-bank-modal-hdr">
              <span className="pay-bank-modal-hdr-icon">✅</span>
              <div>
                <div className="pay-bank-modal-title">Mark Payment as Received</div>
                <div className="pay-bank-modal-sub">{markPaidModal.invoice} — {markPaidModal.customer}</div>
              </div>
              <button className="pay-rzp-modal-close" onClick={() => setMarkPaidModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input pay-mono-input" value={markPaidModal.amount} disabled />
              </div>
              <div className="form-row">
                <label className="form-label">Payment Method</label>
                <select className="form-input" value={markPaidModal.method} onChange={e => setMarkPaidModal(m => ({
              ...m,
              method: e.target.value
            }))}>
                  {['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Cheque', 'Razorpay'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Reference / UTR</label>
                <input className="form-input" placeholder="e.g. NEFT8821, UPI4421, CASH — leave blank to auto-generate" value={markPaidModal.ref} onChange={e => setMarkPaidModal(m => ({
              ...m,
              ref: e.target.value
            }))} />
              </div>
              <div className="form-row">
                <label className="form-label">Date Received</label>
                <input className="form-input" value={markPaidModal.date} onChange={e => setMarkPaidModal(m => ({
              ...m,
              date: e.target.value
            }))} />
              </div>
              <button onClick={submitMarkPaid} disabled={busyId === markPaidModal._id} style={{
            cursor: busyId === markPaidModal._id ? "not-allowed" : "pointer",
            opacity: busyId === markPaidModal._id ? "0.6" : "1"
          }} className="ap-payments-page-20">{busyId === markPaidModal._id ? 'Saving…' : '✅ Confirm Payment Received'}</button>
            </div>
          </div>
        </div>, document.body)}

      {/* ══ RECEIPT MODAL ══ */}
      {receiptModal && createPortal(<div className="modal-overlay" onClick={() => setReceiptModal(null)}>
          <div className="modal-box ap-payments-page-21" onClick={e => e.stopPropagation()}>
            <div className="pay-bank-modal-hdr">
              <span className="pay-bank-modal-hdr-icon">🧾</span>
              <div>
                <div className="pay-bank-modal-title">Payment Receipt</div>
                <div className="pay-bank-modal-sub">{receiptModal.id}</div>
              </div>
              <button className="pay-rzp-modal-close" onClick={() => setReceiptModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="pay-copy-list">
                {[['Invoice', receiptModal.invoice], ['Customer', receiptModal.customer], ['Amount', `₹${receiptModal.amount.toLocaleString()}`], ['Method', receiptModal.method], ['Gateway', receiptModal.gateway || 'Manual'], ['Date', receiptModal.date], ['Ref / UTR', receiptModal.ref], ['Status', PAY_STATUS_MAP[receiptModal.status]?.label || receiptModal.status]].map(([k, v]) => <div key={k} className="pay-copy-row">
                    <div className="pay-copy-label">{k}</div>
                    <div className="pay-copy-value pay-copy-value--bold">{v}</div>
                  </div>)}
              </div>
              <div className="ap-payments-page-22">
                <button className="btn pay-btn-copy ap-payments-page-23" onClick={() => handleCopy('receipt', `Receipt ${receiptModal.id}\nInvoice: ${receiptModal.invoice}\nCustomer: ${receiptModal.customer}\nAmount: ₹${receiptModal.amount.toLocaleString()}\nMethod: ${receiptModal.method}\nDate: ${receiptModal.date}\nRef: ${receiptModal.ref}\nStatus: ${receiptModal.status}`)}>{copiedKey === 'receipt' ? '✓ Copied' : '📋 Copy Receipt'}</button>
                <button className="btn btn-primary ap-payments-page-24" onClick={() => printReceipt(receiptModal)}>🖨️ Print</button>
              </div>
            </div>
          </div>
        </div>, document.body)}

      {/* ══ BANK DETAILS MODAL ══ */}
      {bankModal && createPortal(<div className="modal-overlay" onClick={() => setBankModal(false)}>
          <div className="modal-box ap-payments-page-25" onClick={e => e.stopPropagation()}>
            <div className="pay-bank-modal-hdr">
              <span className="pay-bank-modal-hdr-icon">🏦</span>
              <div>
                <div className="pay-bank-modal-title">Bank Account Details</div>
                <div className="pay-bank-modal-sub">Share with customers for bank transfer</div>
              </div>
              <button className="pay-rzp-modal-close" onClick={() => setBankModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="pay-copy-list">
                {[['Account Name', BANK_DETAILS.accountName], ['Bank', BANK_DETAILS.bank], ['Branch', BANK_DETAILS.branch], ['Account Number', BANK_DETAILS.accountNumber], ['IFSC Code', BANK_DETAILS.ifsc], ['Account Type', BANK_DETAILS.accountType], ['UPI ID', BANK_DETAILS.upiId]].map(([k, v]) => <div key={k} className="pay-copy-row">
                    <div className="pay-copy-label">{k}</div>
                    <div className="pay-copy-value pay-copy-value--bold">{v}</div>
                    <button className="btn btn-sm pay-btn-copy" onClick={() => handleCopy(k, v)}>
                      {copiedKey === k ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>)}
              </div>
              <button className="btn btn-primary ap-payments-page-26" onClick={() => handleCopy('ALL', Object.values(BANK_DETAILS).join(' | '))}>{copiedKey === 'ALL' ? '✓ Copied All Details' : '📋 Copy All Details'}</button>
            </div>
          </div>
        </div>, document.body)}
    </div>;
};
export default PaymentsPage;