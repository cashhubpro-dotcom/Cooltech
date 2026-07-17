import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { NewCustomerModal } from '../../components/modals/Modals';
import { invoicesApi, customersApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
const LOGO_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAn0AAACuCAYAAABDRrtlAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAIdUAACHVAQSctJ0AAP+lSURBVHhe7L0HmGPpVec9PU5ksHEaT+hQSTnnnLNUSTmXpFKVVCWpco6duydnh2VNMl5YWFiMYcEEr/lsMBhjMDaYaNYY44ixPQ4T+nzPed97pVt3emY6VM/02HOe5zxXpVLp3lKpu371P+f8zy23vBKvxCvxSlxxJF7Vb4m/adCYEQwZ8yahozAsdFYbQld1ReAorg7ZCouD1mzqhD0vGVRn3njLLbfcyn+GmyBuPXq09EP99twdA5a0fsieTQic2flBR+7skDUzdcyYPcr/gh+QOHLLLerX3GGI397nKPiH7IXWkC2zMWBO7A1YEvU+e7yf/wUvadjtr5YZ82+WustShXciqPCVswr3REPhmVhTuvInJY70Y3JH+udl9tSvSG2J98nM8fdLrGPvlVoSb5dYknfLrKk1mS1RkdjSo1J71qP0FIRqT/0nb9L37NWFWv0agTV3m8SdMYqc6ZjAmc4M2tN5gT0bEVtTd9Kf9UseeA1H+vsDr1OGKkfFwapZ4q8YxaGySeot2iT+glHsy8tvi0R+hP+FP4Bxqyy/+KOy6OxxFktN44fJqcbnJ1Xjcxuykfb56eDovyCYfcfWORMxz12G3o+fVGYvLWEfxpRQ29BQAAAAhJREFUWIVjYGBg+A8AAQQAAf/9AAAAAElFTkSuQmCC';
const SIG_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAi4AAAB3CAYAAAAkVMvJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAIdUAACHVAQSctJ0AAF6xSURBVHhe7d0HmGPpVec9PU5ksHEaT+hQSTnnnLNUSTmXpFKVVCWpco6duydnh2VNMl5YWFiMYcEEr/lsMBhjMDaYaNYY44ixPQ4T+nzPed97pVt3emY6VM/02HOe5zxXpVLp3lKpu371P+f8zy23vBKvxCvxSlxxJF7Vb4m/adCYEQwZ8yahozAsdFYbQld1ReAorg7ZCouD1mzqhD0vGVRn3njLLbfcyn+GmyBuPXq09EP99twdA5a0fsieTQic2flBR+7skDUzdcyYPcr/gh+QOHLLLerX3GGI377nKPiH7IXWkC2zMWBO7A1YEvU+e7yf/wUvadjtr5YZ82+WustShXciqPCVswr3REPhmVhTuvInJY70Y3JH+udl9tSvSG2J98nM8fdLrGPvlVoSb5dYknfLrKk1mS1RkdjSo1J71qP0FIRqT/0nb9L37NWFWv0agTV3m8SdMYqc6ZjAmc4M2tN5gT0bEVtTd9Kf9UseeA1H+vsDr1OGKkfFwapZ4q8YxaGySeot2iT+glHsy8tvi0R+hP+FP4Bxqyy/+KOy6OxxFktN44fJqcbnJ1Xjcxuykfb56eDovyCYfcfWORMxz12G3o+fVGYvLWEfxpRQ29BQAAAAhJREFUWIVjYGBg+A8AAQQAAf/9AAAAAElFTkSuQmCC';
const NAVY = '#1a2e5c';
const VENDOR = {
  company: 'Alisha Engineering',
  address: 'L.I.G-II -164 G.I.D.C Housing Board, Near Chhotalal Char Rasta, Beside Swaminarayan Mandir, Odhav, Ahmedabad - 382415',
  contact: 'Vakil Yadav',
  phone: '9724763909',
  email: 'alishaengrineering@gmail.com'
};
const SAMPLE_CUSTOMERS = ['Galaxy Towers', 'Meera Iyer', 'TechPark Ltd.', 'City Mall', 'Dr. Nair Clinic', 'Patel Villa', 'Sunrise Hotel', 'Sharma Residency'];
const SAMPLE_PRODUCTS = [{
  name: 'Split AC Service (1.5T)',
  rate: 599,
  gst: 18
}, {
  name: 'R-32 Gas Refill',
  rate: 2800,
  gst: 18
}, {
  name: 'Split AC Installation',
  rate: 3500,
  gst: 18
}, {
  name: 'Compressor Replacement (1T)',
  rate: 8500,
  gst: 18
}, {
  name: 'PCB Repair',
  rate: 1800,
  gst: 18
}, {
  name: 'Comprehensive AMC (1 Unit)',
  rate: 7200,
  gst: 18
}];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Net Banking', 'Cheque', 'EMI', 'Bank Transfer'];

/* ─── tiny helpers ─────────────────────────────────────────── */
const fmtINR = v => v.toLocaleString('en-IN', {
  minimumFractionDigits: 2
});
const numToWords = n => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (!n || n === 0) return 'Zero';
  const t = Math.round(n);
  if (t < 20) return ones[t];
  if (t < 100) return tens[Math.floor(t / 10)] + (t % 10 ? ' ' + ones[t % 10] : '');
  if (t < 1000) return ones[Math.floor(t / 100)] + ' Hundred' + (t % 100 ? ' ' + numToWords(t % 100) : '');
  if (t < 100000) return numToWords(Math.floor(t / 1000)) + ' Thousand' + (t % 1000 ? ' ' + numToWords(t % 1000) : '');
  if (t < 10000000) return numToWords(Math.floor(t / 100000)) + ' Lakh' + (t % 100000 ? ' ' + numToWords(t % 100000) : '');
  return numToWords(Math.floor(t / 10000000)) + ' Crore' + (t % 10000000 ? ' ' + numToWords(t % 10000000) : '');
};

/* ─── sub-components ───────────────────────────────────────── */
const Inp = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  mono = false
}) => <div className="ap-create-invoice-page-1">
    {label && <div className="ap-create-invoice-page-2">
        {label}{required && <span className="ap-create-invoice-page-3">*</span>}
      </div>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
    fontFamily: mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
  }} onFocus={e => {
    e.target.style.borderColor = '#3B82F6';
  }} onBlur={e => {
    e.target.style.borderColor = '#CBD5E1';
  }} className="ap-create-invoice-page-4" />
  </div>;
const Toggle = ({
  checked,
  onChange,
  label,
  sub
}) => <div className="ap-create-invoice-page-5">
    <label className="ap-create-invoice-page-6">
      <input type="checkbox" checked={checked} onChange={onChange} className="ap-create-invoice-page-7" />
      <span style={{
      background: checked ? "var(--x1a2e5c)" : "var(--xcbd5e1)"
    }} className="ap-create-invoice-page-8">
        <span style={{
        left: checked ? "20px" : "3px"
      }} className="ap-create-invoice-page-9" />
      </span>
    </label>
    <div>
      <div className="ap-create-invoice-page-10">{label}</div>
      {sub && <div className="ap-create-invoice-page-11">{sub}</div>}
    </div>
  </div>;

/* ═══════════════════════════════════════════════════════════ */
const CreateInvoicePage = ({
  onBack
}) => {
  const navigate = useNavigate();

  /* ── invoice meta ──────────────────────────────────────── */
  const [invoiceNo, setInvoiceNo] = useState('001');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [subject, setSubject] = useState('');

  /* ── customer ──────────────────────────────────────────── */
  const [liveCustomers, setLiveCustomers] = useState([]);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [activeTypes, setActiveTypes] = useState(['Residential', 'Commercial']);
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null); // { _id, name } | null
  const [showCustDrop, setShowCustDrop] = useState(false);
  const [billToAddress, setBillToAddress] = useState('');
  const [billToContact, setBillToContact] = useState('');
  const [billToPhone, setBillToPhone] = useState('');
  const [billToEmail, setBillToEmail] = useState('');
  useEffect(() => {
    customersApi.list({
      limit: 200
    }).then(r => setLiveCustomers(r.data ?? [])).catch(() => {});
  }, []);
  const custSuggestions = customerQuery.length > 0 ? liveCustomers.filter(c => c.name.toLowerCase().includes(customerQuery.toLowerCase())) : [];

  /* ── products ──────────────────────────────────────────── */
  const [productSearch, setProductSearch] = useState('');
  const [productQty, setProductQty] = useState('');
  const [items, setItems] = useState([]);
  const [showProdDrop, setShowProdDrop] = useState(false);
  const prodSuggestions = productSearch.length > 0 ? SAMPLE_PRODUCTS.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())) : [];
  const addItem = product => {
    const qty = parseInt(productQty) || 1;
    setItems(prev => [...prev, {
      id: Date.now(),
      name: product.name,
      description: '',
      qty,
      rate: product.rate,
      discount: 0,
      gst: product.gst,
      total: qty * product.rate
    }]);
    setProductSearch('');
    setProductQty('');
    setShowProdDrop(false);
  };
  const addBlankItem = () => setItems(prev => [...prev, {
    id: Date.now(),
    name: '',
    description: '',
    qty: 1,
    rate: 0,
    discount: 0,
    gst: 18,
    total: 0
  }]);
  const updateItem = (id, key, val) => setItems(prev => prev.map(it => {
    if (it.id !== id) return it;
    const up = {
      ...it,
      [key]: ['qty', 'rate', 'discount', 'gst'].includes(key) ? parseFloat(val) || 0 : val
    };
    up.total = up.qty * up.rate * (1 - up.discount / 100);
    return up;
  }));
  const removeItem = id => setItems(prev => prev.filter(it => it.id !== id));

  /* ── additional charges ────────────────────────────────── */
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const addCharge = () => setAdditionalCharges(prev => [...prev, {
    id: Date.now(),
    label: 'Delivery Charge',
    amount: 0
  }]);
  const updateCharge = (id, key, val) => setAdditionalCharges(prev => prev.map(c => c.id === id ? {
    ...c,
    [key]: val
  } : c));
  const removeCharge = id => setAdditionalCharges(prev => prev.filter(c => c.id !== id));

  /* ── discount / notes / terms ──────────────────────────── */
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('* If you have any questions about this invoice, feel free to contact us.');
  const [showNotes, setShowNotes] = useState(true);
  const [showTerms, setShowTerms] = useState(false);

  /* ── bank ──────────────────────────────────────────────── */
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAdded, setBankAdded] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountName: 'Alisha Engineering',
    accountNo: '',
    confirmAccountNo: '',
    ifsc: '',
    bankName: '',
    branch: '',
    upi: '',
    upiNumber: '',
    notes: '',
    isDefault: false
  });
  const setBD = key => e => setBankDetails(p => ({
    ...p,
    [key]: e.target.value
  }));

  /* ── payment ───────────────────────────────────────────── */
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [payModeOpen, setPayModeOpen] = useState(false);
  const [splitPayments, setSplitPayments] = useState([]);
  const [showSplit, setShowSplit] = useState(false);
  const [markPaid, setMarkPaid] = useState(false);
  const addSplit = () => setSplitPayments(p => [...p, {
    id: Date.now(),
    mode: 'Cash',
    amount: 0,
    notes: ''
  }]);
  const removeSplit = id => setSplitPayments(p => p.filter(s => s.id !== id));
  const updateSplit = (id, key, val) => setSplitPayments(p => p.map(s => s.id === id ? {
    ...s,
    [key]: val
  } : s));

  /* ── totals ────────────────────────────────────────────── */
  const subtotal = items.reduce((s, it) => s + it.total, 0);
  const extraCharges = additionalCharges.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const gstAmount = items.reduce((s, it) => s + it.total * it.gst / 100, 0);
  const discountAmt = subtotal * (globalDiscount / 100);
  const grandTotal = subtotal + extraCharges + gstAmount - discountAmt;

  /* ── save ──────────────────────────────────────────────── */
  const [saving, setSaving] = useState(false);
  const handleSave = async (asDraft = false) => {
    if (!selectedCustomer && !customerQuery.trim()) {
      alert('customer name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        invoiceNo: `INV-${invoiceNo}`,
        subject,
        date: invoiceDate,
        dueDate,
        status: asDraft ? 'draft' : markPaid ? 'paid' : 'pending',
        customer: selectedCustomer?.name || customerQuery.trim(),
        customerId: selectedCustomer?._id || null,
        billToAddress,
        billToContact,
        billToPhone,
        billToEmail,
        items: items.map(({
          id: _id,
          ...rest
        }) => rest),
        additionalCharges: additionalCharges.map(({
          id: _id,
          ...rest
        }) => rest),
        subtotal: Math.round(subtotal),
        tax: Math.round(gstAmount),
        discount: Math.round(discountAmt),
        extraCharges: Math.round(extraCharges),
        total: Math.round(grandTotal),
        amount: Math.round(subtotal),
        globalDiscount,
        notes,
        terms,
        paymentNotes,
        paymentMode,
        paymentAmount: parseFloat(paymentAmount) || 0,
        splitPayments,
        ...(bankAdded ? {
          bankDetails
        } : {})
      };
      await invoicesApi.create(payload);
      navigate('/admin/invoices');
    } catch (err) {
      alert(err?.message || 'Failed to save invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── style helpers ─────────────────────────────────────── */
  const card = {
    background: "var(--white)",
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    marginBottom: 16
  };
  const hdr = (extra = {}) => ({
    padding: '13px 18px',
    borderBottom: '1px solid #E2E8F0',
    fontSize: 14,
    fontWeight: 700,
    color: NAVY,
    background: '#F8FAFC',
    borderRadius: '10px 10px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...extra
  });
  const body = {
    padding: '18px'
  };
  const cell = (ex = {}) => ({
    border: `1px solid ${NAVY}`,
    padding: '7px 10px',
    fontSize: 12,
    verticalAlign: 'top',
    ...ex
  });
  const btn = (bg = NAVY, color = '#fff', ex = {}) => ({
    padding: '8px 18px',
    borderRadius: 7,
    border: 'none',
    background: bg,
    color,
    fontSize: 13,
    fontWeight: 700,
    cursor: saving ? 'not-allowed' : 'pointer',
    fontFamily: FONTS.sans,
    opacity: saving ? 0.7 : 1,
    ...ex
  });

  /* ═══════════════════════════════════════════════════════ */
  return <div className="ap-create-invoice-page-12">

      {/* TOP BAR */}
      <div className="ap-create-invoice-page-13">
        <div className="ap-create-invoice-page-14">
          <button onClick={() => onBack ? onBack() : navigate('/admin/invoices')} className="ap-create-invoice-page-15">←</button>
          <div>
            <div className="ap-create-invoice-page-16">Create Invoice</div>
            <div className="ap-create-invoice-page-17">{VENDOR.company}</div>
          </div>
        </div>
        <div className="ap-create-invoice-page-18">
          <span className="ap-create-invoice-page-19">INV-</span>
          <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="ap-create-invoice-page-20" />
        </div>
        <div className="ap-create-invoice-page-21">
          <button style={btn('#F1F5F9', '#374151', {
          border: '1px solid #CBD5E1'
        })} onClick={() => handleSave(true)} disabled={saving}>
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button style={btn('#E0F2FE', '#0369A1', {
          border: '1px solid #BAE6FD'
        })} onClick={() => handleSave(false)} disabled={saving}>
            Save and Print
          </button>
          <button style={btn(NAVY, '#fff', {
          boxShadow: '0 3px 10px rgba(26,46,92,.3)'
        })} onClick={() => handleSave(false)} disabled={saving}>
            {saving ? 'Saving…' : 'Save →'}
          </button>
        </div>
      </div>

      <div className="ap-create-invoice-page-22">

        {/* ── INVOICE DETAILS ─────────────────────────────── */}
        <div className="ap-create-invoice-page-23">
          <div style={hdr()}>Invoice Details</div>
          <div className="ap-create-invoice-page-24">
            <div className="ap-create-invoice-page-25">

              {/* Customer search */}
              <div className="ap-create-invoice-page-26">
                <div className="ap-create-invoice-page-27">
                  Select Customer / Company <span className="ap-create-invoice-page-28">*</span>
                </div>
                <div className="ap-create-invoice-page-29">
                  {/* <input
                    value={selectedCustomer || customerQuery}
                    onChange={e => { setCustomerQuery(e.target.value); setSelectedCustomer(null); setShowCustDrop(true); }}
                    onFocus={() => setShowCustDrop(true)}
                    placeholder="Search by name, company, GSTIN…"
                    style={{ flex: 1, padding: '8px 11px', border: '1px solid #CBD5E1', borderRadius: 7, fontSize: 13, outline: 'none' }}
                   /> */}
                  <input value={selectedCustomer?.name || customerQuery} onChange={e => {
                  setCustomerQuery(e.target.value);
                  setSelectedCustomer(null);
                  setShowCustDrop(true);
                }} onFocus={() => setShowCustDrop(true)} placeholder="Search by name, company, GSTIN…" className="ap-create-invoice-page-30" />
                  <button style={btn('#EFF6FF', '#1D4ED8', {
                  border: '1px solid #BFDBFE',
                  fontSize: 11,
                  padding: '6px 10px',
                  whiteSpace: 'nowrap'
                })} onClick={() => setShowCreateCustomer(true)}>
                    + Create
                  </button>
                </div>
                {/* {showCustDrop && custSuggestions.length > 0 && (
                  <>
                    <div onClick={() => setShowCustDrop(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 10, overflow: 'hidden' }}>
                      {custSuggestions.map(c => (
                        <div key={c} onClick={() => { setSelectedCustomer(c); setCustomerQuery(c); setShowCustDrop(false); }}
                          style={{ padding: '9px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #F1F5F9' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                          {c}
                        </div>
                      ))}
                    </div>
                  </>
                 )} */}
                {showCustDrop && custSuggestions.length > 0 && <>
    <div onClick={() => setShowCustDrop(false)} className="ap-create-invoice-page-31" />
    <div className="ap-create-invoice-page-32">
      {custSuggestions.map(c => <div key={c._id} onClick={() => {
                    setSelectedCustomer({
                      _id: c._id,
                      name: c.name
                    });
                    setCustomerQuery(c.name);
                    setBillToAddress(c.address || '');
                    setBillToPhone(c.phone || '');
                    setBillToEmail(c.email || '');
                    setShowCustDrop(false);
                  }} onMouseEnter={e => {
                    e.currentTarget.style.background = '#EFF6FF';
                  }} onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                  }} className="ap-create-invoice-page-33">
          {c.name}
        </div>)}
    </div>
  </>}
              </div>

              <Inp label="Invoice Date" type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} required />
              <Inp label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <Inp label="Invoice Subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. AC Service for Sharma Residency" />
          </div>
        </div>

        {/* ── BILL FROM / TO ───────────────────────────────── */}
        <div className="ap-create-invoice-page-23">
          <div style={hdr()}>Bill From / Bill To</div>
          <div className="ap-create-invoice-page-34">
            <table className="ap-create-invoice-page-35">
              <thead>
                <tr>
                  <td style={cell({
                  background: NAVY,
                  color: '#fff',
                  fontWeight: 800,
                  textAlign: 'center',
                  fontSize: 12
                })}>Bill From:</td>
                  <td style={cell({
                  background: NAVY,
                  color: '#fff',
                  fontWeight: 800,
                  textAlign: 'center',
                  fontSize: 12
                })}>Bill To:</td>
                </tr>
              </thead>
              <tbody>
                {/* Bill-To fields are editable so they flow into the invoice template */}
                {[['Company Name:', VENDOR.company, selectedCustomer?.name || customerQuery || '—', null, null], ['Address:', VENDOR.address, billToAddress, setBillToAddress, 'Billing address'], ['Contact Person:', VENDOR.contact, billToContact, setBillToContact, 'Contact name'], ['Phone No:', VENDOR.phone, billToPhone, setBillToPhone, 'Phone number'], ['Email:', VENDOR.email, billToEmail, setBillToEmail, 'Email address']].map(([label, fromVal, toVal, toSetter, ph]) => <tr key={label}>
                    <td style={cell()}><span className="ap-create-invoice-page-36">{label} </span>{fromVal}</td>
                    <td style={cell()}>
                      <span className="ap-create-invoice-page-37">{label} </span>
                      {toSetter ? <input value={toVal} onChange={e => toSetter(e.target.value)} placeholder={ph} className="ap-create-invoice-page-38" /> : <span style={{
                    color: toVal === '—' ? "var(--text-faint)" : "var(--text-h1)"
                  }}>{toVal}</span>}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PRODUCTS & SERVICES ─────────────────────────── */}
        <div className="ap-create-invoice-page-23">
          <div style={hdr()}>
            <span>Products &amp; Services</span>
            <label className="ap-create-invoice-page-39">
              <input type="checkbox" defaultChecked className="ap-create-invoice-page-40" />
              Show description
            </label>
          </div>
          <div className="ap-create-invoice-page-24">

            {/* Search bar */}
            <div className="ap-create-invoice-page-41">
              <div className="ap-create-invoice-page-42">
                <input value={productSearch} onChange={e => {
                setProductSearch(e.target.value);
                setShowProdDrop(true);
              }} onFocus={() => setShowProdDrop(true)} placeholder="🔍 Search or scan barcode for existing products" className="ap-create-invoice-page-43" />
                {showProdDrop && prodSuggestions.length > 0 && <>
                    <div onClick={() => setShowProdDrop(false)} className="ap-create-invoice-page-44" />
                    <div className="ap-create-invoice-page-45">
                      {prodSuggestions.map(p => <div key={p.name} onClick={() => addItem(p)} onMouseEnter={e => {
                    e.currentTarget.style.background = '#EFF6FF';
                  }} onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                  }} className="ap-create-invoice-page-46">
                          <div className="ap-create-invoice-page-47">{p.name}</div>
                          <div className="ap-create-invoice-page-48">₹{p.rate.toLocaleString()} + {p.gst}% GST</div>
                        </div>)}
                    </div>
                  </>}
              </div>
              <input value={productQty} onChange={e => setProductQty(e.target.value)} placeholder="Qty" className="ap-create-invoice-page-49" />
              <button style={btn('#F0F9FF', '#0369A1', {
              border: '1px solid #BAE6FD',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            })} onClick={addBlankItem}>
                + Add New Product
              </button>
            </div>

            {/* Items table */}
            <div className="ap-create-invoice-page-50">
              <table className="ap-create-invoice-page-51">
                <thead>
                  <tr className="ap-create-invoice-page-52">
                    {['SR.NO', 'DESCRIPTION', 'QTY', 'RATE (₹)', 'DISC %', 'TOTAL', ''].map(h => <th key={h} style={cell({
                    background: NAVY,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 11,
                    textAlign: 'center',
                    letterSpacing: 0.5
                  })}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => <tr key={it.id} style={{
                  background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
                }}>
                      <td style={cell({
                    textAlign: 'center',
                    width: 46,
                    color: '#888',
                    fontSize: 12
                  })}>{i + 1}</td>
                      <td style={cell()}>
                        <input value={it.name} onChange={e => updateItem(it.id, 'name', e.target.value)} placeholder="Product / Service name" className="ap-create-invoice-page-53" />
                      </td>
                      <td style={cell({
                    width: 64,
                    textAlign: 'center'
                  })}>
                        <input value={it.qty} onChange={e => updateItem(it.id, 'qty', e.target.value)} type="number" min="0" className="ap-create-invoice-page-54" />
                      </td>
                      <td style={cell({
                    width: 110,
                    textAlign: 'right'
                  })}>
                        <input value={it.rate} onChange={e => updateItem(it.id, 'rate', e.target.value)} type="number" min="0" className="ap-create-invoice-page-55" />
                      </td>
                      <td style={cell({
                    width: 80,
                    textAlign: 'center'
                  })}>
                        <input value={it.discount} onChange={e => updateItem(it.id, 'discount', e.target.value)} type="number" min="0" max="100" className="ap-create-invoice-page-56" />
                      </td>
                      <td style={cell({
                    width: 110,
                    textAlign: 'right',
                    fontWeight: 700,
                    fontFamily: FONTS.mono
                  })}>
                        ₹{fmtINR(it.total)}
                      </td>
                      <td style={cell({
                    width: 34,
                    textAlign: 'center'
                  })}>
                        <button onClick={() => removeItem(it.id)} className="ap-create-invoice-page-57">✕</button>
                      </td>
                    </tr>)}
                  {items.length === 0 && <tr>
                      <td colSpan={7} className="ap-create-invoice-page-58">
                        Search existing products or click <strong>+ Add New Product</strong> to get started 🚀
                      </td>
                    </tr>}
                </tbody>
              </table>
            </div>

            <div className="ap-create-invoice-page-59">
              Items: {items.length}, Qty: {items.reduce((s, it) => s + it.qty, 0).toFixed(1)}
            </div>

            {/* Additional Charges */}
            <div className="ap-create-invoice-page-60">
              <button onClick={addCharge} style={btn('#1A1A2E', '#fff', {
              fontSize: 12,
              padding: '7px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            })}>
                ● Additional Charges
              </button>
              {additionalCharges.map(c => <div key={c.id} className="ap-create-invoice-page-61">
                  <input value={c.label} onChange={e => updateCharge(c.id, 'label', e.target.value)} placeholder="Charge label (e.g. Delivery Charge)" className="ap-create-invoice-page-62" />
                  <input value={c.amount} onChange={e => updateCharge(c.id, 'amount', e.target.value)} type="number" min="0" placeholder="Amount" className="ap-create-invoice-page-63" />
                  <button onClick={() => removeCharge(c.id)} className="ap-create-invoice-page-64">✕</button>
                </div>)}
            </div>

            {/* Tax breakdown */}
            <div className="ap-create-invoice-page-65">
              <table className="ap-create-invoice-page-66">
                <thead>
                  <tr className="ap-create-invoice-page-67">
                    {['Tax', 'Rate (%)', 'Taxable (₹)', 'With Tax (₹)'].map(h => <th key={h} className="ap-create-invoice-page-68">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[...new Set(items.map(it => it.gst))].sort().map(rate => {
                  const base = items.filter(it => it.gst === rate).reduce((s, it) => s + it.total, 0);
                  return <tr key={rate}>
                        <td className="ap-create-invoice-page-69">GST</td>
                        <td className="ap-create-invoice-page-70">{rate}%</td>
                        <td className="ap-create-invoice-page-71">₹{fmtINR(base)}</td>
                        <td className="ap-create-invoice-page-72">₹{fmtINR(base * (1 + rate / 100))}</td>
                      </tr>;
                })}
                  {items.length === 0 && <tr><td colSpan={4} className="ap-create-invoice-page-73">No data</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Global discount */}
            <div className="ap-create-invoice-page-74">
              <span className="ap-create-invoice-page-75">Apply discount (%) to all items?</span>
              <input value={globalDiscount} onChange={e => setGlobalDiscount(parseFloat(e.target.value) || 0)} type="number" min="0" max="100" className="ap-create-invoice-page-76" />
            </div>
          </div>
        </div>

        {/* ── BOTTOM SECTION ──────────────────────────────── */}
        <div className="ap-create-invoice-page-77">

          {/* LEFT col */}
          <div>
            {/* Notes */}
            <div className="ap-create-invoice-page-23">
              <div style={{
              ...hdr()
            }} onClick={() => setShowNotes(p => !p)} className="ap-create-invoice-page-78">
                <span>{showNotes ? '▾' : '▸'} Notes</span>
                <span className="ap-create-invoice-page-79">optional</span>
              </div>
              {showNotes && <div className="ap-create-invoice-page-24">
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enter your notes, say thanks, or anything else" rows={3} className="ap-create-invoice-page-80" />
                </div>}
            </div>

            {/* Terms */}
            <div className="ap-create-invoice-page-23">
              <div style={{
              ...hdr()
            }} onClick={() => setShowTerms(p => !p)} className="ap-create-invoice-page-81">
                <span>{showTerms ? '▾' : '▸'} Terms &amp; Conditions</span>
                <span className="ap-create-invoice-page-82">optional</span>
              </div>
              {showTerms && <div className="ap-create-invoice-page-24">
                  <textarea value={terms} onChange={e => setTerms(e.target.value)} rows={4} className="ap-create-invoice-page-83" />
                </div>}
            </div>

            {/* Bank */}
            <div className="ap-create-invoice-page-23">
              <div className="ap-create-invoice-page-24">
                <button onClick={() => setShowBankModal(true)} style={{
                border: `2px dashed ${bankAdded ? '#16A34A' : '#BFDBFE'}`,
                background: bankAdded ? "var(--success-bg)" : "var(--info-bg)",
                color: bankAdded ? "var(--success-text)" : "var(--info-text)"
              }} className="ap-create-invoice-page-84">
                  🏛 {bankAdded ? '✓ Bank Added to Invoice' : 'Add Bank to Invoice (Optional)'}
                </button>
                {bankAdded && <div className="ap-create-invoice-page-85">
                    <div><strong>{bankDetails.bankName}</strong> · {bankDetails.branch}</div>
                    <div className="ap-create-invoice-page-86">A/C: {bankDetails.accountNo} &nbsp;|&nbsp; IFSC: {bankDetails.ifsc}</div>
                    {bankDetails.upi && <div>UPI: {bankDetails.upi}</div>}
                  </div>}
              </div>
            </div>

            {/* Signature */}
            <div className="ap-create-invoice-page-23">
              <div className="ap-create-invoice-page-24">
                <div className="ap-create-invoice-page-87">
                  <div className="ap-create-invoice-page-88">
                    <img src={SIG_IMG} alt="Signature" className="ap-create-invoice-page-89" />
                  </div>
                  <div className="ap-create-invoice-page-90">[Authorized Signatory] — {VENDOR.contact}</div>
                  <div className="ap-create-invoice-page-91">From: {VENDOR.company}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT col */}
          <div>
            {/* Invoice Summary */}
            <div className="ap-create-invoice-page-23">
              <div style={hdr()}>Invoice Summary</div>
              <div className="ap-create-invoice-page-24">
                {[['Subtotal', `₹${fmtINR(subtotal)}`], ['GST', `₹${fmtINR(gstAmount)}`], ...additionalCharges.map(c => [c.label, `₹${fmtINR(parseFloat(c.amount) || 0)}`]), ...(globalDiscount > 0 ? [['Discount', `-₹${fmtINR(discountAmt)}`]] : [])].map(([k, v]) => <div key={k} className="ap-create-invoice-page-92">
                    <span className="ap-create-invoice-page-93">{k}</span>
                    <span className="ap-create-invoice-page-94">{v}</span>
                  </div>)}
                <div className="ap-create-invoice-page-95">
                  <span className="ap-create-invoice-page-96">Total Amount</span>
                  <span className="ap-create-invoice-page-97">₹{fmtINR(grandTotal)}</span>
                </div>
                {grandTotal > 0 && <div className="ap-create-invoice-page-98">
                    <strong>Amount in words:</strong> {numToWords(Math.round(grandTotal))} Rupees Only
                  </div>}
              </div>
            </div>

            {/* Payment Section */}
            <div className="ap-create-invoice-page-23">
              <div style={hdr()}>
                <span>Add Payment</span>
                <label className="ap-create-invoice-page-99">
                  <input type="checkbox" checked={markPaid} onChange={e => setMarkPaid(e.target.checked)} className="ap-create-invoice-page-100" />
                  Mark as fully paid
                </label>
              </div>
              <div className="ap-create-invoice-page-24">
                <div className="ap-create-invoice-page-101">
                  <div>
                    <div className="ap-create-invoice-page-102">NOTES</div>
                    <textarea value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} placeholder="Advance received, UTR number etc…" rows={2} className="ap-create-invoice-page-103" />
                  </div>
                  <div>
                    <div className="ap-create-invoice-page-104">AMOUNT</div>
                    <input value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} type="number" min="0" className="ap-create-invoice-page-105" />
                  </div>
                  <div className="ap-create-invoice-page-106">
                    <div className="ap-create-invoice-page-107">PAYMENT MODE</div>
                    <button onClick={() => setPayModeOpen(p => !p)} style={btn('#fff', '#374151', {
                    border: '1px solid #CBD5E1',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 132
                  })}>
                      {paymentMode} <span className="ap-create-invoice-page-108">▾</span>
                    </button>
                    {payModeOpen && <>
                        <div onClick={() => setPayModeOpen(false)} className="ap-create-invoice-page-109" />
                        <div className="ap-create-invoice-page-110">
                          {PAYMENT_MODES.map(m => <div key={m} onClick={() => {
                        setPaymentMode(m);
                        setPayModeOpen(false);
                      }} style={{
                        background: paymentMode === m ? "var(--info-bg)" : "transparent",
                        fontWeight: paymentMode === m ? "700" : "400",
                        color: paymentMode === m ? "var(--info-text)" : "var(--text-body)"
                      }} onMouseEnter={e => {
                        if (paymentMode !== m) e.currentTarget.style.background = '#F8FAFC';
                      }} onMouseLeave={e => {
                        if (paymentMode !== m) e.currentTarget.style.background = 'transparent';
                      }} className="ap-create-invoice-page-111">
                              {m}
                            </div>)}
                        </div>
                      </>}
                  </div>
                </div>

                <div className="ap-create-invoice-page-112">
                  <button onClick={() => {
                  setShowSplit(p => !p);
                  if (!showSplit) addSplit();
                }} className="ap-create-invoice-page-113">
                    ⊕ Split Payment
                  </button>
                  {splitPayments.map((sp, i) => <div key={sp.id} className="ap-create-invoice-page-114">
                      <span className="ap-create-invoice-page-115">#{i + 2}</span>
                      <select value={sp.mode} onChange={e => updateSplit(sp.id, 'mode', e.target.value)} className="ap-create-invoice-page-116">
                        {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
                      </select>
                      <input value={sp.amount} onChange={e => updateSplit(sp.id, 'amount', e.target.value)} type="number" min="0" className="ap-create-invoice-page-117" />
                      <button onClick={() => removeSplit(sp.id)} className="ap-create-invoice-page-118">✕</button>
                    </div>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SAVE */}
        <div className="ap-create-invoice-page-119">
          <button style={btn('#F1F5F9', '#374151', {
          border: '1px solid #CBD5E1'
        })} onClick={() => handleSave(true)} disabled={saving}>
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button style={btn('#E0F2FE', '#0369A1', {
          border: '1px solid #BAE6FD'
        })} onClick={() => handleSave(false)} disabled={saving}>
            Save and Print
          </button>
          <button style={btn(NAVY, '#fff', {
          boxShadow: '0 3px 10px rgba(26,46,92,.3)'
        })} onClick={() => handleSave(false)} disabled={saving}>
            {saving ? 'Saving…' : 'Save →'}
          </button>
        </div>
      </div>

      {/* ── BANK MODAL ───────────────────────────────────── */}
      {showBankModal && <div onClick={() => setShowBankModal(false)} className="ap-create-invoice-page-120">
          <div onClick={e => e.stopPropagation()} className="ap-create-invoice-page-121">
            <div className="ap-create-invoice-page-122">
              <div className="ap-create-invoice-page-123">🏛 Bank Details</div>
              <div className="ap-create-invoice-page-124">
                <button onClick={() => {
              setBankAdded(true);
              setShowBankModal(false);
            }} style={btn(NAVY, '#fff', {
              padding: '8px 18px'
            })}>Save &amp; Update</button>
                <button onClick={() => setShowBankModal(false)} className="ap-create-invoice-page-125">✕</button>
              </div>
            </div>
            <div className="ap-create-invoice-page-126">
              <Inp label="Account Holder Name" value={bankDetails.accountName} onChange={setBD('accountName')} />
              <Inp label="Account No" value={bankDetails.accountNo} onChange={setBD('accountNo')} required mono />
              <Inp label="Confirm Bank Account No" value={bankDetails.confirmAccountNo} onChange={setBD('confirmAccountNo')} required mono />
              <div className="ap-create-invoice-page-127">
                <div className="ap-create-invoice-page-128">IFSC Code <span className="ap-create-invoice-page-129">*</span></div>
                <div className="ap-create-invoice-page-130">
                  <input value={bankDetails.ifsc} onChange={setBD('ifsc')} placeholder="IFSC Code" className="ap-create-invoice-page-131" />
                  <button style={btn('#EFF6FF', '#1D4ED8', {
                border: '1px solid #BFDBFE',
                fontSize: 12
              })}>Fetch Bank Details</button>
                </div>
              </div>
              <Inp label="Bank Name" value={bankDetails.bankName} onChange={setBD('bankName')} required />
              <Inp label="Branch Name" value={bankDetails.branch} onChange={setBD('branch')} required />
              <div className="ap-create-invoice-page-132">
                <div className="ap-create-invoice-page-133">UPI <span className="ap-create-invoice-page-134">OPTIONAL</span></div>
                <div className="ap-create-invoice-page-135">
                  <input value={bankDetails.upi} onChange={setBD('upi')} placeholder="UPI ID eg. username@okicici" className="ap-create-invoice-page-136" />
                  <button style={btn('#EFF6FF', '#1D4ED8', {
                border: '1px solid #BFDBFE',
                fontSize: 12
              })}>Verify UPI ID</button>
                </div>
                <div className="ap-create-invoice-page-137">This UPI ID will generate <strong>Dynamic QR codes</strong> on invoices and bills.</div>
              </div>
              <Inp label="UPI Number (Optional)" value={bankDetails.upiNumber} onChange={setBD('upiNumber')} mono placeholder="GPay/PhonePe Number" />
              <div className="ap-create-invoice-page-138">
                <div className="ap-create-invoice-page-139">Notes</div>
                <textarea value={bankDetails.notes} onChange={setBD('notes')} placeholder="Beneficiary Name, SWIFT Code etc…" rows={3} className="ap-create-invoice-page-140" />
              </div>
              <div className="ap-create-invoice-page-141">
                <Toggle checked={bankDetails.isDefault} onChange={e => setBankDetails(p => ({
              ...p,
              isDefault: e.target.checked
            }))} label="Default" sub="This will override your previous default bank" />
              </div>
              <button onClick={() => {
            setBankAdded(true);
            setShowBankModal(false);
          }} style={btn(NAVY, '#fff', {
            width: '100%',
            padding: '12px'
          })}>Save &amp; Update</button>
            </div>
          </div>
        </div>}

      {/* ── NEW CUSTOMER MODAL ─────────────────────────── */}
      <NewCustomerModal open={showCreateCustomer} onClose={() => setShowCreateCustomer(false)} onSave={async payload => {
      const doc = await customersApi.create(payload); // raw document — createCRUD, no {success,data} wrapper
      setLiveCustomers(prev => [doc, ...prev]);
      setSelectedCustomer({
        _id: doc._id,
        name: doc.name
      });
      setCustomerQuery(doc.name);
      setBillToAddress(doc.address || '');
      setBillToPhone(doc.phone || '');
      setBillToEmail(doc.email || '');
    }} activeTypes={activeTypes} onAddType={newType => setActiveTypes(prev => [...prev, newType])} />
    </div>;
};
export default CreateInvoicePage;