// src/admin/components/settings/OptionListPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Generic version of the table body from LeadSourcesPage.jsx: search, status
// filter, toggle switch, delete, "+ Add" modal. Any option-set (contract
// types, plans, ticket categories, PO types, ...) renders through this one
// component instead of a bespoke page per option-set.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024
  };
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────
const AddItemModal = ({
  label,
  placeholder,
  onClose,
  onSave
}) => {
  const [value, setValue] = useState('');
  const {
    isMobile
  } = useBreakpoint();
  return <div style={{
    padding: isMobile ? "16px" : "0"
  }} onClick={onClose} className="ap-option-list-panel-1">
      <div onClick={e => e.stopPropagation()} style={{
      padding: isMobile ? "20px 18px 18px" : "28px 28px 24px"
    }} className="ap-option-list-panel-2">
        <div className="ap-option-list-panel-3">
          <div className="ap-option-list-panel-4">Add {label}</div>
          <button onClick={onClose} className="ap-option-list-panel-5">×</button>
        </div>
        <div className="ap-option-list-panel-6">
          <div className="ap-option-list-panel-7">
            {label} <span className="ap-option-list-panel-8">*</span>
          </div>
          <input autoFocus value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) {
            onSave(value.trim());
            onClose();
          }
        }} placeholder={placeholder} style={{
          border: `1.5px solid ${value ? COLORS.brand : COLORS.border}`
        }} className="ap-option-list-panel-9" />
        </div>
        <div className="ap-option-list-panel-10">
          <button onClick={onClose} className="ap-option-list-panel-11">
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
        }} className="ap-option-list-panel-12">
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
  background: active ? "var(--success-text)" : "var(--border)"
}} className="ap-option-list-panel-13">
    <span style={{
    left: active ? "21px" : "3px"
  }} className="ap-option-list-panel-14" />
  </button>;

// ─── OptionListPanel ──────────────────────────────────────────────────────────
// Props:
//   title           — e.g. "Contract Types"
//   items           — [{ name, active }]  (from a useOptionSet-based hook)
//   loading         — bool
//   onAdd, onDelete, onToggle — handlers from the hook
//   addLabel        — label shown in the Add modal, e.g. "Contract Type"
//   addPlaceholder  — placeholder text for the Add modal input
//   itemIcon        — emoji shown per row (default 📌)
const OptionListPanel = ({
  title,
  items = [],
  loading = false,
  onAdd,
  onDelete,
  onToggle,
  addLabel = 'Option',
  addPlaceholder = 'Enter new option…',
  itemIcon = '📌'
}) => {
  const {
    isMobile,
    isTablet
  } = useBreakpoint();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = items.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).filter(s => statusFilter === 'all' ? true : statusFilter === 'active' ? s.active : !s.active);
  const activeCount = items.filter(s => s.active).length;
  const inactiveCount = items.filter(s => !s.active).length;
  const showAddedCol = !isMobile;
  if (loading) {
    return <div className="ap-option-list-panel-15">
        Loading {title.toLowerCase()}…
      </div>;
  }
  return <div className="ap-option-list-panel-16">

      {/* ── Toolbar row: count + add button ── */}
      <div style={{
      alignItems: isMobile ? "flex-start" : "center"
    }} className="ap-option-list-panel-17">
        <div className="ap-option-list-panel-18">
          {items.length} {title.toLowerCase()} · {activeCount} active · {inactiveCount} inactive
        </div>
        <button className="btn ap-option-list-panel-19" onClick={() => setShowAdd(true)} style={{
        padding: isMobile ? "8px 16px" : "9px 22px",
        fontSize: isMobile ? "12px" : "13px"
      }}>
          + Add {addLabel}
        </button>
      </div>

      {/* ── Table card ── */}
      <div className="ap-option-list-panel-20">

        {/* Toolbar */}
        <div style={{
        padding: isMobile ? "10px 12px" : "12px 18px",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "8px" : "10px",
        alignItems: isMobile ? "stretch" : "center",
        flexWrap: isTablet ? "wrap" : "nowrap"
      }} className="ap-option-list-panel-21">
          <div style={{
          flex: isMobile ? "none" : "1 1 180px",
          maxWidth: isMobile ? "100%" : "320px"
        }} className="ap-option-list-panel-22">
            <span className="ap-option-list-panel-23">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`} className="ap-option-list-panel-24" />
          </div>
          <div className="ap-option-list-panel-25">
            {[['all', `All (${items.length})`], ['active', `Active (${activeCount})`], ['inactive', `Inactive (${inactiveCount})`]].map(([k, l]) => <button key={k} onClick={() => setStatusFilter(k)} style={{
            padding: isMobile ? "5px 10px" : "5px 12px",
            fontSize: isMobile ? "11px" : "12px",
            background: statusFilter === k ? "var(--white)" : "transparent",
            color: statusFilter === k ? "var(--text-h1)" : "var(--text-muted)",
            border: `1px solid ${statusFilter === k ? COLORS.border : 'transparent'}`
          }} className="ap-option-list-panel-26">{l}</button>)}
          </div>
        </div>

        {/* Table */}
        <div className="ap-option-list-panel-27">
          <table style={{
          minWidth: isMobile ? "480px" : "560px"
        }} className="ap-option-list-panel-28">
            <thead>
              <tr className="ap-option-list-panel-29">
                {['#', 'Name', 'Status', 'Toggle', ...(showAddedCol ? ['Added'] : []), ''].map((col, i, arr) => <th key={i} style={{
                padding: isMobile ? "10px 12px" : "11px 16px",
                textAlign: i === arr.length - 1 ? "right" : "left"
              }} className="ap-option-list-panel-30">
                    {col}
                  </th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr>
                  <td colSpan={showAddedCol ? 6 : 5} className="ap-option-list-panel-31">
                    {search ? `No matches for "${search}"` : 'Nothing here yet.'}
                  </td>
                </tr> : filtered.map((item, i) => {
              const originalIndex = items.findIndex(s => s.name === item.name);
              return <tr key={item.name} className="row ap-option-list-panel-32" style={{
                background: item.active ? i % 2 === 0 ? COLORS.white : '#FAFAFA' : '#FAFAFA',
                opacity: item.active ? "1" : "0.65"
              }}>
                      <td style={{
                  padding: isMobile ? "11px 12px" : "13px 16px"
                }} className="ap-option-list-panel-33">
                        <span className="ap-option-list-panel-34">{originalIndex + 1}</span>
                      </td>
                      <td style={{
                  padding: isMobile ? "11px 12px" : "13px 16px"
                }}>
                        <div style={{
                    gap: isMobile ? "8px" : "10px"
                  }} className="ap-option-list-panel-35">
                          <div style={{
                      width: isMobile ? "26px" : "30px",
                      height: isMobile ? "26px" : "30px",
                      background: item.active ? "var(--brand-light)" : "var(--border)",
                      fontSize: isMobile ? "12px" : "14px"
                    }} className="ap-option-list-panel-36">
                            {itemIcon}
                          </div>
                          <span style={{
                      fontSize: isMobile ? "12px" : "13px",
                      color: item.active ? "var(--text-h1)" : "var(--text-muted)"
                    }} className="ap-option-list-panel-37">{item.name}</span>
                        </div>
                      </td>
                      <td style={{
                  padding: isMobile ? "11px 12px" : "13px 16px"
                }}>
                        <span style={{
                    fontSize: isMobile ? "10px" : "11px",
                    padding: isMobile ? "3px 8px" : "4px 10px",
                    background: item.active ? "var(--success-bg)" : "var(--border)",
                    color: item.active ? "var(--success-text)" : "var(--text-muted)",
                    border: `1px solid ${item.active ? '#BBF7D0' : '#E5E7EB'}`
                  }} className="ap-option-list-panel-38">
                          {item.active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td style={{
                  padding: isMobile ? "11px 12px" : "13px 16px"
                }}>
                        <ToggleSwitch active={item.active} onChange={() => onToggle(item.name)} />
                      </td>
                      {showAddedCol && <td className="ap-option-list-panel-39">
                          {new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                        </td>}
                      <td style={{
                  padding: isMobile ? "11px 12px" : "13px 16px"
                }} className="ap-option-list-panel-40">
                        <button className="btn ap-option-list-panel-41" onClick={() => setDeleteTarget({
                    name: item.name,
                    index: originalIndex
                  })} style={{
                    padding: isMobile ? "5px 10px" : "6px 14px",
                    fontSize: isMobile ? "11px" : "12px"
                  }}>
                          🗑{!isMobile && ' Delete'}
                        </button>
                      </td>
                    </tr>;
            })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && <div style={{
        padding: isMobile ? "8px 12px" : "10px 16px",
        fontSize: isMobile ? "11px" : "12px"
      }} className="ap-option-list-panel-42">
            <span>Showing {filtered.length} of {items.length}</span>
            <div className="ap-option-list-panel-43">
              <span className="ap-option-list-panel-44">{activeCount} active</span>
              <span className="ap-option-list-panel-45">{inactiveCount} inactive</span>
            </div>
          </div>}
      </div>

      {showAdd && <AddItemModal label={addLabel} placeholder={addPlaceholder} onClose={() => setShowAdd(false)} onSave={name => {
      onAdd(name);
      setShowAdd(false);
    }} />}

      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => {
      onDelete(deleteTarget.name);
      setDeleteTarget(null);
    }} onCancel={() => setDeleteTarget(null)} message={`"${deleteTarget?.name}" will be permanently removed.`} />
    </div>;
};
export default OptionListPanel;