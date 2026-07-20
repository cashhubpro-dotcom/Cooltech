import React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { COLORS, FONTS } from "../../constants/tokens";
import Modal from "../ui/Modal";
import { FRow, FInput, FSelect, FTextarea, FBtn } from "../ui/Form";
import { Avatar } from "../ui/Badges";
import AddressFields from "./AddressFields";
import RichTextFileEditor from "./RichTextFileEditor";
import RichTextEditorNoFile from "../ui/RichTextEditorNoFile";
import { TECHNICIANS as technicians, customers, invoices, jobs } from "../../data/mockData";
import { jobsApi, customersApi, techsApi, invoicesApi, expensesApi, complaintsApi, inventoryApi, noticesApi , suppliersApi} from '../../services/api';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Section heading inside modal ────────────────────────────────────────────
const SectionHead = ({
  title
}) => <div className="ap-modals-1">
    {title}
  </div>;
const lbl = {
  display: "block",
  fontSize: 10,
  fontWeight: 700,
  color: COLORS.faint,
  letterSpacing: "0.06em",
  marginBottom: 6
};

// ─── NewTicketModal ───────────────────────────────────────────────────────────
// const NewTicketModal = ({ open, onClose, onSave }) => {
//   const [files, setFiles] = useState([]);
//   const [autoCreateJob, setAutoCreateJob] = useState(false);
//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title="🎫 New Support Ticket"
//       width={640}
//     >
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//         <FRow label="Customer *">
//           <FSelect>
//             <option value="">Select customer…</option>
//             <option>Sharma Residency</option>
//             <option>TechPark Ltd.</option>
//             <option>Galaxy Towers</option>
//             <option>Sunrise Hotel</option>
//             <option>Meera Iyer</option>
//             <option>City Mall</option>
//             <option>Patel Villa</option>
//           </FSelect>
//         </FRow>
//         <FRow label="Contact Person">
//           <FInput placeholder="Auto-fills from customer" />
//         </FRow>
//       </div>
//       <FRow label="Subject *">
//         <FInput placeholder="Brief description of the issue…" />
//       </FRow>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//         <FRow label="Issue Type *">
//           <FSelect>
//             <option value="">Select type…</option>
//             <option>Not Cooling</option>
//             <option>Water Leakage</option>
//             <option>Strange Noise</option>
//             <option>Not Turning On</option>
//             <option>Remote / Controls Issue</option>
//             <option>Gas Leak / Smell</option>
//             <option>Error Code on Display</option>
//             <option>AMC Scheduled Visit</option>
//             <option>Installation Request</option>
//             <option>Other</option>
//           </FSelect>
//         </FRow>
//         <FRow label="Priority *">
//           <FSelect defaultValue="Medium">
//             <option>Low</option>
//             <option>Medium</option>
//             <option>High</option>
//             <option>Critical</option>
//           </FSelect>
//         </FRow>
//         <FRow label="AC Unit / Model">
//           <FInput placeholder="e.g. Daikin 1.5T Inverter" />
//         </FRow>
//         <FRow label="Location / Site">
//           <FInput placeholder="Floor, room or address" />
//         </FRow>
//         <FRow label="Assign Technician">
//           <FSelect>
//             <option>Unassigned</option>
//             {technicians.map((t) => (
//               <option key={t.id}>{t.name}</option>
//             ))}
//           </FSelect>
//         </FRow>
//         <FRow label="SLA / Response Time">
//           <FSelect defaultValue="12 hrs">
//             <option>4 hrs</option>
//             <option>12 hrs</option>
//             <option>24 hrs</option>
//             <option>48 hrs</option>
//           </FSelect>
//         </FRow>
//         <FRow label="Channel">
//           <FSelect>
//             <option>Phone Call</option>
//             <option>WhatsApp</option>
//             <option>Email</option>
//             <option>Walk-in</option>
//             <option>App / Portal</option>
//           </FSelect>
//         </FRow>
//         <FRow label="Linked Job / AMC">
//           <FInput placeholder="e.g. JOB-1042 or AMC-007" />
//         </FRow>
//       </div>
//       <FRow label="Description">
//         <RichTextFileEditor
//           placeholder="Detailed problem description, observations, error codes, when issue started…"
//           files={files}
//           setFiles={setFiles}
//         />
//       </FRow>
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: 10,
//           padding: "10px 14px",
//           borderRadius: 8,
//           background: COLORS.bg,
//           border: `1px solid ${COLORS.border}`,
//           marginTop: 4,
//         }}
//       >
//         <input
//           type="checkbox"
//           id="autoJob"
//           checked={autoCreateJob}
//           onChange={(e) => setAutoCreateJob(e.target.checked)}
//           style={{
//             width: 15,
//             height: 15,
//             cursor: "pointer",
//             accentColor: COLORS.brand,
//           }}
//         />
//         <label
//           htmlFor="autoJob"
//           style={{
//             fontSize: 13,
//             color: COLORS.h2,
//             cursor: "pointer",
//             fontFamily: FONTS.sans,
//           }}
//         >
//           Auto-create a work order from this ticket on save
//         </label>
//       </div>
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "flex-end",
//           gap: 10,
//           marginTop: 8,
//         }}
//       >
//         <FBtn secondary onClick={onClose}>
//           Cancel
//         </FBtn>
//         <FBtn onClick={() => onSave({})}>Save Ticket</FBtn>
//       </div>
//     </Modal>
//   );
// };

// Shared "Job / Service Type" option set — used by NewJobModal, ConvertToJobModal,
// and NewQuotationModal's Type field. Previously 3 separate hardcoded lists that
// had drifted slightly (NewQuotationModal had "AMC" where the others had
// "AMC Visit"); merged into one superset so all three modals agree on defaults.
const JOB_TYPE_DEFAULTS = ["Service", "Repair", "Installation", "AMC Visit", "Inspection", "AMC"];
const ISSUE_TYPE_TO_CATEGORY = {
  'Not Cooling': 'breakdown',
  'Water Leakage': 'breakdown',
  'Strange Noise': 'breakdown',
  'Not Turning On': 'breakdown',
  'Remote / Controls Issue': 'query',
  'Gas Leak / Smell': 'breakdown',
  'Error Code on Display': 'breakdown',
  'AMC Scheduled Visit': 'scheduling',
  'Installation Request': 'scheduling',
  'Other': 'other'
};
const PRIORITY_TO_ENUM = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'critical'
};
const SLA_OPTIONS = ['4 hrs', '12 hrs', '24 hrs', '48 hrs'];
const NewTicketModal = ({
  open,
  onClose,
  onSave,
  issueTypes: issueTypeOptions = [],
  onAddIssueType,
  channels: channelOptions = [],
  onAddChannel
}) => {
  const issueTypeList = issueTypeOptions.length ? issueTypeOptions : Object.keys(ISSUE_TYPE_TO_CATEGORY);
  const channelList = channelOptions.length ? channelOptions : ['Phone Call', 'WhatsApp', 'Email', 'Walk-in', 'App / Portal'];
  const [files, setFiles] = useState([]);
  const [autoCreateJob, setAutoCreateJob] = useState(false);
  const [liveCustomers, setLiveCustomers] = useState([]);
  const [liveTechs, setLiveTechs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const EMPTY = {
    customer: "",
    customerName: "",
    email: "",
    phone: "",
    address: "",
    subject: "",
    issueType: "",
    priority: "Medium",
    ac: "",
    technician: "",
    techName: "Unassigned",
    sla: "12 hrs",
    channel: "Phone Call",
    linkedJob: "",
    description: ""
  };
  const [form, setForm] = useState(EMPTY);
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setFiles([]);
    setAutoCreateJob(false);
    setError("");
    customersApi.list({
      limit: 200
    }).then(r => setLiveCustomers(r.data ?? [])).catch(() => {});
    techsApi.list({
      limit: 200
    }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
  }, [open]);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));

  // ── Select customer → auto-fill contact, phone, address ──────────────────
  const handleCustomerChange = e => {
    const val = e.target.value;
    const cust = liveCustomers.find(c => c._id === val);
    setForm(f => ({
      ...f,
      customer: val,
      customerName: cust?.name || "",
      email: cust?.email || "",
      // customer schema has no separate "contact person" field — name is the closest match
      phone: cust?.phone || "",
      address: cust?.address || ""
    }));
  };
  const handleTechChange = e => {
    const val = e.target.value;
    if (!val) {
      setForm(f => ({
        ...f,
        technician: "",
        techName: "Unassigned"
      }));
      return;
    }
    const t = liveTechs.find(t => t._id === val);
    setForm(f => ({
      ...f,
      technician: val,
      techName: t?.name || "Unassigned"
    }));
  };
  const handleSave = async () => {
    setError("");
    if (!form.customer) return setError("Please select a customer.");
    if (!form.subject.trim()) return setError("Subject is required.");
    if (!form.issueType) return setError("Please select an issue type.");
    setSaving(true);
    try {
      await onSave({
        customer: form.customer,
        customerName: form.customerName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        subject: form.subject.trim(),
        category: ISSUE_TYPE_TO_CATEGORY[form.issueType] || 'other',
        priority: PRIORITY_TO_ENUM[form.priority] || 'medium',
        ac: form.ac,
        assignedTo: form.techName !== 'Unassigned' ? form.techName : '',
        sla: form.sla,
        channel: form.channel,
        linkedJob: form.linkedJob,
        description: form.description,
        autoCreateJob // ← parent decides what to do with this flag
      });
    } catch (e) {
      setError(e.message || "Failed to create ticket.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="🎫 New Support Ticket" width={640}>
      <div className="ap-modals-2">
        <FRow label="Customer *">
          <FSelect value={form.customer} onChange={handleCustomerChange}>
            <option value="">Select customer…</option>
            {liveCustomers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Email Id">
          <FInput placeholder="Auto-fills from customer" value={form.email} onChange={set("email")} />
        </FRow>
      </div>
      <FRow label="Subject *">
        <FInput placeholder="Brief description of the issue…" value={form.subject} onChange={set("subject")} />
      </FRow>
      <div className="ap-modals-3">
        <FRow label="Issue Type *">
          <DynamicSelect options={issueTypeList} value={form.issueType} onChange={v => setForm(f => ({
          ...f,
          issueType: v
        }))} onAddOption={v => onAddIssueType?.(v)} addLabel="Issue Type" addPlaceholder="e.g. Thermostat Fault, Compressor Noise…" />
        </FRow>
        <FRow label="Priority *">
          <FSelect value={form.priority} onChange={set("priority")}>
            {Object.keys(PRIORITY_TO_ENUM).map(p => <option key={p}>{p}</option>)}
          </FSelect>
        </FRow>
        <FRow label="AC Unit / Model">
          <FInput placeholder="e.g. Daikin 1.5T Inverter" value={form.ac} onChange={set("ac")} />
        </FRow>
        <FRow label="Location / Site">
          <FInput placeholder="Floor, room or address" value={form.address} onChange={set("address")} />
        </FRow>
        <FRow label="Assign Technician">
          <FSelect value={form.technician} onChange={handleTechChange}>
            <option value="">Unassigned</option>
            {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </FSelect>
        </FRow>
        <FRow label="SLA / Response Time">
          <FSelect value={form.sla} onChange={set("sla")}>
            {SLA_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Channel">
          <DynamicSelect options={channelList} value={form.channel} onChange={v => setForm(f => ({
          ...f,
          channel: v
        }))} onAddOption={v => onAddChannel?.(v)} addLabel="Channel" addPlaceholder="e.g. Referral Portal, Social Media…" />
        </FRow>
        <FRow label="Linked Job / AMC">
          <FInput placeholder="e.g. JOB-1042 or AMC-007" value={form.linkedJob} onChange={set("linkedJob")} />
        </FRow>
      </div>
      <FRow label="Description">
        <RichTextFileEditor placeholder="Detailed problem description, observations, error codes, when issue started…" files={files} setFiles={setFiles} onChange={val => setForm(f => ({
        ...f,
        description: val
      }))} />
      </FRow>
      <div className="ap-modals-4">
        <input type="checkbox" id="autoJob" checked={autoCreateJob} onChange={e => setAutoCreateJob(e.target.checked)} className="ap-modals-5" />
        <label htmlFor="autoJob" className="ap-modals-6">
          Auto-create a work order from this ticket on save
        </label>
      </div>

      {error && <div className="ap-modals-7">
          {error}
        </div>}

      <div className="ap-modals-8">
        <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Ticket"}</FBtn>
      </div>
    </Modal>;
};

// ─── Support ticket variable - prefill data ──────────────────────────────────────────────────────────────
const TICKET_TO_JOB_PRIORITY = {
  low: 'normal',
  medium: 'normal',
  high: 'high',
  critical: 'urgent'
};

const TICKET_TO_JOB_PRIORITY_UNUSED = null; // (kept file self-consistent; no-op)

// ─── NewJobModal ──────────────────────────────────────────────────────────────
const NewJobModal = ({
  open,
  onClose,
  onSave,
  prefill,
  jobTypes: jobTypeOptions = [],
  onAddJobType
}) => {
  const jobTypeList = jobTypeOptions.length ? jobTypeOptions : JOB_TYPE_DEFAULTS;
  const [files, setFiles] = useState([]);
  const [liveCustomers, setLiveCustomers] = useState([]);
  const [liveTechs, setLiveTechs] = useState([]);
  const [form, setForm] = useState({
    customer: "",
    customerName: "",
    type: "Service",
    priority: "normal",
    technician: "",
    techName: "Unassigned",
    scheduledDate: "",
    scheduledTime: "10:00",
    ac: "",
    issue: "",
    address: ""
  });

  // Load customers & technicians from backend when modal opens
  useEffect(() => {
    if (!open) return;
    customersApi.list({
      limit: 200
    }).then(r => setLiveCustomers(r.data ?? [])).catch(() => {});
    techsApi.list({
      limit: 200
    }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
  }, [open]);
  useEffect(() => {
    if (!open) return;
    if (prefill) {
      setForm(f => ({
      ...f,
      customer: prefill.customer || "",
      customerName: prefill.customerName || "",
      type: prefill.type || "Repair",
      priority: TICKET_TO_JOB_PRIORITY[prefill.priority] || prefill.priority || "normal",
      issue: prefill.issue || "",
      address: prefill.address || "",
      ac: prefill.ac || ""
      }));
    } else {
      // reset to a clean form when opened without a prefill (e.g. "+ New Job")
      setForm({
        customer: "",
        customerName: "",
        type: "Service",
        priority: "normal",
        technician: "",
        techName: "Unassigned",
        scheduledDate: "",
        scheduledTime: "10:00",
        ac: "",
        issue: "",
        address: ""
      });
    }
  }, [open, prefill]);
  useEffect(() => {
    if (!open || !prefill?.customer || !liveCustomers.length) return;
    const cust = liveCustomers.find(c => c._id === prefill.customer);
    if (cust) {
      setForm(f => ({
        ...f,
        customerName: cust.name || f.customerName,
        address: cust.address || f.address
      }));
    }
  }, [open, prefill, liveCustomers]);
  const set = k => e => {
    const val = e.target.value;
    if (k === "customer") {
      const cust = liveCustomers.find(c => c._id === val);
      setForm(f => ({
        ...f,
        customer: val,
        customerName: cust?.name || "",
        address: cust?.address || ""
      }));
    } else if (k === "technician") {
      const tech = liveTechs.find(t => t._id === val);
      setForm(f => ({
        ...f,
        technician: val,
        techName: tech?.name || "Unassigned"
      }));
    } else {
      setForm(f => ({
        ...f,
        [k]: val
      }));
    }
  };
  const [addr, setAddr] = useState({
    country: '',
    state: '',
    city: '',
    area: '',
    pincode: ''
  });
  useEffect(() => {
    if (!open) return;
    if (!prefill) setAddr({
      country: '',
      state: '',
      city: '',
      area: '',
      pincode: ''
    });
  }, [open, prefill]);
  const handleSave = () => {
    if (!form.customer) {
      alert("Please select a customer");
      return;
    }
    const composedAddress = [form.address, addr.area, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(', ');
    onSave({
      customer: form.customer,
      customerName: form.customerName,
      type: form.type,
      priority: form.priority,
      technician: form.technician || undefined,
      techName: form.techName,
      scheduledDate: form.scheduledDate || undefined,
      scheduledTime: form.scheduledTime,
      ac: form.ac,
      issue: form.issue,
      address: composedAddress
    });
  };
  return <Modal open={open} onClose={onClose} title="➕ Create New Work Order" width={620}>
      <div className="ap-modals-9">
        <FRow label="Customer *">
          <FSelect value={form.customer} onChange={set("customer")}>
            <option value="">-- Select customer --</option>
            {liveCustomers.map(c => <option key={c._id} value={c._id}>
                {c.name}
              </option>)}
          </FSelect>
        </FRow>
        <FRow label="Job Type">
          <DynamicSelect options={jobTypeList} value={form.type} onChange={v => setForm(f => ({
          ...f,
          type: v
        }))} onAddOption={v => onAddJobType?.(v)} addLabel="Job Type" addPlaceholder="e.g. Deep Cleaning, Gas Refill…" />
        </FRow>
        <FRow label="Priority">
          <FSelect value={form.priority} onChange={set("priority")}>
            {["normal", "high", "urgent"].map(p => <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>)}
          </FSelect>
        </FRow>
        <FRow label="Technician">
          <FSelect value={form.technician} onChange={set("technician")}>
            <option value="">Unassigned</option>
            {liveTechs.map(t => <option key={t._id} value={t._id}>
                {t.name}
              </option>)}
          </FSelect>
        </FRow>
        <FRow label="Scheduled Date">
          <FInput type="date" value={form.scheduledDate} onChange={set("scheduledDate")} />
        </FRow>
        <FRow label="Scheduled Time">
          <FInput type="time" value={form.scheduledTime} onChange={set("scheduledTime")} />
        </FRow>
      </div>
      <FRow label="AC Unit / Equipment">
        <FInput placeholder="e.g. Samsung 1.5T Split – Bedroom" value={form.ac} onChange={set("ac")} />
      </FRow>
      <FRow label="Description">
        <RichTextFileEditor placeholder="Detailed problem description, observations, error codes…" files={files} setFiles={setFiles} onChange={val => setForm(f => ({
        ...f,
        issue: val
      }))} />
      </FRow>
      <div className="addr-section-label">Customer Address</div>
      <FRow label="Street / Flat / Building">
        <FInput placeholder="e.g. Flat 4B, Green Apartments, MG Road" value={form.address} onChange={set("address")} />
      </FRow>
      <AddressFields prefix="job_" value={addr} onChange={setAddr} />
      <div className="ap-modals-10">
        <FBtn secondary onClick={onClose}>
          Cancel
        </FBtn>
        <FBtn onClick={handleSave}>Create Job</FBtn>
      </div>
    </Modal>;
};

// ─── NewQuotationModal ────────────────────────────────────────────────────────
// const NewQuotationModal = ({ open, onClose, onSave }) => {
//   const notesRef = useRef(null);
//   const termsRef = useRef(null);
//   return (
//     <Modal open={open} onClose={onClose} title="📄 New Quotation" width={580}>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//         <FRow label="Customer Name">
//           <FInput placeholder="Customer or company" />
//         </FRow>
//         <FRow label="Contact Person">
//           <FInput placeholder="Mr./Ms. Name" />
//         </FRow>
//         <FRow label="Phone">
//           <FInput placeholder="+91 XXXXX XXXXX" type="tel" />
//         </FRow>
//         <FRow label="Type">
//           <FSelect>
//             <option>Installation</option>
//             <option>Service</option>
//             <option>Repair</option>
//             <option>AMC</option>
//           </FSelect>
//         </FRow>
//         <FRow label="Valid Till">
//           <FInput type="date" defaultValue="2026-03-20" />
//         </FRow>
//         <FRow label="Items / Description">
//           <FTextarea
//             placeholder="Item 1 – Daikin 1.5T Inverter Split × 2 @ ₹42,000…"
//             rows={4}
//           />
//         </FRow>
//       </div>
//       {/* ── NEW: Customer Address ─────────────────────────────────────────── */}
//       {/* <div className="addr-section-label">Customer Address</div> */}
//       <FRow label="Street / Flat / Building">
//         <FInput placeholder="e.g. Flat 4B, Green Apartments, MG Road" />
//       </FRow>
//       <AddressFields prefix="quot_" />
//       <FRow>
//         <label style={lbl}>NOTES</label>
//         <RichTextEditorNoFile
//           placeholder="Additional notes, special instructions, remarks for this quotation…"
//           getValueRef={notesRef}
//           minHeight={90}
//         />
//       </FRow>
//       <FRow>
//         <label style={lbl}>TERMS &amp; CONDITIONS</label>
//         <RichTextEditorNoFile
//           placeholder="Payment terms, warranty info, cancellation policy, validity clauses…"
//           getValueRef={termsRef}
//           minHeight={90}
//         />
//       </FRow>
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "flex-end",
//           gap: 10,
//           marginTop: 8,
//         }}
//       >
//         <FBtn secondary onClick={onClose}>
//           Cancel
//         </FBtn>
//         <FBtn onClick={() => onSave({})}>Create Quotation</FBtn>
//       </div>
//     </Modal>
//   );
// };

// ─── NewQuotationModal ────────────────────────────────────────────────────────
const NAVY = "#1a2e5c";
const quotItemInput = {
  width: "100%",
  padding: "6px 8px",
  border: "1.5px solid #94a3b8",
  borderRadius: 5,
  fontSize: 12,
  fontFamily: FONTS.sans,
  outline: "none",
  background: "var(--bg)",
  boxSizing: "border-box"
};
const QuotItemsBuilder = ({
  items,
  setItems
}) => {
  const setItem = (i, key) => e => setItems(prev => prev.map((it, j) => j === i ? {
    ...it,
    [key]: e.target.value
  } : it));
  const addItem = () => setItems(prev => [...prev, {
    desc: "",
    qty: "",
    rate: ""
  }]);
  const removeItem = i => setItems(prev => prev.filter((_, j) => j !== i));
  const rowTotal = i => {
    const q = parseFloat(items[i].qty) || 0;
    const r = parseFloat(items[i].rate) || 0;
    return q && r ? `₹${(q * r).toLocaleString()}` : "";
  };
  return <div>
      <div className="ap-modals-11">
        Items / Description
      </div>

      <div className="ap-modals-12">
        <table className="ap-modals-13">
          <thead>
            <tr className="ap-modals-14">
              {[{
              label: "SR",
              w: "8%"
            }, {
              label: "DESCRIPTION",
              w: "44%"
            }, {
              label: "QTY",
              w: "14%"
            }, {
              label: "RATE",
              w: "17%"
            }, {
              label: "TOTAL",
              w: "17%"
            }].map(col => <th key={col.label} style={{
              textAlign: col.label === "DESCRIPTION" ? "left" : "center",
              width: col.w
            }} className="ap-modals-15">
                  {col.label}
                </th>)}
              <th className="ap-modals-16" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => <tr key={i} className="ap-modals-17">
                <td className="ap-modals-18">
                  {i + 1}
                </td>
                <td className="ap-modals-19">
                  <input value={item.desc} onChange={setItem(i, "desc")} placeholder="e.g. Daikin 1.5T Inverter Split" className="ap-modals-20" />
                </td>
                <td className="ap-modals-21">
                  <input value={item.qty} onChange={setItem(i, "qty")} placeholder="1" className="ap-modals-22" />
                </td>
                <td className="ap-modals-23">
                  <input value={item.rate} onChange={setItem(i, "rate")} placeholder="0" className="ap-modals-24" />
                </td>
                <td className="ap-modals-25">
                  {rowTotal(i)}
                </td>
                <td className="ap-modals-26">
                  {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="ap-modals-27">
                      ✕
                    </button>}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={addItem} className="ap-modals-28">
        + Add Line Item
      </button>
    </div>;
};

// const NewQuotationModal = ({ open, onClose, onSave }) => {
//   const notesRef = useRef(null);
//   const termsRef = useRef(null);

//   const EMPTY_FORM = {
//     customer: "", contact: "", phone: "", type: "Installation",
//     validTill: "2026-03-20", address: "",
//   };
//   const [form, setForm]   = useState(EMPTY_FORM);
//   const [items, setItems] = useState([{ desc: "", qty: "", rate: "" }]);
//   const [saving, setSaving] = useState(false);
//   const [error, setError]   = useState("");

//   useEffect(() => {
//     if (open) {
//       setForm(EMPTY_FORM);
//       setItems([{ desc: "", qty: "", rate: "" }]);
//       setError("");
//     }
//   }, [open]);

//   const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

//   const subtotal = items.reduce(
//     (s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0),
//     0
//   );
//   const gst   = Math.round(subtotal * 0.18);
//   const total = subtotal + gst;

//   const handleSave = async () => {
//     setError("");
//     if (!form.customer.trim()) return setError("Customer name is required.");
//     const validItems = items.filter(it => it.desc.trim());
//     if (!validItems.length) return setError("Add at least one line item.");

//     setSaving(true);
//     try {
//       await onSave({
//         customer:   form.customer.trim(),
//         contact:    form.contact,
//         phone:      form.phone,
//         type:       form.type,
//         validUntil: form.validTill,
//         address:    form.address,
//         items:      validItems,
//         subtotal,
//         gst,
//         total,
//         notes: notesRef.current?.getValue?.() ?? "",
//         terms: termsRef.current?.getValue?.() ?? "",
//       });
//       onClose();
//     } catch (e) {
//       setError(e.message || "Failed to create quotation.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <Modal open={open} onClose={onClose} title="📄 New Quotation" width={620}>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//         <FRow label="Customer Name *">
//           <FInput placeholder="Customer or company" value={form.customer} onChange={set("customer")} />
//         </FRow>
//         <FRow label="Contact Person">
//           <FInput placeholder="Mr./Ms. Name" value={form.contact} onChange={set("contact")} />
//         </FRow>
//         <FRow label="Phone">
//           <FInput placeholder="+91 XXXXX XXXXX" type="tel" value={form.phone} onChange={set("phone")} />
//         </FRow>
//         <FRow label="Type">
//           <FSelect value={form.type} onChange={set("type")}>
//             <option>Installation</option>
//             <option>Service</option>
//             <option>Repair</option>
//             <option>AMC</option>
//           </FSelect>
//         </FRow>
//         <FRow label="Valid Till">
//           <FInput type="date" value={form.validTill} onChange={set("validTill")} />
//         </FRow>
//       </div>

//       <div style={{ marginTop: 4, marginBottom: 4 }}>
//         <QuotItemsBuilder items={items} setItems={setItems} />
//       </div>

//       {/* Totals preview */}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
//         <div style={{ padding: "9px 12px", borderRadius: 8, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
//           <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, letterSpacing: .5 }}>SUBTOTAL</div>
//           <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.h1, fontFamily: FONTS.mono }}>
//             ₹{subtotal.toLocaleString()}
//           </div>
//         </div>
//         <div style={{ padding: "9px 12px", borderRadius: 8, background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
//           <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.faint, letterSpacing: .5 }}>GST (18%)</div>
//           <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.h1, fontFamily: FONTS.mono }}>
//             ₹{gst.toLocaleString()}
//           </div>
//         </div>
//         <div style={{ padding: "9px 12px", borderRadius: 8, background: `${COLORS.brand}10`, border: `1.5px solid ${COLORS.brand}30` }}>
//           <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.brand, letterSpacing: .5 }}>TOTAL</div>
//           <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.brand, fontFamily: FONTS.mono }}>
//             ₹{total.toLocaleString()}
//           </div>
//         </div>
//       </div>

//       <FRow label="Street / Flat / Building">
//         <FInput placeholder="e.g. Flat 4B, Green Apartments, MG Road" value={form.address} onChange={set("address")} />
//       </FRow>
//       <AddressFields prefix="quot_" />

//       <FRow>
//         <label style={lbl}>NOTES</label>
//         <RichTextEditorNoFile
//           placeholder="Additional notes, special instructions, remarks for this quotation…"
//           getValueRef={notesRef}
//           minHeight={90}
//         />
//       </FRow>
//       <FRow>
//         <label style={lbl}>TERMS &amp; CONDITIONS</label>
//         <RichTextEditorNoFile
//           placeholder="Payment terms, warranty info, cancellation policy, validity clauses…"
//           getValueRef={termsRef}
//           minHeight={90}
//         />
//       </FRow>

//       {error && (
//         <div style={{ fontSize: 12, fontWeight: 600, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "9px 12px", marginTop: 8 }}>
//           {error}
//         </div>
//       )}

//       <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
//         <FBtn secondary onClick={onClose}>Cancel</FBtn>
//         <FBtn onClick={handleSave} disabled={saving}>
//           {saving ? "Creating…" : "Create Quotation"}
//         </FBtn>
//       </div>
//     </Modal>
//   );
// };

const NewQuotationModal = ({
  open,
  onClose,
  onSave,
  preselect = null,
  jobTypes: jobTypeOptions = [],
  onAddJobType
}) => {
  const jobTypeList = jobTypeOptions.length ? jobTypeOptions : JOB_TYPE_DEFAULTS;
  const notesRef = useRef(null);
  const termsRef = useRef(null);
  const EMPTY_FORM = {
    customer: "",
    customerName: "",
    contact: "",
    phone: "",
    email: "",
    type: "Installation",
    validTill: "2026-03-20",
    address: ""
  };
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([{
    desc: "",
    qty: "",
    rate: ""
  }]);
  const [liveCustomers, setLiveCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setForm(f => ({
      ...EMPTY_FORM,
      type: preselect?.category ?? EMPTY_FORM.type
    }));
    setItems(
      preselect
        ? [{ desc: preselect.name || "", qty: "1", rate: preselect.price != null ? String(preselect.price) : "" }]
        : [{ desc: "", qty: "", rate: "" }]
    );
    setError("");
    customersApi.list({
      limit: 200
    }).then(r => setLiveCustomers(r.data ?? [])).catch(() => {});
  }, [open, preselect]);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const [addr, setAddr] = useState({
    country: '',
    state: '',
    city: '',
    area: '',
    pincode: ''
  });
  useEffect(() => {
    if (!open) return;
    setAddr({
      country: '',
      state: '',
      city: '',
      area: '',
      pincode: ''
    });
  }, [open]);

  // ── Select customer → auto-fill contact/phone/email/address ──────────────
  const handleCustomerChange = e => {
    const val = e.target.value;
    const cust = liveCustomers.find(c => c._id === val);
    setForm(f => ({
      ...f,
      customer: val,
      customerName: cust?.name || "",
      contact: cust?.name || f.contact,
      // Customer has no separate "contact person" field
      phone: cust?.phone || "",
      email: cust?.email || "",
      address: cust?.address || ""
    }));
  };
  const subtotal = items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0), 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  const handleSave = async () => {
    setError("");
    if (!form.customer) return setError("Please select a customer.");
    const validItems = items.filter(it => it.desc.trim());
    if (!validItems.length) return setError("Add at least one line item.");
    const composedAddress = [form.address, addr.area, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(', ');
    setSaving(true);
    try {
      await onSave({
        customer: form.customer,
        // real Customer _id — satisfies the ObjectId ref
        customerName: form.customerName,
        // satisfies the required String field
        contact: form.contact,
        phone: form.phone,
        email: form.email,
        type: form.type,
        validUntil: form.validTill,
        address: composedAddress,
        items: validItems,
        subtotal,
        gst,
        total,
        notes: notesRef.current?.getValue?.() ?? "",
        terms: termsRef.current?.getValue?.() ?? ""
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create quotation.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="📄 New Quotation" width={620}>
      <div className="ap-modals-29">
        <FRow label="Customer *">
          <FSelect value={form.customer} onChange={handleCustomerChange}>
            <option value="">Select customer…</option>
            {liveCustomers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Contact Person">
          <FInput placeholder="Auto-fills from customer" value={form.contact} onChange={set("contact")} />
        </FRow>
        <FRow label="Phone">
          <FInput placeholder="+91 XXXXX XXXXX" type="tel" value={form.phone} onChange={set("phone")} />
        </FRow>
        <FRow label="Type">
          <DynamicSelect options={jobTypeList} value={form.type} onChange={v => setForm(f => ({
          ...f,
          type: v
        }))} onAddOption={v => onAddJobType?.(v)} addLabel="Service Type" addPlaceholder="e.g. Deep Cleaning, Gas Refill…" />
        </FRow>
        <FRow label="Valid Till">
          <FInput type="date" value={form.validTill} onChange={set("validTill")} />
        </FRow>
      </div>

      <div className="ap-modals-30">
        <QuotItemsBuilder items={items} setItems={setItems} />
      </div>

      {/* Totals preview */}
      <div className="ap-modals-31">
        <div className="ap-modals-32">
          <div className="ap-modals-33">SUBTOTAL</div>
          <div className="ap-modals-34">
            ₹{subtotal.toLocaleString()}
          </div>
        </div>
        <div className="ap-modals-35">
          <div className="ap-modals-36">GST (18%)</div>
          <div className="ap-modals-37">
            ₹{gst.toLocaleString()}
          </div>
        </div>
        <div className="ap-modals-38">
          <div className="ap-modals-39">TOTAL</div>
          <div className="ap-modals-40">
            ₹{total.toLocaleString()}
          </div>
        </div>
      </div>

      <FRow label="Street / Flat / Building">
        <FInput placeholder="e.g. Flat 4B, Green Apartments, MG Road" value={form.address} onChange={set("address")} />
      </FRow>
      <AddressFields prefix="quot_" value={addr} onChange={setAddr} />

      <FRow>
        <label className="ap-modals-41">NOTES</label>
        <RichTextEditorNoFile placeholder="Additional notes, special instructions, remarks for this quotation…" getValueRef={notesRef} minHeight={90} />
      </FRow>
      <FRow>
        <label className="ap-modals-41">TERMS &amp; CONDITIONS</label>
        <RichTextEditorNoFile placeholder="Payment terms, warranty info, cancellation policy, validity clauses…" getValueRef={termsRef} minHeight={90} />
      </FRow>

      {error && <div className="ap-modals-42">
          {error}
        </div>}

      <div className="ap-modals-43">
        <FBtn secondary onClick={onClose}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={saving}>
          {saving ? "Creating…" : "Create Quotation"}
        </FBtn>
      </div>
    </Modal>;
};

// ─── AddTypeModal ─────────────────────────────────────────────────────────────
const AddTypeModal = ({
  onClose,
  onSave,
  label = "Type",
  placeholder = "e.g. New type…"
}) => {
  const [value, setValue] = useState("");
  return createPortal(<div onClick={onClose} className="ap-modals-44">
      <div onClick={e => e.stopPropagation()} className="ap-modals-45">
        <div className="ap-modals-46">
          <div className="ap-modals-47">
            Add {label}
          </div>
          <button onClick={onClose} className="ap-modals-48">
            ×
          </button>
        </div>
        <div className="ap-modals-49">
          <div className="ap-modals-50">
            {label} <span className="ap-modals-51">*</span>
          </div>
          <input autoFocus value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => {
          if (e.key === "Enter" && value.trim()) {
            onSave(value.trim());
            onClose();
          }
        }} placeholder={placeholder} style={{
          border: `1.5px solid ${value ? COLORS.brand : COLORS.border}`
        }} className="ap-modals-52" />
        </div>
        <div className="ap-modals-53">
          <button onClick={onClose} className="ap-modals-54">
            Close
          </button>
          <button onClick={() => {
          if (value.trim()) {
            onSave(value.trim());
            onClose();
          }
        }} disabled={!value.trim()} style={{
          background: value.trim() ? "linear-gradient(135deg,var(--brand),var(--brand-dark))" : "var(--border)",
          color: value.trim() ? "white" : "var(--text-muted)",
          cursor: value.trim() ? "pointer" : "not-allowed"
        }} className="ap-modals-55">
            ✓ Save
          </button>
        </div>
      </div>
    </div>, document.body);
};

// ─── NewCustomerModal ─────────────────────────────────────────────────────────
const NewCustomerModal = ({
  open,
  onClose,
  onSave,
  activeTypes = [],
  onAddType
}) => {
  const fallback = ["Residential", "Commercial"];
  const typeList = activeTypes.length > 0 ? activeTypes : fallback;
  const EMPTY = {
    name: "",
    phone: "",
    email: "",
    units: 1,
    amc: "None"
  };
  const EMPTY_ADDR = {
    country: "",
    state: "",
    city: "",
    area: "",
    pincode: ""
  };
  const [form, setForm] = useState(EMPTY);
  const [addr, setAddr] = useState(EMPTY_ADDR);
  const [streetLine, setStreetLine] = useState("");
  const [selectedType, setSelectedType] = useState(typeList[0] || "");
  const [showAddType, setShowAddType] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setAddr(EMPTY_ADDR);
      setStreetLine("");
      setSelectedType(typeList[0] || "");
      setError("");
    }
  }, [open]);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const handleAddType = newType => {
    onAddType?.(newType);
    setSelectedType(newType);
  };
  const composedAddress = [streetLine, addr.area, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(', ');
  const handleSave = async () => {
    setError("");
    if (!form.name.trim()) return setError("Full name / company is required.");
    if (!form.phone.trim()) return setError("Phone number is required.");
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        type: selectedType,
        phone: form.phone.trim(),
        email: form.email.trim(),
        units: Number(form.units) || 1,
        amc: form.amc === "Active",
        address: composedAddress,
        country: addr.country,
        state: addr.state,
        city: addr.city,
        area: addr.area,
        pincode: addr.pincode
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create customer.");
    } finally {
      setSaving(false);
    }
  };
  return <>
      <Modal open={open} onClose={onClose} title="👤 Add New Customer" width={620}>
        <div className="ap-modals-56">
          <FRow label="Full Name / Company *">
            <FInput placeholder="Sharma Residency" value={form.name} onChange={set("name")} />
          </FRow>
          <FRow label="Type">
            <div className="ap-modals-57">
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="ap-modals-58">
                {typeList.map(t => <option key={t}>{t}</option>)}
              </select>
              <button onClick={() => setShowAddType(true)} title="Add new type" className="ap-modals-59">+</button>
            </div>
          </FRow>
          <FRow label="Phone *">
            <FInput type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set("phone")} />
          </FRow>
          <FRow label="Email">
            <FInput type="email" placeholder="email@example.com" value={form.email} onChange={set("email")} />
          </FRow>
          <FRow label="AC Units">
            <FInput type="number" placeholder="2" value={form.units} onChange={set("units")} />
          </FRow>
          <FRow label="AMC Status">
            <FSelect value={form.amc} onChange={set("amc")}>
              <option>None</option>
              <option>Active</option>
            </FSelect>
          </FRow>
        </div>
        <div className="addr-section-label">Address</div>
        <FRow label="Street / Flat / Building">
          <FInput placeholder="e.g. Flat 4B, Green Apartments, MG Road" value={streetLine} onChange={e => setStreetLine(e.target.value)} />
        </FRow>
        <AddressFields prefix="cust_" value={addr} onChange={setAddr} />

        {error && <div className="ap-modals-60">
            {error}
          </div>}

        <div className="ap-modals-61">
          <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
          <FBtn onClick={handleSave} disabled={saving}>{saving ? "Adding…" : "Add Customer"}</FBtn>
        </div>
      </Modal>
      {showAddType && <AddTypeModal onClose={() => setShowAddType(false)} onSave={handleAddType} label="Customer Type" placeholder="e.g. Industrial, Government…" />}
    </>;
};

// ─── NewAMCModal ──────────────────────────────────────────────────────────────
const NewAMCModal = ({
  open,
  onClose,
  onSave,
  contractTypes = [],
  onAddContractType,
  plans: planOptions = [],
  onAddPlan
}) => {
  const [files, setFiles] = useState([]);
  const [autoRenew, setAutoRenew] = useState(false);
  const [noDueDate, setNoDueDate] = useState(false);
  const [currency, setCurrency] = useState("INR (₹)");
  const currencies = ["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "AED (د.إ)"];
  const [liveCustomers, setLiveCustomers] = useState([]);
  const [liveTechs, setLiveTechs] = useState([]);
 
  const [customerId, setCustomerId] = useState("");
  const [startDate, setStartDate] = useState("2026-04-01");
  const [endDate, setEndDate] = useState("2027-03-31");
  const [plan, setPlan] = useState("Basic");
  const [units, setUnits] = useState(1);
  const [value, setValue] = useState("");
  const [visits, setVisits] = useState(4);
  const [status, setStatus] = useState("active");
  const [addr, setAddr] = useState({ country: "", state: "", city: "", area: "", pincode: "" });
  const [siteAddress, setSiteAddress] = useState("");
 
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [acBrandModel, setAcBrandModel] = useState("");
  const [capacity, setCapacity] = useState("Any / Mixed");
  const [assignedTech, setAssignedTech] = useState("");
  const [linkedAmcRef, setLinkedAmcRef] = useState("");
  const [linkedLead, setLinkedLead] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [cellPhone, setCellPhone] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [street, setStreet] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Upfront / Full Payment");
  const [eSign, setESign] = useState("No — save as draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
 
  const FALLBACK_TYPES = ["AMC – Basic", "AMC – Comprehensive", "AMC – Premium", "Installation", "Service Agreement", "Rental / Lease", "Warranty Extension", "One-time Repair"];
  const typeList = contractTypes.length ? contractTypes : FALLBACK_TYPES;
  const planList = planOptions.length ? planOptions : ["Basic", "Comprehensive", "Premium", "Custom"];
  const [contractType, setContractType] = useState("");
 
  useEffect(() => {
    if (!open) return;
    customersApi.list({ limit: 200 }).then(r => setLiveCustomers(r.data ?? [])).catch(() => {});
    techsApi.list({ limit: 200 }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
  }, [open]);
 
  const handleCustomerChange = e => {
    const val = e.target.value;
    setCustomerId(val);
    const cust = liveCustomers.find(c => c._id === val);
    setContactPerson(cust?.name || "");
    setCellPhone(cust?.phone || "");
    setClientEmail(cust?.email || "");
    setStreet(cust?.address || "");
  };
 
  const composedAddress = [street, addr.area, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(", ");
 
  const handleSave = async () => {
    setError("");
    if (!customerId) return setError("Please select a client.");
    if (!subject.trim()) return setError("Subject is required.");
    if (!contractType) return setError("Please select a contract type.");
    if (!startDate) return setError("Start date is required.");
    if (!endDate && !noDueDate) return setError("End date is required.");
    if (!value) return setError("Contract value is required.");
    setSaving(true);
    try {
      const cust = liveCustomers.find(c => c._id === customerId);
      const tech = liveTechs.find(t => t._id === assignedTech);
      await onSave({
        customer: customerId,
        customerName: cust?.name || "",
        subject: subject.trim(),
        description,
        contractType,
        plan,
        start: startDate,
        end: noDueDate ? new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString() : endDate,
        value: Number(value) || 0,
        visits: Number(visits) || 4,
        units: Number(units) || 1,
        status,
        autoRenew,
        currency,
        acBrandModel,
        capacity,
        assignedTech: assignedTech || undefined,
        techName: tech?.name || "",
        linkedAmcRef,
        linkedLead,
        contactPerson,
        cellPhone,
        officePhone,
        email: clientEmail,
        address: composedAddress,
        country: addr.country, state: addr.state, city: addr.city, area: addr.area, pincode: addr.pincode,
        siteAddress,
        paymentTerms,
        sendForESignature: eSign.startsWith("Yes")
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create contract.");
    } finally {
      setSaving(false);
    }
  };
 
  return <Modal open={open} onClose={onClose} title="📋 New Contract" width={700}>
      <SectionHead title="Contract Details" />
      <div className="ap-modals-62">
        <FRow label="Contract Number *">
          <div className="ap-modals-63">
            <div className="ap-modals-64">CON#</div>
            <input placeholder="Auto" disabled className="ap-modals-65" />
          </div>
        </FRow>
        <FRow label="Subject *">
          <FInput placeholder="e.g. Annual Maintenance Contract – Sharma Residency" value={subject} onChange={e => setSubject(e.target.value)} />
        </FRow>
        <FRow label="Contract Type *">
          <DynamicSelect options={typeList} value={contractType} onChange={setContractType} onAddOption={v => { onAddContractType?.(v); setContractType(v); }} addLabel="Contract Type" addPlaceholder="e.g. Warranty Extension, Rental / Lease…" />
        </FRow>
        <FRow label="Plan">
          <DynamicSelect options={planList} value={plan} onChange={setPlan} onAddOption={v => { onAddPlan?.(v); setPlan(v); }} addLabel="Plan" addPlaceholder="e.g. Enterprise, Starter…" />
        </FRow>
      </div>
      <FRow label="Description / Scope of Work">
        <RichTextFileEditor placeholder="Describe the scope of work, services included, exclusions, SLA terms…" files={files} setFiles={setFiles} minHeight={90} onChange={setDescription} />
      </FRow>
      <SectionHead title="Dates & Value" />
      <div className="ap-modals-66">
        <FRow label="Start Date *">
          <FInput type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </FRow>
        <FRow label="End Date">
          <div className="ap-modals-67">
            <FInput type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={noDueDate} style={{ opacity: noDueDate ? "0.4" : "1" }} />
            <label className="ap-modals-68">
              <input type="checkbox" checked={noDueDate} onChange={e => setNoDueDate(e.target.checked)} className="ap-modals-69" />
              Without Due Date
            </label>
          </div>
        </FRow>
        <FRow label="Visits / Year">
          <FInput type="number" placeholder="4" value={visits} onChange={e => setVisits(e.target.value)} />
        </FRow>
      </div>
      <div className="ap-modals-70">
        <FRow label="Contract Value (₹) *">
          <FInput type="number" placeholder="48000" value={value} onChange={e => setValue(e.target.value)} />
        </FRow>
        <FRow label="Currency">
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="ap-modals-71">
            {currencies.map(c => <option key={c}>{c}</option>)}
          </select>
        </FRow>
        <FRow label="Payment Terms">
          <FSelect value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
            <option>Upfront / Full Payment</option><option>Quarterly</option><option>Half-Yearly</option>
            <option>Monthly</option><option>On Completion</option><option>Net 15</option><option>Net 30</option>
          </FSelect>
        </FRow>
        <FRow label="Auto-Renew">
          <div style={{ background: autoRenew ? "var(--xea580c08)" : "var(--bg)", border: `1px solid ${autoRenew ? COLORS.brand + "40" : COLORS.border}` }} onClick={() => setAutoRenew(v => !v)} className="ap-modals-72">
            <input type="checkbox" checked={autoRenew} onChange={() => setAutoRenew(v => !v)} className="ap-modals-73" />
            <span style={{ color: autoRenew ? "var(--brand)" : "var(--text-body)", fontWeight: autoRenew ? "600" : "400" }} className="ap-modals-74">
              {autoRenew ? "Yes — auto-renew on expiry" : "No auto-renewal"}
            </span>
          </div>
        </FRow>
      </div>
      <SectionHead title="AC Equipment" />
      <div className="ap-modals-75">
        <FRow label="AC Units Covered">
          <FInput type="number" placeholder="4" value={units} onChange={e => setUnits(e.target.value)} />
        </FRow>
        <FRow label="AC Brand / Model">
          <FInput placeholder="e.g. Daikin, Samsung, Voltas" value={acBrandModel} onChange={e => setAcBrandModel(e.target.value)} />
        </FRow>
        <FRow label="Capacity (Tons)">
          <FSelect value={capacity} onChange={e => setCapacity(e.target.value)}>
            <option>Any / Mixed</option><option>0.75 T</option><option>1.0 T</option><option>1.5 T</option>
            <option>2.0 T</option><option>2.5 T +</option><option>VRF / Cassette</option>
          </FSelect>
        </FRow>
        <FRow label="Assigned Technician">
          <FSelect value={assignedTech} onChange={e => setAssignedTech(e.target.value)}>
            <option value="">Unassigned</option>
            {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Linked AMC Ref">
          <FInput placeholder="e.g. AMC-221" value={linkedAmcRef} onChange={e => setLinkedAmcRef(e.target.value)} />
        </FRow>
        <FRow label="Linked Lead">
          <FInput placeholder="e.g. LEAD-045" value={linkedLead} onChange={e => setLinkedLead(e.target.value)} />
        </FRow>
      </div>
      <SectionHead title="Client Details" />
      <div className="ap-modals-76">
        <FRow label="Client *">
          <FSelect value={customerId} onChange={handleCustomerChange}>
            <option value="">-- Select client --</option>
            {liveCustomers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Contact Person">
          <FInput placeholder="Mr. / Ms. Name" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
        </FRow>
        <FRow label="Cell / Mobile">
          <FInput type="tel" placeholder="+91 XXXXX XXXXX" value={cellPhone} onChange={e => setCellPhone(e.target.value)} />
        </FRow>
        <FRow label="Office Phone">
          <FInput type="tel" placeholder="+91 79 XXXX XXXX" value={officePhone} onChange={e => setOfficePhone(e.target.value)} />
        </FRow>
        <FRow label="Email">
          <FInput type="email" placeholder="client@example.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
        </FRow>
      </div>
      <FRow label="Street / Building">
        <FInput placeholder="e.g. Flat 4B, Green Apartments, SG Road" value={street} onChange={e => setStreet(e.target.value)} />
      </FRow>
      <AddressFields prefix="con_" value={addr} onChange={setAddr} />
      <div>
        <FRow label="Alternate / Site Address">
          <textarea placeholder="e.g. Site address if different from billing…" rows={3} value={siteAddress} onChange={e => setSiteAddress(e.target.value)} className="ap-modals-77" />
        </FRow>
      </div>
      <SectionHead title="Signature & Status" />
      <div className="ap-modals-78">
        <FRow label="Initial Status">
          <FSelect value={status} onChange={e => setStatus(e.target.value)}>
            <option value="active">Active</option><option value="expiring">Expiring</option><option value="cancelled">Cancelled</option>
          </FSelect>
        </FRow>
        <FRow label="Send for E-Signature on Save">
          <FSelect value={eSign} onChange={e => setESign(e.target.value)}>
            <option>No — save as draft</option><option>Yes — send immediately</option>
          </FSelect>
        </FRow>
      </div>
      {error && <div className="ap-modals-60">{error}</div>}
      <div className="ap-modals-79">
        <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={saving}>{saving ? "Creating…" : "Create Contract"}</FBtn>
      </div>
    </Modal>;
};

// ─── NewInvoiceModal ──────────────────────────────────────────────────────────
const NewInvoiceModal = ({
  open,
  onClose,
  onSave
}) => {
  const [liveJobs, setLiveJobs] = useState([]);
  const [liveCustomers, setLiveCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const EMPTY = {
    jobRef: "",
    customer: "",
    customerName: "",
    amount: "",
    dueDate: "",
    description: ""
  };
  const [form, setForm] = useState(EMPTY);
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setError("");
    jobsApi.list({ limit: 200 }).then(r => setLiveJobs(r.data ?? [])).catch(() => {});
    customersApi.list({ limit: 200 }).then(r => setLiveCustomers(r.data ?? [])).catch(() => {});
  }, [open]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleCustomerChange = e => {
    const val = e.target.value;
    const cust = liveCustomers.find(c => c._id === val);
    setForm(f => ({ ...f, customer: val, customerName: cust?.name || "" }));
  };
  const handleSave = async () => {
    setError("");
    if (!form.customer) return setError("Please select a customer.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Enter a valid amount.");
    if (!form.dueDate) return setError("Due date is required.");
    setSaving(true);
    try {
      await onSave({
        jobRef: form.jobRef || undefined,
        customer: form.customer,
        customerName: form.customerName,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        description: form.description
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create invoice.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="🧾 Create Invoice">
    <div className="ap-modals-80">
      <FRow label="Job / Contract Ref">
        <FSelect value={form.jobRef} onChange={set("jobRef")}>
          <option value="">-- None --</option>
          {liveJobs.map(j => <option key={j._id} value={j._id}>{j.jobId || j._id}</option>)}
        </FSelect>
      </FRow>
      <FRow label="Customer *">
        <FSelect value={form.customer} onChange={handleCustomerChange}>
          <option value="">Select customer…</option>
          {liveCustomers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </FSelect>
      </FRow>
      <FRow label="Amount (₹) *">
        <FInput type="number" placeholder="5000" value={form.amount} onChange={set("amount")} />
      </FRow>
      <FRow label="Due Date *">
        <FInput type="date" value={form.dueDate} onChange={set("dueDate")} />
      </FRow>
    </div>
    <FRow label="Description / Items">
      <FTextarea placeholder="Labour: ₹1200&#10;Parts: R-32 Refrigerant × 1 – ₹2800&#10;Service charge: ₹500" rows={4} value={form.description} onChange={set("description")} />
    </FRow>
    {error && <div className="ap-modals-7">{error}</div>}
    <div className="ap-modals-81">
      <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
      <FBtn onClick={handleSave} disabled={saving}>{saving ? "Generating…" : "Generate Invoice"}</FBtn>
    </div>
  </Modal>;
};

// ─── AddOptionModal (mini portal for DynamicSelect) ───────────────────────────
const AddOptionModal = ({
  label,
  placeholder,
  onClose,
  onSave
}) => createPortal(<div onClick={onClose} className="ap-modals-82">
      <div onClick={e => e.stopPropagation()} className="ap-modals-83">
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`}</style>
        <div className="ap-modals-84">
          <div className="ap-modals-85">
            <div className="ap-modals-86">
              ＋
            </div>
            <div className="ap-modals-87">
              Add {label}
            </div>
          </div>
          <button onClick={onClose} className="ap-modals-88">
            ×
          </button>
        </div>
        <OptionInput label={label} placeholder={placeholder} onSave={onSave} onClose={onClose} />
      </div>
    </div>, document.body);
const OptionInput = ({
  label,
  placeholder,
  onSave,
  onClose
}) => {
  const [value, setValue] = useState("");
  const valid = value.trim().length > 0;
  const submit = () => {
    if (valid) {
      onSave(value.trim());
      onClose();
    }
  };
  return <>
      <div className="ap-modals-89">
        <div className="ap-modals-90">
          {label} <span className="ap-modals-91">*</span>
        </div>
        <input autoFocus value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder={placeholder} style={{
        border: `1.5px solid ${valid ? COLORS.brand : COLORS.border}`,
        boxShadow: valid ? "0 0 0 3px var(--xea580c18)" : "none"
      }} className="ap-modals-92" />
        {valid && <div className="ap-modals-93">
            ✓ "{value.trim()}" will be added to the list
          </div>}
      </div>
      <div className="ap-modals-94">
        <button onClick={onClose} className="ap-modals-95">
          Cancel
        </button>
        <button onClick={submit} disabled={!valid} style={{
        background: valid ? "linear-gradient(135deg,var(--brand),var(--brand-dark))" : "var(--border)",
        color: valid ? "white" : "var(--text-muted)",
        cursor: valid ? "pointer" : "not-allowed"
      }} className="ap-modals-96">
          ✓ Save
        </button>
      </div>
    </>;
};

// ─── DynamicSelect ────────────────────────────────────────────────────────────
// export const DynamicSelect = ({
//   options = [],
//   value,
//   onChange,
//   onAddOption,
//   addLabel = "Option",
//   addPlaceholder = "Enter new option…",
//   disabled = false
// }) => {
//   const [showModal, setShowModal] = useState(false);
//   return <>
//       <div className="ap-modals-97">
//         <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{
//         background: disabled ? "var(--bg)" : "var(--white)",
//         cursor: disabled ? "not-allowed" : "default"
//       }} className="ap-modals-98">
//           {options.map(o => <option key={o} value={o}>
//               {o}
//             </option>)}
//         </select>
//         <button type="button" title={`Add new ${addLabel}`} onClick={() => setShowModal(true)} onMouseEnter={e => {
//         e.currentTarget.style.background = `${COLORS.brand}1F`;
//         e.currentTarget.style.transform = "scale(1.08)";
//       }} onMouseLeave={e => {
//         e.currentTarget.style.background = `${COLORS.brand}0D`;
//         e.currentTarget.style.transform = "scale(1)";
//       }} className="ap-modals-99">
//           ＋
//         </button>
//       </div>
//       {showModal && <AddOptionModal label={addLabel} placeholder={addPlaceholder} onClose={() => setShowModal(false)} onSave={newOpt => {
//       onAddOption(newOpt);
//       onChange(newOpt);
//     }} />}
//     </>;
// };

const normalizeOption = (o) => {
  if (o && typeof o === "object") {
    const label = o.name ?? o.label ?? o.value ?? String(o._id ?? "");
    return { label, value: o.name ?? o.value ?? label };
  }
  return { label: String(o), value: o };
};
 
export const DynamicSelect = ({
  options = [],
  value,
  onChange,
  onAddOption,
  addLabel = "Option",
  addPlaceholder = "Enter new option…",
  disabled = false
}) => {
  const [showModal, setShowModal] = useState(false);
  return <>
      <div className="ap-modals-97">
        <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={{
        background: disabled ? "var(--bg)" : "var(--white)",
        cursor: disabled ? "not-allowed" : "default"
      }} className="ap-modals-98">
          {options.map(o => {
            const { label, value: optValue } = normalizeOption(o);
            return <option key={optValue} value={optValue}>
                {label}
              </option>;
          })}
        </select>
        <button type="button" title={`Add new ${addLabel}`} onClick={() => setShowModal(true)} onMouseEnter={e => {
        e.currentTarget.style.background = `${COLORS.brand}1F`;
        e.currentTarget.style.transform = "scale(1.08)";
      }} onMouseLeave={e => {
        e.currentTarget.style.background = `${COLORS.brand}0D`;
        e.currentTarget.style.transform = "scale(1)";
      }} className="ap-modals-99">
          ＋
        </button>
      </div>
      {showModal && <AddOptionModal label={addLabel} placeholder={addPlaceholder} onClose={() => setShowModal(false)} onSave={newOpt => {
      onAddOption(newOpt);
      onChange(newOpt);
    }} />}
    </>;
};
 

// ─── Section heading ──────────────────────────────────────────────────────────
const SectionHeads = ({
  title,
  icon
}) => <div className="ap-modals-100">
    {icon && <span className="ap-modals-101">{icon}</span>}
    {title}
  </div>;

// ─── FileUploadField ──────────────────────────────────────────────────────────
const FileUploadField = ({
  label,
  accept = "image/*,application/pdf",
  hint,
  icon = "📎",
  onFile
}) => {
  const [fileName, setFileName] = useState(null);
  const inputRef = useRef();
  return <div>
      <div style={{
      border: `2px dashed ${fileName ? COLORS.brand : COLORS.border}`,
      background: fileName ? "var(--xea580c06)" : "var(--bg)"
    }} onClick={() => inputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) setFileName(f.name);
    }} className="ap-modals-102">
        <input ref={inputRef} type="file" accept={accept}  onChange={e => { if (e.target.files[0]) { setFileName(e.target.files[0].name); onFile?.(e.target.files[0]); } }} className="ap-modals-103" />
        <div className="ap-modals-104">
          {fileName ? "✅" : icon}
        </div>
        {fileName ? <div className="ap-modals-105">
            {fileName}
          </div> : <>
            <div className="ap-modals-106">
              Click or drag to upload {label}
            </div>
            <div className="ap-modals-107">
              {hint || "JPG, PNG or PDF · Max 5 MB"}
            </div>
          </>}
      </div>
    </div>;
};

// ─── PhotoUpload ──────────────────────────────────────────────────────────────
const PhotoUpload = () => {
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();
  return <div className="ap-modals-108">
      <div onClick={() => inputRef.current?.click()} style={{
      background: preview ? "transparent" : "var(--xea580c15)"
    }} className="ap-modals-109">
        {preview ? <img src={preview} alt="avatar" className="ap-modals-110" /> : <span className="ap-modals-111">👤</span>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={e => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = ev => setPreview(ev.target.result);
      r.readAsDataURL(f);
    }} className="ap-modals-112" />
      <div>
        <div className="ap-modals-113">
          Profile Photo
        </div>
        <div className="ap-modals-114">
          JPG or PNG · Max 2 MB
        </div>
        <button onClick={() => inputRef.current?.click()} className="ap-modals-115">
          {preview ? "✏️ Change" : "+ Upload"}
        </button>
      </div>
    </div>;
};

// ─── ToggleField ──────────────────────────────────────────────────────────────
const ToggleField = ({
  value,
  onChange,
  onLabel = "Yes",
  offLabel = "No"
}) => <div style={{
  background: value ? "var(--xea580c08)" : "var(--bg)",
  border: `1px solid ${value ? COLORS.brand + "40" : COLORS.border}`
}} onClick={() => onChange(!value)} className="ap-modals-116">
    <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="ap-modals-117" />
    <span style={{
    color: value ? "var(--brand)" : "var(--text-body)",
    fontWeight: value ? "600" : "400"
  }} className="ap-modals-118">
      {value ? onLabel : offLabel}
    </span>
  </div>;

// ─── Default fallback lists (used when parent doesn't pass lookup props) ──────
const FALLBACK_ROLES = ["Junior Technician", "Technician", "Senior Technician", "Lead Technician", "Supervisor", "Foreman"];
const FALLBACK_DEPARTMENTS = ["Field Service", "Installation", "AMC", "Repair", "VRF / Chillers"];
const FALLBACK_EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Freelancer", "Apprentice"];
const FALLBACK_REPORTING_TO = ["Admin / Owner", ...technicians.filter(t => t.role?.includes("Senior") || t.role?.includes("Supervisor")).map(t => t.name)];
const FALLBACK_VEHICLE_TYPES = ["None", "Bike (Own)", "Bike (Company)", "Van (Company)"];
const FALLBACK_BANKS = ["SBI – State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Bank of Baroda", "Punjab National Bank", "Canara Bank", "Union Bank", "IndusInd Bank", "Other"];

// ─── AddTechnicianModal ───────────────────────────────────────────────────────
// Props:
//   open, onClose, onSave   — standard modal props
//   lookups                 — { roles, departments, employmentTypes, reportingTo, vehicleTypes, banks }
//                             arrays of ACTIVE option strings from TechnicianLookups page
//   onAddLookup             — fn(listKey, newValue) called when user adds a new option via + button
//                             so the parent can sync it back to TechnicianLookups state
// ─────────────────────────────────────────────────────────────────────────────
const AddTechnicianModal = ({
  open,
  onClose,
  onSave,
  lookups = {},
  onAddLookup
}) => {
  const roles = lookups.roles?.length ? lookups.roles : ["Junior Technician", "Technician", "Senior Technician", "Lead Technician", "Supervisor", "Foreman"];
  const departments = lookups.departments?.length ? lookups.departments : ["Field Service", "Installation", "AMC", "Repair", "VRF / Chillers"];
  const employmentTypes = lookups.employmentTypes?.length ? lookups.employmentTypes : ["Full-time", "Part-time", "Contract", "Freelancer", "Apprentice"];
  const reportingTo = lookups.reportingTo?.length ? lookups.reportingTo : ["Admin / Owner"];
  const vehicleTypes = lookups.vehicleTypes?.length ? lookups.vehicleTypes : ["None", "Bike (Own)", "Bike (Company)", "Van (Company)"];
  const banks = lookups.banks?.length ? lookups.banks : ["SBI – State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Bank of Baroda", "Punjab National Bank", "Canara Bank", "Union Bank", "IndusInd Bank", "Other"];
 
  const EMPTY = {
    salutation: "", fullName: "", role: roles[1] ?? roles[0] ?? "", department: departments[0] ?? "",
    employmentType: employmentTypes[0] ?? "", gender: "", dob: "", bloodGroup: "", maritalStatus: "Single",
    nationality: "Indian", religionCategory: "",
    mobile: "", altPhone: "", email: "", personalEmail: "", emergencyName: "", emergencyPhone: "",
    street: "",
    joinDate: "2026-04-01", probationEnd: "", status: "available", basicSalary: "", dailyAllowance: "",
    overtimeRate: "", reportingTo: reportingTo[0] ?? "", serviceArea: "", workShift: "Morning (8 AM – 5 PM)",
    skills: "", experienceYears: "", brandsExpertise: "", specialization: "General Service", hvacCert: "",
    certNoExpiry: "",
    vehicleType: vehicleTypes[0] ?? "", vehicleRegNo: "", drivingLicenceNo: "",
    aadhaarNumber: "", panNumber: "",
    accountHolder: "", bank: "", accountNumber: "", ifsc: "", accountType: "Savings", upiId: "",
    tempPassword: "", userRole: "Technician (Field)", notes: ""
  };
  const [form, setForm] = useState(EMPTY);
  const [addr, setAddr] = useState({ country: "", state: "", city: "", area: "", pincode: "" });
  const [loginAllowed, setLoginAllowed] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [docs, setDocs] = useState({ aadhaar: null, pan: null, license: null, cert: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
 
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setAddr({ country: "", state: "", city: "", area: "", pincode: "" });
    setLoginAllowed(true);
    setEmailNotif(true);
    setWhatsappNotif(false);
    setPhoto(null);
    setDocs({ aadhaar: null, pan: null, license: null, cert: null });
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
 
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleAdd = useCallback((listKey, key) => newVal => {
    onAddLookup?.(listKey, newVal);
    setForm(f => ({ ...f, [key]: newVal }));
  }, [onAddLookup]);
 
  const composedAddress = [form.street, addr.area, addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(", ");
 
  const handleSave = async () => {
    setError("");
    if (!form.fullName.trim()) return setError("Full name is required.");
    if (!form.role) return setError("Role is required.");
    if (!form.mobile.trim()) return setError("Mobile number is required.");
    if (!form.basicSalary) return setError("Basic salary is required.");
    if (!form.serviceArea.trim()) return setError("Service area is required.");
    setSaving(true);
    try {
      await onSave({
        salutation: form.salutation,
        name: form.fullName.trim(),
        role: form.role,
        department: form.department,
        employmentType: form.employmentType,
        gender: form.gender,
        dob: form.dob || undefined,
        bloodGroup: form.bloodGroup,
        maritalStatus: form.maritalStatus,
        nationality: form.nationality,
        religionCategory: form.religionCategory,
        phone: form.mobile.trim(),
        altPhone: form.altPhone,
        email: form.email,
        personalEmail: form.personalEmail,
        emergencyContact: { name: form.emergencyName, phone: form.emergencyPhone },
        address: composedAddress,
        country: addr.country, state: addr.state, city: addr.city, area: addr.area, pincode: addr.pincode,
        joinDate: form.joinDate || undefined,
        probationEnd: form.probationEnd || undefined,
        status: form.status,
        basicSalary: Number(form.basicSalary) || 0,
        dailyAllowance: Number(form.dailyAllowance) || 0,
        overtimeRate: Number(form.overtimeRate) || 0,
        reportingTo: form.reportingTo,
        serviceArea: form.serviceArea.trim(),
        workShift: form.workShift,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        experienceYears: Number(form.experienceYears) || 0,
        brandsExpertise: form.brandsExpertise,
        specialization: form.specialization,
        hvacCert: form.hvacCert,
        certNoExpiry: form.certNoExpiry,
        vehicleType: form.vehicleType,
        vehicleRegNo: form.vehicleRegNo,
        drivingLicenceNo: form.drivingLicenceNo,
        aadhaarNumber: form.aadhaarNumber,
        panNumber: form.panNumber,
        bankDetails: {
          accountHolder: form.accountHolder,
          bank: form.bank,
          accountNumber: form.accountNumber,
          ifsc: form.ifsc,
          accountType: form.accountType,
          upiId: form.upiId
        },
        loginAllowed,
        emailNotif,
        whatsappNotif,
        tempPassword: loginAllowed ? form.tempPassword : undefined,
        userRole: loginAllowed ? form.userRole : undefined,
        notes: form.notes,
        photo, // File object or null — parent decides how/when to upload
        documents: docs // { aadhaar, pan, license, cert } File objects — parent uploads after create
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to add technician.");
    } finally {
      setSaving(false);
    }
  };
 
  return <Modal open={open} onClose={onClose} title="👷 Add New Technician" width={700}>
      <div className="ap-modals-108">
        <div onClick={() => document.getElementById("tech-photo-input")?.click()} className="ap-modals-109">
          {photo ? <img src={URL.createObjectURL(photo)} alt="avatar" className="ap-modals-110" /> : <span className="ap-modals-111">👤</span>}
        </div>
        <input id="tech-photo-input" type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} className="ap-modals-112" />
        <div>
          <div className="ap-modals-113">Profile Photo</div>
          <div className="ap-modals-114">JPG or PNG · Max 2 MB</div>
          <button type="button" onClick={() => document.getElementById("tech-photo-input")?.click()} className="ap-modals-115">
            {photo ? "✏️ Change" : "+ Upload"}
          </button>
        </div>
      </div>
 
      <SectionHeads title="Basic Information" icon="🪪" />
      <div className="ap-modals-119">
        <FRow label="Employee ID">
          <div className="ap-modals-120">
            <div className="ap-modals-121">TECH#</div>
            <input placeholder="Auto" disabled style={{ fontFamily: FONTS?.mono || FONTS.sans }} className="ap-modals-122" />
          </div>
        </FRow>
        <FRow label="Salutation">
          <FSelect value={form.salutation} onChange={set("salutation")}>
            <option value="">--</option>
            <option>Mr.</option><option>Ms.</option><option>Mrs.</option><option>Dr.</option>
          </FSelect>
        </FRow>
        <FRow label="Full Name *">
          <FInput placeholder="e.g. Ravi Kumar" value={form.fullName} onChange={set("fullName")} />
        </FRow>
        <FRow label="Role *">
          <DynamicSelect options={roles} value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} onAddOption={handleAdd("roles", "role")} addLabel="Role" addPlaceholder="e.g. Master Technician, HVAC Engineer…" />
        </FRow>
        <FRow label="Department">
          <DynamicSelect options={departments} value={form.department} onChange={v => setForm(f => ({ ...f, department: v }))} onAddOption={handleAdd("departments", "department")} addLabel="Department" addPlaceholder="e.g. VRF Premium, Ducting, Solar HVAC…" />
        </FRow>
        <FRow label="Employment Type">
          <DynamicSelect options={employmentTypes} value={form.employmentType} onChange={v => setForm(f => ({ ...f, employmentType: v }))} onAddOption={handleAdd("employmentTypes", "employmentType")} addLabel="Employment Type" addPlaceholder="e.g. Seasonal, On-call, Sub-contractor…" />
        </FRow>
        <FRow label="Gender">
          <FSelect value={form.gender} onChange={set("gender")}>
            <option value="">Select…</option><option>Male</option><option>Female</option><option>Other</option>
          </FSelect>
        </FRow>
        <FRow label="Date of Birth">
          <FInput type="date" value={form.dob} onChange={set("dob")} />
        </FRow>
        <FRow label="Blood Group">
          <FSelect value={form.bloodGroup} onChange={set("bloodGroup")}>
            <option value="">Select…</option>
            {["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"].map(g => <option key={g}>{g}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Marital Status">
          <FSelect value={form.maritalStatus} onChange={set("maritalStatus")}>
            <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
          </FSelect>
        </FRow>
        <FRow label="Nationality">
          <FInput placeholder="Indian" value={form.nationality} onChange={set("nationality")} />
        </FRow>
        <FRow label="Religion / Category">
          <FSelect value={form.religionCategory} onChange={set("religionCategory")}>
            <option value="">Optional…</option>
            <option>General</option><option>OBC</option><option>SC/ST</option><option>EWS</option>
          </FSelect>
        </FRow>
      </div>
 
      <SectionHeads title="Contact Details" icon="📞" />
      <div className="ap-modals-123">
        <FRow label="Mobile / WhatsApp *">
          <FInput type="tel" placeholder="+91 XXXXX XXXXX" value={form.mobile} onChange={set("mobile")} />
        </FRow>
        <FRow label="Alternate Phone">
          <FInput type="tel" placeholder="+91 XXXXX XXXXX" value={form.altPhone} onChange={set("altPhone")} />
        </FRow>
        <FRow label="Email">
          <FInput type="email" placeholder="name@cooltech.com" value={form.email} onChange={set("email")} />
        </FRow>
        <FRow label="Personal Email">
          <FInput type="email" placeholder="personal@gmail.com" value={form.personalEmail} onChange={set("personalEmail")} />
        </FRow>
        <FRow label="Emergency Contact Name">
          <FInput placeholder="e.g. Suresh Kumar (Father)" value={form.emergencyName} onChange={set("emergencyName")} />
        </FRow>
        <FRow label="Emergency Contact Phone">
          <FInput type="tel" placeholder="+91 XXXXX XXXXX" value={form.emergencyPhone} onChange={set("emergencyPhone")} />
        </FRow>
      </div>
 
      <SectionHeads title="Address" icon="🏠" />
      <FRow label="Street / Flat / Building">
        <FInput placeholder="e.g. Flat 4B, Green Apartments, MG Road" value={form.street} onChange={set("street")} />
      </FRow>
      <AddressFields prefix="tech_" value={addr} onChange={setAddr} />
 
      <SectionHeads title="Job Details" icon="💼" />
      <div className="ap-modals-124">
        <FRow label="Join Date *">
          <FInput type="date" value={form.joinDate} onChange={set("joinDate")} />
        </FRow>
        <FRow label="Probation End Date">
          <FInput type="date" value={form.probationEnd} onChange={set("probationEnd")} />
        </FRow>
        <FRow label="Status">
          <FSelect value={form.status} onChange={set("status")}>
            <option value="available">available</option><option value="busy">busy</option>
            <option value="off">off</option><option value="on-leave">on-leave</option>
          </FSelect>
        </FRow>
        <FRow label="Basic Salary (₹) *">
          <FInput type="number" placeholder="22000" value={form.basicSalary} onChange={set("basicSalary")} />
        </FRow>
        <FRow label="Daily Allowance (₹)">
          <FInput type="number" placeholder="200" value={form.dailyAllowance} onChange={set("dailyAllowance")} />
        </FRow>
        <FRow label="Overtime Rate (₹/hr)">
          <FInput type="number" placeholder="150" value={form.overtimeRate} onChange={set("overtimeRate")} />
        </FRow>
        <FRow label="Reporting To">
          <DynamicSelect options={reportingTo} value={form.reportingTo} onChange={v => setForm(f => ({ ...f, reportingTo: v }))} onAddOption={handleAdd("reportingTo", "reportingTo")} addLabel="Reporting To" addPlaceholder="e.g. Regional Manager, Senior Supervisor…" />
        </FRow>
        <FRow label="Service Area *">
          <FInput placeholder="e.g. Bengaluru South" value={form.serviceArea} onChange={set("serviceArea")} />
        </FRow>
        <FRow label="Work Shift">
          <FSelect value={form.workShift} onChange={set("workShift")}>
            <option>Morning (8 AM – 5 PM)</option><option>Afternoon (12 PM – 9 PM)</option>
            <option>Flexible</option><option>On-call</option>
          </FSelect>
        </FRow>
      </div>
 
      <SectionHeads title="AC Skills & Certifications" icon="❄️" />
      <div className="ap-modals-125">
        <FRow label="Skills (comma separated)">
          <FInput placeholder="Split, VRF, Inverter, Cassette, Chiller" value={form.skills} onChange={set("skills")} />
        </FRow>
        <FRow label="Experience (Years)">
          <FInput type="number" placeholder="3" value={form.experienceYears} onChange={set("experienceYears")} />
        </FRow>
        <FRow label="AC Brands Expertise">
          <FInput placeholder="e.g. Daikin, Voltas, Samsung, LG, Carrier" value={form.brandsExpertise} onChange={set("brandsExpertise")} />
        </FRow>
        <FRow label="Specialization">
          <FSelect value={form.specialization} onChange={set("specialization")}>
            <option>General Service</option><option>Installation & Commissioning</option>
            <option>VRF / VRV Systems</option><option>Chiller Plants</option>
            <option>Duct / Central AC</option><option>Refrigerant Handling</option>
          </FSelect>
        </FRow>
        <FRow label="HVAC Certification">
          <FSelect value={form.hvacCert} onChange={set("hvacCert")}>
            <option value="">None / Not certified</option>
            <option>RAC Technician (ITI)</option><option>HVAC Diploma</option>
            <option>ASHRAE Certified</option><option>CAREL Certified</option>
            <option>OEM Trained (Daikin / Carrier)</option>
          </FSelect>
        </FRow>
        <FRow label="Certification No. / Expiry">
          <FInput placeholder="e.g. RAC-2021-09876  |  Exp: 12-2027" value={form.certNoExpiry} onChange={set("certNoExpiry")} />
        </FRow>
      </div>
 
      <SectionHeads title="Vehicle / Asset" icon="🏍️" />
      <div className="ap-modals-126">
        <FRow label="Vehicle Type">
          <DynamicSelect options={vehicleTypes} value={form.vehicleType} onChange={v => setForm(f => ({ ...f, vehicleType: v }))} onAddOption={handleAdd("vehicleTypes", "vehicleType")} addLabel="Vehicle Type" addPlaceholder="e.g. Three-Wheeler, Electric Bike…" />
        </FRow>
        <FRow label="Vehicle Reg. No.">
          <FInput placeholder="KA01AB1234" value={form.vehicleRegNo} onChange={set("vehicleRegNo")} />
        </FRow>
        <FRow label="Driving Licence No.">
          <FInput placeholder="KA2020XXXX" value={form.drivingLicenceNo} onChange={set("drivingLicenceNo")} />
        </FRow>
      </div>
 
      <SectionHeads title="Identity Documents" icon="📄" />
      <div className="ap-modals-127">
        <FRow label="Aadhaar Number">
          <FInput placeholder="XXXX  XXXX  XXXX" maxLength={14} value={form.aadhaarNumber} onChange={set("aadhaarNumber")} />
        </FRow>
        <FRow label="PAN Number">
          <FInput placeholder="ABCDE1234F" maxLength={10} value={form.panNumber} onChange={set("panNumber")} className="ap-modals-128" />
        </FRow>
      </div>
      <div className="ap-modals-129">
        <div>
          <div className="ap-modals-130">AADHAAR CARD UPLOAD <span className="ap-modals-131">*</span></div>
          <div onClick={() => document.getElementById("aadhaar-upload")?.click()} className="ap-modals-132">
            <input id="aadhaar-upload" type="file" accept="image/*,application/pdf" onChange={e => setDocs(d => ({ ...d, aadhaar: e.target.files?.[0] || null }))} className="ap-modals-133" />
            <div className="ap-modals-134">🪪</div>
            <div className="ap-modals-135">{docs.aadhaar ? docs.aadhaar.name : "Upload Aadhaar Card"}</div>
            <div className="ap-modals-136">Front &amp; Back · JPG, PNG or PDF<br />Max 5 MB</div>
          </div>
        </div>
        <div>
          <div className="ap-modals-137">PAN CARD UPLOAD <span className="ap-modals-138">*</span></div>
          <div onClick={() => document.getElementById("pan-upload")?.click()} className="ap-modals-139">
            <input id="pan-upload" type="file" accept="image/*,application/pdf" onChange={e => setDocs(d => ({ ...d, pan: e.target.files?.[0] || null }))} className="ap-modals-140" />
            <div className="ap-modals-141">💳</div>
            <div className="ap-modals-142">{docs.pan ? docs.pan.name : "Upload PAN Card"}</div>
            <div className="ap-modals-143">Clear scan / photo<br />JPG, PNG or PDF · Max 5 MB</div>
          </div>
        </div>
      </div>
      <div className="ap-modals-144">
        <FRow label="Driving Licence Upload (optional)">
          <FileUploadField label="Driving Licence" icon="🏍️" hint="JPG, PNG or PDF · Max 5 MB" onFile={f => setDocs(d => ({ ...d, license: f }))} />
        </FRow>
        <FRow label="HVAC Certification Upload (optional)">
          <FileUploadField label="Certification" icon="📜" hint="JPG, PNG or PDF · Max 5 MB" onFile={f => setDocs(d => ({ ...d, cert: f }))} />
        </FRow>
      </div>
 
      <SectionHeads title="Bank Details (for Salary)" icon="🏦" />
      <div className="ap-modals-145">
        <FRow label="Account Holder Name">
          <FInput placeholder="As per bank account" value={form.accountHolder} onChange={set("accountHolder")} />
        </FRow>
        <FRow label="Bank Name">
          <DynamicSelect options={["Select bank…", ...banks]} value={form.bank || "Select bank…"} onChange={v => setForm(f => ({ ...f, bank: v === "Select bank…" ? "" : v }))} onAddOption={v => { onAddLookup?.("banks", v); setForm(f => ({ ...f, bank: v })); }} addLabel="Bank" addPlaceholder="e.g. Federal Bank, IDFC First, Jana Small Finance…" />
        </FRow>
        <FRow label="Account Number">
          <FInput placeholder="XXXXXXXXXXXXXXXX" value={form.accountNumber} onChange={set("accountNumber")} />
        </FRow>
        <FRow label="IFSC Code">
          <FInput placeholder="SBIN0001234" value={form.ifsc} onChange={set("ifsc")} className="ap-modals-146" />
        </FRow>
        <FRow label="Account Type">
          <FSelect value={form.accountType} onChange={set("accountType")}>
            <option>Savings</option><option>Current</option>
          </FSelect>
        </FRow>
        <FRow label="UPI ID (optional)">
          <FInput placeholder="name@upi" value={form.upiId} onChange={set("upiId")} />
        </FRow>
      </div>
 
      <SectionHeads title="System Access & Notifications" icon="🔐" />
      <div className="ap-modals-147">
        <FRow label="App Login Allowed">
          <ToggleField value={loginAllowed} onChange={setLoginAllowed} onLabel="Yes – grant app access" offLabel="No – field only" />
        </FRow>
        <FRow label="Email Notifications">
          <ToggleField value={emailNotif} onChange={setEmailNotif} onLabel="Yes – send emails" offLabel="No emails" />
        </FRow>
        <FRow label="WhatsApp Notifications">
          <ToggleField value={whatsappNotif} onChange={setWhatsappNotif} onLabel="Yes – WhatsApp alerts" offLabel="No WhatsApp" />
        </FRow>
      </div>
      {loginAllowed && <div className="ap-modals-148">
          <FRow label="Temporary Password *">
            <FInput type="password" placeholder="Min 8 characters" value={form.tempPassword} onChange={set("tempPassword")} />
          </FRow>
          <FRow label="User Role">
            <FSelect value={form.userRole} onChange={set("userRole")}>
              <option>Technician (Field)</option><option>Senior Technician</option><option>Supervisor</option>
            </FSelect>
          </FRow>
        </div>}
 
      <SectionHeads title="Internal Notes" icon="📝" />
      <FRow label="Notes / Remarks">
        <textarea placeholder="Any internal notes about this technician…" rows={3} value={form.notes} onChange={set("notes")} className="ap-modals-149" />
      </FRow>
 
      {error && <div className="ap-modals-60">{error}</div>}
 
      <div className="ap-modals-150">
        <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={saving}>{saving ? "Adding…" : "Add Technician"}</FBtn>
      </div>
    </Modal>;
};

// ─── Remaining modals (unchanged) ─────────────────────────────────────────────

const CATEGORY_OPTIONS = ['Fuel', 'Tools', 'Parts', 'Training', 'Office', 'Miscellaneous', 'Other'];
const todayISO = () => new Date().toISOString().slice(0, 10);

// FIX: fully controlled form + working upload box + `technicians` passed as a prop
const AddExpenseModal = ({
  open,
  onClose,
  onSave,
  technicians = [],
  expenseCategories: expenseCategoryOptions = [],
  onAddExpenseCategory
}) => {
  const expenseCategoryList = expenseCategoryOptions.length ? expenseCategoryOptions : CATEGORY_OPTIONS;
  const [form, setForm] = useState({
    category: expenseCategoryList[0],
    technician: '',
    // technician _id, if a real technician is picked
    techName: 'Admin',
    amount: '',
    date: todayISO(),
    description: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const handleTechChange = e => {
    const val = e.target.value;
    if (val === 'admin') {
      set('technician', '');
      set('techName', 'Admin');
      return;
    }
    const t = technicians.find(t => String(t.id ?? t._id) === val);
    set('technician', val);
    set('techName', t?.name ?? '');
  };
  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (file) setReceiptFile(file);
  };
  const handleSubmit = async () => {
    setError('');
    if (!form.description.trim()) return setError('Description is required.');
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount.');
    setSaving(true);
    try {
      // Parent's onSave is responsible for the actual API calls, e.g.:
      //   const created = await expensesApi.create({ category, technician, techName, amount, date, description });
      //   if (receiptFile) {
      //     const fd = new FormData(); fd.append('receipt', receiptFile);
      //     await expensesApi.uploadReceipt(created._id ?? created.data._id, fd);
      //   }
      await onSave({
        category: form.category,
        technician: form.technician || undefined,
        techName: form.techName,
        amount: Number(form.amount),
        date: form.date,
        description: form.description.trim(),
        receiptFile // File object or null — let the parent decide how/when to upload it
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="💸 Add Expense Claim">
      <div className="ap-modals-151">
        <FRow label="Category">
          <DynamicSelect options={expenseCategoryList} value={form.category} onChange={v => set('category', v)} onAddOption={v => onAddExpenseCategory?.(v)} addLabel="Expense Category" addPlaceholder="e.g. Software, Insurance…" />
        </FRow>
 
        <FRow label="Technician">
          <FSelect value={form.technician || 'admin'} onChange={handleTechChange}>
            <option value="admin">Admin</option>
            {technicians.map(t => <option key={t.id ?? t._id} value={t.id ?? t._id}>{t.name}</option>)}
          </FSelect>
        </FRow>
 
        <FRow label="Amount (₹)">
          <FInput type="number" min="0" placeholder="500" value={form.amount} onChange={e => set('amount', e.target.value)} />
        </FRow>
 
        <FRow label="Date">
          <FInput type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </FRow>
      </div>
 
      <FRow label="Description">
        <FTextarea placeholder="Describe the expense…" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
      </FRow>
 
      <FRow label="Receipt Attached">
        <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="ap-modals-152" />
        <div onClick={() => fileInputRef.current?.click()} className="ap-modals-153">
          <div className="ap-modals-154">📎</div>
          <div className="ap-modals-155">
            {receiptFile ? `Selected: ${receiptFile.name} (click to replace)` : "Click to upload receipt (JPG, PDF)"}
          </div>
        </div>
      </FRow>
 
      {error && <div className="ap-modals-156">{error}</div>}
 
      <div className="ap-modals-157">
        <FBtn secondary onClick={onClose}>Cancel</FBtn>
        <FBtn onClick={handleSubmit} disabled={saving}>{saving ? "Submitting…" : "Submit Claim"}</FBtn>
      </div>
    </Modal>;
};

// Shared "Product / Item Category" default set — used by AddInventoryModal,
// NewPOModal, NewSOModal, and NewSupplierModal. Previously 4 separate hardcoded
// lists that had genuinely diverged (Inventory/Supplier: Refrigerant/Filter/
// Electrical/Piping/Lubricant/Tools; PO: a longer parts-oriented list; SO: a
// product/package-oriented list like "Split AC"/"AMC Package"). Merged into one
// superset, deduping near-synonyms (Filter/Mesh → Filter, Tool → Tools, Piping →
// Copper Pipe), so an item added from any one of these modals shows up in all four.
const AddInventoryModal = ({
  open,
  onClose,
  onSave,
  itemCategories: itemCategoryOptions = [],
  onAddItemCategory,
  inventoryUnits: inventoryUnitOptions = [],
  onAddInventoryUnit
}) => {
  const ITEM_CATEGORY_DEFAULTS = ["Refrigerant", "Compressor", "Electrical / PCB", "Filter", "Capacitor", "Copper Pipe", "Drain Pipe", "Gas Valve", "Fan Motor", "Remote / Sensor", "Lubricant", "Tools", "Split AC", "Window AC", "Cassette AC", "Portable AC", "Duct AC", "Installation Kit", "Stabilizer", "AMC Package", "Extended Warranty", "Spare Part", "Other"];
  const INVENTORY_UNIT_DEFAULTS = ["Cylinder", "Piece", "Meter", "Litre", "Set"];
  const itemCategoryList = itemCategoryOptions.length ? itemCategoryOptions : ITEM_CATEGORY_DEFAULTS;
  const inventoryUnitList = inventoryUnitOptions.length ? inventoryUnitOptions : INVENTORY_UNIT_DEFAULTS;
  const [liveSuppliers, setLiveSuppliers] = useState([]);
  const [form, setForm] = useState({
    name: "", category: itemCategoryList[0] || "", sku: "", unit: inventoryUnitList[0] || "",
    quantity: "", reorderLevel: "", unitCost: "", supplier: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setForm({ name: "", category: itemCategoryList[0] || "", sku: "", unit: inventoryUnitList[0] || "", quantity: "", reorderLevel: "", unitCost: "", supplier: "" });
    setError("");
    suppliersApi.list({ limit: 200 }).then(r => setLiveSuppliers(r.data ?? [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setError("");
    if (!form.name.trim()) return setError("Item name is required.");
    setSaving(true);
    try {
      const sup = liveSuppliers.find(s => s._id === form.supplier);
      await onSave({
        name: form.name.trim(),
        category: form.category,
        sku: form.sku,
        unit: form.unit,
        quantity: Number(form.quantity) || 0,
        reorderLevel: Number(form.reorderLevel) || 0,
        unitCost: Number(form.unitCost) || 0,
        supplier: form.supplier || undefined,
        supplierName: sup?.name || ""
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to add inventory item.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="📦 Add Inventory Item">
      <div className="ap-modals-158">
        <FRow label="Item Name *">
          <FInput placeholder="R-32 Refrigerant" value={form.name} onChange={set("name")} />
        </FRow>
        <FRow label="Category">
          <DynamicSelect options={itemCategoryList} value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} onAddOption={v => onAddItemCategory?.(v)} addLabel="Item Category" addPlaceholder="e.g. Insulation, Sensors…" />
        </FRow>
        <FRow label="SKU">
          <FInput placeholder="REF-R32" value={form.sku} onChange={set("sku")} />
        </FRow>
        <FRow label="Unit">
          <DynamicSelect options={inventoryUnitList} value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} onAddOption={v => onAddInventoryUnit?.(v)} addLabel="Unit" addPlaceholder="e.g. Box, Roll…" />
        </FRow>
        <FRow label="Quantity">
          <FInput type="number" placeholder="10" value={form.quantity} onChange={set("quantity")} />
        </FRow>
        <FRow label="Reorder Level">
          <FInput type="number" placeholder="5" value={form.reorderLevel} onChange={set("reorderLevel")} />
        </FRow>
        <FRow label="Unit Cost (₹)">
          <FInput type="number" placeholder="2800" value={form.unitCost} onChange={set("unitCost")} />
        </FRow>
        <FRow label="Supplier">
          <FSelect value={form.supplier} onChange={set("supplier")}>
            <option value="">-- Select supplier --</option>
            {liveSuppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </FSelect>
        </FRow>
      </div>
      {error && <div className="ap-modals-60">{error}</div>}
      <div className="ap-modals-159">
        <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={saving}>{saving ? "Adding…" : "Add Item"}</FBtn>
      </div>
    </Modal>;
};
const AddLeadSourceModal = ({
  onClose,
  onSave
}) => {
  const [value, setValue] = useState("");
  return createPortal(<div onClick={onClose} className="ap-modals-160">
      <div onClick={e => e.stopPropagation()} className="ap-modals-161">
        <div className="ap-modals-162">
          <div className="ap-modals-163">
            Add Lead Source
          </div>
          <button onClick={onClose} className="ap-modals-164">
            ×
          </button>
        </div>
        <div className="ap-modals-165">
          <div className="ap-modals-166">
            Lead Source <span className="ap-modals-167">*</span>
          </div>
          <input autoFocus value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => {
          if (e.key === "Enter" && value.trim()) {
            onSave(value.trim());
            onClose();
          }
        }} placeholder="e.g. Instagram, Trade Fair…" style={{
          border: `1.5px solid ${value ? COLORS.brand : COLORS.border}`
        }} className="ap-modals-168" />
        </div>
        <div className="ap-modals-169">
          <button onClick={onClose} className="ap-modals-170">
            Close
          </button>
          <button onClick={() => {
          if (value.trim()) {
            onSave(value.trim());
            onClose();
          }
        }} disabled={!value.trim()} style={{
          background: value.trim() ? "linear-gradient(135deg,var(--brand),var(--brand-dark))" : "var(--border)",
          color: value.trim() ? "white" : "var(--text-muted)",
          cursor: value.trim() ? "pointer" : "not-allowed"
        }} className="ap-modals-171">
            ✓ Save
          </button>
        </div>
      </div>
    </div>, document.body);
};
const NewLeadModal = ({
  open,
  onClose,
  onSave,
  sources = [],
  onAddSource,
  customerTypes: customerTypeOptions = [],
  onAddCustomerType
}) => {
  const [showAddSource, setShowAddSource] = useState(false);
  const SOURCES = sources.length ? sources : ["Referral", "Google Ad", "Walk-in", "Instagram", "LinkedIn", "Cold Call", "Website", "Other"];
  // Reuses the same option set as NewCustomerModal's Customer Type, rather than
  // a separate hardcoded list — the two concepts are the same underlying idea.
  const customerTypeList = customerTypeOptions.length ? customerTypeOptions : ["Residential", "Commercial", "Industrial"];
  const [form, setForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    type: "Residential",
    units: 2,
    source: "Other",
    value: "",
    assignedTo: "",
    notes: ""
  });
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const handleAddSource = newSource => {
    onAddSource?.(newSource);
    setForm(f => ({
      ...f,
      source: newSource
    }));
  };
  const handleSave = () => {
    if (!form.name.trim()) {
      alert("Company / Name is required");
      return;
    }
    onSave({
      name: form.name.trim(),
      contact: form.contact,
      phone: form.phone,
      email: form.email,
      type: form.type,
      units: Number(form.units) || 1,
      source: form.source,
      value: Number(form.value) || 0,
      assignedTo: form.assignedTo,
      notes: form.notes,
      stage: "new",
      score: 0,
      temp: "cold"
    });
  };
  return <>
      <Modal open={open} onClose={onClose} title="🎯 Add New Lead">
        <div className="ap-modals-172">
          <FRow label="Company / Name *">
            <FInput placeholder="ABC Apartments" value={form.name} onChange={set("name")} />
          </FRow>
          <FRow label="Contact Person">
            <FInput placeholder="Mr. Sharma" value={form.contact} onChange={set("contact")} />
          </FRow>
          <FRow label="Phone">
            <FInput type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set("phone")} />
          </FRow>
          <FRow label="Email">
            <FInput type="email" placeholder="email@example.com" value={form.email} onChange={set("email")} />
          </FRow>
          <FRow label="Type">
            <DynamicSelect options={customerTypeList} value={form.type} onChange={v => setForm(f => ({
            ...f,
            type: v
          }))} onAddOption={v => onAddCustomerType?.(v)} addLabel="Customer Type" addPlaceholder="e.g. Government, Hospitality…" />
          </FRow>
          <FRow label="AC Units">
            <FInput type="number" placeholder="2" value={form.units} onChange={set("units")} />
          </FRow>
          <FRow label="Source">
            <div className="ap-modals-173">
              <select value={form.source} onChange={set("source")} className="ap-modals-174">
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => setShowAddSource(true)} title="Add new source" className="ap-modals-175">
                +
              </button>
            </div>
          </FRow>
          <FRow label="Potential Value (₹)">
            <FInput type="number" placeholder="40000" value={form.value} onChange={set("value")} />
          </FRow>
          <FRow label="Assigned To">
            <FInput placeholder="Rajesh P." value={form.assignedTo} onChange={set("assignedTo")} />
          </FRow>
        </div>
        <FRow label="Notes">
          <FTextarea placeholder="Initial enquiry details…" rows={2} value={form.notes} onChange={set("notes")} />
        </FRow>
        <div className="ap-modals-176">
          <FBtn secondary onClick={onClose}>
            Cancel
          </FBtn>
          <FBtn onClick={handleSave}>Create Lead</FBtn>
        </div>
      </Modal>
      {showAddSource && <AddLeadSourceModal onClose={() => setShowAddSource(false)} onSave={handleAddSource} />}
    </>;
};

// const NewPOModal = ({ open, onClose, onSave }) => (
//   <Modal open={open} onClose={onClose} title="🛒 New Purchase Order">
//     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//       <FRow label="Supplier"><FSelect><option>RefriTech Pvt Ltd</option><option>FilterPro Industries</option><option>ElecWorld Distributors</option><option>CopperCo Metals</option><option>OilMax Lubricants</option></FSelect></FRow>
//       <FRow label="Expected Delivery"><FInput type="date" defaultValue="2026-03-08" /></FRow>
//     </div>
//     <FRow label="Items (one per line)"><FTextarea placeholder="R-32 Refrigerant × 10 @ ₹2800&#10;R-410A Refrigerant × 5 @ ₹3200" rows={4} /></FRow>
//     <FRow label="Notes"><FTextarea placeholder="Any special instructions…" rows={2} /></FRow>
//     <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
//       <FBtn secondary onClick={onClose}>Cancel</FBtn>
//       <FBtn onClick={() => onSave({})}>Create PO</FBtn>
//     </div>
//   </Modal>
// );

// ─── NewPOModal ───────────────────────────────────────────────────────────────
const NewPOModal = ({
  open,
  onClose,
  onSave,
  itemCategories: itemCategoryOptions = [],
  onAddItemCategory,
  poTypes: poTypeOptions = [],
  onAddPoType
}) => {
  const ITEM_CATEGORY_DEFAULTS = ["Refrigerant", "Compressor", "Electrical / PCB", "Filter", "Capacitor", "Copper Pipe", "Drain Pipe", "Gas Valve", "Fan Motor", "Remote / Sensor", "Lubricant", "Tools", "Split AC", "Window AC", "Cassette AC", "Portable AC", "Duct AC", "Installation Kit", "Stabilizer", "AMC Package", "Extended Warranty", "Spare Part", "Other"];
  const PO_TYPE_DEFAULTS = ["Refrigerant Restock", "Spare Parts", "Tools & Equipment", "Consumables", "Compressor Unit", "PCB / Electrical", "Piping & Fittings", "Miscellaneous"];
  const itemCategoryList = itemCategoryOptions.length ? itemCategoryOptions : ITEM_CATEGORY_DEFAULTS;
  const poTypeList = poTypeOptions.length ? poTypeOptions : PO_TYPE_DEFAULTS;
  const [poType, setPoType] = useState(poTypeList[0] || "");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [liveSuppliers, setLiveSuppliers] = useState([]);
  const [liveJobs, setLiveJobs] = useState([]);
  const [liveTechs, setLiveTechs] = useState([]);
  const [supplier, setSupplier] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("2026-04-26");
  const [urgency, setUrgency] = useState("Normal");
  const [linkedJob, setLinkedJob] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Immediate / Cash");
  const [deliveryLocation, setDeliveryLocation] = useState("Main Warehouse");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setPoType(poTypeList[0] || "");
    setSupplier(""); setExpectedDelivery("2026-04-26"); setUrgency("Normal");
    setLinkedJob(""); setRequestedBy(""); setPaymentTerms("Immediate / Cash");
    setDeliveryLocation("Main Warehouse"); setNotes("");
    setError("");
    suppliersApi.list({ limit: 200 }).then(r => setLiveSuppliers(r.data ?? [])).catch(() => {});
    jobsApi.list({ limit: 200 }).then(r => setLiveJobs(r.data ?? [])).catch(() => {});
    techsApi.list({ limit: 200 }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const [items, setItems] = useState([{ id: 1, name: "", category: "Refrigerant", qty: "", price: "" }]);
  const [gst, setGst] = useState(18);
  const addItem = () => setItems(prev => [...prev, { id: Date.now(), name: "", category: "Refrigerant", qty: "", price: "" }]);
  const removeItem = id => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id, field, value) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0), 0);
  const gstAmt = subtotal * gst / 100;
  const total = subtotal + gstAmt;
  const fmt = n => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const handleSave = async () => {
    setError("");
    if (!supplier) return setError("Please select a supplier.");
    const validItems = items.filter(i => i.name.trim());
    if (!validItems.length) return setError("Add at least one line item.");
    setSaving(true);
    try {
      const sup = liveSuppliers.find(s => s._id === supplier);
      const req = liveTechs.find(t => t._id === requestedBy);
      await onSave({
        supplier, supplierName: sup?.name || "",
        poType, items: validItems, gst, subtotal, gstAmt, total,
        expectedDelivery, urgency,
        linkedJob: linkedJob || undefined,
        requestedBy: requestedBy || undefined,
        requestedByName: req?.name || "Admin / Store",
        paymentTerms, deliveryLocation, notes
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create purchase order.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="🛒 New Purchase Order" width={680}>
      <SectionHead title="Supplier & Order Info" />
      <div className="ap-modals-177">
        <FRow label="Supplier *">
          <FSelect value={supplier} onChange={e => setSupplier(e.target.value)}>
            <option value="">Select supplier…</option>
            {liveSuppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </FSelect>
        </FRow>
        <FRow label="PO Type *">
          <DynamicSelect options={poTypeList} value={poType} onChange={setPoType} onAddOption={v => onAddPoType?.(v)} addLabel="PO Type" addPlaceholder="e.g. Warranty Return, Emergency Restock…" />
        </FRow>
        <FRow label="Expected Delivery">
          <FInput type="date" value={expectedDelivery} onChange={e => setExpectedDelivery(e.target.value)} />
        </FRow>
        <FRow label="Urgency">
          <FSelect value={urgency} onChange={e => setUrgency(e.target.value)}>
            <option>Normal</option><option>High – Next Day</option><option>Urgent – Same Day</option><option>Low – Flexible</option>
          </FSelect>
        </FRow>
        <FRow label="Linked Job / Work Order">
          <FSelect value={linkedJob} onChange={e => setLinkedJob(e.target.value)}>
            <option value="">-- None (stock order) --</option>
            {liveJobs.map(j => <option key={j._id} value={j._id}>{j.jobId || j._id}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Requested By">
          <FSelect value={requestedBy} onChange={e => setRequestedBy(e.target.value)}>
            <option value="">Admin / Store</option>
            {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </FSelect>
        </FRow>
      </div>
 
      <SectionHead title="Line Items" />
      <div className="line-items-scroll">
        <div className="ap-modals-178">
          <span className="ap-modals-179">Item / Description</span>
          <span className="ap-modals-180">
            Category
            <button type="button" title="Add new category" onClick={() => setShowAddCategory(true)} className="ap-modals-181">＋</button>
          </span>
          <span className="ap-modals-179">Qty</span>
          <span className="ap-modals-179">Unit Price (₹)</span>
          <span />
        </div>
        <div className="ap-modals-182">
          {items.map(item => <div key={item.id} className="ap-modals-183">
              <input placeholder="Item name / description" value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} className="ap-modals-184" />
              <select value={item.category} onChange={e => updateItem(item.id, "category", e.target.value)} className="ap-modals-185">
                {itemCategoryList.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="0" value={item.qty} onChange={e => updateItem(item.id, "qty", e.target.value)} className="ap-modals-184" />
              <input type="number" placeholder="0" value={item.price} onChange={e => updateItem(item.id, "price", e.target.value)} className="ap-modals-184" />
              <button onClick={() => removeItem(item.id)} style={{ opacity: items.length === 1 ? "0.3" : "1" }} disabled={items.length === 1} className="ap-modals-186">×</button>
            </div>)}
        </div>
      </div>
      <button onClick={addItem} className="ap-modals-187">+ Add Item</button>
 
      <div className="ap-modals-188">
        <div className="ap-modals-189">
          <div className="ap-modals-190">SUBTOTAL</div>
          <div className="ap-modals-191">{fmt(subtotal)}</div>
        </div>
        <div className="ap-modals-192">
          <div className="ap-modals-193">
            <span className="ap-modals-194">GST</span>
            <select value={gst} onChange={e => setGst(Number(e.target.value))} className="ap-modals-195">
              {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
          <div className="ap-modals-196">{fmt(gstAmt)}</div>
        </div>
        <div className="ap-modals-197">
          <div className="ap-modals-198">TOTAL</div>
          <div className="ap-modals-199">{fmt(total)}</div>
        </div>
      </div>
 
      <SectionHead title="Payment & Delivery" />
      <div className="ap-modals-200">
        <FRow label="Payment Terms">
          <FSelect value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
            <option>Immediate / Cash</option><option>50% Advance + 50% on Delivery</option>
            <option>Net 7</option><option>Net 15</option><option>Net 30</option><option>Credit Account</option>
          </FSelect>
        </FRow>
        <FRow label="Delivery Location">
          <FSelect value={deliveryLocation} onChange={e => setDeliveryLocation(e.target.value)}>
            <option>Main Warehouse</option><option>Field – Tech Pickup</option><option>Customer Site Direct</option><option>Branch Office</option>
          </FSelect>
        </FRow>
      </div>
 
      <SectionHead title="Notes & Attachment" />
      <FRow label="Notes / Special Instructions">
        <FTextarea placeholder="Packing preferences, brand specifications, delivery instructions, any substitution rules…" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      </FRow>
      <FRow label="Attach Proforma / Supplier Quote">
        <div onClick={() => document.getElementById("po-attach")?.click()} className="ap-modals-201">
          <input id="po-attach" type="file" accept="image/*,application/pdf" className="ap-modals-202" />
          <div className="ap-modals-203">📎</div>
          <div className="ap-modals-204">Click to attach proforma invoice or supplier quote · PDF, JPG · Max 5 MB</div>
        </div>
      </FRow>
 
      {error && <div className="ap-modals-60">{error}</div>}
      <div className="ap-modals-205">
        <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={saving}>{saving ? "Creating…" : "Create PO"}</FBtn>
      </div>
      {showAddCategory && <AddOptionModal label="Item Category" placeholder="e.g. Insulation, Sensors…" onClose={() => setShowAddCategory(false)} onSave={v => onAddItemCategory?.(v)} />}
    </Modal>;
};
const NewSupplierModal = ({
  open,
  onClose,
  onSave,
  itemCategories: itemCategoryOptions = [],
  onAddItemCategory
}) => {
  const ITEM_CATEGORY_DEFAULTS = ["Refrigerant", "Compressor", "Electrical / PCB", "Filter", "Capacitor", "Copper Pipe", "Drain Pipe", "Gas Valve", "Fan Motor", "Remote / Sensor", "Lubricant", "Tools", "Split AC", "Window AC", "Cassette AC", "Portable AC", "Duct AC", "Installation Kit", "Stabilizer", "AMC Package", "Extended Warranty", "Spare Part", "Other"];
  const itemCategoryList = itemCategoryOptions.length ? itemCategoryOptions : ITEM_CATEGORY_DEFAULTS;
  const EMPTY = { name: "", category: itemCategoryList[0] || "", contact: "", phone: "", email: "", paymentTerms: "Immediate", address: "" };
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, category: itemCategoryList[0] || "" });
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setError("");
    if (!form.name.trim()) return setError("Company name is required.");
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        category: form.category,
        contact: form.contact,
        phone: form.phone,
        email: form.email,
        paymentTerms: form.paymentTerms,
        address: form.address
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to add supplier.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="🏭 Add New Supplier">
      <div className="ap-modals-206">
        <FRow label="Company Name *">
          <FInput placeholder="ABC Traders" value={form.name} onChange={set("name")} />
        </FRow>
        <FRow label="Category">
          <DynamicSelect options={itemCategoryList} value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} onAddOption={v => onAddItemCategory?.(v)} addLabel="Item Category" addPlaceholder="e.g. Insulation, Sensors…" />
        </FRow>
        <FRow label="Contact Person">
          <FInput placeholder="Mr. Patel" value={form.contact} onChange={set("contact")} />
        </FRow>
        <FRow label="Phone">
          <FInput type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set("phone")} />
        </FRow>
        <FRow label="Email">
          <FInput type="email" placeholder="sales@supplier.com" value={form.email} onChange={set("email")} />
        </FRow>
        <FRow label="Payment Terms">
          <FSelect value={form.paymentTerms} onChange={set("paymentTerms")}>
            <option>Immediate</option><option>15 days</option><option>30 days</option><option>45 days</option>
          </FSelect>
        </FRow>
      </div>
      <FRow label="Address">
        <FTextarea placeholder="Full address…" rows={2} value={form.address} onChange={set("address")} />
      </FRow>
      {error && <div className="ap-modals-60">{error}</div>}
      <div className="ap-modals-207">
        <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={saving}>{saving ? "Adding…" : "Add Supplier"}</FBtn>
      </div>
    </Modal>;
};

// ─── NewAssetModal ────────────────────────────────────────────────────────────
const VEHICLE_SUBTYPES = ['Service Van', 'Bike (Company)', 'Bike (Own)', 'Pickup Truck', 'Three-Wheeler', 'Other'];
const EQUIPMENT_SUBTYPES = ['Vacuum Pump', 'Recovery Machine', 'Nitrogen Cylinder', 'Manifold Gauge Set', 'Brazing Kit', 'Testing Tool', 'Leak Detector', 'Other'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid', 'N/A'];
const ASSET_STATUSES = ['active', 'maintenance', 'inactive', 'retired'];
const NewAssetModal = ({
  open,
  onClose,
  onSave,
  editAsset = null,
  defaultTab = 'Vehicle',
  vehicleSubtypes: vehicleSubtypeOptions = [],
  onAddVehicleSubtype,
  equipmentSubtypes: equipmentSubtypeOptions = [],
  onAddEquipmentSubtype
}) => {
  const isEditing = !!editAsset?._id;
  const [tab, setTab] = useState(defaultTab);
  const [liveTechs, setLiveTechs] = useState([]);
  const vehicleSubtypeList = vehicleSubtypeOptions.length ? vehicleSubtypeOptions : VEHICLE_SUBTYPES;
  const equipmentSubtypeList = equipmentSubtypeOptions.length ? equipmentSubtypeOptions : EQUIPMENT_SUBTYPES;
  const EMPTY = {
    name: '',
    subType: vehicleSubtypeList[0],
    regNo: '',
    serial: '',
    year: new Date().getFullYear(),
    fuel: 'Petrol',
    km: '',
    value: '',
    purchaseDate: '',
    insuranceExpiry: '',
    warrantyExpiry: '',
    lastServiceDate: '',
    nextServiceDate: '',
    assignedTo: '',
    status: 'active',
    notes: ''
  };
  const [form, setForm] = useState(EMPTY);
  useEffect(() => {
    if (!open) return;
    techsApi.list({
      limit: 200
    }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
  }, [open]);

  // Populate on edit / reset on fresh open
  useEffect(() => {
    if (!open) return;
    if (editAsset) {
      setTab(editAsset.assetType || 'Vehicle');
      setForm({
        name: editAsset.name || '',
        subType: editAsset.subType || (editAsset.assetType === 'Equipment' ? equipmentSubtypeList[0] : vehicleSubtypeList[0]),
        regNo: editAsset.regNo || '',
        serial: editAsset.serial || '',
        year: editAsset.year || '',
        fuel: editAsset.fuel || 'Petrol',
        km: editAsset.km ?? '',
        value: editAsset.value ?? '',
        purchaseDate: editAsset.purchaseDate ? editAsset.purchaseDate.slice(0, 10) : '',
        insuranceExpiry: editAsset.insuranceExpiry ? editAsset.insuranceExpiry.slice(0, 10) : '',
        warrantyExpiry: editAsset.warrantyExpiry ? editAsset.warrantyExpiry.slice(0, 10) : '',
        lastServiceDate: editAsset.lastServiceDate ? editAsset.lastServiceDate.slice(0, 10) : '',
        nextServiceDate: editAsset.nextServiceDate ? editAsset.nextServiceDate.slice(0, 10) : '',
        assignedTo: editAsset.assignedTo?._id || editAsset.assignedTo || '',
        status: editAsset.status || 'active',
        notes: editAsset.notes || ''
      });
    } else {
      setTab(defaultTab);
      setForm({
        ...EMPTY,
        subType: defaultTab === 'Vehicle' ? vehicleSubtypeList[0] : equipmentSubtypeList[0]
      });
    }
  }, [open, editAsset, defaultTab]);
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const switchTab = t => {
    setTab(t);
    setForm(f => ({
      ...f,
      subType: t === 'Vehicle' ? vehicleSubtypeList[0] : equipmentSubtypeList[0]
    }));
  };
  const handleSave = () => {
    if (!form.name.trim()) {
      alert('Asset name is required');
      return;
    }
    if (tab === 'Vehicle' && !form.regNo.trim()) {
      alert('Registration number is required for vehicles');
      return;
    }
    const tech = liveTechs.find(t => t._id === form.assignedTo);
    const payload = {
      name: form.name.trim(),
      assetType: tab,
      subType: form.subType,
      year: Number(form.year) || undefined,
      value: Number(form.value) || 0,
      purchaseDate: form.purchaseDate || undefined,
      assignedTo: form.assignedTo || undefined,
      techName: tech?.name || 'Office',
      status: form.status,
      notes: form.notes,
      lastServiceDate: form.lastServiceDate || undefined,
      nextServiceDate: form.nextServiceDate || undefined,
      ...(tab === 'Vehicle' ? {
        regNo: form.regNo.trim(),
        fuel: form.fuel,
        km: Number(form.km) || 0,
        insuranceExpiry: form.insuranceExpiry || undefined
      } : {
        serial: form.serial.trim(),
        warrantyExpiry: form.warrantyExpiry || undefined
      })
    };
    onSave(payload, editAsset?._id);
  };
  return <Modal open={open} onClose={onClose} title={isEditing ? '✏️ Edit Asset' : '🚗 Add Asset / Vehicle'} width={640}>

      {/* Tabs */}
      <div className="ap-modals-208">
        {['Vehicle', 'Equipment'].map(t => <button key={t} onClick={() => !isEditing && switchTab(t)} disabled={isEditing && tab !== t} style={{
        borderBottom: tab === t ? "2.5px solid var(--brand)" : "2.5px solid transparent",
        color: tab === t ? "var(--brand)" : "var(--text-muted)",
        cursor: isEditing ? "default" : "pointer"
      }} className="ap-modals-209">
            {t === 'Vehicle' ? '🚗 Vehicle' : '🔧 Equipment'}
          </button>)}
      </div>

      <div className="ap-modals-210">
        <FRow label={tab === 'Vehicle' ? 'Vehicle Name *' : 'Equipment Name *'}>
          <FInput placeholder={tab === 'Vehicle' ? 'e.g. Honda Activa – 3' : 'e.g. Vacuum Pump – 2 Stage'} value={form.name} onChange={set('name')} />
        </FRow>
        <FRow label="Sub-Type">
          <DynamicSelect options={tab === 'Vehicle' ? vehicleSubtypeList : equipmentSubtypeList} value={form.subType} onChange={v => setForm(f => ({
          ...f,
          subType: v
        }))} onAddOption={v => tab === 'Vehicle' ? onAddVehicleSubtype?.(v) : onAddEquipmentSubtype?.(v)} addLabel={tab === 'Vehicle' ? 'Vehicle Sub-Type' : 'Equipment Sub-Type'} addPlaceholder={tab === 'Vehicle' ? 'e.g. Van (Rented)…' : 'e.g. Torque Wrench…'} />
        </FRow>

        {tab === 'Vehicle' ? <>
            <FRow label="Reg. Number *">
              <FInput placeholder="KA01AB1234" value={form.regNo} onChange={set('regNo')} />
            </FRow>
            <FRow label="Fuel Type">
              <FSelect value={form.fuel} onChange={set('fuel')}>
                {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
              </FSelect>
            </FRow>
            <FRow label="Current KM">
              <FInput type="number" placeholder="42850" value={form.km} onChange={set('km')} />
            </FRow>
            <FRow label="Insurance Expiry">
              <FInput type="date" value={form.insuranceExpiry} onChange={set('insuranceExpiry')} />
            </FRow>
          </> : <>
            <FRow label="Serial No.">
              <FInput placeholder="e.g. VP-2026-0091" value={form.serial} onChange={set('serial')} />
            </FRow>
            <FRow label="Warranty Expiry">
              <FInput type="date" value={form.warrantyExpiry} onChange={set('warrantyExpiry')} />
            </FRow>
          </>}

        <FRow label="Year">
          <FInput type="number" placeholder="2026" value={form.year} onChange={set('year')} />
        </FRow>
        <FRow label="Value (₹)">
          <FInput type="number" placeholder="95000" value={form.value} onChange={set('value')} />
        </FRow>
        <FRow label="Purchase Date">
          <FInput type="date" value={form.purchaseDate} onChange={set('purchaseDate')} />
        </FRow>
        <FRow label="Assigned To">
          <FSelect value={form.assignedTo} onChange={set('assignedTo')}>
            <option value="">Office (Unassigned)</option>
            {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Last Service Date">
          <FInput type="date" value={form.lastServiceDate} onChange={set('lastServiceDate')} />
        </FRow>
        <FRow label="Next Service Date">
          <FInput type="date" value={form.nextServiceDate} onChange={set('nextServiceDate')} />
        </FRow>
        <FRow label="Status">
          <FSelect value={form.status} onChange={set('status')}>
            {ASSET_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </FSelect>
        </FRow>
      </div>

      <FRow label="Notes">
        <FTextarea placeholder="Any additional notes…" rows={2} value={form.notes} onChange={set('notes')} />
      </FRow>

      <div className="ap-modals-211">
        <FBtn secondary onClick={onClose}>Cancel</FBtn>
        <FBtn onClick={handleSave}>
          {isEditing ? 'Save Changes' : tab === 'Vehicle' ? 'Add Vehicle' : 'Add Equipment'}
        </FBtn>
      </div>
    </Modal>;
};

// const RegisterWarrantyModal = ({ open, onClose, onSave }) => (
//   <Modal open={open} onClose={onClose} title="🛡️ Register Warranty">
//     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//       <FRow label="Customer"><FSelect><option>Sharma Residency</option><option>Meera Iyer</option><option>TechPark Ltd.</option><option>City Mall</option><option>Patel Villa</option></FSelect></FRow>
//       <FRow label="AC Unit Description"><FInput placeholder="Samsung 1.5T Split – Bedroom" /></FRow>
//       <FRow label="Brand"><FInput placeholder="Samsung" /></FRow>
//       <FRow label="Model No."><FInput placeholder="AR18AY3YAWK" /></FRow>
//       <FRow label="Serial No."><FInput placeholder="SAM2026BLR099" /></FRow>
//       <FRow label="Warranty Type"><FSelect><option>Comprehensive</option><option>Compressor</option><option>Parts Only</option><option>Parts & Labour</option></FSelect></FRow>
//       <FRow label="Install Date"><FInput type="date" /></FRow>
//       <FRow label="Warranty End"><FInput type="date" /></FRow>
//       <FRow label="Technician"><FSelect>{technicians.map(t => <option key={t.id}>{t.name}</option>)}</FSelect></FRow>
//     </div>
//     <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
//       <FBtn secondary onClick={onClose}>Cancel</FBtn>
//       <FBtn onClick={() => onSave({})}>Register Warranty</FBtn>
//     </div>
//   </Modal>
// );

// ---------------registerwarrantymodal---------------------------------------//

const PART_TYPES = ['Compressor', 'PCB Board', 'Capacitor', 'Fan Motor', 'Gas Charge', 'IDU/ODU Coil', 'Remote', 'Sensor', 'Other'];
const AC_TYPES = ['Split AC', 'Window AC', 'Cassette AC', 'Ductable', 'VRF', 'Other'];
const UNIT_WARRANTY_TYPES = ['Comprehensive', 'Compressor', 'Parts & Labour', 'Parts Only'];
const PART_WARRANTY_TYPES = ['Manufacturer', 'Dealer', 'AMC covered', 'Extended'];
const EMPTY_FORM = {
  recordType: 'unit',
  // common
  customer: '',
  brand: '',
  model: '',
  serial: '',
  installDate: '',
  warrantyEnd: '',
  type: '',
  notes: '',
  // unit-only
  unit: '',
  acType: '',
  capacity: '',
  technician: '',
  purchaseDate: '',
  invoiceNo: '',
  purchaseSource: '',
  // part-only
  partType: '',
  linkedUnit: '',
  linkedUnitLabel: ''
};
const RegisterWarrantyModal = ({
  open,
  onClose,
  onSave,
  unitOptions = [],
  defaultRecordType = 'unit',
  partTypes: partTypeOptions = [],
  onAddPartType,
  acTypes: acTypeOptions = [],
  onAddAcType,
  unitWarrantyTypes: unitWarrantyTypeOptions = [],
  onAddUnitWarrantyType,
  partWarrantyTypes: partWarrantyTypeOptions = [],
  onAddPartWarrantyType
}) => {
  const partTypeList = partTypeOptions.length ? partTypeOptions : PART_TYPES;
  const acTypeList = acTypeOptions.length ? acTypeOptions : AC_TYPES;
  const unitWarrantyTypeList = unitWarrantyTypeOptions.length ? unitWarrantyTypeOptions : UNIT_WARRANTY_TYPES;
  const partWarrantyTypeList = partWarrantyTypeOptions.length ? partWarrantyTypeOptions : PART_WARRANTY_TYPES;
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    recordType: defaultRecordType
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY_FORM,
        recordType: defaultRecordType
      });
      setError('');
    }
  }, [open, defaultRecordType]);
  if (!open) return null;
  const isPart = form.recordType === 'part';
  const set = key => e => setForm(p => ({
    ...p,
    [key]: e.target.value
  }));
  const label = {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.faint,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 5,
    display: 'block'
  };
  const input = {
    padding: '9px 11px',
    borderRadius: 8,
    border: `1.5px solid ${COLORS.border}`,
    fontSize: 13,
    color: COLORS.h2,
    background: "var(--bg)",
    fontFamily: FONTS.sans,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box'
  };
  const field = children => <div className="ap-modals-212">{children}</div>;
  const handleSubmit = async () => {
    setError('');
    if (!form.customer.trim()) return setError('Customer name is required.');
    if (isPart) {
      if (!form.partType) return setError('Part type is required.');
      if (!form.linkedUnit) return setError('Please link this part to an AC unit.');
    } else {
      if (!form.unit.trim()) return setError('AC unit description is required.');
    }
    if (!form.warrantyEnd) return setError('Warranty end date is required.');
    const selectedUnit = unitOptions.find(u => u.id === form.linkedUnit);
    const payload = {
      ...form,
      customerName: form.customer,
      linkedUnitLabel: selectedUnit?.label || '',
      linkedUnit: selectedUnit?.label || form.linkedUnit,
      type: form.type || (isPart ? partWarrantyTypeList[0] : unitWarrantyTypeList[0])
    };
    try {
      setSaving(true);
      await onSave?.(payload);
      onClose?.();
    } catch (e) {
      setError(e.message || 'Failed to register warranty.');
    } finally {
      setSaving(false);
    }
  };
  return <div onClick={onClose} className="ap-modals-213">
      <div onClick={e => e.stopPropagation()} className="ap-modals-214">
        {/* Header */}
        <div className="ap-modals-215">
          <div>
            <div className="ap-modals-216">Register Warranty</div>
            <div className="ap-modals-217">
              Track a new AC unit or an individual replacement part
            </div>
          </div>
          <button onClick={onClose} className="ap-modals-218">✕</button>
        </div>
 
        <div className="ap-modals-219">
 
          {/* Record type toggle */}
          <div className="ap-modals-220">
            {[{
            key: 'unit',
            label: '🛡️ AC Unit'
          }, {
            key: 'part',
            label: '🔧 AC Part'
          }].map(t => <button key={t.key} onClick={() => setForm(p => ({
            ...p,
            recordType: t.key
          }))} style={{
            background: form.recordType === t.key ? "var(--white)" : "transparent",
            color: form.recordType === t.key ? "var(--text-h1)" : "var(--text-muted)",
            boxShadow: form.recordType === t.key ? "0 1px 3px rgba(0,0,0,.08)" : "none"
          }} className="ap-modals-221">{t.label}</button>)}
          </div>
 
          {/* Customer */}
          <div className="ap-modals-222">
            {field(<>
              <span className="ap-modals-223">Customer Name *</span>
              <input value={form.customer} onChange={set('customer')} placeholder="e.g. Ankit Patel" className="ap-modals-224" />
            </>)}
          </div>
 
          {isPart ? <>
              <div className="ap-modals-225">
                {field(<>
                  <span className="ap-modals-223">Part Type *</span>
                  <DynamicSelect options={partTypeList} value={form.partType} onChange={v => setForm(p => ({
                ...p,
                partType: v
              }))} onAddOption={v => onAddPartType?.(v)} addLabel="Part Type" addPlaceholder="e.g. Drain Pump, Blower…" />
                </>)}
                {field(<>
                  <span className="ap-modals-223">Linked AC Unit *</span>
                  <select value={form.linkedUnit} onChange={set('linkedUnit')} className="ap-modals-226">
                    <option value="">Select AC unit…</option>
                    {unitOptions.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                  {unitOptions.length === 0 && <span className="ap-modals-227">
                      No AC units registered yet — register one first to link parts to it.
                    </span>}
                </>)}
              </div>
            </> : <div className="ap-modals-228">
              {field(<>
                <span className="ap-modals-223">AC Unit Description *</span>
                <input value={form.unit} onChange={set('unit')} placeholder="e.g. 1.5 Ton Split AC — Living Room" className="ap-modals-224" />
              </>)}
              {field(<>
                <span className="ap-modals-223">AC Type</span>
                <DynamicSelect options={acTypeList} value={form.acType} onChange={v => setForm(p => ({
              ...p,
              acType: v
            }))} onAddOption={v => onAddAcType?.(v)} addLabel="AC Type" addPlaceholder="e.g. VRF, Rooftop Package…" />
              </>)}
              {field(<>
                <span className="ap-modals-223">Capacity</span>
                <input value={form.capacity} onChange={set('capacity')} placeholder="e.g. 1.5 Ton" className="ap-modals-224" />
              </>)}
              {field(<>
                <span className="ap-modals-223">Technician Installed By</span>
                <input value={form.technician} onChange={set('technician')} placeholder="e.g. Ramesh Kumar" className="ap-modals-224" />
              </>)}
            </div>}
 
          {/* Brand / model / serial — shared */}
          <div className="ap-modals-229">
            {field(<>
              <span className="ap-modals-223">Brand</span>
              <input value={form.brand} onChange={set('brand')} placeholder="e.g. Daikin" className="ap-modals-224" />
            </>)}
            {field(<>
              <span className="ap-modals-223">{isPart ? 'Model / Part No.' : 'Model No.'}</span>
              <input value={form.model} onChange={set('model')} className="ap-modals-224" />
            </>)}
            {field(<>
              <span className="ap-modals-223">Serial No.</span>
              <input value={form.serial} onChange={set('serial')} className="ap-modals-224" />
            </>)}
          </div>
 
          {!isPart && <div className="ap-modals-230">
              {field(<>
                <span className="ap-modals-223">Purchase Date</span>
                <input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} className="ap-modals-224" />
              </>)}
              {field(<>
                <span className="ap-modals-223">Invoice / Bill No.</span>
                <input value={form.invoiceNo} onChange={set('invoiceNo')} className="ap-modals-224" />
              </>)}
              {field(<>
                <span className="ap-modals-223">Purchase Source</span>
                <input value={form.purchaseSource} onChange={set('purchaseSource')} placeholder="e.g. Croma, Amazon" className="ap-modals-224" />
              </>)}
            </div>}
 
          {/* Install + warranty coverage — shared */}
          <div className="ap-modals-231">
            {field(<>
              <span className="ap-modals-223">Install Date</span>
              <input type="date" value={form.installDate} onChange={set('installDate')} className="ap-modals-224" />
            </>)}
            {field(<>
              <span className="ap-modals-223">Warranty Type</span>
              <DynamicSelect options={isPart ? partWarrantyTypeList : unitWarrantyTypeList} value={form.type} onChange={v => setForm(p => ({
              ...p,
              type: v
            }))} onAddOption={v => isPart ? onAddPartWarrantyType?.(v) : onAddUnitWarrantyType?.(v)} addLabel="Warranty Type" addPlaceholder="e.g. Labour Only, Lifetime…" />
            </>)}
            {field(<>
              <span className="ap-modals-223">Warranty End Date *</span>
              <input type="date" value={form.warrantyEnd} onChange={set('warrantyEnd')} className="ap-modals-224" />
            </>)}
          </div>
 
          {field(<>
            <span className="ap-modals-223">Notes</span>
            <textarea value={form.notes} onChange={set('notes')} placeholder="Optional notes…" className="ap-modals-232" />
          </>)}
 
          {error && <div className="ap-modals-233">
              {error}
            </div>}
        </div>
 
        {/* Footer */}
        <div className="ap-modals-234">
          <button onClick={onClose} disabled={saving} className="ap-modals-235">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{
          background: saving ? "var(--text-faint)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
          cursor: saving ? "not-allowed" : "pointer"
        }} className="ap-modals-236">{saving ? 'Saving…' : '✓ Register Warranty'}</button>
        </div>
      </div>
    </div>;
};
const NOTICE_CATEGORY_DEFAULTS = ['Operations', 'Policy', 'Holiday', 'Training', 'Achievement', 'General', 'HR', 'Finance', 'Safety', 'Urgent'];
const NewNoticeModal = ({
  open,
  onClose,
  onSave,
  editId,
  noticeCategories: noticeCategoryOptions = [],
  onAddNoticeCategory
}) => {
  const noticeCategoryList = noticeCategoryOptions.length ? noticeCategoryOptions : NOTICE_CATEGORY_DEFAULTS;
  const EMPTY = {
    title: '',
    category: 'Operations',
    priority: 'Normal',
    target: 'all',
    isPinned: false,
    content: '',
    postedBy: 'Admin'
  };
  const [form, setForm] = React.useState(EMPTY);
  const [saving, setSaving] = React.useState(false);

  // ── Load existing notice when editing ──────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;
    if (editId) {
      noticesApi.get(editId) // fetch by ID — add this to your api service if missing
      .then(doc => setForm({
        title: doc.title || '',
        category: doc.category || 'Operations',
        priority: doc.priority === 'high' || doc.priority === 'urgent' ? 'High' : 'Normal',
        target: doc.target || 'all',
        isPinned: doc.isPinned || false,
        content: doc.content || '',
        postedBy: doc.postedBy || 'Admin'
      })).catch(() => {});
    } else {
      setForm(EMPTY); // fresh form for new notice
    }
  }, [open, editId]);
  const handleClose = () => {
    setForm(EMPTY);
    onClose();
  };
  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        priority: form.priority === 'High' ? 'high' : 'medium',
        target: form.target,
        isPinned: form.isPinned,
        postedBy: form.postedBy
      };
      await onSave(payload, editId); // pass editId so parent knows create vs update
      setForm(EMPTY);
    } finally {
      setSaving(false);
    }
  };
  const isEditing = !!editId;
  return <Modal open={open} onClose={handleClose} title={isEditing ? '✏️ Edit Notice' : '📢 Post New Notice'} // ← dynamic title
  >
      <FRow label="Title">
        <FInput placeholder="Notice title…" value={form.title} onChange={e => setForm(p => ({
        ...p,
        title: e.target.value
      }))} />
      </FRow>
      <div className="ap-modals-237">
        <FRow label="Type">
          <DynamicSelect options={noticeCategoryList} value={form.category} onChange={v => setForm(p => ({
          ...p,
          category: v
        }))} onAddOption={v => onAddNoticeCategory?.(v)} addLabel="Notice Category" addPlaceholder="e.g. Compliance, Maintenance…" />
        </FRow>
        <FRow label="Priority">
          <FSelect value={form.priority} onChange={e => setForm(p => ({
          ...p,
          priority: e.target.value
        }))}>
            <option>Normal</option><option>High</option>
          </FSelect>
        </FRow>
        <FRow label="Target">
          <FSelect value={form.target} onChange={e => setForm(p => ({
          ...p,
          target: e.target.value
        }))}>
            <option value="all">All Staff</option>
            <option value="technicians">Technicians Only</option>
            <option value="admin">Admin Only</option>
          </FSelect>
        </FRow>
        <FRow label="Pin to top">
          <FSelect value={form.isPinned ? 'Yes – Pin' : 'No'} onChange={e => setForm(p => ({
          ...p,
          isPinned: e.target.value === 'Yes – Pin'
        }))}>
            <option>No</option><option>Yes – Pin</option>
          </FSelect>
        </FRow>
      </div>
      <FRow label="Content">
        <FTextarea placeholder="Notice content…" rows={4} value={form.content} onChange={e => setForm(p => ({
        ...p,
        content: e.target.value
      }))} />
      </FRow>
      <div className="ap-modals-238">
        <FBtn secondary onClick={handleClose}>Cancel</FBtn>
        <FBtn onClick={handleSave}>
          {saving ? isEditing ? 'Saving…' : 'Posting…' : isEditing ? 'Save Changes' : 'Post Notice'}
        </FBtn>
      </div>
    </Modal>;
};
const MarkAttendanceModal = ({
  open,
  onClose,
  onSave,
  date = new Date().toISOString().slice(0, 10)
}) => {
  const [liveTechs, setLiveTechs] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setError("");
    techsApi.list({ limit: 200 }).then(r => {
      const data = r.data ?? [];
      setLiveTechs(data);
      setStatusMap(Object.fromEntries(data.map(t => [t._id, "P"])));
    }).catch(() => {});
  }, [open]);
  const setStatus = (id, val) => setStatusMap(m => ({ ...m, [id]: val }));
  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      await onSave({
        date,
        records: liveTechs.map(t => ({ technician: t._id, techName: t.name, status: statusMap[t._id] || "P" }))
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="📅 Mark Today's Attendance" width={600}>
    <div className="ap-modals-239">
      Marking attendance for: <strong>{fmtDateDMY(new Date(date))}</strong>
    </div>
    {liveTechs.map(t => <div key={t._id} className="ap-modals-240">
        <Avatar name={t.name} size={32} color={t.status === "available" ? "#10B981" : COLORS.brand} />
        <div className="ap-modals-241">{t.name}</div>
        <div className="ap-modals-242">
          {[["P", "Present", "#F0FDF4", "#16A34A"], ["A", "Absent", "#FEF2F2", "#DC2626"], ["HD", "Half Day", "#FFFBEB", "#B45309"], ["L", "Leave", "#EFF6FF", "#0369A1"]].map(([v, label, bg, color]) => <label key={v} className="ap-modals-243">
              <input type="radio" name={`att-${t._id}`} value={v} checked={statusMap[t._id] === v} onChange={() => setStatus(t._id, v)} className="ap-modals-244" />
              <span style={{ background: bg, color, border: `1px solid ${color}30` }} className="ap-modals-245">{label}</span>
            </label>)}
        </div>
      </div>)}
    {error && <div className="ap-modals-7">{error}</div>}
    <div className="ap-modals-246">
      <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
      <FBtn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Attendance"}</FBtn>
    </div>
  </Modal>;
};
const AdvanceModal = ({
  open,
  onClose,
  onSave,
  techName = "",
  techId = ""
}) => {
  const [liveTechs, setLiveTechs] = useState([]);
  const [form, setForm] = useState({ technician: techId, amount: "", recoveryMonth: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setForm({ technician: techId, amount: "", recoveryMonth: "", reason: "" });
    setError("");
    techsApi.list({ limit: 200 }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
  }, [open, techId]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setError("");
    if (!form.technician) return setError("Please select a technician.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Enter a valid amount.");
    setSaving(true);
    try {
      const t = liveTechs.find(t => t._id === form.technician);
      await onSave({
        technician: form.technician,
        techName: t?.name || techName,
        amount: Number(form.amount),
        recoveryMonth: form.recoveryMonth,
        reason: form.reason
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to approve advance.");
    } finally {
      setSaving(false);
    }
  };
  const recoveryOptions = Array.from({ length: 3 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  });
  return <Modal open={open} onClose={onClose} title="⬆ Give Advance" width={420}>
    <FRow label="Technician *">
      <FSelect value={form.technician} onChange={set("technician")}>
        <option value="">Select technician…</option>
        {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
      </FSelect>
    </FRow>
    <FRow label="Amount (₹) *">
      <FInput type="number" placeholder="5000" value={form.amount} onChange={set("amount")} />
    </FRow>
    <FRow label="Recovery Month">
      <FSelect value={form.recoveryMonth} onChange={set("recoveryMonth")}>
        <option value="">Select…</option>
        {recoveryOptions.map(m => <option key={m}>{m}</option>)}
      </FSelect>
    </FRow>
    <FRow label="Reason">
      <FTextarea placeholder="Reason for advance…" rows={2} value={form.reason} onChange={set("reason")} />
    </FRow>
    {error && <div className="ap-modals-7">{error}</div>}
    <div className="ap-modals-247">
      <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
      <FBtn onClick={handleSave} disabled={saving}>{saving ? "Approving…" : "Approve Advance"}</FBtn>
    </div>
  </Modal>;
};
const SendQuotationModal = ({
  open,
  onClose,
  onSave,
  quotId = "",
  defaultEmail = ""
}) => {
  const [form, setForm] = useState({
    sendVia: "Email",
    toEmail: defaultEmail,
    message: "Dear Customer, please find attached the quotation for your AC service. We look forward to working with you. Regards, CoolTech AC Services."
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setForm(f => ({ ...f, toEmail: defaultEmail }));
    setError("");
  }, [open, defaultEmail]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setError("");
    if ((form.sendVia === "Email" || form.sendVia === "Both") && !form.toEmail.trim()) {
      return setError("Email address is required for this send method.");
    }
    setSaving(true);
    try {
      await onSave({ quotId, sendVia: form.sendVia, toEmail: form.toEmail, message: form.message });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to send quotation.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="📧 Send Quotation to Customer" width={460}>
    <div className="ap-modals-248">
      <div className="ap-modals-249">{quotId} – Ready to send</div>
    </div>
    <FRow label="Send Via">
      <FSelect value={form.sendVia} onChange={set("sendVia")}>
        <option>Email</option><option>WhatsApp</option><option>Both</option>
      </FSelect>
    </FRow>
    <FRow label="To Email">
      <FInput type="email" placeholder="customer@email.com" value={form.toEmail} onChange={set("toEmail")} />
    </FRow>
    <FRow label="Message">
      <FTextarea rows={3} value={form.message} onChange={set("message")} />
    </FRow>
    {error && <div className="ap-modals-7">{error}</div>}
    <div className="ap-modals-250">
      <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
      <FBtn onClick={handleSave} disabled={saving}>{saving ? "Sending…" : "📤 Send Now"}</FBtn>
    </div>
  </Modal>;
};
const ConvertToJobModal = ({
  open,
  onClose,
  onSave,
  quotId = "",
  jobTypes: jobTypeOptions = [],
  onAddJobType
}) => {
  const JOB_TYPE_DEFAULTS = ["Service", "Repair", "Installation", "AMC Visit", "Inspection", "AMC"];
  const jobTypeList = jobTypeOptions.length ? jobTypeOptions : JOB_TYPE_DEFAULTS;
  const [liveTechs, setLiveTechs] = useState([]);
  const [form, setForm] = useState({
    jobType: jobTypeList[0] || "Service",
    scheduledDate: "",
    scheduledTime: "10:00",
    technician: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setForm({ jobType: jobTypeList[0] || "Service", scheduledDate: "", scheduledTime: "10:00", technician: "" });
    setError("");
    techsApi.list({ limit: 200 }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setError("");
    if (!form.scheduledDate) return setError("Scheduled date is required.");
    setSaving(true);
    try {
      const t = liveTechs.find(t => t._id === form.technician);
      await onSave({
        quotId,
        type: form.jobType,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        technician: form.technician || undefined,
        techName: t?.name || "Unassigned"
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create job order.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="✓ Convert Quotation to Job" width={460}>
      <div className="ap-modals-251">
        <div className="ap-modals-252">{quotId} – Approved quotation</div>
      </div>
      <FRow label="Scheduled Date *">
        <FInput type="date" value={form.scheduledDate} onChange={set("scheduledDate")} />
      </FRow>
      <FRow label="Scheduled Time">
        <FInput type="time" value={form.scheduledTime} onChange={set("scheduledTime")} />
      </FRow>
      <FRow label="Assign Technician">
        <FSelect value={form.technician} onChange={set("technician")}>
          <option value="">Unassigned</option>
          {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
        </FSelect>
      </FRow>
      <FRow label="Job Type">
        <DynamicSelect options={jobTypeList} value={form.jobType} onChange={v => setForm(f => ({ ...f, jobType: v }))} onAddOption={v => onAddJobType?.(v)} addLabel="Job Type" addPlaceholder="e.g. Deep Cleaning, Gas Refill…" />
      </FRow>
      {error && <div className="ap-modals-7">{error}</div>}
      <div className="ap-modals-253">
        <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
        <FBtn color="#16A34A" onClick={handleSave} disabled={saving}>{saving ? "Creating…" : "Create Job Order"}</FBtn>
      </div>
    </Modal>;
};
 
const ReportModal = ({
  open,
  onClose,
  onSave,
  title,
  format
}) => {
  const [liveTechs, setLiveTechs] = useState([]);
  const [form, setForm] = useState({
    from: "2026-01-01",
    to: new Date().toISOString().slice(0, 10),
    groupBy: "Monthly",
    technician: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setError("");
    techsApi.list({ limit: 200 }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
  }, [open]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleGenerate = async () => {
    setError("");
    setSaving(true);
    try {
      await onSave?.({ title, format, ...form });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to generate report.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title={`📊 Generate: ${title}`} width={460}>
    <div className="ap-modals-254">
      <FRow label="From Date">
        <FInput type="date" value={form.from} onChange={set("from")} />
      </FRow>
      <FRow label="To Date">
        <FInput type="date" value={form.to} onChange={set("to")} />
      </FRow>
      <FRow label="Group By">
        <FSelect value={form.groupBy} onChange={set("groupBy")}>
          <option>Monthly</option><option>Weekly</option><option>Daily</option>
        </FSelect>
      </FRow>
      <FRow label="Format">
        <FInput value={format} disabled className="ap-modals-255" />
      </FRow>
    </div>
    <FRow label="Filter (optional)">
      <FSelect value={form.technician} onChange={set("technician")}>
        <option value="">All Technicians</option>
        {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
      </FSelect>
    </FRow>
    {error && <div className="ap-modals-7">{error}</div>}
    <div className="ap-modals-256">
      <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
      <FBtn onClick={handleGenerate} disabled={saving}>{saving ? "Generating…" : `⬇ Download ${format}`}</FBtn>
    </div>
  </Modal>;
};
 
const ADMIN_ROLE_DEFAULTS = ['Manager', 'Accountant', 'Dispatcher', 'Super Admin'];
const AddAdminUserModal = ({
  open,
  onClose,
  onSave,
  adminRoles: adminRoleOptions = [],
  onAddAdminRole
}) => {
  const ADMIN_ROLE_DEFAULTS = ["Manager", "Accountant", "Dispatcher", "Super Admin"];
  const adminRoleList = adminRoleOptions.length ? adminRoleOptions : ADMIN_ROLE_DEFAULTS;
  const [form, setForm] = useState({ name: "", email: "", role: adminRoleList[0] || "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setForm({ name: "", email: "", role: adminRoleList[0] || "", password: "" });
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setError("");
    if (!form.name.trim()) return setError("Full name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!form.password || form.password.length < 8) return setError("Password must be at least 8 characters.");
    setSaving(true);
    try {
      await onSave({ name: form.name.trim(), email: form.email.trim(), role: form.role, password: form.password });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to add user.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="👤 Add Admin User" width={440}>
      <FRow label="Full Name *">
        <FInput placeholder="Name" value={form.name} onChange={set("name")} />
      </FRow>
      <FRow label="Email *">
        <FInput type="email" placeholder="user@cooltech.com" value={form.email} onChange={set("email")} />
      </FRow>
      <FRow label="Role">
        <DynamicSelect options={adminRoleList} value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} onAddOption={v => onAddAdminRole?.(v)} addLabel="Role" addPlaceholder="e.g. Auditor, Regional Manager…" />
      </FRow>
      <FRow label="Temporary Password *">
        <FInput type="password" placeholder="Set initial password" value={form.password} onChange={set("password")} />
      </FRow>
      {error && <div className="ap-modals-7">{error}</div>}
      <div className="ap-modals-257">
        <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={saving}>{saving ? "Adding…" : "Add User"}</FBtn>
      </div>
    </Modal>;
};
const UseInventoryModal = ({
  open,
  onClose,
  onSave,
  itemId = "",
  itemName = ""
}) => {
  const [liveJobs, setLiveJobs] = useState([]);
  const [liveTechs, setLiveTechs] = useState([]);
  const [form, setForm] = useState({ qty: 1, jobRef: "", technician: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setForm({ qty: 1, jobRef: "", technician: "", notes: "" });
    setError("");
    jobsApi.list({ limit: 200 }).then(r => setLiveJobs(r.data ?? [])).catch(() => {});
    techsApi.list({ limit: 200 }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
  }, [open]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setError("");
    if (!form.qty || Number(form.qty) <= 0) return setError("Enter a valid quantity.");
    setSaving(true);
    try {
      const t = liveTechs.find(t => t._id === form.technician);
      await onSave({
        item: itemId,
        itemName,
        qty: Number(form.qty),
        jobRef: form.jobRef || undefined,
        technician: form.technician || undefined,
        techName: t?.name || "",
        notes: form.notes
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to log usage.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="📦 Log Inventory Usage" width={440}>
    <FRow label="Item">
      <FInput value={itemName} disabled />
    </FRow>
    <FRow label="Quantity Used *">
      <FInput type="number" placeholder="1" value={form.qty} onChange={set("qty")} />
    </FRow>
    <FRow label="Job Reference">
      <FSelect value={form.jobRef} onChange={set("jobRef")}>
        <option value="">-- None --</option>
        {liveJobs.map(j => <option key={j._id} value={j._id}>{j.jobId || j._id}</option>)}
      </FSelect>
    </FRow>
    <FRow label="Technician">
      <FSelect value={form.technician} onChange={set("technician")}>
        <option value="">-- Select --</option>
        {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
      </FSelect>
    </FRow>
    <FRow label="Notes">
      <FInput placeholder="Optional notes" value={form.notes} onChange={set("notes")} />
    </FRow>
    {error && <div className="ap-modals-7">{error}</div>}
    <div className="ap-modals-258">
      <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
      <FBtn onClick={handleSave} disabled={saving}>{saving ? "Logging…" : "Log Usage"}</FBtn>
    </div>
  </Modal>;
};
const LogFuelModal = ({
  open,
  onClose,
  onSave,
  assetId = "",
  assetName = ""
}) => {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    litres: "",
    rate: "",
    km: "",
    station: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setForm({ date: new Date().toISOString().slice(0, 10), litres: "", rate: "", km: "", station: "" });
    setError("");
  }, [open]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setError("");
    if (!form.litres || Number(form.litres) <= 0) return setError("Enter valid litres.");
    setSaving(true);
    try {
      await onSave({
        asset: assetId,
        assetName,
        date: form.date,
        litres: Number(form.litres),
        rate: Number(form.rate) || 0,
        km: Number(form.km) || 0,
        station: form.station,
        total: (Number(form.litres) || 0) * (Number(form.rate) || 0)
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to log fuel entry.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="⛽ Log Fuel Entry" width={440}>
    <FRow label="Vehicle">
      <FInput value={assetName} disabled />
    </FRow>
    <div className="ap-modals-259">
      <FRow label="Date">
        <FInput type="date" value={form.date} onChange={set("date")} />
      </FRow>
      <FRow label="Litres *">
        <FInput type="number" placeholder="20" value={form.litres} onChange={set("litres")} />
      </FRow>
      <FRow label="Rate (₹/L)">
        <FInput type="number" placeholder="95" value={form.rate} onChange={set("rate")} />
      </FRow>
      <FRow label="Current KM">
        <FInput type="number" placeholder="42850" value={form.km} onChange={set("km")} />
      </FRow>
    </div>
    <FRow label="Fuel Station">
      <FInput placeholder="HP / BPCL / IOC – Location" value={form.station} onChange={set("station")} />
    </FRow>
    {error && <div className="ap-modals-7">{error}</div>}
    <div className="ap-modals-260">
      <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
      <FBtn onClick={handleSave} disabled={saving}>{saving ? "Logging…" : "Log Entry"}</FBtn>
    </div>
  </Modal>;
};
const ScheduleAMCModal = ({
  open,
  onClose,
  onSave,
  contractId = ""
}) => {
  const [liveTechs, setLiveTechs] = useState([]);
  const [form, setForm] = useState({ visitDate: "", visitTime: "10:00", technician: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setForm({ visitDate: "", visitTime: "10:00", technician: "", notes: "" });
    setError("");
    techsApi.list({ limit: 200 }).then(r => setLiveTechs(r.data ?? [])).catch(() => {});
  }, [open]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setError("");
    if (!form.visitDate) return setError("Visit date is required.");
    if (!form.technician) return setError("Please assign a technician.");
    setSaving(true);
    try {
      const t = liveTechs.find(t => t._id === form.technician);
      await onSave({
        contractId,
        visitDate: form.visitDate,
        visitTime: form.visitTime,
        technician: form.technician,
        techName: t?.name || "",
        notes: form.notes
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to schedule visit.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="📅 Schedule AMC Visit" width={440}>
    <div className="ap-modals-261">{contractId}</div>
    <FRow label="Visit Date *">
      <FInput type="date" value={form.visitDate} onChange={set("visitDate")} />
    </FRow>
    <FRow label="Visit Time">
      <FInput type="time" value={form.visitTime} onChange={set("visitTime")} />
    </FRow>
    <FRow label="Assign Technician *">
      <FSelect value={form.technician} onChange={set("technician")}>
        <option value="">Select technician…</option>
        {liveTechs.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
      </FSelect>
    </FRow>
    <FRow label="Notes">
      <FTextarea placeholder="Visit notes or special instructions…" rows={2} value={form.notes} onChange={set("notes")} />
    </FRow>
    {error && <div className="ap-modals-7">{error}</div>}
    <div className="ap-modals-262">
      <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
      <FBtn onClick={handleSave} disabled={saving}>{saving ? "Scheduling…" : "Schedule Visit"}</FBtn>
    </div>
  </Modal>;
};
const RequestReviewModal = ({
  open,
  onClose,
  onSave
}) => {
  const [liveCustomers, setLiveCustomers] = useState([]);
  const [liveJobs, setLiveJobs] = useState([]);
  const [form, setForm] = useState({
    customer: "",
    jobRef: "",
    sendVia: "SMS",
    message: "Hi! Thank you for choosing CoolTech AC Services. We hope you're happy with our service. Please spare 30 seconds to leave us a review – it means a lot!"
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setError("");
    customersApi.list({ limit: 200 }).then(r => setLiveCustomers(r.data ?? [])).catch(() => {});
    jobsApi.list({ limit: 200 }).then(r => setLiveJobs(r.data ?? [])).catch(() => {});
  }, [open]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setError("");
    if (!form.customer) return setError("Please select a customer.");
    setSaving(true);
    try {
      const cust = liveCustomers.find(c => c._id === form.customer);
      await onSave({
        customer: form.customer,
        customerName: cust?.name || "",
        jobRef: form.jobRef || undefined,
        sendVia: form.sendVia,
        message: form.message
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to send review request.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="⭐ Request Customer Review" width={460}>
    <FRow label="Customer *">
      <FSelect value={form.customer} onChange={set("customer")}>
        <option value="">Select customer…</option>
        {liveCustomers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
      </FSelect>
    </FRow>
    <FRow label="Job Reference">
      <FSelect value={form.jobRef} onChange={set("jobRef")}>
        <option value="">-- None --</option>
        {liveJobs.map(j => <option key={j._id} value={j._id}>{j.jobId || j._id}</option>)}
      </FSelect>
    </FRow>
    <FRow label="Send Via">
      <FSelect value={form.sendVia} onChange={set("sendVia")}>
        <option>SMS</option><option>WhatsApp</option><option>Email</option>
      </FSelect>
    </FRow>
    <FRow label="Message">
      <FTextarea rows={3} value={form.message} onChange={set("message")} />
    </FRow>
    {error && <div className="ap-modals-7">{error}</div>}
    <div className="ap-modals-263">
      <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
      <FBtn onClick={handleSave} disabled={saving}>{saving ? "Sending…" : "📤 Send Request"}</FBtn>
    </div>
  </Modal>;
};
const AssignComplaintModal = ({
  open, onClose, onSave, compId = "", technicians = [],
}) => {
  const [technicianId, setTechnicianId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset form whenever a different complaint is opened
  useEffect(() => {
    if (open) {
      setTechnicianId('');
      setPriority('Medium');
      setTargetDate('');
      setNotes('');
    }
  }, [open, compId]);

  const handleSave = async () => {
    if (!technicianId) return;
    setSaving(true);
    try {
      await onSave({
        technicianId,
        priority,
        targetResolutionDate: targetDate || undefined,
        internalNotes: notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="📋 Assign Complaint" width={440}>
      <div className="ap-modals-264">{compId}</div>
      <FRow label="Assign To">
        <FSelect value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
          <option value="">Select technician…</option>
          {technicians.map(t => (
            <option key={t.id ?? t._id} value={t.id ?? t._id}>{t.name}</option>
          ))}
        </FSelect>
      </FRow>
      <FRow label="Priority">
        <FSelect value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </FSelect>
      </FRow>
      <FRow label="Target Resolution Date">
        <FInput type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </FRow>
      <FRow label="Internal Notes">
        <FTextarea
          placeholder="Instructions for the technician…"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </FRow>
      <div className="ap-modals-265">
        <FBtn secondary onClick={onClose}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={saving || !technicianId}>
          {saving ? 'Assigning…' : 'Assign'}
        </FBtn>
      </div>
    </Modal>
  );
};

const ResolveComplaintModal = ({
  open, onClose, onSave, compId = "",
}) => {
  const [resolution, setResolution] = useState('');
  const [customerCommunication, setCustomerCommunication] = useState('Apology sent via WhatsApp');
  const [compensation, setCompensation] = useState('None');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setResolution('');
      setCustomerCommunication('Apology sent via WhatsApp');
      setCompensation('None');
    }
  }, [open, compId]);

  const handleSave = async () => {
    if (!resolution.trim()) return;
    setSaving(true);
    try {
      await onSave({ resolution, customerCommunication, compensation });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="✅ Resolve Complaint" width={460}>
      <div className="ap-modals-266">{compId}</div>
      <FRow label="Resolution Action Taken">
        <FTextarea
          placeholder="Describe what was done to resolve the complaint…"
          rows={3}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        />
      </FRow>
      <FRow label="Customer Communication">
        <FSelect value={customerCommunication} onChange={(e) => setCustomerCommunication(e.target.value)}>
          <option>Apology sent via WhatsApp</option>
          <option>Phone call made</option>
          <option>Email sent</option>
          <option>In-person visit done</option>
        </FSelect>
      </FRow>
      <FRow label="Compensation Given">
        <FSelect value={compensation} onChange={(e) => setCompensation(e.target.value)}>
          <option>None</option>
          <option>Discount on next service</option>
          <option>Free re-service</option>
          <option>Refund issued</option>
        </FSelect>
      </FRow>
      <div className="ap-modals-267">
        <FBtn secondary onClick={onClose}>Cancel</FBtn>
        <FBtn color="#16A34A" onClick={handleSave} disabled={saving || !resolution.trim()}>
          {saving ? 'Saving…' : 'Mark Resolved'}
        </FBtn>
      </div>
    </Modal>
  );
};
const SetReminderModal = ({
  open,
  onClose,
  onSave,
  linkedTo = null // optional { type, id } the reminder relates to
}) => {
  const [form, setForm] = useState({ date: "", time: "11:00", type: "📞 Call", note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setForm({ date: "", time: "11:00", type: "📞 Call", note: "" });
    setError("");
  }, [open]);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handleSave = async () => {
    setError("");
    if (!form.date) return setError("Date is required.");
    setSaving(true);
    try {
      await onSave({ ...form, linkedTo });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to set reminder.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="⏰ Set Follow-up Reminder" width={420}>
    <FRow label="Date *">
      <FInput type="date" value={form.date} onChange={set("date")} />
    </FRow>
    <FRow label="Time">
      <FInput type="time" value={form.time} onChange={set("time")} />
    </FRow>
    <FRow label="Type">
      <FSelect value={form.type} onChange={set("type")}>
        <option>📞 Call</option><option>💬 WhatsApp</option><option>📧 Email</option><option>🏠 Site Visit</option>
      </FSelect>
    </FRow>
    <FRow label="Note">
      <FTextarea placeholder="Reminder note…" rows={2} value={form.note} onChange={set("note")} />
    </FRow>
    {error && <div className="ap-modals-7">{error}</div>}
    <div className="ap-modals-268">
      <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
      <FBtn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Set Reminder"}</FBtn>
    </div>
  </Modal>;
};

// const CustomReportModal = ({ open, onClose, onSave }) => (
//   <Modal
//     open={open}
//     onClose={onClose}
//     title="📊 Build Custom Report"
//     width={520}
//   >
//     <FRow label="Report Name">
//       <FInput placeholder="My Custom Report" />
//     </FRow>
//     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
//       <FRow label="Module">
//         <FSelect>
//           <option>Jobs</option>
//           <option>Revenue</option>
//           <option>Technicians</option>
//           <option>Invoices</option>
//           <option>Expenses</option>
//           <option>Inventory</option>
//           <option>Complaints</option>
//         </FSelect>
//       </FRow>
//       <FRow label="Chart Type">
//         <FSelect>
//           <option>Bar Chart</option>
//           <option>Line Chart</option>
//           <option>Pie Chart</option>
//           <option>Table</option>
//         </FSelect>
//       </FRow>
//       <FRow label="From Date">
//         <FInput type="date" defaultValue="2026-01-01" />
//       </FRow>
//       <FRow label="To Date">
//         <FInput type="date" defaultValue="2026-03-31" />
//       </FRow>
//       <FRow label="Group By">
//         <FSelect>
//           <option>Month</option>
//           <option>Week</option>
//           <option>Technician</option>
//           <option>Job Type</option>
//         </FSelect>
//       </FRow>
//       <FRow label="Export Format">
//         <FSelect>
//           <option>PDF</option>
//           <option>CSV</option>
//           <option>Excel</option>
//         </FSelect>
//       </FRow>
//     </div>
//     <div
//       style={{
//         display: "flex",
//         justifyContent: "flex-end",
//         gap: 10,
//         marginTop: 8,
//       }}
//     >
//       <FBtn secondary onClick={onClose}>
//         Cancel
//       </FBtn>
//       <FBtn onClick={() => onSave({})}>Generate Report</FBtn>
//     </div>
//   </Modal>
// );

// ─── Module config ─────────────────────────────────────────────────────────────

const MODULE_CFG = {
  Jobs: {
    api: jobsApi,
    dateKey: 'createdAt',
    valueKey: null,
    labelKey: 'jobType'
  },
  Revenue: {
    api: invoicesApi,
    dateKey: 'createdAt',
    valueKey: 'amount',
    labelKey: 'status'
  },
  Technicians: {
    api: techsApi,
    dateKey: 'createdAt',
    valueKey: 'completed',
    labelKey: 'name'
  },
  Invoices: {
    api: invoicesApi,
    dateKey: 'createdAt',
    valueKey: 'amount',
    labelKey: 'status'
  },
  Expenses: {
    api: expensesApi,
    dateKey: 'date',
    valueKey: 'amount',
    labelKey: 'category'
  },
  Inventory: {
    api: inventoryApi,
    dateKey: 'createdAt',
    valueKey: 'quantity',
    labelKey: 'name'
  },
  Complaints: {
    api: complaintsApi,
    dateKey: 'createdAt',
    valueKey: null,
    labelKey: 'category'
  }
};
const GROUP_FNS = {
  Month: i => new Date(i._date).toLocaleString('default', {
    month: 'short',
    year: '2-digit'
  }),
  Week: i => {
    const d = new Date(i._date);
    return `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString('default', {
      month: 'short'
    })}`;
  },
  Technician: i => i.technician?.name || i.assignedTo?.name || i.technicianName || 'Unknown',
  'Job Type': i => i.jobType || i.type || i.category || 'Other'
};
const BAR_COLORS = ["var(--brand)", "var(--info)", "var(--success)", "var(--purple)", "var(--xec4899)", "var(--warning)", "var(--x06b6d4)", "var(--danger)"];

// ─── Download helpers ──────────────────────────────────────────────────────────
const downloadBlob = (content, filename, mime) => {
  const blob = new Blob([content], {
    type: mime
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
const toCSV = (headers, rows) => {
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
};

// ─── SVG Chart ────────────────────────────────────────────────────────────────
const SVGChart = ({
  data,
  type
}) => {
  if (!data?.length) return null;

  // ── Single data point warning ──────────────────────────────────────────────
  if (data.length === 1 && type !== 'Table') {
    const val = data[0].value;
    if (type === 'Pie Chart') {
      // Full circle for single item
      return <svg viewBox="0 0 468 190" className="ap-modals-269">
          <circle cx={95} cy={95} r={78} fill={BAR_COLORS[0]} opacity={0.88} />
          <text x={95} y={99} fontSize={13} fill="#fff" textAnchor="middle" fontWeight={700}>100%</text>
          <g transform="translate(210,80)">
            <rect width={12} height={12} rx={2} fill={BAR_COLORS[0]} />
            <text x={18} y={11} fontSize={11} fill="#475569">{data[0].label} — {val.toLocaleString()}</text>
          </g>
          <text x={234} y={160} fontSize={10} fill="#94A3B8" textAnchor="middle">
            Only 1 group found — try changing "Group By" for more segments
          </text>
        </svg>;
    }
    if (type === 'Line Chart') {
      return <svg viewBox="0 0 468 190" className="ap-modals-270">
          <line x1={48} y1={12} x2={48} y2={146} stroke="#E2E8F0" strokeWidth={1} />
          <line x1={48} y1={146} x2={456} y2={146} stroke="#E2E8F0" strokeWidth={1} />
          <circle cx={234} cy={79} r={7} fill={BAR_COLORS[0]} stroke="#fff" strokeWidth={2} />
          <text x={234} y={64} fontSize={11} fill="#475569" textAnchor="middle" fontWeight={700}>
            {data[0].label}: {val.toLocaleString()}
          </text>
          <text x={234} y={168} fontSize={10} fill="#94A3B8" textAnchor="middle">
            Only 1 group — try "Week" or "Job Type" grouping for a line
          </text>
        </svg>;
    }
  }
  const W = 468,
    H = 190,
    P = {
      t: 12,
      r: 12,
      b: 44,
      l: 48
    };
  const cW = W - P.l - P.r,
    cH = H - P.t - P.b;
  const max = Math.max(...data.map(d => d.value), 1);
  if (type === 'Table') return <div className="ap-modals-271">
      <table className="ap-modals-272">
        <thead>
          <tr>{['Label', 'Value'].map(h => <th key={h} className="ap-modals-273">{h}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((d, i) => <tr key={i} style={{
          background: i % 2 ? "var(--bg)" : "var(--white)"
        }}>
              <td className="ap-modals-274">{d.label}</td>
              <td className="ap-modals-275">{d.value.toLocaleString()}</td>
            </tr>)}
        </tbody>
      </table>
    </div>;
  if (type === 'Pie Chart') {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let angle = -Math.PI / 2;
    const cx = 95,
      cy = 90,
      r = 75;
    const slices = data.map((d, i) => {
      const sweep = d.value / total * 2 * Math.PI;
      const safeSweep = Math.min(sweep, 2 * Math.PI - 0.001); // prevent degenerate arc
      const x1 = cx + r * Math.cos(angle),
        y1 = cy + r * Math.sin(angle);
      angle += sweep;
      const x2 = cx + r * Math.cos(angle),
        y2 = cy + r * Math.sin(angle);
      return {
        path: `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${safeSweep > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`,
        color: BAR_COLORS[i % BAR_COLORS.length],
        label: d.label,
        pct: Math.round(d.value / total * 100)
      };
    });
    return <svg viewBox={`0 0 ${W} ${H}`} className="ap-modals-276">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.88} />)}
        {slices.slice(0, 7).map((s, i) => <g key={i} transform={`translate(205,${16 + i * 22})`}>
            <rect width={11} height={11} rx={2} fill={s.color} />
            <text x={16} y={10} fontSize={10} fill="#475569">
              {s.label.length > 18 ? s.label.slice(0, 18) + '…' : s.label} ({s.pct}%)
            </text>
          </g>)}
      </svg>;
  }
  const barW = cW / data.length;
  const pts = data.map((d, i) => `${P.l + i * barW + barW / 2},${P.t + cH * (1 - d.value / max)}`).join(' ');
  return <svg viewBox={`0 0 ${W} ${H}`} className="ap-modals-277">
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
      const y = P.t + cH * (1 - t);
      return <g key={t}>
          <line x1={P.l} y1={y} x2={W - P.r} y2={y} stroke="#E2E8F0" strokeWidth={1} />
          <text x={P.l - 5} y={y + 4} fontSize={8} fill="#94A3B8" textAnchor="end">
            {max * t >= 1000 ? `${Math.round(max * t / 1000)}k` : Math.round(max * t)}
          </text>
        </g>;
    })}

      {type === 'Line Chart' ? <>
          <polyline fill="none" stroke={BAR_COLORS[0]} strokeWidth={2.5} strokeLinejoin="round" points={pts} />
          {data.map((d, i) => {
        const x = P.l + i * barW + barW / 2,
          y = P.t + cH * (1 - d.value / max);
        return <circle key={i} cx={x} cy={y} r={4} fill={BAR_COLORS[0]} stroke="#fff" strokeWidth={1.5} />;
      })}
        </> : data.map((d, i) => {
      const bH = d.value / max * cH;
      return <rect key={i} x={P.l + i * barW + barW * 0.12} y={P.t + cH - bH} width={barW * 0.76} height={bH} rx={3} fill={BAR_COLORS[i % BAR_COLORS.length]} opacity={0.85} />;
    })}

      {data.map((d, i) => <text key={i} x={P.l + i * barW + barW / 2} y={H - P.b + 14} fontSize={8.5} fill="#94A3B8" textAnchor="middle">
          {d.label.length > 7 ? d.label.slice(0, 7) + '…' : d.label}
        </text>)}
    </svg>;
};

// ─── Modal ─────────────────────────────────────────────────────────────────────
const CustomReportModal = ({
  open,
  onClose,
  onSave
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const threeM = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
  const [name, setName] = useState('My Custom Report');
  const [module, setModule] = useState('Jobs');
  const [chartType, setChartType] = useState('Bar Chart');
  const [from, setFrom] = useState(threeM);
  const [to, setTo] = useState(today);
  const [groupBy, setGroupBy] = useState('Month');
  const [exportFmt, setExportFmt] = useState('PDF');
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const generate = async () => {
    setLoading(true);
    setError('');
    setChartData(null);
    try {
      const cfg = MODULE_CFG[module];
      const res = await cfg.api.list({
        from,
        to,
        limit: 1000
      });
      const raw = Array.isArray(res) ? res : res?.data ?? [];
      const items = raw.map(item => ({
        ...item,
        _date: item[cfg.dateKey] || item.createdAt || item.date
      })).filter(item => {
        if (!item._date) return true;
        const d = new Date(item._date);
        return d >= new Date(from) && d <= new Date(to + 'T23:59:59');
      });
      if (!items.length) {
        setError('No records found for this date range.');
        setLoading(false);
        return;
      }
      const gFn = GROUP_FNS[groupBy] || GROUP_FNS.Month;
      const groups = {};
      items.forEach(item => {
        const key = gFn(item);
        if (!groups[key]) groups[key] = {
          label: key,
          value: 0,
          count: 0
        };
        groups[key].value += cfg.valueKey ? Number(item[cfg.valueKey]) || 0 : 1;
        groups[key].count++;
      });
      setChartData(Object.values(groups));
    } catch (e) {
      console.error('Generate error:', e);
      setError('Failed to fetch: ' + (e.message || 'Unknown error'));
    }
    setLoading(false);
  };
  const doExport = () => {
    if (!chartData) return;
    const slug = name.replace(/\s+/g, '_');
    const ts = new Date().toISOString().slice(0, 10);
    const rows = chartData.map(d => [d.label, d.value]);
    if (exportFmt === 'CSV') {
      downloadBlob(toCSV(['Label', 'Value'], rows), `${slug}_${ts}.csv`, 'text/csv');
    } else if (exportFmt === 'Excel') {
      downloadBlob([['Label', 'Value'], ...rows].map(r => r.join('\t')).join('\n'), `${slug}_${ts}.xls`, 'application/vnd.ms-excel');
    } else {
      // ── PDF: grab the live SVG from DOM and embed it ──────────────────────
      const svgEl = document.querySelector('.custom-report-chart svg');
      const svgHTML = svgEl ? svgEl.outerHTML : '';
      const tableHTML = `
      <table>
        <thead><tr><th>Label</th><th>Value</th></tr></thead>
        <tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1].toLocaleString()}</td></tr>`).join('')}</tbody>
      </table>`;
      const win = window.open('', '_blank');
      win.document.write(`
      <html><head><title>${name}</title>
      <style>
        body  { font-family: sans-serif; padding: 32px; color: #111; }
        h2    { font-size: 18px; margin-bottom: 4px; }
        p     { font-size: 12px; color: #64748b; margin-bottom: 24px; }
        .chart-wrap { margin-bottom: 24px; border: 1px solid #e2e8f0;
                      border-radius: 8px; padding: 16px; background: #f8fafc; }
        svg   { width: 100%; max-width: 680px; display: block; }
        table { border-collapse: collapse; width: 100%; font-size: 13px; }
        th,td { border: 1px solid #ddd; padding: 8px 14px; text-align: left; }
        th    { background: #f4f4f4; font-weight: 700; }
        tr:nth-child(even) { background: #f9fafb; }
      </style></head>
      <body>
        <h2>${name}</h2>
        <p>${module} · ${from} → ${to} · Grouped by ${groupBy} · ${chartType}</p>
        ${svgHTML ? `<div class="chart-wrap">${svgHTML}</div>` : ''}
        ${tableHTML}
      </body></html>
    `);
      win.document.close();
      win.focus();
      win.print();
    }
  };
  return <Modal open={open} onClose={onClose} title="📊 Build Custom Report" width={520}>

      <FRow label="Report Name">
        <FInput value={name} onChange={e => setName(e.target.value)} placeholder="My Custom Report" />
      </FRow>

      <div className="ap-modals-278">
        <FRow label="Module">
          <FSelect value={module} onChange={e => {
          setModule(e.target.value);
          setChartData(null);
        }}>
            {Object.keys(MODULE_CFG).map(m => <option key={m}>{m}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Chart Type">
          <FSelect value={chartType} onChange={e => setChartType(e.target.value)}>
            {['Bar Chart', 'Line Chart', 'Pie Chart', 'Table'].map(c => <option key={c}>{c}</option>)}
          </FSelect>
        </FRow>
        <FRow label="From Date">
          <FInput type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </FRow>
        <FRow label="To Date">
          <FInput type="date" value={to} onChange={e => setTo(e.target.value)} />
        </FRow>
        <FRow label="Group By">
          <FSelect value={groupBy} onChange={e => setGroupBy(e.target.value)}>
            {Object.keys(GROUP_FNS).map(g => <option key={g}>{g}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Export Format">
          <FSelect value={exportFmt} onChange={e => setExportFmt(e.target.value)}>
            {['PDF', 'CSV', 'Excel'].map(f => <option key={f}>{f}</option>)}
          </FSelect>
        </FRow>
      </div>

      {/* Error */}
      {error && <div className="ap-modals-279">
          ⚠️ {error}
        </div>}

      {/* Loading */}
      {loading && <div className="ap-modals-280">
          ⏳ Fetching data from backend…
        </div>}

      {/* Chart preview */}
      {chartData && !loading && <div className="custom-report-chart ap-modals-281">
    <div className="ap-modals-282">
      Preview — {module} · Grouped by {groupBy}
    </div>
    <SVGChart data={chartData} type={chartType} />
  </div>}

      {/* Actions */}
      <div className="ap-modals-283">
        <FBtn secondary onClick={onClose}>Cancel</FBtn>
        <FBtn secondary onClick={generate} disabled={loading}>
          {loading ? '⏳ Loading…' : '▶ Generate'}
        </FBtn>
        {chartData && !loading && <FBtn onClick={doExport}>⬇ Export {exportFmt}</FBtn>}
      </div>
    </Modal>;
};

// ─── NewSOModal ───────────────────────────────────────────────────────────────
const NewSOModal = ({
  open,
  onClose,
  onSave,
  itemCategories: itemCategoryOptions = [],
  onAddItemCategory
}) => {
  const ITEM_CATEGORY_DEFAULTS = ["Refrigerant", "Compressor", "Electrical / PCB", "Filter", "Capacitor", "Copper Pipe", "Drain Pipe", "Gas Valve", "Fan Motor", "Remote / Sensor", "Lubricant", "Tools", "Split AC", "Window AC", "Cassette AC", "Portable AC", "Duct AC", "Installation Kit", "Stabilizer", "AMC Package", "Extended Warranty", "Spare Part", "Other"];
  const itemCategoryList = itemCategoryOptions.length ? itemCategoryOptions : ITEM_CATEGORY_DEFAULTS;
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [liveCustomers, setLiveCustomers] = useState([]);
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("2026-04-25");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setCustomer(""); setPhone(""); setDeliveryDate("2026-04-25"); setPaymentStatus("pending");
    setAddress(""); setNotes(""); setError("");
    customersApi.list({ limit: 200 }).then(r => setLiveCustomers(r.data ?? [])).catch(() => {});
  }, [open]);
  const handleCustomerChange = e => {
    const val = e.target.value;
    setCustomer(val);
    const cust = liveCustomers.find(c => c._id === val);
    setPhone(cust?.phone || "");
    setAddress(cust?.address || "");
  };
  const [items, setItems] = useState([{ id: 1, name: "", category: "Split AC", qty: "", price: "" }]);
  const [gst, setGst] = useState(18);
  const addItem = () => setItems(prev => [...prev, { id: Date.now(), name: "", category: "Split AC", qty: "", price: "" }]);
  const removeItem = id => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id, field, value) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.price) || 0), 0);
  const gstAmt = subtotal * gst / 100;
  const total = subtotal + gstAmt;
  const fmt = n => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const handleSave = async () => {
    setError("");
    if (!customer) return setError("Please select a customer.");
    const validItems = items.filter(i => i.name.trim());
    if (!validItems.length) return setError("Add at least one line item.");
    if (!deliveryDate) return setError("Delivery date is required.");
    setSaving(true);
    try {
      const cust = liveCustomers.find(c => c._id === customer);
      await onSave({
        customer, customerName: cust?.name || "",
        phone, deliveryDate, paymentStatus, address, notes,
        items: validItems, gst, subtotal, gstAmt, total
      });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create order.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="🛍️ New Customer Order" width={680}>
      <SectionHead title="Customer Info" />
      <div className="ap-modals-284">
        <FRow label="Customer *">
          <FSelect value={customer} onChange={handleCustomerChange}>
            <option value="">Select customer…</option>
            {liveCustomers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </FSelect>
        </FRow>
        <FRow label="Phone">
          <FInput type="tel" placeholder="+91 XXXXX XXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
        </FRow>
        <FRow label="Delivery Date *">
          <FInput type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
        </FRow>
        <FRow label="Payment Status">
          <FSelect value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}>
            <option value="pending">Pending</option><option value="paid">Paid</option><option value="partial">Partial</option>
          </FSelect>
        </FRow>
      </div>
      <FRow label="Delivery Address">
        <FInput placeholder="e.g. 12, Satellite Road, Ahmedabad" value={address} onChange={e => setAddress(e.target.value)} />
      </FRow>
 
      <SectionHead title="Line Items" />
      <div className="line-items-scroll">
        <div className="ap-modals-285">
          <span className="ap-modals-286">Item / Description</span>
          <span className="ap-modals-287">
            Category
            <button type="button" title="Add new category" onClick={() => setShowAddCategory(true)} className="ap-modals-288">＋</button>
          </span>
          <span className="ap-modals-286">Qty</span>
          <span className="ap-modals-286">Unit Price (₹)</span>
          <span />
        </div>
        <div className="ap-modals-289">
          {items.map(item => <div key={item.id} className="ap-modals-290">
              <input placeholder="Item name / description" value={item.name} onChange={e => updateItem(item.id, "name", e.target.value)} className="ap-modals-291" />
              <select value={item.category} onChange={e => updateItem(item.id, "category", e.target.value)} className="ap-modals-292">
                {itemCategoryList.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" placeholder="0" value={item.qty} onChange={e => updateItem(item.id, "qty", e.target.value)} className="ap-modals-291" />
              <input type="number" placeholder="0" value={item.price} onChange={e => updateItem(item.id, "price", e.target.value)} className="ap-modals-291" />
              <button onClick={() => removeItem(item.id)} disabled={items.length === 1} style={{ opacity: items.length === 1 ? "0.3" : "1" }} className="ap-modals-293">×</button>
            </div>)}
        </div>
      </div>
      <button onClick={addItem} className="ap-modals-294">+ Add Item</button>
 
      <div className="ap-modals-295">
        <div className="ap-modals-296">
          <div className="ap-modals-297">SUBTOTAL</div>
          <div className="ap-modals-298">{fmt(subtotal)}</div>
        </div>
        <div className="ap-modals-299">
          <div className="ap-modals-300">
            <span className="ap-modals-301">GST</span>
            <select value={gst} onChange={e => setGst(Number(e.target.value))} className="ap-modals-302">
              {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
          <div className="ap-modals-303">{fmt(gstAmt)}</div>
        </div>
        <div className="ap-modals-304">
          <div className="ap-modals-305">TOTAL</div>
          <div className="ap-modals-306">{fmt(total)}</div>
        </div>
      </div>
 
      <SectionHead title="Notes" />
      <FRow label="Order Notes / Instructions">
        <FTextarea placeholder="Special delivery instructions, installation preferences, notes for the team…" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
      </FRow>
 
      {error && <div className="ap-modals-60">{error}</div>}
      <div className="ap-modals-307">
        <FBtn secondary onClick={onClose} disabled={saving}>Cancel</FBtn>
        <FBtn onClick={handleSave} disabled={saving}>{saving ? "Creating…" : "Create Order"}</FBtn>
      </div>
      {showAddCategory && <AddOptionModal label="Item Category" placeholder="e.g. Insulation, Sensors…" onClose={() => setShowAddCategory(false)} onSave={v => onAddItemCategory?.(v)} />}
    </Modal>;
};

// ─── StatusUpdateModal ────────────────────────────────────────────────────────
// Confirms + persists a ticket status change.
// `statusMeta` = { bg, color, label } from TKT_STATUS[newStatus], used just for styling the pill.
const StatusUpdateModal = ({
  open,
  onClose,
  onConfirm,
  ticket,
  newStatus,
  statusMeta
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) setError("");
  }, [open, newStatus]);
  if (!ticket) return null;
  const handleConfirm = async () => {
    setError("");
    setSaving(true);
    try {
      await onConfirm(newStatus);
      onClose();
    } catch (e) {
      setError(e.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal open={open} onClose={onClose} title="🔄 Update Ticket Status" width={420}>
      <div className="ap-modals-308">
        Mark <strong className="ap-modals-309">{ticket.displayId}</strong> — “{ticket.subject}” as:
      </div>

      <div style={{
      background: statusMeta?.bg,
      color: statusMeta?.color
    }} className="ap-modals-310">
        ● {statusMeta?.label}
      </div>

      {error && <div className="ap-modals-311">
          {error}
        </div>}

      <div className="ap-modals-312">
        <FBtn secondary onClick={onClose} disabled={saving}>
          Cancel
        </FBtn>
        <FBtn onClick={handleConfirm} disabled={saving}>
          {saving ? "Updating…" : "Confirm"}
        </FBtn>
      </div>
    </Modal>;
};
export { NewJobModal, NewQuotationModal, NewCustomerModal, NewAMCModal, NewInvoiceModal, AddTechnicianModal, AddExpenseModal, AddInventoryModal, NewLeadModal, NewPOModal, NewSupplierModal, NewAssetModal, RegisterWarrantyModal, NewNoticeModal, MarkAttendanceModal, AdvanceModal, SendQuotationModal, ConvertToJobModal, ReportModal, AddAdminUserModal, UseInventoryModal, LogFuelModal, ScheduleAMCModal, RequestReviewModal, AssignComplaintModal, ResolveComplaintModal, SetReminderModal, CustomReportModal, NewTicketModal, NewSOModal, StatusUpdateModal };