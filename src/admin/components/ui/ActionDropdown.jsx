import { useState, useEffect, useRef } from 'react';

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
 */

const ActionDropdown = ({ onView, onEdit, onDelete, extraItems = [] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    <div className="action-wrap" ref={ref}>
      <button
        className="action-trigger"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        aria-label="Row actions"
        aria-haspopup="true"
        aria-expanded={open}
      >
        ⋮
      </button>

      {open && (
        <div className="action-menu" role="menu">
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
        </div>
      )}
    </div>
  );
};

export default ActionDropdown;