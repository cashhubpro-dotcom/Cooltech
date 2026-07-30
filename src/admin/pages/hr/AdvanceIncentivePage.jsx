import { useState, useEffect, useMemo, useCallback } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import ActionDropdown from '../../components/ui/ActionDropdown';
import { advanceIncentiveApi, techsApi } from '../../services/api';
import { DynamicSelect } from '../../components/modals/Modals';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Constants ────────────────────────────────────────────────────────────────
// ─── Dynamic month options ─────────────────────────────────────────────────
// Add this near generateMonthOptions — separate from fmtDateDMY,
// which is for actual dates (Requested On, etc.)
function fmtMonthYear(d) {
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function generateMonthOptions(monthsBack = 6, monthsForward = 12) {
  const now = new Date();
  const options = [];
  for (let i = monthsForward; i >= -monthsBack; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    options.push(fmtMonthYear(d)); // was fmtDateDMY(d)
  }
  return options;
}

const MONTHS = generateMonthOptions();
const CURRENT_MONTH = fmtMonthYear(new Date()); 

// Fallback defaults — used only until the API has data, same convention as
// RECOVERY_PLAN_DEFAULTS below. Once IncentiveType option-set records exist,
// the DynamicSelect in NewRequestModal renders those instead.
const INCENTIVE_TYPES = ['Performance', 'Customer Rating', 'Special Duty', 'Referral', 'Project Bonus'];

const RECOVERY_PLAN_DEFAULTS = ['1 month (full)', '2 months (split)', '3 months (split)'];

// Extracts the leading number from a label like "3 months (split)" → 3.
// Custom labels an admin adds (e.g. "6 months (split)") still work as long
// as they start with a number.
function monthsFromRecoveryLabel(label = '') {
  const m = /^(\d+)/.exec(String(label).trim());
  return m ? Number(m[1]) : 1;
}

// ─── Real technician resolution ────────────────────────────────────────────────
const AVATAR_TOKEN_PAIRS = [
  ["var(--xfaeeda)", "var(--x854f0b)"],
  ["var(--xe6f1fb)", "var(--x185fa5)"],
  ["var(--xeaf3de)", "var(--x3b6d11)"],
  ["var(--xfaece7)", "var(--x993c1d)"],
  ["var(--xeeedfe)", "var(--x534ab7)"],
];
function avatarTokensFor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_TOKEN_PAIRS[Math.abs(hash) % AVATAR_TOKEN_PAIRS.length];
}
function initialsOf(name = '') {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}
function techOf(record) {
  const name = record?.technician?.name || record?.techName || 'Unknown';
  const role = record?.technician?.role || 'Technician';
  const id = record?.technician?._id || record?.technician || '';
  const [avatarBg, avatarCol] = avatarTokensFor(name);
  return { id, name, role, avatar: initialsOf(name), avatarBg, avatarCol };
}
function fmtDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return fmtDateDMY(d);
}
// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending: { label: 'Pending', bg: "var(--warning-bg)", color: "var(--warning)", border: "var(--warning-border)" },
  approved: { label: 'Approved', bg: "var(--success-bg)", color: "var(--success-text)", border: "var(--success-border)" },
  rejected: { label: 'Rejected', bg: "var(--danger-bg)", color: "var(--danger-text)", border: "var(--danger-border)" },
  paid: { label: 'Paid', bg: "var(--success-bg)", color: "var(--success-text)", border: "var(--success-border)" },
  recovering: { label: 'Recovering', bg: "var(--info-bg)", color: "var(--info-text)", border: "var(--info-border)" },
  recovered: { label: 'Recovered', bg: "var(--bg)", color: "var(--text-muted)", border: "var(--border)" }
};

// ─── Type Config (all 4 categories the backend actually supports) ─────────────
// advance/incentive/bonus/deduction are fixed business categories (they
// decide payroll math + which tab a record shows in), so they're a plain
// config map here rather than an admin-editable option set.
const TYPE_MAP = {
  advance:    { label: 'Advance',    bg: "var(--danger-bg)",  color: "var(--danger-text)",  border: '#FECACA', sign: '-' },
  incentive:  { label: 'Incentive',  bg: "var(--purple-bg)",  color: "var(--purple-text)",  border: '#DDD6FE', sign: '+' },
  bonus:      { label: 'Bonus',      bg: "var(--success-bg)", color: "var(--success-text)", border: '#BBF7D0', sign: '+' },
  deduction:  { label: 'Deduction',  bg: "var(--bg)",         color: "var(--text-muted)",   border: "var(--border)", sign: '-' },
};

function inr(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}
const thStyle = (align = 'left') => ({
  padding: '10px 12px', fontSize: 11, fontWeight: 700, color: COLORS.faint, background: '#FAFAFA',
  borderBottom: `1px solid ${COLORS.border}`, textAlign: align, whiteSpace: 'nowrap'
});
const tdStyle = (extra = {}) => ({
  padding: '12px 12px', fontSize: 12.5, borderBottom: `1px solid ${COLORS.border}22`, verticalAlign: 'middle', ...extra
});

// ─── Shared UI Primitives ─────────────────────────────────────────────────────
const EmpCell = ({ record }) => {
  const e = techOf(record);
  return <div className="ap-advance-incentive-page-1">
      <div style={{ background: e.avatarBg, color: e.avatarCol }} className="ap-advance-incentive-page-2">
        {e.avatar}
      </div>
      <div>
        <div className="ap-advance-incentive-page-3">{e.name}</div>
        <div className="ap-advance-incentive-page-4">{e.role}</div>
      </div>
    </div>;
};
const StatusBadge = ({ status }) => {
  const m = STATUS_MAP[status] || STATUS_MAP.pending;
  return <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }} className="ap-advance-incentive-page-5">
      {m.label}
    </span>;
};
const TypeBadge = ({ type }) => {
  const m = TYPE_MAP[type] || TYPE_MAP.advance;
  return <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }} className="ap-advance-incentive-page-68">
      {m.label}
    </span>;
};
const TypeChip = ({ type }) => <span className="ap-advance-incentive-page-6">
    {type}
  </span>;
const KCard = ({ label, value, sub, icon, iconBg, color }) => <div className="ap-advance-incentive-page-7">
    <div>
      <div className="ap-advance-incentive-page-8">{label}</div>
      <div style={{ color }} className="ap-advance-incentive-page-9">{value}</div>
      <div className="ap-advance-incentive-page-10">{sub}</div>
    </div>
    <div style={{ background: iconBg }} className="ap-advance-incentive-page-11">{icon}</div>
  </div>;
const Overlay = ({ children, onClose }) => <div onClick={onClose} className="ap-advance-incentive-page-12">
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>;
const ModalShell = ({ title, subtitle, accentColor = '#1a2e5c', wide = false, onClose, children }) => <div style={{ width: wide ? "min(720px,96vw)" : "min(520px,95vw)" }} className="ap-advance-incentive-page-13">
    <div style={{ background: accentColor }} className="ap-advance-incentive-page-14">
      <div>
        <div className="ap-advance-incentive-page-15">{title}</div>
        {subtitle && <div className="ap-advance-incentive-page-16">{subtitle}</div>}
      </div>
      <button onClick={onClose} className="ap-advance-incentive-page-17">✕</button>
    </div>
    {children}
  </div>;
const DRow = ({ label, value }) => <div className="ap-advance-incentive-page-18">
    <span className="ap-advance-incentive-page-19">{label}</span>
    <span className="ap-advance-incentive-page-20">{value}</span>
  </div>;

const Field = ({ label, required, children, error }) => <div className="ap-advance-incentive-page-28">
      <label className="ap-advance-incentive-page-29">
        {label}{required && <span className="ap-advance-incentive-page-30"> *</span>}
      </label>
      {children}
      {error && <div className="ap-advance-incentive-page-31">{error}</div>}
    </div>;

// ─── REMARKS MODAL ────────────────────────────────────────────────────────────
const RemarksModal = ({ title, onConfirm, onClose }) => {
  const [remarks, setRemarks] = useState('');
  return <Overlay onClose={onClose}>
      <div className="ap-advance-incentive-page-21">
        <div className="ap-advance-incentive-page-22">{title}</div>
        <div className="ap-advance-incentive-page-23">Add remarks (optional) before confirming.</div>
        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. Approved — recovery starts next month" rows={3} className="ap-advance-incentive-page-24" />
        <div className="ap-advance-incentive-page-25">
          <button onClick={onClose} className="ap-advance-incentive-page-26">Cancel</button>
          <button onClick={() => onConfirm(remarks)} className="ap-advance-incentive-page-27">Confirm</button>
        </div>
      </div>
    </Overlay>;
};

// ─── NEW REQUEST MODAL ────────────────────────────────────────────────────────
// mode: 'advance' | 'incentive' | 'bonus' | 'deduction'
// prefillTech: { _id, name, role } — when opened from TechniciansPage
// technicians: real list fetched from the API, passed down by the parent tab
const MODE_COPY = {
  advance:   { title: 'New Advance Request',   subtitle: 'Deducted from payroll once approved',  accent: '#1a2e5c' },
  incentive: { title: 'New Incentive Request',  subtitle: 'Added to gross earnings once approved', accent: '#0f3d2c' },
  bonus:     { title: 'New Bonus',              subtitle: 'Added to gross earnings once approved', accent: '#166534' },
  deduction: { title: 'New Deduction',          subtitle: 'Deducted from payroll once approved',   accent: '#7C2D12' },
};

const NewRequestModal = ({
  mode,
  technicians = [],
  onSubmit,
  onClose,
  prefillTech = null,
  recoveryPlans = [],
  onAddRecoveryPlan,
  incentiveTypes = [],
  onAddIncentiveType
}) => {
  const isAdv = mode === 'advance';
  const isIncentive = mode === 'incentive';
  const recoveryPlanList = recoveryPlans.length ? recoveryPlans : RECOVERY_PLAN_DEFAULTS;
  const incentiveTypeList = incentiveTypes.length ? incentiveTypes : INCENTIVE_TYPES;
  const copy = MODE_COPY[mode] || MODE_COPY.advance;

  const [form, setForm] = useState({
    techId: prefillTech?._id || '',
    amount: '',
    month: CURRENT_MONTH,
    reason: '',
    recoveryPlan: recoveryPlanList[0] || '1 month (full)',
    type: incentiveTypeList[0] || 'Performance'
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const validate = () => {
    const e = {};
    if (!form.techId) e.techId = 'Select a technician';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = 'Enter a valid amount';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const amt = Number(form.amount) || 0;
  const recoveryMonths = monthsFromRecoveryLabel(form.recoveryPlan);

  const handleSubmit = () => {
    if (!validate()) return;
    const techRecord = prefillTech || technicians.find(t => t._id === form.techId);

    // Base fields shared by all 4 types. Structured `incentiveType` /
    // `recoveryPlan` / `recoveryMonths` are now real schema fields — kept
    // queryable instead of only living inside `reason`/`notes` text — while
    // `notes` still carries a human-readable summary for the existing
    // table columns and detail modals.
    const base = {
      technician: form.techId,
      techName: techRecord?.name || '',
      type: mode,
      amount: amt,
      month: form.month,
      status: 'pending',
    };

    let payload = { ...base, reason: form.reason };

    if (isAdv) {
      payload = {
        ...payload,
        recoveryPlan: form.recoveryPlan,
        recoveryMonths,
        notes: recoveryMonths === 1
          ? `${inr(amt)} in full next month`
          : `${inr(Math.round(amt / recoveryMonths))}/month for ${recoveryMonths} months`,
      };
    } else if (isIncentive) {
      payload = {
        ...payload,
        incentiveType: form.type,
        // Keep the "[Type] reason" prefix in `reason` too, for now, so any
        // existing exports/reports that parse it still work unchanged.
        reason: `[${form.type}] ${form.reason}`,
      };
    }

    onSubmit(payload);
  };
  const inputSt = hasErr => ({
    width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${hasErr ? '#DC2626' : COLORS.border}`,
    fontSize: 13, fontFamily: FONTS.sans, color: COLORS.h1, outline: 'none', boxSizing: 'border-box', background: '#fff'
  });

  const perMonth = recoveryMonths > 0 ? Math.round(amt / recoveryMonths) : 0;
  const selectedTechRecord = prefillTech || technicians.find(t => t._id === form.techId) || null;
  const emp = selectedTechRecord ? techOf({ technician: selectedTechRecord }) : { name: '', role: '', avatar: '', avatarBg: '#F3F4F6', avatarCol: '#374151' };

  return <Overlay onClose={onClose}>
      <ModalShell title={copy.title} subtitle={copy.subtitle} accentColor={copy.accent} onClose={onClose}>
        <div className="ap-advance-incentive-page-32">

          {prefillTech ? <div className="ap-advance-incentive-page-33">
              <div style={{ background: emp.avatarBg, color: emp.avatarCol }} className="ap-advance-incentive-page-34">
                {emp.avatar}
              </div>
              <div className="ap-advance-incentive-page-35">
                <div className="ap-advance-incentive-page-36">{emp.name}</div>
                <div className="ap-advance-incentive-page-37">{emp.role}</div>
              </div>
              <div className="ap-advance-incentive-page-38">{prefillTech.techId || String(prefillTech._id || '').slice(-6)}</div>
            </div> : <Field label="TECHNICIAN" required error={errors.techId}>
              <select value={form.techId} onChange={e => set('techId', e.target.value)} style={inputSt(errors.techId)}>
                <option value="">— Select technician —</option>
                {technicians.map(t => <option key={t._id} value={t._id}>{t.name} ({t.role || 'Technician'})</option>)}
              </select>
            </Field>}

          <div className="ap-advance-incentive-page-39">
            <Field label="MONTH" required>
              <select value={form.month} onChange={e => set('month', e.target.value)} style={inputSt(false)}>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>

            <Field label="AMOUNT (₹)" required error={errors.amount}>
              <input type="number" min="1" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="e.g. 5000" style={inputSt(errors.amount)} />
            </Field>

            {isAdv && <Field label="RECOVERY PLAN" required>
                   <DynamicSelect
        options={recoveryPlanList}
        value={form.recoveryPlan}
        onChange={v => set('recoveryPlan', v)}
        onAddOption={v => onAddRecoveryPlan?.(v)}
        addLabel="Recovery Plan"
        addPlaceholder="e.g. 4 months (split), 6 months (split)…"
      />
                </Field>}
            {isIncentive && <Field label="INCENTIVE TYPE" required>
                  <DynamicSelect
                    options={incentiveTypeList}
                    value={form.type}
                    onChange={v => set('type', v)}
                    onAddOption={v => onAddIncentiveType?.(v)}
                    addLabel="Incentive Type"
                    addPlaceholder="e.g. Team Bonus, Safety Award…"
                  />
                </Field>}
          </div>

          <Field label="REASON / NOTES" required error={errors.reason}>
            <textarea value={form.reason} onChange={e => set('reason', e.target.value)} placeholder={
              isAdv ? 'Briefly explain why the advance is needed…' :
              isIncentive ? 'Describe the performance or contribution…' :
              mode === 'bonus' ? 'e.g. Diwali festival bonus, project completion bonus…' :
              'e.g. Tool damage, uniform replacement, disciplinary deduction…'
            } rows={3} style={{ ...inputSt(errors.reason) }} className="ap-advance-incentive-page-40" />
          </Field>

          {/* Live preview */}
          {isAdv && amt > 0 && <div className="ap-advance-incentive-page-41">
              <div>
      <div className="ap-advance-incentive-page-42">RECOVERY PREVIEW</div>
      <div className="ap-advance-incentive-page-43">{inr(perMonth)}/month × {recoveryMonths} month{recoveryMonths > 1 ? 's' : ''}</div>
    </div>
    <div className="ap-advance-incentive-page-44">{inr(amt)}</div>
  </div>}
          {!isAdv && amt > 0 && form.techId && <div className="ap-advance-incentive-page-45">
              <div>
                <div className="ap-advance-incentive-page-46">
                  {mode === 'deduction' ? 'DEDUCTION PREVIEW' : 'PAYOUT PREVIEW'}
                </div>
                <div className="ap-advance-incentive-page-47">
                  {mode === 'deduction'
                    ? `Deducted from ${emp.name}'s payroll in ${form.month}`
                    : `Added to ${emp.name}'s gross in ${form.month}`}
                </div>
              </div>
              <div className="ap-advance-incentive-page-48">{mode === 'deduction' ? '-' : '+'}{inr(amt)}</div>
            </div>}

          <div className="ap-advance-incentive-page-49">
            <button onClick={onClose} className="ap-advance-incentive-page-50">Cancel</button>
            <button onClick={handleSubmit} className="ap-advance-incentive-page-51">Submit Request</button>
          </div>
        </div>
      </ModalShell>
    </Overlay>;
};

// ─── REQUEST DETAIL MODAL ─────────────────────────────────────────────────────
const RequestDetailModal = ({ item, mode, onClose }) => {
  if (!item) return null;
  const emp = techOf(item);
  const isAdv = mode === 'advance';
  const copy = MODE_COPY[mode] || MODE_COPY.advance;
  return <Overlay onClose={onClose}>
      <ModalShell title={`${TYPE_MAP[mode]?.label || mode} Request — ${item.recordId}`} subtitle={item.month} accentColor={copy.accent} onClose={onClose}>
        <div className="ap-advance-incentive-page-52">
          <div className="ap-advance-incentive-page-53">
            <div style={{ background: emp.avatarBg, color: emp.avatarCol }} className="ap-advance-incentive-page-54">{emp.avatar}</div>
            <div>
              <div className="ap-advance-incentive-page-55">{emp.name}</div>
              <div className="ap-advance-incentive-page-56">{emp.role}</div>
            </div>
            <div className="ap-advance-incentive-page-57"><StatusBadge status={item.status} /></div>
          </div>
          <DRow label="AMOUNT" value={<span style={{ color: TYPE_MAP[mode]?.color }} className="ap-advance-incentive-page-58">{inr(item.amount)}</span>} />
          <DRow label="REQUESTED ON" value={fmtDate(item.date || item.createdAt)} />
          <DRow label="MONTH" value={item.month} />
          <DRow label="REASON" value={item.reason} />
          {isAdv && item.notes && <DRow label="RECOVERY PLAN" value={item.notes} />}
          {item.approvedBy && <DRow label="ACTIONED BY" value={`${item.approvedBy?.name || item.approvedBy?.email || 'Admin'}`} />}
          {!isAdv && item.notes && <DRow label="REMARKS" value={<span className="ap-advance-incentive-page-59">{item.notes}</span>} />}
          <div className="ap-advance-incentive-page-60">
            <button onClick={onClose} className="ap-advance-incentive-page-61">Close</button>
          </div>
        </div>
      </ModalShell>
    </Overlay>;
};

// ─── HISTORY DETAIL MODAL ─────────────────────────────────────────────────────
const HistoryDetailModal = ({ item, onClose }) => {
  if (!item) return null;
  const emp = techOf(item);
  const isAdv = item.type === 'advance';
  const copy = MODE_COPY[item.type] || MODE_COPY.advance;
  return <Overlay onClose={onClose}>
      <ModalShell title={`Transaction Detail — ${item.recordId}`} subtitle={`${TYPE_MAP[item.type]?.label || item.type} · ${item.month}`} accentColor={copy.accent} onClose={onClose}>
        <div className="ap-advance-incentive-page-62">
          <div className="ap-advance-incentive-page-63">
            <div style={{ background: emp.avatarBg, color: emp.avatarCol }} className="ap-advance-incentive-page-64">{emp.avatar}</div>
            <div>
              <div className="ap-advance-incentive-page-65">{emp.name}</div>
              <div className="ap-advance-incentive-page-66">{emp.role}</div>
            </div>
            <div className="ap-advance-incentive-page-67"><StatusBadge status={item.status} /></div>
          </div>
          <DRow label="TYPE" value={<TypeBadge type={item.type} />} />
          <DRow label="AMOUNT" value={<span style={{ color: TYPE_MAP[item.type]?.color }} className="ap-advance-incentive-page-69">{inr(item.amount)}</span>} />
          <DRow label="MONTH" value={item.month} />
          <DRow label="REQUESTED ON" value={fmtDate(item.date || item.createdAt)} />
          <DRow label="REASON" value={item.reason} />
          {isAdv && item.notes && <DRow label="RECOVERY PLAN" value={item.notes} />}
          <DRow label="APPROVED BY" value={item.approvedBy?.name || item.approvedBy?.email || '—'} />
          {!isAdv && item.notes && <DRow label="REMARKS" value={<span className="ap-advance-incentive-page-70">{item.notes}</span>} />}
          <DRow label="REF ID" value={<span className="ap-advance-incentive-page-72">{item.recordId}</span>} />
          <div className="ap-advance-incentive-page-73">
            <button onClick={onClose} className="ap-advance-incentive-page-74">Close</button>
          </div>
        </div>
      </ModalShell>
    </Overlay>;
};

// ─── TECHNICIAN HISTORY MODAL ─────────────────────────────────────────────────
const TechnicianHistoryModal = ({ techId, techLabel, onClose }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    advanceIncentiveApi.list({ technician: techId, limit: 300 }).then(res => {
      if (!cancelled) setRecords((res?.data ?? []).filter(r => r.status !== 'pending'));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [techId]);
  const emp = records[0] ? techOf(records[0]) : { name: techLabel || 'Technician', role: '' };
  const [typeFilter, setTypeFilter] = useState('');
  const visible = typeFilter ? records.filter(r => r.type === typeFilter) : records;
  const totalAdv = records.filter(r => r.type === 'advance').reduce((s, r) => s + r.amount, 0);
  const totalInc = records.filter(r => r.type === 'incentive').reduce((s, r) => s + r.amount, 0);
  const outstanding = records.filter(r => r.type === 'advance' && r.status === 'approved').length;
  return <Overlay onClose={onClose}>
      <ModalShell title={`All Transactions — ${emp.name}`} subtitle={`${emp.role} · ${loading ? 'Loading…' : `${records.length} total records`}`} accentColor="#1a2e5c" wide onClose={onClose}>
        <div className="ap-advance-incentive-page-75">
          <div className="ap-advance-incentive-page-76">
            {[{ label: 'Total Advances', value: inr(totalAdv), color: '#DC2626', bg: '#FEF2F2' },
              { label: 'Total Incentives', value: inr(totalInc), color: '#7C3AED', bg: '#F5F3FF' },
              { label: 'Awaiting Payout', value: outstanding, color: '#2563EB', bg: '#EFF6FF' }].map(k => <div key={k.label} style={{ background: k.bg }} className="ap-advance-incentive-page-77">
                <div className="ap-advance-incentive-page-78">{k.label}</div>
                <div style={{ color: k.color }} className="ap-advance-incentive-page-79">{k.value}</div>
              </div>)}
          </div>
          <div className="ap-advance-incentive-page-80">
            {['', 'advance', 'incentive', 'bonus', 'deduction'].map(t => <button key={t || 'all'} onClick={() => setTypeFilter(t)} style={{
            background: typeFilter === t ? "var(--brand)" : "var(--white)",
            color: typeFilter === t ? "var(--white)" : "var(--text-muted)"
          }} className="ap-advance-incentive-page-81">{t ? TYPE_MAP[t]?.label : 'All'}</button>)}
            <span className="ap-advance-incentive-page-82">{visible.length} records</span>
          </div>
          <div className="ap-advance-incentive-page-83">
            {!loading && visible.length === 0 && <div className="ap-advance-incentive-page-84">No records found</div>}
            {loading && <div className="ap-advance-incentive-page-84">Loading…</div>}
            {visible.map(rec => {
            const isAdv = rec.type === 'advance';
            return <div key={rec._id} className="ap-advance-incentive-page-85">
                  <div>
                    <div className="ap-advance-incentive-page-86">
                      <TypeBadge type={rec.type} />
                      <span className="ap-advance-incentive-page-88">{rec.recordId}</span>
                      <span className="ap-advance-incentive-page-89">{rec.month}</span>
                      <StatusBadge status={rec.status} />
                    </div>
                    <div className="ap-advance-incentive-page-90">{rec.reason}</div>
                    {isAdv && rec.notes && <div className="ap-advance-incentive-page-92">Recovery: {rec.notes}</div>}
                  </div>
                  <div className="ap-advance-incentive-page-94">
                    <div style={{ color: TYPE_MAP[rec.type]?.color }} className="ap-advance-incentive-page-95">{inr(rec.amount)}</div>
                    <div className="ap-advance-incentive-page-96">Req: {fmtDate(rec.date || rec.createdAt)}</div>
                    <div className="ap-advance-incentive-page-97">By: {rec.approvedBy?.name || '—'}</div>
                  </div>
                </div>;
          })}
          </div>
          <div className="ap-advance-incentive-page-98">
            <button onClick={onClose} className="ap-advance-incentive-page-99">Close</button>
          </div>
        </div>
      </ModalShell>
    </Overlay>;
};

// ─── GENERIC REQUEST TAB (advance / incentive / bonus / deduction) ────────────
// AdvanceTab, IncentiveTab, BonusTab and DeductionTab all share the same
// list → filter → paginate → approve/reject/pay → detail flow. Only the
// KCards, the "recovery"/"type" extra column, and the New Request payload
// shape differ — those bits are still handled by NewRequestModal per-mode.
const RequestTab = ({
  mode,
  technicians = [],
  prefillTech = null,
  onClearPrefill,
  recoveryPlans = [],
  onAddRecoveryPlan,
  incentiveTypes = [],
  onAddIncentiveType
}) => {
  const isAdv = mode === 'advance';
  const isIncentive = mode === 'incentive';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const load = () => {
    setLoading(true);
    advanceIncentiveApi.list({ type: mode, limit: 200 }).then(res => {
      setData(res?.data ?? []);
      setLoadError(null);
    }).catch(e => setLoadError(e.message || `Could not load ${mode} requests`)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [mode]);
  const incentiveTypeList = incentiveTypes.length ? incentiveTypes : INCENTIVE_TYPES;
  const [selMonth, setSelMonth] = useState(CURRENT_MONTH);
  const [showNew, setShowNew] = useState(!!(isAdv && prefillTech));
  const [activePrefill, setActivePrefill] = useState(isAdv ? prefillTech : null);
  const [remarksModal, setRemarksModal] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAdv && prefillTech) {
      setActivePrefill(prefillTech);
      setShowNew(true);
    }
  }, [prefillTech, isAdv]);

  const {
    q, setQ, activeFilters, setFilter, filtered
  } = useTableSearch(data, ['techName', 'reason', 'recordId'], isIncentive ? { status: '', incentiveType: '' } : { status: '' });
  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } = usePagination(filtered, 10);

  const handleAction = async (id, action, remarks) => {
    setSaving(true);
    try {
      if (action === 'approved') await advanceIncentiveApi.approve(id, { notes: remarks });
      else if (action === 'rejected') await advanceIncentiveApi.reject(id, { notes: remarks });
      else if (action === 'paid') await advanceIncentiveApi.pay(id, { notes: remarks });
      setRemarksModal(null);
      load();
    } catch (e) {
      alert(e.message || 'Could not update this request');
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => ({
    pending: data.filter(r => r.status === 'pending').length,
    totalReq: data.filter(r => r.month === selMonth).reduce((s, r) => s + r.amount, 0),
    paid: data.filter(r => r.status === 'paid').reduce((s, r) => s + r.amount, 0),
    outstanding: data.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0),
  }), [data, selMonth]);

  const copy = MODE_COPY[mode] || MODE_COPY.advance;
  const kcardIcon = { advance: '💸', incentive: '🎯', bonus: '🏆', deduction: '➖' }[mode];
  const kcardBg = { advance: '#FEF2F2', incentive: '#F5F3FF', bonus: '#F0FDF4', deduction: '#FFF7ED' }[mode];
  const kcardColor = { advance: '#DC2626', incentive: '#7C3AED', bonus: '#16A34A', deduction: '#C2410C' }[mode];

  const COLS = [
    { label: 'Record ID', key: 'recordId', width: 10 },
    { label: 'Name', key: 'techName', width: 16 },
    { label: 'Amount', key: 'amount', width: 9, format: v => `₹${Number(v).toLocaleString()}` },
    ...(isIncentive ? [{ label: 'Type', key: 'incentiveType', width: 14 }] : []),
    { label: 'Requested On', key: 'date', width: 12, format: v => fmtDate(v) },
    { label: 'Month', key: 'month', width: 12 },
    { label: 'Reason', key: 'reason', width: 28 },
    ...(isAdv ? [{ label: 'Recovery', key: 'notes', width: 16 }] : []),
    { label: 'Status', key: 'status', width: 10 },
    { label: 'Actioned By', key: 'approvedBy', width: 10, format: v => v?.name || v?.email || '—' },
  ];
  const { exportProps } = useExport({
    title: `${TYPE_MAP[mode]?.label} Requests`,
    filename: `${mode}-requests-${selMonth.replace(' ', '-')}`,
    template: 'generic_list',
    subtitle: `CoolTech AC Services · ${selMonth} · ${filtered.length} records`,
    docId: `${mode.slice(0, 3).toUpperCase()}-EXPORT`,
    columns: COLS,
    rows: filtered
  });

  return <>
      <div className="ap-advance-incentive-page-100">
        <KCard label="Pending Approvals" value={summary.pending} sub="awaiting action" icon="⏳" iconBg="#FFFBEB" color="#D97706" />
        <KCard label="Requested (Month)" value={inr(summary.totalReq)} sub={selMonth} icon={kcardIcon} iconBg={kcardBg} color={kcardColor} />
        <KCard label="Total Paid" value={inr(summary.paid)} sub="all time" icon="✓" iconBg="#F0FDF4" color="#16A34A" />
        <KCard label="Outstanding Balance" value={inr(summary.outstanding)} sub="approved, not yet paid" icon="↩" iconBg="#EFF6FF" color="#2563EB" />
      </div>

      <div className="ap-advance-incentive-page-101">
        <div className="ap-advance-incentive-page-102">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, reason, record ID…" />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={['pending', 'approved', 'paid', 'rejected']} allLabel="All Statuses" />
          {isIncentive && <FilterSelect value={activeFilters.incentiveType} onChange={val => setFilter('incentiveType', val)} options={incentiveTypeList} allLabel="All Types" />}
          <select value={selMonth} onChange={e => setSelMonth(e.target.value)} className="ap-advance-incentive-page-103">
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
          <div className="ap-advance-incentive-page-104">
            <button onClick={() => { setActivePrefill(null); setShowNew(true); }} className="ap-advance-incentive-page-105">+ New {copy.title.replace('New ', '')}</button>
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div className="ap-advance-incentive-page-106">
          <table className="ap-advance-incentive-page-107">
            <thead>
              <tr>
                <th style={thStyle()}>TECHNICIAN</th>
                <th style={thStyle('right')}>AMOUNT</th>
                {isIncentive && <th style={thStyle()}>TYPE</th>}
                <th style={thStyle()}>REQUESTED ON</th>
                <th style={thStyle()}>MONTH</th>
                <th style={thStyle()}>REASON</th>
                {isAdv && <th style={thStyle()}>RECOVERY PLAN</th>}
                <th style={thStyle()}>STATUS</th>
                <th style={thStyle()}>ACTIONED BY</th>
                <th style={thStyle()}></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{ ...tdStyle() }} className="ap-advance-incentive-page-108">Loading…</td></tr>}
              {!loading && loadError && <tr><td colSpan={9} style={{ ...tdStyle() }} className="ap-advance-incentive-page-108">{loadError}</td></tr>}
              {!loading && !loadError && paginated.length === 0 && <tr><td colSpan={9} style={{ ...tdStyle() }} className="ap-advance-incentive-page-108">No {mode} requests found.</td></tr>}
              {!loading && paginated.map((req, i) => <tr key={req._id} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--bg)" }} onClick={() => setDetailItem(req)} className="ap-advance-incentive-page-109">
                  <td style={tdStyle()}><EmpCell record={req} /></td>
                  <td style={tdStyle({ textAlign: 'right' })}><span className="ap-advance-incentive-page-110">{inr(req.amount)}</span></td>
                  {isIncentive && <td style={tdStyle()}><TypeChip type={req.incentiveType || '—'} /></td>}
                  <td style={tdStyle()}><span className="ap-advance-incentive-page-111">{fmtDate(req.date || req.createdAt)}</span></td>
                  <td style={tdStyle()}><span className="ap-advance-incentive-page-112">{req.month}</span></td>
                  <td style={tdStyle()}><span className="ap-advance-incentive-page-113">{req.reason}</span></td>
                  {isAdv && <td style={tdStyle()}><span className="ap-advance-incentive-page-114">{req.notes || '—'}</span></td>}
                  <td style={tdStyle()}><StatusBadge status={req.status} /></td>
                  <td style={tdStyle()}><span style={{ color: req.approvedBy ? "var(--text-muted)" : "var(--text-faint)" }} className="ap-advance-incentive-page-115">{req.approvedBy?.name || req.approvedBy?.email || '—'}</span></td>
                  <td style={tdStyle()}>
                    <div onClick={e => e.stopPropagation()} className="ap-advance-incentive-page-117">
                      {req.status === 'pending' && <>
                          <button onClick={() => setRemarksModal({ id: req._id, action: 'approved' })} className="ap-advance-incentive-page-118">Approve</button>
                          <button onClick={() => setRemarksModal({ id: req._id, action: 'rejected' })} className="ap-advance-incentive-page-119">Reject</button>
                        </>}
                      {req.status === 'approved' && <button onClick={() => setRemarksModal({ id: req._id, action: 'paid' })} title="Mark this amount as paid" className="ap-advance-incentive-page-118">Mark Paid</button>}
                      <button onClick={() => setDetailItem(req)} className="ap-advance-incentive-page-120">View</button>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      {showNew && <NewRequestModal mode={mode} technicians={technicians} prefillTech={activePrefill} recoveryPlans={recoveryPlans}
  onAddRecoveryPlan={onAddRecoveryPlan} incentiveTypes={incentiveTypes} onAddIncentiveType={onAddIncentiveType} onSubmit={async payload => {
      setSaving(true);
      try {
        await advanceIncentiveApi.create(payload);
        setShowNew(false);
        setActivePrefill(null);
        if (onClearPrefill) onClearPrefill();
        load();
      } catch (e) {
        alert(e.message || `Could not create ${mode} request`);
      } finally {
        setSaving(false);
      }
    }} onClose={() => {
      setShowNew(false);
      setActivePrefill(null);
      if (onClearPrefill) onClearPrefill();
    }} />}
      {remarksModal && <RemarksModal title={{ approved: `Approve ${TYPE_MAP[mode]?.label}`, rejected: `Reject ${TYPE_MAP[mode]?.label}`, paid: `Mark ${TYPE_MAP[mode]?.label} as Paid` }[remarksModal.action]} onConfirm={r => handleAction(remarksModal.id, remarksModal.action, r)} onClose={() => setRemarksModal(null)} />}
      {detailItem && <RequestDetailModal item={detailItem} mode={mode} onClose={() => setDetailItem(null)} />}
    </>;
};

// ─── HISTORY TAB ──────────────────────────────────────────────────────────────
// Shows every already-actioned record (approved / paid / rejected) across
// all 4 types — i.e. everything no longer "pending".
const HistoryTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  useEffect(() => {
    advanceIncentiveApi.list({ limit: 300 }).then(res => {
      setData((res?.data ?? []).filter(r => r.status !== 'pending'));
      setLoadError(null);
    }).catch(e => setLoadError(e.message || 'Could not load history')).finally(() => setLoading(false));
  }, []);
  const [detailItem, setDetailItem] = useState(null);
  const [techHistEmp, setTechHistEmp] = useState(null);
  const { q, setQ, activeFilters, setFilter, filtered } = useTableSearch(data, ['techName', 'notes', 'recordId', 'reason'], { type: '', month: '' });
  const { paginated, page, totalPages, setPage, pageSize, setPageSize, from, to, total } = usePagination(filtered, 10);
  const summary = useMemo(() => ({
    totalAdvance: data.filter(r => r.type === 'advance').reduce((s, r) => s + r.amount, 0),
    totalIncentive: data.filter(r => r.type === 'incentive').reduce((s, r) => s + r.amount, 0),
    outstanding: data.filter(r => r.type === 'advance' && r.status === 'approved').length,
    txCount: data.length
  }), [data]);
  return <>
      <div className="ap-advance-incentive-page-141">
        <KCard label="Total Advances" value={inr(summary.totalAdvance)} sub="all time disbursed" icon="💸" iconBg="#FEF2F2" color="#DC2626" />
        <KCard label="Total Incentives" value={inr(summary.totalIncentive)} sub="all time paid out" icon="🏆" iconBg="#F5F3FF" color="#7C3AED" />
        <KCard label="Awaiting Payout" value={summary.outstanding} sub="approved advances, unpaid" icon="↩" iconBg="#EFF6FF" color="#2563EB" />
        <KCard label="Total Transactions" value={summary.txCount} sub="all records" icon="📋" iconBg="#F9FAFB" color={COLORS.h2} />
      </div>

      <div className="ap-advance-incentive-page-142">
        <div className="ap-advance-incentive-page-143">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, record ID, note…" />
          <FilterSelect value={activeFilters.type} onChange={val => setFilter('type', val)} options={['advance', 'incentive', 'bonus', 'deduction']} allLabel="All Types" />
          <FilterSelect value={activeFilters.month} onChange={val => setFilter('month', val)} options={generateMonthOptions(6, 0)} allLabel="All Months" />
          <div className="ap-advance-incentive-page-144">{filtered.length} records</div>
        </div>

        <div className="ap-advance-incentive-page-145">
          <table className="ap-advance-incentive-page-146">
            <thead>
              <tr>
                <th style={thStyle()}>TECHNICIAN</th>
                <th style={thStyle()}>TYPE</th>
                <th style={thStyle()}>MONTH</th>
                <th style={thStyle('right')}>AMOUNT</th>
                <th style={thStyle()}>STATUS</th>
                <th style={thStyle()}>NOTE</th>
                <th style={thStyle()}>REF ID</th>
                <th style={thStyle()}></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={tdStyle()}>Loading…</td></tr>}
              {!loading && loadError && <tr><td colSpan={8} style={tdStyle()}>{loadError}</td></tr>}
              {!loading && !loadError && paginated.length === 0 && <tr><td colSpan={8} style={tdStyle()}>No transaction history yet.</td></tr>}
              {!loading && paginated.map((rec, i) => {
              return <tr key={rec._id} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--bg)" }} onClick={() => setDetailItem(rec)} className="ap-advance-incentive-page-147">
                    <td style={tdStyle()}><EmpCell record={rec} /></td>
                    <td style={tdStyle()}><TypeBadge type={rec.type} /></td>
                    <td style={tdStyle()}><span className="ap-advance-incentive-page-149">{rec.month}</span></td>
                    <td style={tdStyle({ textAlign: 'right' })}><span style={{ color: TYPE_MAP[rec.type]?.color }} className="ap-advance-incentive-page-150">{inr(rec.amount)}</span></td>
                    <td style={tdStyle()}><StatusBadge status={rec.status} /></td>
                    <td style={tdStyle()}><span className="ap-advance-incentive-page-151">{rec.notes || '—'}</span></td>
                    <td style={tdStyle()}><span className="ap-advance-incentive-page-152">{rec.recordId}</span></td>
                    <td style={tdStyle()}>
                      <div onClick={e => e.stopPropagation()} className="ap-advance-incentive-page-153">
                        <button onClick={() => setDetailItem(rec)} className="ap-advance-incentive-page-154">View</button>
                        <button onClick={() => setTechHistEmp(rec.technician?._id || rec.technician)} className="ap-advance-incentive-page-155">History</button>
                      </div>
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      {detailItem && <HistoryDetailModal item={detailItem} onClose={() => setDetailItem(null)} />}
      {techHistEmp && <TechnicianHistoryModal techId={techHistEmp} onClose={() => setTechHistEmp(null)} />}
    </>;
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'advance', label: 'Advance Requests' },
  { key: 'incentive', label: 'Incentive Requests' },
  { key: 'bonus', label: 'Bonuses' },
  { key: 'deduction', label: 'Deductions' },
  { key: 'history', label: 'Transaction History' },
];

// prefillAdvance:     { empId, name, role } — passed from App when "Give Advance" clicked on a tech
// onPrefillConsumed:  callback to clear prefillAdvance in App after modal opens (prevents re-trigger on back navigation)
const AdvanceIncentivePage = ({
  prefillAdvance = null,
  onPrefillConsumed,
  recoveryPlans = [],
  onAddRecoveryPlan,
  incentiveTypes = [],
  onAddIncentiveType
}) => {
  const [activeTab, setActiveTab] = useState('advance');
  const [prefillTech, setPrefillTech] = useState(prefillAdvance);
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    techsApi.list().then(res => setTechnicians(res?.data ?? [])).catch(() => setTechnicians([]));
  }, []);

  useEffect(() => {
    if (prefillAdvance) {
      setActiveTab('advance');
      setPrefillTech(prefillAdvance);
      if (onPrefillConsumed) onPrefillConsumed();
    }
  }, [prefillAdvance]);

  return <div className="fi ap-advance-incentive-page-156">
      <div>
        <div className="ap-advance-incentive-page-157">Advance & Incentive</div>
        <div className="ap-advance-incentive-page-158">Manage requests, approvals, and payroll deduction history</div>
      </div>

      <div className="ap-advance-incentive-page-159">
        {TABS.map(tab => <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
        background: activeTab === tab.key ? "var(--white)" : "transparent",
        color: activeTab === tab.key ? "var(--text-h1)" : "var(--text-muted)",
        boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,.08)" : "none"
      }} className="ap-advance-incentive-page-160">{tab.label}</button>)}
      </div>

      {activeTab === 'advance' && <RequestTab mode="advance" technicians={technicians} prefillTech={prefillTech} onClearPrefill={() => setPrefillTech(null)} recoveryPlans={recoveryPlans}
    onAddRecoveryPlan={onAddRecoveryPlan}/>}
      {activeTab === 'incentive' && <RequestTab mode="incentive" technicians={technicians} incentiveTypes={incentiveTypes} onAddIncentiveType={onAddIncentiveType} />}
      {activeTab === 'bonus' && <RequestTab mode="bonus" technicians={technicians} />}
      {activeTab === 'deduction' && <RequestTab mode="deduction" technicians={technicians} />}
      {activeTab === 'history' && <HistoryTab />}
    </div>;
};
export default AdvanceIncentivePage;