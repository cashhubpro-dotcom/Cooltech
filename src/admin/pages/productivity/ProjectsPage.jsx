import { useState, useEffect } from 'react';
import { projectsApi, customersApi } from '../../services/api';
import { COLORS, FONTS } from '../../constants/tokens';
import { KCard, SectionHdr, BackBtn, Thead } from '../../components/ui/Cards';

// Matches the real Project schema's status enum exactly.
const PROJ_STATUS_MAP = {
  planning: {
    label: "Planning",
    color: "var(--x6366f1)",
    bg: "var(--xeef2ff)"
  },
  active: {
    label: "Active",
    color: COLORS.brand,
    bg: COLORS.brandL
  },
  on_hold: {
    label: "On Hold",
    color: "var(--text-muted)",
    bg: "var(--border)"
  },
  completed: {
    label: "Completed",
    color: "var(--success-text)",
    bg: "var(--success-bg)"
  },
  cancelled: {
    label: "Cancelled",
    color: "var(--danger-text)",
    bg: "var(--danger-bg)"
  }
};
const formatDate = d => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric'
  });
};
const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: `1px solid ${COLORS.border}`,
  fontSize: 13,
  color: COLORS.h1,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box'
};
const Field = ({
  label,
  children
}) => <div>
    <div className="ap-projects-page-1">{label}</div>
    {children}
  </div>;

// ─── ProjectFormModal — used for both Create and Edit ─────────────────────────

const ProjectFormModal = ({
  mode,
  initialProject,
  onClose,
  onSaved
}) => {
  const isEdit = mode === 'edit';
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(() => ({
    name: initialProject?.name || '',
    customer: initialProject?.customer?._id || initialProject?.customer || '',
    description: initialProject?.description || '',
    manager: initialProject?.manager || '',
    status: initialProject?.status || 'planning',
    priority: initialProject?.priority || 'medium',
    startDate: initialProject?.startDate ? String(initialProject.startDate).slice(0, 10) : '',
    endDate: initialProject?.endDate ? String(initialProject.endDate).slice(0, 10) : '',
    budget: initialProject?.budget ?? ''
  }));
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await customersApi.list({
          limit: 200
        });
        if (!cancelled) setCustomers(result.data || []);
      } catch (err) {
        console.error('Failed to load customers', err);
      } finally {
        if (!cancelled) setLoadingCustomers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const set = key => e => setForm(f => ({
    ...f,
    [key]: e.target.value
  }));
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Project name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const selectedCustomer = customers.find(c => c._id === form.customer);
      const payload = {
        name: form.name,
        description: form.description,
        manager: form.manager,
        status: form.status,
        priority: form.priority,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        budget: form.budget === '' ? 0 : Number(form.budget),
        customer: form.customer || undefined,
        customerName: selectedCustomer?.name || ''
      };
      const saved = isEdit ? await projectsApi.update(initialProject._id, payload) : await projectsApi.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message || 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };
  return <div onClick={onClose} className="ap-projects-page-2">
      <div onClick={e => e.stopPropagation()} className="ap-projects-page-3">
        <div className="ap-projects-page-4">
          <div className="ap-projects-page-5">{isEdit ? 'Edit Project' : 'New Project'}</div>
          <button onClick={onClose} className="ap-projects-page-6">×</button>
        </div>

        <form onSubmit={handleSubmit} className="ap-projects-page-7">
          {error && <div className="ap-projects-page-8">{error}</div>}

          <Field label="Project Name *">
            <input required value={form.name} onChange={set('name')} placeholder="e.g. Compressor Upgrade Q1" className="ap-projects-page-9" />
          </Field>

          <Field label="Customer">
            <select value={form.customer} onChange={set('customer')} disabled={loadingCustomers} className="ap-projects-page-9">
              <option value="">{loadingCustomers ? 'Loading…' : 'Select a customer'}</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Description">
            <textarea value={form.description} onChange={set('description')} rows={3} className="ap-projects-page-10" />
          </Field>

          <div className="ap-projects-page-11">
            <Field label="Manager">
              <input value={form.manager} onChange={set('manager')} placeholder="e.g. Rakesh M." className="ap-projects-page-9" />
            </Field>
            <Field label="Budget (₹)">
              <input type="number" min="0" value={form.budget} onChange={set('budget')} className="ap-projects-page-9" />
            </Field>
          </div>

          <div className="ap-projects-page-12">
            <Field label="Start Date">
              <input type="date" value={form.startDate} onChange={set('startDate')} className="ap-projects-page-9" />
            </Field>
            <Field label="Deadline">
              <input type="date" value={form.endDate} onChange={set('endDate')} className="ap-projects-page-9" />
            </Field>
          </div>

          <div className="ap-projects-page-13">
            <Field label="Status">
              <select value={form.status} onChange={set('status')} className="ap-projects-page-9">
                {Object.entries(PROJ_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={set('priority')} className="ap-projects-page-9">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </Field>
          </div>

          <div className="ap-projects-page-14">
            <button type="button" onClick={onClose} className="ap-projects-page-15">
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{
            cursor: saving ? "default" : "pointer",
            opacity: saving ? "0.7" : "1"
          }} className="ap-projects-page-16">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>;
};

// ─── ConfirmModal — used for delete confirmation ───────────────────────────────

const ConfirmModal = ({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel
}) => <div onClick={onCancel} className="ap-projects-page-17">
    <div onClick={e => e.stopPropagation()} className="ap-projects-page-18">
      <div className="ap-projects-page-19">{title}</div>
      <div className="ap-projects-page-20">{message}</div>
      <div className="ap-projects-page-21">
        <button onClick={onCancel} className="ap-projects-page-22">Cancel</button>
        <button onClick={onConfirm} className="ap-projects-page-23">{confirmLabel}</button>
      </div>
    </div>
  </div>;

// ─── ProjectCard ──────────────────────────────────────────────────────────────

const ProjectCard = ({
  proj,
  onSelect
}) => {
  const st = PROJ_STATUS_MAP[proj.status] || {
    label: proj.status,
    color: "#6B7280",
    bg: "#F3F4F6"
  };
  const progress = proj.progress ?? 0;
  return <div onClick={() => onSelect(proj._id)} className="ap-projects-page-24">
      {/* Header */}
      <div className="ap-projects-page-25">
        <div className="ap-projects-page-26">
          <div className="ap-projects-page-27">
            <span className="ap-projects-page-28">{proj.projectId}</span>
            <span style={{
            background: st.bg,
            color: st.color
          }} className="ap-projects-page-29">{st.label}</span>
          </div>
          <div className="ap-projects-page-30">{proj.name}</div>
          <div className="ap-projects-page-31">{proj.customer?.name || proj.customerName || "—"}</div>
        </div>
        <div className="ap-projects-page-32">
          <div className="ap-projects-page-33">Value</div>
          <div className="ap-projects-page-34">
            ₹{proj.budget?.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="ap-projects-page-35">
        <div className="ap-projects-page-36">
          <span>Progress</span><span className="ap-projects-page-37">{progress}%</span>
        </div>
        <div className="ap-projects-page-38">
          <div style={{
          width: `${progress}%`
        }} className="ap-projects-page-39" />
        </div>
      </div>

      {/* Footer */}
      <div className="ap-projects-page-40">
        <span>👤 {proj.manager || "—"}</span>
        <span>📅 {formatDate(proj.endDate) || "—"}</span>
      </div>
    </div>;
};

// ─── ProjectDetail ────────────────────────────────────────────────────────────

const ProjectDetail = ({
  proj,
  onBack,
  onUpdate,
  onEdit,
  onDeleteRequest
}) => {
  const [pendingId, setPendingId] = useState(null);
  const milestones = proj.milestones || [];
  const progress = proj.progress ?? 0;
  const st = PROJ_STATUS_MAP[proj.status] || {
    label: proj.status,
    color: "#6B7280",
    bg: "#F3F4F6"
  };
  const toggleMilestone = async index => {
    const milestone = milestones[index];
    const isUnchecking = milestone.completed;
    if (isUnchecking) {
      const hasLaterDone = milestones.slice(index + 1).some(m => m.completed);
      if (hasLaterDone) return;
    }
    setPendingId(milestone._id);
    try {
      const updatedProject = await projectsApi.toggleMilestone(proj._id, milestone._id, !milestone.completed);
      onUpdate(updatedProject);
    } catch (err) {
      console.error('Failed to update milestone', err);
    } finally {
      setPendingId(null);
    }
  };
  return <div className="fi ap-projects-page-41">
      {/* Breadcrumb + actions */}
      <div className="ap-projects-page-42">
        <div className="ap-projects-page-43">
          <BackBtn onClick={onBack} />
          <span className="ap-projects-page-44">Projects /</span>
          <span className="ap-projects-page-45">{proj.projectId}</span>
        </div>
        <div className="ap-projects-page-46">
          <button onClick={onEdit} className="ap-projects-page-47">
            ✎ Edit
          </button>
          <button onClick={onDeleteRequest} className="ap-projects-page-48">
            🗑 Delete
          </button>
        </div>
      </div>

      <div className="ap-projects-page-49">
        {/* Main */}
        <div className="ap-projects-page-50">
          <div className="ap-projects-page-51">
            <div className="ap-projects-page-52">
              <span style={{
              background: st.bg,
              color: st.color
            }} className="ap-projects-page-53">{st.label}</span>
            </div>
            <div className="ap-projects-page-54">{proj.name}</div>
            <div className="ap-projects-page-55">{proj.customer?.name || proj.customerName || "—"} · Manager: {proj.manager || "—"}</div>

            {/* Progress */}
            <div className="ap-projects-page-56">
              <div className="ap-projects-page-57">
                <span>Overall Progress</span><span className="ap-projects-page-58">{progress}%</span>
              </div>
              <div className="ap-projects-page-59">
                <div style={{
                width: `${progress}%`
              }} className="ap-projects-page-60" />
              </div>
            </div>

            {/* Description */}
            {proj.description && <div className="ap-projects-page-61">
                {proj.description}
              </div>}
          </div>

          {/* Milestones — connected timeline, click to toggle */}
          {milestones.length > 0 && <div className="ap-projects-page-62">
              <div className="ap-projects-page-63">Milestones</div>
              {milestones.map((m, i) => {
            const isLast = i === milestones.length - 1;
            const isLocked = m.completed && milestones.slice(i + 1).some(x => x.completed);
            const isPending = pendingId === m._id;
            return <div key={m._id} onClick={() => !isLocked && !isPending && toggleMilestone(i)} title={isLocked ? "Finish later steps first to undo this one" : undefined} style={{
              cursor: isLocked || isPending ? "not-allowed" : "pointer"
            }} className="ap-projects-page-64">
                    <div className="ap-projects-page-65">
                      <div style={{
                  background: m.completed ? "var(--success)" : "var(--bg)",
                  border: m.completed ? "none" : "1.5px solid var(--border)",
                  opacity: isLocked || isPending ? "0.55" : "1"
                }} className="ap-projects-page-66">
                        {m.completed && "✓"}
                      </div>
                      {!isLast && <div style={{
                  background: m.completed ? "var(--success)" : "var(--border)"
                }} className="ap-projects-page-67" />}
                    </div>
                    <div style={{
                paddingBottom: isLast ? "0" : "20px"
              }} className="ap-projects-page-68">
                      <div style={{
                  color: m.completed ? "var(--text-muted)" : "var(--text-h1)",
                  textDecoration: m.completed ? "line-through" : "none"
                }} className="ap-projects-page-69">
                        {m.title}
                      </div>
                      {formatDate(m.dueDate) && <div className="ap-projects-page-70">{formatDate(m.dueDate)}</div>}
                    </div>
                  </div>;
          })}
              <div className="ap-projects-page-71">Click a milestone to mark it complete or pending</div>
            </div>}
        </div>

        {/* Sidebar */}
        <div className="ap-projects-page-72">
          <div className="ap-projects-page-73">
            <div className="ap-projects-page-74">Project Info</div>
            {[["Client", proj.customer?.name || proj.customerName || "—"], ["Manager", proj.manager || "—"], ["Start Date", formatDate(proj.startDate) || "—"], ["Deadline", formatDate(proj.endDate) || "—"], ["Value", proj.budget ? `₹${proj.budget.toLocaleString()}` : "—"], ["Status", st.label]].map(([k, v]) => <div key={k} className="ap-projects-page-75">
                <span className="ap-projects-page-76">{k}</span>
                <span className="ap-projects-page-77">{v}</span>
              </div>)}
          </div>
        </div>
      </div>
    </div>;
};

// ─── ProjectsPage ─────────────────────────────────────────────────────────────

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [modalMode, setModalMode] = useState(null); // null | 'create' | 'edit'
  const [editingProject, setEditingProject] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await projectsApi.list({
          limit: 200
        });
        if (!cancelled) setProjects(result.data || []);
      } catch (err) {
        if (!cancelled) setError("Failed to load projects");
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const updateProjectInList = updated => {
    setProjects(prev => prev.map(p => p._id === updated._id ? updated : p));
  };
  const handleSaved = savedProject => {
    setProjects(prev => {
      const exists = prev.some(p => p._id === savedProject._id);
      return exists ? prev.map(p => p._id === savedProject._id ? savedProject : p) : [savedProject, ...prev];
    });
    setModalMode(null);
    setEditingProject(null);
  };
  const handleDeleteConfirmed = async () => {
    const proj = confirmDelete;
    try {
      await projectsApi.remove(proj._id); // soft delete — recoverable from Deleted Items
      setProjects(prev => prev.filter(p => p._id !== proj._id));
      setSelectedId(id => id === proj._id ? null : id);
    } catch (err) {
      console.error('Failed to delete project', err);
    } finally {
      setConfirmDelete(null);
    }
  };
  const selected = projects.find(p => p._id === selectedId) || null;
  if (loading) {
    return <div className="ap-projects-page-78">Loading projects…</div>;
  }
  if (error) {
    return <div className="ap-projects-page-79">{error}</div>;
  }
  const filtered = filter === "all" ? projects : projects.filter(p => p.status === filter);
  const totalVal = projects.reduce((a, p) => a + (p.budget || 0), 0);
  const activeProjs = projects.filter(p => p.status === "active");
  return <>
      {selected ? <ProjectDetail proj={selected} onBack={() => setSelectedId(null)} onUpdate={updateProjectInList} onEdit={() => {
      setEditingProject(selected);
      setModalMode('edit');
    }} onDeleteRequest={() => setConfirmDelete(selected)} /> : <div className="fu">
          <div className="ap-projects-page-80">
            <div>
              <div className="ap-projects-page-81">Projects</div>
              <div className="ap-projects-page-82">Large installation & contract project management</div>
            </div>
            <button className="btn ap-projects-page-83" onClick={() => setModalMode('create')}>
              + New Project
            </button>
          </div>

          <div className="ap-projects-page-84">
            {[{
          label: "Total Projects",
          value: projects.length,
          icon: "🏗",
          color: "#3B82F6",
          bg: "#EFF6FF"
        }, {
          label: "Active",
          value: activeProjs.length,
          icon: "⚡",
          color: COLORS.brand,
          bg: COLORS.brandL
        }, {
          label: "Completed",
          value: projects.filter(p => p.status === "completed").length,
          icon: "✅",
          color: "#22C55E",
          bg: "#F0FDF4"
        }, {
          label: "Total Value",
          value: `₹${(totalVal / 1000).toFixed(0)}K`,
          icon: "💰",
          color: "#8B5CF6",
          bg: "#F5F3FF"
        }].map(s => <KCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} iconBg={s.bg} />)}
          </div>

          <div className="ap-projects-page-85">
            {["all", "planning", "active", "on_hold", "completed", "cancelled"].map(f => <button key={f} onClick={() => setFilter(f)} style={{
          background: filter === f ? "var(--brand)" : "var(--bg)",
          color: filter === f ? "white" : "var(--text-muted)"
        }} className="ap-projects-page-86">
                {f === "all" ? "All" : PROJ_STATUS_MAP[f]?.label || f}
              </button>)}
          </div>

          {filtered.length === 0 ? <div className="ap-projects-page-87">No projects in this view yet.</div> : <div className="ap-projects-page-88">
              {filtered.map(p => <ProjectCard key={p._id} proj={p} onSelect={setSelectedId} />)}
            </div>}
        </div>}

      {modalMode && <ProjectFormModal mode={modalMode} initialProject={modalMode === 'edit' ? editingProject : null} onClose={() => {
      setModalMode(null);
      setEditingProject(null);
    }} onSaved={handleSaved} />}

      {confirmDelete && <ConfirmModal title="Delete this project?" message={`"${confirmDelete.name}" will be moved to Deleted Items. You can restore it from there if needed.`} confirmLabel="Delete" onConfirm={handleDeleteConfirmed} onCancel={() => setConfirmDelete(null)} />}
    </>;
};
export default ProjectsPage;