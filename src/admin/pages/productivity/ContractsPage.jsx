// ContractsPage.jsx
import { useState, useEffect } from "react";
import { contractsApi } from "../../services/api";
import { contracts as initialContracts } from "../../data/mockData";
import { COLORS, FONTS } from "../../constants/tokens";
import { KCard, Thead } from "../../components/ui/Cards";
import ActionDropdown from "../../components/ui/ActionDropdown";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import EditableDetailView from "../../components/ui/EditableDetailView";
import PDFPreview from "../../components/layout/PDFPreview";
import { useTableSearch } from "../..//hooks/useTableSearch";
import TableSearchBar from "../../components/ui/TableSearchBar";
import FilterSelect from "../../components/ui/FilterSelect";
import { usePagination } from "../../hooks/usePagination";
import Pagination from "../../components/ui/Pagination";
import ExportDropdown from "../../components/layout/ExportDropdown";
import useExport from "../../hooks/useExport";

// ─── Contract status colour map ───────────────────────────────────────────────
const conStatus = {
  active: {
    label: "Active",
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  },
  draft: {
    label: "Draft",
    bg: "var(--bg)",
    color: "var(--text-body)",
    dot: "var(--text-faint)"
  },
  pending_signature: {
    label: "Pending Signature",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    dot: "var(--warning)"
  },
  expired: {
    label: "Expired",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)",
    dot: "var(--danger)"
  },
  inactive: {
    label: "Inactive",
    bg: "var(--bg)",
    color: "var(--text-muted)",
    dot: "var(--text-faint)"
  }
};

// ─── Column config for export ─────────────────────────────────────────────────
const CONTRACT_COLUMNS = [{
  label: "Contract ID",
  key: "id",
  width: 13,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: COLORS.brand,
    fontSize: 11
  }
}, {
  label: "Title",
  key: "title",
  width: 28,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: "Customer",
  key: "customer",
  width: 18,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Type",
  key: "type",
  width: 14,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Value (₹)",
  key: "value",
  width: 12,
  format: v => v,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: COLORS.brand
  }
}, {
  label: "Status",
  key: "status",
  width: 12,
  format: v => v,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Signed",
  key: "signed",
  width: 8,
  format: v => v ? "Yes" : "No",
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Auto-Renew",
  key: "autoRenew",
  width: 10,
  format: v => v ? "Yes" : "No",
  tdStyle: {
    fontSize: 12
  }
}];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FieldLabel = ({
  children
}) => <div className="ap-contracts-page-1">
    {children}
  </div>;
const FieldValue = ({
  children
}) => <div className="ap-contracts-page-2">{children || "—"}</div>;
const SectionTitle = ({
  children
}) => <div className="ap-contracts-page-3">
    {children}
  </div>;
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

// ─── Local contract-action modals ──────────────────────────────────────────
const ModalShell = ({ title, onClose, children, width = 420 }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{
      background: COLORS.white, borderRadius: 14, padding: 22, width,
      maxWidth: '92vw', boxShadow: '0 10px 40px rgba(0,0,0,.2)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.h1 }}>{title}</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', color: COLORS.faint }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const SendSignatureModal = ({ onClose, onSubmit, saving }) => {
  const [rows, setRows] = useState([{ name: '', email: '' }]);
  const update = (i, key, val) => setRows(r => r.map((row, idx) => idx === i ? { ...row, [key]: val } : row));
  return (
    <ModalShell title="Send for E-Signature" onClose={onClose}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input placeholder="Name" value={row.name} onChange={(e) => update(i, 'name', e.target.value)} style={iStyle()} />
          <input placeholder="Email" value={row.email} onChange={(e) => update(i, 'email', e.target.value)} style={iStyle()} />
        </div>
      ))}
      <button onClick={() => setRows(r => [...r, { name: '', email: '' }])}
        style={{ fontSize: 12, color: COLORS.brand, background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 14 }}>
        + Add signatory
      </button>
      <button
        disabled={saving || !rows.some(r => r.name.trim())}
        onClick={() => onSubmit(rows.filter(r => r.name.trim()))}
        style={{ width: '100%', padding: 11, borderRadius: 9, border: 'none', color: 'white', fontWeight: 700,
          background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, opacity: saving ? 0.6 : 1 }}
      >
        {saving ? 'Sending…' : 'Send'}
      </button>
    </ModalShell>
  );
};

const ScheduleVisitModal = ({ onClose, onSubmit, saving }) => {
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <ModalShell title="Schedule Visit" onClose={onClose}>
      <FieldLabel>Visit Date</FieldLabel>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...iStyle(), marginBottom: 10 }} />
      <FieldLabel>Notes</FieldLabel>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
        style={{ ...iStyle(), marginBottom: 14, resize: 'vertical' }} />
      <button
        disabled={saving || !date}
        onClick={() => onSubmit({ date, notes })}
        style={{ width: '100%', padding: 11, borderRadius: 9, border: 'none', color: 'white', fontWeight: 700,
          background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, opacity: saving ? 0.6 : 1 }}
      >
        {saving ? 'Scheduling…' : 'Schedule'}
      </button>
    </ModalShell>
  );
};

const AddClauseModal = ({ onClose, onSubmit, saving }) => {
  const [text, setText] = useState('');
  return (
    <ModalShell title="Add Clause" onClose={onClose}>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Clause text…"
        style={{ ...iStyle(), marginBottom: 14, resize: 'vertical' }} />
      <button
        disabled={saving || !text.trim()}
        onClick={() => onSubmit(text)}
        style={{ width: '100%', padding: 11, borderRadius: 9, border: 'none', color: 'white', fontWeight: 700,
          background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, opacity: saving ? 0.6 : 1 }}
      >
        {saving ? 'Adding…' : 'Add Clause'}
      </button>
    </ModalShell>
  );
};

const AuditTrailModal = ({ onClose, entries, loading }) => (
  <ModalShell title="Audit Trail" onClose={onClose} width={480}>
    {loading ? (
      <div style={{ fontSize: 13, color: COLORS.muted }}>Loading…</div>
    ) : entries.length === 0 ? (
      <div style={{ fontSize: 13, color: COLORS.muted }}>No activity recorded yet.</div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
        {entries.map((e, i) => (
          <div key={i} style={{ borderLeft: `2px solid ${COLORS.brand}`, paddingLeft: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.h1 }}>{e.action}</div>
            {e.detail && <div style={{ fontSize: 12, color: COLORS.body }}>{e.detail}</div>}
            <div style={{ fontSize: 11, color: COLORS.faint }}>
              {e.by || 'System'} · {new Date(e.at).toLocaleString('en-IN')}
            </div>
          </div>
        ))}
      </div>
    )}
  </ModalShell>
);

// ─── ContractDetail ───────────────────────────────────────────────────────────
const ContractDetail = ({
  contract,
  onBack,
  onSave,
  onDelete,
  openModal,
  initialEditMode
}) => {
  const [showPDF, setShowPDF] = useState(false);
  const [localModal, setLocalModal] = useState(null); // 'signature' | 'schedule' | 'clause' | 'audit'
const [acting, setActing] = useState(false);
const [inlineMsg, setInlineMsg] = useState(null);
const [auditEntries, setAuditEntries] = useState([]);
const [auditLoading, setAuditLoading] = useState(false);

const flash = (msg) => { setInlineMsg(msg); setTimeout(() => setInlineMsg(null), 3000); };

const runAction = async (fn, successMsg) => {
  setActing(true);
  try {
    await fn();
    flash(successMsg);
    setLocalModal(null);
    onRefresh?.();
  } catch (err) {
    flash(err.message || 'Something went wrong.');
  } finally {
    setActing(false);
  }
};

const handleSendSignature = (signatories) =>
  runAction(() => contractsApi.sendSignature(contract.id, signatories), 'Sent for signature!');

const handleScheduleVisit = (payload) =>
  runAction(() => contractsApi.scheduleVisit(contract.id, payload), 'Visit scheduled!');

const handleAddClause = (text) =>
  runAction(() => contractsApi.addClause(contract.id, text), 'Clause added!');

const handleClone = () => {
  if (!window.confirm('Create a copy of this contract as a new draft?')) return;
  runAction(() => contractsApi.clone(contract.id), 'Contract cloned!');
};

const handleMarkSigned = (idx) =>
  runAction(() => contractsApi.markSignatorySigned(contract.id, idx), 'Marked as signed!');

const openAudit = async () => {
  setLocalModal('audit');
  setAuditLoading(true);
  try {
    const res = await contractsApi.getAuditTrail(contract.id);
    setAuditEntries(res.data || []);
  } catch {
    setAuditEntries([]);
  } finally {
    setAuditLoading(false);
  }
};

  const fields = [{
    key: "status"
  }, {
    key: "title"
  }, {
    key: "customer"
  }, {
    key: "contact"
  }, {
    key: "phone"
  }, {
    key: "officePhone"
  }, {
    key: "email"
  }, {
    key: "type"
  }, {
    key: "plan"
  }, {
    key: "startDate"
  }, {
    key: "endDate"
  }, {
    key: "autoRenew"
  }, {
    key: "noDueDate"
  }, {
    key: "clauses"
  }, {
    key: "linkedAMC"
  }, {
    key: "linkedLead"
  }, {
    key: "terms"
  }, {
    key: "value"
  }, {
    key: "currency"
  }, {
    key: "paymentTerms"
  }, {
    key: "visitsPerYear"
  }, {
    key: "acUnitsCovered"
  }, {
    key: "acBrand"
  }, {
    key: "acCapacity"
  }, {
    key: "assignedTechnician"
  },
  // Address fields (matching AddressFields prefix "con_")
  {
    key: "con_street"
  }, {
    key: "con_city"
  }, {
    key: "con_state"
  }, {
    key: "con_pincode"
  }, {
    key: "con_country"
  }, {
    key: "altAddress"
  }, {
    key: "internalNotes"
  }];
  const signatories = <div className="ap-contracts-page-4">
      <div className="ap-contracts-page-5">
        Signatories
      </div>
      {contract.signed ? contract.signatories.map((s, i) => <div key={i} className="ap-contracts-page-6">
            <span className="ap-contracts-page-7">✓</span>
            <span className="ap-contracts-page-8">
              {s}
            </span>
          </div>) : contract.signatories.length === 0 ? <div className="ap-contracts-page-9">
          📋 Contract not yet sent for signature.
        </div> : contract.signatories.map((s, i) => <div key={i} style={{
      background: s.includes("PENDING") ? "var(--warning-bg)" : "var(--success-bg)",
      border: `1px solid ${s.includes("PENDING") ? "#FDE68A" : "#BBF7D0"}`
    }} className="ap-contracts-page-10">
            <span style={{
        color: s.includes("PENDING") ? "var(--warning)" : "var(--success-text)"
      }} className="ap-contracts-page-11">
              {s.includes("PENDING") ? "⏳" : "✓"}
            </span>
            <span style={{
        color: s.includes("PENDING") ? "var(--warning-text)" : "var(--success-text)"
      }} className="ap-contracts-page-12">
              {s}
            </span>
          </div>)}
    </div>;
  const actions = () => (
  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
    {!contract.signed && (
      <button className="btn" onClick={() => setLocalModal('signature')} style={{ flex: 1, padding: '11px', borderRadius: 9,
        background: `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD})`, color: 'white', fontSize: 13, fontWeight: 700, border: 'none' }}>
        ✉ Send for E-Signature
      </button>
    )}
    <button className="btn" onClick={() => setShowPDF(true)} style={{ padding: '11px 16px', borderRadius: 9,
      background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A', fontSize: 13, fontWeight: 700 }}>
      📥 Download PDF
    </button>
    {contract.status === 'active' && (
      <button className="btn" onClick={() => setLocalModal('schedule')} style={{ padding: '11px 16px', borderRadius: 9,
        background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 13, fontWeight: 700 }}>
        📅 Schedule Visit
      </button>
    )}
  </div>
);
  return <>
      <EditableDetailView id={contract.contractId || contract.id} breadcrumb="Contracts" onBack={onBack} fields={fields} data={contract} initialEditMode={initialEditMode} onSave={onSave} onDelete={() => onDelete(contract.id)}>
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
        const st = conStatus[editMode ? val("status") : contract.status] || conStatus.draft;

        // ── Sidebar ──────────────────────────────────────────────────────
        const sidebar = <div className="ap-contracts-page-17">
              {/* Contact Card */}
              <div style={{
            border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`
          }} className="ap-contracts-page-18">
                <div className="ap-contracts-page-19">
                  Contact
                  {editMode && <span className="ap-contracts-page-20">
                      ← editable
                    </span>}
                </div>
                {editMode ? <div className="ap-contracts-page-21">
                    {[["Contact Name", "contact"], ["Phone", "phone"], ["Office Phone", "officePhone"], ["Email", "email"]].map(([label, key]) => <div key={key}>
                        <FieldLabel>{label}</FieldLabel>
                        <input value={val(key)} onChange={setK(key)} className="ap-contracts-page-22" />
                      </div>)}
                  </div> : [["Name", contract.contact], ["Phone", contract.phone], ["Office", contract.officePhone], ["Email", contract.email]].map(([k, v]) => v ? <div key={k} className="ap-contracts-page-23">
                        <span className="ap-contracts-page-24">
                          {k}
                        </span>
                        <span className="ap-contracts-page-25">
                          {v}
                        </span>
                      </div> : null)}
              </div>

              {/* Financial Summary */}
              <div className="ap-contracts-page-26">
                <div className="ap-contracts-page-27">
                  Financial
                </div>
                {[["Currency", contract.currency || "INR (₹)"], ["Payment Terms", contract.paymentTerms || "—"], ["Auto-Renew", contract.autoRenew ? "Yes" : "No"]].map(([k, v]) => <div key={k} className="ap-contracts-page-28">
                    <span className="ap-contracts-page-29">
                      {k}
                    </span>
                    <span className="ap-contracts-page-30">
                      {v}
                    </span>
                  </div>)}
              </div>

              {/* AC Equipment Summary */}
              <div className="ap-contracts-page-31">
                <div className="ap-contracts-page-32">
                  AC Equipment
                </div>
                {[["Units Covered", contract.acUnitsCovered], ["Brand / Model", contract.acBrand], ["Capacity", contract.acCapacity], ["Visits / Year", contract.visitsPerYear], ["Technician", contract.assignedTechnician]].map(([k, v]) => v ? <div key={k} className="ap-contracts-page-33">
                      <span className="ap-contracts-page-34">
                        {k}
                      </span>
                      <span className="ap-contracts-page-35">
                        {v}
                      </span>
                    </div> : null)}
              </div>

              {/* Linked Lead */}
              {contract.linkedLead && <div className="ap-contracts-page-36">
                  <div className="ap-contracts-page-37">
                    Linked Lead
                  </div>
                  <div className="ap-contracts-page-38">
                    {contract.linkedLead}
                  </div>
                  <div className="ap-contracts-page-39">
                    CRM lead that generated this contract
                  </div>
                </div>}

              {/* Quick Actions */}
              {!editMode && <div className="ap-contracts-page-40">
                  <div className="ap-contracts-page-41">
                    Quick Actions
                  </div>
                  {['Clone Contract', 'Add Clause', 'View Audit Trail'].map((a) => (
  <button key={a} className="ib"
    onClick={() => {
      if (a === 'Clone Contract') handleClone();
      else if (a === 'Add Clause') setLocalModal('clause');
      else openAudit();
    }}
    style={{ width: '100%', padding: '9px 12px', textAlign: 'left', background: 'transparent', border: 'none',
      cursor: 'pointer', fontSize: 12, color: COLORS.body, borderRadius: 7, marginBottom: 2 }}
  >
    › {a}
  </button>
))}
                </div>}
            </div>;

        // ── Main panel ───────────────────────────────────────────────────
        return <div className="ap-contracts-page-43">
              <div style={{
            border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
            boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.05)"
          }} className="ap-contracts-page-44">
                {/* ── Header: status / title / value ── */}
                <div className="ap-contracts-page-45">
                  <div className="ap-contracts-page-46">
                    {editMode ? <select value={val("status")} onChange={setK("status")} style={{
                  ...iStyle()
                }} className="ap-contracts-page-47">
                        {Object.entries(conStatus).map(([k, v]) => <option key={k} value={k}>
                            {v.label}
                          </option>)}
                      </select> : <span className="badge ap-contracts-page-48" style={{
                  background: st.bg,
                  color: st.color
                }}>
                        {st.label}
                      </span>}

                    {editMode ? <input value={val("title")} onChange={setK("title")} style={iStyle({
                  fontSize: 18,
                  fontWeight: 800,
                  marginBottom: 6
                })} /> : <div className="ap-contracts-page-49">
                        {contract.title}
                      </div>}

                    {editMode ? <div className="ap-contracts-page-50">
                        <input value={val("customer")} onChange={setK("customer")} placeholder="Customer" style={iStyle({
                    fontSize: 12
                  })} />
                        <input value={val("contact")} onChange={setK("contact")} placeholder="Contact" style={iStyle({
                    fontSize: 12
                  })} />
                      </div> : <div className="ap-contracts-page-51">
                        {contract.customer} · {contract.contact}
                      </div>}
                  </div>

                  <div className="ap-contracts-page-52">
                    <div className="ap-contracts-page-53">
                      Contract Value
                    </div>
                    {editMode ? <input value={val("value")} onChange={setK("value")} type="number" style={iStyle({
                  fontSize: 22,
                  fontWeight: 800,
                  color: COLORS.brand,
                  fontFamily: FONTS.mono,
                  textAlign: "right",
                  width: 160
                })} /> : <div className="ap-contracts-page-54">
                        ₹{contract.value?.toLocaleString()}
                      </div>}
                  </div>
                </div>

                {/* ── Section: Contract Details ── */}
                <SectionTitle>Contract Details</SectionTitle>
                <div className="ap-contracts-page-55">
                  {editMode ? <>
                      {[["Type", "type"], ["Plan", "plan"], ["Start Date", "startDate"], ["End Date", "endDate"], ["Linked AMC", "linkedAMC"], ["Linked Lead", "linkedLead"]].map(([label, key]) => <div key={key}>
                          <FieldLabel>{label}</FieldLabel>
                          <input value={val(key)} onChange={setK(key)} style={iStyle({
                    fontSize: 12
                  })} />
                        </div>)}
                      <div>
                        <FieldLabel>Clauses</FieldLabel>
                        <input value={val("clauses")} onChange={setK("clauses")} type="number" style={iStyle({
                    fontSize: 12
                  })} />
                      </div>
                      <div>
                        <FieldLabel>Auto-Renew</FieldLabel>
                        <select value={val("autoRenew") === true || val("autoRenew") === "yes" ? "yes" : "no"} onChange={e => setEditData(p => ({
                    ...p,
                    autoRenew: e.target.value === "yes"
                  }))} style={iStyle({
                    fontSize: 12
                  })}>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                    </> : <>
                      {[["Type", contract.type], ["Plan", contract.plan], ["Start", contract.startDate || "—"], ["End", contract.endDate || "—"], ["Auto-Renew", contract.autoRenew ? "Yes" : "No"], ["Clauses", contract.clauses ? `${contract.clauses} clauses` : "—"], ["Linked AMC", contract.linkedAMC || "—"], ["Linked Lead", contract.linkedLead || "—"]].map(([k, v]) => <div key={k}>
                          <FieldLabel>{k}</FieldLabel>
                          <FieldValue>{v}</FieldValue>
                        </div>)}
                    </>}
                </div>

                {/* ── Section: Financial Details ── */}
                <SectionTitle>Financial Details</SectionTitle>
                <div className="ap-contracts-page-56">
                  {editMode ? <>
                      <div>
                        <FieldLabel>Currency</FieldLabel>
                        <select value={val("currency") || "INR (₹)"} onChange={setK("currency")} style={iStyle({
                    fontSize: 12
                  })}>
                          {["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "AED (د.إ)"].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel>Payment Terms</FieldLabel>
                        <select value={val("paymentTerms")} onChange={setK("paymentTerms")} style={iStyle({
                    fontSize: 12
                  })}>
                          {["Upfront / Full Payment", "Quarterly", "Half-Yearly", "Monthly", "On Completion", "Net 15", "Net 30"].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel>Visits / Year</FieldLabel>
                        <input value={val("visitsPerYear")} onChange={setK("visitsPerYear")} type="number" style={iStyle({
                    fontSize: 12
                  })} />
                      </div>
                    </> : [["Currency", contract.currency || "INR (₹)"], ["Payment Terms", contract.paymentTerms || "—"], ["Visits / Year", contract.visitsPerYear || "—"]].map(([k, v]) => <div key={k}>
                        <FieldLabel>{k}</FieldLabel>
                        <FieldValue>{v}</FieldValue>
                      </div>)}
                </div>

                {/* ── Section: AC Equipment ── */}
                <SectionTitle>AC Equipment</SectionTitle>
                <div className="ap-contracts-page-57">
                  {editMode ? <>
                      <div>
                        <FieldLabel>Units Covered</FieldLabel>
                        <input value={val("acUnitsCovered")} onChange={setK("acUnitsCovered")} type="number" style={iStyle({
                    fontSize: 12
                  })} />
                      </div>
                      <div>
                        <FieldLabel>Brand / Model</FieldLabel>
                        <input value={val("acBrand")} onChange={setK("acBrand")} placeholder="e.g. Daikin, Voltas" style={iStyle({
                    fontSize: 12
                  })} />
                      </div>
                      <div>
                        <FieldLabel>Capacity</FieldLabel>
                        <select value={val("acCapacity")} onChange={setK("acCapacity")} style={iStyle({
                    fontSize: 12
                  })}>
                          {["Any / Mixed", "0.75 T", "1.0 T", "1.5 T", "2.0 T", "2.5 T +", "VRF / Cassette"].map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="ap-contracts-page-58">
                        <FieldLabel>Assigned Technician</FieldLabel>
                        <input value={val("assignedTechnician")} onChange={setK("assignedTechnician")} style={iStyle({
                    fontSize: 12
                  })} />
                      </div>
                    </> : [["Units Covered", contract.acUnitsCovered], ["Brand / Model", contract.acBrand], ["Capacity", contract.acCapacity], ["Technician", contract.assignedTechnician]].map(([k, v]) => <div key={k}>
                        <FieldLabel>{k}</FieldLabel>
                        <FieldValue>{v}</FieldValue>
                      </div>)}
                </div>

                {/* ── Section: Client Address ── */}
                <SectionTitle>Client Address</SectionTitle>
                <div className="ap-contracts-page-59">
                  {/* Street */}
                  <div className="ap-contracts-page-60">
                    <FieldLabel>Street / Flat / Building</FieldLabel>
                    {editMode ? <input value={val("con_street")} onChange={setK("con_street")} placeholder="e.g. Flat 4B, Green Apartments, SG Road" style={iStyle({
                  fontSize: 12
                })} /> : <FieldValue>{contract.con_street}</FieldValue>}
                  </div>

                  {/* City / State / Pincode / Country */}
                  <div className="ap-contracts-page-61">
                    {editMode ? <>
                        {[["City", "con_city", "e.g. Ahmedabad"], ["State", "con_state", "e.g. Gujarat"], ["Pincode", "con_pincode", "380001"], ["Country", "con_country", "India"]].map(([label, key, placeholder]) => <div key={key}>
                            <FieldLabel>{label}</FieldLabel>
                            <input value={val(key)} onChange={setK(key)} placeholder={placeholder} style={iStyle({
                      fontSize: 12
                    })} />
                          </div>)}
                      </> : [["City", contract.con_city], ["State", contract.con_state], ["Pincode", contract.con_pincode], ["Country", contract.con_country]].map(([k, v]) => <div key={k}>
                          <FieldLabel>{k}</FieldLabel>
                          <FieldValue>{v}</FieldValue>
                        </div>)}
                  </div>

                  {/* Alternate / Site Address */}
                  <div className="ap-contracts-page-62">
                    <FieldLabel>Alternate / Site Address</FieldLabel>
                    {editMode ? <textarea value={val("altAddress")} onChange={setK("altAddress")} rows={2} placeholder="Site address if different from billing…" className="ap-contracts-page-63" /> : <FieldValue>{contract.altAddress}</FieldValue>}
                  </div>
                </div>

                {/* ── Section: Key Terms ── */}
                <SectionTitle>Key Terms</SectionTitle>
                <div style={{
              background: editMode ? "var(--bg)" : "var(--bg)",
              border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`
            }} className="ap-contracts-page-64">
                  {editMode ? <textarea value={val("terms")} onChange={setK("terms")} className="ap-contracts-page-65" /> : <div className="ap-contracts-page-66">
                      {contract.terms || "—"}
                    </div>}
                </div>

                {/* ── Signatories + Actions (view mode only) ── */}
                {!editMode && <>
                    {signatories}
                    {actions(openModal)}
                  </>}
              </div>

              {sidebar}

                  {inlineMsg && (
  <div style={{ position: 'fixed', bottom: 24, right: 24, background: COLORS.h1, color: 'white',
    padding: '10px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, zIndex: 1100, boxShadow: '0 6px 20px rgba(0,0,0,.2)' }}>
    {inlineMsg}
  </div>
)}
{localModal === 'signature' && <SendSignatureModal onClose={() => setLocalModal(null)} onSubmit={handleSendSignature} saving={acting} />}
{localModal === 'schedule'  && <ScheduleVisitModal  onClose={() => setLocalModal(null)} onSubmit={handleScheduleVisit} saving={acting} />}
{localModal === 'clause'    && <AddClauseModal      onClose={() => setLocalModal(null)} onSubmit={handleAddClause} saving={acting} />}
{localModal === 'audit'     && <AuditTrailModal      onClose={() => setLocalModal(null)} entries={auditEntries} loading={auditLoading} />}

            </div>;
      }}
      </EditableDetailView>

      <PDFPreview open={showPDF} onClose={() => setShowPDF(false)} title={contract.contractId || contract.id} filename={`contract-${contract.contractId}`} template="contract" data={contract} />
    </>;
};

// ─── ContractsPage ────────────────────────────────────────────────────────────
const ContractsPage = ({
  openModal
}) => {
  const [open, setOpen] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [initialEditMode, setInitialEditMode] = useState(false);
  const contract = open ? contracts.find(c => c.id === open) : null;
  const totalActive = contracts.filter(c => c.status === "active").reduce((s, c) => s + c.value, 0);
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: filteredContracts
  } = useTableSearch(contracts, ["id", "title", "customer", "contact", "type", "status"], {
    type: "",
    status: ""
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
  } = usePagination(filteredContracts, 10);
  const {
    exportProps
  } = useExport({
    title: "Contracts",
    filename: "cooltech-contracts",
    template: "generic_list",
    subtitle: `AC Services Platform · Contracts · ${filteredContracts.length} records`,
    docId: "CON-EXPORT",
    columns: CONTRACT_COLUMNS,
    rows: filteredContracts,
    showTotals: true,
    totalColumns: ["value"]
  });
  const loadContracts = async () => {
    try {
      const res = await contractsApi.list();
      setContracts(res.data ?? res);
    } catch (err) {
      console.error("Failed to load contracts", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadContracts();
    // Refresh the list whenever a modal save fires window.dispatchEvent(new
    // Event('focus')) in App.jsx (same pattern used by every other page).
    window.addEventListener("focus", loadContracts);
    return () => window.removeEventListener("focus", loadContracts);
  }, []);
  const handleSave = async updated => {
    try {
      const saved = await contractsApi.update(updated.id, updated);
      setContracts(prev => prev.map(c => c.id === saved.id ? saved : c));
    } catch (err) {
      console.error("Save failed", err);
    }
  };
  const handleDelete = async id => {
    try {
      await contractsApi.remove(id);
      setContracts(prev => prev.filter(c => c.id !== id));
      setOpen(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };
  const handleBack = () => {
    setOpen(null);
    setInitialEditMode(false);
  };
  if (contract) {
    return <ContractDetail
  contract={contract}
  onBack={handleBack}
  onSave={handleSave}
  onDelete={handleDelete}
  openModal={openModal}
  initialEditMode={initialEditMode}
  onRefresh={loadContracts}   // ← add this
/>
  }
  return <div className="fu">
      {/* Header */}
      <div className="ap-contracts-page-67">
        <div>
          <div className="ap-contracts-page-68">
            Contracts
          </div>
          <div className="ap-contracts-page-69">
            {total} of {contracts.length} contracts
          </div>
        </div>
        <button className="btn ap-contracts-page-70" onClick={() => openModal("new_contract")}>
          + New Contract
        </button>
      </div>

      {/* KPI cards */}
      <div className="ap-contracts-page-71">
        {[{
        label: "Total Contracts",
        value: contracts.length,
        icon: "📄",
        color: "#3B82F6",
        bg: "#EFF6FF"
      }, {
        label: "Active Value",
        value: `₹${(totalActive / 1000).toFixed(0)}K`,
        icon: "💰",
        color: COLORS.brand,
        bg: COLORS.brandL
      }, {
        label: "Pending Signature",
        value: contracts.filter(c => c.status === "pending_signature").length,
        icon: "✍",
        color: "#F59E0B",
        bg: "#FFFBEB"
      }, {
        label: "Auto-Renewing",
        value: contracts.filter(c => c.autoRenew && c.status === "active").length,
        icon: "🔄",
        color: "#22C55E",
        bg: "#F0FDF4"
      }].map(s => <KCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} iconBg={s.bg} />)}
      </div>

      {/* Table */}
      <div className="ap-contracts-page-72">
        <div className="ap-contracts-page-73">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by title, customer, type…" />
          <FilterSelect value={activeFilters.type} onChange={val => setFilter("type", val)} options={["AMC", "Service", "Installation", "Maintenance", "Comprehensive"]} allLabel="All Types" />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter("status", val)} options={["active", "draft", "expired", "pending_signature", "terminated"]} allLabel="All Statuses" />
          <div className="ap-contracts-page-74">
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div className="ap-contracts-page-75">
          <table className="ap-contracts-page-76">
            <Thead cols={["Contract ID", "Title", "Customer", "Type", "Value", "Status", "Signed", "Auto-Renew", ""]} />
            <tbody>
              {paginated.map((c, i) => {
              const st = conStatus[c.status] || conStatus.draft;
              return <tr key={c.id} className="row ap-contracts-page-77" onClick={() => {
                setInitialEditMode(false);
                setOpen(c.id);
              }} style={{
                background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
              }}>
                    <td className="ap-contracts-page-78">
                      <span className="ap-contracts-page-79">
                        {c.contractId}
                      </span>
                    </td>
                    <td className="ap-contracts-page-80">
                      <div className="ap-contracts-page-81">
                        {c.title}
                      </div>
                    </td>
                    <td className="ap-contracts-page-82">
                      <div className="ap-contracts-page-83">
                        {c.customer}
                      </div>
                      <div className="ap-contracts-page-84">
                        {c.contact}
                      </div>
                    </td>
                    <td className="ap-contracts-page-85">
                      <span className="ap-contracts-page-86">
                        {c.type}
                      </span>
                    </td>
                    <td className="ap-contracts-page-87">
                      <span className="ap-contracts-page-88">
                        ₹{c.value.toLocaleString()}
                      </span>
                    </td>
                    <td className="ap-contracts-page-89">
                      <span className="badge" style={{
                    background: st.bg,
                    color: st.color
                  }}>
                        {st.label}
                      </span>
                    </td>
                    <td className="ap-contracts-page-90">
                      <span className="ap-contracts-page-91">
                        {c.signed ? "✅" : "⏳"}
                      </span>
                    </td>
                    <td className="ap-contracts-page-92">
                      <span style={{
                    color: c.autoRenew ? "var(--success-text)" : "var(--text-muted)"
                  }} className="ap-contracts-page-93">
                        {c.autoRenew ? "Yes" : "No"}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()} className="ap-contracts-page-94">
                      <ActionDropdown onView={() => {
                    setInitialEditMode(false);
                    setOpen(c.id);
                  }} onEdit={() => {
                    setInitialEditMode(true);
                    setOpen(c.id);
                  }} onDelete={() => setDeleteTarget(c.id)} />
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => {
      handleDelete(deleteTarget);
      setDeleteTarget(null);
    }} onCancel={() => setDeleteTarget(null)} message="This contract will be permanently removed." />
    </div>;
};
export default ContractsPage;