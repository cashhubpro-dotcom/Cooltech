import { useState, useEffect, useCallback } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { notificationsApi } from '../../services/api';
import { NOTIF_TYPE_CFG } from '../../data/mockData';

// ─── Column config for export ─────────────────────────────────────────────────
const NOTIF_COLUMNS = [{
  label: "ID",
  key: "id",
  width: 10,
  tdStyle: {
    fontFamily: "monospace",
    fontWeight: 700,
    fontSize: 11
  }
}, {
  label: "Title",
  key: "title",
  width: 32,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: "Type",
  key: "type",
  width: 14,
  format: v => v ? v.charAt(0).toUpperCase() + v.slice(1) : ''
}, {
  label: "Body",
  key: "body",
  width: 34,
  tdStyle: {
    fontSize: 11,
    color: "#555"
  },
  format: v => v
}, {
  label: "Time",
  key: "time",
  width: 12,
  tdStyle: {
    fontFamily: "monospace",
    fontSize: 11
  },
  format: v => v
}, {
  label: "Status",
  key: "read",
  width: 10,
  format: v => v ? "Read" : "Unread"
}];

// ─── Default fallback icon/color config (used when backend `type` isn't in NOTIF_TYPE_CFG) ──
const DEFAULT_TYPE_CFG = {
  bg: "var(--bg)",
  color: COLORS.muted
};

// ─── Relative time formatter (backend gives ISO timestamps, not "9:00 AM" strings) ──────────
const formatTime = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short'
  });
};

// ─── Map a raw backend notification doc into the shape this page renders ────────────────────
const normaliseNotif = n => ({
  id: n._id,
  title: n.title,
  body: n.message ?? '',
  type: n.type ?? 'system',
  icon: n.icon || NOTIF_TYPE_CFG[n.type]?.icon || '🔔',
  link: n.link || '',
  read: !!n.isRead,
  readAt: n.readAt,
  time: formatTime(n.createdAt),
  sourceId: n.sourceId,
  sourceModel: n.sourceModel,
  raw: n
});

// ─── NotificationsPage ────────────────────────────────────────────────────────
const NotificationsPage = ({
  setPage
}) => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readFilter, setReadFilter] = useState('');

  // ── Fetch from backend ────────────────────────────────────────────────────
  const fetchNotifs = useCallback(() => {
    setLoading(true);
    notificationsApi.list({
      limit: 100
    }).then(r => {
      setNotifs((r?.data ?? []).map(normaliseNotif));
      setError(null);
    }).catch(err => setError(err.message || 'Failed to load notifications.')).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    fetchNotifs();
    window.addEventListener('focus', fetchNotifs);
    return () => window.removeEventListener('focus', fetchNotifs);
  }, [fetchNotifs]);

  // ── Mark all read (optimistic + persisted) ────────────────────────────────
  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({
      ...n,
      read: true
    })));
    try {
      await notificationsApi.markAll();
    } catch (err) {
      // revert on failure
      fetchNotifs();
      alert(err.message || 'Failed to mark all as read.');
    }
  };

  // ── Mark one read (optimistic + persisted) ────────────────────────────────
  const markRead = async id => {
    const target = notifs.find(n => n.id === id);
    if (!target || target.read) return; // already read, skip the call
    setNotifs(prev => prev.map(n => n.id === id ? {
      ...n,
      read: true
    } : n));
    try {
      await notificationsApi.markRead(id);
    } catch (err) {
      // revert just this one on failure
      setNotifs(prev => prev.map(n => n.id === id ? {
        ...n,
        read: false
      } : n));
      alert(err.message || 'Failed to mark as read.');
    }
  };

  // ── Navigate to the relevant detail view ──────────────────────────────────
  // `link` is the only routing hint the backend gives us (schema has no
  // entityType/entityId pair — sourceModel/sourceId exist but link is what's
  // meant to be followed). This app uses a setPage(...) prop for navigation
  // rather than react-router, so we route through that.
  //
  // We don't know yet what shape `link` actually contains at runtime, so this
  // handles three cases defensively:
  //   1. A path-like string e.g. "/jobs/64f1..."      -> extract module + id, call setPage(module, id)
  //   2. A bare module name e.g. "Job" / "jobs"         -> setPage(module) only, no specific record
  //   3. Empty / missing link                           -> no-op, just marks read
  const openNotification = n => {
    markRead(n.id);
    if (!n.link) return;
    const path = n.link.startsWith('/') ? n.link.slice(1) : n.link;
    const segments = path.split('/').filter(Boolean);
    if (segments.length >= 2) {
      // "/jobs/64f1..." -> module="jobs", id="64f1..."
      const [module, id] = segments;
      setPage && setPage(module, id);
    } else if (segments.length === 1) {
      // bare module name, no id to deep-link to
      setPage && setPage(segments[0]);
    }
  };
  const unreadCount = notifs.filter(n => !n.read).length;

  // ── Search + filters ──────────────────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered
  } = useTableSearch(notifs, ['title', 'body', 'type'], {
    type: ''
  });

  // ── Apply boolean read filter on top of useTableSearch results ────────────
  const displayRows = filtered.filter(n => {
    if (readFilter === "unread") return !n.read;
    if (readFilter === "read") return n.read;
    return true;
  });

  // ── Export ────────────────────────────────────────────────────────────────
  const {
    exportProps
  } = useExport({
    title: "Notifications",
    filename: "notifications",
    template: "generic_list",
    subtitle: `Notifications Log · ${displayRows.length} records`,
    docId: "NOTIF-EXPORT",
    columns: NOTIF_COLUMNS,
    rows: displayRows
  });

  // Derive type options from live data (not static mock list)
  const typeOptions = [...new Set(notifs.map(n => n.type))].filter(Boolean).sort();
  return <div className="fu">
      {/* Header */}
      <div className="ap-notifications-page-1">
        <div>
          <div className="ap-notifications-page-2">Notifications</div>
          <div className="ap-notifications-page-3">
            {unreadCount} unread · {displayRows.length} of {notifs.length} total
          </div>
        </div>
        <button className="btn ap-notifications-page-4" onClick={markAllRead} disabled={unreadCount === 0} style={{
        cursor: unreadCount === 0 ? "default" : "pointer",
        opacity: unreadCount === 0 ? "0.5" : "1"
      }}>
          ✓ Mark all read
        </button>
      </div>

      {/* ── Search + Filter + Export bar ── */}
      <div className="ap-notifications-page-5">
        <TableSearchBar value={q} onChange={setQ} placeholder="Search notifications…" />
        <FilterSelect value={activeFilters.type} onChange={val => setFilter("type", val)} options={typeOptions} allLabel="All Types" />
        <FilterSelect value={readFilter} onChange={val => setReadFilter(val)} options={["unread", "read"]} allLabel="All Status" />
        <div className="ap-notifications-page-6">
          <ExportDropdown {...exportProps} />
        </div>
      </div>

      {/* Error state */}
      {error && <div className="ap-notifications-page-7">
          <span>{error}</span>
          <button onClick={fetchNotifs} className="ap-notifications-page-8">
            Retry
          </button>
        </div>}

      {/* Loading state */}
      {loading && <div className="ap-notifications-page-9">
          Loading notifications…
        </div>}

      {/* Notification list */}
      {!loading && <div className="ap-notifications-page-10">
          {displayRows.map(n => {
        const cfg = NOTIF_TYPE_CFG?.[n.type] || DEFAULT_TYPE_CFG;
        return <div key={n.id} onClick={() => openNotification(n)} style={{
          background: n.read ? "var(--white)" : "var(--xfffbf5)",
          border: `1px solid ${n.read ? COLORS.border : COLORS.brand + "40"}`,
          boxShadow: n.read ? "0 1px 3px rgba(0,0,0,.05)" : "0 2px 8px var(--xea580c15)"
        }} className="ap-notifications-page-11">
                <div style={{
            background: cfg.bg,
            border: `1.5px solid ${cfg.color}25`
          }} className="ap-notifications-page-12">
                  {n.icon}
                </div>
                <div className="ap-notifications-page-13">
                  <div className="ap-notifications-page-14">
                    <div style={{
                fontWeight: n.read ? "600" : "800"
              }} className="ap-notifications-page-15">{n.title}</div>
                    <span className="ap-notifications-page-16">{n.time}</span>
                  </div>
                  <div style={{
              marginBottom: n.read ? "0" : "8px"
            }} className="ap-notifications-page-17">{n.body}</div>
                  {!n.read && <div className="ap-notifications-page-18">
                      <div className="ap-notifications-page-19" />
                      <span className="ap-notifications-page-20">Unread · tap to view</span>
                    </div>}
                </div>
                <span style={{
            background: cfg.bg,
            color: cfg.color
          }} className="ap-notifications-page-21">
                  {n.type}
                </span>
              </div>;
      })}

          {displayRows.length === 0 && <div className="ap-notifications-page-22">
              No notifications match your search or filters.
            </div>}
        </div>}
    </div>;
};
export default NotificationsPage;