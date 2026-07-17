import { useState, useEffect } from 'react';
import { suppliersApi, purchaseApi } from '../../services/api';
import { PO_STATUS } from '../../constants/statusMaps';
import { COLORS } from '../../constants/tokens';
import { SBadge } from '../../components/ui/Badges';
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
import { PAY_STATUS } from '../../data/mockData';

// ─── Mock SO data (used to seed CustomerSOList while API isn't ready) ─────────
// FIX #3: was `const [] = [...]` which silently discarded all data
const MOCK_SO_ORDERS = [{
  id: 'SO-0091',
  customer: 'Arjun Mehta',
  phone: '98765 43210',
  items: [{
    name: 'Split AC 1.5T',
    qty: 1,
    rate: 42000,
    total: 42000
  }, {
    name: 'Installation Kit',
    qty: 2,
    rate: 800,
    total: 1600
  }, {
    name: 'Copper Pipe 3m',
    qty: 3,
    rate: 600,
    total: 1800
  }],
  subtotal: 45400,
  gst: 8172,
  total: 53572,
  orderDate: 'Apr 15, 2026',
  deliveryDate: 'Apr 20, 2026',
  status: 'delivered',
  payStatus: 'paid',
  address: '12, Satellite Road, Ahmedabad',
  notes: 'Premium installation requested.'
}, {
  id: 'SO-0090',
  customer: 'Priya Sharma',
  phone: '91234 56789',
  items: [{
    name: 'Window AC 1T',
    qty: 1,
    rate: 18000,
    total: 18000
  }],
  subtotal: 18000,
  gst: 3240,
  total: 21240,
  orderDate: 'Apr 14, 2026',
  deliveryDate: 'Apr 18, 2026',
  status: 'shipped',
  payStatus: 'paid',
  address: '45, Navrangpura, Ahmedabad',
  notes: ''
}, {
  id: 'SO-0089',
  customer: 'Rohan Constructions',
  phone: '90000 11223',
  items: [{
    name: 'Cassette AC 2T',
    qty: 2,
    rate: 68000,
    total: 136000
  }, {
    name: 'Stabilizer',
    qty: 2,
    rate: 3500,
    total: 7000
  }, {
    name: 'AMC Package',
    qty: 1,
    rate: 12000,
    total: 12000
  }, {
    name: 'Installation',
    qty: 2,
    rate: 2500,
    total: 5000
  }],
  subtotal: 160000,
  gst: 28800,
  total: 188800,
  orderDate: 'Apr 12, 2026',
  deliveryDate: 'Apr 16, 2026',
  status: 'delivered',
  payStatus: 'paid',
  address: 'Plot 8, GIDC Estate, Vatva',
  notes: 'Bulk order — dedicated technician assigned.'
}, {
  id: 'SO-0088',
  customer: 'Sneha Patel',
  phone: '87654 32109',
  items: [{
    name: 'Inverter AC 1.5T',
    qty: 1,
    rate: 38000,
    total: 38000
  }, {
    name: 'Extended Warranty',
    qty: 1,
    rate: 4500,
    total: 4500
  }],
  subtotal: 42500,
  gst: 7650,
  total: 50150,
  orderDate: 'Apr 10, 2026',
  deliveryDate: 'Apr 14, 2026',
  status: 'processing',
  payStatus: 'pending',
  address: '7, Paldi Cross Road, Ahmedabad',
  notes: 'Preferred delivery after 6 PM.'
}, {
  id: 'SO-0087',
  customer: 'Vikram HVAC Works',
  phone: '99887 76655',
  items: [{
    name: 'Duct AC 3T',
    qty: 1,
    rate: 95000,
    total: 95000
  }, {
    name: 'Copper Pipe 5m',
    qty: 4,
    rate: 900,
    total: 3600
  }],
  subtotal: 98600,
  gst: 17748,
  total: 116348,
  orderDate: 'Apr 9, 2026',
  deliveryDate: 'Apr 13, 2026',
  status: 'processing',
  payStatus: 'pending',
  address: '22, Iscon Ambli Road, Bopal',
  notes: ''
}, {
  id: 'SO-0086',
  customer: 'Deepa Iyer',
  phone: '76543 21098',
  items: [{
    name: 'Portable AC 1T',
    qty: 1,
    rate: 22000,
    total: 22000
  }],
  subtotal: 22000,
  gst: 3960,
  total: 25960,
  orderDate: 'Apr 7, 2026',
  deliveryDate: 'Apr 11, 2026',
  status: 'delivered',
  payStatus: 'paid',
  address: '3, Vastrapur Lake Road, Ahmedabad',
  notes: ''
}];

// ─── Status maps ──────────────────────────────────────────────────────────────
export const SO_STATUS = {
  processing: {
    label: 'Processing',
    color: "var(--x185fa5)",
    bg: "var(--xe6f1fb)"
  },
  shipped: {
    label: 'Shipped',
    color: "var(--x534ab7)",
    bg: "var(--xeeedfe)"
  },
  delivered: {
    label: 'Delivered',
    color: "var(--x3b6d11)",
    bg: "var(--xeaf3de)"
  },
  cancelled: {
    label: 'Cancelled',
    color: "var(--xa32d2d)",
    bg: "var(--xfcebeb)"
  }
};

// ─── Column configs for export ────────────────────────────────────────────────
const PO_COLUMNS = [{
  label: 'PO ID',
  key: 'id',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Supplier',
  key: 'supplier',
  width: 22,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Items',
  key: 'itemCount',
  width: 8
}, {
  label: 'Subtotal',
  key: 'subtotal',
  width: 14,
  format: v => `₹${(v ?? 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'GST',
  key: 'gst',
  width: 12,
  format: v => `₹${(v ?? 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Total',
  key: 'total',
  width: 14,
  format: v => `₹${(v ?? 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 800
  }
}, {
  label: 'Order Date',
  key: 'orderDate',
  width: 12
}, {
  label: 'Expected',
  key: 'expectedDate',
  width: 12
}, {
  label: 'Status',
  key: 'status',
  width: 10,
  format: v => PO_STATUS[v]?.label ?? v
}, {
  label: 'Payment',
  key: 'payStatus',
  width: 10,
  format: v => PAY_STATUS[v]?.label ?? v
}];
const SO_COLUMNS = [{
  label: 'Order ID',
  key: 'id',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Customer',
  key: 'customer',
  width: 22,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Items',
  key: 'itemCount',
  width: 8
}, {
  label: 'Subtotal',
  key: 'subtotal',
  width: 14,
  format: v => `₹${(v ?? 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'GST',
  key: 'gst',
  width: 12,
  format: v => `₹${(v ?? 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Total',
  key: 'total',
  width: 14,
  format: v => `₹${(v ?? 0).toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 800
  }
}, {
  label: 'Order Date',
  key: 'orderDate',
  width: 12
}, {
  label: 'Delivery',
  key: 'deliveryDate',
  width: 12
}, {
  label: 'Status',
  key: 'status',
  width: 10,
  format: v => SO_STATUS[v]?.label ?? v
}, {
  label: 'Payment',
  key: 'payStatus',
  width: 10,
  format: v => PAY_STATUS[v]?.label ?? v
}];

// ─── Shared tab bar ───────────────────────────────────────────────────────────
const TAB_STYLES = {
  bar: {
    display: 'flex',
    borderBottom: `2px solid ${COLORS.border}`,
    marginBottom: '20px',
    gap: 0
  }
};
const TabBar = ({
  activeTab,
  onChange
}) => {
  const tabs = [{
    key: 'admin',
    label: 'Admin / Supplier View'
  }, {
    key: 'customer',
    label: 'Customer View'
  }];
  return <div className="ap-purchase-orders-page-1">
      {tabs.map(t => <button key={t.key} className={`${`tab-btn${activeTab === t.key ? ' tab-btn--active' : ''}`} ap-purchase-orders-page-2`} style={{
      borderBottom: activeTab === t.key ? "2.5px solid var(--brand)" : "2.5px solid transparent",
      color: activeTab === t.key ? "var(--brand)" : "var(--text-muted)"
    }} onClick={() => onChange(t.key)}>
          {t.label}
        </button>)}
    </div>;
};

// ─── PO Detail (Admin) ────────────────────────────────────────────────────────
const PODetail = ({
  po,
  suppliers,
  onBack,
  onSave,
  onDelete,
  openModal,
  initialEditMode
}) => {
  const fields = [{
    key: 'supplier'
  }, {
    key: 'orderDate'
  }, {
    key: 'expectedDate'
  }, {
    key: 'status'
  }, {
    key: 'payStatus'
  }, {
    key: 'notes'
  }];
  const FieldLabel = ({
    children
  }) => <div className="po-field-label">{children}</div>;
  const supplier = (suppliers ?? []).find(s => s.name === po.supplier);
  const sidebar = <div className="po-sidebar">
      <div className="po-sidebar-card">
        <div className="po-sidebar-title">Update Status</div>
        {['draft', 'ordered', 'received'].map(s => {
        const m = PO_STATUS[s];
        if (!m) return null;
        return <button key={s} className={`btn po-status-btn${po.status === s ? ' po-status-btn--active' : ''}`} style={po.status === s ? {
          background: m.bg,
          color: m.color,
          borderColor: m.color + '40'
        } : {}} onClick={() => openModal('report', {
          title: `Update to ${m.label}`,
          format: 'Update'
        })}>
              {po.status === s ? '● ' : '○ '}{m.label}
            </button>;
      })}
      </div>

      {supplier && <div className="po-sidebar-card">
          <div className="po-sidebar-title">Supplier</div>
          {[['Contact', supplier.contact], ['Phone', supplier.phone], ['Terms', supplier.paymentTerms]].map(([k, v]) => <div key={k} className="po-detail-row">
              <span className="po-detail-key">{k}</span>
              <span className="po-detail-val">{v}</span>
            </div>)}
        </div>}
    </div>;
  return <EditableDetailView id={po.id} breadcrumb="Purchase Orders" onBack={onBack} fields={fields} data={po} initialEditMode={initialEditMode} onSave={onSave} onDelete={() => onDelete(po.id)} sidebar={sidebar}>
      {({
      editMode,
      editData,
      setEditData
    }) => {
      const val = key => editData[key] ?? po[key] ?? '';
      const setK = key => e => setEditData(p => ({
        ...p,
        [key]: e.target.value
      }));
      return <div className="po-detail-grid">
            <div className={`po-main-card${editMode ? ' po-main-card--edit' : ''}`}>
              <div className="po-main-hdr">
                <div className="po-main-hdr-left">
                  <div className="po-badge-row">
                    <SBadge s={po.status} map={PO_STATUS} />
                    <SBadge s={po.payStatus} map={PAY_STATUS} />
                  </div>
                  {editMode ? <input className="form-input po-supplier-input" value={val('supplier')} onChange={setK('supplier')} /> : <div className="po-supplier-name">{po.supplier}</div>}
                  <div className="po-dates">
                    {editMode ? <div className="po-dates-edit">
                        <div className="form-row">
                          <FieldLabel>Order Date</FieldLabel>
                          <input className="form-input" value={val('orderDate')} onChange={setK('orderDate')} />
                        </div>
                        <div className="form-row">
                          <FieldLabel>Expected Date</FieldLabel>
                          <input className="form-input" value={val('expectedDate')} onChange={setK('expectedDate')} />
                        </div>
                      </div> : <span>Order: {po.orderDate} · Expected: {po.expectedDate}</span>}
                  </div>
                </div>
                <div className="po-main-hdr-right">
                  <div className="po-total-label">Order Total</div>
                  {/* FIX #1: guard .toLocaleString() with ?? 0 */}
                  <div className="po-total-value">₹{(po.total ?? 0).toLocaleString()}</div>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table po-items-table">
                  <thead>
                    <tr>
                      {['Item', 'Qty', 'Rate', 'Total'].map(h => <th key={h} className={h === 'Item' ? '' : 'po-th-center'}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(po.items ?? []).map((item, i) => <tr key={i}>
                        <td className="td-bold">{item.name}</td>
                        <td className="td-mono po-td-center">{item.qty}</td>
                        <td className="td-mono po-td-center">₹{(item.rate ?? 0).toLocaleString()}</td>
                        <td className="td-mono po-td-center td-bold">₹{(item.total ?? 0).toLocaleString()}</td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              <div className="po-totals-wrap">
                <div className="po-totals">
                  {[['Subtotal', po.subtotal], ['GST 18%', po.gst]].map(([k, v]) => <div key={k} className="po-totals-row">
                      <span className="po-totals-key">{k}</span>
                      {/* FIX #1: guard all monetary toLocaleString calls */}
                      <span className="po-totals-val td-mono">₹{(v ?? 0).toLocaleString()}</span>
                    </div>)}
                  <div className="po-totals-row po-totals-row--total">
                    <span>Total</span>
                    <span className="td-mono po-totals-grand">₹{(po.total ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {editMode ? <div className="form-row">
                  <FieldLabel>Notes</FieldLabel>
                  <textarea className="form-textarea" value={val('notes')} onChange={setK('notes')} rows={2} />
                </div> : po.notes && <div className="po-notes">📌 {po.notes}</div>}

              {!editMode && <div className="po-actions">
                  <button className="btn btn-primary po-action-main" onClick={() => openModal('report', {
              title: `Mark ${po.id} Received`,
              format: 'Update'
            })}>
                    📦 Mark Received
                  </button>
                  <button className="btn btn-success po-action-paid" onClick={() => openModal('report', {
              title: `Mark ${po.id} Paid`,
              format: 'Update'
            })}>
                    ✓ Mark Paid
                  </button>
                </div>}
            </div>

            {sidebar}
          </div>;
    }}
    </EditableDetailView>;
};

// ─── SO Detail (Customer) ─────────────────────────────────────────────────────
const SODetail = ({
  so,
  onBack,
  onSave,
  onDelete,
  openModal,
  initialEditMode
}) => {
  const fields = [{
    key: 'customer'
  }, {
    key: 'phone'
  }, {
    key: 'address'
  }, {
    key: 'orderDate'
  }, {
    key: 'deliveryDate'
  }, {
    key: 'status'
  }, {
    key: 'payStatus'
  }, {
    key: 'notes'
  }];
  const FieldLabel = ({
    children
  }) => <div className="po-field-label">{children}</div>;
  const sidebar = <div className="po-sidebar">
      <div className="po-sidebar-card">
        <div className="po-sidebar-title">Update Status</div>
        {['processing', 'shipped', 'delivered', 'cancelled'].map(s => {
        const m = SO_STATUS[s];
        return <button key={s} className={`btn po-status-btn${so.status === s ? ' po-status-btn--active' : ''}`} style={so.status === s ? {
          background: m.bg,
          color: m.color,
          borderColor: m.color + '40'
        } : {}} onClick={() => openModal('report', {
          title: `Update to ${m.label}`,
          format: 'Update'
        })}>
              {so.status === s ? '● ' : '○ '}{m.label}
            </button>;
      })}
      </div>

      <div className="po-sidebar-card">
        <div className="po-sidebar-title">Customer</div>
        {[['Phone', so.phone], ['Address', so.address]].map(([k, v]) => v ? <div key={k} className="po-detail-row">
              <span className="po-detail-key">{k}</span>
              <span className="po-detail-val">{v}</span>
            </div> : null)}
      </div>
    </div>;
  return <EditableDetailView id={so.id} breadcrumb="Customer Orders" onBack={onBack} fields={fields} data={so} initialEditMode={initialEditMode} onSave={onSave} onDelete={() => onDelete(so.id)} sidebar={sidebar}>
      {({
      editMode,
      editData,
      setEditData
    }) => {
      const val = key => editData[key] ?? so[key] ?? '';
      const setK = key => e => setEditData(p => ({
        ...p,
        [key]: e.target.value
      }));
      return <div className="po-detail-grid">
            <div className={`po-main-card${editMode ? ' po-main-card--edit' : ''}`}>
              <div className="po-main-hdr">
                <div className="po-main-hdr-left">
                  <div className="po-badge-row">
                    <SBadge s={so.status} map={SO_STATUS} />
                    <SBadge s={so.payStatus} map={PAY_STATUS} />
                  </div>
                  {editMode ? <input className="form-input po-supplier-input" value={val('customer')} onChange={setK('customer')} /> : <div className="po-supplier-name">{so.customer}</div>}
                  <div className="po-dates">
                    {editMode ? <div className="po-dates-edit">
                        <div className="form-row">
                          <FieldLabel>Order Date</FieldLabel>
                          <input className="form-input" value={val('orderDate')} onChange={setK('orderDate')} />
                        </div>
                        <div className="form-row">
                          <FieldLabel>Delivery Date</FieldLabel>
                          <input className="form-input" value={val('deliveryDate')} onChange={setK('deliveryDate')} />
                        </div>
                      </div> : <span>Order: {so.orderDate} · Delivery: {so.deliveryDate}</span>}
                  </div>
                </div>
                <div className="po-main-hdr-right">
                  <div className="po-total-label">Order Total</div>
                  {/* FIX #1: guard .toLocaleString() */}
                  <div className="po-total-value">₹{(so.total ?? 0).toLocaleString()}</div>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table po-items-table">
                  <thead>
                    <tr>
                      {['Item', 'Qty', 'Rate', 'Total'].map(h => <th key={h} className={h === 'Item' ? '' : 'po-th-center'}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(so.items ?? []).map((item, i) => <tr key={i}>
                        <td className="td-bold">{item.name}</td>
                        <td className="td-mono po-td-center">{item.qty}</td>
                        <td className="td-mono po-td-center">₹{(item.rate ?? 0).toLocaleString()}</td>
                        <td className="td-mono po-td-center td-bold">₹{(item.total ?? 0).toLocaleString()}</td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              <div className="po-totals-wrap">
                <div className="po-totals">
                  {[['Subtotal', so.subtotal], ['GST 18%', so.gst]].map(([k, v]) => <div key={k} className="po-totals-row">
                      <span className="po-totals-key">{k}</span>
                      {/* FIX #1: guard monetary values */}
                      <span className="po-totals-val td-mono">₹{(v ?? 0).toLocaleString()}</span>
                    </div>)}
                  <div className="po-totals-row po-totals-row--total">
                    <span>Total</span>
                    <span className="td-mono po-totals-grand">₹{(so.total ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {editMode ? <div className="form-row">
                  <FieldLabel>Notes</FieldLabel>
                  <textarea className="form-textarea" value={val('notes')} onChange={setK('notes')} rows={2} />
                </div> : so.notes && <div className="po-notes">📌 {so.notes}</div>}

              {!editMode && <div className="po-actions">
                  <button className="btn btn-primary po-action-main" onClick={() => openModal('report', {
              title: `Mark ${so.id} Shipped`,
              format: 'Update'
            })}>
                    🚚 Mark Shipped
                  </button>
                  <button className="btn btn-success po-action-paid" onClick={() => openModal('report', {
              title: `Mark ${so.id} Paid`,
              format: 'Update'
            })}>
                    ✓ Mark Paid
                  </button>
                </div>}
            </div>

            {sidebar}
          </div>;
    }}
    </EditableDetailView>;
};

// ─── Admin PO List ────────────────────────────────────────────────────────────
const AdminPOList = ({
  openModal
}) => {
  const [open, setOpen] = useState(null);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [initialEdit, setInitialEdit] = useState(false);
  const normalisePO = p => {
    const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : '';
    const sub = p.subtotal ?? p.amount ?? 0;
    return {
      ...p,
      id: p.poId || p.id || p._id,
      supplier: typeof p.supplier === 'object' ? p.supplier?.name ?? '' : p.supplierName || p.supplier || '',
      orderDate: fmt(p.orderedAt || p.orderDate || p.createdAt),
      expectedDate: fmt(p.expectedAt || p.expectedDate || p.deliveryDate),
      payStatus: p.payStatus || p.paymentStatus || 'pending',
      status: p.status || 'draft',
      subtotal: sub,
      gst: p.gst ?? p.tax ?? Math.round(sub * 0.18),
      total: p.total ?? p.grandTotal ?? 0,
      items: p.items ?? [],
      notes: p.notes || ''
    };
  };
  useEffect(() => {
    purchaseApi.list({
      limit: 200
    }).then(r => setOrders((r.data ?? []).map(normalisePO))).catch(() => {});
    suppliersApi.list({
      limit: 200
    }).then(r => setSuppliers(r.data ?? [])).catch(() => {});
  }, []);

  // FIX #1: guard all .toLocaleString() calls with ?? 0
  const totalSpend = orders.reduce((s, p) => s + (p.total ?? 0), 0);
  const enrichedOrders = orders.map(o => ({
    ...o,
    itemCount: (o.items ?? []).length
  }));
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchFiltered
  } = useTableSearch(enrichedOrders, ['id', 'supplier'], {
    status: '',
    payStatus: ''
  });
  const filtered = searchFiltered.filter(r => !activeFilters.status || r.status === activeFilters.status).filter(r => !activeFilters.payStatus || r.payStatus === activeFilters.payStatus);
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
    title: 'Purchase Orders',
    filename: 'cooltech-purchase-orders',
    template: 'generic_list',
    subtitle: 'AC Services Platform · Procurement Register',
    docId: 'PO-EXPORT',
    columns: PO_COLUMNS,
    rows: filtered,
    showTotals: true,
    totalColumns: ['subtotal', 'gst', 'total']
  });
  const handleSave = updated => setOrders(prev => prev.map(p => p.id === updated.id ? updated : p));
  const handleDelete = id => {
    setOrders(prev => prev.filter(p => p.id !== id));
    setOpen(null);
  };
  const handleBack = () => {
    setOpen(null);
    setInitialEdit(false);
  };
  const po = open ? orders.find(p => p.id === open) : null;
  if (po) {
    return <PODetail po={po} suppliers={suppliers} onBack={handleBack} onSave={handleSave} onDelete={handleDelete} openModal={openModal} initialEditMode={initialEdit} />;
  }
  return <>
      {/* Header */}
      <div className="po-list-hdr">
        <div>
          <div className="section-title">Purchase Orders</div>
          {/* FIX #1: guard totalSpend */}
          <div className="section-sub">Total spend ₹{(totalSpend / 1000).toFixed(1)}K</div>
        </div>
        <div className="ap-purchase-orders-page-3">
          <button className="btn btn-primary" onClick={() => openModal('new_po')}>+ New PO</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid-4">
        <KCard label="Total Spend" value={`₹${(totalSpend / 1000).toFixed(1)}K`} icon="🛒" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
        <KCard label="Ordered" value={orders.filter(p => p.status === 'ordered').length} icon="🚚" iconBg="#EFF6FF" color="#0369A1" delay="1" />
        <KCard label="Received" value={orders.filter(p => p.status === 'received').length} icon="📦" iconBg="#F0FDF4" color="#16A34A" delay="2" />
        {/* FIX #1: guard pending pay total */}
        <KCard label="Pending Pay" value={`₹${orders.filter(p => p.payStatus === 'pending').reduce((s, p) => s + (p.total ?? 0), 0).toLocaleString()}`} icon="⏳" iconBg="#FFFBEB" color="#B45309" delay="3" />
      </div>

      {/* Table card */}
      <div className="card">
        <div className="ap-purchase-orders-page-4">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by PO ID or supplier…" />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={Object.keys(PO_STATUS)} allLabel="All Statuses" labelMap={Object.fromEntries(Object.entries(PO_STATUS).map(([k, v]) => [k, v.label]))} />
          <FilterSelect value={activeFilters.payStatus} onChange={val => setFilter('payStatus', val)} options={Object.keys(PAY_STATUS)} allLabel="All Payment" labelMap={Object.fromEntries(Object.entries(PAY_STATUS).map(([k, v]) => [k, v.label]))} />
          <div className="ap-purchase-orders-page-5">
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <Thead cols={['PO ID', 'Supplier', 'Items', 'Subtotal', 'GST', 'Total', 'Order Date', 'Expected', 'Status', 'Payment', '']} />
            <tbody>
              {paginated.length === 0 && <tr>
                  <td colSpan={11} className="ap-purchase-orders-page-6">
                    No purchase orders match your filters.
                  </td>
                </tr>}
              {paginated.map((p, i) => <tr key={p._id ?? p.id ?? i} className={`data-table tbody tr${i % 2 !== 0 ? ' row-alt' : ''}`} onClick={() => {
              setInitialEdit(false);
              setOpen(p.id);
            }}>
                  <td><span className="td-brand">{p.id}</span></td>
                  <td><span className="td-bold">{p.supplier}</span></td>
                  <td><span className="td-mono">{(p.items ?? []).length}</span></td>
                  {/* FIX #1: guard all monetary cells */}
                  <td><span className="td-mono">₹{(p.subtotal ?? 0).toLocaleString()}</span></td>
                  <td><span className="td-mono">₹{(p.gst ?? 0).toLocaleString()}</span></td>
                  <td><span className="td-amount">₹{(p.total ?? 0).toLocaleString()}</span></td>
                  <td className="td-mono">{p.orderDate}</td>
                  <td className="td-mono">{p.expectedDate}</td>
                  <td><SBadge s={p.status} map={PO_STATUS} /></td>
                  <td><SBadge s={p.payStatus} map={PAY_STATUS} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <ActionDropdown onView={() => {
                  setInitialEdit(false);
                  setOpen(p.id);
                }} onEdit={() => {
                  setInitialEdit(true);
                  setOpen(p.id);
                }} onDelete={() => setDeleteTarget(p.id)} />
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}
      </div>

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => {
      handleDelete(deleteTarget);
      setDeleteTarget(null);
    }} onCancel={() => setDeleteTarget(null)} message="This purchase order will be permanently removed." />
    </>;
};

// ─── Customer SO List ─────────────────────────────────────────────────────────
const CustomerSOList = ({
  openModal
}) => {
  const [open, setOpen] = useState(null);
  // FIX #3: seed state with MOCK_SO_ORDERS so the table isn't empty while API loads
  const [orders, setOrders] = useState(MOCK_SO_ORDERS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [initialEdit, setInitialEdit] = useState(false);
  const normaliseSO = o => {
    const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : '';
    const sub = o.subtotal ?? o.amount ?? 0;
    return {
      ...o,
      id: o.soId || o.poId || o.id || o._id,
      customer: typeof o.customer === 'object' ? o.customer?.name ?? '' : o.customerName || o.customer || (typeof o.supplier === 'object' ? o.supplier?.name : o.supplier) || '',
      phone: o.phone || (typeof o.customer === 'object' ? o.customer?.phone : '') || '',
      address: o.address || (typeof o.customer === 'object' ? o.customer?.address : '') || '',
      orderDate: fmt(o.orderedAt || o.orderDate || o.createdAt),
      deliveryDate: fmt(o.deliveredAt || o.deliveryDate || o.expectedAt),
      payStatus: o.payStatus || o.paymentStatus || 'pending',
      status: o.status || 'processing',
      subtotal: sub,
      gst: o.gst ?? o.tax ?? Math.round(sub * 0.18),
      total: o.total ?? o.grandTotal ?? 0,
      items: o.items ?? [],
      notes: o.notes || ''
    };
  };
  useEffect(() => {
    purchaseApi.list({
      limit: 200
    }).then(r => {
      // Only replace mock data if the API actually returns customer orders
      if ((r.data ?? []).length) setOrders(r.data.map(normaliseSO));
    }).catch(() => {});
  }, []);

  // FIX #1: guard all monetary values
  const totalRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);

  // FIX #2: was `[].map(...)` — now correctly maps over `orders`
  const enrichedOrders = orders.map(o => ({
    ...o,
    itemCount: (o.items ?? []).length
  }));
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchFiltered
  } = useTableSearch(enrichedOrders, ['id', 'customer'], {
    status: '',
    payStatus: ''
  });
  const filtered = searchFiltered.filter(r => !activeFilters.status || r.status === activeFilters.status).filter(r => !activeFilters.payStatus || r.payStatus === activeFilters.payStatus);
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
    title: 'Customer Orders',
    filename: 'cooltech-customer-orders',
    template: 'generic_list',
    subtitle: 'AC Services Platform · Sales Register',
    docId: 'SO-EXPORT',
    columns: SO_COLUMNS,
    rows: filtered,
    showTotals: true,
    totalColumns: ['subtotal', 'gst', 'total']
  });
  const handleSave = updated => setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
  const handleDelete = id => {
    setOrders(prev => prev.filter(o => o.id !== id));
    setOpen(null);
  };
  const handleBack = () => {
    setOpen(null);
    setInitialEdit(false);
  };
  const so = open ? orders.find(o => o.id === open) : null;
  if (so) {
    return <SODetail so={so} onBack={handleBack} onSave={handleSave} onDelete={handleDelete} openModal={openModal} initialEditMode={initialEdit} />;
  }

  // FIX #1: guard pending pay total
  const pendingPayTotal = orders.filter(o => o.payStatus === 'pending').reduce((s, o) => s + (o.total ?? 0), 0);
  return <>
      {/* Header */}
      <div className="po-list-hdr">
        <div>
          <div className="section-title">Customer Orders</div>
          <div className="section-sub">Total revenue ₹{(totalRevenue / 1000).toFixed(1)}K · {orders.length} orders</div>
        </div>
        <div className="ap-purchase-orders-page-7">
          <button className="btn btn-primary" onClick={() => openModal('new_so')}>+ New Order</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid-4">
        <KCard label="Total Revenue" value={`₹${(totalRevenue / 1000).toFixed(1)}K`} icon="💰" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
        <KCard label="Processing" value={orders.filter(o => o.status === 'processing').length} icon="⚙️" iconBg="#EFF6FF" color="#0369A1" delay="1" />
        <KCard label="Delivered" value={orders.filter(o => o.status === 'delivered').length} icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="2" />
        <KCard label="Pending Pay" value={`₹${pendingPayTotal.toLocaleString()}`} icon="⏳" iconBg="#FFFBEB" color="#B45309" delay="3" />
      </div>

      {/* Table card */}
      <div className="card">
        <div className="ap-purchase-orders-page-8">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by order ID or customer…" />
          <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={Object.keys(SO_STATUS)} allLabel="All Statuses" labelMap={Object.fromEntries(Object.entries(SO_STATUS).map(([k, v]) => [k, v.label]))} />
          <FilterSelect value={activeFilters.payStatus} onChange={val => setFilter('payStatus', val)} options={Object.keys(PAY_STATUS)} allLabel="All Payment" labelMap={Object.fromEntries(Object.entries(PAY_STATUS).map(([k, v]) => [k, v.label]))} />
          <div className="ap-purchase-orders-page-9">
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <Thead cols={['Order ID', 'Customer', 'Items', 'Subtotal', 'GST', 'Total', 'Order Date', 'Delivery', 'Status', 'Payment', '']} />
            <tbody>
              {paginated.length === 0 && <tr>
                  <td colSpan={11} className="ap-purchase-orders-page-10">
                    No customer orders match your filters.
                  </td>
                </tr>}
              {paginated.map((o, i) => <tr key={o._id ?? o.id ?? i} className={`data-table tbody tr${i % 2 !== 0 ? ' row-alt' : ''}`} onClick={() => {
              setInitialEdit(false);
              setOpen(o.id);
            }}>
                  <td><span className="td-brand">{o.id}</span></td>
                  <td><span className="td-bold">{o.customer}</span></td>
                  <td><span className="td-mono">{(o.items ?? []).length}</span></td>
                  {/* FIX #1: guard all monetary cells */}
                  <td><span className="td-mono">₹{(o.subtotal ?? 0).toLocaleString()}</span></td>
                  <td><span className="td-mono">₹{(o.gst ?? 0).toLocaleString()}</span></td>
                  <td><span className="td-amount">₹{(o.total ?? 0).toLocaleString()}</span></td>
                  <td className="td-mono">{o.orderDate}</td>
                  <td className="td-mono">{o.deliveryDate}</td>
                  <td><SBadge s={o.status} map={SO_STATUS} /></td>
                  <td><SBadge s={o.payStatus} map={PAY_STATUS} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <ActionDropdown onView={() => {
                  setInitialEdit(false);
                  setOpen(o.id);
                }} onEdit={() => {
                  setInitialEdit(true);
                  setOpen(o.id);
                }} onDelete={() => setDeleteTarget(o.id)} />
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}
      </div>

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => {
      handleDelete(deleteTarget);
      setDeleteTarget(null);
    }} onCancel={() => setDeleteTarget(null)} message="This customer order will be permanently removed." />
    </>;
};

// ─── Root Page ────────────────────────────────────────────────────────────────
const PurchaseOrdersPage = ({
  openModal
}) => {
  const [activeTab, setActiveTab] = useState('admin');
  return <div className="page-body">
      <TabBar activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === 'admin' ? <AdminPOList openModal={openModal} /> : <CustomerSOList openModal={openModal} />}
    </div>;
};
export default PurchaseOrdersPage;