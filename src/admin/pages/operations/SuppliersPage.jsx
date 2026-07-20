import { useState, useEffect, useCallback } from 'react';
import { inventoryApi, purchaseApi, suppliersApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, Avatar } from '../../components/ui/Badges';
import { KCard, Thead } from '../../components/ui/Cards';
import ActionDropdown from '../../components/ui/ActionDropdown';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import EditableDetailView from '../../components/ui/EditableDetailView';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { PO_STATUS } from '../../data/mockData';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Column config for export ─────────────────────────────────────────────────
const SUPPLIER_COLUMNS = [{
  label: 'Supplier',
  key: 'name',
  width: 22,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Contact',
  key: 'contact',
  width: 18
}, {
  label: 'Category',
  key: 'category',
  width: 14
}, {
  label: 'Phone',
  key: 'phone',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Payment Terms',
  key: 'paymentTerms',
  width: 16
}, {
  label: 'Orders',
  key: 'totalOrders',
  width: 8,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Total Spend',
  key: 'totalValue',
  width: 14,
  format: v => `₹${(v ?? 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700
  }
}, {
  label: 'Last Order',
  key: 'lastOrder',
  width: 12
}, {
  label: 'Rating',
  key: 'rating',
  width: 8,
  format: v => `${v ?? 0}★`
}, {
  label: 'Status',
  key: 'status',
  width: 10,
  format: v => v ? v.charAt(0).toUpperCase() + v.slice(1) : ''
}];

// ─── SupplierDetail ───────────────────────────────────────────────────────────
const SupplierDetail = ({
  sup,
  onBack,
  onSave,
  onDelete,
  purchaseOrders,
  inventory
}) => {
  const fields = [{
    key: 'name'
  }, {
    key: 'contact'
  }, {
    key: 'phone'
  }, {
    key: 'email'
  }, {
    key: 'address'
  }, {
    key: 'category'
  }, {
    key: 'paymentTerms'
  }, {
    key: 'status'
  }, {
    key: 'rating'
  }];
  const supplierPOs = purchaseOrders.filter(p => p.supplier === sup.name);
  const supplierItems = inventory.filter(i => i.supplier === sup.name);
  return <EditableDetailView id={sup.supplierId || sup.id} breadcrumb="Suppliers" onBack={onBack} fields={fields} data={sup} onSave={onSave} onDelete={() => onDelete(sup.id)}>
      {({
      editMode,
      editData,
      setEditData
    }) => {
      const val = key => editData[key] ?? sup[key] ?? '';
      const setK = key => e => setEditData(p => ({
        ...p,
        [key]: e.target.value
      }));
      return <div className="sup-detail-grid">

            {/* ── Left: sidebar ── */}
            <div className="sup-sidebar">
              <div className="sup-profile-card">
                <Avatar name={val('name')} size={54} color="#0369A1" />
                <div className="sup-profile-name">
                  {editMode ? <input className="form-input sup-profile-input" value={val('name')} onChange={setK('name')} /> : sup.name}
                </div>
                <div className="sup-profile-cat">
                  {editMode ? <input className="form-input sup-cat-input" value={val('category')} onChange={setK('category')} placeholder="Category" /> : `${sup.category ?? ''} Supplier`}
                </div>
                <div className="sup-profile-badges">
                  {editMode ? <select className="form-select sup-status-select" value={val('status')} onChange={setK('status')}>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select> : <span className={`sup-status-badge${sup.status === 'active' ? ' sup-status-badge--active' : ''}`}>● {sup.status}</span>}
                  {editMode ? <input className="form-input sup-rating-input" value={val('rating')} onChange={setK('rating')} placeholder="Rating" /> : <span className="sup-rating-badge">{sup.rating ?? 0}★</span>}
                </div>
              </div>

              <div className="sup-info-card">
                {[['Contact', 'contact', sup.contact], ['Phone', 'phone', sup.phone], ['Email', 'email', sup.email], ['Address', 'address', sup.address], ['Payment', 'paymentTerms', sup.paymentTerms]].map(([label, key, readVal]) => <div key={key} className="sup-info-row">
                    <span className="sup-info-key">{label}</span>
                    {editMode ? <input className="form-input sup-info-input" value={val(key)} onChange={setK(key)} /> : <span className="sup-info-val">{readVal ?? '—'}</span>}
                  </div>)}
                <div className="sup-info-row">
                  <span className="sup-info-key">Orders</span>
                  <span className="sup-info-val">{sup.totalOrders ?? 0}</span>
                </div>
                <div className="sup-info-row">
                  <span className="sup-info-key">Total Spend</span>
                  <span className="sup-info-val">₹{(sup.totalValue ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ── Right main ── */}
            <div className="sup-main-card">
              <div className="sup-section">
                <div className="sup-section-title">Purchase History</div>
                {supplierPOs.length === 0 ? <div className="sup-empty">No orders found</div> : supplierPOs.map(po => <div key={po.id ?? po._id} className="sup-po-row">
                        <span className="td-brand">{po.poId ?? po.id}</span>
                        <div className="sup-po-meta">{po.items?.length ?? 0} items · {po.orderedAt ?fmtDateDMY(new Date(po.orderedAt)) : po.orderDate ?? '—'}</div>
                        <SBadge s={po.status} map={PO_STATUS} />
                        <span className="td-amount">₹{(po.total ?? 0).toLocaleString()}</span>
                      </div>)}
              </div>

              <div className="sup-section">
                <div className="sup-section-title">Items Supplied</div>
                {supplierItems.length === 0 ? <div className="sup-empty">No items found</div> : supplierItems.map(item => <div key={item.id ?? item._id} className="sup-item-row">
                        <TypeTag type={item.category} />
                        <div className="sup-item-name">{item.name}</div>
                        <span className="td-mono sup-item-cost">₹{item.cost ?? 0}</span>
                        <span className={`sup-item-stock${(item.qty ?? 0) <= (item.reorder ?? 0) ? ' sup-item-stock--low' : ''}`}>
                          {item.qty ?? 0} stock
                        </span>
                      </div>)}
              </div>
            </div>

          </div>;
    }}
    </EditableDetailView>;
};

// ─── SuppliersPage ────────────────────────────────────────────────────────────
const SuppliersPage = ({
  openModal
}) => {
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const loadSuppliers = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    return Promise.all([suppliersApi.list({
      limit: 200
    }), suppliersApi.stats(), purchaseApi?.list ? purchaseApi.list({
      limit: 500
    }) : Promise.resolve({
      data: []
    }), inventoryApi?.list ? inventoryApi.list({
      limit: 500
    }) : Promise.resolve({
      data: []
    })]).then(([supRes, statsRes, poRes, invRes]) => {
      setSuppliers(supRes.data ?? []);
      setKpis(statsRes ?? null);
      setPurchaseOrders(poRes.data ?? []);
      setInventory(invRes.data ?? []);
    }).catch(err => {
      console.error('[Suppliers] load failed:', err);
      setLoadError('Could not load suppliers from the server.');
      setSuppliers([]);
      setKpis(null);
    }).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    loadSuppliers();
    window.addEventListener('focus', loadSuppliers);
    return () => window.removeEventListener('focus', loadSuppliers);
  }, [loadSuppliers]);
  const [open, setOpen] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fallback KPI figures computed from the loaded list, used only if /stats/summary
  // itself fails — keeps the cards populated instead of showing nothing.
  const fallbackTotalSpend = suppliers.reduce((s, x) => s + (x.totalValue ?? 0), 0);
  const fallbackTotalOrders = suppliers.reduce((s, x) => s + (x.totalOrders ?? 0), 0);
  const fallbackAvgRating = suppliers.length ? suppliers.reduce((s, x) => s + (x.rating ?? 0), 0) / suppliers.length : 0;
  const fallbackActive = suppliers.filter(s => s.status === 'active').length;

  // ── ALL hooks before any conditional return ───────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchFiltered
  } = useTableSearch(suppliers, ['name', 'contact', 'category', 'phone'], {
    status: '',
    category: ''
  });
  const categories = [...new Set(suppliers.map(s => s.category).filter(Boolean))];
  const filtered = searchFiltered.filter(r => !activeFilters.status || r.status === activeFilters.status).filter(r => !activeFilters.category || r.category === activeFilters.category);
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
    title: "Suppliers",
    filename: "cooltech-suppliers",
    template: "generic_list",
    subtitle: "AC Services Platform · Vendor Register",
    docId: "suppliers-EXPORT",
    columns: SUPPLIER_COLUMNS,
    rows: filtered,
    showTotals: true,
    totalColumns: ['totalOrders', 'totalValue']
  });

  // ── Backend-backed mutations ───────────────────────────────────────────────
  const handleSave = async updated => {
    const id = updated.id ?? updated._id;
    try {
      await suppliersApi.update(id, {
        name: updated.name,
        contact: updated.contact,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        category: updated.category,
        paymentTerms: updated.paymentTerms,
        status: updated.status,
        rating: Number(updated.rating) || 0
      });
      // Stats (e.g. Active count) may have changed — refetch everything for consistency
      loadSuppliers();
      setOpen(null);
    } catch (err) {
      console.error('[Suppliers] update failed:', err);
    }
  };
  const handleDelete = async id => {
    try {
      await suppliersApi.remove(id);
      setSuppliers(prev => prev.filter(s => (s.id ?? s._id) !== id));
      setOpen(null);
      loadSuppliers(); // refresh KPIs (Active count, etc.)
    } catch (err) {
      console.error('[Suppliers] delete failed:', err);
    }
  };
  const handleCreate = async formData => {
    const payload = {
      name: formData.name?.trim(),
      category: formData.category,
      contact: formData.contact?.trim(),
      phone: formData.phone?.trim(),
      email: formData.email?.trim().toLowerCase(),
      paymentTerms: formData.paymentTerms,
      address: formData.address?.trim()
    };
    if (!payload.name) return;
    try {
      await suppliersApi.create(payload);
      loadSuppliers();
    } catch (err) {
      console.error('[Suppliers] create failed:', err);
    }
  };
  const handleBack = () => setOpen(null);

  // ── Conditional render AFTER all hooks ────────────────────────────────────
  const sup = open ? suppliers.find(s => (s.id ?? s._id) === open) : null;
  if (sup) {
    return <SupplierDetail sup={sup} onBack={handleBack} onSave={handleSave} onDelete={handleDelete} purchaseOrders={purchaseOrders} inventory={inventory} />;
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return <div className="page-body">

      {/* Header */}
      <div className="sup-list-hdr">
        <div>
          <div className="section-title">Suppliers</div>
          <div className="section-sub">{suppliers.length} vendors</div>
        </div>
        <div className="ap-suppliers-page-1">
          <button className="btn btn-primary" onClick={() => openModal('new_supplier', {
          onSubmit: handleCreate
        })}>+ Add Supplier</button>
        </div>
      </div>

      {loadError && <div className="ap-suppliers-page-2">
          {loadError}
        </div>}

      {/* KPI Cards — sourced from /suppliers/stats/summary, falls back to local calc */}
      <div className="kpi-grid-4">
        <KCard label="Active" value={kpis?.active ?? fallbackActive} icon="🏭" iconBg="#EFF6FF" color="#0369A1" delay="" />
        <KCard label="Total Spend" value={`₹${((kpis?.totalSpend ?? fallbackTotalSpend) / 100000).toFixed(1)}L`} icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="1" />
        <KCard label="Total Orders" value={kpis?.totalOrders ?? fallbackTotalOrders} icon="📦" iconBg="#F0FDF4" color="#16A34A" delay="2" />
        <KCard label="Avg Rating" value={`${(kpis?.avgRating ?? fallbackAvgRating).toFixed(1)}★`} icon="⭐" iconBg="#FEFCE8" color="#CA8A04" delay="3" />
      </div>

      {/* Table card */}
      <div className="card">

        {/* Toolbar */}
        <div className="ap-suppliers-page-3">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, contact, category…" />

          <FilterSelect value={activeFilters.status} onChange={val => setFilter("status", val)} options={["active", "inactive"]} allLabel="All Statuses" labelMap={{
          active: "Active",
          inactive: "Inactive"
        }} />

          <FilterSelect value={activeFilters.category} onChange={val => setFilter("category", val)} options={categories} allLabel="All Categories" />

          <div className="ap-suppliers-page-4">
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <Thead cols={['Supplier', 'Contact', 'Category', 'Phone', 'Payment Terms', 'Orders', 'Spend', 'Last Order', 'Rating', 'Status', '']} />
            <tbody>
              {loading && <tr>
                  <td colSpan={11} className="ap-suppliers-page-5">
                    Loading suppliers…
                  </td>
                </tr>}
              {!loading && paginated.length === 0 && <tr>
                  <td colSpan={11} className="ap-suppliers-page-6">
                    No suppliers match your filters.
                  </td>
                </tr>}
              {!loading && paginated.map((s, i) => {
              const id = s.id ?? s._id;
              return <tr key={id} className={`${i % 2 !== 0 ? 'row-alt' : ''} ap-suppliers-page-7`} onClick={() => setOpen(id)}>
                    <td>
                      <div className="sup-name-cell">
                        <Avatar name={s.name} size={30} color="#0369A1" />
                        <span className="td-bold">{s.name}</span>
                      </div>
                    </td>
                    <td>{s.contact ?? '—'}</td>
                    <td><TypeTag type={s.category ?? ''} /></td>
                    <td><span className="td-mono">{s.phone ?? '—'}</span></td>
                    <td>{s.paymentTerms ?? '—'}</td>
                    <td><span className="td-mono sup-orders-val">{s.totalOrders ?? 0}</span></td>
                    <td><span className="td-amount">₹{(s.totalValue ?? 0).toLocaleString()}</span></td>
                    <td>{s.lastOrder ?fmtDateDMY(new Date(s.lastOrder)) : '—'}</td>
                    <td><span className="sup-rating-val">{s.rating ?? 0}★</span></td>
                    <td>
                      <span className={`sup-status-badge${s.status === 'active' ? ' sup-status-badge--active' : ''}`}>
                        ● {s.status ?? '—'}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <ActionDropdown onView={() => setOpen(id)} onEdit={() => setOpen(id)} onDelete={() => setDeleteTarget(id)} />
                    </td>
                  </tr>;
            })}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}
      </div>

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => {
      handleDelete(deleteTarget);
      setDeleteTarget(null);
    }} onCancel={() => setDeleteTarget(null)} message="This supplier will be permanently removed." />
    </div>;
};
export default SuppliersPage;