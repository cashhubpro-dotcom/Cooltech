// A styled <select> that highlights orange when an active filter is set
import { COLORS, FONTS } from '../../constants/tokens';

/**
 * Props:
 *   value      {string}    controlled value from activeFilters[field]
 *   onChange   {fn}        (val) => setFilter(field, val)
 *   options    {string[]}  list of option values
 *   allLabel   {string}    label for the "all" option, e.g. "All Types"
 */
const FilterSelect = ({
  value,
  onChange,
  options,
  allLabel
}) => {
  const active = !!value;
  return <select value={value} onChange={e => onChange(e.target.value)} style={{
    border: `1px solid ${active ? COLORS.brand : COLORS.border}`,
    background: active ? "var(--brand-light)" : "var(--white)",
    color: active ? "var(--brand)" : "var(--text-body)",
    fontWeight: active ? "600" : "400"
  }} className="ap-filter-select-1">
      <option value="">{allLabel}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>;
};
export default FilterSelect;