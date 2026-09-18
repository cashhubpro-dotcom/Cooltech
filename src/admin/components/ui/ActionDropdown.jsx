import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * ActionDropdown — reusable 3-dot action menu (Worksuite-style)
 *
 * Props:
 *   onView   — function called when View is clicked   (required)
 *   onEdit   — function called when Edit is clicked   (optional, omit to hide)
 *   onDelete — function called when Delete is clicked (optional, omit to hide)
 *   extraItems — array of { label, icon, onClick, danger? } for custom actions
 *
 * Usage:
 *   <ActionDropdown
 *     onView={() => navigate(`/quotations/${q.id}`)}
 *     onEdit={() => openModal('edit_quotation', { id: q.id })}
 *     onDelete={() => openModal('delete_quotation', { id: q.id })}
 *   />
 *
 * NOTE: the menu is rendered in a portal (document.body) and positioned via
 * the trigger button's bounding rect. This keeps it out of any scrollable
 * ancestor (e.g. a table's `overflow-x: auto` wrapper), which would otherwise
 * clip the menu and/or force an unwanted scrollbar on that ancestor.
 */

const MENU_WIDTH = 160;   // keep in sync with .action-menu min-width + padding
const MENU_MARGIN = 4;    // gap between trigger and menu

const ActionDropdown = ({ onView, onEdit, onDelete, extraItems = [] }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, openUp: false });
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const computePosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + MENU_MARGIN + 8 && rect.top > menuHeight;

    let left = rect.right - MENU_WIDTH;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));

    const top = openUp ? rect.top - MENU_MARGIN : rect.bottom + MENU_MARGIN;

    setPos({ top, left, openUp });
  }, []);

  // Close on outside click (checks both the trigger wrap and the portalled menu)
  useEffect(() => {
    const handler = (e) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Recompute position right after the menu mounts (so we know its real height),
  // and keep it in sync with scroll/resize while open.
  useLayoutEffect(() => {
    if (!open) return;
    computePosition();

    const onScrollOrResize = () => computePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, computePosition]);

  const handle = (fn) => (e) => {
    e.stopPropagation();
    setOpen(false);
    fn && fn();
  };

  const builtIn = [
    onView   && { label: 'View',   icon: '👁',  onClick: onView,   danger: false },
    onEdit   && { label: 'Edit',   icon: '✏️', onClick: onEdit,   danger: false },
    onDelete && { label: 'Delete', icon: '🗑',  onClick: onDelete, danger: true  },
  ].filter(Boolean);

  const items = [...builtIn, ...extraItems];

  return (
    <div className="action-wrap" ref={wrapRef}>
      <button
        ref={triggerRef}
        className="action-trigger"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        aria-label="Row actions"
        aria-haspopup="true"
        aria-expanded={open}
      >
        ⋮
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className={`action-menu${pos.openUp ? ' action-menu--up' : ''}`}
          style={{ position: 'fixed', top: pos.top, left: pos.left, ...(pos.openUp ? { transform: 'translateY(-100%)' } : {}) }}
          role="menu"
        >
          {items.map((item, i) => (
            <button
              key={i}
              className={`action-item${item.danger ? ' action-item--danger' : ''}`}
              onClick={handle(item.onClick)}
              role="menuitem"
            >
              <span className="action-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ActionDropdown;