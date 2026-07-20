import { useState, useEffect, useCallback } from 'react';
import { noticesApi } from '../services/api';
import { COLORS } from '../constants/tokens';
import { KCard, SectionHdr } from '../components/ui/Cards';
import { fmtDateDMY } from '../../shared/formatDate';
const NOTICE_META = {
  Operational: {
    icon: '⚙️',
    color: "var(--text-muted)",
    bg: "var(--bg)"
  },
  Policy: {
    icon: '📋',
    color: "var(--info-text)",
    bg: "var(--info-bg)"
  },
  Holiday: {
    icon: '🎉',
    color: "var(--purple-text)",
    bg: "var(--purple-bg)"
  },
  Training: {
    icon: '📚',
    color: "var(--warning)",
    bg: "var(--warning-bg)"
  },
  Achievement: {
    icon: '🏆',
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  General: {
    icon: '📢',
    color: "var(--info-text)",
    bg: "var(--info-bg)"
  },
  HR: {
    icon: '👥',
    color: "var(--purple-text)",
    bg: "var(--purple-bg)"
  },
  Finance: {
    icon: '💰',
    color: "var(--warning)",
    bg: "var(--warning-bg)"
  },
  Safety: {
    icon: '🦺',
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  Urgent: {
    icon: '🚨',
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  }
};
const PRIORITY_COLOR = {
  low: "var(--text-muted)",
  medium: "var(--warning)",
  high: "var(--brand)",
  urgent: "var(--danger-text)",
  Normal: "var(--text-muted)",
  High: "var(--danger-text)"
};

// ─── NoticeBoardPage ──────────────────────────────────────────────────────────
const NoticeBoardPage = ({
  openModal
}) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const flash = msg => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await noticesApi.list({
        limit: 100
      });
      setNotices(res?.data || res || []);
    } catch {
      flash('Failed to load notices.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever openModal triggers a save (focus event dispatched by App.jsx)
  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);
  const handlePin = async notice => {
    try {
      const updated = await noticesApi.pin(notice._id);
      setNotices(p => p.map(n => n._id === notice._id ? updated : n));
    } catch {
      flash('Failed to pin.');
    }
  };
  const handleDelete = async id => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await noticesApi.remove(id);
      setNotices(p => p.filter(n => n._id !== id));
      flash('Deleted.');
    } catch {
      flash('Delete failed.');
    }
  };
  const pinned = notices.filter(n => n.isPinned || n.pinned);
  const regular = notices.filter(n => !(n.isPinned || n.pinned));
  return <div className="fi ap-notice-board-page-1">

      {/* Toast */}
      {toast && <div className="ap-notice-board-page-2">
          {toast}
        </div>}

      {/* Header */}
      <div className="ap-notice-board-page-3">
        <SectionHdr title="Notice Board" sub={`${notices.length} notices · ${pinned.length} pinned`} />
        <button className="btn ap-notice-board-page-4" onClick={() => openModal('new_notice')}>
          + Post Notice
        </button>
      </div>

      {loading && <div className="ap-notice-board-page-5">Loading…</div>}

      {/* Pinned */}
      {!loading && pinned.length > 0 && <div>
          <div className="ap-notice-board-page-6">📌 Pinned Notices</div>
          <div className="ap-notice-board-page-7">
            {pinned.map(n => {
          const meta = NOTICE_META[n.type || n.category] || NOTICE_META.General;
          return <div key={n._id} style={{
            background: meta.bg,
            border: `1.5px solid ${meta.color}30`
          }} className="ap-notice-board-page-8">
                  <div className="ap-notice-board-page-9">📌</div>
                  <div className="ap-notice-board-page-10">
                    <div className="ap-notice-board-page-11">{meta.icon}</div>
                    <div>
                      <div className="ap-notice-board-page-12">{n.title}</div>
                      <div className="ap-notice-board-page-13">
                        <span style={{
                    color: meta.color,
                    border: `1px solid ${meta.color}30`
                  }} className="ap-notice-board-page-14">{n.type || n.category}</span>
                        {(n.priority === 'high' || n.priority === 'urgent' || n.priority === 'High') && <span className="ap-notice-board-page-15">High Priority</span>}
                        <span className="ap-notice-board-page-16">{fmtDateDMY(n.date || new Date(n.createdAt))}</span>
                      </div>
                    </div>
                  </div>
                  <p className="ap-notice-board-page-17">{n.content}</p>
                  {n.author && <div className="ap-notice-board-page-18">👤 {n.author} · For: {n.target === 'all' ? 'All Staff' : n.target || 'All'}</div>}
                  <div className="ap-notice-board-page-19">
                    <button className="btn ap-notice-board-page-20" onClick={() => openModal('new_notice', {
                id: n._id
              })}>Edit</button>
                    <button className="btn ap-notice-board-page-21" onClick={() => handlePin(n)}>Unpin</button>
                    <button className="btn ap-notice-board-page-22" onClick={() => handleDelete(n._id)}>Delete</button>
                  </div>
                </div>;
        })}
          </div>
        </div>}

      {/* All Notices */}
      {!loading && <div>
          <div className="ap-notice-board-page-23">All Notices</div>
          {regular.length === 0 && !loading && <div className="ap-notice-board-page-24">
              No notices yet. Click <strong>+ Post Notice</strong> to add one.
            </div>}
          <div className="ap-notice-board-page-25">
            {regular.map(n => {
          const meta = NOTICE_META[n.type || n.category] || NOTICE_META.General;
          return <div key={n._id} className="ap-notice-board-page-26">
                  <div style={{
              background: meta.bg
            }} className="ap-notice-board-page-27">{meta.icon}</div>
                  <div className="ap-notice-board-page-28">
                    <div className="ap-notice-board-page-29">
                      <span className="ap-notice-board-page-30">{n.title}</span>
                      <span style={{
                  background: meta.bg,
                  color: meta.color
                }} className="ap-notice-board-page-31">{n.type || n.category}</span>
                      {n.priority && n.priority !== 'low' && n.priority !== 'Normal' && <span style={{
                  color: PRIORITY_COLOR[n.priority] || COLORS.muted
                }} className="ap-notice-board-page-32">{n.priority}</span>}
                      <span className="ap-notice-board-page-33">{fmtDateDMY(n.date || new Date(n.createdAt))}</span>
                    </div>
                    <p className="ap-notice-board-page-34">{(n.content || '').slice(0, 140)}{(n.content || '').length > 140 ? '…' : ''}</p>
                    {n.author && <div className="ap-notice-board-page-35">
                        <span className="ap-notice-board-page-36">👤 {n.author} · For: {n.target === 'all' ? 'All' : 'Technicians'}</span>
                      </div>}
                  </div>
                  <div className="ap-notice-board-page-37">
                    <button className="btn ap-notice-board-page-38" onClick={() => openModal('new_notice', {
                id: n._id
              })}>Edit</button>
                    <button className="btn ap-notice-board-page-39" onClick={() => handlePin(n)}>Pin</button>
                    <button className="btn ap-notice-board-page-40" onClick={() => handleDelete(n._id)}>Del</button>
                  </div>
                </div>;
        })}
          </div>
        </div>}
    </div>;
};
export default NoticeBoardPage;