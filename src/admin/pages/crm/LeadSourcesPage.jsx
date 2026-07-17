// LeadSourcesPage.jsx — fully responsive for mobile & tablet
import { useState, useEffect } from 'react';
import { useLeadSources } from '../../hooks/useLeadSources';
import { COLORS, FONTS } from '../../constants/tokens';
import { SectionHdr } from '../../components/ui/Cards';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';

// ─── Breakpoint Hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width
  };
}

// ─── Add Source Modal ─────────────────────────────────────────────────────────
const AddSourceModal = ({
  onClose,
  onSave
}) => {
  const [value, setValue] = useState('');
  const {
    isMobile
  } = useBreakpoint();
  return <div style={{
    padding: isMobile ? "16px" : "0"
  }} onClick={onClose} className="ap-lead-sources-page-1">
      <div onClick={e => e.stopPropagation()} style={{
      padding: isMobile ? "20px 18px 18px" : "28px 28px 24px"
    }} className="ap-lead-sources-page-2">
        <div className="ap-lead-sources-page-3">
          <div className="ap-lead-sources-page-4">Add Lead Source</div>
          <button onClick={onClose} className="ap-lead-sources-page-5">×</button>
        </div>
        <div className="ap-lead-sources-page-6">
          <div className="ap-lead-sources-page-7">
            Lead Source <span className="ap-lead-sources-page-8">*</span>
          </div>
          <input autoFocus value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) {
            onSave(value.trim());
            onClose();
          }
        }} placeholder="e.g. Instagram, Trade Fair…" style={{
          border: `1.5px solid ${value ? COLORS.brand : COLORS.border}`
        }} className="ap-lead-sources-page-9" />
        </div>
        <div className="ap-lead-sources-page-10">
          <button onClick={onClose} className="ap-lead-sources-page-11">
            Close
          </button>
          <button onClick={() => {
          if (value.trim()) {
            onSave(value.trim());
            onClose();
          }
        }} disabled={!value.trim()} style={{
          background: value.trim() ? "linear-gradient(135deg,var(--info-text),var(--info-text))" : "var(--border)",
          color: value.trim() ? "white" : "var(--text-muted)",
          cursor: value.trim() ? "pointer" : "not-allowed"
        }} className="ap-lead-sources-page-12">
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
}} className="ap-lead-sources-page-13">
    <span style={{
    left: active ? "21px" : "3px"
  }} className="ap-lead-sources-page-14" />
  </button>;

// ─── LeadSourcesPage ──────────────────────────────────────────────────────────
const LeadSourcesPage = ({
  sources,
  onAdd,
  onDelete,
  onToggle
}) => {
  const {
    isMobile,
    isTablet
  } = useBreakpoint();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const filtered = sources.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).filter(s => statusFilter === 'all' ? true : statusFilter === 'active' ? s.active : !s.active);
  const activeCount = sources.filter(s => s.active).length;
  const inactiveCount = sources.filter(s => !s.active).length;

  // On mobile, hide "Added" column to save space
  const showAddedCol = !isMobile;
  return <div className="fi ap-lead-sources-page-15">

      {/* ── Header ── */}
      <div style={{
      alignItems: isMobile ? "flex-start" : "center"
    }} className="ap-lead-sources-page-16">
        <SectionHdr title="Lead Sources" sub={`${sources.length} source${sources.length !== 1 ? 's' : ''} · ${activeCount} active · ${inactiveCount} inactive`} />
        <button className="btn ap-lead-sources-page-17" onClick={() => setShowAdd(true)} style={{
        padding: isMobile ? "8px 16px" : "9px 22px",
        fontSize: isMobile ? "12px" : "13px"
      }}>
          + Add Source
        </button>
      </div>

      {/* ── Info banner ── */}
      <div style={{
      padding: isMobile ? "10px 12px" : "11px 16px",
      fontSize: isMobile ? "11px" : "12px"
    }} className="ap-lead-sources-page-18">
        ℹ️ Sources added here appear in the <strong>Lead Source</strong> dropdown when creating a lead.
        Only <strong>Active</strong> sources show in the dropdown. Inactive sources are hidden but not deleted.
      </div>

      {/* ── Table Card ── */}
      <div className="ap-lead-sources-page-19">

        {/* ── Toolbar ── */}
        <div style={{
        padding: isMobile ? "10px 12px" : "12px 18px",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "8px" : "10px",
        alignItems: isMobile ? "stretch" : "center",
        flexWrap: isTablet ? "wrap" : "nowrap"
      }} className="ap-lead-sources-page-20">

          {/* Search */}
          <div style={{
          flex: isMobile ? "none" : "1 1 180px",
          maxWidth: isMobile ? "100%" : "320px"
        }} className="ap-lead-sources-page-21">
            <span className="ap-lead-sources-page-22">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sources…" className="ap-lead-sources-page-23" />
          </div>

          {/* Status filter tabs — scrollable on very small screens */}
          <div className="ap-lead-sources-page-24">
            {[['all', `All (${sources.length})`], ['active', `Active (${activeCount})`], ['inactive', `Inactive (${inactiveCount})`]].map(([k, l]) => <button key={k} onClick={() => setStatusFilter(k)} style={{
            padding: isMobile ? "5px 10px" : "5px 12px",
            fontSize: isMobile ? "11px" : "12px",
            background: statusFilter === k ? "var(--white)" : "transparent",
            color: statusFilter === k ? "var(--text-h1)" : "var(--text-muted)",
            border: `1px solid ${statusFilter === k ? COLORS.border : 'transparent'}`
          }} className="ap-lead-sources-page-25">{l}</button>)}
          </div>
        </div>

        {/* ── Scrollable table wrapper ── */}
        <div className="ap-lead-sources-page-26">
          <table style={{
          minWidth: isMobile ? "480px" : "560px"
        }} className="ap-lead-sources-page-27">
            <thead>
              <tr className="ap-lead-sources-page-28">
                {['#', 'Source Name', 'Status', 'Toggle', ...(showAddedCol ? ['Added'] : []), ''].map((col, i, arr) => <th key={i} style={{
                padding: isMobile ? "10px 12px" : "11px 16px",
                textAlign: i === arr.length - 1 ? "right" : "left"
              }} className="ap-lead-sources-page-29">
                    {col}
                  </th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr>
                  <td colSpan={showAddedCol ? 6 : 5} className="ap-lead-sources-page-30">
                    {search ? `No sources matching "${search}"` : 'No sources found.'}
                  </td>
                </tr> : filtered.map((source, i) => {
              const originalIndex = sources.findIndex(s => s.name === source.name);
              return <tr key={source.name} className="row ap-lead-sources-page-31" style={{
                background: source.active ? i % 2 === 0 ? COLORS.white : '#FAFAFA' : '#FAFAFA',
                opacity: source.active ? "1" : "0.65"
              }}>
                      {/* # */}
                      <td style={{
                  padding: isMobile ? "11px 12px" : "13px 16px"
                }} className="ap-lead-sources-page-32">
                        <span className="ap-lead-sources-page-33">{originalIndex + 1}</span>
                      </td>

                      {/* Name */}
                      <td style={{
                  padding: isMobile ? "11px 12px" : "13px 16px"
                }}>
                        <div style={{
                    gap: isMobile ? "8px" : "10px"
                  }} className="ap-lead-sources-page-34">
                          <div style={{
                      width: isMobile ? "26px" : "30px",
                      height: isMobile ? "26px" : "30px",
                      background: source.active ? "var(--brand-light)" : "var(--border)",
                      fontSize: isMobile ? "12px" : "14px"
                    }} className="ap-lead-sources-page-35">
                            📌
                          </div>
                          <span style={{
                      fontSize: isMobile ? "12px" : "13px",
                      color: source.active ? "var(--text-h1)" : "var(--text-muted)"
                    }} className="ap-lead-sources-page-36">
                            {source.name}
                          </span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td style={{
                  padding: isMobile ? "11px 12px" : "13px 16px"
                }}>
                        <span style={{
                    fontSize: isMobile ? "10px" : "11px",
                    padding: isMobile ? "3px 8px" : "4px 10px",
                    background: source.active ? "var(--success-bg)" : "var(--border)",
                    color: source.active ? "var(--success-text)" : "var(--text-muted)",
                    border: `1px solid ${source.active ? '#BBF7D0' : '#E5E7EB'}`
                  }} className="ap-lead-sources-page-37">
                          {source.active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>

                      {/* Toggle */}
                      <td style={{
                  padding: isMobile ? "11px 12px" : "13px 16px"
                }}>
                        <ToggleSwitch active={source.active} onChange={() => onToggle(source.name)} />
                      </td>

                      {/* Added — hidden on mobile */}
                      {showAddedCol && <td className="ap-lead-sources-page-38">
                          {new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                        </td>}

                      {/* Delete */}
                      <td style={{
                  padding: isMobile ? "11px 12px" : "13px 16px"
                }} className="ap-lead-sources-page-39">
                        <button className="btn ap-lead-sources-page-40" onClick={() => setDeleteTarget({
                    name: source.name,
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

        {/* ── Footer ── */}
        {filtered.length > 0 && <div style={{
        padding: isMobile ? "8px 12px" : "10px 16px",
        fontSize: isMobile ? "11px" : "12px"
      }} className="ap-lead-sources-page-41">
            <span>Showing {filtered.length} of {sources.length} sources</span>
            <div className="ap-lead-sources-page-42">
              <span className="ap-lead-sources-page-43">{activeCount} active</span>
              <span className="ap-lead-sources-page-44">{inactiveCount} inactive</span>
            </div>
          </div>}
      </div>

      {/* ── Add modal ── */}
      {showAdd && <AddSourceModal onClose={() => setShowAdd(false)} onSave={name => {
      onAdd(name);
      setShowAdd(false);
    }} />}

      {/* ── Delete confirm ── */}
      <DeleteConfirmModal isOpen={!!deleteTarget} onConfirm={() => {
      onDelete(deleteTarget.name);
      setDeleteTarget(null);
    }} onCancel={() => setDeleteTarget(null)} message={`"${deleteTarget?.name}" will be permanently removed from Lead Sources.`} />
    </div>;
};

// ─── API Wrapper ──────────────────────────────────────────────────────────────
const LeadSourcesPageWrapper = () => {
  const {
    sources,
    loading,
    addSource,
    deleteSource,
    toggleSource
  } = useLeadSources();
  if (loading) return <div className="ap-lead-sources-page-45">
      Loading lead sources…
    </div>;
  return <LeadSourcesPage sources={sources} onAdd={addSource} onDelete={deleteSource} onToggle={toggleSource} />;
};
export default LeadSourcesPageWrapper;