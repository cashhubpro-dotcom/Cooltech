import { useState, useMemo } from 'react';

/**
 * @param {Array}    data       full data array
 * @param {string[]} searchKeys fields searched by the text input
 * @param {Object}   filters    { fieldKey: selectedValue }
 *                              pass {} if no dropdowns needed
 *
 * @returns {{ q, setQ, filters, setFilter, filtered }}
 *
 * setFilter('type', 'Repair')   — select a value
 * setFilter('type', '')         — reset to "all"
 */
export function useTableSearch(data, searchKeys, filters = {}) {
  const [q, setQ] = useState('');
  const [activeFilters, setActiveFilters] = useState(filters);

  const setFilter = (key, value) =>
    setActiveFilters(prev => ({ ...prev, [key]: value }));

  const filtered = useMemo(() => {
    let rows = data;

    // 1. text search across searchKeys
    if (q.trim()) {
      const lower = q.toLowerCase();
      rows = rows.filter(row =>
        searchKeys.some(key => {
          const val = row[key];
          return val != null && String(val).toLowerCase().includes(lower);
        })
      );
    }

    // 2. dropdown filters (skip if value is empty / "all")
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (!value) return;
      rows = rows.filter(row =>
        String(row[key]).toLowerCase() === value.toLowerCase()
      );
    });

    return rows;
  }, [data, searchKeys, q, activeFilters]);

  return { q, setQ, activeFilters, setFilter, filtered };
}