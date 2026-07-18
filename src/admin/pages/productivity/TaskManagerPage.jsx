import { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS, FONTS } from '../../constants/tokens';
import { SBadge, TypeTag, PBadge, Avatar } from '../../components/ui/Badges';
import { KCard, SectionHdr, Thead } from '../../components/ui/Cards';
import { useTableSearch } from '../../hooks/useTableSearch';
import TableSearchBar from '../../components/ui/TableSearchBar';
import FilterSelect from '../../components/ui/FilterSelect';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/ui/Pagination';
import ExportDropdown from '../../components/layout/ExportDropdown';
import useExport from '../../hooks/useExport';
import { tasksApi, techsApi } from '../../services/api';
import { useTaskCategories, useTaskLabels } from '../../hooks/useOptionSets';
import { DynamicSelect } from '../../components/modals/Modals';

// ─── Constants ────────────────────────────────────────────────────────────────
const TASK_STATUS_MAP = {
  todo: {
    label: 'To Do',
    bg: "var(--bg)",
    color: "var(--text-body)"
  },
  in_progress: {
    label: 'In Progress',
    bg: "var(--warning-bg)",
    color: "var(--warning-text)",
    dot: "var(--warning)"
  },
  done: {
    label: 'Done',
    bg: "var(--success-bg)",
    color: "var(--success-text)",
    dot: "var(--success)"
  }
};
const PRIO_COLOR = {
  urgent: {
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  },
  high: {
    color: "var(--brand)",
    bg: "var(--brand-light)"
  },
  normal: {
    color: "var(--info-text)",
    bg: "var(--info-bg)"
  },
  low: {
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  }
};
const COLUMNS = ['todo', 'in_progress', 'done'];
// Fallback defaults — used only until the TaskCategory / TaskLabel option
// sets have data, same convention as every other DynamicSelect-backed field
// in the app (see useOptionSets.js). Kept in sync with those hooks' fallbacks.
const TASK_CATEGORY_DEFAULTS = ['Service', 'Installation', 'Repair', 'AMC', 'Sales', 'Finance', 'HR', 'Operations', 'Admin'];
const TASK_LABEL_DEFAULTS = ['Urgent Follow-up', 'Customer Complaint', 'AMC Related', 'Internal', 'Revenue Critical'];
const PRIORITIES = ['urgent', 'high', 'normal', 'low'];
const TASK_COLUMNS = [{
  label: 'ID',
  key: 'id',
  width: 12
}, {
  label: 'Task',
  key: 'title',
  width: 32
}, {
  label: 'Category',
  key: 'category',
  width: 14
}, {
  label: 'Assigned To',
  key: 'assignedTo',
  width: 18
}, {
  label: 'Due Date',
  key: 'due',
  width: 16
}, {
  label: 'Priority',
  key: 'priority',
  width: 10
}, {
  label: 'Status',
  key: 'status',
  width: 14,
  format: v => TASK_STATUS_MAP[v]?.label ?? v
}];

// ─── FIX: a single stable helper to get a task's unique key everywhere ────────
// Backend docs only reliably have `_id` (Mongo ObjectId). The display `id`
// field (e.g. "TSK-001") may be missing on some records. Using `_id` first
// everywhere — drag data, lookups, React keys — eliminates the mismatch that
// was breaking drag-and-drop (dataTransfer was sometimes set to `undefined`
// when task.id was missing, so the drop handler's .find() never matched).
const taskKey = t => String(t?._id ?? t?.id ?? '');

// ─── Task Modal ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: '',
  category: 'Sales',
  assignedTo: 'Admin',
  due: '',
  priority: 'normal',
  status: 'todo',
  label: '',
  notes: ''
};
function TaskModal({
  mode,
  task,
  onClose,
  onSave,
  taskCategories = [],
  onAddTaskCategory,
  taskLabels = [],
  onAddTaskLabel
}) {
  const taskCategoryList = taskCategories.length ? taskCategories : TASK_CATEGORY_DEFAULTS;
  const taskLabelList = taskLabels.length ? taskLabels : TASK_LABEL_DEFAULTS;
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [liveTechs, setLiveTechs] = useState([]);
  const [techsLoading, setTechsLoading] = useState(false);
  useEffect(() => {
    setTechsLoading(true);
    techsApi.list({
      limit: 100
    }).then(r => {
      const list = Array.isArray(r?.data) ? r.data : [];
      setLiveTechs(list);
    }).catch(() => setLiveTechs([])).finally(() => setTechsLoading(false));
  }, []);
  useEffect(() => {
    if (mode === 'edit' && task) {
      setForm({
        title: task.title || '',
        category: task.category || 'Sales',
        assignedTo: task.assignedTo || 'Admin',
        due: task.due || '',
        priority: task.priority || 'normal',
        status: task.status || 'todo',
        label: task.label || '',
        notes: task.notes || ''
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [mode, task]);
  const set = (k, v) => setForm(prev => ({
    ...prev,
    [k]: v
  }));
  const handleSave = async () => {
    if (!form.title.trim()) return setError('Title is required.');
    if (!form.assignedTo.trim()) return setError('Assigned To is required.');
    if (!form.due) return setError('Due date is required.');
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };
  const inp = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    fontSize: 13,
    color: COLORS.h2,
    background: COLORS.bg,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: FONTS.sans
  };
  const lbl = {
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.h2,
    marginBottom: 4,
    display: 'block'
  };
  return <div className="ap-task-manager-page-1">
      <style>{`
        .tm-scroll::-webkit-scrollbar { display: none; }
        .tm-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      `}</style>

      <div className="ap-task-manager-page-2">
        <div className="ap-task-manager-page-3">
          <div className="ap-task-manager-page-4">
            {mode === 'edit' ? '✏️ Edit Task' : '+ New Task'}
          </div>
          <button onClick={onClose} className="ap-task-manager-page-5">×</button>
        </div>

        <div className="tm-scroll ap-task-manager-page-6">
          {error && <div className="ap-task-manager-page-7">
              ⚠️ {error}
            </div>}

          <div className="ap-task-manager-page-8">
            <div>
              <label className="ap-task-manager-page-9">Task Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Follow up with client…" autoFocus className="ap-task-manager-page-10" />
            </div>

            <div className="ap-task-manager-page-11">
              <div>
                <label className="ap-task-manager-page-9">Category *</label>
                <DynamicSelect
                  options={taskCategoryList}
                  value={form.category}
                  onChange={v => set('category', v)}
                  onAddOption={v => onAddTaskCategory?.(v)}
                  addLabel="Task Category"
                  addPlaceholder="e.g. Marketing, Compliance…"
                />
              </div>
              <div>
                <label className="ap-task-manager-page-9">Assigned To *</label>
                <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className="ap-task-manager-page-10">
                  <option value="Admin">👤 Admin</option>
                  {techsLoading ? <option disabled>Loading…</option> : liveTechs.map(t => <option key={t._id || t.id} value={t.name}>
                          {t.name}{t.role ? ` — ${t.role}` : ''}
                        </option>)}
                </select>
              </div>
            </div>

            <div className="ap-task-manager-page-12">
              <div>
                <label className="ap-task-manager-page-9">Due Date *</label>
                <input type="date" value={form.due} onChange={e => set('due', e.target.value)} className="ap-task-manager-page-10" />
              </div>
              <div>
                <label className="ap-task-manager-page-9">Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)} className="ap-task-manager-page-10">
                  {PRIORITIES.map(p => <option key={p} value={p}>
                      {p === 'urgent' ? '🔴' : p === 'high' ? '🟠' : p === 'normal' ? '🔵' : '🟢'}{' '}
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="ap-task-manager-page-9">Label</label>
              <DynamicSelect
                options={taskLabelList}
                value={form.label}
                onChange={v => set('label', v)}
                onAddOption={v => onAddTaskLabel?.(v)}
                addLabel="Label"
                addPlaceholder="e.g. Escalated, Warranty Claim…"
              />
            </div>

            <div>
              <label className="ap-task-manager-page-9">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="ap-task-manager-page-10">
                {Object.entries(TASK_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div>
              <label className="ap-task-manager-page-9">Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes…" className="ap-task-manager-page-13" />
            </div>
          </div>
        </div>

        <div className="ap-task-manager-page-14">
          <button onClick={onClose} disabled={saving} className="ap-task-manager-page-15">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{
          background: saving ? "var(--xcbd5e1)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
          cursor: saving ? "not-allowed" : "pointer"
        }} className="ap-task-manager-page-16">
            {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>;
}

// ─── File-kind helpers ──────────────────────────────────────────────────────
const FILE_ICON = {
  image: '🖼️',
  video: '🎬',
  document: '📄'
};
const fmtBytes = n => {
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0,
    val = n;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};
const timeAgo = dateStr => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short'
  });
};
const ACTIVITY_ICON = {
  created: '✨',
  status_change: '🔁',
  comment: '💬',
  attachment_added: '📎',
  attachment_removed: '🗑️',
  edited: '✏️',
  priority_change: '🚦'
};

// ─── Task Detail Modal — Trello-style with activity feed + attachments ────────
function TaskDetailModal({
  task,
  onClose,
  onEdit,
  onDelete,
  onMarkDone,
  onTaskUpdated,
  toast
}) {
  const [tab, setTab] = useState('activity'); // 'activity' | 'comments' | 'attachments'
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // reset local state whenever a different task is opened
  useEffect(() => {
    setTab('activity');
    setCommentText('');
  }, [task?._id]);
  if (!task) return null;
  const m = TASK_STATUS_MAP[task.status] || TASK_STATUS_MAP.todo;
  const prio = PRIO_COLOR[task.priority] || PRIO_COLOR.normal;
  const comments = task.comments || [];
  const attachments = task.attachments || [];
  const activity = task.activity || [];
  const row = (label, value) => <div className="ap-task-manager-page-17">
      <span className="ap-task-manager-page-18">{label}</span>
      <span className="ap-task-manager-page-19">{value || '—'}</span>
    </div>;

  // ── Post a comment ──────────────────────────────────────────────────────────
  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const res = await tasksApi.addComment(task._id, commentText.trim());
      if (res.success) {
        onTaskUpdated(res.data);
        setCommentText('');
      }
    } catch (e) {
      toast?.(e.message || 'Failed to post comment', 'error');
    } finally {
      setPosting(false);
    }
  };

  // ── Upload a file ────────────────────────────────────────────────────────────
  const handleFilePick = async file => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await tasksApi.uploadAttachment(task._id, file);
      if (res.success) {
        onTaskUpdated(res.data);
        setTab('attachments');
      }
    } catch (e) {
      toast?.(e.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };
  const handleDeleteAttachment = async attachmentId => {
    try {
      const res = await tasksApi.deleteAttachment(task._id, attachmentId);
      if (res.success) onTaskUpdated(res.data);
    } catch (e) {
      toast?.(e.message || 'Could not remove attachment', 'error');
    }
  };

  // ── Merge comments + activity into one chronological feed ──────────────────
  // Comments already generate a 'comment' activity entry on the backend, so to
  // avoid showing every comment twice we only show non-comment activity types
  // in the Activity tab, and the full comment thread separately in Comments.
  const activityOnly = activity.filter(a => a.type !== 'comment');
  return <div onClick={onClose} className="ap-task-manager-page-20">
      <style>{`
        .tdm-scroll::-webkit-scrollbar { width: 6px; }
        .tdm-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 99px; }
        .tdm-dropzone:hover { border-color: ${COLORS.brand} !important; background: ${COLORS.brand}08 !important; }
      `}</style>
      <div onClick={e => e.stopPropagation()} className="ap-task-manager-page-21">

        {/* Header */}
        <div className="ap-task-manager-page-22">
          <div className="ap-task-manager-page-23">
            <div className="ap-task-manager-page-24">
              <span style={{
              background: m.bg,
              color: m.color
            }} className="ap-task-manager-page-25">{m.label}</span>
              <span style={{
              background: prio.bg,
              color: prio.color
            }} className="ap-task-manager-page-26">{task.priority}</span>
              <TypeTag type={task.category} />
              {task.label && <TypeTag type={task.label} />}
            </div>
            <div style={{
            color: task.status === 'done' ? "var(--text-faint)" : "var(--text-h1)",
            textDecoration: task.status === 'done' ? "line-through" : "none"
          }} className="ap-task-manager-page-27">
              {task.title}
            </div>
          </div>
          <button onClick={onClose} className="ap-task-manager-page-28">×</button>
        </div>

        {/* Scrollable body */}
        <div className="tdm-scroll ap-task-manager-page-29">

          <div className="ap-task-manager-page-30">
            <div className="ap-task-manager-page-31">
              <span className="ap-task-manager-page-32">Assigned To</span>
              <div className="ap-task-manager-page-33">
                <Avatar name={task.assignedTo} size={22} />
                <span className="ap-task-manager-page-34">{task.assignedTo}</span>
              </div>
            </div>
            {row('Due Date', task.due)}
            {row('Task ID', task.id)}
            {row('Label', task.label)}
            {row('Status', m.label)}
          </div>

          {task.notes && <div className="ap-task-manager-page-35">
              <span className="ap-task-manager-page-36">Notes</span>
              <div className="ap-task-manager-page-37">
                {task.notes}
              </div>
            </div>}

          {/* ── Attachments quick-grid (always visible, Trello-style) ── */}
          <div className="ap-task-manager-page-38">
            <div className="ap-task-manager-page-39">
              <span className="ap-task-manager-page-40">
                📎 Attachments {attachments.length > 0 && `(${attachments.length})`}
              </span>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
              cursor: uploading ? "default" : "pointer"
            }} className="ap-task-manager-page-41">
                {uploading ? 'Uploading…' : '+ Add file'}
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={e => handleFilePick(e.target.files[0])} className="ap-task-manager-page-42" />
            </div>

            {/* Dropzone — shown when there are no attachments yet, to invite the first upload */}
            {attachments.length === 0 && <div className="tdm-dropzone ap-task-manager-page-43" onClick={() => fileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => {
            e.preventDefault();
            handleFilePick(e.dataTransfer.files[0]);
          }}>
                <div className="ap-task-manager-page-44">📎</div>
                <div className="ap-task-manager-page-45">Drop a file here or click to upload</div>
                <div className="ap-task-manager-page-46">Images, videos, PDFs, docs · max 25MB</div>
              </div>}

            {attachments.length > 0 && <div className="ap-task-manager-page-47">
                {attachments.map(a => <div key={a._id} className="ap-task-manager-page-48">
                    {a.kind === 'image' ? <a href={a.url} target="_blank" rel="noreferrer">
                        <img src={a.url} alt={a.fileName} className="ap-task-manager-page-49" />
                      </a> : <a href={a.url} target="_blank" rel="noreferrer" className="ap-task-manager-page-50">
                        {FILE_ICON[a.kind] || '📄'}
                      </a>}
                    <div className="ap-task-manager-page-51">
                      <div title={a.fileName} className="ap-task-manager-page-52">
                        {a.fileName}
                      </div>
                      <div className="ap-task-manager-page-53">{fmtBytes(a.size)}</div>
                    </div>
                    <button onClick={() => handleDeleteAttachment(a._id)} title="Remove" className="ap-task-manager-page-54">×</button>
                  </div>)}
              </div>}
          </div>

          {/* ── Tabs: Activity / Comments ── */}
          <div className="ap-task-manager-page-55">
            {[['activity', `🕓 Activity${activityOnly.length ? ` (${activityOnly.length})` : ''}`], ['comments', `💬 Comments${comments.length ? ` (${comments.length})` : ''}`]].map(([key, label]) => <button key={key} onClick={() => setTab(key)} style={{
            color: tab === key ? "var(--brand)" : "var(--text-muted)",
            borderBottom: tab === key ? "2px solid var(--brand)" : "2px solid transparent"
          }} className="ap-task-manager-page-56">
                {label}
              </button>)}
          </div>

          {/* ── Activity feed ── */}
          {tab === 'activity' && <div className="ap-task-manager-page-57">
              {activityOnly.length === 0 && <div className="ap-task-manager-page-58">No activity yet.</div>}
              {activityOnly.map(a => <div key={a._id} className="ap-task-manager-page-59">
                  <div className="ap-task-manager-page-60">
                    {ACTIVITY_ICON[a.type] || '•'}
                  </div>
                  <div className="ap-task-manager-page-61">
                    <div className="ap-task-manager-page-62">
                      <strong className="ap-task-manager-page-63">{a.actor}</strong> {a.message}
                    </div>
                    <div className="ap-task-manager-page-64">{timeAgo(a.at)}</div>
                  </div>
                </div>)}
            </div>}

          {/* ── Comments thread + composer ── */}
          {tab === 'comments' && <div className="ap-task-manager-page-65">
              <div className="ap-task-manager-page-66">
                <Avatar name="Admin" size={28} />
                <div className="ap-task-manager-page-67">
                  <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment…" rows={2} className="ap-task-manager-page-68" />
                  {commentText.trim() && <button onClick={handlePostComment} disabled={posting} style={{
                background: posting ? "var(--xcbd5e1)" : "var(--brand)",
                cursor: posting ? "default" : "pointer"
              }} className="ap-task-manager-page-69">
                      {posting ? 'Posting…' : 'Comment'}
                    </button>}
                </div>
              </div>

              {comments.length === 0 && <div className="ap-task-manager-page-70">No comments yet — be the first to add one.</div>}
              {[...comments].reverse().map(c => <div key={c._id} className="ap-task-manager-page-71">
                  <Avatar name={c.author} size={26} />
                  <div className="ap-task-manager-page-72">
                    <div className="ap-task-manager-page-73">
                      <div className="ap-task-manager-page-74">
                        <span className="ap-task-manager-page-75">{c.author}</span>
                        <span className="ap-task-manager-page-76">{timeAgo(c.at)}</span>
                      </div>
                      <div className="ap-task-manager-page-77">{c.text}</div>
                    </div>
                  </div>
                </div>)}
            </div>}
        </div>

        {/* Footer actions */}
        <div className="ap-task-manager-page-78">
          {task.status !== 'done' && <button onClick={() => onMarkDone(task)} className="ap-task-manager-page-79">
              ✅ Mark Done
            </button>}
          <button onClick={() => onEdit(task)} className="ap-task-manager-page-80">
            ✏️ Edit
          </button>
          <button onClick={() => onDelete(task)} className="ap-task-manager-page-81">
            🗑 Delete
          </button>
        </div>
      </div>
    </div>;
}

// ─── Done Confirm Modal ───────────────────────────────────────────────────────
function DoneModal({
  task,
  onConfirm,
  onCancel,
  saving
}) {
  if (!task) return null;
  return <div className="ap-task-manager-page-82">
      <div className="ap-task-manager-page-83">
        <div className="ap-task-manager-page-84">✅</div>
        <div className="ap-task-manager-page-85">
          <div className="ap-task-manager-page-86">Mark as Done?</div>
          <div className="ap-task-manager-page-87">
            {task.title}
          </div>
        </div>
        <div className="ap-task-manager-page-88">
          <button onClick={onCancel} disabled={saving} className="ap-task-manager-page-89">Cancel</button>
          <button onClick={onConfirm} disabled={saving} style={{
          background: saving ? "var(--success-border)" : "var(--success-text)",
          cursor: saving ? "not-allowed" : "pointer"
        }} className="ap-task-manager-page-90">
            {saving ? 'Saving…' : 'Mark Done'}
          </button>
        </div>
      </div>
    </div>;
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({
  task,
  onConfirm,
  onCancel,
  saving
}) {
  if (!task) return null;
  return <div className="ap-task-manager-page-91">
      <div className="ap-task-manager-page-92">
        <div className="ap-task-manager-page-93">🗑️</div>
        <div className="ap-task-manager-page-94">
          <div className="ap-task-manager-page-95">Delete Task?</div>
          <div className="ap-task-manager-page-96">This task will be moved to Recently Deleted.</div>
          <div className="ap-task-manager-page-97">
            {task.title}
          </div>
        </div>
        <div className="ap-task-manager-page-98">
          <button onClick={onCancel} disabled={saving} className="ap-task-manager-page-99">Cancel</button>
          <button onClick={onConfirm} disabled={saving} style={{
          background: saving ? "var(--danger-border)" : "var(--danger)",
          cursor: saving ? "not-allowed" : "pointer"
        }} className="ap-task-manager-page-100">
            {saving ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>;
}

// ─── Row Action Dropdown ──────────────────────────────────────────────────────
function ActionDropdown({
  task,
  onEdit,
  onDelete,
  onMarkDone
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const item = (label, color, onClick) => <button onClick={() => {
    onClick();
    setOpen(false);
  }} style={{
    color: color || COLORS.h2
  }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'none'} className="ap-task-manager-page-101">
      {label}
    </button>;
  return <div ref={ref} className="ap-task-manager-page-102">
      <button onClick={() => setOpen(o => !o)} className="ap-task-manager-page-103">
        ⋯
      </button>
      {open && <div className="ap-task-manager-page-104">
          {task.status !== 'done' && item('✅ Mark Done', '#16A34A', onMarkDone)}
          {item('✏️ Edit', COLORS.h2, onEdit)}
          {item('🗑 Delete', '#EF4444', onDelete)}
        </div>}
    </div>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TaskManagerPage = () => {
  const [view, setView] = useState('list');
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    todo: 0,
    in_progress: 0,
    done: 0,
    urgent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [taskModal, setTaskModal] = useState(null);
  const [doneModal, setDoneModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [detailTask, setDetailTask] = useState(null); // NEW: detail view state
  const [actionSaving, setActionSaving] = useState(false);

  // ── Task Categories / Labels — DynamicSelect-backed option sets ───────────
  // This page manages its own local modal state (unlike most other pages,
  // which route their "New X" modal through App.jsx's global `modal` state
  // and openModal()), so the option-set hooks are called directly here
  // rather than being passed down as props from App.jsx.
  const { activeItems: activeTaskCategories, add: addTaskCategory } = useTaskCategories();
  const { activeItems: activeTaskLabels, add: addTaskLabel } = useTaskLabels();

  // drag state
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const ghostRef = useRef(null);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([tasksApi.list({
        limit: 200
      }), tasksApi.stats()]);
      if (tRes.success) setTasks(tRes.data);
      if (sRes.success) setStats(sRes.data);
    } catch {
      setError('Could not load tasks.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── search / filter ───────────────────────────────────────────────────────
  const {
    q,
    setQ,
    activeFilters,
    setFilter,
    filtered: searchFiltered
  } = useTableSearch(tasks, ['id', 'title', 'category', 'assignedTo'], {
    status: '',
    priority: ''
  });
  const filtered = searchFiltered.filter(t => !activeFilters.status || t.status === activeFilters.status).filter(t => !activeFilters.priority || t.priority === activeFilters.priority);
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
    title: 'Task Manager',
    filename: 'cooltech-tasks',
    template: 'generic_list',
    subtitle: `AC Services Platform · Tasks · ${filtered.length} records`,
    docId: 'TASKS-EXPORT',
    columns: TASK_COLUMNS,
    rows: filtered
  });

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async form => {
    const res = await tasksApi.create(form);
    if (!res.success) throw new Error(res.message);
    setTasks(prev => [res.data, ...prev]);
    setStats(prev => ({
      ...prev,
      [res.data.status]: (prev[res.data.status] || 0) + 1,
      // FIX: keep the urgent KPI honest too — was never incremented before
      urgent: res.data.priority === 'urgent' ? (prev.urgent || 0) + 1 : prev.urgent
    }));
  };
  const handleEdit = async form => {
    const res = await tasksApi.update(taskModal.task._id, form);
    if (!res.success) throw new Error(res.message);
    setTasks(prev => prev.map(t => t._id === res.data._id ? res.data : t));
    // Refresh stats from the backend after an edit, since priority/status/etc.
    // may all have changed at once — simplest to just resync rather than
    // hand-roll every possible delta.
    tasksApi.stats().then(r => {
      if (r.success) setStats(r.data);
    }).catch(() => {});
  };
  const handleMarkDone = async task => {
    const target = task || doneModal;
    if (!target) return;
    setActionSaving(true);
    try {
      const res = await tasksApi.updateStatus(target._id, 'done');
      if (res.success) {
        setTasks(prev => prev.map(t => t._id === target._id ? {
          ...t,
          status: 'done'
        } : t));
        setStats(prev => ({
          ...prev,
          [target.status]: Math.max(0, (prev[target.status] || 0) - 1),
          done: (prev.done || 0) + 1
        }));
        setDoneModal(null);
        setDetailTask(null);
      }
    } catch {
      setError('Could not update status.');
    } finally {
      setActionSaving(false);
    }
  };
  const handleDelete = async () => {
    setActionSaving(true);
    try {
      const res = await tasksApi.delete(deleteModal._id);
      if (res.success) {
        setTasks(prev => prev.filter(t => t._id !== deleteModal._id));
        setStats(prev => ({
          ...prev,
          [deleteModal.status]: Math.max(0, (prev[deleteModal.status] || 0) - 1),
          urgent: deleteModal.priority === 'urgent' ? Math.max(0, (prev.urgent || 0) - 1) : prev.urgent
        }));
        setDeleteModal(null);
        setDetailTask(null);
      }
    } catch {
      setError('Could not delete task.');
    } finally {
      setActionSaving(false);
    }
  };

  // ── FIX: centralized status-change function used by BOTH drag-and-drop
  // and any other status-change trigger. Updates local state optimistically,
  // calls the backend, rolls back on failure, AND updates the KPI cards —
  // which the original handleDrop never did.
  const changeTaskStatus = async (task, newStatus) => {
    if (!task || task.status === newStatus) return;
    const prevStatus = task.status;

    // Optimistic UI update — board feels instant
    setTasks(prev => prev.map(t => taskKey(t) === taskKey(task) ? {
      ...t,
      status: newStatus
    } : t));
    setStats(prev => ({
      ...prev,
      [prevStatus]: Math.max(0, (prev[prevStatus] || 0) - 1),
      [newStatus]: (prev[newStatus] || 0) + 1
    }));
    try {
      const res = await tasksApi.updateStatus(task._id, newStatus);
      if (!res?.success) throw new Error(res?.message || 'Update failed');
    } catch (e) {
      // Roll back both task state and KPI counts on failure
      setTasks(prev => prev.map(t => taskKey(t) === taskKey(task) ? {
        ...t,
        status: prevStatus
      } : t));
      setStats(prev => ({
        ...prev,
        [newStatus]: Math.max(0, (prev[newStatus] || 0) - 1),
        [prevStatus]: (prev[prevStatus] || 0) + 1
      }));
      setError('Could not update task status.');
    }
  };

  // ── drag handlers ─────────────────────────────────────────────────────────
  // FIX: use taskKey() everywhere (prefers _id) so the drag payload always
  // matches a real, findable identifier — this was the root cause of drag
  // and drop silently failing.
  const handleDragStart = (e, task) => {
    const key = taskKey(task);
    setDraggingId(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    ghost.style.cssText = `position:fixed;top:-1000px;left:-1000px;width:${rect.width}px;opacity:.88;transform:rotate(2deg) scale(1.03);box-shadow:0 12px 32px rgba(0,0,0,.22);border-radius:10px;pointer-events:none;z-index:9999;`;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    e.dataTransfer.setDragImage(ghost, rect.width / 2, 30);
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
    setDragOverIndex(null);
    if (ghostRef.current) {
      document.body.removeChild(ghostRef.current);
      ghostRef.current = null;
    }
  };
  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const key = e.dataTransfer.getData('text/plain');
    if (!key) return;
    // FIX: lookup now matches taskKey() exactly — guaranteed to find the task
    // since the same function generated the drag payload.
    const task = tasks.find(t => taskKey(t) === key);
    setDraggingId(null);
    setDragOverCol(null);
    setDragOverIndex(null);
    if (!task) return;
    await changeTaskStatus(task, targetStatus);
  };
  const handleDragOver = (e, status, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(status);
    setDragOverIndex(idx);
  };

  // ── Kanban column ─────────────────────────────────────────────────────────
  const KanbanCol = ({
    status
  }) => {
    const m = TASK_STATUS_MAP[status];
    const colTasks = tasks.filter(t => t.status === status);
    const isOver = dragOverCol === status;
    return <div onDragOver={e => handleDragOver(e, status, colTasks.length)} onDrop={e => handleDrop(e, status)} style={{
      background: isOver ? m.bg ?? '#F9FAFB' : '#F9FAFB',
      border: `2px ${isOver ? 'dashed' : 'solid'} ${isOver ? m.color : COLORS.border}`
    }} className="ap-task-manager-page-105">
        <div className="ap-task-manager-page-106">
          <span style={{
          color: m.color,
          background: m.bg
        }} className="ap-task-manager-page-107">
            {m.label}
          </span>
          <span className="ap-task-manager-page-108">{colTasks.length}</span>
        </div>

        {colTasks.length === 0 && <div className="ap-task-manager-page-109">
            {isOver ? '📥 Drop here' : 'No tasks'}
          </div>}

        {colTasks.map((task, idx) => {
        const key = taskKey(task);
        const isDragging = draggingId === key;
        const prio = PRIO_COLOR[task.priority] || PRIO_COLOR.normal;
        return <div key={key}>
              {isOver && dragOverIndex === idx && !isDragging && <div style={{
            background: m.color
          }} className="ap-task-manager-page-110" />}
              <div draggable onDragStart={e => handleDragStart(e, task)} onDragEnd={handleDragEnd} onDragOver={e => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverIndex(idx);
          }}
          // FIX: click (not drag) opens the detail modal — only fires on a
          // genuine click since dragstart/dragend don't trigger onClick.
          onClick={() => setDetailTask(task)} className="card ap-task-manager-page-111" style={{
            cursor: isDragging ? "grabbing" : "pointer",
            boxShadow: isDragging ? "none" : "0 1px 4px rgba(0,0,0,.06)",
            opacity: isDragging ? "0.3" : "1",
            transform: isDragging ? "scale(0.97)" : "scale(1)",
            borderLeft: `3px solid ${prio.color}`
          }}>
                <div className="ap-task-manager-page-112">
                  <span style={{
                background: prio.bg,
                color: prio.color
              }} className="ap-task-manager-page-113">
                    {task.priority}
                  </span>
                  <TypeTag type={task.category} />
                </div>
                <div style={{
              color: task.status === 'done' ? "var(--text-muted)" : "var(--text-h1)",
              textDecoration: task.status === 'done' ? "line-through" : "none"
            }} className="ap-task-manager-page-114">
                  {task.title}
                </div>
                <div className="ap-task-manager-page-115">
                  <div className="ap-task-manager-page-116">
                    <Avatar name={task.assignedTo} size={20} />
                    <span className="ap-task-manager-page-117">{(task.assignedTo || '').split(' ')[0]}</span>
                  </div>
                  <div className="ap-task-manager-page-118">
                    <span className="ap-task-manager-page-119">{task.due}</span>
                    {task.status !== 'done' && <button onClick={e => {
                  e.stopPropagation();
                  setDoneModal(task);
                }} title="Mark done" className="ap-task-manager-page-120">✓</button>}
                  </div>
                </div>
              </div>
            </div>;
      })}

        <button onClick={() => setTaskModal({
        mode: 'new'
      })} onMouseEnter={e => {
        e.currentTarget.style.borderColor = m.color;
        e.currentTarget.style.color = m.color;
      }} onMouseLeave={e => {
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.color = COLORS.faint;
      }} className="ap-task-manager-page-121">+ Add Task</button>
      </div>;
  };
  return <div className="fi ap-task-manager-page-122">

      <div className="ap-task-manager-page-123">
        <SectionHdr title="Task Manager" sub={`${tasks.length} tasks · ${stats.todo} to do`} />
        <div className="ap-task-manager-page-124">
          <div className="ap-task-manager-page-125">
            {[['list', '☰ List'], ['kanban', '⊞ Board']].map(([k, l]) => <button key={k} onClick={() => setView(k)} style={{
            background: view === k ? "var(--white)" : "transparent",
            color: view === k ? "var(--text-h1)" : "var(--text-muted)",
            border: `1px solid ${view === k ? COLORS.border : 'transparent'}`
          }} className="ap-task-manager-page-126">{l}</button>)}
          </div>
          <button onClick={() => setTaskModal({
          mode: 'new'
        })} className="ap-task-manager-page-127">
            + New Task
          </button>
        </div>
      </div>

      {error && <div className="ap-task-manager-page-128">
          ⚠️ {error}
        </div>}

      <div className="ap-task-manager-page-129">
        <KCard label="To Do" value={loading ? '…' : stats.todo} sub="pending" icon="📝" iconBg="#F8FAFC" color="#475569" />
        <KCard label="In Progress" value={loading ? '…' : stats.in_progress} sub="ongoing" icon="🔄" iconBg="#FFFBEB" color="#B45309" />
        <KCard label="Done" value={loading ? '…' : stats.done} sub="completed" icon="✅" iconBg="#F0FDF4" color="#16A34A" />
        <KCard label="Urgent" value={loading ? '…' : stats.urgent} sub="high priority" icon="🔴" iconBg="#FEF2F2" color="#DC2626" />
      </div>

      {view === 'kanban' && <div className="ap-task-manager-page-130">
          {COLUMNS.map(status => <KanbanCol key={status} status={status} />)}
        </div>}

      {view === 'list' && <div className="ap-task-manager-page-131">
          <div className="ap-task-manager-page-132">
            <TableSearchBar value={q} onChange={setQ} placeholder="Search by task, category, assignee…" />
            <FilterSelect value={activeFilters.status} onChange={val => setFilter('status', val)} options={['todo', 'in_progress', 'done']} allLabel="All Statuses" />
            <FilterSelect value={activeFilters.priority} onChange={val => setFilter('priority', val)} options={PRIORITIES} allLabel="All Priorities" />
            <div className="ap-task-manager-page-133"><ExportDropdown {...exportProps} /></div>
          </div>

          <div className="ap-task-manager-page-134">
            <table className="ap-task-manager-page-135">
              <Thead cols={['ID', 'Task', 'Category', 'Assigned To', 'Due Date', 'Priority', 'Status', '']} />
              <tbody>
                {loading ? <tr><td colSpan={8} className="ap-task-manager-page-136">Loading tasks…</td></tr> : paginated.length === 0 ? <tr><td colSpan={8} className="ap-task-manager-page-137">No tasks match your filters.</td></tr> : paginated.map((task, i) => <tr key={taskKey(task)} className="row ap-task-manager-page-138" onClick={() => setDetailTask(task)} style={{
              background: task.status === 'done' ? '#F9FAFB' : i % 2 === 0 ? COLORS.white : '#FAFAFA'
            }}>
                    <td className="ap-task-manager-page-139">
                      <span className="ap-task-manager-page-140">{task.id}</span>
                    </td>
                    <td className="ap-task-manager-page-141">
                      <div style={{
                  color: task.status === 'done' ? "var(--text-faint)" : "var(--text-h1)",
                  textDecoration: task.status === 'done' ? "line-through" : "none"
                }} className="ap-task-manager-page-142">
                        {task.title}
                      </div>
                      {task.notes && <div className="ap-task-manager-page-143">
                          {task.notes.slice(0, 60)}{task.notes.length > 60 ? '…' : ''}
                        </div>}
                    </td>
                    <td className="ap-task-manager-page-144"><TypeTag type={task.category} /></td>
                    <td className="ap-task-manager-page-145">
                      <div className="ap-task-manager-page-146">
                        <Avatar name={task.assignedTo} size={24} />
                        <span className="ap-task-manager-page-147">{task.assignedTo}</span>
                      </div>
                    </td>
                    <td className="ap-task-manager-page-148">{task.due}</td>
                    <td className="ap-task-manager-page-149"><PBadge p={task.priority} /></td>
                    <td className="ap-task-manager-page-150"><SBadge s={task.status} map={TASK_STATUS_MAP} /></td>
                    <td onClick={e => e.stopPropagation()} className="ap-task-manager-page-151">
                      <ActionDropdown task={task} onEdit={() => setTaskModal({
                  mode: 'edit',
                  task
                })} onDelete={() => setDeleteModal(task)} onMarkDone={() => setDoneModal(task)} />
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          {totalPages > 0 && <Pagination page={page} totalPages={totalPages} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} from={from} to={to} total={total} />}
        </div>}

      {/* Modals */}
      {taskModal && <TaskModal
        mode={taskModal.mode}
        task={taskModal.task}
        onClose={() => setTaskModal(null)}
        onSave={taskModal.mode === 'new' ? handleCreate : handleEdit}
        taskCategories={activeTaskCategories}
        onAddTaskCategory={addTaskCategory}
        taskLabels={activeTaskLabels}
        onAddTaskLabel={addTaskLabel}
      />}

      {/* NEW: detail view modal, opened by clicking any task card/row */}
      <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} onEdit={task => {
      setDetailTask(null);
      setTaskModal({
        mode: 'edit',
        task
      });
    }} onDelete={task => {
      setDetailTask(null);
      setDeleteModal(task);
    }} onMarkDone={handleMarkDone} toast={(msg, type) => setError(type === 'error' ? msg : '')}
    // FIX: after a comment is posted or a file is uploaded/removed, the
    // backend returns the FULL updated task (with new comments/attachments/
    // activity already merged in). We update both the open detail modal
    // AND the underlying tasks list so the kanban card and list row stay
    // in sync without needing a full refetch.
    onTaskUpdated={updatedTask => {
      setDetailTask(updatedTask);
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    }} />

      <DoneModal task={doneModal} onConfirm={() => handleMarkDone(doneModal)} onCancel={() => setDoneModal(null)} saving={actionSaving} />
      <DeleteModal task={deleteModal} onConfirm={handleDelete} onCancel={() => setDeleteModal(null)} saving={actionSaving} />
    </div>;
};
export default TaskManagerPage;