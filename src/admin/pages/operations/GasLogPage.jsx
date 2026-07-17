import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { Avatar } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import EditableDetailView from '../../components/ui/EditableDetailView';
import ActionDropdown from '../../components/ui/ActionDropdown';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import { gaslogApi, gasPurchaseApi, gasRateApi } from '../../services/api';

// ─── Column config for export ─────────────────────────────────────────────────
const GASLOG_COLUMNS = [{
  label: 'Log ID',
  key: 'id',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700,
    color: '#F97316',
    fontSize: 11
  }
}, {
  label: 'Job',
  key: 'job',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace',
    color: '#0369A1'
  }
}, {
  label: 'Technician',
  key: 'tech',
  width: 18,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Customer',
  key: 'customer',
  width: 20,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Date',
  key: 'date',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace',
    fontSize: 12
  }
}, {
  label: 'Gas Type',
  key: 'gasType',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700
  }
}, {
  label: 'Cylinders',
  key: 'cylinders',
  width: 10,
  tdStyle: {
    fontFamily: 'monospace',
    textAlign: 'center'
  }
}, {
  label: 'Kg Used',
  key: 'kgUsed',
  width: 10,
  format: v => `${v} kg`,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700
  }
}, {
  label: 'Kg Recovered',
  key: 'kgRecovered',
  width: 10,
  format: v => v ? `${v} kg` : '—'
}, {
  label: 'Reason',
  key: 'reason',
  width: 24,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: 'Leak Test',
  key: 'leakTest',
  width: 10,
  format: v => v ? 'Pass' : 'Fail'
}, {
  label: 'Certification',
  key: 'certification',
  width: 18,
  tdStyle: {
    fontFamily: 'monospace',
    fontSize: 11
  }
}, {
  label: 'Compliant',
  key: 'compliant',
  width: 10,
  format: v => v ? 'Yes' : 'No'
}];

// ─── Purchase Log export columns ───────────────────────────────────────────────
const GASPURCHASE_COLUMNS = [{
  label: 'Purchase ID',
  key: 'id',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700,
    color: '#F97316',
    fontSize: 11
  }
}, {
  label: 'Supplier',
  key: 'supplier',
  width: 20,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Gas Type',
  key: 'gasType',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700
  }
}, {
  label: 'Date',
  key: 'date',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace',
    fontSize: 12
  }
}, {
  label: 'Cylinders',
  key: 'cylinders',
  width: 10,
  tdStyle: {
    fontFamily: 'monospace',
    textAlign: 'center'
  }
}, {
  label: 'Kg Purchased',
  key: 'kgPurchased',
  width: 12,
  format: v => `${v} kg`,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700
  }
}, {
  label: 'Cost/Kg',
  key: 'costPerKg',
  width: 10,
  format: v => `₹${v}`
}, {
  label: 'Total Cost',
  key: 'totalCost',
  width: 12,
  format: v => `₹${(v || 0).toLocaleString('en-IN')}`,
  tdStyle: {
    fontWeight: 700
  }
}, {
  label: 'Invoice No',
  key: 'invoiceNo',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace',
    fontSize: 11
  }
}];

// Fixed gas type list used by the purchase form & price rate card
const GAS_TYPE_OPTIONS = ['R-32', 'R-410A', 'R-22', 'R-134a', 'R-407C', 'R-404A'];

// ─── SectionDivider ───────────────────────────────────────────────────────────
const SectionDivider = ({
  title,
  icon
}) => <div className="ap-gas-log-page-1">
    {icon && <span className="ap-gas-log-page-2">{icon}</span>}
    {title}
  </div>;

// ─── GasLogDetailView ─────────────────────────────────────────────────────────
const GasLogDetailView = ({
  log,
  onBack,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const d = editMode ? {
    ...log,
    ...editData
  } : log;
  const isComp = d.compliant !== false;
  const TABS = [{
    key: 'details',
    label: 'Gas Details',
    icon: '🧪'
  }, {
    key: 'compliance',
    label: 'Compliance',
    icon: '✅'
  }, {
    key: 'notes',
    label: 'Notes',
    icon: '📝'
  }];
  const set = key => e => setEditData(p => ({
    ...p,
    [key]: e.target.value
  }));
  const setBool = key => e => setEditData(p => ({
    ...p,
    [key]: e.target.value === 'true'
  }));
  const inputBase = {
    padding: '7px 10px',
    borderRadius: 7,
    border: `1.5px solid ${COLORS.border}`,
    fontSize: 13,
    color: COLORS.h2,
    background: "var(--bg)",
    fontFamily: FONTS.sans,
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s'
  };
  const tabBar = <div className="ap-gas-log-page-3">
      {TABS.map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
      borderBottom: activeTab === t.key ? "2px solid var(--brand)" : "2px solid transparent",
      color: activeTab === t.key ? "var(--brand)" : "var(--text-muted)"
    }} className="ap-gas-log-page-4">
          <span className="ap-gas-log-page-5">{t.icon}</span>
          {t.label}
        </button>)}
    </div>;
  const Cell = ({
    fKey,
    label,
    highlight,
    mono,
    warn,
    type = 'text',
    options,
    boolOptions
  }) => {
    const rawVal = d[fKey];
    if (!editMode) {
      let displayVal = rawVal;
      if (boolOptions) displayVal = rawVal == null ? null : rawVal ? boolOptions[0] : boolOptions[1];
      return <div style={{
        background: warn ? '#FFF7ED' : highlight ? `${COLORS.brand}08` : '#F9FAFB',
        border: `1px solid ${warn ? '#FED7AA' : highlight ? COLORS.brand + '30' : COLORS.border}`
      }} className="ap-gas-log-page-6">
          <span style={{
          color: warn ? "var(--x9a3412)" : "var(--text-faint)"
        }} className="ap-gas-log-page-7">{label}</span>
          <span style={{
          color: warn ? COLORS.brand : highlight ? COLORS.brand : COLORS.h2,
          fontFamily: mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
        }} className="ap-gas-log-page-8">
            {displayVal ?? <span className="ap-gas-log-page-9">—</span>}
          </span>
        </div>;
    }
    if (type === 'select') {
      return <div className="ap-gas-log-page-10">
          <span className="ap-gas-log-page-11">{label}</span>
          <select value={editData[fKey] ?? log[fKey] ?? ''} onChange={set(fKey)} className="ap-gas-log-page-12">
            {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>;
    }
    if (boolOptions) {
      const cur = editData[fKey] !== undefined ? editData[fKey] : log[fKey];
      return <div className="ap-gas-log-page-13">
          <span className="ap-gas-log-page-14">{label}</span>
          <select value={String(cur ?? '')} onChange={setBool(fKey)} className="ap-gas-log-page-15">
            <option value="">—</option>
            <option value="true">{boolOptions[0]}</option>
            <option value="false">{boolOptions[1]}</option>
          </select>
        </div>;
    }
    return <div className="ap-gas-log-page-16">
        <span className="ap-gas-log-page-17">{label}</span>
        <input type={type} value={editData[fKey] ?? log[fKey] ?? ''} onChange={set(fKey)} style={{
        fontFamily: mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
      }} className="ap-gas-log-page-18" />
      </div>;
  };
  const header = <div style={{
    background: isComp ? "var(--success-bg)" : "var(--danger-bg)",
    border: `1px solid ${isComp ? '#BBF7D0' : '#FECACA'}`
  }} className="ap-gas-log-page-19">
      <div className="ap-gas-log-page-20">
        <span className="ap-gas-log-page-21">⚗️</span>
        <div>
          <div className="ap-gas-log-page-22">
            {d.gasType || '—'} — {d.kgUsed != null ? `${d.kgUsed} kg` : '—'} used
          </div>
          <div className="ap-gas-log-page-23">
            {d.tech} · {d.customer} · {d.date}
          </div>
          <div className="ap-gas-log-page-24">{d.job}</div>
        </div>
      </div>
      <div className="ap-gas-log-page-25">
        <span style={{
        background: isComp ? "var(--success-bg)" : "var(--danger-bg)",
        color: isComp ? "var(--success-text)" : "var(--danger-text)",
        border: `1px solid ${isComp ? '#BBF7D0' : '#FECACA'}`
      }} className="ap-gas-log-page-26">
          {isComp ? '✅ Compliant' : '❌ Non-Compliant'}
        </span>
        <span className="ap-gas-log-page-27">
          {d.gasType || '—'}
        </span>
      </div>
    </div>;
  const renderTab = () => {
    switch (activeTab) {
      case 'details':
        return <div className="ap-gas-log-page-28">
            <SectionDivider title="Job & Technician" icon="👷" />
            <div className="ap-gas-log-page-29">
              <Cell fKey="id" label="Log ID" mono highlight />
              <Cell fKey="job" label="Job Ref" mono />
              {/* ── fixed: was fKey="date" (locale string, e.g. "2/5/2026"),
                  which fails HTML date-input validation. dateISO is yyyy-MM-dd. ── */}
              <Cell fKey="dateISO" label="Date" mono type="date" />
              <Cell fKey="tech" label="Technician" />
              <Cell fKey="customer" label="Customer" />
              <Cell fKey="acUnit" label="AC Unit / Equipment" />
            </div>

            <SectionDivider title="Gas Usage" icon="🧪" />
            <div className="ap-gas-log-page-30">
              <Cell fKey="gasType" label="Gas Type" mono highlight type="select" options={['R-32', 'R-410A', 'R-22', 'R-134a', 'R-407C', 'R-404A']} />
              <Cell fKey="cylinders" label="Cylinders Used" mono type="number" />
              <Cell fKey="kgUsed" label="Kg Used" mono warn type="number" />
              <Cell fKey="kgRecovered" label="Kg Recovered" mono type="number" />
              <Cell fKey="kgRemaining" label="Kg Remaining in Cylinder" mono type="number" />
              <Cell fKey="reason" label="Reason / Purpose" />
              <Cell fKey="pressureBefore" label="Pressure Before (PSI)" mono type="number" />
              <Cell fKey="pressureAfter" label="Pressure After (PSI)" mono type="number" />
              <Cell fKey="gwp" label="GWP Value" mono type="number" />
            </div>
          </div>;
      case 'compliance':
        return <div className="ap-gas-log-page-31">
            <SectionDivider title="Leak Test & Compliance" icon="🔍" />
            <div className="ap-gas-log-page-32">
              <Cell fKey="leakTestDone" label="Leak Test Done" boolOptions={['Yes', 'No']} />
              <Cell fKey="leakTest" label="Leak Test Result" highlight boolOptions={['Pass ✓', 'Fail ✗']} />
              <Cell fKey="certification" label="F-Gas Cert. No." mono />
              <Cell fKey="regulation" label="Regulation Reference" />
              <Cell fKey="disposalMethod" label="Disposal Method" />
              <Cell fKey="supervisor" label="Supervisor Sign-off" />
              <Cell fKey="compliant" label="Overall Compliant" highlight boolOptions={['Yes — Compliant', 'No — Non-Compliant']} />
            </div>

            {!isComp && <div className="ap-gas-log-page-33">
                <span className="ap-gas-log-page-34">⚠️ Non-Compliance Alert: </span>
                This entry is flagged as non-compliant. Review certification details and ensure corrective action is taken.
              </div>}

            <div className="ap-gas-log-page-35">
              <span className="ap-gas-log-page-36">ℹ️ F-Gas Notice: </span>
              All technicians handling R-32 and R-410A must hold valid F-Gas certification. Records are retained for 5 years per regulations.
            </div>
          </div>;
      case 'notes':
        return <div className="ap-gas-log-page-37">
            <SectionDivider title="Notes" icon="📝" />
            {editMode ? <div className="ap-gas-log-page-38">
                <span className="ap-gas-log-page-39">Notes</span>
                <textarea value={editData.notes ?? log.notes ?? ''} onChange={set('notes')} rows={6} className="ap-gas-log-page-40" />
              </div> : d.notes ? <div className="ap-gas-log-page-41">
                {d.notes}
              </div> : <div className="ap-gas-log-page-42">
                No notes added for this log entry.
              </div>}
          </div>;
      default:
        return null;
    }
  };
  return <div className="fi ap-gas-log-page-43">

      {/* Breadcrumb + actions */}
      <div className="ap-gas-log-page-44">
        <div className="ap-gas-log-page-45">
          <button onClick={onBack} className="ap-gas-log-page-46">←</button>
          <span className="ap-gas-log-page-47">Gas / F-Gas Log /</span>
          <span className="ap-gas-log-page-48">{log.id}</span>
        </div>
        <div className="ap-gas-log-page-49">
          {editMode ? <>
              <button onClick={() => {
            setEditMode(false);
            setEditData({});
          }} className="ap-gas-log-page-50">
                Cancel
              </button>
              <button onClick={() => {
            onSave({
              ...log,
              ...editData
            });
            setEditMode(false);
            setEditData({});
          }} className="ap-gas-log-page-51">
                ✓ Save Changes
              </button>
            </> : <button onClick={() => setEditMode(true)} className="ap-gas-log-page-52">
              ✏️ Edit
            </button>}
        </div>
      </div>

      {header}

      <div style={{
      border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
      boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.04)"
    }} className="ap-gas-log-page-53">
        {tabBar}
        {renderTab()}
      </div>

    </div>;
};

// ─── shared modal shell ────────────────────────────────────────────────────────
const modalInputStyle = {
  padding: '7px 10px',
  borderRadius: 7,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 13,
  color: COLORS.h2,
  background: "var(--bg)",
  fontFamily: FONTS.sans,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color .15s'
};
const ModalShell = ({
  title,
  onClose,
  children,
  footer
}) => <div className="ap-gas-log-page-54">
    <div className="ap-gas-log-page-55">
      <div className="ap-gas-log-page-56">
        <span className="ap-gas-log-page-57">{title}</span>
        <button onClick={onClose} className="ap-gas-log-page-58">✕</button>
      </div>
      <div className="ap-gas-log-page-59">
        {children}
      </div>
      {footer && <div className="ap-gas-log-page-60">
          {footer}
        </div>}
    </div>
  </div>;

// ─── Manage Gas Prices modal ────────────────────────────────────────────────────
const PriceRateModal = ({
  rates,
  onClose,
  onSave
}) => {
  const [editingType, setEditingType] = useState(null);
  const [draft, setDraft] = useState('');
  const startEdit = type => {
    setEditingType(type);
    setDraft(String(rates[type]?.pricePerKg ?? ''));
  };
  const confirm = type => {
    const price = parseFloat(draft);
    if (!isNaN(price) && price >= 0) onSave(type, price);
    setEditingType(null);
  };
  return <ModalShell title="Manage Gas Prices" onClose={onClose}>
      {GAS_TYPE_OPTIONS.map(type => <div key={type} className="ap-gas-log-page-61">
          <div>
            <span className="ap-gas-log-page-62">{type}</span>
            <div className="ap-gas-log-page-63">
              Updated {rates[type]?.effectiveFrom || '—'}
            </div>
          </div>
          {editingType === type ? <div className="ap-gas-log-page-64">
              <span className="ap-gas-log-page-65">₹</span>
              <input autoFocus type="number" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && confirm(type)} className="ap-gas-log-page-66" />
              <button onClick={() => confirm(type)} className="ap-gas-log-page-67">Save</button>
            </div> : <button onClick={() => startEdit(type)} className="ap-gas-log-page-68">
              ₹{rates[type]?.pricePerKg ?? '—'}/kg
            </button>}
        </div>)}
      <div className="ap-gas-log-page-69">
        Changing a price only affects new purchases — past entries keep the price they were logged at.
      </div>
    </ModalShell>;
};

// ─── Log / Edit Gas Purchase modal ──────────────────────────────────────────────
const PurchaseFormModal = ({
  initial,
  rates,
  onClose,
  onSave
}) => {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial ? {
    ...initial,
    date: initial.dateISO || ''
  } : {
    gasType: 'R-32',
    supplier: '',
    cylinders: 0,
    kgPurchased: '',
    costPerKg: rates['R-32']?.pricePerKg ?? '',
    invoiceNo: '',
    date: ''
  });
  const handleGasType = type => {
    setForm(f => ({
      ...f,
      gasType: type,
      costPerKg: isEdit ? f.costPerKg : rates[type]?.pricePerKg ?? f.costPerKg
    }));
  };
  const totalCost = (parseFloat(form.kgPurchased) || 0) * (parseFloat(form.costPerKg) || 0);
  const set = key => e => setForm(f => ({
    ...f,
    [key]: e.target.value
  }));
  return <ModalShell title={isEdit ? 'Edit Purchase' : 'Log Gas Purchase'} onClose={onClose} footer={<>
          <button onClick={onClose} className="ap-gas-log-page-70">
            Cancel
          </button>
          <button onClick={() => onSave({
      ...form,
      totalCost
    })} className="ap-gas-log-page-71">
            {isEdit ? '✓ Save Changes' : '+ Log Purchase'}
          </button>
        </>}>
      <div className="ap-gas-log-page-72">
        <div>
          <span className="ap-gas-log-page-73">Gas Type</span>
          <select value={form.gasType} onChange={e => handleGasType(e.target.value)} className="ap-gas-log-page-74">
            {GAS_TYPE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <span className="ap-gas-log-page-75">Purchase Date</span>
          <input type="date" value={form.date} onChange={set('date')} className="ap-gas-log-page-76" />
        </div>
      </div>

      <div>
        <span className="ap-gas-log-page-77">Supplier</span>
        <input value={form.supplier} onChange={set('supplier')} className="ap-gas-log-page-78" />
      </div>

      <div className="ap-gas-log-page-79">
        <div>
          <span className="ap-gas-log-page-80">Cylinders</span>
          <input type="number" value={form.cylinders} onChange={set('cylinders')} className="ap-gas-log-page-81" />
        </div>
        <div>
          <span className="ap-gas-log-page-82">Kg Purchased</span>
          <input type="number" value={form.kgPurchased} onChange={set('kgPurchased')} className="ap-gas-log-page-83" />
        </div>
        <div>
          <span className="ap-gas-log-page-84">Cost/Kg (₹)</span>
          <input type="number" value={form.costPerKg} onChange={set('costPerKg')} className="ap-gas-log-page-85" />
        </div>
      </div>

      <div>
        <span className="ap-gas-log-page-86">Invoice No</span>
        <input value={form.invoiceNo} onChange={set('invoiceNo')} className="ap-gas-log-page-87" />
      </div>

      <div className="ap-gas-log-page-88">
        <span className="ap-gas-log-page-89">Total Cost</span>
        <span className="ap-gas-log-page-90">₹{totalCost.toLocaleString('en-IN')}</span>
      </div>
    </ModalShell>;
};

// ─── GasLogPage ───────────────────────────────────────────────────────────────
const GasLogPage = ({
  openModal
}) => {
  const [selectedLog, setSelectedLog] = useState(null);
  const [gasLogs, setGasLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // ── Purchase Log / price rate state ──
  const [activeTab, setActiveTab] = useState('usage'); // 'usage' | 'purchase'
  const [gasPurchases, setGasPurchases] = useState([]);
  const [rates, setRates] = useState({});
  const [gasTypeFilter, setGasTypeFilter] = useState('');
  const [purchaseQ, setPurchaseQ] = useState('');
  const [showRateModal, setShowRateModal] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState(null); // null | 'new' | purchase row

  // ── Unified delete-confirmation state — covers BOTH tabs ──
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'log' | 'purchase', row }
  const [deleting, setDeleting] = useState(false);
  const requestDelete = (type, row) => setDeleteTarget({
    type,
    row
  });
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const {
      type,
      row
    } = deleteTarget;
    setDeleting(true);
    try {
      if (type === 'log') {
        await gaslogApi.remove(row._id || row.id);
        setGasLogs(p => p.filter(g => (g._id || g.id) !== (row._id || row.id)));
        if (selectedLog && (selectedLog._id || selectedLog.id) === (row._id || row.id)) setSelectedLog(null);
      } else {
        await gasPurchaseApi.remove(row._id || row.id);
        setGasPurchases(p => p.filter(x => (x._id || x.id) !== (row._id || row.id)));
      }
      setDeleteTarget(null);
    } catch (e) {
      alert('Delete failed: ' + e.message);
    } finally {
      setDeleting(false);
    }
  };
  useEffect(() => {
    gasPurchaseApi.list({
      limit: 500
    }).then(res => {
      const raw = res?.data || res || [];
      setGasPurchases(raw.map(p => ({
        ...p,
        id: p.purchaseId || p._id,
        date: p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString('en-IN') : '—',
        dateISO: p.purchaseDate ? new Date(p.purchaseDate).toISOString().slice(0, 10) : ''
      })));
    }).catch(() => {});
    gasRateApi.current().then(res => {
      const list = res?.data || res || [];
      const map = {};
      list.forEach(r => {
        map[r.gasType] = {
          pricePerKg: r.pricePerKg,
          effectiveFrom: r.effectiveFrom ? new Date(r.effectiveFrom).toLocaleDateString('en-IN') : '—'
        };
      });
      setRates(map);
    }).catch(() => {});
  }, []);
  const handleSaveRate = async (gasType, pricePerKg) => {
    try {
      const saved = await gasRateApi.set({
        gasType,
        pricePerKg
      });
      setRates(r => ({
        ...r,
        [gasType]: {
          pricePerKg: saved.pricePerKg ?? pricePerKg,
          effectiveFrom: 'Today'
        }
      }));
    } catch (e) {
      alert('Price update failed: ' + e.message);
    }
  };
  const handleSavePurchase = async form => {
    try {
      const payload = {
        gasType: form.gasType,
        supplier: form.supplier,
        cylinders: Number(form.cylinders || 0),
        kgPurchased: Number(form.kgPurchased || 0),
        costPerKg: Number(form.costPerKg || 0),
        invoiceNo: form.invoiceNo,
        purchaseDate: form.date || new Date()
      };
      if (form.id || form._id) {
        const updated = await gasPurchaseApi.update(form._id || form.id, payload);
        setGasPurchases(p => p.map(x => x.id === (form.id || form.purchaseId) ? {
          ...x,
          ...updated,
          id: updated.purchaseId || updated._id,
          date: updated.purchaseDate ? new Date(updated.purchaseDate).toLocaleDateString('en-IN') : x.date,
          dateISO: updated.purchaseDate ? new Date(updated.purchaseDate).toISOString().slice(0, 10) : x.dateISO
        } : x));
      } else {
        const created = await gasPurchaseApi.create(payload);
        setGasPurchases(p => [{
          ...created,
          id: created.purchaseId || created._id,
          date: created.purchaseDate ? new Date(created.purchaseDate).toLocaleDateString('en-IN') : '—',
          dateISO: created.purchaseDate ? new Date(created.purchaseDate).toISOString().slice(0, 10) : ''
        }, ...p]);
      }
      setPurchaseModal(null);
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };
  useEffect(() => {
    gaslogApi.list({
      limit: 500
    }).then(res => {
      const raw = res?.data || res || [];
      setGasLogs(raw.map(g => ({
        ...g,
        id: g.logId || g._id,
        job: g.jobRef || g.job || '—',
        tech: g.techName || '—',
        customer: g.customerName || '—',
        date: g.date ? new Date(g.date).toLocaleDateString('en-IN') : '—',
        dateISO: g.date ? new Date(g.date).toISOString().slice(0, 10) : '',
        kgUsed: g.quantity || 0,
        kgRecovered: g.kgRecovered ?? null,
        cylinders: g.cylinders || 0,
        reason: g.notes || g.operation || '—',
        leakTest: g.leakTest ?? null,
        leakTestDone: g.leakTestDone ?? null,
        certification: g.certNumber || '—',
        compliant: g.compliant ?? true,
        acUnit: g.acUnit,
        kgRemaining: g.kgRemaining,
        pressureBefore: g.pressureBefore,
        pressureAfter: g.pressureAfter,
        gwp: g.gwp,
        regulation: g.regulation,
        disposalMethod: g.disposalMethod,
        supervisor: g.supervisor
      })));
    }).catch(() => {}).finally(() => setLoadingData(false));
  }, []);
  const {
    q,
    setQ,
    filtered: searchFiltered
  } = useTableSearch(gasLogs, ['id', 'job', 'tech', 'customer', 'gasType', 'reason'], {});
  const [compliantFilter, setCompliantFilter] = useState('');
  const filtered = searchFiltered.filter(g => !compliantFilter || (compliantFilter === 'Compliant' ? g.compliant : !g.compliant)).filter(g => !gasTypeFilter || g.gasType === gasTypeFilter);
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
  } = usePagination(filtered, 10);
  const {
    exportProps
  } = useExport({
    title: 'Gas / F-Gas Log',
    filename: 'cooltech-gaslog',
    template: 'generic_list',
    subtitle: 'AC Services Platform · Refrigerant Usage & Compliance',
    docId: 'GASLOG-EXPORT',
    columns: GASLOG_COLUMNS,
    rows: filtered,
    showTotals: true,
    totalColumns: ['kgUsed', 'cylinders']
  });
  const filteredPurchases = gasPurchases.filter(p => !gasTypeFilter || p.gasType === gasTypeFilter).filter(p => !purchaseQ || [p.id, p.supplier, p.gasType, p.invoiceNo].join(' ').toLowerCase().includes(purchaseQ.toLowerCase()));
  const {
    paginated: purchasePaginated,
    page: purchasePage,
    totalPages: purchaseTotalPages,
    setPage: setPurchasePage,
    pageSize: purchasePageSize,
    setPageSize: setPurchasePageSize,
    from: purchaseFrom,
    to: purchaseTo,
    total: purchaseTotal
  } = usePagination(filteredPurchases, 10);
  const {
    exportProps: purchaseExportProps
  } = useExport({
    title: 'Gas Purchase Log',
    filename: 'cooltech-gas-purchases',
    template: 'generic_list',
    subtitle: 'AC Services Platform · Refrigerant Purchases',
    docId: 'GASPURCHASE-EXPORT',
    columns: GASPURCHASE_COLUMNS,
    rows: filteredPurchases,
    showTotals: true,
    totalColumns: ['kgPurchased', 'totalCost']
  });
  const gasTypeMatch = item => !gasTypeFilter || item.gasType === gasTypeFilter;
  const totalKg = gasLogs.filter(gasTypeMatch).reduce((s, g) => s + (g.kgUsed || 0), 0);
  const totalCyl = gasLogs.filter(gasTypeMatch).reduce((s, g) => s + (g.cylinders || 0), 0);
  const totalEntries = gasLogs.filter(gasTypeMatch).length;
  const gasTypes = [...new Set(gasLogs.map(g => g.gasType))];
  const totalPurchasedKg = gasPurchases.filter(gasTypeMatch).reduce((s, p) => s + (p.kgPurchased || 0), 0);
  const totalPurchaseCost = gasPurchases.filter(gasTypeMatch).reduce((s, p) => s + (p.totalCost || 0), 0);
  const totalAvailableKg = totalPurchasedKg - totalKg;

  // ── The shared confirmation modal instance, rendered once at the root
  //    so both the list view and the detail-drill-in view can trigger it. ──
  const deleteModal = <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} title="Are you sure?" message={deleteTarget?.type === 'log' ? `Log ${deleteTarget?.row?.id} will be moved to Recently Deleted. You can restore it from there.` : `Purchase ${deleteTarget?.row?.id} will be moved to Recently Deleted. You can restore it from there.`} confirmText={deleting ? 'Deleting…' : 'Yes, Delete It!'} />;

  // Detail drill-in view
  if (selectedLog) {
    return <>
        <GasLogDetailView log={selectedLog} onBack={() => setSelectedLog(null)} onSave={async updated => {
        try {
          const saved = await gaslogApi.update(updated._id || updated.id, {
            gasType: updated.gasType,
            quantity: updated.kgUsed,
            operation: updated.operation || 'charge',
            certNumber: updated.certification || updated.certNumber,
            notes: updated.reason || updated.notes,
            pressure: updated.pressure,
            temperature: updated.temperature,
            date: updated.dateISO || updated.date,
            acUnit: updated.acUnit,
            cylinders: updated.cylinders,
            kgRecovered: updated.kgRecovered,
            kgRemaining: updated.kgRemaining,
            pressureBefore: updated.pressureBefore,
            pressureAfter: updated.pressureAfter,
            gwp: updated.gwp,
            leakTestDone: updated.leakTestDone,
            leakTest: updated.leakTest,
            regulation: updated.regulation,
            disposalMethod: updated.disposalMethod,
            supervisor: updated.supervisor,
            compliant: updated.compliant
          });
          setGasLogs(p => p.map(g => g._id === updated._id || g.id === updated.id ? {
            ...g,
            ...updated
          } : g));
          setSelectedLog({
            ...updated
          });
        } catch (e) {
          alert('Save failed: ' + e.message);
        }
      }} />
        {deleteModal}
      </>;
  }
  return <div className="fi ap-gas-log-page-91">

      <SectionHdr title="Gas / F-Gas Log" sub="Refrigerant usage & compliance records" action={activeTab === 'usage' ? '+ Log Gas Usage' : '+ Log Gas Purchase'} onAction={() => {
      if (activeTab === 'usage') {
        openModal('log_gas', {
          onSave: created => {
            setGasLogs(p => [{
              ...created,
              id: created.logId || created._id,
              job: created.jobRef || '—',
              tech: created.techName || '—',
              customer: created.customerName || '—',
              date: created.date ? new Date(created.date).toLocaleDateString('en-IN') : '—',
              dateISO: created.date ? new Date(created.date).toISOString().slice(0, 10) : '',
              kgUsed: created.quantity || 0,
              kgRecovered: created.kgRecovered ?? null,
              cylinders: created.cylinders || 0,
              reason: created.notes || created.operation || '—',
              leakTest: created.leakTest ?? null,
              leakTestDone: created.leakTestDone ?? null,
              certification: created.certNumber || '—',
              compliant: created.compliant ?? true,
              acUnit: created.acUnit,
              kgRemaining: created.kgRemaining,
              pressureBefore: created.pressureBefore,
              pressureAfter: created.pressureAfter,
              gwp: created.gwp,
              regulation: created.regulation,
              disposalMethod: created.disposalMethod,
              supervisor: created.supervisor
            }, ...p]);
          }
        });
      } else {
        setPurchaseModal('new');
      }
    }} />

      {/* Tabs */}
      <div className="ap-gas-log-page-92">
        {[{
        key: 'usage',
        label: 'Usage Log',
        icon: '🧪'
      }, {
        key: 'purchase',
        label: 'Purchase Log',
        icon: '🛒'
      }].map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
        borderBottom: activeTab === t.key ? "2px solid var(--brand)" : "2px solid transparent",
        color: activeTab === t.key ? "var(--brand)" : "var(--text-muted)"
      }} className="ap-gas-log-page-93">
            <span className="ap-gas-log-page-94">{t.icon}</span>
            {t.label}
          </button>)}
      </div>

      {activeTab === 'usage' ? <div className="ap-gas-log-page-95">
          <KCard label="Total Entries" value={totalEntries} sub="this month" icon="🧪" iconBg="#EFF6FF" color="#0369A1" delay="" />
          <KCard label="Total Kg Used" value={`${totalKg.toFixed(1)} kg`} sub="refrigerant" icon="⚗️" iconBg="#FFF7ED" color={COLORS.brand} delay="1" />
          <KCard label="Cylinders Used" value={totalCyl} sub="total" icon="🔵" iconBg="#F0FDF4" color="#16A34A" delay="2" />
          <KCard label="Compliant" value="100%" sub="all certified" icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="3" />
        </div> : <div className="ap-gas-log-page-96">
          <KCard label="Total Purchased" value={`${totalPurchasedKg.toFixed(1)} kg`} sub="refrigerant" icon="🛒" iconBg="#EFF6FF" color="#0369A1" delay="" />
          <KCard label="Total Available" value={`${totalAvailableKg.toFixed(1)} kg`} sub="in stock" icon="✅" iconBg="#F0FDF4" color={totalAvailableKg < 0 ? '#DC2626' : '#16A34A'} delay="1" />
          <KCard label="Total Used" value={`${totalKg.toFixed(1)} kg`} sub="refrigerant" icon="⚗️" iconBg="#FFF7ED" color={COLORS.brand} delay="2" />
          <KCard label="Total Cost" value={`₹${totalPurchaseCost.toLocaleString('en-IN')}`} sub="all purchases" icon="💰" iconBg="#F5F3FF" color="#7C3AED" delay="3" />
        </div>}

      {activeTab === 'usage' && <div className="ap-gas-log-page-97">
          <span className="ap-gas-log-page-98">ℹ️</span>
          <div>
            <div className="ap-gas-log-page-99">F-Gas Compliance Notice</div>
            <div className="ap-gas-log-page-100">All technicians handling R-32 and R-410A refrigerants must hold valid F-Gas certification. Records are kept for 5 years as per regulations.</div>
          </div>
        </div>}

      {activeTab === 'usage' ? <div className="ap-gas-log-page-101">
          <div className="ap-gas-log-page-102">
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by job, technician, customer, gas type…" />
            <FilterSelect value={gasTypeFilter} onChange={setGasTypeFilter} options={gasTypes} allLabel="All Gas Types" />
            <FilterSelect value={compliantFilter} onChange={setCompliantFilter} options={['Compliant', 'Non-Compliant']} allLabel="Compliance: All" />
            <div className="ap-gas-log-page-103">
              <ExportDropdown {...exportProps} />
            </div>
          </div>

          <div className="ap-gas-log-page-104">
            <table className="ap-gas-log-page-105">
              <Thead cols={['Log ID', 'Job', 'Technician', 'Customer', 'Date', 'Gas Type', 'Cylinders', 'Kg Used', 'Kg Recovered', 'Reason', 'Leak Test', 'Certification', 'Compliant', '']} />
              <tbody>
                {paginated.length === 0 && <tr><td colSpan={14} className="ap-gas-log-page-106">No gas log entries match your filters.</td></tr>}
                {paginated.map((g, i) => <tr key={g.id} className="row ap-gas-log-page-107" style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                    <td className="ap-gas-log-page-108"><span className="ap-gas-log-page-109">{g.id}</span></td>
                    <td className="ap-gas-log-page-110"><span className="ap-gas-log-page-111">{g.job}</span></td>
                    <td className="ap-gas-log-page-112">
                      <div className="ap-gas-log-page-113">
                        <Avatar name={g.tech} size={24} />
                        <span className="ap-gas-log-page-114">{g.tech}</span>
                      </div>
                    </td>
                    <td className="ap-gas-log-page-115">{g.customer}</td>
                    <td className="ap-gas-log-page-116">{g.date}</td>
                    <td className="ap-gas-log-page-117">
                      <span className="ap-gas-log-page-118">{g.gasType}</span>
                    </td>
                    <td className="ap-gas-log-page-119"><span className="ap-gas-log-page-120">{g.cylinders}</span></td>
                    <td className="ap-gas-log-page-121"><span className="ap-gas-log-page-122">{g.kgUsed} kg</span></td>
                    <td className="ap-gas-log-page-123">
                      {g.kgRecovered ? <span className="ap-gas-log-page-124">{g.kgRecovered} kg</span> : <span className="ap-gas-log-page-125">—</span>}
                    </td>
                    <td className="ap-gas-log-page-126">{g.reason}</td>
                    <td className="ap-gas-log-page-127">
                      {g.leakTest == null ? <span className="ap-gas-log-page-128">—</span> : g.leakTest ? <span className="ap-gas-log-page-129">Pass</span> : <span className="ap-gas-log-page-130">Fail</span>}
                    </td>
                    <td className="ap-gas-log-page-131">{g.certification}</td>
                    <td className="ap-gas-log-page-132">
                      {g.compliant ? <span className="ap-gas-log-page-133">✅</span> : <span className="ap-gas-log-page-134">❌</span>}
                    </td>
                    <td onClick={e => e.stopPropagation()} className="ap-gas-log-page-135">
                      <ActionDropdown onView={() => setSelectedLog(g)} onDelete={() => requestDelete('log', g)} />
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}
        </div> : <div className="ap-gas-log-page-136">
          <div className="ap-gas-log-page-137">
            <TableSearchBar value={purchaseQ} onChange={setPurchaseQ} placeholder="Search by supplier, invoice no, gas type…" />
            <FilterSelect value={gasTypeFilter} onChange={setGasTypeFilter} options={GAS_TYPE_OPTIONS} allLabel="All Gas Types" />
            <button onClick={() => setShowRateModal(true)} className="ap-gas-log-page-138">
              💰 Manage Gas Prices
            </button>
            <div className="ap-gas-log-page-139">
              <ExportDropdown {...purchaseExportProps} />
            </div>
          </div>

          <div className="ap-gas-log-page-140">
            <table className="ap-gas-log-page-141">
              <Thead cols={['Purchase ID', 'Supplier', 'Gas Type', 'Date', 'Cylinders', 'Kg Purchased', 'Cost/Kg', 'Total Cost', 'Invoice No', '']} />
              <tbody>
                {purchasePaginated.length === 0 && <tr><td colSpan={10} className="ap-gas-log-page-142">No purchase entries match your filters.</td></tr>}
                {purchasePaginated.map((p, i) => <tr key={p.id} className="row ap-gas-log-page-143" style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                    <td className="ap-gas-log-page-144"><span className="ap-gas-log-page-145">{p.id}</span></td>
                    <td className="ap-gas-log-page-146">{p.supplier}</td>
                    <td className="ap-gas-log-page-147">
                      <span className="ap-gas-log-page-148">{p.gasType}</span>
                    </td>
                    <td className="ap-gas-log-page-149">{p.date}</td>
                    <td className="ap-gas-log-page-150"><span className="ap-gas-log-page-151">{p.cylinders}</span></td>
                    <td className="ap-gas-log-page-152"><span className="ap-gas-log-page-153">{p.kgPurchased} kg</span></td>
                    <td className="ap-gas-log-page-154">₹{p.costPerKg}</td>
                    <td className="ap-gas-log-page-155"><span className="ap-gas-log-page-156">₹{(p.totalCost || 0).toLocaleString('en-IN')}</span></td>
                    <td className="ap-gas-log-page-157">{p.invoiceNo || '—'}</td>
                    <td onClick={e => e.stopPropagation()} className="ap-gas-log-page-158">
                      <ActionDropdown onEdit={() => setPurchaseModal(p)} onDelete={() => requestDelete('purchase', p)} />
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          {purchaseTotalPages > 0 && <Pagination page={purchasePage} totalPages={purchaseTotalPages} setPage={setPurchasePage} pageSize={purchasePageSize} setPageSize={setPurchasePageSize} from={purchaseFrom} to={purchaseTo} total={purchaseTotal} />}
        </div>}

      {showRateModal && <PriceRateModal rates={rates} onClose={() => setShowRateModal(false)} onSave={handleSaveRate} />}

      {purchaseModal && <PurchaseFormModal initial={purchaseModal === 'new' ? null : purchaseModal} rates={rates} onClose={() => setPurchaseModal(null)} onSave={handleSavePurchase} />}

      {deleteModal}
    </div>;
};
export default GasLogPage;