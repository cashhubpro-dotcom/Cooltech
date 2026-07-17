import { useState, useEffect } from 'react';
import { priceItemsApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { TypeTag } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
const PRICE_COLUMNS = [{
  label: 'ID',
  key: 'id',
  width: 10,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700,
    color: '#F97316',
    fontSize: 11
  }
}, {
  label: 'Service Name',
  key: 'name',
  width: 28,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Category',
  key: 'category',
  width: 14,
  render: val => <TypeTag type={val} />,
  format: val => val
}, {
  label: 'Price (ex-GST)',
  key: 'price',
  width: 16,
  excelKey: 'Price ex-GST (₹)',
  render: val => <span className="ap-price-list-page-1">₹{val.toLocaleString('en-IN')}</span>,
  format: val => val,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 600
  }
}, {
  label: 'GST %',
  key: 'gst',
  width: 8,
  render: val => <span className="ap-price-list-page-2">{val}%</span>,
  format: val => `${val}%`,
  tdStyle: {
    fontFamily: 'monospace',
    color: '#666'
  }
}, {
  label: 'Total (incl-GST)',
  key: 'total',
  width: 18,
  excelKey: 'Total incl-GST (₹)',
  render: val => <span className="ap-price-list-page-3">₹{val.toLocaleString('en-IN')}</span>,
  format: val => val,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 800,
    color: '#F97316'
  }
}, {
  label: 'Unit',
  key: 'unit',
  width: 12,
  tdStyle: {
    color: '#666',
    fontSize: 11
  }
}, {
  label: 'Status',
  key: 'active',
  width: 10,
  render: val => <span style={{
    background: val ? "var(--success-bg)" : "var(--bg)",
    color: val ? "var(--success-text)" : "var(--text-muted)"
  }} className="ap-price-list-page-4">● {val ? 'Active' : 'Inactive'}</span>,
  format: val => val ? 'Active' : 'Inactive'
}];
const PriceListPage = ({
  openModal
}) => {
  const [services, setServices] = useState([]);
  useEffect(() => {
    priceItemsApi.list({
      limit: 200
    }).then(r => setServices(r.data ?? [])).catch(() => {});
  }, []);

  // Normalize backend PriceItem shape (priceId/gstPercent/totalInclGst/status)
  // into the flat shape this page's columns/rows already expect.
  const items = services.map(s => ({
    id: s.priceId,
    _id: s._id,
    name: s.name,
    category: s.category,
    price: s.price,
    gst: s.gstPercent,
    total: s.totalInclGst ?? (s.price && s.gstPercent != null
  ? Math.round(s.price * (1 + s.gstPercent / 100))
  : 0),
    unit: s.unit,
    active: s.status === 'Active',
  }));
  const cats = [...new Set(items.map(p => p.category))];

  const [statusFilter, setStatusFilter] = useState(''); // 'Active' | 'Inactive' | ''

  // ── Search + filter hooks ────────────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: filteredBySearch
  } = useTableSearch(items, ['id', 'name', 'category', 'unit'], {
    category: ''
  });

  // Boolean field needs manual handling — string matching won't work on true/false
  const filtered = statusFilter ? filteredBySearch.filter(p => statusFilter === 'Active' === p.active) : filteredBySearch;
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
    title: `Price List${activeFilters.category ? ` · ${activeFilters.category}` : ''}`,
    filename: `cooltech-pricelist-${activeFilters.category || 'all'}`,
    template: 'generic_list',
    subtitle: 'AC Services Platform · Price List',
    docId: 'PRC-LIST-001',
    columns: PRICE_COLUMNS,
    rows: filtered,
    showTotals: true,
    totalColumns: ['price', 'total']
  });
  return <div className="fi ap-price-list-page-5">

      <SectionHdr title="Price List" sub="Manage your service rates and pricing" action="+ Add Price Item" onAction={() => openModal('new_price_item')} />

      <div className="ap-price-list-page-6">
        <KCard label="Total Items" value={items.length} sub="all services" icon="🏷" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
        <KCard label="Active" value={items.filter(p => p.active).length} sub="visible to staff" icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="1" />
        <KCard label="Categories" value={new Set(items.map(p => p.category)).size} sub="service types" icon="📂" iconBg="#EFF6FF" color="#0369A1" delay="2" />
        <KCard label="Avg Price" value={items.length ? `₹${Math.round(items.reduce((s, p) => s + p.price, 0) / items.length).toLocaleString('en-IN')}` : '₹0'} sub="ex-GST" icon="💰" iconBg="#FEFCE8" color="#CA8A04" delay="3" />
      </div>

      {/* Table */}
      <div className="ap-price-list-page-7">

        {/* Toolbar */}
        <div className="ap-price-list-page-8">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, category, unit…" />
          <FilterSelect value={activeFilters.category} onChange={val => setFilter('category', val)} options={cats} allLabel="All Categories" />
          <FilterSelect value={statusFilter} onChange={val => setStatusFilter(val)} options={['Active', 'Inactive']} allLabel="All Statuses" />
          <div className="ap-price-list-page-9">
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div className="ap-price-list-page-10">
          <table className="ap-price-list-page-11">
            <Thead cols={['ID', 'Service Name', 'Category', 'Price (ex-GST)', 'GST %', 'Total (incl-GST)', 'Unit', 'Status', '']} />
            <tbody>
              {paginated.map((item, i) => <tr key={item.id} className="row ap-price-list-page-12" style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                  <td className="ap-price-list-page-13"><span className="ap-price-list-page-14">{item.id}</span></td>
                  <td className="ap-price-list-page-15">{item.name}</td>
                  <td className="ap-price-list-page-16"><TypeTag type={item.category} /></td>
                  <td className="ap-price-list-page-17"><span className="ap-price-list-page-18">₹{item.price.toLocaleString('en-IN')}</span></td>
                  <td className="ap-price-list-page-19"><span className="ap-price-list-page-20">{item.gst}%</span></td>
                  <td className="ap-price-list-page-21"><span className="ap-price-list-page-22">₹{item.total.toLocaleString('en-IN')}</span></td>
                  <td className="ap-price-list-page-23">{item.unit}</td>
                  <td className="ap-price-list-page-24">
                    <span style={{
                  background: item.active ? "var(--success-bg)" : "var(--bg)",
                  color: item.active ? "var(--success-text)" : "var(--text-muted)"
                }} className="ap-price-list-page-25">
                      ● {item.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="ap-price-list-page-26">
                    <div className="ap-price-list-page-27">
                      <button className="btn ap-price-list-page-28" onClick={() => openModal('new_price_item', {
                    item
                  })}>Edit</button>
                      <button className="btn ap-price-list-page-29" onClick={() => openModal('new_quotation', {
                    preselect: item
                  })}>Use in Quote</button>
                    </div>
                  </td>
                </tr>)}
              {paginated.length === 0 && <tr><td colSpan={9} className="ap-price-list-page-30">No items match your search.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Footer: count summary + totals + pagination */}
        {filtered.length > 0 && <div className="ap-price-list-page-31">
            {/* <span className="ap-price-list-page-32">
              Showing <strong className="ap-price-list-page-33">{from}–{to}</strong> of <strong className="ap-price-list-page-34">{total}</strong> item{total !== 1 ? 's' : ''}
            </span> */}
            <span className="ap-price-list-page-35">
              Total (incl-GST):&nbsp;
              <strong className="ap-price-list-page-36">
                ₹{filtered.reduce((s, p) => s + p.total, 0).toLocaleString('en-IN')}
              </strong>
            </span>
          </div>}

        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>
    </div>;
};
export default PriceListPage;