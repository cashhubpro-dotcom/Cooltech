import { COLORS, FONTS } from '../../constants/tokens';

/**
 * Props — all come straight from usePagination():
 *   page, totalPages, setPage,
 *   pageSize, setPageSize,
 *   from, to, total
 *   pageSizeOptions  {number[]}  default [10, 25, 50]
 */
const Pagination = ({
  page,
  totalPages,
  setPage,
  pageSize,
  setPageSize,
  from,
  to,
  total,
  pageSizeOptions = [10, 25, 50]
}) => {
  if (total === 0) return null;

  // build page number array with "..." gaps
  const pages = () => {
    if (totalPages <= 7) return Array.from({
      length: totalPages
    }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (page >= totalPages - 3) return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', page - 1, page, page + 1, '…', totalPages];
  };
  const btnStyle = active => ({
    minWidth: 32,
    height: 32,
    padding: "0 8px",
    borderRadius: 7,
    border: `1px solid ${active ? COLORS.brand : COLORS.border}`,
    background: active ? COLORS.brandL : COLORS.white,
    color: active ? COLORS.brand : COLORS.body,
    fontSize: 12,
    fontWeight: active ? 700 : 400,
    cursor: "pointer",
    fontFamily: FONTS.mono,
    transition: "all .12s"
  });
  const arrowStyle = disabled => ({
    ...btnStyle(false),
    color: disabled ? COLORS.faint : COLORS.body,
    cursor: disabled ? "default" : "pointer"
  });
  return <div className="ap-pagination-1">

      {/* Left: "Showing X–Y of Z" + rows-per-page */}
      <div className="ap-pagination-2">
        <span className="ap-pagination-3">
          Showing <strong className="ap-pagination-4">{from}–{to}</strong> of <strong className="ap-pagination-5">{total}</strong>
        </span>
        <select value={pageSize} onChange={e => setPageSize(e.target.value)} className="ap-pagination-6">
          {pageSizeOptions.map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {/* Right: prev + page numbers + next */}
      <div className="ap-pagination-7">
        <button onClick={() => setPage(page - 1)} disabled={page === 1} style={arrowStyle(page === 1)}>
          ‹
        </button>

        {pages().map((p, i) => p === '…' ? <span key={`e${i}`} className="ap-pagination-8">…</span> : <button key={p} onClick={() => setPage(p)} style={btnStyle(p === page)}>{p}</button>)}

        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} style={arrowStyle(page === totalPages)}>
          ›
        </button>
      </div>

    </div>;
};
export default Pagination;