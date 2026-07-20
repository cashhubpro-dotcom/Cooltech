import { clientContractsApi, clientTicketsApi } from '../services/clientPortalApi';
import { useState, useEffect, useMemo } from "react";
import { COLORS, FONTS } from "../constants/tokens";
import { Modal, Toast } from "../components/ui/Components";
import { fmtDateDMY } from '../../../shared/formatDate';

// Matches your real Contract.status enum — no 'terminated', has 'cancelled'.
// 'draft' is intentionally omitted — the backend never returns those to a client.
const conStatus = {
  pending_signature: {
    label: "Pending Signature",
    bg: "var(--warning-bg)",
    color: "var(--warning-text)"
  },
  active: {
    label: "Active",
    bg: "var(--success-bg)",
    color: "var(--success-text)"
  },
  expired: {
    label: "Expired",
    bg: "var(--danger-bg)",
    color: "var(--danger-text)"
  },
  cancelled: {
    label: "Cancelled",
    bg: "var(--bg)",
    color: "var(--text-muted)"
  }
};
const FieldLabel = ({
  children
}) => <div className="cp-contracts-page-1">
    {children}
  </div>;
const FieldValue = ({
  children
}) => <div className="cp-contracts-page-2">{children || "—"}</div>;
const SectionTitle = ({
  children
}) => <div className="cp-contracts-page-3">
    {children}
  </div>;
const KpiCard = ({
  label,
  value,
  icon,
  color,
  bg
}) => <div className="cp-contracts-page-4">
    <div style={{
    background: bg
  }} className="cp-contracts-page-5">{icon}</div>
    <div>
      <div className="cp-contracts-page-6">{label}</div>
      <div style={{
      color: color || COLORS.h1
    }} className="cp-contracts-page-7">{value}</div>
    </div>
  </div>;
const iStyle = (extra = {}) => ({
  padding: "8px 12px",
  borderRadius: 8,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 13,
  color: COLORS.h2,
  background: COLORS.white,
  fontFamily: FONTS.sans,
  outline: "none",
  ...extra
});

// ─── Contract Detail ────────────────────────────────────────────────────
const ContractDetail = ({
  contract,
  onBack,
  onAction,
  actionLoading
}) => {
  const st = conStatus[contract.status] || conStatus.active;
  return <div>
      <div className="cp-contracts-page-8">
        <button onClick={onBack} className="cp-contracts-page-9">
          ← Contracts
        </button>
        <span className="cp-contracts-page-10">/</span>
        <span className="cp-contracts-page-11">{contract.contractId}</span>
      </div>

      <div className="cp-contracts-page-12">
        <div className="cp-contracts-page-13">
          <div className="cp-contracts-page-14">
            <div className="cp-contracts-page-15">
              <span className="badge cp-contracts-page-16" style={{
              background: st.bg,
              color: st.color
            }}>{st.label}</span>
              <div className="cp-contracts-page-17">{contract.title}</div>
              <div className="cp-contracts-page-18">
                {contract.type}{contract.plan ? ` · ${contract.plan}` : ""}
              </div>
            </div>
            <div className="cp-contracts-page-19">
              <div className="cp-contracts-page-20">Contract Value</div>
              <div className="cp-contracts-page-21">₹{contract.value?.toLocaleString()}</div>
            </div>
          </div>

          <SectionTitle>Contract Details</SectionTitle>
          <div className="cp-contracts-page-22">
            {[["Start Date", contract.startDate ?fmtDateDMY(new Date(contract.startDate)) : "—"], ["End Date", contract.endDate ?fmtDateDMY(new Date(contract.endDate)) : contract.noDueDate ? "No end date" : "—"], ["Auto-Renew", contract.autoRenew ? "Yes" : "No"], ["Clauses", contract.clauses ? `${contract.clauses} clauses` : "—"], ["Linked AMC", contract.linkedAMC || "—"], ["Payment Terms", contract.paymentTerms || "—"]].map(([k, v]) => <div key={k}><FieldLabel>{k}</FieldLabel><FieldValue>{v}</FieldValue></div>)}
          </div>

          <SectionTitle>AC Equipment Covered</SectionTitle>
          <div className="cp-contracts-page-23">
            {[["Units Covered", contract.acUnitsCovered], ["Brand / Model", contract.acBrand], ["Capacity", contract.acCapacity], ["Visits / Year", contract.visitsPerYear]].map(([k, v]) => <div key={k}><FieldLabel>{k}</FieldLabel><FieldValue>{v}</FieldValue></div>)}
          </div>

          <SectionTitle>Service Address</SectionTitle>
          <div className="cp-contracts-page-24">
            <div className="cp-contracts-page-25">
              <FieldLabel>Street / Building</FieldLabel>
              <FieldValue>{contract.con_street}</FieldValue>
            </div>
            <div className="cp-contracts-page-26">
              {[["City", contract.con_city], ["State", contract.con_state], ["Pincode", contract.con_pincode], ["Country", contract.con_country]].map(([k, v]) => <div key={k}><FieldLabel>{k}</FieldLabel><FieldValue>{v}</FieldValue></div>)}
            </div>
            {contract.altAddress && <div className="cp-contracts-page-27">
                <FieldLabel>Alternate / Site Address</FieldLabel>
                <FieldValue>{contract.altAddress}</FieldValue>
              </div>}
          </div>

          <SectionTitle>Key Terms</SectionTitle>
          <div className="cp-contracts-page-28">
            <div className="cp-contracts-page-29">{contract.terms || "—"}</div>
          </div>

          <SectionTitle>Signatories</SectionTitle>
          <div className="cp-contracts-page-30">
            {contract.signed ? (contract.signatories || []).map((s, i) => <div key={i} className="cp-contracts-page-31">
                  <span className="cp-contracts-page-32">✓</span>
                  <span className="cp-contracts-page-33">{s}</span>
                </div>) : <div className="cp-contracts-page-34">
                ✍ This contract is awaiting your signature.
              </div>}
          </div>

          <div className="cp-contracts-page-35">
            {contract.status === "pending_signature" && <button disabled={actionLoading} onClick={() => onAction("sign", contract)} style={{
            cursor: actionLoading ? "default" : "pointer",
            opacity: actionLoading ? "0.7" : "1"
          }} className="cp-contracts-page-36">
                ✍ Sign Contract
              </button>}
            {contract.document && <a href={contract.document} target="_blank" rel="noreferrer" className="cp-contracts-page-37">
                📥 Download PDF
              </a>}
            {contract.status === "active" && <button disabled={actionLoading} onClick={() => onAction("visit", contract)} className="cp-contracts-page-38">
                📅 Request Service Visit
              </button>}
            {contract.status === "expired" && <button disabled={actionLoading} onClick={() => onAction("renew", contract)} className="cp-contracts-page-39">
                🔄 Request Renewal
              </button>}
            <button disabled={actionLoading} onClick={() => onAction("support", contract)} className="cp-contracts-page-40">
              💬 Contact Support
            </button>
          </div>
        </div>

        <div className="cp-contracts-page-41">
          <div className="cp-contracts-page-42">
            <div className="cp-contracts-page-43">Financial</div>
            {[["Currency", contract.currency || "INR (₹)"], ["Payment Terms", contract.paymentTerms || "—"], ["Auto-Renew", contract.autoRenew ? "Yes" : "No"]].map(([k, v]) => <div key={k} className="cp-contracts-page-44">
                <span className="cp-contracts-page-45">{k}</span>
                <span className="cp-contracts-page-46">{v}</span>
              </div>)}
          </div>

          <div className="cp-contracts-page-47">
            <div className="cp-contracts-page-48">Assigned Technician</div>
            <div className="cp-contracts-page-49">
              <div className="cp-contracts-page-50">
                {contract.assignedTechnician?.[0] || "?"}
              </div>
              <div className="cp-contracts-page-51">{contract.assignedTechnician || "Not yet assigned"}</div>
            </div>
          </div>

          <div className="cp-contracts-page-52">
            <div className="cp-contracts-page-53">Need help?</div>
            <div className="cp-contracts-page-54">
              Questions about this contract, billing, or scheduling? Reach out and CoolTech will get back to you.
            </div>
            <button onClick={() => onAction("support", contract)} className="cp-contracts-page-55">
              Raise a Support Ticket
            </button>
          </div>
        </div>
      </div>
    </div>;
};

// ─── ContractsPage ─────────────────────────────────────────────────────────
const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null);
  const [toast, setToast] = useState(null);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmSign, setConfirmSign] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const contract = open ? contracts.find(c => c.id === open) : null;
  const loadContracts = async () => {
    setLoading(true);
    setError("");
    try {
      const [listRes, summaryRes] = await Promise.all([clientContractsApi.list(), clientContractsApi.summary()]);
      setContracts(listRes.data ?? []);
      setSummary(summaryRes);
    } catch (err) {
      setError(err.message || "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadContracts();
  }, []);
  const filtered = useMemo(() => {
    return contracts.filter(c => {
      const matchesQ = !q || [c.contractId, c.title, c.type].some(f => f?.toLowerCase().includes(q.toLowerCase()));
      const matchesType = !typeFilter || c.type === typeFilter;
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesQ && matchesType && matchesStatus;
    });
  }, [contracts, q, typeFilter, statusFilter]);
  const types = [...new Set(contracts.map(c => c.type))];
  const handleAction = async (action, c) => {
    if (action === "sign") {
      setConfirmSign(c);
      return;
    }
    setActionLoading(true);
    try {
      if (action === "visit") {
        await clientContractsApi.requestService(c.id);
        setToast("Service visit request sent to CoolTech!");
      } else if (action === "renew") {
        await clientContractsApi.requestRenewal(c.id);
        setToast("Renewal request sent — our team will reach out shortly.");
      } else if (action === "support") {
        await clientTicketsApi.create({
          subject: `Query about contract ${c.contractId}`,
          message: `I have a question about my contract "${c.title}" (${c.contractId}).`,
          contractId: c.id
        });
        setToast("Support ticket opened. Our team will contact you soon.");
      }
    } catch (err) {
      setToast(err.message || "Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };
  const confirmSignContract = async () => {
    setActionLoading(true);
    try {
      const updated = await clientContractsApi.sign(confirmSign.id);
      setContracts(prev => prev.map(c => c.id === updated.id ? updated : c));
      setToast("Contract signed successfully!");
    } catch (err) {
      setToast(err.message || "Failed to sign contract");
    } finally {
      setActionLoading(false);
      setConfirmSign(null);
    }
  };
  if (loading) {
    return <div className="fu cp-contracts-page-56">Loading your contracts…</div>;
  }
  if (error) {
    return <div className="fu cp-contracts-page-57">
        <div className="cp-contracts-page-58">{error}</div>
        <button onClick={loadContracts} className="cp-contracts-page-59">
          Retry
        </button>
      </div>;
  }
  if (contract) {
    return <div className="fu">
        <ContractDetail contract={contract} onBack={() => setOpen(null)} onAction={handleAction} actionLoading={actionLoading} />
        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </div>;
  }
  return <div className="fu">
      <div className="cp-contracts-page-60">
        <div>
          <div className="cp-contracts-page-61">Contracts</div>
          <div className="cp-contracts-page-62">All service agreements and contracts with CoolTech</div>
        </div>
      </div>

      <div className="cp-contracts-page-63">
        <KpiCard label="Total Contracts" value={summary?.totalContracts ?? contracts.length} icon="📄" color="#3B82F6" bg="#EFF6FF" />
        <KpiCard label="Active Value" value={`₹${((summary?.activeValue ?? 0) / 1000).toFixed(0)}K`} icon="💰" color={COLORS.brand} bg={COLORS.brandL} />
        <KpiCard label="Pending Signature" value={summary?.pendingSignature ?? 0} icon="✍" color="#F59E0B" bg="#FFFBEB" />
        <KpiCard label="Auto-Renewing" value={summary?.autoRenewing ?? 0} icon="🔄" color="#22C55E" bg="#F0FDF4" />
      </div>

      <div className="cp-contracts-page-64">
        <div className="cp-contracts-page-65">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title, type…" style={iStyle({
          minWidth: 220,
          flex: "1 1 220px"
        })} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={iStyle({
          width: 150
        })}>
            <option value="">All Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={iStyle({
          width: 170
        })}>
            <option value="">All Statuses</option>
            {Object.entries(conStatus).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <div className="cp-contracts-page-66">
          <table className="cp-contracts-page-67">
            <thead>
              <tr className="cp-contracts-page-68">
                {["Contract ID", "Title", "Type", "Value", "Status", "Signed", "Auto-Renew", ""].map(c => <th key={c} className="cp-contracts-page-69">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
              const st = conStatus[c.status] || conStatus.active;
              return <tr key={c.id} onClick={() => setOpen(c.id)} style={{
                background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
              }} onMouseEnter={e => e.currentTarget.style.background = "#F5F7FA"} onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? COLORS.white : "#FAFAFA"} className="cp-contracts-page-70">
                    <td className="cp-contracts-page-71"><span className="cp-contracts-page-72">{c.contractId}</span></td>
                    <td className="cp-contracts-page-73"><div className="cp-contracts-page-74">{c.title}</div></td>
                    <td className="cp-contracts-page-75">
                      <span className="cp-contracts-page-76">{c.type}</span>
                    </td>
                    <td className="cp-contracts-page-77"><span className="cp-contracts-page-78">₹{c.value?.toLocaleString()}</span></td>
                    <td className="cp-contracts-page-79"><span className="badge" style={{
                    background: st.bg,
                    color: st.color
                  }}>{st.label}</span></td>
                    <td className="cp-contracts-page-80"><span className="cp-contracts-page-81">{c.signed ? "✅" : "⏳"}</span></td>
                    <td className="cp-contracts-page-82"><span style={{
                    color: c.autoRenew ? "var(--success-text)" : "var(--text-muted)"
                  }} className="cp-contracts-page-83">{c.autoRenew ? "Yes" : "No"}</span></td>
                    <td onClick={e => e.stopPropagation()} className="cp-contracts-page-84">
                      <button onClick={() => setOpen(c.id)} className="cp-contracts-page-85">
                        View Details →
                      </button>
                    </td>
                  </tr>;
            })}
              {filtered.length === 0 && <tr>
                  <td colSpan={8} className="cp-contracts-page-86">
                    {contracts.length === 0 ? "No contracts on your account yet." : "No contracts match your search."}
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>

        <div className="cp-contracts-page-87">
          Showing {filtered.length} of {contracts.length} contracts
        </div>
      </div>

      <Modal open={!!confirmSign} onClose={() => setConfirmSign(null)} title="Confirm Signature" footer={<div className="cp-contracts-page-88">
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmSign(null)}>Cancel</button>
            <button className="btn btn-sm cp-contracts-page-89" onClick={confirmSignContract} disabled={actionLoading}>
              {actionLoading ? "Signing…" : "✍ Confirm & Sign"}
            </button>
          </div>}>
        {confirmSign && <div className="cp-contracts-page-90">
            You're about to sign <strong>{confirmSign.title}</strong> ({confirmSign.contractId}) for a value of{" "}
            <strong>₹{confirmSign.value?.toLocaleString()}</strong>. By confirming, you agree to the terms outlined in this contract.
          </div>}
      </Modal>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>;
};
export default ContractsPage;