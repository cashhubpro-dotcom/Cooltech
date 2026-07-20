import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Users, Briefcase, Clock, CheckCircle2, ChevronDown, ChevronUp, X, Mail, Calendar, MapPin, Trash2, UserPlus, Megaphone, Building2, Wrench, Phone, Star, Link as LinkIcon, IndianRupee, Zap, FileText, Tag, GraduationCap, MessageSquare, ExternalLink } from "lucide-react";
import { recruitmentApi } from "../../services/api";
import { fmtDateDMY } from '../../../shared/formatDate';
const STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];
const DEPARTMENTS = ["Technical", "Sales", "Office", "Support"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract"];
const SOURCES = ["Referral", "Job Portal", "Walk-in", "LinkedIn", "Campus"];
const AVATAR_COLOR_CLASSES = ["avatar-c0", "avatar-c1", "avatar-c2", "avatar-c3", "avatar-c4", "avatar-c5", "avatar-c6", "avatar-c7"];
const hashColor = name => AVATAR_COLOR_CLASSES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLOR_CLASSES.length];
const initials = name => name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
const formatDate = d => d ?fmtDateDMY(new Date(d)) : "";
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}
function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide
}) {
  return createPortal(<div className="modal-overlay">
      <div className={`modal-box ${wide ? "modal-box--wide" : "modal-box--narrow"}`}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            {subtitle && <p className="rec-modal-subtitle">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>, document.body);
}

// Reuses the existing DeleteConfirmModal design (.dcm-* classes already in
// your main CSS) — used for both "delete job" and "remove applicant".
function DeleteConfirmModal({
  title,
  message,
  onCancel,
  onConfirm,
  busy
}) {
  return createPortal(<div className="dcm-overlay">
      <div className="dcm-card">
        <div className="dcm-icon-wrap"><i className="dcm-icon">!</i></div>
        <h3 className="dcm-title">{title}</h3>
        <p className="dcm-message">{message}</p>
        <div className="dcm-actions">
          <button className="dcm-btn dcm-btn--cancel" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="dcm-btn dcm-btn--confirm" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>, document.body);
}
function Field({
  label,
  icon: Icon,
  children,
  className
}) {
  return <div className={`form-row ${className || ""}`}>
      <label className="form-label form-label-row">
        {Icon && <Icon size={12} />} {label}
      </label>
      {children}
    </div>;
}
function TagInput({
  tags,
  onChange,
  placeholder
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft("");
  };
  return <div>
      <div className="rec-taginput-row">
        <input className="form-input" value={draft} placeholder={placeholder} onChange={e => setDraft(e.target.value)} onKeyDown={e => {
        if (e.key === "Enter") {
          e.preventDefault();
          add();
        }
      }} />
        <button type="button" onClick={add} className="btn-tag-add">Add</button>
      </div>
      {tags.length > 0 && <div className="rec-tags-editable">
          {tags.map(t => <span key={t} className="tag-pill-removable">
              {t}
              <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} className="tag-remove-btn">
                <X size={11} />
              </button>
            </span>)}
        </div>}
    </div>;
}
function StarRating({
  value,
  onChange,
  size = 15,
  readOnly
}) {
  // Read-only stars render as <span> — this is used inside ApplicantChip
  // (itself a <button>), and a <button> can't legally contain another <button>.
  if (readOnly) {
    return <div className="rec-star-row">
        {[1, 2, 3, 4, 5].map(n => <span key={n} className="rec-star-btn rec-star-btn--readonly">
            <Star size={size} fill={n <= value ? "#FBBF24" : "none"} color={n <= value ? "#FBBF24" : "#E2E8F0"} />
          </span>)}
      </div>;
  }
  return <div className="rec-star-row">
      {[1, 2, 3, 4, 5].map(n => <button type="button" key={n} onClick={() => onChange && onChange(n)} className="rec-star-btn">
          <Star size={size} fill={n <= value ? "#FBBF24" : "none"} color={n <= value ? "#FBBF24" : "#E2E8F0"} />
        </button>)}
    </div>;
}
function Avatar({
  name,
  size = "avatar-md"
}) {
  return <span className={`avatar ${size} ${hashColor(name)}`}>{initials(name)}</span>;
}
function UrgencyBadge({
  urgency
}) {
  if (urgency !== "Urgent") return null;
  return <span className="badge-urgent">
      <Zap size={10} /> Urgent
    </span>;
}
function NewJobModal({
  onClose,
  onCreate
}) {
  const [form, setForm] = useState({
    title: "",
    dept: "Technical",
    type: "Full-time",
    location: "On-site · Vadodara",
    openings: 1,
    experience: "",
    salaryMin: "",
    salaryMax: "",
    urgency: "Normal",
    deadline: "",
    skills: [],
    description: ""
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setErr("");
    try {
      await onCreate({
        ...form,
        openings: Number(form.openings) || 1,
        salaryMin: Number(form.salaryMin) || 0,
        salaryMax: Number(form.salaryMax) || 0
      });
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to create job opening.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal title="New job opening" subtitle="Fill in the role details technicians and applicants will see" onClose={onClose} wide>
      <Field label="Role title">
        <input className="form-input" placeholder="e.g. Junior AC Technician" value={form.title} onChange={set("title")} autoFocus />
      </Field>
      <div className="rec-form-grid-3">
        <Field label="Department">
          <select className="form-select" value={form.dept} onChange={set("dept")}>
            {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select className="form-select" value={form.type} onChange={set("type")}>
            {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Openings" icon={Users}>
          <input type="number" min="1" className="form-input" value={form.openings} onChange={set("openings")} />
        </Field>
      </div>
      <div className="rec-form-grid-2">
        <Field label="Location" icon={MapPin}>
          <input className="form-input" value={form.location} onChange={set("location")} />
        </Field>
        <Field label="Experience required" icon={GraduationCap}>
          <input className="form-input" placeholder="e.g. 2-4 yrs" value={form.experience} onChange={set("experience")} />
        </Field>
      </div>
      <div className="rec-form-grid-3">
        <Field label="Salary min (₹)" icon={IndianRupee}>
          <input type="number" className="form-input" value={form.salaryMin} onChange={set("salaryMin")} />
        </Field>
        <Field label="Salary max (₹)" icon={IndianRupee}>
          <input type="number" className="form-input" value={form.salaryMax} onChange={set("salaryMax")} />
        </Field>
        <Field label="Deadline" icon={Calendar}>
          <input type="date" className="form-input" value={form.deadline} onChange={set("deadline")} />
        </Field>
      </div>
      <Field label="Priority">
        <div className="rec-priority-row">
          {["Normal", "Urgent"].map(u => <button type="button" key={u} onClick={() => setForm(f => ({
          ...f,
          urgency: u
        }))} className={`rec-priority-btn ${form.urgency === u ? "rec-priority-btn--active" : ""}`}>
              {u}
            </button>)}
        </div>
      </Field>
      <Field label="Skills required" icon={Tag}>
        <TagInput tags={form.skills} onChange={skills => setForm(f => ({
        ...f,
        skills
      }))} placeholder="Type a skill, press Enter" />
      </Field>
      <Field label="Role description" icon={FileText}>
        <textarea rows={3} className="form-textarea" placeholder="What will this person do day-to-day?" value={form.description} onChange={set("description")} />
      </Field>
      {err && <p className="gp-error-text">{err}</p>}
      <button onClick={submit} disabled={saving} className="btn btn-primary btn-block">
        {saving ? "Posting…" : "Post opening"}
      </button>
    </Modal>;
}
function NewApplicantModal({
  jobTitle,
  onClose,
  onCreate
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "",
    currentRole: "",
    expectedSalary: "",
    source: "Referral",
    resumeLink: "",
    skills: [],
    notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.value
  }));
  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setErr("");
    try {
      await onCreate({
        ...form,
        experience: Number(form.experience) || 0,
        expectedSalary: Number(form.expectedSalary) || 0
      });
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to add applicant.");
    } finally {
      setSaving(false);
    }
  };
  return <Modal title="Add applicant" subtitle={jobTitle} onClose={onClose} wide>
      <div className="rec-form-grid-2">
        <Field label="Full name">
          <input className="form-input" placeholder="e.g. Priya Nair" value={form.name} onChange={set("name")} autoFocus />
        </Field>
        <Field label="Phone" icon={Phone}>
          <input className="form-input" placeholder="98xxx xxxxx" value={form.phone} onChange={set("phone")} />
        </Field>
      </div>
      <Field label="Email" icon={Mail}>
        <input className="form-input" placeholder="name@mail.com" value={form.email} onChange={set("email")} />
      </Field>
      <div className="rec-form-grid-2">
        <Field label="Experience (yrs)" icon={GraduationCap}>
          <input type="number" min="0" className="form-input" value={form.experience} onChange={set("experience")} />
        </Field>
        <Field label="Expected salary (₹)" icon={IndianRupee}>
          <input type="number" className="form-input" value={form.expectedSalary} onChange={set("expectedSalary")} />
        </Field>
      </div>
      <Field label="Current role / employer">
        <input className="form-input" placeholder="e.g. Technician, Voltas" value={form.currentRole} onChange={set("currentRole")} />
      </Field>
      <div className="rec-form-grid-2">
        <Field label="Source">
          <select className="form-select" value={form.source} onChange={set("source")}>
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Resume link" icon={LinkIcon}>
          <input className="form-input" placeholder="https://..." value={form.resumeLink} onChange={set("resumeLink")} />
        </Field>
      </div>
      <Field label="Skills" icon={Tag}>
        <TagInput tags={form.skills} onChange={skills => setForm(f => ({
        ...f,
        skills
      }))} placeholder="Type a skill, press Enter" />
      </Field>
      <Field label="Notes" icon={MessageSquare}>
        <textarea rows={2} className="form-textarea" placeholder="Screening call notes, referral source, etc." value={form.notes} onChange={set("notes")} />
      </Field>
      {err && <p className="gp-error-text">{err}</p>}
      <button onClick={submit} disabled={saving} className="btn btn-primary btn-block">
        {saving ? "Adding…" : "Add applicant"}
      </button>
    </Modal>;
}
function ApplicantDetailModal({
  applicant,
  jobTitle,
  onClose,
  onUpdate,
  onRequestRemove
}) {
  const [notes, setNotes] = useState(applicant.notes || "");
  const stageKey = applicant.stage.toLowerCase();
  return <Modal title={applicant.name} subtitle={`Applied for ${jobTitle}`} onClose={onClose} wide>
      <div className="rec-detail-hdr">
        <Avatar name={applicant.name} size="avatar-xl" />
        <div className="rec-detail-hdr-meta">
          <div className="rec-detail-hdr-row">
            <span className={`badge stage-chip-${stageKey}`}>{applicant.stage}</span>
            <span className="rec-detail-applied">Applied {formatDate(applicant.appliedOn)}</span>
          </div>
          <StarRating value={applicant.rating || 0} onChange={r => onUpdate({
          rating: r
        })} />
        </div>
      </div>

      <div className="rec-info-grid">
        <div className="rec-info-item"><Mail size={14} /> {applicant.email || "—"}</div>
        <div className="rec-info-item"><Phone size={14} /> {applicant.phone || "—"}</div>
        <div className="rec-info-item"><GraduationCap size={14} /> {applicant.experience || 0} yrs experience</div>
        <div className="rec-info-item"><IndianRupee size={14} /> {applicant.expectedSalary ? `₹${applicant.expectedSalary.toLocaleString("en-IN")} expected` : "—"}</div>
        <div className="rec-info-item"><Briefcase size={14} /> {applicant.currentRole || "—"}</div>
        <div className="rec-info-item"><Tag size={14} /> Source: {applicant.source || "—"}</div>
      </div>

      {applicant.skills?.length > 0 && <div className="rec-skills-block">
          <p className="rec-skills-label">Skills</p>
          <div className="rec-tags-row ap-recruitment-page-1">
            {applicant.skills.map(s => <span key={s} className="tag-pill-blue">{s}</span>)}
          </div>
        </div>}

      {applicant.resumeLink && <a href={applicant.resumeLink} target="_blank" rel="noreferrer" className="rec-resume-link">
          <ExternalLink size={13} /> View resume
        </a>}

      <Field label="Recruiter notes" icon={MessageSquare}>
        <textarea rows={3} className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => onUpdate({
        notes
      })} placeholder="Interview feedback, salary negotiation, etc." />
      </Field>

      <Field label="Pipeline stage">
        <select className={`select-stage stage-chip-${stageKey}`} value={applicant.stage} onChange={e => onUpdate({
        stage: e.target.value
      })}>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      <button onClick={onRequestRemove} className="btn-danger-outline">
        <Trash2 size={14} /> Remove applicant
      </button>
    </Modal>;
}
function StatCard({
  icon: Icon,
  label,
  value,
  tone
}) {
  return <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <span className={`stat-card-icon stat-icon-${tone}`}>
          <Icon size={16} />
        </span>
      </div>
      <div className={`stat-card-value stat-value-${tone}`}>{value}</div>
    </div>;
}
function PipelineBar({
  applicants
}) {
  const total = applicants.length;
  if (total === 0) return <div className="rec-pipeline-bar" />;
  return <div className="rec-pipeline-bar">
      {STAGES.map(s => {
      const count = applicants.filter(a => a.stage === s).length;
      if (count === 0) return null;
      return <div key={s} className={`rec-pipeline-seg stage-bg-${s.toLowerCase()}`} style={{
        width: `${count / total * 100}%`
      }} title={`${s}: ${count}`} />;
    })}
    </div>;
}
function PositionSlots({
  openings,
  hired
}) {
  return <div className="rec-slots-row">
      {Array.from({
      length: openings
    }).map((_, i) => <span key={i} className={`rec-slot ${i < hired ? "rec-slot--filled" : ""}`}>
          <Wrench size={12} />
        </span>)}
    </div>;
}
function ApplicantChip({
  applicant,
  onOpen
}) {
  const stageKey = applicant.stage.toLowerCase();
  return <button onClick={onOpen} className={`rec-app-chip rec-app-chip--${stageKey}`}>
      <Avatar name={applicant.name} />
      <div className="rec-app-chip-body">
        <p className="rec-app-name">{applicant.name}</p>
        <p className="rec-app-meta">{applicant.experience || 0} yrs {applicant.expectedSalary ? `· ₹${(applicant.expectedSalary / 1000).toFixed(0)}k` : ""}</p>
        <StarRating value={applicant.rating || 0} readOnly size={11} />
      </div>
    </button>;
}
function JobCard({
  job,
  onAddApplicant,
  onOpenApplicant,
  onRequestDelete,
  onToggleStatus
}) {
  const [tab, setTab] = useState(null); // null | "details" | "pipeline"
  const total = job.applicants.length;
  const hired = job.applicants.filter(a => a.stage === "Hired").length;
  return <div className="card rec-job-card">
      <div className="rec-job-card-body">
        <div className="rec-job-top">
          <div>
            <div className="rec-job-title-row">
              <h3 className="rec-job-title">{job.title}</h3>
              <span className={`badge-status ${job.status === "Active" ? "badge-status--active" : "badge-status--closed"}`}>
                {job.status}
              </span>
              <UrgencyBadge urgency={job.urgency} />
            </div>
            <p className="rec-job-meta">
              <Building2 size={12} /> {job.dept} <span className="rec-job-meta-sep">·</span>
              <MapPin size={12} /> {job.location} <span className="rec-job-meta-sep">·</span>
              {job.type}
              {job.experience && <><span className="rec-job-meta-sep">·</span><GraduationCap size={12} /> {job.experience}</>}
            </p>
            {(job.salaryMin || job.salaryMax) > 0 && <p className="rec-job-salary">
                <IndianRupee size={12} /> {job.salaryMin?.toLocaleString("en-IN")} – {job.salaryMax?.toLocaleString("en-IN")} /mo
              </p>}
          </div>
          <div className="rec-job-actions">
            <button onClick={() => onToggleStatus(job)} className="btn-status-toggle">
              {job.status === "Active" ? "Close" : "Reopen"}
            </button>
            <button onClick={() => onRequestDelete(job)} className="btn-icon-delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {job.skills?.length > 0 && <div className="rec-tags-row">
            {job.skills.map(s => <span key={s} className="tag-pill">{s}</span>)}
          </div>}

        <div className="rec-row-label">
          <span>Positions filled</span>
          <span>{hired}/{job.openings}</span>
        </div>
        <PositionSlots openings={job.openings} hired={hired} />

        <div className="rec-row-label">
          <span>Pipeline</span>
          <span>{total} applicant{total !== 1 ? "s" : ""}</span>
        </div>
        <PipelineBar applicants={job.applicants} />

        <div className="rec-job-footer">
          <div className="rec-stage-legend">
            {STAGES.map(s => {
            const c = job.applicants.filter(a => a.stage === s).length;
            if (c === 0) return null;
            return <span key={s} className="rec-stage-legend-item">
                  <span className={`rec-stage-dot stage-dot-${s.toLowerCase()}`} /> {s} {c}
                </span>;
          })}
          </div>
          <div className="rec-job-footer-actions">
            <button onClick={() => onAddApplicant(job)} className="btn-add-applicant">
              <UserPlus size={13} /> Add applicant
            </button>
            <button onClick={() => setTab(tab === "details" ? null : "details")} className={`btn-toggle ${tab === "details" ? "btn-toggle--active" : ""}`}>
              <FileText size={13} /> Details
            </button>
            <button onClick={() => setTab(tab === "pipeline" ? null : "pipeline")} className={`btn-toggle ${tab === "pipeline" ? "btn-toggle--active" : ""}`}>
              Pipeline {tab === "pipeline" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>
      </div>

      {tab === "details" && <div className="rec-panel">
          <p className="rec-panel-desc">{job.description || "No description added yet."}</p>
          {job.deadline && <p className="rec-panel-deadline"><Calendar size={12} /> Apply before {job.deadline}</p>}
        </div>}

      {tab === "pipeline" && <div className="rec-panel">
          {total === 0 ? <p className="rec-pipeline-empty">No applicants yet. Add the first candidate to start the pipeline.</p> : <div className="rec-pipeline-grid">
              {STAGES.map(stage => {
          const list = job.applicants.filter(a => a.stage === stage);
          return <div key={stage}>
                    <div className="rec-stage-col-hdr">
                      <span className={`rec-stage-dot stage-dot-${stage.toLowerCase()}`} />
                      {stage} <span className="count">({list.length})</span>
                    </div>
                    <div className="rec-stage-list">
                      {list.map(a => <ApplicantChip key={a._id} applicant={a} onOpen={() => onOpenApplicant(job, a)} />)}
                      {list.length === 0 && <div className="rec-stage-empty">Empty</div>}
                    </div>
                  </div>;
        })}
            </div>}
        </div>}
    </div>;
}
export default function RecruitmentPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showNewJob, setShowNewJob] = useState(false);
  const [applicantTarget, setApplicantTarget] = useState(null);
  const [detail, setDetail] = useState(null); // { job, applicant }

  // Job delete confirmation
  const [jobDeleteTarget, setJobDeleteTarget] = useState(null);
  const [jobDeleteBusy, setJobDeleteBusy] = useState(false);

  // Applicant removal confirmation
  const [applicantDeleteTarget, setApplicantDeleteTarget] = useState(null); // { job, applicant }
  const [applicantDeleteBusy, setApplicantDeleteBusy] = useState(false);
  const clock = useClock();
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await recruitmentApi.list({
          limit: 100
        });
        if (alive) setJobs(res.data || []);
      } catch (e) {
        if (alive) setLoadError(e.message || "Failed to load job openings.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  const stats = useMemo(() => {
    const all = jobs.flatMap(j => j.applicants);
    return {
      open: jobs.filter(j => j.status === "Active").length,
      total: all.length,
      interview: all.filter(a => a.stage === "Interview").length,
      hired: all.filter(a => a.stage === "Hired").length
    };
  }, [jobs]);
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.dept.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── API-backed mutations ────────────────────────────────────────────────
  const createJob = async form => {
    const doc = await recruitmentApi.create(form);
    setJobs(prev => [doc, ...prev]);
  };
  const addApplicant = async (jobId, form) => {
    const updatedJob = await recruitmentApi.addApplicant(jobId, form);
    setJobs(prev => prev.map(j => j._id === jobId ? updatedJob : j));
  };
  const patchApplicant = async (jobId, applicantId, patch) => {
    const updatedJob = await recruitmentApi.updateApplicant(jobId, applicantId, patch);
    setJobs(prev => prev.map(j => j._id === jobId ? updatedJob : j));
    setDetail(d => {
      if (!d || d.applicant._id !== applicantId) return d;
      const freshApplicant = updatedJob.applicants.find(a => a._id === applicantId);
      return freshApplicant ? {
        job: updatedJob,
        applicant: freshApplicant
      } : null;
    });
  };
  const toggleStatus = async job => {
    const updated = await recruitmentApi.update(job._id, {
      status: job.status === "Active" ? "Closed" : "Active"
    });
    setJobs(prev => prev.map(j => j._id === job._id ? updated : j));
  };

  // ── Delete job (soft delete → Recently Deleted) ─────────────────────────
  const confirmDeleteJob = async () => {
    if (!jobDeleteTarget) return;
    setJobDeleteBusy(true);
    try {
      await recruitmentApi.remove(jobDeleteTarget._id);
      setJobs(prev => prev.filter(j => j._id !== jobDeleteTarget._id));
      setJobDeleteTarget(null);
    } catch (e) {
      alert(e.message || "Failed to delete job opening.");
    } finally {
      setJobDeleteBusy(false);
    }
  };

  // ── Remove applicant ────────────────────────────────────────────────────
  const requestRemoveApplicant = () => {
    if (!detail) return;
    setApplicantDeleteTarget({
      job: detail.job,
      applicant: detail.applicant
    });
    setDetail(null); // close the detail modal so the confirm modal isn't stacked underneath it
  };
  const confirmRemoveApplicant = async () => {
    if (!applicantDeleteTarget) return;
    setApplicantDeleteBusy(true);
    try {
      const {
        job,
        applicant
      } = applicantDeleteTarget;
      const updatedJob = await recruitmentApi.removeApplicant(job._id, applicant._id);
      setJobs(prev => prev.map(j => j._id === job._id ? updatedJob : j));
      setApplicantDeleteTarget(null);
    } catch (e) {
      alert(e.message || "Failed to remove applicant.");
    } finally {
      setApplicantDeleteBusy(false);
    }
  };
  return <div className="rec-container">
      <div className="rec-header-row">
        <div>
          <p className="rec-breadcrumb">
            CoolTech <span>/</span> <strong>Recruitment</strong>
          </p>
          <h1 className="rec-title">Recruitment</h1>
          <p className="rec-subtitle">Hiring pipeline for technicians &amp; office staff</p>
        </div>
        <div className="rec-header-actions">
          <span className="rec-clock-chip">
            <Clock size={13} /> {clock}
          </span>
          <button onClick={() => setShowNewJob(true)} className="btn btn-primary">
            <Plus size={16} /> Job Opening
          </button>
        </div>
      </div>

      <div className="kpi-grid-4 rec-kpi-wrap">
        <StatCard icon={Megaphone} label="Open Positions" value={stats.open} tone="blue" />
        <StatCard icon={Users} label="Total Applicants" value={stats.total} tone="slate" />
        <StatCard icon={Briefcase} label="In Interview" value={stats.interview} tone="amber" />
        <StatCard icon={CheckCircle2} label="Hired This Cycle" value={stats.hired} tone="emerald" />
      </div>

      <div className="rec-section-hdr">
        <h2 className="rec-section-title">
          Active Job Openings <span>({filteredJobs.length})</span>
        </h2>
        <div className="rec-section-tools">
          <div className="rec-search-wrap">
            <Search size={14} className="rec-search-icon" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search roles..." className="rec-search-input" />
          </div>
          <div className="seg-control">
            {["All", "Active", "Closed"].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`seg-btn ${statusFilter === s ? "seg-btn--active" : ""}`}>
                {s}
              </button>)}
          </div>
        </div>
      </div>

      {loading && <div className="kb-state-msg">Loading job openings…</div>}

      {!loading && loadError && <div className="kb-state-msg kb-state-msg--error">{loadError}</div>}

      {!loading && !loadError && <div className="rec-job-list">
          {filteredJobs.length === 0 ? <div className="rec-empty-state">
              <Wrench size={28} className="rec-empty-icon" />
              <p className="rec-empty-title">No job openings match this view</p>
              <p className="rec-empty-sub">Try a different search, or post a new role</p>
              <button onClick={() => setShowNewJob(true)} className="btn btn-primary">
                <Plus size={14} /> Job Opening
              </button>
            </div> : filteredJobs.map(job => <JobCard key={job._id} job={job} onAddApplicant={setApplicantTarget} onOpenApplicant={(job, applicant) => setDetail({
        job,
        applicant
      })} onRequestDelete={setJobDeleteTarget} onToggleStatus={toggleStatus} />)}
        </div>}

      {showNewJob && <NewJobModal onClose={() => setShowNewJob(false)} onCreate={createJob} />}

      {applicantTarget && <NewApplicantModal jobTitle={applicantTarget.title} onClose={() => setApplicantTarget(null)} onCreate={form => addApplicant(applicantTarget._id, form)} />}

      {detail && <ApplicantDetailModal applicant={detail.applicant} jobTitle={detail.job.title} onClose={() => setDetail(null)} onUpdate={patch => patchApplicant(detail.job._id, detail.applicant._id, patch)} onRequestRemove={requestRemoveApplicant} />}

      {jobDeleteTarget && <DeleteConfirmModal title="Delete job opening?" message={`This will move "${jobDeleteTarget.title}" to Recently Deleted. You can restore it from there later.`} onCancel={() => setJobDeleteTarget(null)} onConfirm={confirmDeleteJob} busy={jobDeleteBusy} />}

      {applicantDeleteTarget && <DeleteConfirmModal title="Remove applicant?" message={`Remove ${applicantDeleteTarget.applicant.name} from the pipeline? This can't be undone.`} onCancel={() => setApplicantDeleteTarget(null)} onConfirm={confirmRemoveApplicant} busy={applicantDeleteBusy} />}
    </div>;
}