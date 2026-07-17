import { customerTypesApi } from '../services/api';
// CustomerTypesPage.jsx
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../constants/tokens';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';

// ─── Add Type Modal ───────────────────────────────────────────────────────────
const AddTypeModal = ({
  onClose,
  onSave
}) => {
  const [value, setValue] = useState('');
  return <div onClick={onClose} className="ap-customer-types-page-1">
      <div onClick={e => e.stopPropagation()} className="ap-customer-types-page-2">
        <div className="ap-customer-types-page-3">
          <div className="ap-customer-types-page-4">Add Customer Type</div>
          <button onClick={onClose} className="ap-customer-types-page-5">×</button>
        </div>
        <div className="ap-customer-types-page-6">
          <div className="ap-customer-types-page-7">
            Customer Type <span className="ap-customer-types-page-8">*</span>
          </div>
          <input autoFocus value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) {
            onSave(value.trim());
            onClose();
          }
        }} placeholder="e.g. Industrial, Government, Hospital…" style={{
          border: `1.5px solid ${value ? COLORS.brand : COLORS.border}`
        }} className="ap-customer-types-page-9" />
        </div>
        <div className="ap-customer-types-page-10">
          <button onClick={onClose} className="ap-customer-types-page-11">
            Close
          </button>
          <button onClick={() => {
          if (value.trim()) {
            onSave(value.trim());
            onClose();
          }
        }} disabled={!value.trim()} style={{
          background: value.trim() ? "linear-gradient(135deg,var(--brand),var(--brand-dark))" : "var(--border)",
          color: value.trim() ? "white" : "var(--text-muted)",
          cursor: value.trim() ? "pointer" : "not-allowed"
        }} className="ap-customer-types-page-12">
            ✓ Save
          </button>
        </div>
      </div>
    </div>;
};

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const ToggleSwitch = ({
  active,
  onChange
}) => <button onClick={onChange} title={active ? 'Click to deactivate' : 'Click to activate'} style={{
  background: active ? "var(--success-text)" : "var(--xd62626)"
}} className="ap-customer-types-page-13">
    <span style={{
    left: active ? "21px" : "3px"
  }} className="ap-customer-types-page-14" />
  </button>;

// ─── CustomerTypesPage ────────────────────────────────────────────────────────
// Props:
//   types         — array of { name, active } objects
//   onAdd(name)   — adds a new active type
//   onDelete(name)— removes type by name
//   onToggle(name)— flips active flag by name
const CustomerTypesPage = ({
  types,
  onAdd,
  onDelete,
  onToggle
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = types.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).filter(t => statusFilter === 'all' ? true : statusFilter === 'active' ? t.active : !t.active);
  const activeCount = types.filter(t => t.active).length;
  const inactiveCount = types.filter(t => !t.active).length;
  return <div className="fi ap-customer-types-page-15">

      {/* ── Header ── */}
      <div className="ap-customer-types-page-16">
        <div>
          <div className="ap-customer-types-page-17">Customer Types</div>
          <div className="ap-customer-types-page-18">
            {types.length} type{types.length !== 1 ? 's' : ''} · {activeCount} active · {inactiveCount} inactive
          </div>
        </div>
        <button className="btn ap-customer-types-page-19" onClick={() => setShowAdd(true)}>
          + Add Type
        </button>
      </div>

      {/* ── Info banner ── */}
      <div className="ap-customer-types-page-20">
        ℹ️ Types added here appear in the <strong>Type</strong> dropdown when adding a customer.
        Only <strong>Active</strong> types show in the dropdown. Inactive types are hidden but not deleted.
      </div>

      {/* ── Table ── */}
      <div className="ap-customer-types-page-21">

        {/* ── Toolbar ── */}
        <div className="ap-customer-types-page-22">
          <div className="ap-customer-types-page-23">
            <span className="ap-customer-types-page-24">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search types…" className="ap-customer-types-page-25" />
          </div>
          <div className="ap-customer-types-page-26">
            {[['all', `All (${types.length})`], ['active', `Active (${activeCount})`], ['inactive', `Inactive (${inactiveCount})`]].map(([k, l]) => <button key={k} onClick={() => setStatusFilter(k)} style={{
            background: statusFilter === k ? "var(--white)" : "transparent",
            color: statusFilter === k ? "var(--text-h1)" : "var(--text-muted)",
            border: `1px solid ${statusFilter === k ? COLORS.border : 'transparent'}`
          }} className="ap-customer-types-page-27">{l}</button>)}
          </div>
        </div>

        <table className="ap-customer-types-page-28">
          <thead>
            <tr className="ap-customer-types-page-29">
              {['#', 'Type Name', 'Status', 'Action', 'Added', ''].map((col, i) => <th key={i} style={{
              textAlign: i === 5 ? "right" : "left"
            }} className="ap-customer-types-page-30">
                  {col}
                </th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? <tr>
                <td colSpan={6} className="ap-customer-types-page-31">
                  {search ? `No types matching "${search}"` : 'No types found.'}
                </td>
              </tr> : filtered.map((type, i) => {
            const originalIndex = types.findIndex(t => t.name === type.name);
            return <tr key={type.name} style={{
              background: type.active ? i % 2 === 0 ? COLORS.white : '#FAFAFA' : '#FAFAFA',
              opacity: type.active ? "1" : "0.65"
            }} className="ap-customer-types-page-32">
                    {/* # */}
                    <td className="ap-customer-types-page-33">
                      <span className="ap-customer-types-page-34">{originalIndex + 1}</span>
                    </td>

                    {/* Name */}
                    <td className="ap-customer-types-page-35">
                      <div className="ap-customer-types-page-36">
                        <div style={{
                    background: type.active ? "var(--brand-light)" : "var(--border)"
                  }} className="ap-customer-types-page-37">
                          👤
                        </div>
                        <span style={{
                    color: type.active ? "var(--text-h1)" : "var(--text-muted)"
                  }} className="ap-customer-types-page-38">
                          {type.name}
                        </span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="ap-customer-types-page-39">
                      <span style={{
                  background: type.active ? "var(--success-bg)" : "var(--border)",
                  color: type.active ? "var(--success-text)" : "var(--xd62626)",
                  border: `1px solid ${type.active ? '#BBF7D0' : '#E5E7EB'}`
                }} className="ap-customer-types-page-40">
                        {type.active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>

                    {/* Toggle */}
                    <td className="ap-customer-types-page-41">
                      <ToggleSwitch active={type.active} onChange={() => onToggle(type.name)} />
                    </td>

                    {/* Added */}
                    <td className="ap-customer-types-page-42">
                      {new Date().toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
                    </td>

                    {/* Delete */}
                    <td className="ap-customer-types-page-43">
                      <button className="btn ap-customer-types-page-44" onClick={() => setDeleteTarget({
                  name: type.name,
                  index: originalIndex
                })}>
                        🗑 Delete
                      </button>
                    </td>
                  </tr>;
          })}
          </tbody>
        </table>

        {/* Footer */}
        {filtered.length > 0 && <div className="ap-customer-types-page-45">
            <span>Showing {filtered.length} of {types.length} types</span>
            <div className="ap-customer-types-page-46">
              <span className="ap-customer-types-page-47">{activeCount} active</span>
              <span className="ap-customer-types-page-48">{inactiveCount} inactive</span>
            </div>
          </div>}
      </div>

      {showAdd && <AddTypeModal onClose={() => setShowAdd(false)} onSave={name => {
      onAdd(name);
      setShowAdd(false);
    }} />}

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => {
      onDelete(deleteTarget.name);
      setDeleteTarget(null);
    }} onCancel={() => setDeleteTarget(null)} message={`"${deleteTarget?.name}" will be permanently removed from Customer Types.`} />
    </div>;
};

// ─── API Wrapper ──────────────────────────────────────────────────────────────
const CustomerTypesPageWrapper = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const flash = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };
  useEffect(() => {
    customerTypesApi.list({
      limit: 500
    }).then(res => {
      const raw = res?.data || res || [];
      setTypes(raw.map(t => ({
        ...t,
        name: t.name,
        active: t.isActive !== false
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  const handleAdd = async name => {
    try {
      const created = await customerTypesApi.create({
        name,
        isActive: true
      });
      setTypes(p => [...p, {
        ...created,
        name: created.name,
        active: true
      }]);
      flash('Type added.');
    } catch (e) {
      flash(e.message || 'Failed to add.');
    }
  };
  const handleDelete = async name => {
    const type = types.find(t => t.name === name); // ← add this lookup
    if (!type?._id) return flash('Type not found.');
    try {
      await customerTypesApi.remove(type._id);
      setTypes(p => p.filter(t => t._id !== type._id));
      flash('Deleted.');
    } catch (e) {
      flash(e.message || 'Delete failed.');
    }
  };
  const handleToggle = async name => {
    const type = types.find(t => t.name === name); // ← add this lookup
    if (!type?._id) return;
    try {
      await customerTypesApi.update(type._id, {
        isActive: !type.active
      });
      setTypes(p => p.map(t => t._id === type._id ? {
        ...t,
        active: !t.active
      } : t));
    } catch (e) {
      flash(e.message || 'Update failed.');
    }
  };
  if (loading) return <div className="ap-customer-types-page-49">Loading…</div>;
  return <>
      {toast && <div className="ap-customer-types-page-50">
          {toast}
        </div>}
      <CustomerTypesPage types={types} onAdd={handleAdd} onDelete={handleDelete} onToggle={handleToggle} />
    </>;
};
export default CustomerTypesPageWrapper;