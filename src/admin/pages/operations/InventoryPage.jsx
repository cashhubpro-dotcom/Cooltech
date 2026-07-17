import { inventoryApi } from '../../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, SevBadge, Avatar, Divider } from '../../components/ui/Badges';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';
import { FRow, FInput, FSelect, FTextarea, FBtn } from '../../components/ui/Form';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';

// ─── Column configs for export ────────────────────────────────────────────────
const items_COLUMNS = [{
  label: 'Item Name',
  key: 'name',
  width: 22,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Category',
  key: 'category',
  width: 14
}, {
  label: 'SKU',
  key: 'sku',
  width: 14,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'In Stock',
  key: 'qty',
  width: 10,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Unit',
  key: 'unit',
  width: 10
}, {
  label: 'Reorder At',
  key: 'reorder',
  width: 10,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Unit Cost',
  key: 'cost',
  width: 12,
  format: v => `₹${v.toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Total Value',
  key: 'stockVal',
  width: 14,
  format: v => `₹${v.toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700
  }
}, {
  label: 'Stock Status',
  key: 'stockStatus',
  width: 12,
  format: v => v
}, {
  label: 'Supplier',
  key: 'supplier',
  width: 18
}];
const USAGE_COLUMNS = [{
  label: 'Log ID',
  key: 'id',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Item',
  key: 'item',
  width: 22,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Qty Used',
  key: 'qty',
  width: 10,
  format: v => `-${v}`,
  tdStyle: {
    fontFamily: 'monospace',
    color: '#DC2626'
  }
}, {
  label: 'Unit',
  key: 'unit',
  width: 10
}, {
  label: 'Job',
  key: 'job',
  width: 12,
  tdStyle: {
    fontFamily: 'monospace'
  }
}, {
  label: 'Technician',
  key: 'tech',
  width: 18
}, {
  label: 'Date',
  key: 'date',
  width: 10
}];
const USAGE_LOG = [{
  id: "USG-021",
  item: "R-32 Refrigerant",
  qty: 0.8,
  unit: "Cylinder",
  job: "JOB-1042",
  tech: "Ramesh K.",
  date: "Mar 3"
}, {
  id: "USG-020",
  item: "Split AC Filter 1.5T",
  qty: 2,
  unit: "Piece",
  job: "JOB-1041",
  tech: "Vijay S.",
  date: "Mar 3"
}, {
  id: "USG-019",
  item: "R-32 Refrigerant",
  qty: 1.0,
  unit: "Cylinder",
  job: "JOB-1040",
  tech: "Arjun D.",
  date: "Mar 2"
}, {
  id: "USG-018",
  item: "Capacitor 25µF",
  qty: 1,
  unit: "Piece",
  job: "JOB-1039",
  tech: "Suresh Y.",
  date: "Mar 2"
}, {
  id: "USG-017",
  item: "R-410A Refrigerant",
  qty: 0.6,
  unit: "Cylinder",
  job: "JOB-1038",
  tech: "Ramesh K.",
  date: "Mar 1"
}, {
  id: "USG-016",
  item: 'Copper Pipe 1/4"',
  qty: 8,
  unit: "Meter",
  job: "JOB-1040",
  tech: "Arjun D.",
  date: "Mar 1"
}, {
  id: "USG-015",
  item: "Compressor Oil",
  qty: 0.5,
  unit: "Litre",
  job: "JOB-1037",
  tech: "Vijay S.",
  date: "Feb 29"
}, {
  id: "USG-014",
  item: "R-32 Refrigerant",
  qty: 1.8,
  unit: "Cylinder",
  job: "JOB-1037",
  tech: "Vijay S.",
  date: "Feb 29"
}];

// ─── FIX: normalize raw API inventory row ────────────────────────────────────
const normalizeItem = (item, idx) => ({
  ...item,
  // Guarantee unique id regardless of backend field name
  id: item.id ?? item._id ?? item.itemId ?? `inv-${idx}`,
  qty: Number(item.qty) || 0,
  cost: Number(item.cost) || 0,
  reorder: Number(item.reorder) || 0,
  // Derive computed fields here so they're always present
  stockVal: (Number(item.qty) || 0) * (Number(item.cost) || 0),
  stockStatus: (Number(item.qty) || 0) <= (Number(item.reorder) || 0) ? 'Low Stock' : 'OK'
});

// ─── InventoryPage ────────────────────────────────────────────────────────────
const InventoryPage = ({
  openModal
}) => {
  const [items, setItems] = useState([]);
  const [view, setView] = useState("items");
  useEffect(() => {
    inventoryApi.list({
      limit: 200
    }).then(r => setItems((r.data ?? []).map(normalizeItem))).catch(() => {});
  }, []);
  const low = items.filter(i => i.qty <= i.reorder);
  const totalValue = items.reduce((s, i) => s + i.qty * i.cost, 0);
  const categories = [...new Set(items.map(i => i.category))];
  const catData = categories.map(cat => ({
    cat,
    items: items.filter(i => i.category === cat).length,
    value: items.filter(i => i.category === cat).reduce((s, i) => s + i.qty * i.cost, 0),
    qty: items.filter(i => i.category === cat).reduce((s, i) => s + i.qty, 0)
  })).sort((a, b) => b.value - a.value);
  const CAT_COLORS = ["var(--brand)", "var(--info)", "var(--success)", "var(--warning)", "var(--purple)", "var(--xec4899)"];

  // ── FIX: was `[].map(...)` — hardcoded empty array meant items never showed ──
  // Now correctly derives from `items` state, so table populates after API load
  const inventoryRows = items.map(item => ({
    ...item,
    stockVal: item.qty * item.cost,
    stockStatus: item.qty <= item.reorder ? 'Low Stock' : 'OK'
  }));

  // ── Items: search + filter ────────────────────────────────────────────────
  const {
    q: itemsQ,
    setQ: setItemsQ,
    activeFilters: itemsFilters,
    setFilter: setItemsFilter,
    filtered: itemsSearchFiltered
  } = useTableSearch(inventoryRows, ['name', 'sku', 'category', 'supplier'], {
    category: '',
    stockStatus: ''
  });
  const itemsFiltered = itemsSearchFiltered.filter(r => !itemsFilters.category || r.category === itemsFilters.category).filter(r => !itemsFilters.stockStatus || r.stockStatus === itemsFilters.stockStatus);
  const {
    paginated: itemsPaginated,
    page: itemsPage,
    totalPages: itemsTotalPages,
    setPage: setItemsPage,
    pageSize: itemsPageSize,
    setPageSize: setItemsPageSize,
    from: itemsFrom,
    to: itemsTo,
    total: itemsTotal
  } = usePagination(itemsFiltered, 10);
  const {
    exportProps: itemsExportProps
  } = useExport({
    title: "Inventory & Parts",
    filename: "cooltech-inventory",
    template: "generic_list",
    subtitle: "AC Services Platform · Stock Register",
    docId: "items-EXPORT",
    columns: items_COLUMNS,
    rows: itemsFiltered,
    showTotals: true,
    totalColumns: ['stockVal']
  });

  // ── Usage Log: search + filter ────────────────────────────────────────────
  const {
    q: usageQ,
    setQ: setUsageQ,
    activeFilters: usageFilters,
    setFilter: setUsageFilter,
    filtered: usageSearchFiltered
  } = useTableSearch(USAGE_LOG, ['item', 'tech', 'job', 'id'], {
    tech: ''
  });
  const usageFiltered = usageSearchFiltered.filter(r => !usageFilters.tech || r.tech === usageFilters.tech);
  const {
    paginated: usagePaginated,
    page: usagePage,
    totalPages: usageTotalPages,
    setPage: setUsagePage,
    pageSize: usagePageSize,
    setPageSize: setUsagePageSize,
    from: usageFrom,
    to: usageTo,
    total: usageTotal
  } = usePagination(usageFiltered, 10);
  const {
    exportProps: usageExportProps
  } = useExport({
    title: "Inventory Usage Log",
    filename: "cooltech-usage-log",
    template: "generic_list",
    subtitle: "AC Services Platform · Parts Movement",
    docId: "USAGE-LOG-EXPORT",
    columns: USAGE_COLUMNS,
    rows: usageFiltered
  });
  const uniqueTechs = [...new Set(USAGE_LOG.map(u => u.tech))];
  return <div className="fi ap-inventory-page-1">

      {/* ── Header ── */}
      <div className="ap-inventory-page-2">
        <div>
          <div className="ap-inventory-page-3">Inventory & Parts</div>
          <div className="ap-inventory-page-4">
            {items.length} items · ₹{(totalValue / 1000).toFixed(1)}K stock value · {low.length} low stock
          </div>
        </div>
        <div className="ap-inventory-page-5">
          <div className="ap-inventory-page-6">
            {[["items", "📦 Items"], ["usage", "📋 Usage Log"], ["analytics", "📊 Analytics"]].map(([k, l]) => <button key={k} onClick={() => setView(k)} style={{
            background: view === k ? "var(--white)" : "transparent",
            color: view === k ? "var(--text-h1)" : "var(--text-muted)",
            border: `1px solid ${view === k ? COLORS.border : "transparent"}`
          }} className="ap-inventory-page-7">
                {l}
              </button>)}
          </div>
          {view === "items" && <ExportDropdown {...itemsExportProps} />}
          {view === "usage" && <ExportDropdown {...usageExportProps} />}
          <button className="btn ap-inventory-page-8" onClick={() => openModal("new_inventory")}>
            + Add Item
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="ap-inventory-page-9">
        <KCard label="Total Items" value={items.length} icon="📦" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
        <KCard label="Stock Value" value={`₹${(totalValue / 1000).toFixed(0)}K`} icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="1" />
        <KCard label="Low Stock" value={low.length} icon="⚠️" iconBg="#FEF2F2" color="#DC2626" delay="2" />
        <KCard label="Categories" value={categories.length} icon="📂" iconBg="#EFF6FF" color="#0369A1" delay="3" />
        <KCard label="Usage This Week" value="8 logs" icon="📋" iconBg="#F0FDF4" color="#16A34A" delay="3" />
      </div>

      {/* ── Low stock alert ── */}
      {low.length > 0 && <div className="ap-inventory-page-10">
          <span className="ap-inventory-page-11">⚠️</span>
          <div className="ap-inventory-page-12">
            <div className="ap-inventory-page-13">
              Low Stock Alert — {low.length} item{low.length > 1 ? "s" : ""} need reordering
            </div>
            <div className="ap-inventory-page-14">
              {low.map(item => <span key={item.id} className="ap-inventory-page-15">
                  {item.name}: {item.qty} {item.unit}s left (min {item.reorder})
                </span>)}
            </div>
          </div>
          <button className="btn ap-inventory-page-16" onClick={() => openModal("new_po")}>
            🛒 Raise PO
          </button>
        </div>}

      {/* ══ ITEMS TAB ══ */}
      {view === "items" && <div className="ap-inventory-page-17">
          {/* Toolbar */}
          <div className="ap-inventory-page-18">
            <TableSearchBar value={itemsQ} onChange={setItemsQ} placeholder="Search by name, SKU, supplier…" />
            <FilterSelect value={itemsFilters.category} onChange={val => setItemsFilter("category", val)} options={categories} allLabel="All Categories" />
            <FilterSelect value={itemsFilters.stockStatus} onChange={val => setItemsFilter("stockStatus", val)} options={["OK", "Low Stock"]} allLabel="All Stock Status" />
            <button className="btn ap-inventory-page-19" onClick={() => openModal("new_po")}>
              🛒 Raise PO
            </button>
          </div>

          <div className="ap-inventory-page-20">
            <table className="ap-inventory-page-21">
              <Thead cols={["Item Name", "Category", "SKU", "In Stock", "Unit", "Reorder At", "Unit Cost", "Total Value", "Stock Level", "Supplier", ""]} />
              <tbody>
                {itemsPaginated.length === 0 && <tr>
                    <td colSpan={11} className="ap-inventory-page-22">
                      No items match your filters.
                    </td>
                  </tr>}
                {itemsPaginated.map((item, i) => {
              const pct = Math.min(item.qty / Math.max(item.qty * 1.5, item.reorder * 3) * 100, 100);
              const isLow = item.qty <= item.reorder;
              const stockVal = item.qty * item.cost;
              return (
                // FIX: key={item.id} is now always defined because normalizeItem guarantees it
                <tr key={item.id} className="row ap-inventory-page-23" style={{
                  background: isLow ? "#FFFBF7" : i % 2 === 0 ? COLORS.white : "#FAFAFA"
                }}>
                      <td className="ap-inventory-page-24">{item.name}</td>
                      <td className="ap-inventory-page-25"><TypeTag type={item.category} /></td>
                      <td className="ap-inventory-page-26"><span className="ap-inventory-page-27">{item.sku}</span></td>
                      <td className="ap-inventory-page-28"><span style={{
                      color: isLow ? "var(--danger-text)" : "var(--success-text)"
                    }} className="ap-inventory-page-29">{item.qty}</span></td>
                      <td className="ap-inventory-page-30">{item.unit}</td>
                      <td className="ap-inventory-page-31"><span className="ap-inventory-page-32">{item.reorder}</span></td>
                      <td className="ap-inventory-page-33"><span className="ap-inventory-page-34">₹{item.cost}</span></td>
                      <td className="ap-inventory-page-35"><span className="ap-inventory-page-36">₹{stockVal.toLocaleString()}</span></td>
                      <td className="ap-inventory-page-37">
                        <div className="ap-inventory-page-38">
                          <div className="ap-inventory-page-39">
                            <div style={{
                          width: `${pct}%`,
                          background: isLow ? "var(--danger)" : "var(--success)"
                        }} className="ap-inventory-page-40" />
                          </div>
                          {isLow && <span className="ap-inventory-page-41">LOW</span>}
                        </div>
                      </td>
                      <td className="ap-inventory-page-42">{item.supplier}</td>
                      <td className="ap-inventory-page-43">
                        <div className="ap-inventory-page-44">
                          <button className="btn ap-inventory-page-45" onClick={() => openModal("use_inventory", {
                        name: item.name
                      })}>Use</button>
                          {isLow && <button className="btn ap-inventory-page-46" onClick={() => openModal("new_po")}>Reorder</button>}
                        </div>
                      </td>
                    </tr>
              );
            })}
              </tbody>
            </table>
          </div>

          {itemsTotalPages > 0 && <Pagination page={itemsPage} totalPages={itemsTotalPages} setPage={setItemsPage} pageSize={itemsPageSize} setPageSize={setItemsPageSize} from={itemsFrom} to={itemsTo} total={itemsTotal} />}

          <div className="ap-inventory-page-47">
            <span>Total stock value across all items</span>
            <span className="ap-inventory-page-48">₹{totalValue.toLocaleString()}</span>
          </div>
        </div>}

      {/* ══ USAGE LOG TAB ══ */}
      {view === "usage" && <div className="ap-inventory-page-49">
          {/* Toolbar */}
          <div className="ap-inventory-page-50">
            <TableSearchBar value={usageQ} onChange={setUsageQ} placeholder="Search item, technician, job ID…" />
            <FilterSelect value={usageFilters.tech} onChange={val => setUsageFilter("tech", val)} options={uniqueTechs} allLabel="All Technicians" />
            <button className="btn ap-inventory-page-51" onClick={() => openModal("use_inventory", {
          name: ""
        })}>
              + Log Usage
            </button>
          </div>

          <div className="ap-inventory-page-52">
            <table className="ap-inventory-page-53">
              <Thead cols={["Log ID", "Item", "Qty Used", "Unit", "Job", "Technician", "Date", ""]} />
              <tbody>
                {usagePaginated.length === 0 && <tr>
                    <td colSpan={8} className="ap-inventory-page-54">
                      No usage logs match your filters.
                    </td>
                  </tr>}
                {usagePaginated.map((u, i) => <tr key={u.id} className="row ap-inventory-page-55" style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                    <td className="ap-inventory-page-56"><span className="ap-inventory-page-57">{u.id}</span></td>
                    <td className="ap-inventory-page-58">{u.item}</td>
                    <td className="ap-inventory-page-59"><span className="ap-inventory-page-60">-{u.qty}</span></td>
                    <td className="ap-inventory-page-61">{u.unit}</td>
                    <td className="ap-inventory-page-62"><span className="ap-inventory-page-63">{u.job}</span></td>
                    <td className="ap-inventory-page-64">
                      <div className="ap-inventory-page-65">
                        <Avatar name={u.tech} size={24} />
                        <span className="ap-inventory-page-66">{u.tech}</span>
                      </div>
                    </td>
                    <td className="ap-inventory-page-67">{u.date}</td>
                    <td className="ap-inventory-page-68">
                      <button className="btn ap-inventory-page-69" onClick={() => openModal("report", {
                  title: u.id,
                  format: "View"
                })}>Details</button>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          {usageTotalPages > 0 && <Pagination page={usagePage} totalPages={usageTotalPages} setPage={setUsagePage} pageSize={usagePageSize} setPageSize={setUsagePageSize} from={usageFrom} to={usageTo} total={usageTotal} />}
        </div>}

      {/* ══ ANALYTICS TAB ══ */}
      {view === "analytics" && <div className="ap-inventory-page-70">
          <div className="ap-inventory-page-71">
            <div className="ap-inventory-page-72">Stock Value by Category</div>
            {catData.map((c, i) => <div key={c.cat} className="ap-inventory-page-73">
                <div className="ap-inventory-page-74">
                  <div className="ap-inventory-page-75">
                    <div style={{
                background: CAT_COLORS[i % CAT_COLORS.length]
              }} className="ap-inventory-page-76" />
                    <span>{c.cat}</span>
                  </div>
                  <span className="ap-inventory-page-77">₹{c.value.toLocaleString()} · {c.items} items</span>
                </div>
                <div className="ap-inventory-page-78">
                  <div style={{
              width: `${c.value / (catData[0]?.value || 1) * 100}%`,
              background: CAT_COLORS[i % CAT_COLORS.length]
            }} className="ap-inventory-page-79" />
                </div>
              </div>)}
          </div>

          <div className="ap-inventory-page-80">
            <div className="ap-inventory-page-81">Stock Health</div>
            {items.map(item => {
          const pct = Math.min(item.qty / Math.max(item.reorder * 3, item.qty) * 100, 100);
          const isLow = item.qty <= item.reorder;
          return <div key={item.id} className="ap-inventory-page-82">
                  <div className="ap-inventory-page-83">
                    <span style={{
                fontWeight: isLow ? "700" : "400",
                color: isLow ? "var(--danger-text)" : "var(--text-muted)"
              }}>{item.name}</span>
                    <span style={{
                color: isLow ? "var(--danger-text)" : "var(--success-text)"
              }} className="ap-inventory-page-84">{item.qty} / {item.reorder} min</span>
                  </div>
                  <div className="ap-inventory-page-85">
                    <div style={{
                width: `${pct}%`,
                background: isLow ? "var(--danger)" : "var(--success)"
              }} className="ap-inventory-page-86" />
                  </div>
                </div>;
        })}
          </div>
        </div>}

    </div>;
};
export default InventoryPage;