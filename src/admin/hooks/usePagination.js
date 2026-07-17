import { useState, useMemo, useEffect } from 'react';

/**
 * usePagination
 *
 * @param {Array}  data      — the filtered array (output of useTableSearch)
 * @param {number} pageSize  — rows per page (default 10)
 *
 * @returns {Object}
 *   paginated   — current page's slice of data  → use this for .map()
 *   page        — current page number (1-based)
 *   totalPages  — total number of pages
 *   pageSize    — active rows-per-page value
 *   setPage     — jump to a page
 *   setPageSize — change rows per page (resets to page 1)
 *   from        — first row index shown  (e.g. 1)
 *   to          — last  row index shown  (e.g. 10)
 *   total       — total rows in data
 */
export function usePagination(data, initialPageSize = 10) {
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSizeRaw] = useState(initialPageSize);

  // reset to page 1 whenever the dataset changes (search / filter)
  useEffect(() => { setPage(1); }, [data.length]);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const safePage   = Math.min(page, totalPages);

  const paginated  = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, safePage, pageSize]);

  const from = data.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to   = Math.min(safePage * pageSize, data.length);

  const setPageSize = (size) => {
    setPageSizeRaw(Number(size));
    setPage(1);
  };

  return {
    paginated, page: safePage, totalPages,
    pageSize, setPage, setPageSize,
    from, to, total: data.length,
  };
}