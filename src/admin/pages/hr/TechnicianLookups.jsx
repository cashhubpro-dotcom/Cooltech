// pages/settings/TechnicianLookups.jsx
// Full CRUD — reads from and writes to /api/technician-lookups
// On first load, seeds defaults automatically if the DB is empty.

import { useState, useEffect, useCallback } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { technicianLookupsApi } from '../../services/api';
const TABS = [{
  key: 'role',
  label: 'Roles',
  icon: '🪪',
  singular: 'Role',
  placeholder: 'e.g. Master Technician, HVAC Engineer…'
}, {
  key: 'department',
  label: 'Departments',
  icon: '🏢',
  singular: 'Department',
  placeholder: 'e.g. Solar HVAC, Ducting…'
}, {
  key: 'employmentType',
  label: 'Employment Types',
  icon: '💼',
  singular: 'Employment Type',
  placeholder: 'e.g. Seasonal, Sub-contractor…'
}, {
  key: 'reportingTo',
  label: 'Reporting To',
  icon: '👤',
  singular: 'Manager',
  placeholder: 'e.g. Regional Manager, GM…'
}, {
  key: 'vehicleType',
  label: 'Vehicle Types',
  icon: '🏍️',
  singular: 'Vehicle Type',
  placeholder: 'e.g. Electric Bike, Three-Wheeler…'
}, {
  key: 'bank',
  label: 'Banks',
  icon: '🏦',
  singular: 'Bank',
  placeholder: 'e.g. Federal Bank, IDFC First…'
}];
const Toggle = ({
  active,
  onChange
}) => <div onClick={onChange} style={{
  background: active ? "var(--success-text)" : "var(--border)"
}} className="ap-technician-lookups-1">
    <div style={{
    left: active ? "23px" : "3px"
  }} className="ap-technician-lookups-2" />
  </div>;
const AddModal = ({
  tab,
  onClose,
  onSave,
  saving
}) => {
  const [value, setValue] = useState('');
  const valid = value.trim().length > 0;
  return <div onClick={onClose} className="ap-technician-lookups-3">
      <div onClick={e => e.stopPropagation()} className="ap-technician-lookups-4">
        <div className="ap-technician-lookups-5">
          <div className="ap-technician-lookups-6">
            <div className="ap-technician-lookups-7">{tab.icon}</div>
            <div className="ap-technician-lookups-8">Add {tab.singular}</div>
          </div>
          <button onClick={onClose} className="ap-technician-lookups-9">×</button>
        </div>
        <div className="ap-technician-lookups-10">
          <div className="ap-technician-lookups-11">
            {tab.singular} Name <span className="ap-technician-lookups-12">*</span>
          </div>
          <input autoFocus value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && valid && !saving && onSave(value.trim())} placeholder={tab.placeholder} style={{
          border: `1.5px solid ${valid ? COLORS.brand : COLORS.border}`,
          boxShadow: valid ? "0 0 0 3px var(--xea580c18)" : "none"
        }} className="ap-technician-lookups-13" />
          {valid && <div className="ap-technician-lookups-14">✓ "{value.trim()}" will be added</div>}
        </div>
        <div className="ap-technician-lookups-15">
          <button onClick={onClose} className="ap-technician-lookups-16">Cancel</button>
          <button onClick={() => valid && !saving && onSave(value.trim())} disabled={!valid || saving} style={{
          background: valid ? "linear-gradient(135deg,var(--brand),var(--brand-dark))" : "var(--border)",
          color: valid ? "var(--white)" : "var(--text-muted)",
          cursor: valid && !saving ? "pointer" : "not-allowed"
        }} className="ap-technician-lookups-17">
            {saving ? 'Saving…' : '✓ Save'}
          </button>
        </div>
      </div>
    </div>;
};
const RenameInput = ({
  value,
  onCommit,
  onCancel
}) => {
  const [draft, setDraft] = useState(value);
  return <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => {
    if (e.key === 'Enter' && draft.trim()) onCommit(draft.trim());
    if (e.key === 'Escape') onCancel();
  }} onBlur={() => draft.trim() && draft.trim() !== value ? onCommit(draft.trim()) : onCancel()} className="ap-technician-lookups-18" />;
};
const TechnicianLookups = () => {
  const [activeTab, setActiveTab] = useState('role');
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const fetchAll = useCallback(async (seedIfEmpty = false) => {
    try {
      setLoading(true);
      setError('');
      const res = await technicianLookupsApi.list();
      const g = res?.grouped || {};
      if (seedIfEmpty && Object.keys(g).length === 0) {
        await technicianLookupsApi.seed();
        const res2 = await technicianLookupsApi.list();
        setGrouped(res2?.grouped || {});
      } else {
        setGrouped(g);
      }
    } catch (err) {
      setError(err.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchAll(true);
  }, [fetchAll]);
  const tab = TABS.find(t => t.key === activeTab);
  const list = grouped[activeTab] || [];
  const filtered = list.filter(item => {
    const ms = item.value.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'all' ? true : filter === 'active' ? item.isActive : !item.isActive;
    return ms && mf;
  });
  const total = list.length;
  const active = list.filter(i => i.isActive).length;
  const inactive = total - active;
  const handleAdd = async value => {
    setSaving(true);
    try {
      const doc = await technicianLookupsApi.create({
        category: activeTab,
        value,
        order: list.length + 1,
        isActive: true
      });
      setGrouped(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), doc]
      }));
      setShowAdd(false);
    } catch (err) {
      setError(err.message || 'Failed to add.');
    } finally {
      setSaving(false);
    }
  };
  const handleToggle = async doc => {
    setGrouped(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(i => i._id === doc._id ? {
        ...i,
        isActive: !i.isActive
      } : i)
    }));
    try {
      await technicianLookupsApi.update(doc._id, {
        isActive: !doc.isActive
      });
    } catch (err) {
      setGrouped(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(i => i._id === doc._id ? {
          ...i,
          isActive: doc.isActive
        } : i)
      }));
      setError(err.message || 'Failed to update.');
    }
  };
  const handleRename = async (doc, newValue) => {
    setRenamingId(null);
    if (newValue === doc.value) return;
    setGrouped(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(i => i._id === doc._id ? {
        ...i,
        value: newValue
      } : i)
    }));
    try {
      await technicianLookupsApi.update(doc._id, {
        value: newValue
      });
    } catch (err) {
      setGrouped(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(i => i._id === doc._id ? {
          ...i,
          value: doc.value
        } : i)
      }));
      setError(err.message || 'Failed to rename.');
    }
  };
  const handleDelete = async doc => {
    setGrouped(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(i => i._id !== doc._id)
    }));
    try {
      await technicianLookupsApi.remove(doc._id);
    } catch (err) {
      setGrouped(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), doc]
      }));
      setError(err.message || 'Failed to delete.');
    }
  };
  const handleReset = async () => {
    setConfirmReset(false);
    setSaving(true);
    try {
      const res = await technicianLookupsApi.reset(activeTab);
      setGrouped(prev => ({
        ...prev,
        [activeTab]: res.data
      }));
    } catch (err) {
      setError(err.message || 'Failed to reset.');
    } finally {
      setSaving(false);
    }
  };
  return <div style={{
    background: COLORS.bg ?? '#F9FAFB'
  }} className="ap-technician-lookups-19">

      <div className="ap-technician-lookups-20">
        <div>
          <h1 className="ap-technician-lookups-21">Technician Lookups</h1>
          <p className="ap-technician-lookups-22">Manage dropdown options used in the Add Technician form. Changes save instantly.</p>
        </div>
      </div>

      {error && <div className="ap-technician-lookups-23">
          {error}
          <button onClick={() => setError('')} className="ap-technician-lookups-24">×</button>
        </div>}

      {/* Tab strip */}
      <div className="ap-technician-lookups-25">
        {TABS.map(t => {
        const isSel = t.key === activeTab;
        const cnt = (grouped[t.key] || []).length;
        return <button key={t.key} onClick={() => {
          setActiveTab(t.key);
          setSearch('');
          setFilter('all');
          setRenamingId(null);
        }} style={{
          fontWeight: isSel ? "700" : "500",
          color: isSel ? "var(--brand)" : "var(--text-muted)",
          borderBottom: isSel ? "2.5px solid var(--brand)" : "2.5px solid transparent"
        }} className="ap-technician-lookups-26">
              {t.icon} {t.label}
              <span style={{
            background: isSel ? "var(--xea580c18)" : "var(--border)",
            color: isSel ? "var(--brand)" : "var(--text-muted)"
          }} className="ap-technician-lookups-27">{cnt}</span>
            </button>;
      })}
      </div>

      {/* Panel */}
      <div className="ap-technician-lookups-28">

        {/* Panel header */}
        <div className="ap-technician-lookups-29">
          <div>
            <div className="ap-technician-lookups-30">{tab.icon} {tab.label}</div>
            <div className="ap-technician-lookups-31">{total} options · {active} active · {inactive} inactive</div>
          </div>
          <div className="ap-technician-lookups-32">
            {!confirmReset ? <button onClick={() => setConfirmReset(true)} onMouseEnter={e => {
            e.currentTarget.style.color = '#DC2626';
            e.currentTarget.style.borderColor = '#DC2626';
          }} onMouseLeave={e => {
            e.currentTarget.style.color = COLORS.muted;
            e.currentTarget.style.borderColor = COLORS.border;
          }} className="ap-technician-lookups-33">↺ Reset defaults</button> : <div className="ap-technician-lookups-34">
                <span className="ap-technician-lookups-35">Reset to defaults?</span>
                <button onClick={handleReset} className="ap-technician-lookups-36">Yes</button>
                <button onClick={() => setConfirmReset(false)} className="ap-technician-lookups-37">No</button>
              </div>}
            <button onClick={() => setShowAdd(true)} className="ap-technician-lookups-38">
              + Add {tab.singular}
            </button>
          </div>
        </div>

        {/* Search + filter */}
        <div className="ap-technician-lookups-39">
          <div className="ap-technician-lookups-40">
            <span className="ap-technician-lookups-41">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab.label.toLowerCase()}…`} className="ap-technician-lookups-42" />
          </div>
          <div className="ap-technician-lookups-43">
            {[['all', `All (${total})`], ['active', `Active (${active})`], ['inactive', `Inactive (${inactive})`]].map(([val, lbl]) => <button key={val} onClick={() => setFilter(val)} style={{
            background: filter === val ? "var(--brand)" : "var(--border)",
            color: filter === val ? "var(--white)" : "var(--text-muted)"
          }} className="ap-technician-lookups-44">
                {lbl}
              </button>)}
          </div>
        </div>

        {/* Table */}
        <div className="ap-technician-lookups-45">
          {loading ? <div className="ap-technician-lookups-46">Loading…</div> : <table className="ap-technician-lookups-47">
              <thead>
                <tr className="ap-technician-lookups-48">
                  {['#', 'OPTION NAME', 'STATUS', 'ACTIVE', ''].map((h, i) => <th key={i} style={{
                textAlign: i === 4 ? "right" : "left"
              }} className="ap-technician-lookups-49">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={5} className="ap-technician-lookups-50">
                    {search ? `No results for "${search}"` : `No ${filter !== 'all' ? filter + ' ' : ''}options yet.`}
                  </td></tr> : filtered.map((item, idx) => <tr key={item._id} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} className="ap-technician-lookups-51">

                    <td className="ap-technician-lookups-52">{idx + 1}</td>

                    <td className="ap-technician-lookups-53">
                      <div className="ap-technician-lookups-54">
                        <div className="ap-technician-lookups-55">{tab.icon}</div>
                        {renamingId === item._id ? <RenameInput value={item.value} onCommit={v => handleRename(item, v)} onCancel={() => setRenamingId(null)} /> : <div className="ap-technician-lookups-56">
                            <span className="ap-technician-lookups-57">{item.value}</span>
                            <button onClick={() => setRenamingId(item._id)} title="Rename" onMouseEnter={e => e.currentTarget.style.color = COLORS.brand} onMouseLeave={e => e.currentTarget.style.color = COLORS.muted} className="ap-technician-lookups-58">✎</button>
                          </div>}
                      </div>
                    </td>

                    <td className="ap-technician-lookups-59">
                      <span style={{
                  background: item.isActive ? "var(--success-bg)" : "var(--border)",
                  color: item.isActive ? "var(--success-text)" : "var(--text-faint)",
                  border: `1px solid ${item.isActive ? '#BBF7D0' : '#E5E7EB'}`
                }} className="ap-technician-lookups-60">
                        <span style={{
                    background: item.isActive ? "var(--success-text)" : "var(--text-faint)"
                  }} className="ap-technician-lookups-61" />
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="ap-technician-lookups-62">
                      <Toggle active={item.isActive} onChange={() => handleToggle(item)} />
                    </td>

                    <td className="ap-technician-lookups-63">
                      <button onClick={() => handleDelete(item)} onMouseEnter={e => {
                  e.currentTarget.style.background = '#DC2626';
                  e.currentTarget.style.color = '#fff';
                }} onMouseLeave={e => {
                  e.currentTarget.style.background = '#FEF2F2';
                  e.currentTarget.style.color = '#DC2626';
                }} className="ap-technician-lookups-64">
                        🗑 Delete
                      </button>
                    </td>
                  </tr>)}
              </tbody>
            </table>}
        </div>

        {/* Footer */}
        <div className="ap-technician-lookups-65">
          <span>Showing {filtered.length} of {total} {tab.label.toLowerCase()}</span>
          <span><span className="ap-technician-lookups-66">{active} active</span>{' · '}<span className="ap-technician-lookups-67">{inactive} inactive</span></span>
        </div>
      </div>

      {showAdd && <AddModal tab={tab} onClose={() => setShowAdd(false)} onSave={handleAdd} saving={saving} />}
    </div>;
};
export default TechnicianLookups;