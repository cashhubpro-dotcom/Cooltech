import { COLORS, FONTS } from '../../constants/tokens';
import Modal from '../ui/Modal';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../ui/Form';
import { useState, useEffect, useRef, useCallback } from 'react';
import RichTextFileEditor from './RichTextFileEditor';
import { Avatar } from '../../components/ui/Badges';
import PDFPreview from '../layout/PDFPreview';
import { invoices, technicians, jobs } from '../../data/mockData';
import { DynamicSelect } from './Modals';
import { invoicesApi, paymentsApi, priceItemsApi, remindersApi, leavesApi, attendanceApi, complaintsApi, jobsApi, techsApi, timelogsApi, gaslogApi, customersApi } from '../../services/api';

// ─── sanitizePayload ──────────────────────────────────────────────────────────
// Strips MongoDB meta-fields that must never be sent on a POST/PUT body.
// Prevents E11000 duplicate key errors from leaked mock _id values.
const STRIP_KEYS = new Set(['_id', 'id', '__v', 'createdAt', 'updatedAt', 'deletedAt']);
const sanitizePayload = payload => {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return payload.map(sanitizePayload);
  return Object.fromEntries(Object.entries(payload).filter(([k]) => !STRIP_KEYS.has(k)).map(([k, v]) => [k, v && typeof v === 'object' && !Array.isArray(v) ? sanitizePayload(v) : Array.isArray(v) ? v.map(sanitizePayload) : v]));
};

// ─── useModalForm ─────────────────────────────────────────────────────────────
// Identical to the one in Modals.jsx — keeps this file self-contained.
// Sanitizes payload before every API call to strip leaked _id / id fields.
const useModalForm = (apiCall, onSave, onClose) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = useCallback(async payload => {
    setError('');
    setLoading(true);
    try {
      const clean = sanitizePayload(payload);
      const result = await apiCall(clean);
      onSave?.(result);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [apiCall, onSave, onClose]);
  return {
    loading,
    error,
    submit
  };
};

// ─── ErrorBanner ──────────────────────────────────────────────────────────────
const ErrorBanner = ({
  message
}) => message ? <div className="ap-hr-modals-1">
      ⚠️ {message}
    </div> : null;

// ─── Section heading inside modal ─────────────────────────────────────────────
const SectionHead = ({
  title
}) => <div className="ap-hr-modals-2">
    {title}
  </div>;

// ─── SectionDivider ───────────────────────────────────────────────────────────
const SectionDivider = ({
  label,
  open,
  onToggle
}) => <button onClick={onToggle} className="ap-hr-modals-3">
    <span className="ap-hr-modals-4">{label}</span>
    <span className="ap-hr-modals-5">
      {open ? '▲' : '▼'}
    </span>
  </button>;

// ─── CheckRow ─────────────────────────────────────────────────────────────────
const CheckRow = ({
  checked,
  onChange,
  label,
  hint
}) => <label className="ap-hr-modals-6">
    <input type="checkbox" checked={checked} onChange={onChange} className="ap-hr-modals-7" />
    <div>
      <div className="ap-hr-modals-8">{label}</div>
      {hint && <div className="ap-hr-modals-9">{hint}</div>}
    </div>
  </label>;

// ─── SendRemindersModal ───────────────────────────────────────────────────────
// Sends payment reminders for all overdue/pending invoices.
// API: PATCH /invoices/:id with { reminderSent: true } for each overdue invoice.
export const SendRemindersModal = ({
  open,
  onClose,
  onSave
}) => {
  const overdueInvoices = invoices.filter(i => i.status !== 'paid');
  const [sendVia, setSendVia] = useState('WhatsApp + SMS');
  const [template, setTemplate] = useState('Dear {customer}, your invoice {invoice} of ₹{amount} is due on {date}. Please arrange payment. Thank you. – CoolTech AC Services');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSend = async () => {
    setError('');
    setLoading(true);
    try {
      // Use _id (MongoDB) falling back to id (mock data) — never send the id in the body
      await Promise.all(overdueInvoices.map(inv => {
        const invoiceId = inv._id ?? inv.id;
        return invoicesApi.update(invoiceId, {
          reminderSent: true,
          reminderChannel: sendVia,
          reminderTemplate: template
        });
      }));
      onSave?.({
        sent: overdueInvoices.length
      });
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to send reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  if (!open) return null;
  return <Modal open={open} onClose={onClose} title="📤 Send Payment Reminders" width={480}>
      <ErrorBanner message={error} />
      <div className="ap-hr-modals-10">
        <div className="ap-hr-modals-11">Overdue & Pending Invoices</div>
        {overdueInvoices.map(inv => <div key={inv.id} className="ap-hr-modals-12">
            <span>{inv.id} – {inv.customer}</span>
            <span className="ap-hr-modals-13">₹{inv.total?.toLocaleString()}</span>
          </div>)}
      </div>
      <FRow label="Send Via">
        <FSelect value={sendVia} onChange={e => setSendVia(e.target.value)}>
          {['WhatsApp + SMS', 'WhatsApp Only', 'SMS Only', 'Email'].map(v => <option key={v}>{v}</option>)}
        </FSelect>
      </FRow>
      <FRow label="Message Template">
        <textarea value={template} onChange={e => setTemplate(e.target.value)} rows={3} className="ap-hr-modals-14" />
      </FRow>
      <div className="ap-hr-modals-15">
        📤 {overdueInvoices.length} reminder{overdueInvoices.length !== 1 ? 's' : ''} will be sent automatically
      </div>
      <div className="ap-hr-modals-16">
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSend} disabled={loading || overdueInvoices.length === 0}>
          {loading ? 'Sending…' : 'Send All Reminders'}
        </FBtn>
      </div>
    </Modal>;
};

// ─── RecordPaymentModal ───────────────────────────────────────────────────────
// Marks an invoice as paid via invoicesApi.pay(id, payload).
const PAYMENT_METHOD_DEFAULTS = ['Bank Transfer / NEFT', 'UPI', 'Cash', 'Cheque', 'Credit Card'];
export const RecordPaymentModal = ({
  open,
  onClose,
  onSave,
  paymentMethods: paymentMethodOptions = [],
  onAddPaymentMethod
}) => {
  const paymentMethodList = paymentMethodOptions.length ? paymentMethodOptions : PAYMENT_METHOD_DEFAULTS;
  const [liveInvoices, setLiveInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState('');
  const [form, setForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    method: 'Bank Transfer / NEFT',
    reference: '',
    notes: ''
  });
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));

  // Load unpaid invoices when modal opens
  useEffect(() => {
    if (!open) return;
    invoicesApi.list({
      status: 'unpaid',
      limit: 100
    }).then(r => {
      const data = r.data ?? [];
      setLiveInvoices(data);
      if (data.length > 0) setSelectedInvoice(data[0]._id ?? data[0].id);
    }).catch(() => {
      // Fall back to mock data
      const unpaid = invoices.filter(i => i.status !== 'paid');
      setLiveInvoices(unpaid);
      if (unpaid.length > 0) setSelectedInvoice(unpaid[0].id);
    });
  }, [open]);
  const {
    loading,
    error,
    submit
  } = useModalForm(payload => invoicesApi.pay(selectedInvoice, payload), onSave, onClose);
  const handleSave = () => {
    if (!selectedInvoice) {
      alert('Please select an invoice');
      return;
    }
    if (!form.amount) {
      alert('Amount is required');
      return;
    }
    submit(form);
  };
  if (!open) return null;
  return <Modal open={open} onClose={onClose} title="💳 Record Payment" width={460}>
      <ErrorBanner message={error} />
      <FRow label="Invoice *">
        <FSelect value={selectedInvoice} onChange={e => setSelectedInvoice(e.target.value)}>
          {liveInvoices.map(inv => <option key={inv._id ?? inv.id} value={inv._id ?? inv.id}>
              {inv.id ?? inv._id} – {inv.customer} – ₹{inv.total?.toLocaleString()}
            </option>)}
        </FSelect>
      </FRow>
      <div className="ap-hr-modals-17">
        <FRow label="Amount (₹) *">
          <FInput type="number" placeholder="5310" value={form.amount} onChange={set('amount')} />
        </FRow>
        <FRow label="Payment Date">
          <FInput type="date" value={form.paymentDate} onChange={set('paymentDate')} />
        </FRow>
        <FRow label="Payment Method">
          <DynamicSelect options={paymentMethodList} value={form.method} onChange={v => setForm(f => ({
          ...f,
          method: v
        }))} onAddOption={v => onAddPaymentMethod?.(v)} addLabel="Payment Method" addPlaceholder="e.g. Wallet, Crypto…" />
        </FRow>
        <FRow label="Reference No.">
          <FInput placeholder="UPI/NEFT/Cheque ref" value={form.reference} onChange={set('reference')} />
        </FRow>
      </div>
      <FRow label="Notes">
        <FInput placeholder="Optional payment notes" value={form.notes} onChange={set('notes')} />
      </FRow>
      <div className="ap-hr-modals-18">
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Recording…' : 'Record Payment'}</FBtn>
      </div>
    </Modal>;
};

// ─── NewPriceItemModal ────────────────────────────────────────────────────────
// ─── NewPriceItemModal ────────────────────────────────────────────────────────
// Handles both create AND edit. Pass `item` (an existing PriceItem) to prefill
// and switch to update mode; omit it (or pass null) for "add new".
const PRICE_ITEM_CATEGORY_DEFAULTS = ['Service', 'Gas Refill', 'Installation', 'Repair', 'AMC'];
const PRICE_ITEM_UNIT_DEFAULTS = ['per visit', 'per unit', 'per cylinder', 'per year', 'per month', 'per day', 'per job'];

const EMPTY_PRICE_ITEM_FORM = {
  serviceName: '',
  category: 'Service',
  unit: 'per visit',
  priceExGst: '',
  gstPercent: '18',
  status: 'Active'
};

export const NewPriceItemModal = ({
  open,
  onClose,
  onSave,
  item = null, // pass an existing PriceItem to edit; omit/null to create new
  priceItemCategories: priceItemCategoryOptions = [],
  onAddPriceItemCategory,
  priceItemUnits: priceItemUnitOptions = [],
  onAddPriceItemUnit
}) => {
  const priceItemCategoryList = priceItemCategoryOptions.length ? priceItemCategoryOptions : PRICE_ITEM_CATEGORY_DEFAULTS;
  const priceItemUnitList = priceItemUnitOptions.length ? priceItemUnitOptions : PRICE_ITEM_UNIT_DEFAULTS;
  const isEditing = !!(item && (item._id || item.priceId));

  const [form, setForm] = useState(EMPTY_PRICE_ITEM_FORM);

  // Prefill on open when editing; reset to blank when adding new
  useEffect(() => {
    if (!open) return;
    if (item) {
      setForm({
        serviceName: item.name || '',
        category: item.category || 'Service',
        unit: item.unit || 'per visit',
        priceExGst: item.price != null ? String(item.price) : '',
        gstPercent: item.gst != null ? String(item.gst) : (item.gstPercent != null ? String(item.gstPercent) : '18'),
        status: item.active === false ? 'Inactive' : (item.status || 'Active')
      });
    } else {
      setForm(EMPTY_PRICE_ITEM_FORM);
    }
  }, [open, item]);

  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));

  const {
    loading,
    error,
    submit
  } = useModalForm(
    payload => isEditing
      ? priceItemsApi.update(item._id ?? item.id, payload)
      : priceItemsApi.create(payload),
    onSave,
    onClose
  );

  const handleSave = () => {
    if (!form.serviceName) {
      alert('Service Name is required');
      return;
    }
    if (!form.priceExGst) {
      alert('Price is required');
      return;
    }
    const gst = parseFloat(form.gstPercent) || 0;
    const priceExGst = parseFloat(form.priceExGst) || 0;

    submit({
      name: form.serviceName,
      price: priceExGst,
      category: form.category,
      unit: form.unit,
      gstPercent: gst,
      status: form.status,
      totalInclGst: +(priceExGst * (1 + gst / 100)).toFixed(2)
    });
  };

  if (!open) return null;
  return <Modal open={open} onClose={onClose} title={isEditing ? '✏️ Edit Price Item' : '🏷 Add Price Item'} width={480}>
      <ErrorBanner message={error} />
      <FRow label="Service Name *">
        <FInput placeholder="Split AC Service (1.5T)" value={form.serviceName} onChange={set('serviceName')} />
      </FRow>
      <div className="ap-hr-modals-19">
        <FRow label="Category">
          <DynamicSelect options={priceItemCategoryList} value={form.category} onChange={v => setForm(f => ({
          ...f,
          category: v
        }))} onAddOption={v => onAddPriceItemCategory?.(v)} addLabel="Price Item Category" addPlaceholder="e.g. Consultation, Inspection…" />
        </FRow>
        <FRow label="Unit">
          <DynamicSelect options={priceItemUnitList} value={form.unit} onChange={v => setForm(f => ({
          ...f,
          unit: v
        }))} onAddOption={v => onAddPriceItemUnit?.(v)} addLabel="Unit" addPlaceholder="e.g. per hour, per sq.ft…" />
        </FRow>
        <FRow label="Price ex-GST (₹) *">
          <FInput type="number" placeholder="599" value={form.priceExGst} onChange={set('priceExGst')} />
        </FRow>
        <FRow label="GST %">
          <FSelect value={form.gstPercent} onChange={set('gstPercent')}>
            {['0', '5', '12', '18', '28'].map(g => <option key={g}>{g}</option>)}
          </FSelect>
        </FRow>
      </div>
      {form.priceExGst && <div className="ap-hr-modals-20">
          Price incl. GST: <strong>₹{(parseFloat(form.priceExGst) * (1 + parseFloat(form.gstPercent) / 100)).toFixed(2)}</strong>
        </div>}
      <FRow label="Status">
        <FSelect value={form.status} onChange={set('status')}>
          <option>Active</option><option>Inactive</option>
        </FSelect>
      </FRow>
      <div className="ap-hr-modals-21">
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Item'}</FBtn>
      </div>
    </Modal>;
};

// ─── NewReminderModal ─────────────────────────────────────────────────────────
// Creates a service reminder via remindersApi.create().
const REMINDER_TYPE_DEFAULTS = ['Annual Service', 'AMC Service Due', 'Gas Refill Check', 'AMC Renewal', 'Filter Cleaning'];
export const NewReminderModal = ({
  open,
  onClose,
  onSave,
  reminderTypes: reminderTypeOptions = [],
  onAddReminderType
}) => {
  const reminderTypeList = reminderTypeOptions.length ? reminderTypeOptions : REMINDER_TYPE_DEFAULTS;
  const [form, setForm] = useState({
    customer: '',
    acUnit: '',
    reminderType: 'Annual Service',
    dueDate: '',
    sendOption: 'Yes – auto send 7 days before'
  });
  const [liveCustomers, setLiveCustomers] = useState([]);
  useEffect(() => {
    if (!open) return;
    customersApi.list({ limit: 200 }).then(r => setLiveCustomers(r.data ?? [])).catch(() => {});
  }, [open]);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const {
    loading,
    error,
    submit
  } = useModalForm(payload => remindersApi.create(payload), onSave, onClose);
  const handleSave = () => {
    if (!form.customer) {
      alert('Customer is required');
      return;
    }
    if (!form.dueDate) {
      alert('Due Date is required');
      return;
    }
    submit(form);
  };
  if (!open) return null;
  return <Modal open={open} onClose={onClose} title="🔔 Add Service Reminder" width={460}>
      <ErrorBanner message={error} />
      <FRow label="Customer *">
        <FSelect value={form.customer} onChange={set('customer')}>
          <option value="">Select customer…</option>
          {liveCustomers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </FSelect>
      </FRow>
      <FRow label="AC Unit">
        <FInput placeholder="Samsung 1.5T Split – Bedroom" value={form.acUnit} onChange={set('acUnit')} />
      </FRow>
      <div className="ap-hr-modals-22">
        <FRow label="Reminder Type">
          <DynamicSelect options={reminderTypeList} value={form.reminderType} onChange={v => setForm(f => ({
          ...f,
          reminderType: v
        }))} onAddOption={v => onAddReminderType?.(v)} addLabel="Reminder Type" addPlaceholder="e.g. Coil Cleaning, Refrigerant Top-Up…" />
        </FRow>
        <FRow label="Due Date *">
          <FInput type="date" value={form.dueDate} onChange={set('dueDate')} />
        </FRow>
      </div>
      <FRow label="Send SMS/WhatsApp">
        <FSelect value={form.sendOption} onChange={set('sendOption')}>
          {['Yes – auto send 7 days before', 'Yes – send now', 'No – manual only'].map(o => <option key={o}>{o}</option>)}
        </FSelect>
      </FRow>
      <div className="ap-hr-modals-23">
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Adding…' : 'Add Reminder'}</FBtn>
      </div>
    </Modal>;
};

// ─── ApplyLeaveModal ──────────────────────────────────────────────────────────
// Submits a leave application via leavesApi.create().
const LEAVE_TYPE_DEFAULTS = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Unpaid Leave'];
export const ApplyLeaveModal = ({
  open,
  onClose,
  onSave,
  leaveTypes: leaveTypeOptions = [],
  onAddLeaveType
}) => {
  const leaveTypeList = leaveTypeOptions.length ? leaveTypeOptions : LEAVE_TYPE_DEFAULTS;
  const [liveTechs, setLiveTechs] = useState([]);
  const [form, setForm] = useState({
    technician: '',
    leaveType: 'Casual Leave',
    fromDate: '',
    toDate: '',
    reason: ''
  });
  useEffect(() => {
    if (!open) return;
    techsApi.list({ limit: 200 }).then(r => {
      const data = r.data ?? [];
      setLiveTechs(data);
      setForm(f => ({ ...f, technician: data[0]?._id ?? '' }));
    }).catch(() => {});
  }, [open]);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const {
    loading,
    error,
    submit
  } = useModalForm(payload => leavesApi.create(payload), onSave, onClose);
  const handleSave = () => {
    if (!form.technician) {
      alert('Please select a technician');
      return;
    }
    if (!form.fromDate || !form.toDate) {
      alert('From and To dates are required');
      return;
    }
    if (form.fromDate > form.toDate) {
      alert('From date cannot be after To date');
      return;
    }
    const t = liveTechs.find(t => t._id === form.technician);
    submit({ ...form, techName: t?.name || '' });
  };
  if (!open) return null;
  return <Modal open={open} onClose={onClose} title="🌴 Apply for Leave" width={460}>
      <ErrorBanner message={error} />
      <FRow label="Technician *">
        <FSelect value={form.technician} onChange={set('technician')}>
          <option value="">Select technician…</option>
          {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </FSelect>
      </FRow>
      <FRow label="Leave Type">
        <DynamicSelect options={leaveTypeList} value={form.leaveType} onChange={v => setForm(f => ({
        ...f,
        leaveType: v
      }))} onAddOption={v => onAddLeaveType?.(v)} addLabel="Leave Type" addPlaceholder="e.g. Maternity Leave, Compensatory Off…" />
      </FRow>
      <div className="ap-hr-modals-24">
        <FRow label="From Date *"><FInput type="date" value={form.fromDate} onChange={set('fromDate')} /></FRow>
        <FRow label="To Date *"><FInput type="date" value={form.toDate} onChange={set('toDate')} /></FRow>
      </div>
      {form.fromDate && form.toDate && form.fromDate <= form.toDate && <div className="ap-hr-modals-25">
          Duration: <strong>
            {Math.round((new Date(form.toDate) - new Date(form.fromDate)) / 86400000) + 1} day(s)
          </strong>
        </div>}
      <FRow label="Reason">
        <FTextarea placeholder="Reason for leave…" rows={2} value={form.reason} onChange={set('reason')} />
      </FRow>
      <FRow label="Supporting Document">
        <div onClick={() => document.getElementById('leave-doc-upload')?.click()} className="ap-hr-modals-26">
          <input id="leave-doc-upload" type="file" accept="image/*,application/pdf" className="ap-hr-modals-27" />
          <div className="ap-hr-modals-28">📎 Upload medical certificate / document (optional)</div>
        </div>
      </FRow>
      <div className="ap-hr-modals-29">
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Submitting…' : 'Submit Application'}</FBtn>
      </div>
    </Modal>;
};

// ─── LogGasModal ──────────────────────────────────────────────────────────────
// Logs refrigerant usage via gaslogApi.create().
const GAS_TYPE_DEFAULTS = ['R-32', 'R-410A', 'R-22', 'R-134a', 'R-407C', 'R-404A'];
const GAS_REASON_DEFAULTS = ['New installation', 'Gas leak – refill', 'Annual refill', 'Compressor replacement', 'Routine refill', 'Top-up service', 'Recovery only'];
const GAS_REGULATION_REF_DEFAULTS = ['EU F-Gas Reg 517/2014', 'BEE India Guidelines', 'ASHRAE 15', 'Other / Local'];
const GAS_DISPOSAL_METHOD_DEFAULTS = ['N/A – No recovery', 'Reclaimed – reuse', 'Returned to supplier', 'Destroyed / certified disposal'];
export const LogGasModal = ({
  open,
  onClose,
  onSave,
  gasTypes: gasTypeOptions = [],
  onAddGasType,
  gasReasons: gasReasonOptions = [],
  onAddGasReason,
  gasRegulationRefs: gasRegulationRefOptions = [],
  onAddGasRegulationRef,
  gasDisposalMethods: gasDisposalMethodOptions = [],
  onAddGasDisposalMethod
}) => {
  const gasTypeList = gasTypeOptions.length ? gasTypeOptions : GAS_TYPE_DEFAULTS;
  const gasReasonList = gasReasonOptions.length ? gasReasonOptions : GAS_REASON_DEFAULTS;
  const gasRegulationRefList = gasRegulationRefOptions.length ? gasRegulationRefOptions : GAS_REGULATION_REF_DEFAULTS;
  const gasDisposalMethodList = gasDisposalMethodOptions.length ? gasDisposalMethodOptions : GAS_DISPOSAL_METHOD_DEFAULTS;
  const [leakTestDone, setLeakTestDone] = useState(false);
  const [liveTechs, setLiveTechs] = useState([]);
  const [liveJobs, setLiveJobs] = useState([]);
  const [form, setForm] = useState({
    jobRef: '',
    technician: '',
    customer: '',
    acUnit: '',
    date: new Date().toISOString().slice(0, 10),
    gasType: 'R-32',
    cylindersUsed: 1,
    kgUsed: '',
    kgRecovered: '',
    kgRemaining: '',
    gwp: '',
    pressureBefore: '',
    pressureAfter: '',
    reason: 'New installation',
    leakTestResult: 'Pass',
    fGasCert: '',
    regulation: 'EU F-Gas Reg 517/2014',
    disposal: 'N/A – No recovery',
    supervisorSignoff: '',
    notes: ''
  });
  useEffect(() => {
    if (!open) return;
    techsApi.list({ limit: 200 }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
    jobsApi.list({ limit: 200 }).then(r => setLiveJobs(r.data ?? [])).catch(() => {});
  }, [open]);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const {
    loading,
    error,
    submit
  } = useModalForm(payload => gaslogApi.create({
    gasType: payload.gasType || 'R-32',
    quantity: Number(payload.kgUsed) || 0,
    operation: payload.reason?.toLowerCase().includes('new') ? 'install' : payload.reason?.toLowerCase().includes('top') ? 'top-up' : 'charge',
    techName: payload.techName || '',
    customerName: payload.customer || payload.customerName || '',
    jobRef: payload.jobRef || '',
    certNumber: payload.fGasCert || payload.certNumber || '',
    notes: payload.notes || payload.reason || '',
    date: payload.date || new Date(),
    pressure: Number(payload.pressureBefore) || null,
    cylinders: Number(payload.cylindersUsed) || 0,
    kgRecovered: Number(payload.kgRecovered) || null,
    leakTest: payload.leakTestDone,
    complianceCert: payload.fGasCert
  }), onSave, onClose);
  const handleSave = () => {
    if (!form.jobRef) {
      alert('Job Reference is required');
      return;
    }
    if (!form.technician) {
      alert('Technician is required');
      return;
    }
    if (!form.kgUsed) {
      alert('Kg Used is required');
      return;
    }
    if (!form.fGasCert) {
      alert('F-Gas Certification No. is required');
      return;
    }
    const t = liveTechs.find(t => t._id === form.technician);
    submit({
      ...form,
      techName: t?.name || '',
      leakTestDone
    });
  };
  if (!open) return null;
  return <Modal open={open} onClose={onClose} title="🧪 Log Gas / Refrigerant Usage" width={660}>
      <ErrorBanner message={error} />
 
      <SectionHead title="Job & Technician" />
      <div className="ap-hr-modals-30">
        <FRow label="Job Reference *">
          <FSelect value={form.jobRef} onChange={set('jobRef')}>
            <option value="">Select…</option>
            {liveJobs.map(j => <option key={j._id} value={j._id}>{j.jobId || j._id}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Technician *">
          <FSelect value={form.technician} onChange={set('technician')}>
            <option value="">Select…</option>
            {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Customer">
          <FInput placeholder="Auto-fills from job" value={form.customer} onChange={set('customer')} />
        </FRow>
        <FRow label="AC Unit / Equipment">
          <FInput placeholder="e.g. Daikin 1.5T – Bedroom" value={form.acUnit} onChange={set('acUnit')} />
        </FRow>
        <FRow label="Date *">
          <FInput type="date" value={form.date} onChange={set('date')} />
        </FRow>
      </div>
 
      <SectionHead title="Gas Usage" />
      <div className="ap-hr-modals-31">
        <FRow label="Gas Type *">
          <DynamicSelect options={gasTypeList} value={form.gasType} onChange={v => setForm(f => ({
          ...f,
          gasType: v
        }))} onAddOption={v => onAddGasType?.(v)} addLabel="Gas Type" addPlaceholder="e.g. R-290, R-600a…" />
        </FRow>
        <FRow label="Cylinders Used">
          <FInput type="number" placeholder="1" value={form.cylindersUsed} onChange={set('cylindersUsed')} />
        </FRow>
        <FRow label="Kg Used (Approx) *">
          <FInput type="number" placeholder="0.8" step="0.1" value={form.kgUsed} onChange={set('kgUsed')} />
        </FRow>
        <FRow label="Kg Recovered">
          <FInput type="number" placeholder="0.0" step="0.1" value={form.kgRecovered} onChange={set('kgRecovered')} />
        </FRow>
        <FRow label="Kg Remaining in Cylinder">
          <FInput type="number" placeholder="5.2" step="0.1" value={form.kgRemaining} onChange={set('kgRemaining')} />
        </FRow>
        <FRow label="GWP Value">
          <FInput placeholder="e.g. 675 for R-32" value={form.gwp} onChange={set('gwp')} />
        </FRow>
        <FRow label="Pressure Before (PSI)">
          <FInput type="number" placeholder="e.g. 120" value={form.pressureBefore} onChange={set('pressureBefore')} />
        </FRow>
        <FRow label="Pressure After (PSI)">
          <FInput type="number" placeholder="e.g. 145" value={form.pressureAfter} onChange={set('pressureAfter')} />
        </FRow>
        <FRow label="Reason / Purpose *">
          <DynamicSelect options={gasReasonList} value={form.reason} onChange={v => setForm(f => ({
          ...f,
          reason: v
        }))} onAddOption={v => onAddGasReason?.(v)} addLabel="Reason / Purpose" addPlaceholder="e.g. Warranty claim, Post-repair test…" />
        </FRow>
      </div>
 
      <SectionHead title="Leak Test & Compliance" />
      <div className="ap-hr-modals-32">
        <FRow label="Leak Test Performed">
          <div style={{
          background: leakTestDone ? "var(--xea580c08)" : "var(--bg)",
          border: `1px solid ${leakTestDone ? COLORS.brand + '40' : COLORS.border}`
        }} onClick={() => setLeakTestDone(v => !v)} className="ap-hr-modals-33">
            <input type="checkbox" checked={leakTestDone} onChange={() => setLeakTestDone(v => !v)} className="ap-hr-modals-34" />
            <span style={{
            color: leakTestDone ? "var(--brand)" : "var(--text-body)",
            fontWeight: leakTestDone ? "600" : "400"
          }} className="ap-hr-modals-35">
              {leakTestDone ? 'Yes — leak test done' : 'No leak test'}
            </span>
          </div>
        </FRow>
        {leakTestDone && <FRow label="Leak Test Result">
            <FSelect value={form.leakTestResult} onChange={set('leakTestResult')}>
              <option>Pass</option><option>Fail</option>
            </FSelect>
          </FRow>}
        <FRow label="F-Gas Certification No. *">
          <FInput placeholder="F-Gas Cert #XX-YYYY" value={form.fGasCert} onChange={set('fGasCert')} />
        </FRow>
        <FRow label="Regulation Reference">
          <DynamicSelect options={gasRegulationRefList} value={form.regulation} onChange={v => setForm(f => ({
          ...f,
          regulation: v
        }))} onAddOption={v => onAddGasRegulationRef?.(v)} addLabel="Regulation Reference" addPlaceholder="e.g. Montreal Protocol, Kigali Amendment…" />
        </FRow>
        <FRow label="Disposal Method">
          <DynamicSelect options={gasDisposalMethodList} value={form.disposal} onChange={v => setForm(f => ({
          ...f,
          disposal: v
        }))} onAddOption={v => onAddGasDisposalMethod?.(v)} addLabel="Disposal Method" addPlaceholder="e.g. Sent to authorized recycler…" />
        </FRow>
        <FRow label="Supervisor Sign-off">
          <FInput placeholder="Supervisor name" value={form.supervisorSignoff} onChange={set('supervisorSignoff')} />
        </FRow>
      </div>
 
      <FRow label="Notes (optional)">
        <textarea placeholder="Any additional observations or remarks…" rows={2} value={form.notes} onChange={set('notes')} className="ap-hr-modals-36" />
      </FRow>
 
      <div className="ap-hr-modals-37">
        <span>⚠️</span>
        <span>This log is a compliance record. Ensure the technician holds a valid F-Gas certificate before handling refrigerants.</span>
      </div>
 
      <div className="ap-hr-modals-38">
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Saving…' : 'Save Gas Log'}</FBtn>
      </div>
    </Modal>;
};

// ─── NewTaskModal ─────────────────────────────────────────────────────────────
// Creates a task via crud('tasks').create().
const TASK_CATEGORY_DEFAULTS = ['Service', 'Installation', 'Repair', 'AMC', 'Sales', 'Finance', 'HR', 'Operations', 'Admin'];
const TASK_LABEL_DEFAULTS = ['Urgent Follow-up', 'Customer Complaint', 'AMC Related', 'Internal', 'Revenue Critical'];
export const NewTaskModal = ({
  open,
  onClose,
  onSave,
  taskCategories: taskCategoryOptions = [],
  onAddTaskCategory,
  taskLabels: taskLabelOptions = [],
  onAddTaskLabel
}) => {
  const taskCategoryList = taskCategoryOptions.length ? taskCategoryOptions : TASK_CATEGORY_DEFAULTS;
  const taskLabelList = taskLabelOptions.length ? taskLabelOptions : TASK_LABEL_DEFAULTS;
  const [showOtherDetails, setShowOtherDetails] = useState(true);
  const [makePrivate, setMakePrivate] = useState(false);
  const [billable, setBillable] = useState(false);
  const [timeEstimate, setTimeEstimate] = useState(false);
  const [dependent, setDependent] = useState(false);
  const [withoutDueDate, setWithoutDueDate] = useState(false);
  const [fileName, setFileName] = useState('');
  const [files, setFiles] = useState([]);
  const [liveTechs, setLiveTechs] = useState([]);
  const [liveJobs, setLiveJobs] = useState([]);
  const [form, setForm] = useState({
    title: '',
    category: '',
    linkedJob: '',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    status: 'todo',
    assignedTo: 'Admin',
    description: '',
    label: '',
    milestone: '',
    priority: 'normal',
    estHours: '',
    estMinutes: '',
    dependsOn: '',
    billableCustomer: '',
    billableAmount: ''
  });
  useEffect(() => {
    if (!open) return;
    techsApi.list({ limit: 200 }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
    jobsApi.list({ limit: 200 }).then(r => setLiveJobs(r.data ?? [])).catch(() => {});
  }, [open]);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const {
    loading,
    error,
    submit
  } = useModalForm(payload => import('../../services/api').then(m => m.crud('tasks').create(payload)), onSave, onClose);
  const handleSave = () => {
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }
    submit({
      ...form,
      withoutDueDate,
      makePrivate,
      billable,
      timeEstimate,
      dependent
    });
  };
  if (!open) return null;
  return <Modal open={open} onClose={onClose} title="✅ New Task" width={700}>
      <ErrorBanner message={error} />
 
      <div className="ntm-section-label">Task Info</div>
 
      <div className="ap-hr-modals-39">
        <FRow label={<>Title <span className="ap-hr-modals-40">*</span></>}>
          <FInput placeholder="Enter a task title" value={form.title} onChange={set('title')} />
        </FRow>
        <FRow label="Task Category">
          <DynamicSelect options={taskCategoryList} value={form.category} onChange={v => setForm(f => ({
          ...f,
          category: v
        }))} onAddOption={v => onAddTaskCategory?.(v)} addLabel="Task Category" addPlaceholder="e.g. Marketing, Compliance…" />
        </FRow>
      </div>
 
      <FRow label="Linked Job / Project">
        <FSelect value={form.linkedJob} onChange={set('linkedJob')}>
          <option value="">-- None --</option>
          {liveJobs.map(j => <option key={j._id} value={j._id}>
    {j.jobId || j._id} – {typeof j.customer === 'object' ? j.customer?.name : j.customer}
  </option>)}
        </FSelect>
      </FRow>
 
      {withoutDueDate ? <div className="ap-hr-modals-41">
          <FRow label={<>Start Date <span className="ap-hr-modals-42">*</span></>}>
            <FInput type="date" value={form.startDate} onChange={set('startDate')} />
          </FRow>
          <div className="ap-hr-modals-43">
            <input type="checkbox" id="ntm-nodate" checked={withoutDueDate} onChange={e => setWithoutDueDate(e.target.checked)} className="ap-hr-modals-44" />
            <label htmlFor="ntm-nodate" className="ap-hr-modals-45">
              Without Due Date
            </label>
          </div>
          <FRow label="Status">
            <FSelect value={form.status} onChange={set('status')}>
              <option value="todo">🔵 To Do</option>
              <option value="in_progress">🟡 In Progress</option>
              <option value="done">🟢 Done</option>
            </FSelect>
          </FRow>
        </div> : <div className="ap-hr-modals-46">
          <FRow label={<>Start Date <span className="ap-hr-modals-47">*</span></>}>
            <FInput type="date" value={form.startDate} onChange={set('startDate')} />
          </FRow>
          <FRow label={<>Due Date <span className="ap-hr-modals-48">*</span></>}>
            <FInput type="date" value={form.dueDate} onChange={set('dueDate')} />
          </FRow>
          <div className="ap-hr-modals-49">
            <div className="ap-hr-modals-50">
              <input type="checkbox" id="ntm-nodate" checked={withoutDueDate} onChange={e => setWithoutDueDate(e.target.checked)} className="ap-hr-modals-51" />
              <label htmlFor="ntm-nodate" className="ap-hr-modals-52">Without Due Date</label>
            </div>
          </div>
          <FRow label="Status">
            <FSelect value={form.status} onChange={set('status')}>
              <option value="todo">🔵 To Do</option>
              <option value="in_progress">🟡 In Progress</option>
              <option value="done">🟢 Done</option>
            </FSelect>
          </FRow>
        </div>}
 
      <FRow label="Assigned To">
        <FSelect value={form.assignedTo} onChange={set('assignedTo')}>
          <option>Admin</option>
          {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </FSelect>
      </FRow>
 
      <FRow label="Description">
        <RichTextFileEditor placeholder="Describe what needs to be done…" minHeight={110} files={files} setFiles={setFiles} onChange={val => setForm(f => ({
        ...f,
        description: val
      }))} />
      </FRow>
 
      <SectionDivider label="Other Details" open={showOtherDetails} onToggle={() => setShowOtherDetails(o => !o)} />
 
      {showOtherDetails && <>
          <div className="ap-hr-modals-53">
            <FRow label="Label">
              <DynamicSelect options={taskLabelList} value={form.label} onChange={v => setForm(f => ({
            ...f,
            label: v
          }))} onAddOption={v => onAddTaskLabel?.(v)} addLabel="Label" addPlaceholder="e.g. Escalated, Warranty Claim…" />
            </FRow>
            <FRow label="Milestone">
              <FSelect value={form.milestone} onChange={set('milestone')}>
                {['', 'Q1 2026', 'Q2 2026', 'AMC Season', 'Summer Peak'].map(m => <option key={m} value={m}>{m || '--'}</option>)}
              </FSelect>
            </FRow>
            <FRow label="Priority">
              <FSelect value={form.priority} onChange={set('priority')}>
                <option value="normal">🔵 Normal</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="low">🟢 Low</option>
              </FSelect>
            </FRow>
          </div>
 
          {timeEstimate && <div className="ap-hr-modals-54">
              <FRow label="Estimated Hours"><FInput type="number" placeholder="2" value={form.estHours} onChange={set('estHours')} /></FRow>
              <FRow label="Estimated Minutes"><FInput type="number" placeholder="30" min="0" max="59" value={form.estMinutes} onChange={set('estMinutes')} /></FRow>
            </div>}
 
          <div className="ap-hr-modals-55">
            <CheckRow checked={makePrivate} onChange={e => setMakePrivate(e.target.checked)} label="Make Private" hint="Only visible to you and admins" />
            <CheckRow checked={billable} onChange={e => setBillable(e.target.checked)} label="Billable" hint="Link this task to a customer invoice" />
            <CheckRow checked={timeEstimate} onChange={e => setTimeEstimate(e.target.checked)} label="Time Estimate" hint="Set expected hours for this task" />
            <CheckRow checked={dependent} onChange={e => setDependent(e.target.checked)} label="Dependent on another task" hint="This task cannot start until another is done" />
          </div>
 
          {dependent && <FRow label="Depends On">
              <FSelect value={form.dependsOn} onChange={set('dependsOn')}>
                <option value="">-- Select task --</option>
                <option>TSK-041 – Follow up with Gas renewal</option>
                <option>TSK-040 – Process February salary</option>
                <option>TSK-039 – Order R-32 refrigerant</option>
              </FSelect>
            </FRow>}
 
          {billable && <div className="ap-hr-modals-56">
              <FRow label="Linked Invoice / Customer">
                <FSelect value={form.billableCustomer} onChange={set('billableCustomer')}>
                  <option value="">-- Select --</option>
                  {['Sharma Residency', 'Sunrise Hotel', 'TechPark Ltd.', 'City Mall'].map(c => <option key={c}>{c}</option>)}
                </FSelect>
              </FRow>
              <FRow label="Billable Amount (₹)">
                <FInput type="number" placeholder="500" value={form.billableAmount} onChange={set('billableAmount')} />
              </FRow>
            </div>}
 
          <FRow label="Add File">
            <div onClick={() => document.getElementById('ntm-file-input').click()} onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.brand} onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border} className="ap-hr-modals-57">
              <div className="ap-hr-modals-58">📎</div>
              <div className="ap-hr-modals-59">
                {fileName || 'Click to choose a file — PDF, image, or document'}
              </div>
              <input id="ntm-file-input" type="file" onChange={e => setFileName(e.target.files?.[0]?.name || '')} className="ap-hr-modals-60" />
            </div>
          </FRow>
        </>}
 
      <div className="ap-hr-modals-61">
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <button onClick={onClose} className="ap-hr-modals-62">
          💾 Save &amp; Add More
        </button>
        <FBtn onClick={handleSave} disabled={loading}>{loading ? 'Saving…' : '✓ Save'}</FBtn>
      </div>
    </Modal>;
};

// ─── Sparkline ────────────────────────────────────────────────────────────────
const Sparkline = ({
  data,
  color = '#EA580C'
}) => {
  const w = 340,
    h = 60,
    pad = 6;
  const min = Math.min(...data),
    max = Math.max(...data);
  const pts = data.map((v, i) => ({
    x: pad + i / (data.length - 1) * (w - pad * 2),
    y: h - pad - (v - min) / (max - min || 1) * (h - pad * 2)
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;
  return <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="ap-hr-modals-63">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />)}
    </svg>;
};

// ─── Gauge ────────────────────────────────────────────────────────────────────
const Gauge = ({
  pct,
  color = '#EA580C'
}) => {
  const r = 42,
    cx = 55,
    cy = 55,
    circ = 2 * Math.PI * r;
  const dash = Math.min(pct, 100) / 100 * circ;
  return <svg width={110} height={110} viewBox="0 0 110 110">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth={11} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4} transform={`rotate(-90 ${cx} ${cy})`} className="ap-hr-modals-64" />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize={16} fontWeight={700} fontFamily={FONTS.mono}>{pct}%</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill={COLORS.faint} fontSize={9} fontFamily={FONTS.sans}>of target</text>
    </svg>;
};

// ─── BarRow ───────────────────────────────────────────────────────────────────
const BarRow = ({
  label,
  value,
  max,
  displayVal,
  color
}) => <div>
    <div className="ap-hr-modals-65">
      <span>{label}</span><span style={{
      color
    }} className="ap-hr-modals-66">{displayVal}</span>
    </div>
    <div className="ap-hr-modals-67">
      <div style={{
      width: `${Math.min(value / max * 100, 100)}%`,
      background: color
    }} className="ap-hr-modals-68" />
    </div>
  </div>;

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  badge,
  badgeColor = '#16A34A',
  badgeBg = '#F0FDF4'
}) => <div className="ap-hr-modals-69">
    <div className="ap-hr-modals-70">{label}</div>
    <div className="ap-hr-modals-71">{value}</div>
    {badge && <div style={{
    background: badgeBg,
    color: badgeColor
  }} className="ap-hr-modals-72">
        {badge}
      </div>}
  </div>;

// ─── ScorecardModal ───────────────────────────────────────────────────────────
// Read-only modal — no CRUD needed. Displays data passed in via `tech` prop.
// PDF export handled by PDFPreview (existing).
// export const ScorecardModal = ({ tech, onClose, salaries = [] }) => {
//   const [tab,     setTab]     = useState('overview');
//   const [pdfOpen, setPdfOpen] = useState(false);

//   const salaryRow  = salaries.find(s => s.techId === tech?.techId) || {};
//   const pct        = tech?.target ? Math.round((tech.jobsDone / tech.target) * 100) : 0;
//   const perfColor  = pct >= 100 ? '#16A34A' : pct >= 85 ? '#B45309' : '#DC2626';
//   const TREND_MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
//   const trendData  = tech?.trend || [22, 25, 28, 26, tech?.jobsDone ?? 0];
//   const pdfData    = { ...(tech ?? {}), ...salaryRow, trend: trendData };

//   if (!tech) return null;
//   return (
//     <>
//       <div
//         onClick={onClose}
//         style={{ position: 'fixed', inset: 0, background: 'rgba(15,15,15,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
//       >
//         <div
//           onClick={e => e.stopPropagation()}
//           style={{ width: 640, height: '90vh', background: COLORS.white, borderRadius: 18, border: `1px solid ${COLORS.border}`, overflow: 'scroll', scrollbarWidth: 'none', boxShadow: '0 24px 80px rgba(0,0,0,0.22)', animation: 'scSlideIn 0.25s cubic-bezier(.4,0,.2,1)' }}
//         >
//           {/* Hero header */}
//           <div style={{ background: '#18181B', padding: '22px 24px 0', position: 'relative', overflow: 'hidden' }}>
//             <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(45deg,#EA580C,#EA580C 2px,transparent 2px,transparent 16px)', pointerEvents: 'none' }} />
//             <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

//             <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(234,88,12,0.18)', border: '1px solid rgba(234,88,12,0.35)', borderRadius: 6, padding: '3px 10px', marginBottom: 14, fontSize: 11, fontWeight: 700, color: '#FB923C' }}>
//               ★ #{tech.rank} Top Performer · February 2026
//             </div>

//             <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
//               <div style={{ width: 52, height: 52, borderRadius: 13, background: 'linear-gradient(135deg,#EA580C,#C2410C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
//                 {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
//               </div>
//               <div>
//                 <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{tech.name}</div>
//                 <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Senior Technician · Zone A</div>
//               </div>
//               <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
//                 <div style={{ fontSize: 28, fontWeight: 800, color: '#EA580C', fontFamily: FONTS.mono }}>{pct}%</div>
//                 <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>of target</div>
//               </div>
//             </div>

//             <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 18 }}>
//               {[['overview','Overview'],['trend','Trend'],['details','Details']].map(([k, l]) => (
//                 <button key={k} onClick={() => setTab(k)}
//                   style={{ padding: '10px 18px', fontSize: 12, fontWeight: 700, color: tab === k ? '#EA580C' : 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === k ? '#EA580C' : 'transparent'}`, cursor: 'pointer' }}>
//                   {l}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Body */}
//           <div style={{ padding: '20px 24px' }}>
//             {tab === 'overview' && (
//               <>
//                 <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
//                   <Gauge pct={pct} color={perfColor} />
//                   <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
//                     <BarRow label="Jobs completed"        value={tech.jobsDone}            max={tech.target} displayVal={`${tech.jobsDone} / ${tech.target}`} color={perfColor} />
//                     <BarRow label="On-time delivery"      value={tech.onTime}              max={100}         displayVal={`${tech.onTime}%`}                   color="#16A34A"  />
//                     <BarRow label="Customer satisfaction" value={(tech.rating / 5) * 100}  max={100}         displayVal={`${tech.rating} / 5.0★`}             color="#F59E0B"  />
//                   </div>
//                 </div>
//                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
//                   <StatCard label="Rating"     value={`${tech.rating}★`}                       badge="Above avg"   badgeColor="#B45309" badgeBg="#FFFBEB" />
//                   <StatCard label="On-time"    value={`${tech.onTime}%`}                        badge="+5% vs avg" />
//                   <StatCard label="Complaints" value={tech.complaints}                          badge={tech.complaints === 0 ? 'Clean ✓' : `${tech.complaints} flagged`} badgeColor={tech.complaints === 0 ? '#16A34A' : '#DC2626'} badgeBg={tech.complaints === 0 ? '#F0FDF4' : '#FEF2F2'} />
//                   <StatCard label="Revenue"    value={`₹${(tech.revenue / 1000).toFixed(0)}K`} badge="35% share"  badgeColor={COLORS.brand} badgeBg={COLORS.brandL} />
//                 </div>
//               </>
//             )}

//             {tab === 'trend' && (
//               <>
//                 <div style={{ marginBottom: 12 }}>
//                   <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.h1, marginBottom: 4 }}>Jobs completed — 5 month trend</div>
//                   <div style={{ fontSize: 11, color: COLORS.muted }}>Oct 2025 – Feb 2026</div>
//                 </div>
//                 <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '16px 16px 10px' }}>
//                   <Sparkline data={trendData} color="#EA580C" />
//                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
//                     {TREND_MONTHS.map((m, i) => (
//                       <div key={m} style={{ textAlign: 'center', flex: 1 }}>
//                         <div style={{ fontSize: 10, color: COLORS.faint }}>{m}</div>
//                         <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.h2 }}>{trendData[i]}</div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//                 <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
//                   <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 14px' }}>
//                     <div style={{ fontSize: 10, color: COLORS.faint, marginBottom: 4 }}>Peak month</div>
//                     <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>{TREND_MONTHS[trendData.indexOf(Math.max(...trendData))]}</div>
//                     <div style={{ fontSize: 12, color: COLORS.muted }}>{Math.max(...trendData)} jobs completed</div>
//                   </div>
//                   <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 14px' }}>
//                     <div style={{ fontSize: 10, color: COLORS.faint, marginBottom: 4 }}>5-month average</div>
//                     <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.h1 }}>{Math.round(trendData.reduce((a, b) => a + b, 0) / trendData.length)} jobs</div>
//                     <div style={{ fontSize: 12, color: COLORS.muted }}>per month</div>
//                   </div>
//                 </div>
//               </>
//             )}

//             {tab === 'details' && (
//               <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//                 {[
//                   ['Technician ID',    tech.techId || 'TECH-001'],
//                   ['Department',       'Field Operations'],
//                   ['Zone',             'Zone A – North Ahmedabad'],
//                   ['Period',           'February 2026'],
//                   ['Total Revenue',    `₹${tech.revenue?.toLocaleString()}`],
//                   ['Incentive Earned', `₹${(salaryRow.incentive || 0).toLocaleString()}`],
//                   ['Complaint Record', tech.complaints === 0 ? '✓ Clean – No complaints' : `${tech.complaints} complaint(s)`],
//                   ['Rank',             `#${tech.rank} of 5 technicians`],
//                 ].map(([k, v]) => (
//                   <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
//                     <span style={{ fontSize: 12, color: COLORS.muted }}>{k}</span>
//                     <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.h2 }}>{v}</span>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Footer */}
//           <div style={{ padding: '14px 24px', borderTop: `1px solid ${COLORS.border}`, background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'end' }}>
//             <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.muted, cursor: 'pointer' }}>
//               Cancel
//             </button>
//             <button
//               onClick={() => setPdfOpen(true)}
//               style={{ padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg,#EA580C,#C2410C)', border: 'none', color: '#fff', cursor: 'pointer' }}
//             >
//               ⬇ Download PDF
//             </button>
//           </div>
//         </div>
//       </div>

//       <PDFPreview
//         open={pdfOpen}
//         onClose={() => setPdfOpen(false)}
//         template="scorecard"
//         data={pdfData}
//         title={`${tech.name} – Scorecard`}
//         filename={`cooltech-scorecard-${tech.name.toLowerCase().replace(/\s+/g, '-')}-feb2026`}
//       />

//       <style>{`
//         @keyframes scSlideIn {
//           from { opacity: 0; transform: translateY(16px) scale(0.97); }
//           to   { opacity: 1; transform: translateY(0) scale(1); }
//         }
//       `}</style>
//     </>
//   );
// };

export const ScorecardModal = ({
  tech,
  period,
  totalTechs,
  onClose
}) => {
  const [tab, setTab] = useState('overview');
  const [pdfOpen, setPdfOpen] = useState(false);
  const pct = tech?.pct ?? 0;
  const perfColor = pct >= 100 ? '#16A34A' : pct >= 85 ? '#B45309' : '#DC2626';

  // Real history, not simulated. Falls back to a single current-period point
  // if there isn't enough salary history yet.
  const trendMonths = tech?.months?.length ? tech.months : [period || '—'];
  const trendData = tech?.values?.length ? tech.values : [tech?.jobsDone ?? 0];
  const pdfData = {
    ...(tech ?? {}),
    period,
    trendMonths,
    trendData
  };
  if (!tech) return null;
  return <>
      <div onClick={onClose} className="ap-hr-modals-73">
        <div onClick={e => e.stopPropagation()} className="ap-hr-modals-74">
          {/* Hero header */}
          <div className="ap-hr-modals-75">
            <div className="ap-hr-modals-76" />
            <button onClick={onClose} className="ap-hr-modals-77">✕</button>
 
            <div className="ap-hr-modals-78">
              ★ #{tech.rank} of {totalTechs} · {period || 'This period'}
            </div>
 
            <div className="ap-hr-modals-79">
              <div className="ap-hr-modals-80">
                {tech.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="ap-hr-modals-81">{tech.name}</div>
                <div className="ap-hr-modals-82">{tech.role || 'Technician'}{tech.area ? ` · ${tech.area}` : ''}</div>
              </div>
              <div className="ap-hr-modals-83">
                <div className="ap-hr-modals-84">{tech.target ? `${pct}%` : '—'}</div>
                <div className="ap-hr-modals-85">{tech.target ? 'of target' : 'no target set'}</div>
              </div>
            </div>
 
            <div className="ap-hr-modals-86">
              {[['overview', 'Overview'], ['trend', 'Trend'], ['details', 'Details']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} style={{
              color: tab === k ? "var(--brand)" : "rgba(255,255,255,0.35)",
              borderBottom: `2px solid ${tab === k ? '#EA580C' : 'transparent'}`
            }} className="ap-hr-modals-87">
                  {l}
                </button>)}
            </div>
          </div>
 
          {/* Body */}
          <div className="ap-hr-modals-88">
            {tab === 'overview' && <>
                <div className="ap-hr-modals-89">
                  <Gauge pct={pct} color={perfColor} />
                  <div className="ap-hr-modals-90">
                    <BarRow label="Jobs completed" value={tech.jobsDone} max={tech.target || tech.jobsDone || 1} displayVal={tech.target ? `${tech.jobsDone} / ${tech.target}` : `${tech.jobsDone}`} color={perfColor} />
                    <BarRow label="Days present" value={tech.presentDays} max={30} displayVal={`${tech.presentDays} / 30`} color="#16A34A" />
                    <BarRow label="Customer rating" value={tech.rating / 5 * 100} max={100} displayVal={`${tech.rating.toFixed(1)} / 5.0★`} color="#F59E0B" />
                  </div>
                </div>
                <div className="ap-hr-modals-91">
                  <StatCard label="Rating" value={`${tech.rating.toFixed(1)}★`} />
                  <StatCard label="Present Days" value={tech.presentDays} />
                  <StatCard label="Incentive" value={`₹${(tech.incentive / 1000).toFixed(1)}K`} badgeColor="#16A34A" badgeBg="#F0FDF4" badge={tech.status === 'paid' ? 'Paid' : 'Pending'} />
                  <StatCard label="Net Pay" value={`₹${(tech.net / 1000).toFixed(1)}K`} badgeColor={COLORS.brand} badgeBg={COLORS.brandL} />
                </div>
              </>}
 
            {tab === 'trend' && <>
                <div className="ap-hr-modals-92">
                  <div className="ap-hr-modals-93">Jobs completed — history</div>
                  <div className="ap-hr-modals-94">{trendMonths[0]} – {trendMonths[trendMonths.length - 1]}</div>
                </div>
                {trendData.length < 2 ? <div className="ap-hr-modals-95">
                    Not enough payroll history yet to chart a trend for this technician.
                  </div> : <>
                    <div className="ap-hr-modals-96">
                      <Sparkline data={trendData} color="#EA580C" />
                      <div className="ap-hr-modals-97">
                        {trendMonths.map((m, i) => <div key={m} className="ap-hr-modals-98">
                            <div className="ap-hr-modals-99">{m}</div>
                            <div className="ap-hr-modals-100">{trendData[i]}</div>
                          </div>)}
                      </div>
                    </div>
                    <div className="ap-hr-modals-101">
                      <div className="ap-hr-modals-102">
                        <div className="ap-hr-modals-103">Peak month</div>
                        <div className="ap-hr-modals-104">{trendMonths[trendData.indexOf(Math.max(...trendData))]}</div>
                        <div className="ap-hr-modals-105">{Math.max(...trendData)} jobs completed</div>
                      </div>
                      <div className="ap-hr-modals-106">
                        <div className="ap-hr-modals-107">Average</div>
                        <div className="ap-hr-modals-108">{Math.round(trendData.reduce((a, b) => a + b, 0) / trendData.length)} jobs</div>
                        <div className="ap-hr-modals-109">per month</div>
                      </div>
                    </div>
                  </>}
              </>}
 
            {tab === 'details' && <div className="ap-hr-modals-110">
                {[['Technician ID', tech.techId || '—'], ['Role', tech.role || 'Technician'], ['Area', tech.area || '—'], ['Period', period || '—'], ['Net Pay', `₹${(tech.net || 0).toLocaleString()}`], ['Incentive Earned', `₹${(tech.incentive || 0).toLocaleString()}`], ['Payroll Status', tech.status === 'paid' ? '✓ Paid' : '⏳ Pending'], ['Rank', `#${tech.rank} of ${totalTechs} technicians`]].map(([k, v]) => <div key={k} className="ap-hr-modals-111">
                    <span className="ap-hr-modals-112">{k}</span>
                    <span className="ap-hr-modals-113">{v}</span>
                  </div>)}
              </div>}
          </div>
 
          {/* Footer */}
          <div className="ap-hr-modals-114">
            <button onClick={onClose} className="ap-hr-modals-115">
              Cancel
            </button>
            <button onClick={() => setPdfOpen(true)} className="ap-hr-modals-116">
              ⬇ Download PDF
            </button>
          </div>
        </div>
      </div>
 
      <PDFPreview open={pdfOpen} onClose={() => setPdfOpen(false)} template="scorecard" data={pdfData} title={`${tech.name} – Scorecard`} filename={`cooltech-scorecard-${tech.name.toLowerCase().replace(/\s+/g, '-')}-${(period || '').toLowerCase().replace(/\s+/g, '')}`} />
 
      <style>{`
        @keyframes scSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>;
};

// ─── LogTimeModal ─────────────────────────────────────────────────────────────
const ACTIVITY_TYPE_DEFAULTS = ['Service', 'Installation', 'Repair', 'AMC', 'Gas Refill', 'Training', 'Admin', 'Travel', 'Other'];
export const LogTimeModal = ({
  open,
  onClose,
  onSave,
  activityTypes: activityTypeOptions = [],
  onAddActivityType
}) => {
  const activityTypeList = activityTypeOptions.length ? activityTypeOptions : ACTIVITY_TYPE_DEFAULTS;
  const [liveTechs, setLiveTechs] = useState([]);
  const [liveJobs, setLiveJobs] = useState([]);
  const [form, setForm] = useState({
    technician: '',
    job: '',
    type: 'Service',
    customer: '',
    date: new Date().toISOString().slice(0, 10),
    start: '09:00',
    end: '10:00',
    billable: false,
    notes: ''
  });
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  useEffect(() => {
    if (!open) return;
    techsApi.list().then(r => setLiveTechs(r?.data || [])).catch(() => setLiveTechs([]));
    jobsApi.list().then(r => setLiveJobs(r?.data || [])).catch(() => setLiveJobs([]));
  }, [open]);

  // Auto-calculate hours from start/end
  const calcHrs = () => {
    const [sh, sm] = form.start.split(':').map(Number);
    const [eh, em] = form.end.split(':').map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    return diff > 0 ? +(diff / 60).toFixed(2) : 0;
  };
  const hrs = calcHrs();
  const {
    loading,
    error,
    submit
  } = useModalForm(payload => timelogsApi.create(payload), onSave, onClose);
  const handleSave = () => {
    if (!form.technician) {
      alert('Technician is required');
      return;
    }
    if (!form.date) {
      alert('Date is required');
      return;
    }
    if (hrs <= 0) {
      alert('End time must be after start time');
      return;
    }
    submit({
      ...form,
      hrs
    });
  };
  if (!open) return null;
  return <Modal open={open} onClose={onClose} title="⏱ Log Time" width={520}>
      <ErrorBanner message={error} />

      <SectionHead title="Who & What" />
      <div className="ap-hr-modals-117">
        <FRow label="Technician *">
          <FSelect value={form.technician} onChange={set('technician')}>
            <option value="">Select…</option>
            {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Activity Type">
          <DynamicSelect options={activityTypeList} value={form.type} onChange={v => setForm(f => ({
          ...f,
          type: v
        }))} onAddOption={v => onAddActivityType?.(v)} addLabel="Activity Type" addPlaceholder="e.g. Inspection, Site Survey…" />
        </FRow>
        <FRow label="Linked Job">
          <FSelect value={form.job} onChange={set('job')}>
            <option value="">— None —</option>
            {liveJobs.map(j => <option key={j._id} value={j._id}>
    {j.jobId || j._id} – {typeof j.customer === 'object' ? j.customer?.name : j.customer}
  </option>)}
          </FSelect>
        </FRow>
        <FRow label="Customer">
          <FInput placeholder="Auto-fill or enter manually" value={form.customer} onChange={set('customer')} />
        </FRow>
      </div>

      <SectionHead title="When" />
      <div className="ap-hr-modals-118">
        <FRow label="Date *">
          <FInput type="date" value={form.date} onChange={set('date')} />
        </FRow>
        <FRow label="Start Time *">
          <FInput type="time" value={form.start} onChange={set('start')} />
        </FRow>
        <FRow label="End Time *">
          <FInput type="time" value={form.end} onChange={set('end')} />
        </FRow>
      </div>

      {/* Live hours preview */}
      {hrs > 0 && <div className="ap-hr-modals-119">
          Duration: <strong>{hrs.toFixed(1)} hour{hrs !== 1 ? 's' : ''}</strong>
        </div>}
      {hrs <= 0 && form.start && form.end && <div className="ap-hr-modals-120">
          ⚠️ End time must be after start time
        </div>}

      <div className="ap-hr-modals-121">
        <FRow label="Billable">
          <div onClick={() => setForm(f => ({
          ...f,
          billable: !f.billable
        }))} style={{
          background: form.billable ? "var(--xea580c08)" : "var(--bg)",
          border: `1px solid ${form.billable ? COLORS.brand + '40' : COLORS.border}`
        }} className="ap-hr-modals-122">
            <input type="checkbox" checked={form.billable} onChange={() => {}} className="ap-hr-modals-123" />
            <span style={{
            color: form.billable ? "var(--brand)" : "var(--text-body)",
            fontWeight: form.billable ? "600" : "400"
          }} className="ap-hr-modals-124">
              {form.billable ? '✓ Billable entry' : 'Non-billable'}
            </span>
          </div>
        </FRow>
        <FRow label="Notes">
          <FInput placeholder="Optional notes…" value={form.notes} onChange={set('notes')} />
        </FRow>
      </div>

      <div className="ap-hr-modals-125">
        <FBtn secondary onClick={onClose} disabled={loading}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={loading || hrs <= 0}>
          {loading ? 'Saving…' : '⏱ Log Time'}
        </FBtn>
      </div>
    </Modal>;
};