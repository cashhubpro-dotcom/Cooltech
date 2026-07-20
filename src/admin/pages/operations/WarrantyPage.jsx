import { useState, useEffect, useMemo } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { warrantyApi, partWarrantyApi } from '../../services/api';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Part types + colour tokens (mirrors the AC Parts mockup, ported to our design system) ──
const PART_TYPES = ['Compressor', 'PCB Board', 'Capacitor', 'Fan Motor', 'Gas Charge', 'IDU/ODU Coil', 'Remote', 'Sensor', 'Other'];
const PART_TYPE_COLORS = {
  Compressor: "var(--purple)",
  'PCB Board': "var(--info)",
  Capacitor: "var(--warning)",
  'Fan Motor': "var(--success)",
  'Gas Charge': "var(--xf43f5e)",
  'IDU/ODU Coil': "var(--x14b8a6)",
  Remote: "var(--text-muted)",
  Sensor: "var(--x6366f1)",
  Other: "var(--text-faint)"
};
const BRAND_COLORS = ["var(--info)", "var(--success)", "var(--purple)", "var(--warning)", "var(--xec4899)", "var(--x06b6d4)"];

// active / expiring-soon / expired — layered on top of the backend's active/expired status
// using daysLeft, same threshold logic as the mockup (45 days).
const STATUS_META = {
  active: {
    dot: "var(--success-text)",
    text: "var(--success-text)",
    bg: "var(--success-bg)",
    border: "var(--success-border)",
    label: 'Active'
  },
  soon: {
    dot: "var(--warning)",
    text: "var(--warning-text)",
    bg: "var(--warning-bg)",
    border: "var(--warning-border)",
    label: 'Expiring soon'
  },
  expired: {
    dot: "var(--danger-text)",
    text: "var(--danger-text)",
    bg: "var(--danger-bg)",
    border: "var(--danger-border)",
    label: 'Expired'
  }
};
function displayStatus(w) {
  if (w.status === 'expired') return 'expired';
  if (typeof w.daysLeft === 'number' && w.daysLeft <= 45) return 'soon';
  return 'active';
}
const fmtDate = val => {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d) ? String(val) :fmtDateDMY(d);
};
const daysUntil = endVal => {
  if (!endVal) return 0;
  return Math.max(0, Math.ceil((new Date(endVal) - new Date()) / 86400000));
};

// ─── Column config for export ─────────────────────────────────────────────────
const UNIT_COLUMNS = [{
  label: 'ID',
  key: 'id',
  width: 10,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Customer',
  key: 'customer',
  width: 20,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Unit',
  key: 'unit',
  width: 22
}, {
  label: 'Brand',
  key: 'brand',
  width: 12
}, {
  label: 'Model',
  key: 'model',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Serial No.',
  key: 'serial',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Install Date',
  key: 'installDate',
  width: 13
}, {
  label: 'Warranty End',
  key: 'warrantyEnd',
  width: 13
}, {
  label: 'Type',
  key: 'type',
  width: 18
}, {
  label: 'AMC',
  key: 'extendedAMC',
  width: 6,
  format: v => v ? 'Yes' : 'No'
}, {
  label: 'Status',
  key: 'status',
  width: 8,
  format: v => (v ?? '').charAt(0).toUpperCase() + (v ?? '').slice(1)
}];
const PART_COLUMNS = [{
  label: 'Part ID',
  key: 'id',
  width: 10,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Customer',
  key: 'customer',
  width: 20,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Linked Unit',
  key: 'linkedUnitLabel',
  width: 22
}, {
  label: 'Part Type',
  key: 'partType',
  width: 16
}, {
  label: 'Brand',
  key: 'brand',
  width: 12
}, {
  label: 'Model',
  key: 'model',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Serial No.',
  key: 'serial',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Install Date',
  key: 'installDate',
  width: 13
}, {
  label: 'Warranty End',
  key: 'warrantyEnd',
  width: 13
}, {
  label: 'Warranty Type',
  key: 'type',
  width: 16
}, {
  label: 'Status',
  key: 'status',
  width: 8,
  format: v => (v ?? '').charAt(0).toUpperCase() + (v ?? '').slice(1)
}];

// ─── normalizeWarranty — AC UNITS ──────────────────────────────────────────────
// FIX: every row goes through this so all display fields are defined; resolves
// backend field-name variants (product, installationDate, endDate, etc.).
const normalizeWarranty = (w, idx) => {
  return {
    ...w,
    recordType: 'unit',
    id: w.warrantyId ?? w.id ?? w._id ?? `wrt-${idx}`,
    customer: typeof w.customer === 'object' ? w.customer?.name ?? w.customerName ?? '—' : w.customerName ?? w.customer ?? '—',
    unit: w.product || w.unit || '—',
    warrantyEnd: fmtDate(w.endDate || w.warrantyEnd || w.expiryDate),
    startDate: fmtDate(w.startDate || w.start_date),
    installDate: fmtDate(w.installDate || w.installationDate || w.startDate),
    purchaseDate: fmtDate(w.purchaseDate || w.startDate),
    brand: w.brand || '—',
    model: w.model || '—',
    serial: w.serial || '—',
    type: w.type || 'AC Unit',
    status: (w.status || 'active').toLowerCase(),
    extendedAMC: Boolean(w.extendedAMC || w.amcLinked),
    claimsCount: w.claimsCount || 0,
    notes: w.notes || '',
    daysLeft: daysUntil(w.endDate || w.warrantyEnd || w.expiryDate)
  };
};

// ─── normalizePartWarranty — AC PARTS ──────────────────────────────────────────
// Maps a raw PartWarranty doc from /api/part-warranties into the same display
// shape used across the table/timeline/detail view.
const normalizePartWarranty = (p, idx) => {
  const linkedUnitObj = typeof p.linkedUnit === 'object' && p.linkedUnit !== null ? p.linkedUnit : null;
  return {
    ...p,
    recordType: 'part',
    id: p.partWarrantyId ?? p.id ?? p._id ?? `pwr-${idx}`,
    customer: typeof p.customer === 'object' ? p.customer?.name ?? p.customerName ?? '—' : p.customerName ?? p.customer ?? '—',
    // linkedUnit stays the raw AC-unit id (for the "Linked AC Unit" dropdown on
    // edit); linkedUnitLabel is what actually renders in the UI.
    linkedUnit: linkedUnitObj?._id || linkedUnitObj?.id || p.linkedUnit || '',
    linkedUnitLabel: p.linkedUnitLabel || (linkedUnitObj ? `${linkedUnitObj.warrantyId || ''} — ${linkedUnitObj.customerName || ''}` : '') || '—',
    partType: p.partType || 'Other',
    brand: p.brand || '—',
    model: p.model || '—',
    serial: p.serial || '—',
    installDate: fmtDate(p.startDate || p.installDate),
    warrantyEnd: fmtDate(p.endDate || p.warrantyEnd),
    type: p.type || 'Manufacturer',
    status: (p.status || 'active').toLowerCase(),
    claimsCount: p.claimsCount || 0,
    notes: p.notes || '',
    daysLeft: daysUntil(p.endDate || p.warrantyEnd)
  };
};

// ─── Field definitions for detail view ───────────────────────────────────────
const UNIT_FIELDS_OVERVIEW = [{
  key: 'customer',
  label: 'Customer'
}, {
  key: 'unit',
  label: 'AC Unit Description'
}, {
  key: 'acType',
  label: 'AC Type'
}, {
  key: 'brand',
  label: 'Brand'
}, {
  key: 'model',
  label: 'Model No.',
  mono: true
}, {
  key: 'serial',
  label: 'Serial No.',
  mono: true
}, {
  key: 'capacity',
  label: 'Capacity'
}, {
  key: 'technician',
  label: 'Technician Installed By'
}];
const PART_FIELDS_OVERVIEW = [{
  key: 'customer',
  label: 'Customer'
}, {
  key: 'linkedUnitLabel',
  label: 'Linked AC Unit'
}, {
  key: 'partType',
  label: 'Part Type'
}, {
  key: 'brand',
  label: 'Brand'
}, {
  key: 'model',
  label: 'Model / Part No.',
  mono: true
}, {
  key: 'serial',
  label: 'Serial No.',
  mono: true
}];

// ─── SectionDivider ───────────────────────────────────────────────────────────
const SectionDivider = ({
  title,
  icon
}) => <div className="ap-warranty-page-1">
    {icon && <span className="ap-warranty-page-2">{icon}</span>}
    {title}
  </div>;

// ─── StatusPill — small dot + label, matches the mockup's status styling ─────
const StatusPill = ({
  status
}) => {
  const s = STATUS_META[status] || STATUS_META.active;
  return <span style={{
    color: s.text,
    background: s.bg,
    border: `1px solid ${s.border}`
  }} className="ap-warranty-page-3">
      <span style={{
      background: s.dot
    }} className="ap-warranty-page-4" />
      {s.label}
    </span>;
};

// ─── WarrantyDetailView ───────────────────────────────────────────────────────
// FIX: handleCreate was referenced inside this component but defined in the
// parent (WarrantyPage). It is now passed in as a prop so there's no
// ReferenceError when the Renew button calls openModal('new_warranty', { onSave }).
const WarrantyDetailView = ({
  warranty,
  onBack,
  onSave,
  onRenew,
  openModal
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const d = editMode ? {
    ...warranty,
    ...editData
  } : warranty;
  const isPart = d.recordType === 'part';
  const dStatus = displayStatus(d);
  const isExpired = dStatus === 'expired';
  const set = key => e => setEditData(p => ({
    ...p,
    [key]: e.target.value
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
  const TABS = isPart ? [{
    key: 'overview',
    label: 'Overview',
    icon: '🔧'
  }, {
    key: 'coverage',
    label: 'Coverage',
    icon: '📋'
  }, {
    key: 'claims',
    label: 'Claims',
    icon: '⚠️'
  }] : [{
    key: 'overview',
    label: 'Overview',
    icon: '🛡️'
  }, {
    key: 'coverage',
    label: 'Coverage',
    icon: '📋'
  }, {
    key: 'claims',
    label: 'Claims',
    icon: '⚠️'
  }, {
    key: 'documents',
    label: 'Documents',
    icon: '📄'
  }];
  const tabBar = <div className="ap-warranty-page-5">
      {TABS.map(t => <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
      borderBottom: activeTab === t.key ? "2px solid var(--brand)" : "2px solid transparent",
      color: activeTab === t.key ? "var(--brand)" : "var(--text-muted)"
    }} className="ap-warranty-page-6">
          <span className="ap-warranty-page-7">{t.icon}</span>{t.label}
        </button>)}
    </div>;
  const Cell = ({
    fKey,
    label,
    highlight,
    mono,
    type = 'text',
    options
  }) => {
    if (!editMode) return <div style={{
      background: highlight ? "var(--xea580c08)" : "var(--bg)",
      border: `1px solid ${highlight ? COLORS.brand + '30' : COLORS.border}`
    }} className="ap-warranty-page-8">
        <span className="ap-warranty-page-9">{label}</span>
        <span style={{
        color: highlight ? "var(--brand)" : "var(--text-h2)",
        fontFamily: mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
      }} className="ap-warranty-page-10">
          {d[fKey] || <span className="ap-warranty-page-11">—</span>}
        </span>
      </div>;
    if (type === 'select') return <div className="ap-warranty-page-12">
        <span className="ap-warranty-page-13">{label}</span>
        <select value={editData[fKey] ?? warranty[fKey] ?? ''} onChange={set(fKey)} className="ap-warranty-page-14">
          {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>;
    return <div className="ap-warranty-page-15">
        <span className="ap-warranty-page-16">{label}</span>
        <input type={type} value={editData[fKey] ?? warranty[fKey] ?? ''} onChange={set(fKey)} style={{
        fontFamily: mono ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
      }} className="ap-warranty-page-17" />
      </div>;
  };
  const header = <div style={{
    background: isExpired ? "var(--danger-bg)" : "var(--success-bg)",
    border: `1px solid ${isExpired ? '#FECACA' : '#BBF7D0'}`
  }} className="ap-warranty-page-18">
      <div className="ap-warranty-page-19">
        <span className="ap-warranty-page-20">{isPart ? '🔧' : '🛡️'}</span>
        <div>
          <div className="ap-warranty-page-21">
            {isPart ? d.partType || 'Part' : d.unit || '—'}
          </div>
          <div className="ap-warranty-page-22">{d.brand} · {d.model} · S/N: {d.serial}</div>
          <div className="ap-warranty-page-23">
            {d.customer}{isPart && d.linkedUnitLabel ? ` · linked to ${d.linkedUnitLabel}` : ''}
          </div>
        </div>
      </div>
      <div className="ap-warranty-page-24">
        <StatusPill status={dStatus} />
        {d.extendedAMC && <span className="ap-warranty-page-25">✓ AMC Linked</span>}
      </div>
    </div>;
  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <div className="ap-warranty-page-26">
          <SectionDivider title={isPart ? 'Customer & Part' : 'Customer & Unit'} icon="🪪" />
          <div className="ap-warranty-page-27">
            {(isPart ? PART_FIELDS_OVERVIEW : UNIT_FIELDS_OVERVIEW).map(f => <Cell key={f.key} fKey={f.key} label={f.label} mono={f.mono} />)}
          </div>
          {!isPart && <>
              <SectionDivider title="Purchase & Installation" icon="🧾" />
              <div className="ap-warranty-page-28">
                <Cell fKey="purchaseDate" label="Purchase Date" type="date" />
                <Cell fKey="invoiceNo" label="Invoice / Bill No." mono />
                <Cell fKey="purchaseSource" label="Purchase Source" />
                <Cell fKey="installDate" label="Install Date" type="date" />
              </div>
            </>}
          {isPart && <>
              <SectionDivider title="Installation" icon="🧾" />
              <div className="ap-warranty-page-29">
                <Cell fKey="installDate" label="Install Date" type="date" />
              </div>
            </>}
        </div>;
      case 'coverage':
        return <div className="ap-warranty-page-30">
          <SectionDivider title="Warranty Coverage" icon="🛡️" />
          <div className="ap-warranty-page-31">
            <Cell fKey="type" label="Warranty Type" type="select" options={isPart ? ['Manufacturer', 'Dealer', 'AMC covered', 'Extended'] : ['Comprehensive', 'Compressor', 'Parts & Labour', 'Parts Only']} />
            <Cell fKey="warrantyEnd" label="Warranty End" type="date" highlight />
            {!isPart && <Cell fKey="compressorEnd" label="Compressor Warranty End" type="date" highlight />}
            {!isPart && <Cell fKey="partsWarranty" label="Parts Warranty Period" />}
            {!isPart && <Cell fKey="labourCovered" label="Labour Covered" />}
            {!isPart && <Cell fKey="amcRequired" label="AMC Required" />}
            <Cell fKey="amcRef" label="Linked AMC Ref" mono />
            <Cell fKey="alertBefore" label="Alert Before Expiry" />
            <Cell fKey="status" label="Status" type="select" options={['active', 'expired']} />
          </div>
        </div>;
      case 'claims':
        return <div className="ap-warranty-page-32">
          <SectionDivider title="Claim History" icon="📋" />
          <div className="ap-warranty-page-33">
            <Cell fKey="claimsUsed" label="No. of Claims Used" type="number" />
            <Cell fKey="lastClaimDate" label="Last Claim Date" type="date" />
          </div>
          <div className="ap-warranty-page-34">
            {editMode ? <div className="ap-warranty-page-35">
                <span className="ap-warranty-page-36">Claim Notes</span>
                <textarea value={editData.claimNotes ?? warranty.claimNotes ?? ''} onChange={set('claimNotes')} rows={4} className="ap-warranty-page-37" />
              </div> : d.claimNotes ? <div className="ap-warranty-page-38">
                <span className="ap-warranty-page-39">Claim Notes</span>
                {d.claimNotes}
              </div> : <div className="ap-warranty-page-40">
                No warranty claims filed yet.
              </div>}
          </div>
        </div>;
      case 'documents':
        return <div className="ap-warranty-page-41">
          <SectionDivider title="Uploaded Documents" icon="📄" />
          <div className="ap-warranty-page-42">
            {[{
              label: 'Warranty Card',
              icon: '🛡️',
              file: d.warrantyCardFile
            }, {
              label: 'Purchase Invoice',
              icon: '🧾',
              file: d.invoiceFile
            }].map(({
              label,
              icon,
              file
            }) => <div key={label} style={{
              border: `1px solid ${file ? COLORS.brand + '40' : COLORS.border}`,
              background: file ? "var(--xea580c06)" : "var(--bg)"
            }} className="ap-warranty-page-43">
                <span className="ap-warranty-page-44">{file ? '✅' : icon}</span>
                <div>
                  <div className="ap-warranty-page-45">{label}</div>
                  {file ? <a href={file} target="_blank" rel="noreferrer" className="ap-warranty-page-46">View / Download →</a> : <span className="ap-warranty-page-47">Not uploaded yet</span>}
                </div>
              </div>)}
          </div>
        </div>;
      default:
        return null;
    }
  };
  return <div className="fi ap-warranty-page-48">
      {/* Breadcrumb + actions */}
      <div className="ap-warranty-page-49">
        <div className="ap-warranty-page-50">
          <button onClick={onBack} className="ap-warranty-page-51">←</button>
          <span className="ap-warranty-page-52">{isPart ? 'AC Parts' : 'AC Units'} /</span>
          <span className="ap-warranty-page-53">{warranty.id}</span>
        </div>
        <div className="ap-warranty-page-54">
          {editMode ? <>
              <button onClick={() => {
            setEditMode(false);
            setEditData({});
          }} className="ap-warranty-page-55">
                Cancel
              </button>
              <button onClick={() => {
            onSave({
              ...warranty,
              ...editData
            });
            setEditMode(false);
            setEditData({});
          }} className="ap-warranty-page-56">
                ✓ Save Changes
              </button>
            </> : <>
              {isExpired &&
          // FIX: was openModal('new_warranty', { onSave: handleCreate }) — handleCreate
          // is defined in WarrantyPage not here. Now calls onRenew prop instead.
          <button onClick={() => onRenew ? onRenew(warranty) : openModal('new_warranty')} className="ap-warranty-page-57">
                  🔄 Renew
                </button>}
              {!isPart && <button onClick={() => openModal('schedule_amc')} className="ap-warranty-page-58">
                  📅 Schedule AMC
                </button>}
              <button onClick={() => setEditMode(true)} className="ap-warranty-page-59">
                ✏️ Edit
              </button>
            </>}
        </div>
      </div>

      {header}

      <div style={{
      border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
      boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.04)"
    }} className="ap-warranty-page-60">
        {tabBar}
        {renderTab()}
      </div>
    </div>;
};

// ─── WarrantyPage ─────────────────────────────────────────────────────────────
const WarrantyPage = ({
  openModal
}) => {
  const [unitWarranties, setUnitWarranties] = useState([]);
  const [partWarranties, setPartWarranties] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  // AC Units / AC Parts tab
  const [tab, setTab] = useState('units');
  useEffect(() => {
    Promise.all([warrantyApi.list({
      limit: 500
    }), partWarrantyApi.list({
      limit: 500
    })]).then(([unitRes, partRes]) => {
      const rawUnits = Array.isArray(unitRes?.data) ? unitRes.data : Array.isArray(unitRes) ? unitRes : [];
      const rawParts = Array.isArray(partRes?.data) ? partRes.data : Array.isArray(partRes) ? partRes : [];
      setUnitWarranties(rawUnits.map(normalizeWarranty));
      setPartWarranties(rawParts.map(normalizePartWarranty));
    }).catch(() => {}).finally(() => setLoadingData(false));
  }, []);

  // ── CRUD helpers ────────────────────────────────────────────────────────────
  const handleCreate = async form => {
    if (form.recordType === 'part') {
      try {
        const doc = await partWarrantyApi.create({
          customerName: form.customer || '',
          linkedUnit: form.linkedUnit || undefined,
          // AC-unit ObjectId
          linkedUnitLabel: form.linkedUnitLabel || '',
          partType: form.partType,
          brand: form.brand || '',
          model: form.model || '',
          serial: form.serial || '',
          startDate: form.installDate || new Date(),
          endDate: form.warrantyEnd,
          type: form.type || 'Manufacturer',
          notes: form.notes || ''
        });
        const merged = {
          customerName: form.customer,
          linkedUnitLabel: form.linkedUnitLabel,
          partType: form.partType,
          brand: form.brand,
          model: form.model,
          serial: form.serial,
          startDate: form.installDate,
          endDate: form.warrantyEnd,
          type: form.type,
          status: 'active',
          ...doc
        };
        setPartWarranties(p => [normalizePartWarranty(merged, p.length), ...p]);
      } catch (e) {
        alert('Create failed: ' + e.message);
      }
      return;
    }
    try {
      // Backend schema (warrantySchema): customerName, product, brand, model,
      // serial, type, startDate, endDate, status, notes
      // warrantyApi.create() returns raw Mongoose doc — no { data: } wrapper
      const doc = await warrantyApi.create({
        customerName: form.customer || '',
        product: form.unit || form.product || '',
        brand: form.brand || '',
        model: form.model || '',
        serial: form.serial || '',
        type: form.type || 'AC Unit',
        startDate: form.installDate || new Date(),
        endDate: form.warrantyEnd || form.expiryDate,
        status: 'active',
        notes: form.notes || ''
      });
      const merged = {
        customerName: form.customer,
        product: form.unit,
        brand: form.brand,
        model: form.model,
        serial: form.serial,
        type: form.type,
        startDate: form.installDate,
        endDate: form.warrantyEnd,
        status: 'active',
        acType: form.acType,
        capacity: form.capacity,
        technician: form.technician,
        purchaseDate: form.purchaseDate,
        invoiceNo: form.invoiceNo,
        purchaseSource: form.purchaseSource,
        installDate: form.installDate,
        ...doc
      };
      setUnitWarranties(p => [normalizeWarranty(merged, p.length), ...p]);
    } catch (e) {
      alert('Create failed: ' + e.message);
    }
  };
  const handleSave = async updated => {
    if (updated.recordType === 'part') {
      try {
        await partWarrantyApi.update(updated._id || updated.id, {
          customerName: updated.customerName || updated.customer || '',
          linkedUnit: updated.linkedUnit || undefined,
          linkedUnitLabel: updated.linkedUnitLabel || '',
          partType: updated.partType,
          brand: updated.brand || '',
          model: updated.model || '',
          serial: updated.serial || '',
          startDate: updated.startDate,
          endDate: updated.warrantyEnd || updated.endDate,
          type: updated.type,
          status: updated.status,
          notes: updated.claimNotes || updated.notes || ''
        });
        const normalized = normalizePartWarranty(updated, 0);
        setPartWarranties(p => p.map(w => w._id === updated._id || w.id === updated.id ? normalized : w));
        setSelectedWarranty(normalized);
      } catch (e) {
        alert('Save failed: ' + e.message);
      }
      return;
    }
    try {
      await warrantyApi.update(updated._id || updated.id, {
        customerName: updated.customerName || updated.customer || '',
        product: updated.unit || updated.product || '',
        brand: updated.brand || '',
        model: updated.model || '',
        serial: updated.serial || '',
        type: updated.type || 'AC Unit',
        startDate: updated.startDate,
        endDate: updated.warrantyEnd || updated.endDate || updated.expiryDate,
        status: updated.status,
        notes: updated.claimNotes || updated.notes || ''
      });
      const normalized = normalizeWarranty(updated, 0);
      setUnitWarranties(p => p.map(w => w._id === updated._id || w.id === updated.id ? normalized : w));
      setSelectedWarranty(normalized);
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };
  const handleDelete = async w => {
    if (!window.confirm('Delete this warranty record?')) return;
    try {
      if (w.recordType === 'part') {
        await partWarrantyApi.remove(w._id || w.id);
        setPartWarranties(p => p.filter(x => (x._id || x.id) !== (w._id || w.id)));
      } else {
        await warrantyApi.remove(w._id || w.id);
        setUnitWarranties(p => p.filter(x => (x._id || x.id) !== (w._id || w.id)));
      }
      if (selectedWarranty && (selectedWarranty._id || selectedWarranty.id) === (w._id || w.id)) setSelectedWarranty(null);
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  // ── Current tab's records ────────────────────────────────────────────────
  const currentRecords = tab === 'units' ? unitWarranties : partWarranties;

  // ── Search + filter (re-scoped to whichever tab is active) ──────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchFiltered
  } = useTableSearch(currentRecords, tab === 'units' ? ['customer', 'brand', 'model', 'serial', 'unit', 'id'] : ['customer', 'brand', 'model', 'serial', 'partType', 'linkedUnitLabel', 'id'], {
    status: '',
    brand: '',
    type: ''
  });
  const filtered = searchFiltered.filter(r => !activeFilters.status || displayStatus(r) === activeFilters.status).filter(r => !activeFilters.brand || r.brand === activeFilters.brand).filter(r => !activeFilters.type || (tab === 'units' ? r.type === activeFilters.type : r.partType === activeFilters.type));
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
    title: tab === 'units' ? 'Warranty Tracker — AC Units' : 'Warranty Tracker — AC Parts',
    filename: tab === 'units' ? 'cooltech-warranties-units' : 'cooltech-warranties-parts',
    template: 'generic_list',
    subtitle: 'AC Services Platform · Warranty Register',
    docId: 'WARRANTY-EXPORT',
    columns: tab === 'units' ? UNIT_COLUMNS : PART_COLUMNS,
    rows: filtered
  });

  // ── Stat counts (active / expiring soon / expired) over the current tab ─────
  const statCounts = useMemo(() => {
    const c = {
      active: 0,
      soon: 0,
      expired: 0
    };
    currentRecords.forEach(w => {
      c[displayStatus(w)]++;
    });
    return c;
  }, [currentRecords]);

  // ── Distribution: brand (units) or part type (parts) ────────────────────────
  const brands = [...new Set(unitWarranties.map(w => w.brand).filter(Boolean))];
  const types = tab === 'units' ? [...new Set(unitWarranties.map(w => w.type).filter(Boolean))] : PART_TYPES;
  const brandData = brands.map(b => ({
    brand: b,
    count: unitWarranties.filter(w => w.brand === b).length,
    active: unitWarranties.filter(w => w.brand === b && w.status === 'active').length
  })).sort((a, b) => b.count - a.count);
  const total_units = unitWarranties.length || 1;
  const partTypeData = useMemo(() => {
    const map = {};
    partWarranties.forEach(p => {
      map[p.partType || 'Other'] = (map[p.partType || 'Other'] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(map));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({
      type,
      count,
      pct: Math.round(count / max * 100)
    }));
  }, [partWarranties]);

  // ── Expiry timeline for whichever tab is active ─────────────────────────────
  const timeline = useMemo(() => [...currentRecords].sort((a, b) => new Date(a.warrantyEnd) - new Date(b.warrantyEnd)).slice(0, 5), [currentRecords]);

  // ── openModal helper — passes unit options for the "Linked AC Unit" picker ──
  const openRegisterModal = defaultRecordType => openModal('new_warranty', {
    onSave: handleCreate,
    defaultRecordType,
    unitOptions: unitWarranties.map(w => ({
      id: w._id || w.id,
      label: `${w.id} — ${w.customer} (${w.unit})`
    }))
  });

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selectedWarranty) {
    return <WarrantyDetailView warranty={selectedWarranty} onBack={() => setSelectedWarranty(null)} onSave={handleSave} onRenew={() => openRegisterModal(selectedWarranty.recordType)} openModal={openModal} />;
  }
  return <div className="fi ap-warranty-page-61">

      {/* ── Header ── */}
      <div className="ap-warranty-page-62">
        <div>
          <div className="ap-warranty-page-63">Warranty Tracker</div>
          <div className="ap-warranty-page-64">
            Track AC units and AC parts warranties in one place
          </div>
        </div>
        <button className="btn ap-warranty-page-65" onClick={() => openRegisterModal(tab === 'units' ? 'unit' : 'part')}>
          + Register Warranty
        </button>
      </div>

      {/* ── Tabs: AC Units / AC Parts ── */}
      <div className="ap-warranty-page-66">
        {[{
        key: 'units',
        label: 'AC units',
        count: unitWarranties.length
      }, {
        key: 'parts',
        label: 'AC parts',
        count: partWarranties.length
      }].map(t => <button key={t.key} onClick={() => {
        setTab(t.key);
        setQ('');
      }} style={{
        background: tab === t.key ? "var(--white)" : "transparent",
        color: tab === t.key ? "var(--text-h1)" : "var(--text-muted)",
        boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,.08)" : "none"
      }} className="ap-warranty-page-67">
            {t.label}
            <span style={{
          background: tab === t.key ? "var(--xea580c15)" : "var(--border)",
          color: tab === t.key ? "var(--brand)" : "var(--text-muted)"
        }} className="ap-warranty-page-68">{t.count}</span>
          </button>)}
      </div>

      {/* ── KPI cards ── */}
      <div className="ap-warranty-page-69">
        <KCard label="Active" value={statCounts.active} sub="under cover" icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="" />
        <KCard label="Expiring Soon" value={statCounts.soon} sub="within 45 days" icon="⏳" iconBg="#FFFBEB" color="#B45309" delay="1" />
        <KCard label="Expired" value={statCounts.expired} sub="need renewal" icon="⚠️" iconBg="#FEF2F2" color="#DC2626" delay="2" />
        {tab === 'units' ? <>
            <KCard label="Extended via AMC" value={unitWarranties.filter(w => w.extendedAMC).length} sub="AMC covered" icon="📋" iconBg="#EFF6FF" color="#0369A1" delay="3" />
            <KCard label="Brands Tracked" value={brands.length} sub="manufacturers" icon="🏭" iconBg="#FFF7ED" color={COLORS.brand} delay="4" />
          </> : <>
            <KCard label="Linked to Units" value={partWarranties.filter(w => w.linkedUnit).length} sub="traceable" icon="🔗" iconBg="#EFF6FF" color="#0369A1" delay="3" />
            <KCard label="Part Types" value={partTypeData.length} sub="tracked categories" icon="🧩" iconBg="#FFF7ED" color={COLORS.brand} delay="4" />
          </>}
      </div>

      {/* ── Expiry timeline + distribution ── */}
      <div className="ap-warranty-page-70">

        <div className="ap-warranty-page-71">
          <div className="ap-warranty-page-72">
            {tab === 'units' ? 'Warranty Expiry Timeline' : 'Part Warranty Expiry Timeline'}
          </div>
          {currentRecords.length === 0 && <div className="ap-warranty-page-73">
              {loadingData ? 'Loading…' : tab === 'units' ? 'No warranties yet.' : 'No parts tracked yet.'}
            </div>}
          {timeline.map(w => {
          const st = displayStatus(w);
          const meta = STATUS_META[st];
          return <div key={w.id} onClick={() => setSelectedWarranty(w)} className="ap-warranty-page-74">
                <div style={{
              background: meta.bg
            }} className="ap-warranty-page-75">
                  {st === 'expired' ? '⚠️' : st === 'soon' ? '⏳' : '✅'}
                </div>
                <div className="ap-warranty-page-76">
                  <div className="ap-warranty-page-77">
                    {w.customer}{tab === 'parts' ? ` — ${w.partType}` : ''}
                  </div>
                  <div className="ap-warranty-page-78">
                    {w.brand} · {tab === 'units' ? w.type : `linked to ${w.linkedUnitLabel || '—'}`}
                  </div>
                </div>
                <div className="ap-warranty-page-79">
                  <div style={{
                color: meta.text
              }} className="ap-warranty-page-80">{w.warrantyEnd}</div>
                  {st === 'expired' && <button className="btn ap-warranty-page-81" onClick={e => {
                e.stopPropagation();
                openRegisterModal(w.recordType);
              }}>
                      Renew
                    </button>}
                </div>
              </div>;
        })}
        </div>

        <div className="ap-warranty-page-82">
          <div className="ap-warranty-page-83">
            {tab === 'units' ? 'Brand Distribution' : 'Part Type Distribution'}
          </div>

          {tab === 'units' ? <>
              {brandData.map((b, i) => <div key={b.brand} className="ap-warranty-page-84">
                  <div className="ap-warranty-page-85">
                    <div className="ap-warranty-page-86">
                      <div style={{
                  background: BRAND_COLORS[i % BRAND_COLORS.length]
                }} className="ap-warranty-page-87" />
                      <span className="ap-warranty-page-88">{b.brand}</span>
                    </div>
                    <span>{b.active} active / {b.count} total</span>
                  </div>
                  <div className="ap-warranty-page-89">
                    {/* FIX: divide by total_units (min 1) not warranties.length to avoid NaN bars */}
                    <div style={{
                width: `${b.count / total_units * 100}%`,
                background: `${BRAND_COLORS[i % BRAND_COLORS.length]}40`
              }} className="ap-warranty-page-90" />
                    <div style={{
                width: `${b.active / total_units * 100}%`,
                background: BRAND_COLORS[i % BRAND_COLORS.length]
              }} className="ap-warranty-page-91" />
                  </div>
                </div>)}
              <div className="ap-warranty-page-92">
                <div className="ap-warranty-page-93">Type Breakdown</div>
                {['Comprehensive', 'Compressor', 'Parts & Labour', 'Parts Only'].map(type => {
              const count = unitWarranties.filter(w => w.type === type).length;
              if (!count) return null;
              return <div key={type} className="ap-warranty-page-94">
                      <span>{type}</span>
                      <span className="ap-warranty-page-95">{count} unit{count > 1 ? 's' : ''}</span>
                    </div>;
            })}
              </div>
            </> : <>
              {partTypeData.length === 0 && <div className="ap-warranty-page-96">
                  {loadingData ? 'Loading…' : 'No parts tracked yet.'}
                </div>}
              {partTypeData.map(({
            type,
            count,
            pct
          }) => <div key={type} className="ap-warranty-page-97">
                  <span className="ap-warranty-page-98">{type}</span>
                  <div className="ap-warranty-page-99">
                    <div style={{
                width: `${pct}%`,
                background: PART_TYPE_COLORS[type] || COLORS.brand
              }} className="ap-warranty-page-100" />
                  </div>
                  <span className="ap-warranty-page-101">{count}</span>
                </div>)}
            </>}
        </div>
      </div>

      {/* ── Full table ── */}
      <div className="ap-warranty-page-102">
        <div className="ap-warranty-page-103">
          <TableSearchBar value={q} onChange={setQ} placeholder={tab === 'units' ? 'Search customer, brand, model, serial…' : 'Search customer, part, brand, serial…'} />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={['active', 'soon', 'expired']} allLabel="All Statuses" labelMap={{
          active: 'Active',
          soon: 'Expiring soon',
          expired: 'Expired'
        }} />
          <FilterSelect value={activeFilters.brand} onChange={val => setFilter('brand', val)} options={brands} allLabel="All Brands" />
          <FilterSelect value={activeFilters.type} onChange={val => setFilter('type', val)} options={types} allLabel={tab === 'units' ? 'All Types' : 'All Part Types'} />
          <div className="ap-warranty-page-104"><ExportDropdown {...exportProps} /></div>
        </div>

        <div className="ap-warranty-page-105">
          <table className="ap-warranty-page-106">
            {tab === 'units' ? <Thead cols={['ID', 'Customer', 'Unit', 'Brand', 'Model', 'Serial No.', 'Install Date', 'Warranty End', 'Type', 'AMC', 'Status', '']} /> : <Thead cols={['Part ID', 'Customer', 'Linked Unit', 'Part Type', 'Brand', 'Model', 'Serial No.', 'Install Date', 'Warranty End', 'Warranty Type', 'Status', '']} />}
            <tbody>
              {paginated.length === 0 && <tr><td colSpan={12} className="ap-warranty-page-107">
                  {loadingData ? 'Loading…' : `No ${tab === 'units' ? 'units' : 'parts'} match your filters.`}
                </td></tr>}
              {paginated.map((w, i) => {
              const st = displayStatus(w);
              return (
                // FIX: key={w.id} is always defined — normalize* guarantees it
                <tr key={w.id} className="row ap-warranty-page-108" onClick={() => setSelectedWarranty(w)} style={{
                  background: st === 'expired' ? '#FFFBF7' : i % 2 === 0 ? COLORS.white : '#FAFAFA'
                }}>
                    <td className="ap-warranty-page-109"><span className="ap-warranty-page-110">{w.id}</span></td>
                    <td className="ap-warranty-page-111">{w.customer}</td>
                    {tab === 'units' ? <>
                        <td className="ap-warranty-page-112">{w.unit}</td>
                        <td className="ap-warranty-page-113">{w.brand}</td>
                      </> : <>
                        <td className="ap-warranty-page-114">
                          <span className="ap-warranty-page-115">{w.linkedUnitLabel || '—'}</span>
                        </td>
                        <td className="ap-warranty-page-116">
                          <span style={{
                        background: `${PART_TYPE_COLORS[w.partType] || COLORS.brand}18`,
                        color: PART_TYPE_COLORS[w.partType] || COLORS.brand
                      }} className="ap-warranty-page-117">{w.partType || '—'}</span>
                        </td>
                      </>}
                    {tab === 'parts' && <td className="ap-warranty-page-118">{w.brand}</td>}
                    <td className="ap-warranty-page-119">{w.model}</td>
                    <td className="ap-warranty-page-120"><span className="ap-warranty-page-121">{w.serial}</span></td>
                    <td className="ap-warranty-page-122">{w.installDate}</td>
                    <td className="ap-warranty-page-123"><span style={{
                      color: STATUS_META[st].text
                    }} className="ap-warranty-page-124">{w.warrantyEnd}</span></td>
                    {tab === 'units' ? <>
                        <td className="ap-warranty-page-125"><span className="ap-warranty-page-126">{w.type}</span></td>
                        <td className="ap-warranty-page-127">{w.extendedAMC ? <span className="ap-warranty-page-128">✅</span> : <span className="ap-warranty-page-129">—</span>}</td>
                      </> : <td className="ap-warranty-page-130">{w.type}</td>}
                    <td className="ap-warranty-page-131"><StatusPill status={st} /></td>
                    <td onClick={e => e.stopPropagation()} className="ap-warranty-page-132">
                      {st === 'expired' ? <button className="btn ap-warranty-page-133" onClick={() => openRegisterModal(w.recordType)}>Renew</button> : <button className="btn ap-warranty-page-134" onClick={() => setSelectedWarranty(w)}>View →</button>}
                    </td>
                  </tr>
              );
            })}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}
      </div>
    </div>;
};
export default WarrantyPage;