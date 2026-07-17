import { EXP_STATUS } from '../../constants/statusMaps';
import { expensesApi, uploadApi, fileUrl } from '../../services/api';
import { useState, useEffect, useRef } from 'react';
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

// ─── Column config for export ─────────────────────────────────────────────────
// FIX: export "#" column now points at the human-readable expenseId, not the mongo _id
const EXPENSE_COLUMNS = [{
  label: '#',
  key: 'expenseId',
  width: 12
}, {
  label: 'Category',
  key: 'category',
  width: 14
}, {
  label: 'Technician',
  key: 'tech',
  width: 20,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Description',
  key: 'desc',
  width: 28
}, {
  label: 'Date',
  key: 'date',
  width: 14
}, {
  label: 'Amount',
  key: 'amount',
  width: 12,
  format: v => `₹${v.toLocaleString()}`,
  tdStyle: {
    fontFamily: 'monospace',
    fontWeight: 700
  }
}, {
  label: 'Receipt',
  key: 'receipt',
  width: 10,
  format: v => v ? 'Yes' : 'No'
}, {
  label: 'Status',
  key: 'status',
  width: 10,
  format: v => v.charAt(0).toUpperCase() + v.slice(1)
}, {
  label: 'Notes',
  key: 'notes',
  width: 24
}];

// ─── Category color map ───────────────────────────────────────────────────────
// FIX: added "Other" so the schema's full enum is represented consistently
const CAT_COLORS = {
  Fuel: {
    dot: "var(--xef9f27)",
    bg: "var(--xfaeeda)",
    color: "var(--x633806)"
  },
  Tools: {
    dot: "var(--x378add)",
    bg: "var(--xe6f1fb)",
    color: "var(--x042c53)"
  },
  Training: {
    dot: "var(--x7f77dd)",
    bg: "var(--xeeedfe)",
    color: "var(--x26215c)"
  },
  Office: {
    dot: "var(--x1d9e75)",
    bg: "var(--xe1f5ee)",
    color: "var(--x04342c)"
  },
  Miscellaneous: {
    dot: "var(--x888780)",
    bg: "var(--xf1efe8)",
    color: "var(--x2c2c2a)"
  },
  Parts: {
    dot: "var(--xd85a30)",
    bg: "var(--xfaece7)",
    color: "var(--x4a1b0c)"
  },
  Other: {
    dot: "var(--text-muted)",
    bg: "var(--xf1f1f1)",
    color: "var(--x26282b)"
  }
};
const CATEGORY_OPTIONS = Object.keys(CAT_COLORS);
const STATUS_OPTIONS = ['pending', 'approved', 'rejected'];
const STATUS_MAP = {
  approved: {
    dot: "var(--x639922)",
    bg: "var(--xeaf3de)",
    color: "var(--x3b6d11)",
    label: "Approved",
    icon: "✓"
  },
  pending: {
    dot: "var(--xef9f27)",
    bg: "var(--xfaeeda)",
    color: "var(--x633806)",
    label: "Pending",
    icon: "⏳"
  },
  rejected: {
    dot: "var(--xe24b4a)",
    bg: "var(--xfcebeb)",
    color: "var(--xa32d2d)",
    label: "Rejected",
    icon: "✕"
  }
};

// ─── FIX: normalize a raw API expense row into the shape the UI expects ───────
// Keeps the real mongo _id (needed for every write call) separate from the
// human-readable expenseId (EXP-101) that the UI should actually display.
const normalizeExpense = (e, idx) => ({
  ...e,
  _id: e._id ?? e.id ?? `tmp-${idx}`,
  expenseId: e.expenseId ?? `EXP-${idx}`,
  tech: typeof e.technician === 'object' && e.technician !== null ? e.technician?.name ?? e.techName ?? 'Unknown' : e.techName || e.tech || 'Unknown',
  amount: Number(e.amount) || 0,
  status: (e.status ?? 'pending').toLowerCase(),
  notes: e.notes ?? '',
  receiptUrl: e.receiptUrl ?? '',
  date: e.date ? String(e.date).slice(0, 10) : '',
  approvedByName: e.approvedBy && typeof e.approvedBy === 'object' ? e.approvedBy?.name ?? e.approvedBy?.username ?? e.approvedBy?.email ?? null : null
});

// ─── StatusBadge — read-only pill (status is now changed via Edit modal) ──────
const StatusBadge = ({
  status
}) => {
  const current = STATUS_MAP[status] || STATUS_MAP.pending;
  return <span style={{
    background: current.bg,
    color: current.color
  }} className="ap-expenses-page-1">
      <span style={{
      background: current.dot
    }} className="ap-expenses-page-2" />
      {current.label}
    </span>;
};

// ─── ActionsMenu — View / Edit / Delete, replaces the old inline status dropdown ──
const ActionsMenu = ({
  onView,
  onEdit,
  onDelete
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const item = (label, icon, onClick, danger) => <button onClick={e => {
    e.stopPropagation();
    setOpen(false);
    onClick();
  }} style={{
    color: danger ? "var(--xa32d2d)" : "var(--text-body)"
  }} onMouseEnter={e => e.currentTarget.style.background = danger ? "#FEF2F2" : "#F5F5F5"} onMouseLeave={e => e.currentTarget.style.background = "transparent"} className="ap-expenses-page-3">
      <span className="ap-expenses-page-4">{icon}</span>
      {label}
    </button>;
  return <div ref={ref} className="ap-expenses-page-5">
      <button onClick={e => {
      e.stopPropagation();
      setOpen(o => !o);
    }} aria-label="Row actions" className="ap-expenses-page-6">
        ⋮
      </button>

      {open && <div className="ap-expenses-page-7">
          {item("View", "👁", onView)}
          {item("Edit", "✎", onEdit)}
          {item("Delete", "🗑", onDelete, true)}
        </div>}
    </div>;
};

// ─── Generic modal shell ───────────────────────────────────────────────────────
const Modal = ({
  title,
  onClose,
  children,
  width = 480
}) => <div onClick={onClose} className="ap-expenses-page-8">
    <div onClick={e => e.stopPropagation()} style={{
    maxWidth: width
  }} className="ap-expenses-page-9">
      <div className="ap-expenses-page-10">
        <span className="ap-expenses-page-11">{title}</span>
        <button onClick={onClose} className="ap-expenses-page-12">✕</button>
      </div>
      <div className="ap-expenses-page-13">{children}</div>
    </div>
  </div>;
const Field = ({
  label,
  children
}) => <div className="ap-expenses-page-14">
    <label className="ap-expenses-page-15">
      {label}
    </label>
    {children}
  </div>;
const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  fontSize: 13,
  fontFamily: FONTS.sans,
  color: COLORS.body,
  boxSizing: "border-box"
};

// ─── View modal — every field the schema has, read-only ───────────────────────
const ViewExpenseModal = ({
  expense,
  onClose
}) => {
  const row = (label, value) => <div className="ap-expenses-page-16">
      <span className="ap-expenses-page-17">{label}</span>
      <span className="ap-expenses-page-18">{value ?? '—'}</span>
    </div>;
  return <Modal title={`Expense ${expense.expenseId}`} onClose={onClose}>
      {row("Category", expense.category)}
      {row("Technician", expense.tech)}
      {row("Description", expense.description)}
      {row("Amount", `₹${expense.amount.toLocaleString()}`)}
      {row("Date", expense.date)}
      {row("Receipt", expense.receipt ? "Yes" : "No")}
      {expense.receiptUrl && row("Receipt link", <a href={fileUrl(expense.receiptUrl)} target="_blank" rel="noreferrer">Open receipt</a>)}
      {row("Status", <StatusBadge status={expense.status} />)}
      {row("Approved by", expense.approvedByName)}
      {row("Notes", expense.notes)}
      {row("Created", expense.createdAt ? new Date(expense.createdAt).toLocaleString() : '—')}
      {row("Last updated", expense.updatedAt ? new Date(expense.updatedAt).toLocaleString() : '—')}
    </Modal>;
};

// ─── Edit modal — writes back to the backend via expensesApi.update ───────────
const EditExpenseModal = ({
  expense,
  onClose,
  onSaved
}) => {
  const [form, setForm] = useState({
    category: expense.category || 'Other',
    techName: expense.tech || '',
    description: expense.description || '',
    amount: expense.amount ?? 0,
    date: expense.date || '',
    receipt: !!expense.receipt,
    receiptUrl: expense.receiptUrl || '',
    status: expense.status || 'pending',
    notes: expense.notes || ''
  });
  const [receiptFile, setReceiptFile] = useState(null); // newly picked file, not yet uploaded
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const handleFileChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    set('receipt', true);
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let receiptUrl = form.receiptUrl;

      // Upload through the shared /api/upload endpoint (same one every other
      // modal in the app uses), then attach the returned URL to the expense.
      if (receiptFile) {
        const uploadRes = await uploadApi.upload(receiptFile);
        receiptUrl = (uploadRes.data ?? uploadRes)?.url ?? receiptUrl;
      }

      // NOTE: assumes expensesApi (from `crud('expenses')`) exposes an `update`
      // method that hits PUT /expenses/:id — adjust the method name below if
      // your crud() helper names it differently (e.g. `patch`).
      const updated = await expensesApi.update(expense._id, {
        ...form,
        receiptUrl,
        amount: Number(form.amount) || 0
      });
      onSaved(updated.data ?? updated);
    } catch (err) {
      setError(err?.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };
  return <Modal title={`Edit ${expense.expenseId}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Category">
          <select value={form.category} onChange={e => set('category', e.target.value)} className="ap-expenses-page-19">
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <Field label="Technician">
          <input value={form.techName} onChange={e => set('techName', e.target.value)} className="ap-expenses-page-19" />
        </Field>

        <Field label="Description">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} className="ap-expenses-page-20" />
        </Field>

        <div className="ap-expenses-page-21">
          <Field label="Amount (₹)">
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className="ap-expenses-page-19" />
          </Field>
          <Field label="Date">
            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="ap-expenses-page-19" />
          </Field>
        </div>

        <Field label="Status">
          <select value={form.status} onChange={e => set('status', e.target.value)} className="ap-expenses-page-19">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </Field>

        <Field label="Receipt attached">
          <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} className="ap-expenses-page-22" />
          <div onClick={() => fileInputRef.current?.click()} className="ap-expenses-page-23">
            {receiptFile ? <span className="ap-expenses-page-24">📎 {receiptFile.name} — click to replace</span> : form.receiptUrl ? <span className="ap-expenses-page-25">📎 Receipt on file — click to replace</span> : <span>Click to upload receipt (JPG, PDF)</span>}
          </div>
          {form.receiptUrl && !receiptFile && <a href={fileUrl(form.receiptUrl)} target="_blank" rel="noreferrer" className="ap-expenses-page-26">
              View current receipt
            </a>}
        </Field>

        <Field label="Notes">
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="ap-expenses-page-27" />
        </Field>

        {error && <div className="ap-expenses-page-28">{error}</div>}

        <div className="ap-expenses-page-29">
          <button type="button" onClick={onClose} className="ap-expenses-page-30">Cancel</button>
          <button type="submit" disabled={saving} style={{
          cursor: saving ? "default" : "pointer",
          opacity: saving ? "0.7" : "1"
        }} className="ap-expenses-page-31">{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </Modal>;
};

// ─── Delete confirm modal ──────────────────────────────────────────────────────
const DeleteExpenseModal = ({
  expense,
  onClose,
  onDeleted
}) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      // Soft delete: flips isDeleted → true on the backend instead of a hard
      // DELETE, so the record lands in Recently Deleted and can be restored.
      // Requires a PUT /expenses/:id/soft-delete route — see backend snippet.
      await expensesApi.softDelete(expense._id);
      onDeleted(expense._id);
    } catch (err) {
      setError(err?.message || 'Failed to delete.');
      setDeleting(false);
    }
  };
  return <Modal title="Delete expense" onClose={onClose} width={380}>
      <p className="ap-expenses-page-32">
        Move <strong>{expense.expenseId}</strong> ({expense.tech}, ₹{expense.amount.toLocaleString()}) to Recently Deleted? You can restore it from there later.
      </p>
      {error && <div className="ap-expenses-page-33">{error}</div>}
      <div className="ap-expenses-page-34">
        <button onClick={onClose} className="ap-expenses-page-35">Cancel</button>
        <button onClick={handleDelete} disabled={deleting} style={{
        cursor: deleting ? "default" : "pointer",
        opacity: deleting ? "0.7" : "1"
      }} className="ap-expenses-page-36">{deleting ? "Deleting…" : "Delete"}</button>
      </div>
    </Modal>;
};

// ─── CatTag (inline table cell) ───────────────────────────────────────────────
const CatTag = ({
  cat
}) => {
  const c = CAT_COLORS[cat] || {
    dot: COLORS.muted
  };
  return <div className="ap-expenses-page-37">
      <span style={{
      background: c.dot
    }} className="ap-expenses-page-38" />
      <span className="ap-expenses-page-39">{cat}</span>
    </div>;
};

// ─── Safe avatar name: handles undefined / single-word names ─────────────────
const avatarName = techName => {
  if (!techName || typeof techName !== 'string') return '?';
  const parts = techName.trim().split(' ');
  const first = parts[0] ?? '';
  const second = parts[1] ? parts[1][0] : '.';
  return `${first} ${second}`;
};

// ─── ExpensesPage ─────────────────────────────────────────────────────────────
const ExpensesPage = ({
  openModal
}) => {
  const [catFilter, setCatFilter] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [rowModal, setRowModal] = useState(null); // { type: 'view'|'edit'|'delete', expense }

  const loadExpenses = () => {
    // FIX: bumped limit so the KPI cards (computed client-side below) reflect
    // the real backend totals rather than an arbitrary page of 200. If you
    // expect more than this, add a dedicated /expenses/summary aggregate
    // endpoint instead of pulling every row.
    // isDeleted:false relies on `isDeleted` being added to filterFields in expRouter (see backend snippet)
    expensesApi.list({
      limit: 500,
      isDeleted: false
    }).then(r => {
      const data = (r.data ?? []).map(normalizeExpense);
      setExpenses(data);
    }).catch(() => {});
  };
  useEffect(() => {
    loadExpenses();
    // Other parts of the app (e.g. the Add Expense modal) call
    // window.dispatchEvent(new Event('focus')) after a save to signal
    // "something changed, please refresh" — listen for that here.
    window.addEventListener('focus', loadExpenses);
    return () => window.removeEventListener('focus', loadExpenses);
  }, []);
  const handleSaved = updatedRaw => {
    const updated = normalizeExpense(updatedRaw, 0);
    setExpenses(prev => prev.map(e => e._id === updated._id ? {
      ...e,
      ...updated
    } : e));
    setRowModal(null);
  };
  const handleDeleted = mongoId => {
    setExpenses(prev => prev.filter(e => e._id !== mongoId));
    setRowModal(null);
  };
  const totalApproved = expenses.filter(e => e.status === "approved").reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);
  const byCat = CATEGORY_OPTIONS.map(c => ({
    cat: c,
    total: expenses.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0),
    count: expenses.filter(e => e.category === c).length
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);
  const maxCatTotal = Math.max(...byCat.map(c => c.total), 1);

  // ── Search + filters ──────────────────────────────────────────────────────
  // FIX: search by expenseId (EXP-101) instead of the old internal `id` field
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchFiltered
  } = useTableSearch(expenses, ['tech', 'desc', 'category', 'expenseId'], {
    status: '',
    category: ''
  });
  const filtered = searchFiltered.filter(r => !activeFilters.status || r.status === activeFilters.status).filter(r => !activeFilters.category || r.category === activeFilters.category).filter(r => !catFilter || r.category === catFilter);

  // ── Pagination ────────────────────────────────────────────────────────────
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

  // ── Export ────────────────────────────────────────────────────────────────
  const {
    exportProps
  } = useExport({
    title: "Expenses",
    filename: "cooltech-expenses",
    template: "generic_list",
    subtitle: "AC Services Platform · Field & Office Expenses",
    docId: "expenses-EXPORT",
    columns: EXPENSE_COLUMNS,
    rows: filtered
  });
  return <div className="fi ap-expenses-page-40">
      <SectionHdr title="Expenses" sub="Track field and office expenses" action="+ Add Expense" onAction={() => openModal("new_expense")} />

      {/* ── KPI cards ── */}
      <div className="ap-expenses-page-41">
        <KCard label="Total This Month" value={`₹${(totalAll / 1000).toFixed(1)}K`} sub="all expenses" icon="💸" iconBg="#FFF7ED" color={COLORS.brand} delay="" />
        <KCard label="Approved" value={`₹${(totalApproved / 1000).toFixed(1)}K`} sub="cleared" icon="✅" iconBg="#F0FDF4" color="#16A34A" delay="1" />
        <KCard label="Pending Approval" value={`₹${(totalPending / 1000).toFixed(1)}K`} sub="awaiting review" icon="⏳" iconBg="#FFFBEB" color="#B45309" delay="2" />
        <KCard label="Expense Claims" value={expenses.length} sub="this month" icon="📋" iconBg="#EFF6FF" color="#0369A1" delay="3" />
      </div>

      {/* ── Single card: category summary + table ── */}
      <div className="ap-expenses-page-42">

        {/* ── Toolbar ── */}
        <div className="ap-expenses-page-43">
          <TableSearchBar value={q} onChange={setQ} placeholder="Search by technician, description, expense ID…" />

          <FilterSelect value={activeFilters.status} onChange={val => setFilter("status", val)} options={STATUS_OPTIONS} allLabel="All Statuses" />

          <FilterSelect value={activeFilters.category} onChange={val => setFilter("category", val)} options={CATEGORY_OPTIONS} allLabel="All Categories" />

          <div className="ap-expenses-page-44">
            <ExportDropdown {...exportProps} />
          </div>
        </div>

        {/* ── By Category summary row ── */}
        <div className="ap-expenses-page-45">
          <div className="ap-expenses-page-46">
            <span className="ap-expenses-page-47">By Category</span>
            <div className="ap-expenses-page-48">
              {catFilter && <button onClick={() => setCatFilter(null)} className="ap-expenses-page-49">✕ Clear filter</button>}
              <span className="ap-expenses-page-50">
                Total approved:&nbsp;
                <strong className="ap-expenses-page-51">₹{totalApproved.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* Category cards grid */}
          <div className="ap-expenses-page-52">
            {byCat.map(({
            cat,
            total,
            count
          }) => {
            const c = CAT_COLORS[cat] || {
              dot: COLORS.muted,
              bg: COLORS.bg,
              color: COLORS.muted
            };
            const isActive = catFilter === cat;
            return <div key={cat} onClick={() => setCatFilter(isActive ? null : cat)} style={{
              background: isActive ? c.bg : COLORS.white,
              border: `1px solid ${isActive ? c.dot + "55" : COLORS.border}`
            }} className="ap-expenses-page-53">
                  <div className="ap-expenses-page-54">
                    <span style={{
                  background: c.dot
                }} className="ap-expenses-page-55" />
                    <span style={{
                  color: isActive ? c.color : COLORS.body
                }} className="ap-expenses-page-56">{cat}</span>
                  </div>
                  <div className="ap-expenses-page-57">
                    <div style={{
                  width: `${total / maxCatTotal * 100}%`,
                  background: c.dot
                }} className="ap-expenses-page-58" />
                  </div>
                  <div className="ap-expenses-page-59">
                    <span className="ap-expenses-page-60">{count} claim{count > 1 ? "s" : ""}</span>
                    <span style={{
                  color: isActive ? c.color : COLORS.h2
                }} className="ap-expenses-page-61">₹{total.toLocaleString()}</span>
                  </div>
                </div>;
          })}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="ap-expenses-page-62">
          <table className="ap-expenses-page-63">
            <Thead cols={["#", "Category", "Technician", "Description", "Date", "Amount", "Receipt", "Status", ""]} />
            <tbody>
              {paginated.length === 0 && <tr>
                  <td colSpan={9} className="ap-expenses-page-64">
                    No expenses match your filters.
                  </td>
                </tr>}
              {paginated.map((e, i) =>
            // FIX: row key + API calls use the real mongo _id; the visible "#" is expenseId
            <tr key={e._id} className="row ap-expenses-page-65" style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>

                  <td className="ap-expenses-page-66">
                    <span className="ap-expenses-page-67">{e.expenseId}</span>
                  </td>

                  <td className="ap-expenses-page-68">
                    <CatTag cat={e.category} />
                  </td>

                  <td className="ap-expenses-page-69">
                    <div className="ap-expenses-page-70">
                      <Avatar name={avatarName(e.tech)} size={24} />
                      <span className="ap-expenses-page-71">{e.tech}</span>
                    </div>
                  </td>

                  <td className="ap-expenses-page-72">
                    {e.description}
                  </td>

                  <td className="ap-expenses-page-73">
                    {e.date}
                  </td>

                  <td className="ap-expenses-page-74">
                    <span className="ap-expenses-page-75">₹{e.amount.toLocaleString()}</span>
                  </td>

                  <td className="ap-expenses-page-76">
                    {e.receipt ? <span className="ap-expenses-page-77">
                          <span className="ap-expenses-page-78">✓</span>
                        </span> : <span className="ap-expenses-page-79">
                          <span className="ap-expenses-page-80">✕</span>
                        </span>}
                  </td>

                  <td className="ap-expenses-page-81">
                    <StatusBadge status={e.status} />
                  </td>

                  <td className="ap-expenses-page-82">
                    <ActionsMenu onView={() => setRowModal({
                  type: 'view',
                  expense: e
                })} onEdit={() => setRowModal({
                  type: 'edit',
                  expense: e
                })} onDelete={() => setRowModal({
                  type: 'delete',
                  expense: e
                })} />
                  </td>

                </tr>)}
            </tbody>
          </table>
        </div>

        {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}

      </div>

      {rowModal?.type === 'view' && <ViewExpenseModal expense={rowModal.expense} onClose={() => setRowModal(null)} />}
      {rowModal?.type === 'edit' && <EditExpenseModal expense={rowModal.expense} onClose={() => setRowModal(null)} onSaved={handleSaved} />}
      {rowModal?.type === 'delete' && <DeleteExpenseModal expense={rowModal.expense} onClose={() => setRowModal(null)} onDeleted={handleDeleted} />}
    </div>;
};
export default ExpensesPage;