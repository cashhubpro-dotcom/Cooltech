import { JOB_STATUS } from '../constants/statusMaps';
import { customersApi, jobsApi } from '../services/api';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import { SBadge, TypeTag, Avatar } from '../components/ui/Badges';
import { SectionHdr, Thead } from '../components/ui/Cards';
import ActionDropdown from '../components/ui/ActionDropdown';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import EditableDetailView from '../components/ui/EditableDetailView';
import { useTableSearch } from '../hooks/useTableSearch';
import TableSearchBar from '../components/ui/TableSearchBar';
import FilterSelect from '../components/ui/FilterSelect';
import { usePagination } from '../hooks/usePagination';
import Pagination from '../components/ui/Pagination';
import ExportDropdown from '../components/layout/ExportDropdown';
import useExport from '../hooks/useExport';
import { addToDeleted } from '../store/deletedStore';
import { fmtDateDMY } from '../../shared/formatDate';

// ─── shared input style ───────────────────────────────────────────────────────
const iStyle = {
  padding: "6px 10px",
  borderRadius: 7,
  border: `1.5px solid ${COLORS.border}`,
  fontSize: 12,
  color: COLORS.h2,
  background: "var(--bg)",
  fontFamily: FONTS.sans,
  width: "100%",
  outline: "none",
  boxSizing: "border-box"
};

// ─── Column config for export ─────────────────────────────────────────────────
const CUSTOMER_COLUMNS = [{
  label: "Customer ID",
  key: "id",
  width: 12,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: COLORS.brand,
    fontSize: 11
  }
}, {
  label: "Name",
  key: "name",
  width: 22,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: "Type",
  key: "type",
  width: 14,
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Phone",
  key: "phone",
  width: 14,
  tdStyle: {
    fontFamily: "monospace",
    fontSize: 11
  }
}, {
  label: "Email",
  key: "email",
  width: 22,
  tdStyle: {
    fontSize: 11
  }
}, {
  label: "AC Units",
  key: "units",
  width: 8,
  tdStyle: {
    fontFamily: "monospace",
    textAlign: "center"
  }
}, {
  label: "AMC",
  key: "amc",
  width: 8,
  format: v => v ? "Active" : "None",
  tdStyle: {
    fontSize: 12
  }
}, {
  label: "Total Jobs",
  key: "totalJobs",
  width: 10,
  tdStyle: {
    fontFamily: "monospace",
    textAlign: "center"
  }
}, {
  label: "Total Spent (₹)",
  key: "totalSpent",
  width: 14,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: COLORS.brand
  }
}, {
  label: "Last Service",
  key: "lastService",
  width: 14,
  tdStyle: {
    fontSize: 11,
    color: COLORS.muted
  }
}];

// ─── CustomersPage ────────────────────────────────────────────────────────────
// FIX 3: accept `onDelete` prop (or `addToDeleted`) from parent for recently-deleted tracking
const CustomersPage = ({
  openModal,
  addToDeleted
}) => {
  const [open, setOpen] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [initialEditMode, setInitialEditMode] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [custJobs, setCustJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const normaliseCustomer = c => ({
    ...c,
    id: c.customerId || c._id,
    tags: Array.isArray(c.tags) ? c.tags : [],
    totalJobs: c.totalJobs ?? 0,
    totalSpent: c.totalSpent ?? 0,
    units: c.units ?? 1,
    lastService: c.lastService ?fmtDateDMY(new Date(c.lastService)) : '—'
  });

  // Load all customers on mount
  useEffect(() => {
    customersApi.list({
      limit: 200
    }).then(r => setCustomers((r.data ?? []).map(normaliseCustomer))).catch(() => {});
  }, []);

  // Load jobs for a specific customer when detail view opens
  useEffect(() => {
    if (!open) {
      setCustJobs([]);
      return;
    }
    setJobsLoading(true);
    jobsApi.list({
      customer: open,
      limit: 50
    }).then(r => setCustJobs(r.data ?? [])).catch(() => setCustJobs([])).finally(() => setJobsLoading(false));
  }, [open]);
  const cust = open ? customers.find(c => c._id === open) : null;

  // ── ALL HOOKS BEFORE EARLY RETURN ─────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: filteredCustomers
  } = useTableSearch(customers, ['id', 'name', 'phone', 'email', 'address', 'type'], {
    type: '',
    amc: ''
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
  } = usePagination(filteredCustomers, 10);
  const {
    exportProps
  } = useExport({
    title: "Customers",
    filename: "cooltech-customers",
    template: "generic_list",
    subtitle: `AC Services Platform · Customers · ${filteredCustomers.length} records`,
    docId: "CUST-EXPORT",
    columns: CUSTOMER_COLUMNS,
    rows: filteredCustomers,
    showTotals: true,
    totalColumns: ["totalSpent", "totalJobs"]
  });
  const handleBack = () => {
    setOpen(null);
    setInitialEditMode(false);
  };
  const handleSave = async updated => {
    try {
      const doc = await customersApi.update(updated._id, updated);
      setCustomers(prev => prev.map(c => c._id === doc._id ? normaliseCustomer(doc) : c));
    } catch (e) {
      alert(e.message);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 1: use customersApi.remove (not jobsApi.remove)
  // FIX 2: use setCustomers (not undefined setJobs)
  // FIX 3: call addToDeleted with the customer's data, not job data
  // ─────────────────────────────────────────────────────────────────────────
  const handleDelete = async id => {
    // Find the customer being deleted so we can log it
    const item = customers.find(c => (c._id ?? c.id) === id);

    // Push to recently-deleted if the parent provides the handler
    if (item && typeof addToDeleted === 'function') {
      addToDeleted({
        id: item.id ?? item._id,
        name: item.name,
        module: 'Customer',
        by: 'Admin',
        date: new Date().toISOString().slice(0, 10)
      });
    }
    try {
      // FIX 1: was jobsApi.remove — must be customersApi.remove
      await customersApi.remove(id);

      // FIX 2: was setJobs (undefined) — must be setCustomers
      setCustomers(prev => prev.filter(c => (c._id ?? c.id) !== id));

      // If we were viewing this customer's detail, go back to list
      if (open === id) handleBack();

      // Close delete modal
      setDeleteTarget(null);
    } catch (e) {
      alert(e.message);
    }
  };

  // ── DETAIL VIEW ─────────────────────────────────────────────────────────────
  if (cust) return <EditableDetailView id={cust.id} breadcrumb="Customers" onBack={handleBack} initialEditMode={initialEditMode} data={cust} fields={[{
    key: "name",
    type: "text"
  }, {
    key: "type",
    type: "select",
    options: ["Residential", "Commercial"]
  }, {
    key: "phone",
    type: "text"
  }, {
    key: "email",
    type: "email"
  }, {
    key: "address",
    type: "text"
  }, {
    key: "units",
    type: "number"
  }, {
    key: "amc",
    type: "text"
  }]} onSave={handleSave} onDelete={() => handleDelete(cust._id)}>
      {({
      editMode,
      editData,
      setEditData
    }) => {
      const set = key => e => setEditData(prev => ({
        ...prev,
        [key]: e.target.value
      }));
      const contactRows = [{
        icon: "📞",
        key: "phone",
        label: "Phone"
      }, {
        icon: "✉️",
        key: "email",
        label: "Email"
      }, {
        icon: "📍",
        key: "address",
        label: "Address"
      }];
      return <div className="ap-customers-page-1">

            {/* ── Left column ── */}
            <div className="ap-customers-page-2">

              {/* Avatar / name / type card */}
              <div style={{
            border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
            boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.05)"
          }} className="ap-customers-page-3">
                <Avatar name={editMode ? editData.name : cust.name} size={60} color={COLORS.brand} />

                {editMode ? <input value={editData.name ?? ""} onChange={set("name")} className="ap-customers-page-4" /> : <div className="ap-customers-page-5">{cust.name}</div>}

                {editMode ? <select value={editData.type ?? ""} onChange={set("type")} className="ap-customers-page-6">
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Industrial</option>
                  </select> : <div className="ap-customers-page-7">{cust.type}</div>}

                <div className="ap-customers-page-8">
                  {editMode ? <label className="ap-customers-page-9">
                      <input type="checkbox" checked={!!editData.amc} onChange={e => setEditData(p => ({
                  ...p,
                  amc: e.target.checked
                }))} />
                      AMC Active
                    </label> : <>
                      {cust.amc && <span className="ap-customers-page-10">
                          ✓ AMC Active
                        </span>}
                      <span className="ap-customers-page-11">
                        {cust.units} AC Units
                      </span>
                    </>}
                </div>
              </div>

              {/* Contact card */}
              <div style={{
            border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
            boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.05)"
          }} className="ap-customers-page-12">
                {editMode ? <div className="ap-customers-page-13">
                    {contactRows.map(({
                icon,
                key,
                label
              }) => <div key={key} className="ap-customers-page-14">
                        <span className="ap-customers-page-15">{icon}</span>
                        <input value={editData[key] ?? ""} onChange={set(key)} placeholder={label} className="ap-customers-page-16" />
                      </div>)}
                    <div className="ap-customers-page-17">
                      <span className="ap-customers-page-18">❄️</span>
                      <input value={editData.units ?? ""} onChange={set("units")} type="number" placeholder="AC Units" className="ap-customers-page-19" />
                    </div>
                  </div> : contactRows.map(({
              icon,
              key
            }) => <div key={key} className="ap-customers-page-20">
                      <span>{icon}</span>
                      <span className="ap-customers-page-21">{cust[key] || '—'}</span>
                    </div>)}
              </div>

              {/* Stats card */}
              <div className="ap-customers-page-22">
                {[["Total Jobs", cust.totalJobs], ["Total Spent", "₹" + cust.totalSpent.toLocaleString()], ["Last Service", cust.lastService]].map(([k, v]) => <div key={k} className="ap-customers-page-23">
                    <span className="ap-customers-page-24">{k}</span>
                    <span className="ap-customers-page-25">{v}</span>
                  </div>)}
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="ap-customers-page-26">
              <div className="ap-customers-page-27">
                <div className="ap-customers-page-28">Recent Jobs</div>

                {jobsLoading ? <div className="ap-customers-page-29">Loading jobs…</div> : custJobs.length === 0 ? <div className="ap-customers-page-30">No jobs found for this customer.</div> : custJobs.map(job => <div key={job._id ?? job.id} className="ap-customers-page-31">
                      <TypeTag type={job.type} />
                      <div className="ap-customers-page-32">
                        <div className="ap-customers-page-33">
                          {(job.issue ?? job.description ?? 'No description').slice(0, 55)}
                          {(job.issue ?? job.description ?? '').length > 55 ? "…" : ""}
                        </div>
                        <div className="ap-customers-page-34">
                          {job.scheduledDate ?fmtDateDMY(new Date(job.scheduledDate)) : job.date ?? '—'} · {job.techName ?? job.tech ?? 'Unassigned'}
                        </div>
                      </div>
                      <SBadge s={job.status} map={JOB_STATUS} />
                      <span className="ap-customers-page-35">
                        ₹{(job.amount ?? job.total ?? 0).toLocaleString()}
                      </span>
                    </div>)}
              </div>
            </div>

          </div>;
    }}
    </EditableDetailView>;

  // ── LIST VIEW ────────────────────────────────────────────────────────────────
  return <div className="fi ap-customers-page-36">

      {/* Header */}
      <div className="ap-customers-page-37">
        <SectionHdr title="Customers" sub={`${total} of ${customers.length} registered customers`} />
        <button onClick={() => openModal("new_customer")} className="ap-customers-page-38">
          + New Customer
        </button>
      </div>

      {/* Table */}
      <div className="ap-customers-page-39">

        {/* Search + filters + export */}
        <div className="ap-customers-page-40">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by name, phone, email…" />
          <FilterSelect value={activeFilters.type} onChange={val => setFilter("type", val)} options={["Residential", "Commercial"]} allLabel="All Types" />
          <FilterSelect value={activeFilters.amc} onChange={val => setFilter("amc", val)} options={["true", "false"]} allLabel="All AMC" renderOption={val => val === "true" ? "AMC Active" : "No AMC"} />
          <div className="ap-customers-page-41">
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        <div className="ap-customers-page-42">
          <table className="ap-customers-page-43">
            <Thead cols={["Customer", "Type", "Contact", "AC Units", "AMC", "Total Jobs", "Spent", "Last Service", ""]} />
            <tbody>
              {paginated.map((c, i) => <tr key={c._id} className="row ap-customers-page-44" onClick={() => {
              setInitialEditMode(false);
              setOpen(c._id);
            }} style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                  <td className="ap-customers-page-45">
                    <div className="ap-customers-page-46">
                      <Avatar name={c.name} size={32} />
                      <div>
                        <div className="ap-customers-page-47">{c.name}</div>
                        <div className="ap-customers-page-48">{c.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="ap-customers-page-49">
                    <span style={{
                  background: c.type === "Commercial" ? "#EFF6FF" : c.type === "Industrial" ? "#F5F3FF" : "#FFF7ED",
                  color: c.type === "Commercial" ? "#1D4ED8" : c.type === "Industrial" ? "#6D28D9" : "#C2410C"
                }} className="ap-customers-page-50">
                      {c.type}
                    </span>
                  </td>
                  <td className="ap-customers-page-51">
                    <div className="ap-customers-page-52">{c.phone}</div>
                    <div className="ap-customers-page-53">{c.email}</div>
                  </td>
                  <td className="ap-customers-page-54">
                    <span className="ap-customers-page-55">{c.units}</span>
                  </td>
                  <td className="ap-customers-page-56">
                    {c.amc ? <span className="ap-customers-page-57">✓ Active</span> : <span className="ap-customers-page-58">None</span>}
                  </td>
                  <td className="ap-customers-page-59">
                    <span className="ap-customers-page-60">{c.totalJobs}</span>
                  </td>
                  <td className="ap-customers-page-61">
                    <span className="ap-customers-page-62">₹{c.totalSpent.toLocaleString()}</span>
                  </td>
                  <td className="ap-customers-page-63">{c.lastService}</td>
                  <td onClick={e => e.stopPropagation()} className="ap-customers-page-64">
                    <ActionDropdown onView={() => {
                  setInitialEditMode(false);
                  setOpen(c._id);
                }} onEdit={() => {
                  setInitialEditMode(true);
                  setOpen(c._id);
                }} onDelete={() => setDeleteTarget(c._id)} />
                  </td>
                </tr>)}

              {paginated.length === 0 && <tr>
                  <td colSpan={9} className="ap-customers-page-65">
                    {q || activeFilters.type || activeFilters.amc ? "No customers match your search / filter." : "No customers yet. Click + New Customer to add one."}
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />
      </div>

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => handleDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} message="This customer data will be deleted." />
    </div>;
};
export default CustomersPage;