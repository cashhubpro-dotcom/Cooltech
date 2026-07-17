import { assetsApi } from '../../services/api';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { COLORS, FONTS } from '../../constants/tokens';
import { TypeTag } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import Modal from '../../components/ui/Modal';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';

// ─── date helper ───────────────────────────────────────────────────────────────
const fmtDate = d => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

// ─── Column config for equipment export ──────────────────────────────────────
const EQUIPMENT_COLUMNS = [{
  label: "Name",
  key: "name",
  width: 22,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: "Type",
  key: "subType",
  width: 14,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Assigned To",
  key: "techName",
  width: 16,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Year",
  key: "year",
  width: 8,
  tdStyle: {
    fontFamily: "monospace",
    fontSize: 11
  }
}, {
  label: "Value (₹)",
  key: "value",
  width: 12,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 700
  }
}, {
  label: "Last Service",
  key: "lastServiceDate",
  width: 14,
  format: fmtDate,
  tdStyle: {
    fontSize: 11
  }
}, {
  label: "Next Service",
  key: "nextServiceDate",
  width: 14,
  format: fmtDate,
  tdStyle: {
    fontSize: 11
  }
}, {
  label: "Status",
  key: "status",
  width: 10,
  tdStyle: {
    fontSize: 12
  }
}];
const addBtnStyle = {
  padding: "6px 12px",
  borderRadius: 7,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
  background: "var(--brand-light)",
  border: "1px solid #EA580C30",
  color: "var(--brand)",
  fontFamily: FONTS.sans
};

// ─── RowMenu — kebab dropdown (View / Edit / Delete) ──────────────────────────
const RowMenu = ({
  items
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({
    top: 0,
    left: 0
  });
  const btnRef = useRef(null);
  const menuRef = useRef(null); // ← NEW: tracks the portal menu itself

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = e => {
      const insideBtn = btnRef.current && btnRef.current.contains(e.target);
      const insideMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!insideBtn && !insideMenu) setOpen(false); // ← only close on TRUE outside clicks
    };
    const closeOnScroll = () => setOpen(false);
    document.addEventListener('mousedown', closeOnOutside);
    window.addEventListener('scroll', closeOnScroll, true);
    window.addEventListener('resize', closeOnScroll);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      window.removeEventListener('scroll', closeOnScroll, true);
      window.removeEventListener('resize', closeOnScroll);
    };
  }, [open]);
  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({
        top: r.bottom + 6,
        left: Math.max(8, r.right - 160)
      });
    }
    setOpen(o => !o);
  };
  return <>
      <button ref={btnRef} onClick={toggle} title="Actions" className="ap-assets-page-1">
        ⋮
      </button>
      {open && createPortal(<div ref={menuRef} // ← NEW
    style={{
      top: pos.top,
      left: pos.left
    }} className="ap-assets-page-2">
          {items.map((it, i) => <button key={i} onClick={() => {
        setOpen(false);
        it.onClick();
      }} style={{
        color: it.danger ? "var(--danger-text)" : "var(--text-h2)",
        borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none"
      }} onMouseEnter={e => {
        e.currentTarget.style.background = it.danger ? '#FEF2F2' : '#F8FAFC';
      }} onMouseLeave={e => {
        e.currentTarget.style.background = 'none';
      }} className="ap-assets-page-3">
              {it.icon} {it.label}
            </button>)}
        </div>, document.body)}
    </>;
};

// ─── ViewAssetModal — read-only detail view ───────────────────────────────────
const DetailRow = ({
  label,
  value
}) => <div className="ap-assets-page-4">
    <div className="ap-assets-page-5">{label}</div>
    <div className="ap-assets-page-6">{value ?? '—'}</div>
  </div>;
const ViewAssetModal = ({
  asset,
  onClose
}) => {
  if (!asset) return null;
  const isVehicle = asset.assetType === 'Vehicle';
  return <Modal open={!!asset} onClose={onClose} title={`${isVehicle ? '🚗' : '🔧'} ${asset.name}`} width={560}>
      <div className="ap-assets-page-7">
        <span style={{
        background: isVehicle ? "var(--info-bg)" : "var(--brand-light)",
        color: isVehicle ? "var(--info-text)" : "var(--brand)"
      }} className="ap-assets-page-8">
          {asset.assetType}
        </span>
        <span style={{
        background: asset.status === 'active' ? "var(--success-bg)" : "var(--danger-bg)",
        color: asset.status === 'active' ? "var(--success-text)" : "var(--danger-text)"
      }} className="ap-assets-page-9">
          ● {asset.status}
        </span>
      </div>
      <div className="ap-assets-page-10">
        <DetailRow label="Asset ID" value={asset.assetId} />
        <DetailRow label="Sub-Type" value={asset.subType} />
        {isVehicle ? <>
            <DetailRow label="Reg. Number" value={asset.regNo} />
            <DetailRow label="Fuel Type" value={asset.fuel} />
            <DetailRow label="Current KM" value={asset.km ? `${asset.km.toLocaleString()} km` : '—'} />
            <DetailRow label="Insurance Expiry" value={fmtDate(asset.insuranceExpiry)} />
          </> : <>
            <DetailRow label="Serial No." value={asset.serial} />
            <DetailRow label="Warranty Expiry" value={fmtDate(asset.warrantyExpiry)} />
          </>}
        <DetailRow label="Year" value={asset.year} />
        <DetailRow label="Value" value={`₹${(asset.value || 0).toLocaleString()}`} />
        <DetailRow label="Purchase Date" value={fmtDate(asset.purchaseDate)} />
        <DetailRow label="Assigned To" value={asset.techName || 'Office'} />
        <DetailRow label="Last Service" value={fmtDate(asset.lastServiceDate)} />
        <DetailRow label="Next Service" value={fmtDate(asset.nextServiceDate)} />
      </div>
      {asset.notes && <div className="ap-assets-page-11">
          <div className="ap-assets-page-12">Notes</div>
          <div className="ap-assets-page-13">{asset.notes}</div>
        </div>}
      <div className="ap-assets-page-14">
        <button onClick={onClose} className="ap-assets-page-15">
          Close
        </button>
      </div>
    </Modal>;
};

// ─── ConfirmDeleteModal ────────────────────────────────────────────────────────
const ConfirmDeleteModal = ({
  asset,
  onCancel,
  onConfirm,
  deleting
}) => {
  if (!asset) return null;
  return <Modal open={!!asset} onClose={onCancel} title="🗑️ Delete Asset" width={420}>
      <div className="ap-assets-page-16">
        <div className="ap-assets-page-17">
          Are you sure you want to delete <strong>{asset.name}</strong>{asset.assetId ? ` (${asset.assetId})` : ''}?
          It will be moved to <strong>Recently Deleted</strong>, where it can be restored later.
        </div>
      </div>
      <div className="ap-assets-page-18">
        <button onClick={onCancel} className="ap-assets-page-19">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={deleting} style={{
        background: deleting ? "var(--danger-border)" : "var(--danger-text)",
        cursor: deleting ? "default" : "pointer"
      }} className="ap-assets-page-20">
          {deleting ? 'Deleting…' : '🗑️ Delete Asset'}
        </button>
      </div>
    </Modal>;
};

// ─── AssetsPage ───────────────────────────────────────────────────────────────
const AssetsPage = ({
  openModal
}) => {
  const [assets, setAssets] = useState([]);
  const [viewAsset, setViewAsset] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const loadAssets = () => {
    assetsApi.list({
      limit: 200
    }).then(r => setAssets(r.data ?? [])).catch(() => {});
  };
  useEffect(() => {
    loadAssets();
    window.addEventListener('focus', loadAssets);
    return () => window.removeEventListener('focus', loadAssets);
  }, []);
  const handleEdit = asset => openModal("new_asset", {
    asset
  });
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await assetsApi.remove(deleteTarget._id);
      setDeleteTarget(null);
      loadAssets();
    } catch (e) {
      alert(e.message || 'Failed to delete asset.');
    } finally {
      setDeleting(false);
    }
  };
  const vehicles = assets.filter(a => a.assetType === "Vehicle");
  const equipment = assets.filter(a => a.assetType === "Equipment");
  const totalValue = assets.reduce((s, a) => s + (a.value || 0), 0);

  // ── Equipment search + filter + export ────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: filteredEquipment
  } = useTableSearch(equipment, ['name', 'subType', 'techName', 'status', 'serial'], {
    subType: '',
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
  } = usePagination(filteredEquipment, 10);
  const {
    exportProps
  } = useExport({
    title: "Equipment",
    filename: "cooltech-equipment",
    template: "generic_list",
    subtitle: `Assets & Vehicles · Equipment · ${filteredEquipment.length} records`,
    docId: "EQ-EXPORT",
    columns: EQUIPMENT_COLUMNS,
    rows: filteredEquipment,
    showTotals: true,
    totalColumns: ["value"]
  });
  const subTypes = [...new Set(equipment.map(e => e.subType).filter(Boolean))];
  return <div className="fi ap-assets-page-21">

      <SectionHdr title="Assets & Vehicles" sub={`${assets.length} assets · ₹${(totalValue / 100000).toFixed(2)}L book value`} action="+ Add Asset" onAction={() => openModal("new_asset", {
      defaultTab: 'Vehicle'
    })} />

      {/* KPI cards */}
      <div className="ap-assets-page-22">
        <KCard label="Vehicles" value={vehicles.length} sub="company fleet" icon="🚗" iconBg="#EFF6FF" color="#0369A1" delay="" />
        <KCard label="Equipment" value={equipment.length} sub="tools & machines" icon="🔧" iconBg="#FFF7ED" color="#EA580C" delay="1" />
        <KCard label="In Maintenance" value={assets.filter(a => a.status === "maintenance").length} sub="being serviced" icon="⚙" iconBg="#FEF2F2" color="#DC2626" delay="2" />
        <KCard label="Total Value" value={`₹${(totalValue / 100000).toFixed(2)}L`} sub="book value" icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="3" />
      </div>

      {/* ── Vehicles section ── */}
      {/* ── Vehicles section ── */}
      <div className="ap-assets-page-23">
        <div className="ap-assets-page-24">
          Vehicles
          <span className="ap-assets-page-25">
            {vehicles.length} of {vehicles.length}
          </span>
        </div>
        {/* <button style={addBtnStyle} onClick={() => openModal("new_asset", { defaultTab: 'Vehicle' })}>+ Add Vehicle</button> */}
      </div>
      <div className="ap-assets-page-26">
        {vehicles.map(v => <div key={v._id} className="card ap-assets-page-27">
            <div className="ap-assets-page-28">
              <div className="ap-assets-page-29">{v.subType?.includes("Bike") ? "🏍️" : "🚐"}</div>
              <div className="ap-assets-page-30">
                <span style={{
              background: v.status === "active" ? "var(--success-bg)" : "var(--danger-bg)",
              color: v.status === "active" ? "var(--success-text)" : "var(--danger-text)"
            }} className="ap-assets-page-31">● {v.status}</span>
                <RowMenu items={[{
              label: 'View Details',
              icon: '👁️',
              onClick: () => setViewAsset(v)
            }, {
              label: 'Edit',
              icon: '✏️',
              onClick: () => handleEdit(v)
            }, {
              label: 'Delete',
              icon: '🗑️',
              danger: true,
              onClick: () => setDeleteTarget(v)
            }]} />
              </div>
            </div>
            <div className="ap-assets-page-32">{v.name}</div>
            <div className="ap-assets-page-33">{v.regNo || '—'} · {v.year || '—'} · {v.fuel || 'N/A'}</div>
            <div className="ap-assets-page-34">
              {[["Assigned", v.techName || 'Office'], ["KM", (v.km || 0).toLocaleString() + " km"], ["Value", "₹" + ((v.value || 0) / 1000).toFixed(0) + "K"], ["Insurance", fmtDate(v.insuranceExpiry)]].map(([k, val]) => <div key={k} className="ap-assets-page-35">
                  <div className="ap-assets-page-36">{k}</div>
                  <div className="ap-assets-page-37">{val}</div>
                </div>)}
            </div>
            <div className="ap-assets-page-38">
              <div className="ap-assets-page-39">Next Service</div>
              <div className="ap-assets-page-40">{fmtDate(v.nextServiceDate)}</div>
              <div className="ap-assets-page-41">
                <div className="ap-assets-page-42" />
              </div>
            </div>
            <div className="ap-assets-page-43">
              <button className="btn ap-assets-page-44" onClick={() => openModal("log_fuel", {
            name: v.name
          })}>Log Fuel</button>
              <button className="btn ap-assets-page-45" onClick={() => openModal("report", {
            title: `Service Log – ${v.name}`,
            format: "Update"
          })}>Service</button>
            </div>
          </div>)}
        {vehicles.length === 0 && <div className="ap-assets-page-46">
            No vehicles yet. Click "+ Add Vehicle" to register one.
          </div>}
      </div>

      {/* ── Equipment section ── */}
      <div className="ap-assets-page-47">
        <div className="ap-assets-page-48">
          Equipment
          <span className="ap-assets-page-49">
            {total} of {equipment.length}
          </span>
        </div>
        {/* <button style={addBtnStyle} onClick={() => openModal("new_asset", { defaultTab: 'Equipment' })}>+ Add Equipment</button> */}
      </div>

      {/* Equipment table */}
      <div className="ap-assets-page-50">

        <div className="ap-assets-page-51">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, type, assigned to…" />
          <FilterSelect value={activeFilters.subType} onChange={val => setFilter("subType", val)} options={subTypes} allLabel="All Types" />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter("status", val)} options={["active", "maintenance", "inactive", "retired"]} allLabel="All Statuses" />
          <div className="ap-assets-page-52">
              <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div className="ap-assets-page-53">
          <table className="ap-assets-page-54">
            <Thead cols={["Equipment", "Type", "Assigned To", "Year", "Value", "Last Service", "Next Service", "Status", ""]} />
            <tbody>
              {paginated.map((e, i) => <tr key={e._id} className="row ap-assets-page-55" style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                  <td className="ap-assets-page-56">{e.name}</td>
                  <td className="ap-assets-page-57"><TypeTag type={e.subType} /></td>
                  <td className="ap-assets-page-58">{e.techName || 'Office'}</td>
                  <td className="ap-assets-page-59">{e.year || '—'}</td>
                  <td className="ap-assets-page-60">
                    <span className="ap-assets-page-61">₹{(e.value || 0).toLocaleString()}</span>
                  </td>
                  <td className="ap-assets-page-62">{fmtDate(e.lastServiceDate)}</td>
                  <td className="ap-assets-page-63">{fmtDate(e.nextServiceDate)}</td>
                  <td className="ap-assets-page-64">
                    <span style={{
                  background: e.status === "active" ? "var(--success-bg)" : "var(--warning-bg)",
                  color: e.status === "active" ? "var(--success-text)" : "var(--warning-text)"
                }} className="ap-assets-page-65">
                      ● {e.status}
                    </span>
                  </td>
                  <td className="ap-assets-page-66">
                    <div className="ap-assets-page-67">
                      <button onClick={() => openModal("log_fuel", {
                    name: e.name
                  })} className="ap-assets-page-68">
                        Log
                      </button>
                      <RowMenu items={[{
                    label: 'View Details',
                    icon: '👁️',
                    onClick: () => setViewAsset(e)
                  }, {
                    label: 'Edit',
                    icon: '✏️',
                    onClick: () => handleEdit(e)
                  }, {
                    label: 'Delete',
                    icon: '🗑️',
                    danger: true,
                    onClick: () => setDeleteTarget(e)
                  }]} />
                    </div>
                  </td>
                </tr>)}
              {paginated.length === 0 && <tr>
                  <td colSpan={9} className="ap-assets-page-69">
                    No equipment matches your search.
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      <ViewAssetModal asset={viewAsset} onClose={() => setViewAsset(null)} />
      <ConfirmDeleteModal asset={deleteTarget} deleting={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />

    </div>;
};
export default AssetsPage;