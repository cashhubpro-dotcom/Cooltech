import { INV_STATUS } from '../../constants/statusMaps';
import { invoicesApi } from '../../services/api';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge } from '../../components/ui/Badges';
import { KCard, Thead } from '../../components/ui/Cards';
import EditableDetailView from '../../components/ui/EditableDetailView';
import ActionDropdown from '../../components/ui/ActionDropdown';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import Modal from '../../components/ui/Modal';
import { FRow, FInput, FTextarea, FBtn } from '../../components/ui/Form';
// import PDFPreview from '../../components/layout/PDFPreview';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { useNavigate } from 'react-router-dom';
import { addToDeleted } from '../../store/deletedStore';
import logoImg from '../../assets/logo.png';
import qrImg from '../../assets/qrcode.png';
import signatureImg from '../../assets/signature.png';

/* ─── Column config for export ───────────────────────────── */
const INVOICE_COLUMNS = [{
  label: 'Invoice #',
  key: 'id',
  width: 13,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700,
    color: COLORS.brand,
    fontSize: 11
  }
}, {
  label: 'Job / Contract',
  key: 'job',
  width: 18,
  tdStyle: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: COLORS.muted
  }
}, {
  label: 'Customer',
  key: 'customer',
  width: 18,
  tdStyle: {
    fontSize: 13,
    fontWeight: 700
  }
}, {
  label: 'Amount (₹)',
  key: 'amount',
  width: 12,
  format: v => v,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 600
  }
}, {
  label: 'GST (₹)',
  key: 'tax',
  width: 10,
  format: v => v,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Total (₹)',
  key: 'total',
  width: 12,
  format: v => v,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 800,
    color: COLORS.brand
  }
}, {
  label: 'Date',
  key: 'date',
  width: 10,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Due',
  key: 'due',
  width: 10,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Status',
  key: 'status',
  width: 10,
  format: v => v,
  tdStyle: {
    fontSize: 12
  }
}];

/* ─── Company constants ──────────────────────────────────── */
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

/* ─── Number → Indian words ──────────────────────────────── */
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

/* ─── Border constants ───────────────────────────────────── */
const B = '1px solid #000';
const BL = '1px solid #bbb';

/* ─── Inline input helper ────────────────────────────────── */
const iS = (extra = {}) => ({
  padding: '4px 7px',
  borderRadius: 5,
  border: `1.5px solid ${COLORS.brand}70`,
  fontSize: 12,
  color: COLORS.h2,
  background: '#FAFFFE',
  fontFamily: FONTS.sans,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  ...extra
});

/* ─── normaliseInvoice ───────────────────────────────────── *
 * Accepts the raw API document (which may come from either
 * the legacy manual form OR the new CreateInvoicePage) and
 * produces a consistent shape that InvoiceTemplate can render.
 *
 * Key additions vs. original:
 *  - items / additionalCharges (line-item arrays)
 *  - subject, notes, terms
 *  - billTo* customer detail fields
 *  - globalDiscount
 */
const normaliseInvoice = inv => {
  /* ── totals ───────────────────────────────────────────── */
  const amount = inv.amount ?? inv.subtotal ?? 0;
  const tax = inv.tax ?? inv.gst ?? Math.round(amount * 0.18);
  const total = inv.total ?? inv.grandTotal ?? amount + tax;

  /* ── customer ─────────────────────────────────────────── */
  const customer = typeof inv.customer === 'object' && inv.customer !== null ? inv.customer.name ?? inv.customer.companyName ?? String(inv.customer._id ?? '') : inv.customerName ?? inv.customer ?? '';

  /* ── job ──────────────────────────────────────────────── */
  const looksLikeObjectId = v => typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v);
  const job = typeof inv.job === 'object' && inv.job !== null ? inv.job.jobId ?? 'JOB-' + String(inv.job._id ?? '').slice(-6).toUpperCase() : typeof inv.jobId === 'object' && inv.jobId !== null ? 'JOB-' + String(inv.jobId._id ?? inv.jobId).slice(-6).toUpperCase() : looksLikeObjectId(inv.job) ? 'JOB-' + inv.job.slice(-6).toUpperCase() : looksLikeObjectId(inv.jobId) ? 'JOB-' + inv.jobId.slice(-6).toUpperCase() : inv.jobId ?? inv.job ?? inv.contractId ?? '—';

  /* ── line items ───────────────────────────────────────── *
   * Prefer inv.items (set by CreateInvoicePage).
   * Fall back to two synthetic rows built from subtotal if
   * the document came from the old form.
   */
  let items = [];
  if (Array.isArray(inv.items) && inv.items.length > 0) {
    items = inv.items.map((it, i) => ({
      sr: i + 1,
      desc: it.name ?? it.desc ?? it.description ?? '',
      qty: it.qty ?? 1,
      rate: it.rate ?? 0,
      total: it.total ?? (it.qty ?? 1) * (it.rate ?? 0),
      gst: it.gst ?? 18,
      discount: it.discount ?? 0
    }));
  } else {
    // legacy fallback: two synthetic rows
    items = [{
      sr: 1,
      desc: 'AC Service / Repair Labour',
      qty: 1,
      rate: Math.round(amount * 0.6),
      total: Math.round(amount * 0.6),
      gst: 18,
      discount: 0
    }, {
      sr: 2,
      desc: 'Parts & Consumables',
      qty: 1,
      rate: Math.round(amount * 0.4),
      total: Math.round(amount * 0.4),
      gst: 18,
      discount: 0
    }];
  }

  /* ── additional charges ───────────────────────────────── */
  const additionalCharges = Array.isArray(inv.additionalCharges) ? inv.additionalCharges : [];

  /* ── date / due ───────────────────────────────────────── */
  const date = inv.date ?? (inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : '');
  const due = inv.due ?? inv.dueDate ?? '';
  return {
    ...inv,
    id: inv.invoiceId ?? inv.invoiceNumber ?? 'INV-' + String(inv._id).slice(-6).toUpperCase(),
    customer,
    job,
    amount,
    tax,
    total,
    date,
    due,
    status: inv.status ?? 'pending',
    // ── NEW fields from CreateInvoicePage ──────────────── //
    items,
    additionalCharges,
    subject: inv.subject ?? '',
    notes: inv.notes ?? '',
    terms: inv.terms ?? '',
    globalDiscount: inv.globalDiscount ?? 0,
    // billing contact
    billToAddress: inv.billToAddress ?? '',
    billToContact: inv.billToContact ?? '',
    billToPhone: inv.billToPhone ?? '',
    billToEmail: inv.billToEmail ?? ''
  };
};

/* ─── InvoiceTemplate ────────────────────────────────────── *
 * Renders the physical invoice document.
 * In view mode it shows saved data.
 * In edit mode every text cell becomes an <input>.
 *
 * Row data now comes directly from invoice.items (set by
 * CreateInvoicePage and preserved through normaliseInvoice).
 */
const InvoiceTemplate = ({
  invoice,
  editMode,
  editData,
  setEditData
}) => {
  const val = key => editData?.[key] ?? invoice[key] ?? '';
  const setK = key => e => setEditData(p => ({
    ...p,
    [key]: e.target.value
  }));

  /* ── Build editable rows from the invoice's items array ─ */
  // const buildRows = src => {
  //   const base = (src ?? []).map(it => ({
  //     sr:   it.sr ?? '',
  //     desc: it.desc ?? it.name ?? it.description ?? '',
  //     qty:  it.qty  ?? '',
  //     rate: it.rate ?? '',
  //   }));

  //   while (base.length < 6) base.push({ sr: '', desc: '', qty: '', rate: '' });
  //   return base;
  // };

  // const [rows, setRows] = useState(() => buildRows(invoice.items));

  // useEffect(() => { setRows(buildRows(invoice.items)); }, [invoice._id]);

  const buildRows = src => {
    return (src ?? []).map(it => ({
      sr: it.sr ?? '',
      desc: it.desc ?? it.name ?? it.description ?? '',
      qty: it.qty ?? '',
      rate: it.rate ?? ''
    }));
  };
  const [rows, setRows] = useState(() => buildRows(invoice.items));
  useEffect(() => {
    setRows(buildRows(invoice.items));
  }, [invoice._id]);
  const updateRow = (i, field, v) => setRows(prev => prev.map((r, idx) => idx === i ? {
    ...r,
    [field]: v
  } : r));
  const removeRow = i => setRows(prev => prev.filter((_, idx) => idx !== i));

  /* ── Totals ─────────────────────────────────────────── */
  // Use saved totals when available; recalculate from rows only as fallback
  const subtotalFromRows = rows.reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0), 0);
  const subtotal = invoice.amount > 0 ? invoice.amount : subtotalFromRows;
  const gst = invoice.tax > 0 ? invoice.tax : Math.round(subtotal * 0.18);
  const grandTotal = invoice.total > 0 ? invoice.total : subtotal + gst;

  /* ── Additional charges ─────────────────────────────── */
  const charges = val('additionalCharges') || invoice.additionalCharges || [];
  return <div className="ap-invoices-page-1">

      {/* SECTION 1 — Header */}
      <table className="ap-invoices-page-2">
        <tbody>
          <tr>
            <td className="ap-invoices-page-3">
              <div className="ap-invoices-page-4">{CO.tag1}</div>
              <div className="ap-invoices-page-5">{CO.tag2}</div>
              <div className="ap-invoices-page-6">{CO.address}</div>
            </td>
            <td className="ap-invoices-page-7">
              <img src={logoImg} alt="Alisha Engineering" onError={e => {
              e.target.outerHTML = `<div style="font-size:22px;font-weight:900;color:#1E3A5F;font-family:Arial;text-align:right;line-height:1.2">ALISHA<br/>ENGINEERING</div>`;
            }} className="ap-invoices-page-8" />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="ap-invoices-page-9" />

      {/* SECTION 2 — Invoice # and Date */}
      <table className="ap-invoices-page-10">
        <tbody>
          <tr>
            <td className="ap-invoices-page-11">
              {'Invoice #: '}
              {editMode ? <input value={val('id')} onChange={setK('id')} style={{
              ...iS({
                display: 'inline-block',
                width: 110,
                fontWeight: 700,
                fontSize: 13
              })
            }} /> : <strong>{invoice.id}</strong>}
            </td>
            <td className="ap-invoices-page-12">
              {'Invoice Date: '}
              {editMode ? <input value={val('date')} onChange={setK('date')} style={{
              ...iS({
                display: 'inline-block',
                width: 130,
                fontSize: 12
              })
            }} /> : <span>{invoice.date}</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 3 — Subject (from CreateInvoicePage) */}
      {(invoice.subject || editMode) && <div className="ap-invoices-page-13">
          <span className="ap-invoices-page-14">INVOICE SUBJECT:</span>
          {editMode ? <input value={val('subject')} onChange={setK('subject')} placeholder="e.g. AC Servicing at Sharma Residency" style={{
        ...iS({
          display: 'inline-block',
          width: '55%',
          fontSize: 12
        })
      }} /> : <span className="ap-invoices-page-15">{invoice.subject}</span>}
        </div>}

      {/* SECTION 4 — Bill From / To */}
      <table className="ap-invoices-page-16">
        <tbody>
          <tr>
            <td className="ap-invoices-page-17">Bill From:</td>
            <td className="ap-invoices-page-18">Bill To:</td>
          </tr>
          {[['Company Name', CO.name, 'customer', invoice.customer || '—', 'e.g. Sharma Residency'], ['Address', CO.address, 'billToAddress', invoice.billToAddress || '—', 'Full billing address'], ['Contact Person', CO.contact, 'billToContact', invoice.billToContact || '—', 'Mr. / Ms. Name'], ['Phone No', CO.phone, 'billToPhone', invoice.billToPhone || '—', '+91 XXXXX XXXXX'], ['Email', CO.email, 'billToEmail', invoice.billToEmail || '—', 'client@example.com']].map(([label, fromVal, toKey, toDefault, ph]) => <tr key={label}>
              <td className="ap-invoices-page-19">
                <span className="ap-invoices-page-20">{label}: </span>{fromVal}
              </td>
              <td className="ap-invoices-page-21">
                <span className="ap-invoices-page-22">{label}: </span>
                {editMode ? <input value={val(toKey)} onChange={setK(toKey)} placeholder={ph} style={{
              ...iS({
                display: 'inline-block',
                width: '60%',
                fontSize: 11
              })
            }} /> : <span style={{
              color: toDefault === '—' ? "var(--text-faint)" : "inherit"
            }}>{toDefault}</span>}
              </td>
            </tr>)}
        </tbody>
      </table>

      {/* SECTION 5 — Line Items */}
      <table className="ap-invoices-page-23">
        {/* <thead>
          <tr>
            {[
              { h: 'SR. NO',      w: '7%',  align: 'center' },
              { h: 'DESCRIPTION', w: '51%', align: 'left'   },
              { h: 'QTY',         w: '10%', align: 'center' },
              { h: 'RATE',        w: '16%', align: 'right'  },
              { h: 'TOTAL',       w: '16%', align: 'right'  },
            ].map(col => (
              <th key={col.h} style={{ border: B, padding: '7px 10px', background: '#1E3A5F', color: '#fff', fontSize: 11, fontWeight: 600, textAlign: col.align, width: col.w, letterSpacing: '.04em' }}>
                {col.h}
              </th>
            ))}
          </tr>
         </thead> */}
        <thead>
  <tr>
    {[{
            h: 'SR. NO',
            w: '7%',
            align: 'center'
          }, {
            h: 'DESCRIPTION',
            w: editMode ? '45%' : '51%',
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
          }, ...(editMode ? [{
            h: '',
            w: '6%',
            align: 'center'
          }] : [])].map(col => <th key={col.h || 'del'} style={{
            textAlign: col.align,
            width: col.w
          }} className="ap-invoices-page-24">
        {col.h}
      </th>)}
  </tr>
</thead>
        <tbody>
          {rows.map((row, i) => {
          const rowTotal = (parseFloat(row.qty) || 0) * (parseFloat(row.rate) || 0);
          return <tr key={i}>
                <td className="ap-invoices-page-25">
                  {editMode ? <input value={row.sr} onChange={e => updateRow(i, 'sr', e.target.value)} style={iS({
                textAlign: 'center',
                padding: '3px 4px'
              })} /> : row.sr}
                </td>
                <td className="ap-invoices-page-26">
                  {editMode ? <input value={row.desc} onChange={e => updateRow(i, 'desc', e.target.value)} style={iS()} placeholder="Description…" /> : row.desc}
                </td>
                <td className="ap-invoices-page-27">
                  {editMode ? <input type="number" value={row.qty} onChange={e => updateRow(i, 'qty', e.target.value)} style={iS({
                textAlign: 'center',
                padding: '3px 4px'
              })} /> : row.qty}
                </td>
                <td className="ap-invoices-page-28">
                  {editMode ? <input type="number" value={row.rate} onChange={e => updateRow(i, 'rate', e.target.value)} style={iS({
                textAlign: 'right',
                padding: '3px 6px',
                fontFamily: FONTS.mono
              })} /> : row.rate ? `₹${Number(row.rate).toLocaleString()}` : ''}
                </td>
                <td className="ap-invoices-page-29">
                  {rowTotal ? `₹${rowTotal.toLocaleString()}` : ''}
                </td>
                {editMode && <td className="ap-invoices-page-30">
    <button onClick={() => removeRow(i)} title="Remove row" className="ap-invoices-page-31">
      ✕
    </button>
  </td>}
              </tr>;
        })}
          {editMode && <tr>
              <td className="ap-invoices-page-32">
                <button onClick={() => setRows(p => [...p, {
              sr: '',
              desc: '',
              qty: '',
              rate: ''
            }])} className="ap-invoices-page-33">
                  + Add Row
                </button>
              </td>
            </tr>}
        </tbody>
      </table>

      {/* SECTION 6 — Bank / QR / Totals */}
      <table className="ap-invoices-page-34">
        <tbody>
          <tr>
            <td className="ap-invoices-page-35">
              <div className="ap-invoices-page-36">Bank Details:</div>
              {[['Bank', CO.bank, false], ['Account No', CO.account, true], ['IFSC', CO.ifsc, true], ['Branch', CO.branch, false]].map(([label, value, mono]) => <div key={label} className="ap-invoices-page-37">
                  <span className="ap-invoices-page-38">{label}: </span>
                  <span style={{
                fontFamily: mono ? "Fira Code, monospace" : "inherit",
                fontSize: mono ? "11px" : "12px"
              }}>{value}</span>
                </div>)}
            </td>
            <td className="ap-invoices-page-39">
              <img src={qrImg} alt="Pay using UPI" onError={e => {
              e.target.style.display = 'none';
            }} className="ap-invoices-page-40" />
              <div className="ap-invoices-page-41">Pay using UPI:</div>
            </td>
            <td className="ap-invoices-page-42">
              <table className="ap-invoices-page-43">
                <tbody>
                  {/* Subtotal */}
                  <tr className="ap-invoices-page-44">
                    <td className="ap-invoices-page-45">SUBTOTAL</td>
                    <td className="ap-invoices-page-46">
                      ₹{subtotal.toLocaleString()}
                    </td>
                  </tr>

                  {/* Additional charges (from CreateInvoicePage) */}
                  {charges.map((c, ci) => <tr key={ci} className="ap-invoices-page-47">
                      <td className="ap-invoices-page-48">{c.label || 'Charge'}</td>
                      <td className="ap-invoices-page-49">
                        ₹{Number(c.amount || 0).toLocaleString()}
                      </td>
                    </tr>)}

                  {/* Delivery & Discount placeholders when no charges */}
                  {charges.length === 0 && <>
                      <tr className="ap-invoices-page-50">
                        <td className="ap-invoices-page-51">DELIVERY CHARGE</td>
                        <td className="ap-invoices-page-52"></td>
                      </tr>
                      <tr className="ap-invoices-page-53">
                        <td className="ap-invoices-page-54">DISCOUNT</td>
                        <td className="ap-invoices-page-55">
                          {invoice.globalDiscount > 0 ? `-₹${Math.round(subtotal * invoice.globalDiscount / 100).toLocaleString()}` : ''}
                        </td>
                      </tr>
                    </>}

                  {/* GST */}
                  <tr className="ap-invoices-page-56">
                    <td className="ap-invoices-page-57">GST (18%)</td>
                    <td className="ap-invoices-page-58">
                      ₹{gst.toLocaleString()}
                    </td>
                  </tr>

                  {/* Grand Total */}
                  <tr>
                    <td className="ap-invoices-page-59">TOTAL</td>
                    <td className="ap-invoices-page-60">
                      ₹{grandTotal.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 7 — Total in words */}
      <table className="ap-invoices-page-61">
        <tbody>
          <tr>
            <td className="ap-invoices-page-62">
              <span className="ap-invoices-page-63">Total amount (in words): </span>
              <span>{toWords(grandTotal)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 8 — Notes */}
      <table className="ap-invoices-page-64">
        <tbody>
          <tr>
            <td className="ap-invoices-page-65">
              <span className="ap-invoices-page-66">Notes: </span>
              {editMode ? <textarea value={val('notes')} onChange={setK('notes')} rows={2} style={{
              ...iS({
                resize: 'vertical',
                display: 'block',
                marginTop: 4
              })
            }} placeholder="Payment terms, delivery notes…" /> : <span>{invoice.notes || ''}</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 9 — Terms */}
      <table className="ap-invoices-page-67">
        <tbody>
          <tr>
            <td className="ap-invoices-page-68">
              Terms &amp; Conditions
            </td>
          </tr>
          <tr>
            <td className="ap-invoices-page-69">
              {editMode ? <textarea value={val('terms')} onChange={setK('terms')} rows={2} style={{
              ...iS({
                resize: 'vertical',
                display: 'block',
                marginTop: 4
              })
            }} placeholder="Your terms and conditions..." /> : <span>{invoice.terms || '* If you have any questions about this invoice, feel free to contact us.'}</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* SECTION 10 — Signature */}
      <div className="ap-invoices-page-70">
        <div>Thanking You,</div>
        <div className="ap-invoices-page-71">{CO.signatory}</div>
        <div>{CO.phone}</div>
        <div>From: {CO.name}</div>
        <img src={signatureImg} alt="Signature" onError={e => {
        e.target.style.display = 'none';
      }} className="ap-invoices-page-72" />
        <div className="ap-invoices-page-73">
          [Authorized Signatory]
        </div>
      </div>
    </div>;
};

/* ─── InvoicePDFModal — renders the REAL invoice template, not the generic one ─── */
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
  if (!open) return null;
  const handlePrint = () => {
    const content = document.getElementById('invoice-pdf-content')?.innerHTML;
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
      <div onClick={onClose} className="ap-invoices-page-74" />
      <div className="ap-invoices-page-75">
        <div className="ap-invoices-page-76">
          <span className="ap-invoices-page-77">📄 PDF Preview</span>
          <span className="ap-invoices-page-78">{invoice.id}</span>
          <div className="ap-invoices-page-79">
            <button onClick={handlePrint} className="ap-invoices-page-80">⬇ Download PDF</button>
            <button onClick={onClose} className="ap-invoices-page-81">✕</button>
          </div>
        </div>
        <div className="ap-invoices-page-82">
          <div id="invoice-pdf-content" className="ap-invoices-page-83">
            <InvoiceTemplate invoice={invoice} editMode={false} editData={{}} setEditData={() => {}} />
          </div>
        </div>
      </div>
    </>, document.body);
};

/* ─── Mark as Paid — confirm + patch status ────────────────────────────── */
const MarkPaidModal = ({
  open,
  onClose,
  invoice,
  onConfirm
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!open) return null;
  return <Modal open={open} onClose={onClose} title="✓ Mark Invoice as Paid" width={420}>
      <div className="ap-invoices-page-84">
        Mark <strong>{invoice.id}</strong> ({invoice.customer}) — ₹{invoice.total?.toLocaleString()} — as <strong>Paid</strong>?
      </div>
      {error && <div className="ap-invoices-page-85">{error}</div>}
      <div className="ap-invoices-page-86">
        <FBtn secondary onClick={onClose}>Cancel</FBtn>
        <FBtn color="#16A34A" disabled={saving} onClick={async () => {
        setSaving(true);
        setError('');
        try {
          await onConfirm();
          onClose();
        } catch (e) {
          setError(e.message || 'Failed to update status.');
        } finally {
          setSaving(false);
        }
      }}>{saving ? 'Saving…' : '✓ Mark as Paid'}</FBtn>
      </div>
    </Modal>;
};

/* ─── Send to Customer ───────────────────────────────────────────────── */
const SendInvoiceModal = ({
  open,
  onClose,
  invoice,
  onSend
}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open || !invoice) return;
    setEmail(invoice.billToEmail || '');
    setMessage(`Dear ${invoice.customer || 'Customer'},\n\nPlease find attached invoice ${invoice.id} for ₹${invoice.total?.toLocaleString()}.\n\nRegards,\nAlisha Engineering`);
    setError('');
  }, [open, invoice]);
  if (!open) return null;
  const handleSend = async () => {
    if (!email.trim()) return setError('Enter a recipient email.');
    setSending(true);
    setError('');
    try {
      await onSend({
        email: email.trim(),
        message
      });
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to send invoice.');
    } finally {
      setSending(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="📤 Send Invoice to Customer" width={460}>
      <FRow label="To Email">
        <FInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@email.com" />
      </FRow>
      <FRow label="Message">
        <FTextarea rows={5} value={message} onChange={e => setMessage(e.target.value)} />
      </FRow>
      {error && <div className="ap-invoices-page-87">{error}</div>}
      <div className="ap-invoices-page-88">
        <FBtn secondary onClick={onClose}>Cancel</FBtn>
        <FBtn disabled={sending} onClick={handleSend}>{sending ? 'Sending…' : '📤 Send Now'}</FBtn>
      </div>
    </Modal>;
};

/* ─── Convert to Credit Note ────────────────────────────────────────── */
const ConvertCreditNoteModal = ({
  open,
  onClose,
  invoice,
  onConfirm
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!open) return null;
  return <Modal open={open} onClose={onClose} title="🔄 Convert to Credit Note" width={440}>
      <div className="ap-invoices-page-89">
        This will create a Credit Note against <strong>{invoice.id}</strong> for
        ₹{invoice.total?.toLocaleString()} and mark the original invoice as credited.
      </div>
      {error && <div className="ap-invoices-page-90">{error}</div>}
      <div className="ap-invoices-page-91">
        <FBtn secondary onClick={onClose}>Cancel</FBtn>
        <FBtn disabled={saving} onClick={async () => {
        setSaving(true);
        setError('');
        try {
          await onConfirm();
          onClose();
        } catch (e) {
          setError(e.message || 'Failed to convert.');
        } finally {
          setSaving(false);
        }
      }}>{saving ? 'Converting…' : 'Convert'}</FBtn>
      </div>
    </Modal>;
};

/* ─── InvoiceDetail ──────────────────────────────────────── */
// const InvoiceDetail = ({ invoice, onBack, onSave, initialEditMode }) => {
//   const [showPDF, setShowPDF] = useState(false);

//   const fields = [
//     { key: 'customer' }, { key: 'job' },    { key: 'date' },
//     { key: 'due' },      { key: 'amount' }, { key: 'tax' },
//     { key: 'total' },    { key: 'status' },
//   ];

//   return (
//     <>
//       <EditableDetailView
//         id={invoice.id}
//         breadcrumb="Invoices"
//         onBack={onBack}
//         fields={fields}
//         data={invoice}
//         initialEditMode={initialEditMode}
//         onSave={onSave}
//       >
//         {({ editMode, editData, setEditData }) => {
//           const val  = key => editData[key] ?? invoice[key] ?? '';
//           const setK = key => e => setEditData(p => ({ ...p, [key]: e.target.value }));

//           const sidebar = (
//             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//               <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
//                 <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 10 }}>Actions</div>
//                 {!editMode ? (
//                   <>
//                     <button className="btn" onClick={() => setShowPDF(true)}
//                       style={{ width: '100%', padding: '10px', borderRadius: 9, background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 13, fontWeight: 700, border: 'none', marginBottom: 8, cursor: 'pointer' }}>
//                       ⬇ Download PDF
//                     </button>
//                     {invoice.status !== 'paid' && (
//                       <button className="btn" onClick={() => openModal('record_payment')}
//                         style={{ width: '100%', padding: '10px', borderRadius: 9, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', fontSize: 12, fontWeight: 700, marginBottom: 8, cursor: 'pointer' }}>
//                         ✓ Mark as Paid
//                       </button>
//                     )}
//                     <button className="btn" onClick={() => openModal('send_quotation', { id: invoice.id })}
//                       style={{ width: '100%', padding: '10px', borderRadius: 9, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 12, fontWeight: 700, marginBottom: 8, cursor: 'pointer' }}>
//                       📤 Send to Customer
//                     </button>
//                     <button className="btn" onClick={() => openModal('report', { title: `Convert ${invoice.id} to Credit Note`, format: 'Convert' })}
//                       style={{ width: '100%', padding: '10px', borderRadius: 9, background: '#F8FAFC', border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
//                       🔄 Convert to Credit Note
//                     </button>
//                   </>
//                 ) : (
//                   <div style={{ fontSize: 12, color: COLORS.muted, textAlign: 'center', padding: '8px 0' }}>
//                     Actions available in view mode
//                   </div>
//                 )}
//               </div>

//               <div style={{
//                 background: val('status') === 'overdue' ? '#FEF2F2' : val('status') === 'paid' ? '#F0FDF4' : '#FFFBEB',
//                 borderRadius: 14,
//                 border: `1px solid ${val('status') === 'overdue' ? '#FECACA' : val('status') === 'paid' ? '#BBF7D0' : '#FDE68A'}`,
//                 padding: '14px 16px',
//               }}>
//                 <div style={{ fontSize: 12, fontWeight: 700, color: val('status') === 'overdue' ? '#991B1B' : val('status') === 'paid' ? '#166534' : '#92400E', marginBottom: 6 }}>
//                   Payment Status
//                 </div>
//                 {editMode ? (
//                   <select value={val('status')} onChange={setK('status')}
//                     style={{ padding: '5px 9px', borderRadius: 6, border: `1.5px solid ${COLORS.border}`, fontSize: 12, width: '100%', fontFamily: FONTS.sans, outline: 'none', background: '#fff' }}>
//                     <option value="paid">Paid</option>
//                     <option value="pending">Pending</option>
//                     <option value="overdue">Overdue</option>
//                     <option value="draft">Draft</option>
//                   </select>
//                 ) : (
//                   <SBadge s={invoice.status} map={INV_STATUS} />
//                 )}
//                 <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>
//                   Due date:{' '}
//                   {editMode
//                     ? <input value={val('due')} onChange={setK('due')}
//                         style={{ padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${COLORS.border}`, fontSize: 11, width: '100%', boxSizing: 'border-box', fontFamily: FONTS.sans, outline: 'none', marginTop: 4 }} />
//                     : invoice.due}
//                 </div>
//               </div>

//               <div style={{ background: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
//                 <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1, marginBottom: 8 }}>Summary</div>
//                 {[
//                   ['Subtotal',   `₹${invoice.amount?.toLocaleString()}`],
//                   ['GST @ 18%', `₹${invoice.tax?.toLocaleString()}`],
//                 ].map(([k, v]) => (
//                   <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.muted, marginBottom: 5 }}>
//                     <span>{k}</span>
//                     <span style={{ fontFamily: FONTS.mono, color: COLORS.h2 }}>{v}</span>
//                   </div>
//                 ))}
//                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: COLORS.brand, paddingTop: 7, borderTop: `2px solid ${COLORS.border}`, marginTop: 4 }}>
//                   <span>Total</span>
//                   <span style={{ fontFamily: FONTS.mono }}>₹{invoice.total?.toLocaleString()}</span>
//                 </div>
//               </div>
//             </div>
//           );

//           return (
//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 272px', gap: 16 }}>
//               <div style={{
//                 background: '#fff', borderRadius: 12,
//                 border: `1.5px solid ${editMode ? COLORS.brand : COLORS.border}`,
//                 boxShadow: editMode ? `0 0 0 3px ${COLORS.brand}15` : '0 2px 10px rgba(0,0,0,.08)',
//                 padding: '22px 26px 28px',
//                 transition: 'border-color .2s, box-shadow .2s',
//               }}>
//                 <InvoiceTemplate
//                   invoice={invoice}
//                   editMode={editMode}
//                   editData={editData}
//                   setEditData={setEditData}
//                 />
//               </div>
//               {sidebar}
//             </div>
//           );
//         }}
//       </EditableDetailView>

//       <PDFPreview
//         open={showPDF}
//         onClose={() => setShowPDF(false)}
//         title={invoice.id}
//         filename={`invoice-${invoice.id}`}
//         template="invoice"
//         data={{
//           ...invoice,
//           subtotal: invoice.amount,
//           gst:      invoice.tax,
//           // Pass real line items to PDFPreview so it too renders the correct data
//           items: (invoice.items ?? []).filter(it => it.desc || it.name).map(it => ({
//             desc: it.desc ?? it.name ?? '',
//             qty:  it.qty  ?? 1,
//             rate: it.rate ?? 0,
//           })),
//         }}
//       />
//     </>
//   );
// };

const InvoiceDetail = ({
  invoice,
  onBack,
  onSave,
  initialEditMode
}) => {
  const [showPDF, setShowPDF] = useState(false);
  const [activeAction, setActiveAction] = useState(null); // 'mark_paid' | 'send' | 'convert' | null

  const fields = [{
    key: 'customer'
  }, {
    key: 'job'
  }, {
    key: 'date'
  }, {
    key: 'due'
  }, {
    key: 'amount'
  }, {
    key: 'tax'
  }, {
    key: 'total'
  }, {
    key: 'status'
  }];
  return <>
      <EditableDetailView id={invoice.id} breadcrumb="Invoices" onBack={onBack} fields={fields} data={invoice} initialEditMode={initialEditMode} onSave={onSave}>
        {({
        editMode,
        editData,
        setEditData
      }) => {
        const val = key => editData[key] ?? invoice[key] ?? '';
        const setK = key => e => setEditData(p => ({
          ...p,
          [key]: e.target.value
        }));
        const sidebar = <div className="ap-invoices-page-92">
              <div className="ap-invoices-page-93">
                <div className="ap-invoices-page-94">Actions</div>
                {!editMode ? <>
                    <button className="btn ap-invoices-page-95" onClick={() => setShowPDF(true)}>
                      ⬇ Download PDF
                    </button>
                    {invoice.status !== 'paid' && <button className="btn ap-invoices-page-96" onClick={() => setActiveAction('mark_paid')}>
                        ✓ Mark as Paid
                      </button>}
                    <button className="btn ap-invoices-page-97" onClick={() => setActiveAction('send')}>
                      📤 Send to Customer
                    </button>
                    <button className="btn ap-invoices-page-98" onClick={() => setActiveAction('convert')}>
                      🔄 Convert to Credit Note
                    </button>
                  </> : <div className="ap-invoices-page-99">
                    Actions available in view mode
                  </div>}
              </div>

              <div style={{
            background: val('status') === 'overdue' ? '#FEF2F2' : val('status') === 'paid' ? '#F0FDF4' : '#FFFBEB',
            border: `1px solid ${val('status') === 'overdue' ? '#FECACA' : val('status') === 'paid' ? '#BBF7D0' : '#FDE68A'}`
          }} className="ap-invoices-page-100">
                <div style={{
              color: val('status') === 'overdue' ? '#991B1B' : val('status') === 'paid' ? '#166534' : '#92400E'
            }} className="ap-invoices-page-101">
                  Payment Status
                </div>
                {editMode ? <select value={val('status')} onChange={setK('status')} className="ap-invoices-page-102">
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="draft">Draft</option>
                  </select> : <SBadge s={invoice.status} map={INV_STATUS} />}
                <div className="ap-invoices-page-103">
                  Due date:{' '}
                  {editMode ? <input value={val('due')} onChange={setK('due')} className="ap-invoices-page-104" /> : invoice.due}
                </div>
              </div>

              <div className="ap-invoices-page-105">
                <div className="ap-invoices-page-106">Summary</div>
                {[['Subtotal', `₹${invoice.amount?.toLocaleString()}`], ['GST @ 18%', `₹${invoice.tax?.toLocaleString()}`]].map(([k, v]) => <div key={k} className="ap-invoices-page-107">
                    <span>{k}</span>
                    <span className="ap-invoices-page-108">{v}</span>
                  </div>)}
                <div className="ap-invoices-page-109">
                  <span>Total</span>
                  <span className="ap-invoices-page-110">₹{invoice.total?.toLocaleString()}</span>
                </div>
              </div>
            </div>;
        return <div className="ap-invoices-page-111">
              <div style={{
            border: `1.5px solid ${editMode ? COLORS.brand : COLORS.border}`,
            boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 2px 10px rgba(0,0,0,.08)"
          }} className="ap-invoices-page-112">
                <InvoiceTemplate invoice={invoice} editMode={editMode} editData={editData} setEditData={setEditData} />
              </div>
              {sidebar}
            </div>;
      }}
      </EditableDetailView>

      <InvoicePDFModal open={showPDF} onClose={() => setShowPDF(false)} invoice={invoice} />

      <MarkPaidModal open={activeAction === 'mark_paid'} onClose={() => setActiveAction(null)} invoice={invoice} onConfirm={() => onSave({
      ...invoice,
      status: 'paid'
    })} />

      <SendInvoiceModal open={activeAction === 'send'} onClose={() => setActiveAction(null)} invoice={invoice} onSend={async ({
      email,
      message
    }) => {
      // Use a real backend endpoint if you add one (e.g. invoicesApi.sendEmail).
      // Until then this falls back to opening the user's email client.
      if (typeof invoicesApi.sendEmail === 'function') {
        await invoicesApi.sendEmail(invoice._id, {
          email,
          message
        });
      } else {
        const subject = encodeURIComponent(`Invoice ${invoice.id} - Alisha Engineering`);
        const body = encodeURIComponent(message);
        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
      }
    }} />

      <ConvertCreditNoteModal open={activeAction === 'convert'} onClose={() => setActiveAction(null)} invoice={invoice} onConfirm={async () => {
      if (typeof invoicesApi.convertToCreditNote === 'function') {
        await invoicesApi.convertToCreditNote(invoice._id);
      } else {
        throw new Error('Credit note conversion isn\'t wired to the backend yet — add invoicesApi.convertToCreditNote.');
      }
    }} />
    </>;
};

/* ─── InvoicesPage ───────────────────────────────────────── */
const InvoicesPage = ({
  openModal
}) => {
  const [open, setOpen] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [initialEditMode, setInitialEditMode] = useState(false);
  const navigate = useNavigate();

  /* ── Fetch ─────────────────────────────────────────────── */
  const fetchInvoices = useCallback(() => {
    invoicesApi.list({
      limit: 200
    }).then(r => setInvoices((r.data ?? []).map(normaliseInvoice))).catch(() => {});
  }, []);
  useEffect(() => {
    fetchInvoices();
    window.addEventListener('focus', fetchInvoices);
    return () => window.removeEventListener('focus', fetchInvoices);
  }, [fetchInvoices]);
  const invoice = open ? invoices.find(i => i._id === open) : null;

  /* ── KPI totals ────────────────────────────────────────── */
  const tot = invoices.reduce((s, i) => s + (i.total ?? 0), 0);
  const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total ?? 0), 0);
  const pend = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.total ?? 0), 0);
  const over = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total ?? 0), 0);
  const totalGST = invoices.reduce((s, i) => s + (i.tax ?? 0), 0);

  /* ── Search / filter / pagination ─────────────────────── */
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: filteredInvoices
  } = useTableSearch(invoices, ['id', 'job', 'customer', 'status'], {
    status: ''
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
  } = usePagination(filteredInvoices, 10);
  const {
    exportProps
  } = useExport({
    title: 'Invoices',
    filename: 'cooltech-invoices',
    template: 'generic_list',
    subtitle: `AC Services Platform · Invoices & Billing · ${filteredInvoices.length} records`,
    docId: 'INV-EXPORT',
    columns: INVOICE_COLUMNS,
    rows: filteredInvoices,
    showTotals: true,
    totalColumns: ['amount', 'tax', 'total']
  });

  /* ── Handlers ──────────────────────────────────────────── */
  const handleSave = async updated => {
    try {
      const res = await invoicesApi.update(updated._id, updated);
      const doc = normaliseInvoice(res.data ?? res);
      setInvoices(prev => prev.map(i => i._id === doc._id ? doc : i));
    } catch (e) {
      alert(e.message);
    }
  };
  const handleBack = () => {
    setOpen(null);
    setInitialEditMode(false);
  };
  const handleDelete = async id => {
    const item = invoices.find(x => (x._id ?? x.id) === id);
    if (item) addToDeleted({
      id: item.id ?? item._id,
      name: item.customer ?? item.id,
      module: 'Invoice',
      by: 'Admin'
    });
    try {
      await invoicesApi.remove(id);
      setInvoices(prev => prev.filter(x => (x._id ?? x.id) !== id));
      setDeleteTarget(null);
      if (open === id) setOpen(null);
    } catch (e) {
      alert(e.message);
    }
  };

  /* ── Detail view ───────────────────────────────────────── */
  if (invoice) {
    return <InvoiceDetail invoice={invoice} onBack={handleBack} onSave={handleSave}
    // openModal={openModal}
    initialEditMode={initialEditMode} />;
  }

  /* ── List view ─────────────────────────────────────────── */
  return <div className="fi ap-invoices-page-113">

      {/* Header */}
      <div className="ap-invoices-page-114">
        <div>
          <div className="ap-invoices-page-115">Invoices &amp; Billing</div>
          <div className="ap-invoices-page-116">
            {total} of {invoices.length} invoices · ₹{(totalGST / 1000).toFixed(1)}K GST collected
          </div>
        </div>
        <button className="btn ap-invoices-page-117" onClick={() => navigate('/admin/invoices/create-invoice')}>
          + Create Invoice
        </button>
      </div>

      {/* KPI cards */}
      <div className="ap-invoices-page-118">
        <KCard label="Total Invoiced" value={`₹${(tot / 1000).toFixed(1)}K`} icon="📊" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
        <KCard label="Collected" value={`₹${(paid / 1000).toFixed(1)}K`} icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="1" />
        <KCard label="Pending" value={`₹${(pend / 1000).toFixed(1)}K`} icon="⏳" iconBg="#FFFBEB" color="#B45309" delay="2" />
        <KCard label="Overdue" value={`₹${(over / 1000).toFixed(1)}K`} icon="⚠️" iconBg="#FEF2F2" color="#DC2626" delay="3" />
        <KCard label="GST Collected" value={`₹${(totalGST / 1000).toFixed(1)}K`} icon="🧾" iconBg="#F5F3FF" color="#7C3AED" delay="4" />
      </div>

      {/* Aging summary */}
      <div className="ap-invoices-page-119">
        <div className="ap-invoices-page-120">Invoice Aging Summary</div>
        <div className="ap-invoices-page-121">
          {[{
          label: 'Current',
          value: paid,
          color: '#22C55E',
          bg: '#F0FDF4'
        }, {
          label: 'Due < 10 days',
          value: pend,
          color: '#F59E0B',
          bg: '#FFFBEB'
        }, {
          label: 'Overdue 10-30d',
          value: over * 0.6,
          color: '#EF4444',
          bg: '#FEF2F2'
        }, {
          label: 'Overdue 30d+',
          value: over * 0.4,
          color: '#991B1B',
          bg: '#FEF2F2'
        }].map(s => <div key={s.label} style={{
          background: s.bg,
          border: `1px solid ${s.color}20`
        }} className="ap-invoices-page-122">
              <div style={{
            color: s.color
          }} className="ap-invoices-page-123">
                ₹{Math.round(s.value / 1000).toFixed(0)}K
              </div>
              <div className="ap-invoices-page-124">{s.label}</div>
            </div>)}
        </div>
      </div>

      {/* Table */}
      <div className="ap-invoices-page-125">
        <div className="ap-invoices-page-126">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by invoice #, customer, job…" />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={['paid', 'pending', 'overdue', 'draft']} allLabel="All Statuses" />
          <div className="ap-invoices-page-127"><ExportDropdown {...exportProps} /></div>
        </div>

        <div className="ap-invoices-page-128">
          <table className="ap-invoices-page-129">
            <Thead cols={['Invoice #', 'Job / Contract', 'Customer', 'Amount', 'GST', 'Total', 'Date', 'Due', 'Status', '']} />
            <tbody>
              {paginated.map((inv, i) => <tr key={inv._id} className="row ap-invoices-page-130" onClick={() => {
              setInitialEditMode(false);
              setOpen(inv._id);
            }} style={{
              background: inv.status === 'overdue' ? '#FFFBF7' : i % 2 === 0 ? COLORS.white : '#FAFAFA'
            }}>
                  <td className="ap-invoices-page-131">
                    <span className="ap-invoices-page-132">{inv.id}</span>
                  </td>
                  <td className="ap-invoices-page-133">
                    <span className="ap-invoices-page-134">{inv.job}</span>
                  </td>
                  <td className="ap-invoices-page-135">{inv.customer}</td>
                  <td className="ap-invoices-page-136">
                    <span className="ap-invoices-page-137">₹{inv.amount.toLocaleString()}</span>
                  </td>
                  <td className="ap-invoices-page-138">
                    <span className="ap-invoices-page-139">₹{inv.tax.toLocaleString()}</span>
                  </td>
                  <td className="ap-invoices-page-140">
                    <span className="ap-invoices-page-141">₹{inv.total.toLocaleString()}</span>
                  </td>
                  <td className="ap-invoices-page-142">{inv.date}</td>
                  <td className="ap-invoices-page-143">
                    <span style={{
                  color: inv.status === 'overdue' ? "var(--danger-text)" : "var(--text-muted)"
                }} className="ap-invoices-page-144">{inv.due}</span>
                  </td>
                  <td className="ap-invoices-page-145"><SBadge s={inv.status} map={INV_STATUS} /></td>
                  <td onClick={e => e.stopPropagation()} className="ap-invoices-page-146">
                    <ActionDropdown onView={() => {
                  setInitialEditMode(false);
                  setOpen(inv._id);
                }} onEdit={() => {
                  setInitialEditMode(true);
                  setOpen(inv._id);
                }} onDelete={() => setDeleteTarget(inv._id)} />
                  </td>
                </tr>)}
              {paginated.length === 0 && <tr>
                  <td colSpan={10} className="ap-invoices-page-147">
                    No invoices match your search or filters.
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>

        {/* GST footer */}
        <div className="ap-invoices-page-148">
          <span className="ap-invoices-page-149">GST Summary:</span>
          <span className="ap-invoices-page-150">
            Taxable: <strong className="ap-invoices-page-151">₹{invoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}</strong>
          </span>
          <span className="ap-invoices-page-152">
            CGST 9%: <strong className="ap-invoices-page-153">₹{Math.round(totalGST / 2).toLocaleString()}</strong>
          </span>
          <span className="ap-invoices-page-154">
            SGST 9%: <strong className="ap-invoices-page-155">₹{Math.round(totalGST / 2).toLocaleString()}</strong>
          </span>
          <span className="ap-invoices-page-156">
            Total GST: ₹{totalGST.toLocaleString()}
          </span>
        </div>

        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} message="This invoice will be permanently removed." />
    </div>;
};
export default InvoicesPage;