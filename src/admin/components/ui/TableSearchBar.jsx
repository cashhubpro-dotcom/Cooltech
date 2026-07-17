// src/components/ui/TableSearchBar.jsx
import { COLORS, FONTS } from '../../constants/tokens';
const TableSearchBar = ({
  value,
  onChange,
  placeholder = "Search…",
  style = {}
}) => <div className="ap-table-search-bar-1">

    {/* Search icon */}
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke={value ? COLORS.brand : COLORS.faint} strokeWidth="1.8" strokeLinecap="round" className="ap-table-search-bar-2">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10" y1="10" x2="14" y2="14" />
    </svg>

    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
    border: `1px solid ${value ? COLORS.brand : COLORS.border}`,
    ...style
  }} className="ap-table-search-bar-3" />

  </div>;
export default TableSearchBar;