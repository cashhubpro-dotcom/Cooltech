// PostSchedulerPage.jsx — Full featured: detail view, edit modal, delete confirm,
// file upload, status update, schedule modal — all wired to MERN backend

import { useState, useEffect, useRef } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge } from '../../components/ui/Badges';
import { Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';

// ─── API — delegates entirely to your project's existing api.js ───────────────
// api.js already exports postsApi = { ...crud('posts'), publish, stats }
// and uses fetch-based req() with auth headers baked in.
// We import it directly and add the two missing sub-calls (updateStatus, uploadMedia)
// using the same req() pattern — no axios needed.
import { postsApi as _p } from '../../services/api';

// Your api.js BASE + auth-header fetch helper — replicated here for the two
// extra calls that aren't in api.js yet.
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(localStorage.getItem('admin_token') ? {
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`
  } : {})
});
const req = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? {
      body: JSON.stringify(body)
    } : {})
  });
  if (res.status === 401) {
    localStorage.clear();
    window.location.href = '/';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};
const postsApi = {
  // ── From your api.js postsApi (crud + publish) ────────────────────────────
  list: (params = {}) => _p.list(params),
  create: data => _p.create(data),
  update: (id, data) => _p.update(id, data),
  remove: id => _p.remove(id),
  publish: id => _p.publish(id),
  // ── Extra: PUT /posts/:id/status ─────────────────────────────────────────
  // Add to api.js postsApi if you prefer:
  //   updateStatus: (id, body) => req('PUT', `/posts/${id}/status`, body),
  updateStatus: (id, body) => req('PUT', `/posts/${id}/status`, body),
  // ── Extra: POST /upload (multipart) ──────────────────────────────────────
  // Uses raw fetch (no JSON header) so multipart boundary is set automatically.
  uploadMedia: async file => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: localStorage.getItem('admin_token') ? {
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`
      } : {},
      body: fd
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }
};

// ─── Shared meta ─────────────────────────────────────────────────────────────
const CHANNEL_META = {
  facebook: {
    emoji: '📘',
    color: "var(--brand-facebook)",
    bg: "var(--info-bg)",
    label: 'Facebook'
  },
  instagram: {
    emoji: '📸',
    color: "var(--brand-instagram)",
    bg: "var(--xfff0f6)",
    label: 'Instagram'
  },
  twitter: {
    emoji: '🐦',
    color: "var(--brand-twitter)",
    bg: "var(--xe8f5fd)",
    label: 'Twitter'
  },
  linkedin: {
    emoji: '💼',
    color: "var(--brand-linkedin)",
    bg: "var(--xeef5fb)",
    label: 'LinkedIn'
  },
  youtube: {
    emoji: '▶️',
    color: "var(--xff0000)",
    bg: "var(--xfff0f0)",
    label: 'YouTube'
  },
  google: {
    emoji: '⭐',
    color: "var(--brand-google-yellow)",
    bg: "var(--warning-bg)",
    label: 'Google'
  },
  whatsapp: {
    emoji: '💬',
    color: "var(--brand-whatsapp)",
    bg: "var(--xedfbf3)",
    label: 'WhatsApp'
  }
};
const POST_STATUS = {
  published: {
    label: 'Published',
    color: "var(--success-text)",
    bg: "var(--success-border)"
  },
  scheduled: {
    label: 'Scheduled',
    color: "var(--info-text)",
    bg: "var(--info-border)"
  },
  draft: {
    label: 'Draft',
    color: "var(--text-faint)",
    bg: "var(--bg)"
  },
  failed: {
    label: 'Failed',
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  }
};
const POST_TYPES = {
  Promotion: {
    color: "var(--brand)",
    bg: "var(--brand-light)"
  },
  Educational: {
    color: "var(--info-text)",
    bg: "var(--info-bg)"
  },
  Testimonial: {
    color: "var(--purple-text)",
    bg: "var(--purple-bg)"
  },
  Tips: {
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  Offer: {
    color: "var(--warning-text)",
    bg: "var(--warning-bg)"
  },
  Event: {
    color: "var(--x0891b2)",
    bg: "var(--xecfeff)"
  },
  Update: {
    color: "var(--text-body)",
    bg: "var(--bg)"
  }
};
const EMPTY_FORM = {
  title: '',
  content: '',
  caption: '',
  type: 'Promotion',
  platforms: [],
  tags: [],
  scheduledAt: '',
  mediaUrls: [],
  status: 'draft'
};

// ─── Small reusable pieces ───────────────────────────────────────────────────
const ChannelIcon = ({
  id,
  size = 26
}) => {
  const m = CHANNEL_META[id] || {
    emoji: '🌐',
    color: '#94A3B8'
  };
  return <div style={{
    width: size,
    height: size,
    background: m.color + '22',
    fontSize: size * 0.48
  }} className="ap-post-scheduler-page-1">
      {m.emoji}
    </div>;
};
const ChannelChips = ({
  channels = []
}) => <div className="ap-post-scheduler-page-2">
    {channels.map(ch => {
    const m = CHANNEL_META[ch] || {
      emoji: '🌐',
      color: '#94A3B8'
    };
    return <span key={ch} style={{
      background: m.color + '18',
      color: m.color
    }} className="ap-post-scheduler-page-3">
          {m.emoji} {ch}
        </span>;
  })}
  </div>;
const TypeTag = ({
  type
}) => {
  const t = POST_TYPES[type] || POST_TYPES.Update;
  return <span style={{
    background: t.bg,
    color: t.color
  }} className="ap-post-scheduler-page-4">{type}</span>;
};

// Spinner
const Spinner = () => <span className="ap-post-scheduler-page-5" />;

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({
  msg,
  ok = true
}) => msg ? <div style={{
  background: ok ? "var(--x1a1a2e)" : "var(--danger-text)"
}} className="ap-post-scheduler-page-6">
      <span style={{
    color: ok ? "var(--success)" : "var(--danger-border)"
  }}>{ok ? '✓' : '✕'}</span>{msg}
    </div> : null;

// ─── Overlay wrapper ──────────────────────────────────────────────────────────
const Overlay = ({
  onClose,
  children,
  wide = false
}) => <div onClick={e => e.target === e.currentTarget && onClose()} className="ap-post-scheduler-page-7">
    <div style={{
    maxWidth: wide ? "680px" : "460px"
  }} onClick={e => e.stopPropagation()} className="ap-post-scheduler-page-8">
      {children}
    </div>
  </div>;
const ModalHeader = ({
  title,
  onClose
}) => <div className="ap-post-scheduler-page-9">
    <div className="ap-post-scheduler-page-10">{title}</div>
    <button onClick={onClose} className="ap-post-scheduler-page-11">×</button>
  </div>;

// ─── File Upload Zone ─────────────────────────────────────────────────────────
const FileUploadZone = ({
  mediaUrls = [],
  onChange,
  uploading,
  onUpload
}) => {
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const handleFiles = async files => {
    const file = files[0];
    if (!file) return;
    onUpload(file);
  };
  return <div>
      <div onClick={() => inputRef.current?.click()} onDragOver={e => {
      e.preventDefault();
      setDragOver(true);
    }} onDragLeave={() => setDragOver(false)} onDrop={e => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    }} style={{
      border: `2px dashed ${dragOver ? COLORS.brand : '#E5E7EB'}`,
      cursor: uploading ? "not-allowed" : "pointer",
      background: dragOver ? "var(--brand-light)" : "var(--bg)"
    }} className="ap-post-scheduler-page-12">
        <input ref={inputRef} type="file" accept="image/*,video/*" onChange={e => handleFiles(e.target.files)} disabled={uploading} className="ap-post-scheduler-page-13" />
        {uploading ? <div className="ap-post-scheduler-page-14">
            <div className="ap-post-scheduler-page-15">⏳</div>
            Uploading…
          </div> : <>
            <div className="ap-post-scheduler-page-16">🖼</div>
            <div className="ap-post-scheduler-page-17">
              Click or drag &amp; drop to upload
            </div>
            <div className="ap-post-scheduler-page-18">PNG, JPG, MP4 · max 10MB</div>
          </>}
      </div>

      {/* Preview thumbnails */}
      {mediaUrls.length > 0 && <div className="ap-post-scheduler-page-19">
          {mediaUrls.map((url, i) => <div key={i} className="ap-post-scheduler-page-20">
              <img src={url} alt="" className="ap-post-scheduler-page-21" />
              <button onClick={() => onChange(mediaUrls.filter((_, j) => j !== i))} className="ap-post-scheduler-page-22">
                ×
              </button>
            </div>)}
        </div>}
    </div>;
};

// ─── Channel picker (multi-select pills) ──────────────────────────────────────
const ChannelPicker = ({
  value = [],
  onChange
}) => <div className="ap-post-scheduler-page-23">
    {Object.entries(CHANNEL_META).map(([id, m]) => {
    const on = value.includes(id);
    return <button key={id} type="button" onClick={() => onChange(on ? value.filter(x => x !== id) : [...value, id])} style={{
      border: `1.5px solid ${on ? m.color : '#E5E7EB'}`,
      background: on ? m.bg : COLORS.white
    }} className="ap-post-scheduler-page-24">
          <ChannelIcon id={id} size={18} />
          <span style={{
        color: on ? m.color : COLORS.muted
      }} className="ap-post-scheduler-page-25">{m.label}</span>
          {on && <span style={{
        color: m.color
      }} className="ap-post-scheduler-page-26">✓</span>}
        </button>;
  })}
  </div>;

// ─── Form fields shared between Compose & Edit ───────────────────────────────
const PostFormFields = ({
  form,
  set,
  uploading,
  onUpload
}) => {
  const fLabel = {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: .4,
    marginBottom: 6,
    display: 'block'
  };
  const fInput = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    fontSize: 13,
    fontFamily: FONTS.sans,
    color: COLORS.h2,
    background: COLORS.bg,
    outline: 'none',
    boxSizing: 'border-box'
  };
  return <div className="ap-post-scheduler-page-27">
      {/* Title */}
      <div>
        <label className="ap-post-scheduler-page-28">Post Title *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer AC Offer – 20% Off" className="ap-post-scheduler-page-29" />
      </div>

      {/* Caption */}
      <div>
        <label className="ap-post-scheduler-page-28">Caption / Message *</label>
        <textarea value={form.content || form.caption} onChange={e => {
        set('content', e.target.value);
        set('caption', e.target.value);
      }} placeholder="Write your post caption…" rows={3} className="ap-post-scheduler-page-30" />
        <div className="ap-post-scheduler-page-31">
          {['#ACSummer', '#CoolTech', '#ACService', '#Bengaluru'].map(t => <span key={t} onClick={() => set('tags', [...(form.tags || []), t.replace('#', '')])} className="ap-post-scheduler-page-32">{t}</span>)}
        </div>
      </div>

      {/* Channels */}
      <div>
        <label className="ap-post-scheduler-page-28">Publish To *</label>
        <ChannelPicker value={form.platforms || []} onChange={v => set('platforms', v)} />
        {(!form.platforms || form.platforms.length === 0) && <div className="ap-post-scheduler-page-33">Select at least one channel</div>}
      </div>

      {/* Type + Schedule */}
      <div className="ap-post-scheduler-page-34">
        <div>
          <label className="ap-post-scheduler-page-28">Post Type</label>
          <select value={form.type} onChange={e => set('type', e.target.value)} className="ap-post-scheduler-page-35">
            {Object.keys(POST_TYPES).map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="ap-post-scheduler-page-28">Schedule Date &amp; Time</label>
          <input type="datetime-local" value={form.scheduledAt || ''} onChange={e => set('scheduledAt', e.target.value)} className="ap-post-scheduler-page-29" />
        </div>
      </div>

      {/* Status (only shown in edit) */}
      {form._id && <div>
          <label className="ap-post-scheduler-page-28">Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className="ap-post-scheduler-page-36">
            {Object.keys(POST_STATUS).map(s => <option key={s} value={s}>{POST_STATUS[s].label}</option>)}
          </select>
        </div>}

      {/* Media upload */}
      <div>
        <label className="ap-post-scheduler-page-28">Media</label>
        <FileUploadZone mediaUrls={form.mediaUrls || []} uploading={uploading} onChange={urls => set('mediaUrls', urls)} onUpload={onUpload} />
      </div>
    </div>;
};

// ─── Compose Modal (Create new) ───────────────────────────────────────────────
const ComposeModal = ({
  onClose,
  onCreated
}) => {
  const [form, setFormData] = useState({
    ...EMPTY_FORM
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setFormData(p => ({
    ...p,
    [k]: v
  }));
  const handleUpload = async file => {
    setUploading(true);
    try {
      const res = await postsApi.uploadMedia(file);
      const url = res.url || res.data?.url || URL.createObjectURL(file);
      set('mediaUrls', [...(form.mediaUrls || []), url]);
    } catch {
      // Fallback: use object URL for preview (no server upload)
      set('mediaUrls', [...(form.mediaUrls || []), URL.createObjectURL(file)]);
    } finally {
      setUploading(false);
    }
  };
  const handleSubmit = async status => {
    if (!form.title.trim()) return setErr('Title is required');
    if (!form.content?.trim() && !form.caption?.trim()) return setErr('Caption is required');
    if (!form.platforms?.length) return setErr('Select at least one channel');
    setLoading(true);
    setErr('');
    try {
      const payload = {
        title: form.title,
        content: form.content || form.caption,
        caption: form.caption || form.content,
        platforms: form.platforms,
        type: form.type,
        tags: form.tags || [],
        mediaUrls: form.mediaUrls || [],
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : null,
        status
      };
      const res = await postsApi.create(payload);
      onCreated(res.data ?? res);
      onClose();
    } catch (e) {
      setErr(e.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };
  return <Overlay onClose={onClose} wide>
      <ModalHeader title="✍️ Create New Post" onClose={onClose} />
      <div className="ap-post-scheduler-page-37">
        {err && <div className="ap-post-scheduler-page-38">{err}</div>}
        <PostFormFields form={form} set={set} uploading={uploading} onUpload={handleUpload} />
        <div className="ap-post-scheduler-page-39">
          <button onClick={() => handleSubmit('scheduled')} disabled={loading || uploading} style={{
          background: loading ? "var(--border)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
          color: loading ? "var(--text-muted)" : "white",
          cursor: loading ? "not-allowed" : "pointer"
        }} className="ap-post-scheduler-page-40">
            {loading ? <Spinner /> : '🚀'} {loading ? 'Scheduling…' : 'Schedule Post'}
          </button>
          <button onClick={() => handleSubmit('draft')} disabled={loading || uploading} className="ap-post-scheduler-page-41">
            Save Draft
          </button>
          <button onClick={onClose} className="ap-post-scheduler-page-42">
            Cancel
          </button>
        </div>
      </div>
      <style>{`@keyframes pspin { to { transform: rotate(360deg); } }`}</style>
    </Overlay>;
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const EditModal = ({
  post,
  onClose,
  onSaved
}) => {
  const [form, setFormData] = useState({
    ...post,
    platforms: post.platforms || post.channels || [],
    content: post.content || post.caption || '',
    caption: post.caption || post.content || '',
    scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
    mediaUrls: post.mediaUrls || []
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setFormData(p => ({
    ...p,
    [k]: v
  }));
  const handleUpload = async file => {
    setUploading(true);
    try {
      const res = await postsApi.uploadMedia(file);
      const url = res.url || res.data?.url || URL.createObjectURL(file);
      set('mediaUrls', [...(form.mediaUrls || []), url]);
    } catch {
      set('mediaUrls', [...(form.mediaUrls || []), URL.createObjectURL(file)]);
    } finally {
      setUploading(false);
    }
  };
  const handleSave = async () => {
    if (!form.title?.trim()) return setErr('Title is required');
    if (!form.platforms?.length) return setErr('Select at least one channel');
    setLoading(true);
    setErr('');
    try {
      const payload = {
        title: form.title,
        content: form.content,
        caption: form.caption || form.content,
        platforms: form.platforms,
        type: form.type,
        tags: form.tags || [],
        mediaUrls: form.mediaUrls || [],
        status: form.status,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : null
      };
      const res = await postsApi.update(post._id, payload);
      onSaved(res.data ?? res);
      onClose();
    } catch (e) {
      setErr(e.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };
  return <Overlay onClose={onClose} wide>
      <ModalHeader title={`✏️ Edit Post — ${post.postId || post.id || ''}`} onClose={onClose} />
      <div className="ap-post-scheduler-page-43">
        {err && <div className="ap-post-scheduler-page-44">{err}</div>}
        <PostFormFields form={form} set={set} uploading={uploading} onUpload={handleUpload} />
        <div className="ap-post-scheduler-page-45">
          <button onClick={onClose} className="ap-post-scheduler-page-46">
            Cancel
          </button>
          <button onClick={handleSave} disabled={loading || uploading} style={{
          background: loading ? '#E5E7EB' : `linear-gradient(135deg,${COLORS.brand},${COLORS.brandD || '#C2410C'})`,
          color: loading ? "var(--text-muted)" : "white",
          cursor: loading ? "not-allowed" : "pointer"
        }} className="ap-post-scheduler-page-47">
            {loading ? <Spinner /> : null} {loading ? 'Saving…' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </Overlay>;
};

// ─── Schedule Modal (for draft posts) ────────────────────────────────────────
const ScheduleModal = ({
  post,
  onClose,
  onScheduled
}) => {
  const [dt, setDt] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const handleSchedule = async () => {
    if (!dt) return setErr('Please pick a date and time');
    setLoading(true);
    setErr('');
    try {
      const res = await postsApi.update(post._id, {
        scheduledAt: new Date(dt),
        status: 'scheduled'
      });
      onScheduled(res.data ?? res);
      onClose();
    } catch (e) {
      setErr(e.message || 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  };
  return <Overlay onClose={onClose}>
      <ModalHeader title="📅 Schedule Post" onClose={onClose} />
      <div className="ap-post-scheduler-page-48">
        {/* Post summary */}
        <div className="ap-post-scheduler-page-49">
          <div className="ap-post-scheduler-page-50">{post.title}</div>
          <ChannelChips channels={post.platforms || post.channels || []} />
        </div>

        {err && <div className="ap-post-scheduler-page-51">{err}</div>}

        <div className="ap-post-scheduler-page-52">
          <label className="ap-post-scheduler-page-53">
            Publish Date &amp; Time
          </label>
          <input type="datetime-local" value={dt} onChange={e => setDt(e.target.value)} className="ap-post-scheduler-page-54" />
        </div>

        <div className="ap-post-scheduler-page-55">
          <button onClick={onClose} className="ap-post-scheduler-page-56">
            Cancel
          </button>
          <button onClick={handleSchedule} disabled={loading} style={{
          background: loading ? "var(--border)" : "linear-gradient(135deg,var(--info-text),var(--x1e40af))",
          color: loading ? "var(--text-muted)" : "white",
          cursor: loading ? "not-allowed" : "pointer"
        }} className="ap-post-scheduler-page-57">
            {loading ? <Spinner /> : '📅'} {loading ? 'Scheduling…' : 'Confirm Schedule'}
          </button>
        </div>
      </div>
    </Overlay>;
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({
  post,
  onClose,
  onDeleted
}) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    try {
      await postsApi.remove(post._id);
      onDeleted(post._id);
      onClose();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  return <Overlay onClose={onClose}>
      <div className="ap-post-scheduler-page-58">
        <div className="ap-post-scheduler-page-59">
          🗑
        </div>
        <div className="ap-post-scheduler-page-60">Delete Post?</div>
        <div className="ap-post-scheduler-page-61">
          <strong className="ap-post-scheduler-page-62">"{post.title}"</strong>
        </div>
        <div className="ap-post-scheduler-page-63">
          This will move the post to trash. This action can be undone from Recently Deleted.
        </div>
        <div className="ap-post-scheduler-page-64">
          <button onClick={onClose} disabled={loading} className="ap-post-scheduler-page-65">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading} style={{
          background: loading ? "var(--border)" : "var(--danger)",
          color: loading ? "var(--text-muted)" : "white",
          cursor: loading ? "not-allowed" : "pointer"
        }} className="ap-post-scheduler-page-66">
            {loading ? <Spinner /> : null} {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </Overlay>;
};

// ─── Status Update Modal ──────────────────────────────────────────────────────
const StatusModal = ({
  post,
  targetStatus,
  onClose,
  onUpdated
}) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const opt = POST_STATUS[targetStatus];
  const handleConfirm = async () => {
    setLoading(true);
    try {
      let res;
      if (targetStatus === 'published') {
        res = await postsApi.publish(post._id);
      } else {
        res = await postsApi.update(post._id, {
          status: targetStatus,
          statusNote: note
        });
      }
      onUpdated(res.data ?? res);
      onClose();
    } catch (e) {
      alert('Status update failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
  const current = POST_STATUS[post.status];
  return <Overlay onClose={onClose}>
      <div style={{
      background: `linear-gradient(135deg,${opt?.bg},${opt?.bg}cc)`,
      borderBottom: `2px solid ${opt?.color}30`
    }} className="ap-post-scheduler-page-67">
        <div style={{
        background: opt?.color + '18',
        border: `2px solid ${opt?.color}40`
      }} className="ap-post-scheduler-page-68">
          {targetStatus === 'published' ? '✅' : targetStatus === 'scheduled' ? '📅' : targetStatus === 'draft' ? '📝' : '❌'}
        </div>
        <div className="ap-post-scheduler-page-69">
          <div className="ap-post-scheduler-page-70">Change Status</div>
          <div className="ap-post-scheduler-page-71">
            {post.title} → <strong style={{
            color: opt?.color
          }}>{opt?.label}</strong>
          </div>
        </div>
        <button onClick={onClose} className="ap-post-scheduler-page-72">×</button>
      </div>

      <div className="ap-post-scheduler-page-73">
        {/* Current → New */}
        <div className="ap-post-scheduler-page-74">
          <div className="ap-post-scheduler-page-75">
            <div className="ap-post-scheduler-page-76">Current</div>
            <span style={{
            background: current?.bg,
            color: current?.color
          }} className="ap-post-scheduler-page-77">{current?.label}</span>
          </div>
          <div className="ap-post-scheduler-page-78">→</div>
          <div className="ap-post-scheduler-page-79">
            <div className="ap-post-scheduler-page-80">New</div>
            <span style={{
            background: opt?.bg,
            color: opt?.color
          }} className="ap-post-scheduler-page-81">{opt?.label}</span>
          </div>
        </div>

        <div className="ap-post-scheduler-page-82">
          <label className="ap-post-scheduler-page-83">
            Note <span className="ap-post-scheduler-page-84">(optional)</span>
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder={`Reason for changing to ${opt?.label}…`} className="ap-post-scheduler-page-85" />
        </div>

        <div className="ap-post-scheduler-page-86">
          <button onClick={onClose} disabled={loading} className="ap-post-scheduler-page-87">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading} style={{
          background: loading ? '#E5E7EB' : `linear-gradient(135deg,${opt?.color},${opt?.color}cc)`,
          color: loading ? "var(--text-muted)" : "white",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? 'none' : `0 4px 14px ${opt?.color}40`
        }} className="ap-post-scheduler-page-88">
            {loading ? <Spinner /> : null} {loading ? 'Updating…' : `Confirm ${opt?.label}`}
          </button>
        </div>
      </div>
    </Overlay>;
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
const DetailModal = ({
  post,
  onClose,
  onEdit,
  onDelete,
  onStatusChange
}) => {
  const channels = post.platforms || post.channels || [];
  const status = POST_STATUS[post.status];
  const type = POST_TYPES[post.type] || POST_TYPES.Update;
  const Row = ({
    label,
    children
  }) => <div className="ap-post-scheduler-page-89">
      <span className="ap-post-scheduler-page-90">{label}</span>
      <span className="ap-post-scheduler-page-91">{children}</span>
    </div>;
  return <Overlay onClose={onClose} wide>
      {/* Coloured top strip */}
      <div className="ap-post-scheduler-page-92">
        <div className="ap-post-scheduler-page-93">
          {post.image || '📄'}
        </div>
        <div className="ap-post-scheduler-page-94">
          <div className="ap-post-scheduler-page-95">
            <span className="ap-post-scheduler-page-96">{post.postId || post.id}</span>
            <TypeTag type={post.type} />
            <span style={{
            background: status?.bg,
            color: status?.color
          }} className="ap-post-scheduler-page-97">{status?.label}</span>
          </div>
          <div className="ap-post-scheduler-page-98">{post.title}</div>
        </div>
        <button onClick={onClose} className="ap-post-scheduler-page-99">×</button>
      </div>

      <div className="ap-post-scheduler-page-100">

        {/* Caption */}
        <div>
          <div className="ap-post-scheduler-page-101">Caption</div>
          <div className="ap-post-scheduler-page-102">
            {post.content || post.caption || '—'}
          </div>
        </div>

        {/* Media preview */}
        <div>
          <div className="ap-post-scheduler-page-103">Media</div>
          {(post.mediaUrls || []).length > 0 ? <div className="ap-post-scheduler-page-104">
              {post.mediaUrls.map((url, i) => <div key={i} className="ap-post-scheduler-page-105">
                  <img src={url} alt="" onError={e => {
              // Replace broken img with placeholder tile
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }} className="ap-post-scheduler-page-106" />
                  {/* Fallback tile shown if img fails to load */}
                  <div className="ap-post-scheduler-page-107">
                    🖼
                  </div>
                </div>)}
            </div> : <div className="ap-post-scheduler-page-108">
              <span className="ap-post-scheduler-page-109">🖼</span>
              <span className="ap-post-scheduler-page-110">No media attached to this post</span>
            </div>}
        </div>


        {/* Channels */}
        <div>
          <div className="ap-post-scheduler-page-111">Channels</div>
          <ChannelChips channels={channels} />
        </div>

        {/* Meta rows */}
        <div>
          <Row label="Scheduled">{post._scheduledAt ? new Date(post._scheduledAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : post.scheduledAt !== '—' ? post.scheduledAt : 'Not scheduled'}</Row>
          {post.reach > 0 && <Row label="Reach"><span className="ap-post-scheduler-page-112">{post.reach.toLocaleString()}</span></Row>}
          {post.likes > 0 && <Row label="Engagement"><span className="ap-post-scheduler-page-113">❤ {post.likes} · 💬 {post.comments} · ↗ {post.shares}</span></Row>}
          {post.leads > 0 && <Row label="Leads"><span className="ap-post-scheduler-page-114">{post.leads}</span></Row>}
          {(post.tags || []).length > 0 && <Row label="Tags">
              <div className="ap-post-scheduler-page-115">
                {post.tags.map(t => <span key={t} className="ap-post-scheduler-page-116">#{t}</span>)}
              </div>
            </Row>}
        </div>

        {/* Status update buttons */}
        <div>
          <div className="ap-post-scheduler-page-117">Update Status</div>
          <div className="ap-post-scheduler-page-118">
            {Object.entries(POST_STATUS).filter(([k]) => k !== post.status).map(([k, v]) => <button key={k} onClick={() => onStatusChange(post, k)} style={{
            background: v.bg,
            color: v.color,
            border: `1px solid ${v.color}40`
          }} className="ap-post-scheduler-page-119">
                → {v.label}
              </button>)}
          </div>
        </div>

        {/* Action buttons */}
        <div className="ap-post-scheduler-page-120">
          <button onClick={() => {
          onClose();
          onEdit(post);
        }} className="ap-post-scheduler-page-121">
            ✏️ Edit Post
          </button>
          <button onClick={() => {
          onClose();
          onDelete(post);
        }} className="ap-post-scheduler-page-122">
            🗑 Delete
          </button>
        </div>
      </div>
    </Overlay>;
};

// ─── Export config ────────────────────────────────────────────────────────────
const POST_COLUMNS = [{
  label: 'ID',
  key: 'postId',
  width: 12
}, {
  label: 'Title',
  key: 'title',
  width: 24,
  tdStyle: {
    fontWeight: 600
  }
}, {
  label: 'Type',
  key: 'type',
  width: 14
}, {
  label: 'Channels',
  key: 'platforms',
  width: 20,
  format: v => Array.isArray(v) ? v.join(', ') : v
}, {
  label: 'Scheduled At',
  key: 'scheduledAt',
  width: 18
}, {
  label: 'Status',
  key: 'status',
  width: 12,
  format: v => POST_STATUS[v]?.label ?? v
}, {
  label: 'Reach',
  key: 'reach',
  width: 10,
  format: v => v > 0 ? v.toLocaleString() : '—'
}, {
  label: 'Leads',
  key: 'leads',
  width: 8
}];

// ─── PostActionMenu — ⋯ dropdown matching ActionDropdown style ────────────────
const PostActionMenu = ({
  post,
  onView,
  onEdit,
  onDelete,
  onSchedule
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  const pick = fn => {
    setOpen(false);
    fn();
  };
  return <div ref={ref} className="ap-post-scheduler-page-123">
      {/* Trigger — same size/shape as ActionDropdown */}
      <button onClick={e => {
      e.stopPropagation();
      setOpen(o => !o);
    }} onMouseEnter={e => {
      e.currentTarget.style.background = '#F3F4F6';
      e.currentTarget.style.borderColor = '#D1D5DB';
      e.currentTarget.style.color = '#374151';
    }} onMouseLeave={e => {
      e.currentTarget.style.background = '#F9FAFB';
      e.currentTarget.style.borderColor = '#E5E7EB';
      e.currentTarget.style.color = '#6B7280';
    }} className="ap-post-scheduler-page-124">
        ···
      </button>

      {open && <div className="ps-menu">
          <button className="ps-menu-item" onClick={() => pick(onView)}>
            <span className="ap-post-scheduler-page-125">👁</span> View
          </button>
          <button className="ps-menu-item" onClick={() => pick(onEdit)}>
            <span className="ap-post-scheduler-page-126">✏️</span> Edit
          </button>
          {post.status === 'draft' && <button className="ps-menu-item" onClick={() => pick(onSchedule)}>
              <span className="ap-post-scheduler-page-127">📅</span> Schedule
            </button>}
          <div className="ap-post-scheduler-page-128" />
          <button className="ps-menu-item ps-menu-item--danger" onClick={() => pick(onDelete)}>
            <span className="ap-post-scheduler-page-129">🗑</span> Delete
          </button>
        </div>}
    </div>;
};

// ─── PostSchedulerPage ────────────────────────────────────────────────────────
const PostSchedulerPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selChannels, setSelChannels] = useState([]);
  const [toast, setToast] = useState({
    msg: '',
    ok: true
  });

  // modals
  const [showCompose, setShowCompose] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [schedTarget, setSchedTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null); // { post, targetStatus }

  const showToast = (msg, ok = true) => {
    setToast({
      msg,
      ok
    });
    setTimeout(() => setToast({
      msg: '',
      ok: true
    }), 2800);
  };

  // ── Fetch from backend ───────────────────────────────────────────────────
  useEffect(() => {
    postsApi.list({
      limit: 200
    }).then(r => {
      const data = (r.data ?? r ?? []).map(normalise);
      setPosts(data);
    }).catch(() => showToast('Failed to load posts', false)).finally(() => setLoading(false));
  }, []);

  // Normalise API shape to what the UI expects
  const normalise = p => {
    // Deduplicate tags (seed script sometimes creates dupes)
    const rawTags = Array.isArray(p.tags) ? p.tags : [];
    const cleanTags = [...new Set(rawTags)];

    // Type: DB may not have it — infer from title keywords as last resort
    const type = p.type || (() => {
      const t = (p.title || '').toLowerCase();
      if (t.includes('offer') || t.includes('discount') || t.includes('off')) return 'Promotion';
      if (t.includes('tip') || t.includes('guide') || t.includes('how')) return 'Tips';
      if (t.includes('testimonial') || t.includes('review') || t.includes('client')) return 'Testimonial';
      if (t.includes('event') || t.includes('demo') || t.includes('launch')) return 'Event';
      return 'Update';
    })();
    return {
      ...p,
      id: p.postId || p._id,
      postId: p.postId || p._id,
      type,
      channels: p.platforms || p.channels || [],
      platforms: p.platforms || p.channels || [],
      caption: p.caption || p.content || '',
      content: p.content || p.caption || '',
      // Keep raw ISO string for calendar, formatted for display
      _scheduledAt: p.scheduledAt,
      scheduledAt: p.scheduledAt ? new Date(p.scheduledAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '—',
      reach: p.reach ?? 0,
      likes: p.likes ?? 0,
      comments: p.comments ?? 0,
      shares: p.shares ?? 0,
      leads: p.leads ?? 0,
      // Filter out empty/null/undefined URLs so broken <img> never renders
      mediaUrls: (p.mediaUrls || []).filter(u => u && u.trim() !== ''),
      tags: cleanTags
    };
  };

  // ── Search + filters ─────────────────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchFiltered
  } = useTableSearch(posts, ['id', 'title', 'type', 'caption', 'content'], {
    type: '',
    status: ''
  });
  const filtered = searchFiltered.filter(p => !activeFilters.type || p.type === activeFilters.type).filter(p => !activeFilters.status || p.status === activeFilters.status).filter(p => selChannels.length === 0 || (p.platforms || p.channels || []).some(ch => selChannels.includes(ch)));
  const {
    paginated,
    page,
    totalPages,
    setPage,
    pageSize,
    setPageSize,
    from,
    to,
    total
  } = usePagination(filtered, 10);
  const {
    exportProps
  } = useExport({
    title: 'Post Scheduler',
    filename: 'cooltech-posts',
    template: 'generic_list',
    subtitle: `CoolTech · Posts · ${filtered.length} records`,
    docId: 'POSTS-EXPORT',
    columns: POST_COLUMNS,
    rows: filtered
  });

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleCreated = p => {
    setPosts(prev => [normalise(p), ...prev]);
    showToast('Post created successfully');
  };
  const handleSaved = p => {
    setPosts(prev => prev.map(x => x._id === p._id ? normalise(p) : x));
    showToast('Post saved');
  };
  const handleDeleted = id => {
    setPosts(prev => prev.filter(x => x._id !== id));
    showToast('Post deleted');
  };
  const handleScheduled = p => {
    setPosts(prev => prev.map(x => x._id === p._id ? normalise(p) : x));
    showToast('Post scheduled');
  };
  const handleUpdated = p => {
    setPosts(prev => prev.map(x => x._id === p._id ? normalise(p) : x));
    showToast(`Status → ${POST_STATUS[p.status]?.label}`);
  };
  const openDetail = (post, e) => {
    e?.stopPropagation();
    setDetailTarget(post);
  };
  const openEdit = (post, e) => {
    e?.stopPropagation();
    setEditTarget(post);
  };
  const openDelete = (post, e) => {
    e?.stopPropagation();
    setDeleteTarget(post);
  };
  const openSched = (post, e) => {
    e?.stopPropagation();
    setSchedTarget(post);
  };
  const openStatus = (post, targetStatus) => setStatusTarget({
    post,
    targetStatus
  });

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calDays = Array.from({
    length: 31
  }, (_, i) => i + 1);
  const getPostsForDay = d => posts.filter(p => {
    if (!p._scheduledAt) return false;
    return new Date(p._scheduledAt).getDate() === d;
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return <div className="fi ap-post-scheduler-page-130">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pspin  { to { transform: rotate(360deg); } }
        .ps-row:hover { background: #FFFBF7 !important; }
        .ps-action-btn { padding: 4px 9px; border-radius: 5px; font-size: 11px; font-weight: 700; cursor: pointer; border: none; font-family: inherit; transition: all .12s; }
        .ps-action-btn:hover { filter: brightness(.93); transform: translateY(-1px); }
        .ps-menu { position:absolute; right:0; top:calc(100% + 4px); z-index:1000; background:#fff; border:1px solid #E5E7EB; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.10),0 2px 6px rgba(0,0,0,.06); min-width:148px; padding:4px; animation:psMenuIn .12s ease; }
        @keyframes psMenuIn { from{opacity:0;transform:translateY(-4px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .ps-menu-item { display:flex; align-items:center; gap:8px; width:100%; padding:8px 12px; font-size:13px; font-weight:500; color:#374151; background:transparent; border:none; border-radius:7px; cursor:pointer; text-align:left; transition:background .12s,color .12s; font-family:inherit; }
        .ps-menu-item:hover { background:#F3F4F6; color:#111827; }
        .ps-menu-item--danger { color:#DC2626; }
        .ps-menu-item--danger:hover { background:#FEF2F2; color:#B91C1C; }
      `}</style>

      {/* Header */}
      <div className="ap-post-scheduler-page-131">
        <div>
          <div className="ap-post-scheduler-page-132">Post Scheduler</div>
          <div className="ap-post-scheduler-page-133">Plan and publish content across all channels</div>
        </div>
        <div className="ap-post-scheduler-page-134">
          <div className="ap-post-scheduler-page-135">
            {[['list', '☰ List'], ['calendar', '📅 Calendar']].map(([k, l]) => <button key={k} onClick={() => setView(k)} style={{
            background: view === k ? "var(--white)" : "transparent",
            color: view === k ? "var(--text-h1)" : "var(--text-muted)",
            border: view === k ? "1px solid var(--border)" : "1px solid transparent"
          }} className="ap-post-scheduler-page-136">{l}</button>)}
          </div>
          <button className="btn ap-post-scheduler-page-137" onClick={() => setShowCompose(true)}>
            + Create Post
          </button>
        </div>
      </div>

      {/* Channel filter pills */}
      <div className="ap-post-scheduler-page-138">
        {Object.entries(CHANNEL_META).map(([id, m]) => <button key={id} onClick={() => setSelChannels(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])} style={{
        border: `1.5px solid ${selChannels.includes(id) ? m.color : '#E5E7EB'}`,
        background: selChannels.includes(id) ? m.bg : COLORS.white
      }} className="ap-post-scheduler-page-139">
            <ChannelIcon id={id} size={18} />
            <span style={{
          color: selChannels.includes(id) ? m.color : COLORS.muted
        }} className="ap-post-scheduler-page-140">{m.label}</span>
          </button>)}
        {selChannels.length > 0 && <button onClick={() => setSelChannels([])} className="ap-post-scheduler-page-141">Clear</button>}
      </div>

      {/* ── List view ── */}
      {view === 'list' && <div className="ap-post-scheduler-page-142">

          {/* Toolbar */}
          <div className="ap-post-scheduler-page-143">
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by title, type, caption…" />
            <FilterSelect value={activeFilters.type} onChange={v => setFilter('type', v)} options={Object.keys(POST_TYPES)} allLabel="All Types" />
            <FilterSelect value={activeFilters.status} onChange={v => setFilter('status', v)} options={Object.keys(POST_STATUS)} allLabel="All Statuses" />
            <div className="ap-post-scheduler-page-144"><ExportDropdown {...exportProps} /></div>
          </div>

          {loading ? <div className="ap-post-scheduler-page-145">Loading posts…</div> : <div className="ap-post-scheduler-page-146">
              <table className="ap-post-scheduler-page-147">
                <Thead cols={['', 'Title', 'Type', 'Caption', 'Channels', 'Scheduled', 'Reach', 'Engagement', 'Leads', 'Status', '']} />
                <tbody>
                  {paginated.length === 0 && <tr><td colSpan={11} className="ap-post-scheduler-page-148">No posts match your filters.</td></tr>}
                  {paginated.map((p, i) => {
              return <tr key={p._id || p.id} className="ps-row ap-post-scheduler-page-149" style={{
                background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
              }}>
                        <td className="ap-post-scheduler-page-150">
                          <div className="ap-post-scheduler-page-151">{p.image || '📄'}</div>
                        </td>
                        <td className="ap-post-scheduler-page-152">
                          <div className="ap-post-scheduler-page-153">{p.title}</div>
                          <span className="ap-post-scheduler-page-154">{p.postId || p.id}</span>
                        </td>
                        <td className="ap-post-scheduler-page-155"><TypeTag type={p.type} /></td>
                        <td className="ap-post-scheduler-page-156">
                          <div className="ap-post-scheduler-page-157">{p.caption}</div>
                        </td>
                        <td className="ap-post-scheduler-page-158"><ChannelChips channels={p.platforms || p.channels || []} /></td>
                        <td style={{
                  color: p.status === 'scheduled' ? "var(--info-text)" : "var(--text-muted)",
                  fontWeight: p.status === 'scheduled' ? "600" : "400"
                }} className="ap-post-scheduler-page-159">{p.scheduledAt}</td>
                        <td className="ap-post-scheduler-page-160">
                          <span className="ap-post-scheduler-page-161">{p.reach > 0 ? p.reach.toLocaleString() : '—'}</span>
                        </td>
                        <td className="ap-post-scheduler-page-162">
                          {p.likes > 0 ? <div className="ap-post-scheduler-page-163">❤ {p.likes} · 💬 {p.comments} · ↗ {p.shares}</div> : <span className="ap-post-scheduler-page-164">—</span>}
                        </td>
                        <td className="ap-post-scheduler-page-165">
                          <span className="ap-post-scheduler-page-166">{p.leads > 0 ? p.leads : '—'}</span>
                        </td>
                        <td className="ap-post-scheduler-page-167"><SBadge s={p.status} map={POST_STATUS} /></td>
                        <td className="ap-post-scheduler-page-168">
                          <PostActionMenu post={p} onView={() => openDetail(p)} onEdit={() => openEdit(p)} onDelete={() => openDelete(p)} onSchedule={() => openSched(p)} />
                        </td>
                      </tr>;
            })}
                </tbody>
              </table>
            </div>}

          {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}
        </div>}

      {/* ── Calendar view ── */}
      {view === 'calendar' && <div className="ap-post-scheduler-page-169">
          <div className="ap-post-scheduler-page-170">
            <div className="ap-post-scheduler-page-171">March 2026</div>
            <div className="ap-post-scheduler-page-172">
              <button className="btn ap-post-scheduler-page-173">← Feb</button>
              <button className="btn ap-post-scheduler-page-174">Apr →</button>
            </div>
          </div>
          <div className="ap-post-scheduler-page-175">
            {DAYS.map(d => <div key={d} className="ap-post-scheduler-page-176">{d}</div>)}
          </div>
          <div className="ap-post-scheduler-page-177">
            {calDays.map(d => {
          const dayPosts = getPostsForDay(d);
          const isToday = d === new Date().getDate();
          return <div key={d} style={{
            background: isToday ? "var(--brand-light)" : "transparent"
          }} className="ap-post-scheduler-page-178">
                  <div style={{
              fontWeight: isToday ? "800" : "500",
              color: isToday ? "var(--brand)" : "var(--text-muted)"
            }} className="ap-post-scheduler-page-179">{d}{isToday && ' •'}</div>
                  {dayPosts.map(p => <div key={p._id} onClick={() => openDetail(p)} style={{
              background: p.status === 'published' ? '#ECFDF5' : p.status === 'scheduled' ? '#EFF6FF' : '#F8FAFC',
              color: p.status === 'published' ? '#16A34A' : p.status === 'scheduled' ? '#1D4ED8' : '#94A3B8'
            }} className="ap-post-scheduler-page-180">
                      {p.image || '📄'} {p.title.slice(0, 18)}
                    </div>)}
                </div>;
        })}
          </div>
        </div>}

      {/* ── Modals ── */}
      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onCreated={handleCreated} />}
      {editTarget && <EditModal post={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />}
      {schedTarget && <ScheduleModal post={schedTarget} onClose={() => setSchedTarget(null)} onScheduled={handleScheduled} />}
      {deleteTarget && <DeleteModal post={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />}
      {detailTarget && <DetailModal post={detailTarget} onClose={() => setDetailTarget(null)} onEdit={p => {
      setDetailTarget(null);
      setEditTarget(p);
    }} onDelete={p => {
      setDetailTarget(null);
      setDeleteTarget(p);
    }} onStatusChange={(p, s) => {
      setDetailTarget(null);
      openStatus(p, s);
    }} />}
      {statusTarget && <StatusModal post={statusTarget.post} targetStatus={statusTarget.targetStatus} onClose={() => setStatusTarget(null)} onUpdated={p => {
      handleUpdated(p);
      setStatusTarget(null);
    }} />}

      <Toast msg={toast.msg} ok={toast.ok} />
    </div>;
};
export default PostSchedulerPage;