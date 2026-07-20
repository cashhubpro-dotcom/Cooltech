// ClockInOutPage.jsx  ── fully wired to backend CRUD
import { useState, useEffect, useCallback } from "react";
import { COLORS, FONTS } from "../../constants/tokens";
import { SectionHdr } from "../ui/Cards";
import { Thead } from "../ui/Cards";
import { Avatar } from "../ui/Badges";
import * as api from "../../services/attendanceService";
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Clock Helpers ────────────────────────────────────────────────────────────
function fmtClockDur(totalSecs) {
  const s = Math.max(0, Math.floor(totalSecs));
  const h = Math.floor(s / 3600),
    m = Math.floor(s % 3600 / 60),
    sec = s % 60;
  return [h, m, sec].map(x => String(x).padStart(2, "0")).join(":");
}
function fmtClockMins(mins) {
  if (!mins && mins !== 0) return "—";
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function toLocStr(dateVal) {
  if (!dateVal) return "—";
  return new Date(dateVal).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

// ─── Big action button ────────────────────────────────────────────────────────
const ClockBigBtn = ({
  label,
  icon,
  grad,
  shadow,
  onClick,
  disabled
}) => <button onClick={onClick} disabled={disabled} style={{
  cursor: disabled ? "not-allowed" : "pointer",
  background: disabled ? "#94A3B8" : grad,
  boxShadow: `0 4px 14px ${shadow}40`,
  opacity: disabled ? "0.6" : "1"
}} className="ap-clock-in-out-page-1">
    <span>{icon}</span>{label}
  </button>;

// ─── Inline spinner ───────────────────────────────────────────────────────────
const Spinner = () => <div className="ap-clock-in-out-page-2">
    <div className="ap-clock-in-out-page-3" />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;

// ─── Edit Session Modal ───────────────────────────────────────────────────────
const EditModal = ({
  session,
  onClose,
  onSave
}) => {
  const [form, setForm] = useState({
    clockInTime: session.clockInTime ? new Date(session.clockInTime).toISOString().slice(0, 16) : "",
    clockOutTime: session.clockOutTime ? new Date(session.clockOutTime).toISOString().slice(0, 16) : "",
    notes: session.notes || ""
  });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(session._id, {
        clockInTime: form.clockInTime ? new Date(form.clockInTime) : undefined,
        clockOutTime: form.clockOutTime ? new Date(form.clockOutTime) : undefined,
        notes: form.notes
      });
      onClose();
    } catch (e) {
      alert("Save failed: " + (e.error || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };
  const field = (label, key, type = "datetime-local") => <div className="ap-clock-in-out-page-4">
      <div className="ap-clock-in-out-page-5">{label}</div>
      <input type={type} value={form[key]} onChange={e => setForm(f => ({
      ...f,
      [key]: e.target.value
    }))} className="ap-clock-in-out-page-6" />
    </div>;
  return <div className="ap-clock-in-out-page-7">
      <div className="ap-clock-in-out-page-8">
        <div className="ap-clock-in-out-page-9">✏️ Edit Session</div>
        {field("Clock In Time", "clockInTime")}
        {field("Clock Out Time", "clockOutTime")}
        <div className="ap-clock-in-out-page-10">
          <div className="ap-clock-in-out-page-11">Notes</div>
          <textarea value={form.notes} onChange={e => setForm(f => ({
          ...f,
          notes: e.target.value
        }))} rows={3} className="ap-clock-in-out-page-12" />
        </div>
        <div className="ap-clock-in-out-page-13">
          <button onClick={onClose} className="ap-clock-in-out-page-14">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="ap-clock-in-out-page-15">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>;
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({
  session,
  onClose,
  onConfirm
}) => {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm(session._id);
      onClose();
    } catch (e) {
      alert("Delete failed: " + (e.error || "Unknown error"));
    } finally {
      setDeleting(false);
    }
  };
  const inTime = session.clockInTime ? new Date(session.clockInTime).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }) : "—";
  const outTime = session.clockOutTime ? new Date(session.clockOutTime).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }) : "—";
  return <div className="ap-clock-in-out-page-16">
      <div className="ap-clock-in-out-page-17">
        {/* Header */}
        <div className="ap-clock-in-out-page-18">
          <div className="ap-clock-in-out-page-19">🗑️</div>
          <div>
            <div className="ap-clock-in-out-page-20">Delete Session?</div>
            <div className="ap-clock-in-out-page-21">This will move the session to Recently Deleted.</div>
          </div>
        </div>

        {/* Session summary card */}
        <div className="ap-clock-in-out-page-22">
          <div className="ap-clock-in-out-page-23">
            {[["📅 Date", session.date || "—"], ["🕘 Clock In", inTime], ["🕔 Clock Out", outTime], ["⏱ Worked", session.workedMins ? fmtClockMins(session.workedMins) : "—"], ["⚡ Overtime", session.otMins > 0 ? fmtClockMins(session.otMins) : "None"]].map(([label, value]) => <div key={label} className="ap-clock-in-out-page-24">
                <span className="ap-clock-in-out-page-25">{label}</span>
                <span className="ap-clock-in-out-page-26">{value}</span>
              </div>)}
          </div>
        </div>

        {/* Warning note */}
        <div className="ap-clock-in-out-page-27">
          <span className="ap-clock-in-out-page-28">⚠️</span>
          <span className="ap-clock-in-out-page-29">
            You can recover this session later from the <strong>Recently Deleted</strong> page.
          </span>
        </div>

        {/* Actions */}
        <div className="ap-clock-in-out-page-30">
          <button onClick={onClose} className="ap-clock-in-out-page-31">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={deleting} style={{
          cursor: deleting ? "not-allowed" : "pointer",
          opacity: deleting ? "0.7" : "1"
        }} className="ap-clock-in-out-page-32">
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const ClockInOutPage = ({
  currentUserId = "USER_ID_HERE"
}) => {
  // ── Live clock state (derived from active session) ──
  const [activeSession, setActiveSession] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [brkElapsed, setBrkElapsed] = useState(0);
  const [now, setNow] = useState(new Date());

  // ── Page state ──
  const [tab, setTab] = useState("today");
  const [sessions, setSessions] = useState([]);
  const [teamStatus, setTeamStatus] = useState([]);
  const [reports, setReports] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Alert state ──
  const [otDismissed, setOtDismissed] = useState(false);
  const [lateDismissed, setLateDismissed] = useState(false);

  // ── Settings local form ──
  const [localSettings, setLocalSettings] = useState(null);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [newIP, setNewIP] = useState("");

  // ── Derived ──
  const clockStatus = activeSession ? activeSession.status === "on_break" ? "break" : "in" : "out";
  const allBreakSecs = activeSession ? activeSession.totalBreakSecs + (clockStatus === "break" ? brkElapsed : 0) : 0;
  const netSecs = Math.max(0, elapsed - allBreakSecs);
  const otThresholdH = settings?.otThresholdH ?? 9;
  const weeklyTargetH = settings?.weeklyTargetH ?? 45;
  const breakLimitMins = settings?.breakLimitMins ?? 60;
  const shiftStart = settings?.shiftStart ?? "09:00";
  const [shH, shM] = shiftStart.split(":").map(Number);
  const ipEnabled = settings?.ipEnabled ?? false;
  const allowedIPs = settings?.allowedIPs ?? [];
  const MOCK_IP = "192.168.1.100";
  const isOvertime = clockStatus === "in" && netSecs > otThresholdH * 3600 && !otDismissed;
  const isLate = activeSession && new Date(activeSession.clockInTime).getHours() * 60 + new Date(activeSession.clockInTime).getMinutes() > shH * 60 + shM + 5 && !lateDismissed;
  const isBreachBreak = allBreakSecs > breakLimitMins * 60 && clockStatus !== "out";
  const ipBlocked = ipEnabled && !allowedIPs.includes(MOCK_IP);
  const weekMins = sessions.filter(s => s.status === "complete").reduce((a, s) => a + (s.workedMins || 0), 0) + (clockStatus !== "out" ? Math.floor(netSecs / 60) : 0);

  // ── Load active session on mount ──
  const loadActive = useCallback(async () => {
    try {
      const {
        session
      } = await api.getActiveSession(currentUserId);
      setActiveSession(session || null);
      if (!session) {
        setElapsed(0);
        setBrkElapsed(0);
      }
    } catch (_) {}
  }, [currentUserId]);
  const loadSettings = useCallback(async () => {
    try {
      const {
        settings: s
      } = await api.getSettings();
      setSettings(s);
      setLocalSettings(s);
    } catch (_) {}
  }, []);
  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const {
        sessions: s
      } = await api.getSessions({
        userId: currentUserId
      });
      setSessions(s);
    } catch (_) {} finally {
      setLoading(false);
    }
  }, [currentUserId]);
  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const {
        sessions: s
      } = await api.getTeamStatus();
      setTeamStatus(s);
    } catch (_) {} finally {
      setLoading(false);
    }
  }, []);
  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getReports({
        userId: currentUserId
      });
      setReports(data);
    } catch (_) {} finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Initial load
  useEffect(() => {
    loadActive();
    loadSettings();
  }, [loadActive, loadSettings]);

  // Tab-driven lazy loads
  useEffect(() => {
    if (tab === "today" || tab === "history") loadSessions();
    if (tab === "team") loadTeam();
    if (tab === "reports") loadReports();
  }, [tab]); // eslint-disable-line

  // ── Live timer ──
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      if (activeSession) {
        const inTime = new Date(activeSession.clockInTime);
        setElapsed(Math.floor((Date.now() - inTime.getTime()) / 1000));
        if (clockStatus === "break") {
          const lastBrk = activeSession.breaks?.[activeSession.breaks.length - 1];
          if (lastBrk && !lastBrk.endTime) {
            setBrkElapsed(Math.floor((Date.now() - new Date(lastBrk.startTime).getTime()) / 1000));
          }
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [activeSession, clockStatus]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const doClockIn = async () => {
    if (ipBlocked) return alert(`⛔ Your IP (${MOCK_IP}) is not allowed.`);
    setActionBusy(true);
    try {
      const {
        session
      } = await api.clockIn(currentUserId, MOCK_IP);
      setActiveSession(session);
      setElapsed(0);
      setBrkElapsed(0);
      setOtDismissed(false);
      setLateDismissed(false);
      await loadSessions();
    } catch (e) {
      alert(e.error || "Clock in failed");
    } finally {
      setActionBusy(false);
    }
  };
  const doBreakStart = async () => {
    setActionBusy(true);
    try {
      const {
        session
      } = await api.breakStart(currentUserId);
      setActiveSession(session);
      setBrkElapsed(0);
    } catch (e) {
      alert(e.error || "Break start failed");
    } finally {
      setActionBusy(false);
    }
  };
  const doBreakEnd = async () => {
    setActionBusy(true);
    try {
      const {
        session
      } = await api.breakEnd(currentUserId);
      setActiveSession(session);
      setBrkElapsed(0);
    } catch (e) {
      alert(e.error || "Break end failed");
    } finally {
      setActionBusy(false);
    }
  };
  const doClockOut = async () => {
    setActionBusy(true);
    try {
      await api.clockOut(currentUserId);
      setActiveSession(null);
      setElapsed(0);
      setBrkElapsed(0);
      await loadSessions();
    } catch (e) {
      alert(e.error || "Clock out failed");
    } finally {
      setActionBusy(false);
    }
  };

  // ── Session CRUD ─────────────────────────────────────────────────────────────
  const handleUpdateSession = async (id, updates) => {
    const {
      session
    } = await api.updateSession(id, updates);
    setSessions(prev => prev.map(s => s._id === id ? session : s));
  };
  const handleDeleteSession = async id => {
    await api.deleteSession(id);
    setSessions(prev => prev.filter(s => s._id !== id));
  };

  // ── Settings save ─────────────────────────────────────────────────────────────
  // FIX: localSettings is the object we got back from GET /attendance/settings,
  // which includes Mongoose metadata (_id, __v, createdAt, updatedAt). Sending
  // that straight back on PUT can trip up a naive
  // `findOneAndUpdate(filter, req.body)` on the backend (Mongoose rejects
  // writes that include _id) — which is what was causing the 400 Bad Request.
  // Stripping those fields before sending fixes it regardless of exactly how
  // the backend controller is implemented.
  const saveSettings = async () => {
    try {
      const { _id, __v, createdAt, updatedAt, ...updatePayload } = localSettings;
      const {
        settings: s
      } = await api.updateSettings(updatePayload);
      setSettings(s);
      setLocalSettings(s);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (e) {
      // Surface whatever the backend actually sent (message/error/etc.)
      // instead of always saying "Unknown" — makes future 400s self-explanatory.
      const detail = e?.message || e?.error || (typeof e === "string" ? e : JSON.stringify(e));
      alert("Save failed: " + (detail || "Unknown error"));
    }
  };
  const doAddIP = async () => {
    if (!newIP.trim()) return;
    try {
      const {
        settings: s
      } = await api.addIP(newIP.trim());
      setSettings(s);
      setLocalSettings(s);
      setNewIP("");
    } catch (e) {
      alert(e.error || "Add IP failed");
    }
  };
  const doRemoveIP = async ip => {
    try {
      const {
        settings: s
      } = await api.removeIP(ip);
      setSettings(s);
      setLocalSettings(s);
    } catch (e) {
      alert(e.error || "Remove IP failed");
    }
  };

  // ── Style maps ────────────────────────────────────────────────────────────────
  const sColor = {
    in: "#16A34A",
    break: "#D97706",
    out: COLORS.faint
  }[clockStatus];
  const sLabel = {
    in: "🟢 CLOCKED IN — WORKING",
    break: "🟡 ON BREAK",
    out: "⚪ NOT CLOCKED IN"
  }[clockStatus];
  const cardBg = {
    in: "linear-gradient(135deg,#ECFDF5,#D1FAE5)",
    break: "linear-gradient(135deg,#FFFBEB,#FEF3C7)",
    out: `linear-gradient(135deg,${COLORS.brandL},#FFE4C4)`
  }[clockStatus];
  const cardBdr = {
    in: "#A7F3D0",
    break: "#FDE68A",
    out: `${COLORS.brand}30`
  }[clockStatus];

  // ─── Render ───────────────────────────────────────────────────────────────────
  return <div className="ap-clock-in-out-page-33">
      <SectionHdr title="⏱ Clock In / Out" sub="Track your work hours, breaks, overtime and attendance" />
      <div className="ap-clock-in-out-page-34" />

      {/* ── Alerts ── */}
      {ipBlocked && <div className="ap-clock-in-out-page-35">
          <span className="ap-clock-in-out-page-36">⛔</span>
          <div className="ap-clock-in-out-page-37">
            <div className="ap-clock-in-out-page-38">Clock-In Blocked — IP Not Allowed</div>
            <div className="ap-clock-in-out-page-39">Your IP <strong>{MOCK_IP}</strong> is not in the allowed list.</div>
          </div>
          <button onClick={() => setTab("settings")} className="ap-clock-in-out-page-40">Manage IPs →</button>
        </div>}
      {isOvertime && <div className="ap-clock-in-out-page-41">
          <span className="ap-clock-in-out-page-42">⚠️</span>
          <div className="ap-clock-in-out-page-43">
            <div className="ap-clock-in-out-page-44">Overtime Alert — {fmtClockDur(netSecs - otThresholdH * 3600)} over daily limit</div>
            <div className="ap-clock-in-out-page-45">You've worked more than <strong>{otThresholdH}h</strong> today.</div>
          </div>
          <button onClick={() => setOtDismissed(true)} className="ap-clock-in-out-page-46">Dismiss</button>
        </div>}
      {isLate && clockStatus === "in" && <div className="ap-clock-in-out-page-47">
          <span className="ap-clock-in-out-page-48">🕐</span>
          <div className="ap-clock-in-out-page-49">
            <div className="ap-clock-in-out-page-50">Late Arrival Detected</div>
            <div className="ap-clock-in-out-page-51">
              Clocked in at <strong>{toLocStr(activeSession?.clockInTime)}</strong> — shift starts at <strong>{shiftStart}</strong>.
            </div>
          </div>
          <button onClick={() => setLateDismissed(true)} className="ap-clock-in-out-page-52">Dismiss</button>
        </div>}
      {isBreachBreak && <div className="ap-clock-in-out-page-53">
          <span className="ap-clock-in-out-page-54">☕</span>
          <div className="ap-clock-in-out-page-55">
            <div className="ap-clock-in-out-page-56">Break Limit Exceeded</div>
            <div className="ap-clock-in-out-page-57">Total break <strong>{fmtClockMins(Math.floor(allBreakSecs / 60))}</strong> exceeds {breakLimitMins}m daily limit.</div>
          </div>
        </div>}

      {/* ── Main Clock Card ── */}
      <div style={{
      background: cardBg,
      border: `2px solid ${cardBdr}`
    }} className="ap-clock-in-out-page-58">
        <div>
          <div style={{
          color: sColor
        }} className="ap-clock-in-out-page-59">{sLabel}</div>
          <div style={{
          color: clockStatus === "in" ? netSecs > otThresholdH * 3600 ? "#C2410C" : "#15803D" : clockStatus === "break" ? "#92400E" : COLORS.faint
        }} className="ap-clock-in-out-page-60">
            {clockStatus !== "out" ? fmtClockDur(netSecs) : "00:00:00"}
          </div>
          {clockStatus === "in" && netSecs > otThresholdH * 3600 && <div className="ap-clock-in-out-page-61">
              <span className="ap-clock-in-out-page-62">⚡</span>
              <span className="ap-clock-in-out-page-63">OT: +{fmtClockDur(netSecs - otThresholdH * 3600)}</span>
            </div>}
          <div className="ap-clock-in-out-page-64">
            {clockStatus !== "out" && activeSession ? `Started at ${toLocStr(activeSession.clockInTime)}` : now.toLocaleTimeString("en-IN", {
            hour12: true
          })}
          </div>
          {clockStatus === "break" && <div className="ap-clock-in-out-page-65">Break time: {fmtClockDur(brkElapsed)}</div>}
        </div>
        <div className="ap-clock-in-out-page-66">
          {clockStatus === "out" && <ClockBigBtn label="Clock In" icon="▶" grad="linear-gradient(135deg,#16A34A,#15803D)" shadow="#16A34A" onClick={doClockIn} disabled={actionBusy || ipBlocked} />}
          {clockStatus === "in" && <><ClockBigBtn label="Start Break" icon="⏸" grad="linear-gradient(135deg,#F59E0B,#D97706)" shadow="#D97706" onClick={doBreakStart} disabled={actionBusy} /><ClockBigBtn label="Clock Out" icon="⏹" grad="linear-gradient(135deg,#EF4444,#DC2626)" shadow="#DC2626" onClick={doClockOut} disabled={actionBusy} /></>}
          {clockStatus === "break" && <><ClockBigBtn label="Resume Work" icon="▶" grad="linear-gradient(135deg,#16A34A,#15803D)" shadow="#16A34A" onClick={doBreakEnd} disabled={actionBusy} /><ClockBigBtn label="Clock Out" icon="⏹" grad="linear-gradient(135deg,#EF4444,#DC2626)" shadow="#DC2626" onClick={doClockOut} disabled={actionBusy} /></>}
          <div className="ap-clock-in-out-page-67">
            <div className="ap-clock-in-out-page-68"><div className="ap-clock-in-out-page-69">Break</div><div style={{
              color: isBreachBreak ? "var(--danger-text)" : "var(--text-h2)"
            }} className="ap-clock-in-out-page-70">{fmtClockDur(allBreakSecs)}</div></div>
            <div className="ap-clock-in-out-page-71"><div className="ap-clock-in-out-page-72">This Week</div><div style={{
              color: weekMins > weeklyTargetH * 60 ? "var(--brand-dark)" : "var(--text-h2)"
            }} className="ap-clock-in-out-page-73">{fmtClockMins(weekMins)}</div></div>
          </div>
        </div>
      </div>

      {/* ── Stat Row ── */}
      <div className="ap-clock-in-out-page-74">
        {[{
        label: "Today Worked",
        value: clockStatus !== "out" ? fmtClockDur(netSecs) : "—",
        icon: "⏱",
        color: "#3B82F6",
        bg: "#EFF6FF"
      }, {
        label: "Break Taken",
        value: fmtClockMins(Math.floor(allBreakSecs / 60)),
        icon: "☕",
        color: isBreachBreak ? "#DC2626" : "#D97706",
        bg: isBreachBreak ? "#FEF2F2" : "#FFFBEB"
      }, {
        label: "Overtime Today",
        value: netSecs > otThresholdH * 3600 ? fmtClockDur(netSecs - otThresholdH * 3600) : "—",
        icon: "⚡",
        color: netSecs > otThresholdH * 3600 ? "#C2410C" : COLORS.faint,
        bg: netSecs > otThresholdH * 3600 ? "#FFF7ED" : COLORS.bg
      }, {
        label: "Clocked In At",
        value: activeSession ? toLocStr(activeSession.clockInTime) : "—",
        icon: "🕘",
        color: COLORS.brand,
        bg: COLORS.brandL
      }, {
        label: "This Week",
        value: fmtClockMins(weekMins),
        icon: "📅",
        color: weekMins > weeklyTargetH * 60 ? "#C2410C" : "#7C3AED",
        bg: weekMins > weeklyTargetH * 60 ? "#FFF7ED" : "#F5F3FF"
      }].map(s => <div key={s.label} className="card ap-clock-in-out-page-75">
            <div className="ap-clock-in-out-page-76">
              <div className="ap-clock-in-out-page-77">{s.label}</div>
              <div style={{
            background: s.bg
          }} className="ap-clock-in-out-page-78">{s.icon}</div>
            </div>
            <div style={{
          color: s.color
        }} className="ap-clock-in-out-page-79">{s.value}</div>
          </div>)}
      </div>

      {/* ── Tabs ── */}
      <div className="ap-clock-in-out-page-80">
        {[["today", "📋 Today"], ["team", "👥 Team"], ["history", "📊 History"], ["reports", "📈 Reports"], ["settings", "⚙ Settings"]].map(([id, lbl]) => <button key={id} onClick={() => setTab(id)} style={{
        background: tab === id ? "var(--white)" : "transparent",
        color: tab === id ? "var(--text-h1)" : "var(--text-muted)",
        boxShadow: tab === id ? "0 1px 4px rgba(0,0,0,.08)" : "none"
      }} className="ap-clock-in-out-page-81">{lbl}</button>)}
      </div>

      {/* ══════════ TODAY TAB ══════════ */}
      {tab === "today" && <div className="ap-clock-in-out-page-82">
          <div className="ap-clock-in-out-page-83">
            <div className="ap-clock-in-out-page-84">Today's Attendance Log</div>
            <div className="ap-clock-in-out-page-85">{fmtDateDMY(new Date())}</div>
          </div>
          {loading ? <Spinner /> : <div className="ap-clock-in-out-page-86"><table className="ap-clock-in-out-page-87">
              <Thead cols={["Event", "Time", "Duration", "Status", "Notes"]} />
              <tbody>
                {!activeSession && sessions.filter(s => s.date === new Date().toISOString().slice(0, 10)).length === 0 && <tr><td colSpan={5} className="ap-clock-in-out-page-88">No attendance recorded today yet. Click Clock In to start.</td></tr>}
                {activeSession && <tr className="ap-clock-in-out-page-89">
                    <td className="ap-clock-in-out-page-90">Clock In</td>
                    <td className="ap-clock-in-out-page-91">{toLocStr(activeSession.clockInTime)}</td>
                    <td className="ap-clock-in-out-page-92">{fmtClockDur(netSecs)}</td>
                    <td className="ap-clock-in-out-page-93"><span className="badge ap-clock-in-out-page-94">● {clockStatus === "break" ? "On Break" : "Active"}</span></td>
                    <td className="ap-clock-in-out-page-95">{isLate ? `Late arrival` : "On time"}</td>
                  </tr>}
                {sessions.filter(s => s.date === new Date().toISOString().slice(0, 10) && s.status === "complete").map(s => <tr key={s._id} className="ap-clock-in-out-page-96">
                    <td className="ap-clock-in-out-page-97">Clocked Out</td>
                    <td className="ap-clock-in-out-page-98">{toLocStr(s.clockOutTime)}</td>
                    <td className="ap-clock-in-out-page-99">{fmtClockMins(s.workedMins)}</td>
                    <td className="ap-clock-in-out-page-100"><span className="badge ap-clock-in-out-page-101">✓ Complete</span></td>
                    <td style={{
                color: (s.otMins || 0) > 0 ? "var(--brand-dark)" : "var(--text-faint)"
              }} className="ap-clock-in-out-page-102">{(s.otMins || 0) > 0 ? `⚡ OT: +${fmtClockMins(s.otMins)}` : "No overtime"}</td>
                  </tr>)}
              </tbody>
            </table></div>}
        </div>}

      {/* ══════════ TEAM TAB ══════════ */}
      {tab === "team" && <div className="ap-clock-in-out-page-103">
          <div className="ap-clock-in-out-page-104">
            <div className="ap-clock-in-out-page-105">Team Clock Status</div>
          </div>
          {loading ? <Spinner /> : <div className="ap-clock-in-out-page-106">
              {teamStatus.length === 0 && <div className="ap-clock-in-out-page-107">No team data yet.</div>}
              {teamStatus.map(s => {
          const name = s.userId?.name || "Unknown";
          const role = s.userId?.role || "";
          const sc = s.status === "active" ? {
            c: "#16A34A",
            bg: "#ECFDF5",
            lbl: "Clocked In"
          } : s.status === "on_break" ? {
            c: "#D97706",
            bg: "#FFFBEB",
            lbl: "On Break"
          } : {
            c: "#64748B",
            bg: "#F8FAFC",
            lbl: "Not Clocked"
          };
          return <div key={s._id} style={{
            border: `1px solid ${sc.c}25`
          }} className="ap-clock-in-out-page-108">
                    <Avatar name={name} size={38} color={sc.c} />
                    <div className="ap-clock-in-out-page-109">
                      <div className="ap-clock-in-out-page-110">{name}</div>
                      <div className="ap-clock-in-out-page-111">{role}</div>
                      <div style={{
                color: sc.c
              }} className="ap-clock-in-out-page-112">
                        {s.status === "active" ? `Since ${toLocStr(s.clockInTime)}` : sc.lbl}
                      </div>
                    </div>
                    <span style={{
              color: sc.c,
              background: sc.bg
            }} className="ap-clock-in-out-page-113">{sc.lbl}</span>
                  </div>;
        })}
            </div>}
        </div>}

      {/* ══════════ HISTORY TAB ══════════ */}
      {tab === "history" && <div className="ap-clock-in-out-page-114">
          <div className="ap-clock-in-out-page-115">
            <div className="ap-clock-in-out-page-116">Attendance History</div>
          </div>
          {loading ? <Spinner /> : <div className="ap-clock-in-out-page-117"><table className="ap-clock-in-out-page-118">
              <Thead cols={["Date", "Clock In", "Clock Out", "Break", "Net Work", "Overtime", "Status", "Actions"]} />
              <tbody>
                {sessions.length === 0 && <tr><td colSpan={8} className="ap-clock-in-out-page-119">No history yet.</td></tr>}
                {sessions.map((s, i) => <tr key={s._id} className="row ap-clock-in-out-page-120" style={{
              background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
            }}>
                    <td className="ap-clock-in-out-page-121">
                      <div className="ap-clock-in-out-page-122">{s.date}</div>
                    </td>
                    <td className="ap-clock-in-out-page-123">
                      <div className="ap-clock-in-out-page-124">{toLocStr(s.clockInTime)}</div>
                      {(s.lateMins || 0) > 5 && <div className="ap-clock-in-out-page-125">⏰ Late {s.lateMins}m</div>}
                    </td>
                    <td className="ap-clock-in-out-page-126">{toLocStr(s.clockOutTime)}</td>
                    <td className="ap-clock-in-out-page-127">{s.totalBreakSecs ? `${Math.floor(s.totalBreakSecs / 60)}m` : "—"}</td>
                    <td className="ap-clock-in-out-page-128">{fmtClockMins(s.workedMins)}</td>
                    <td className="ap-clock-in-out-page-129">
                      {(s.otMins || 0) > 0 ? <span className="badge ap-clock-in-out-page-130">⚡ +{fmtClockMins(s.otMins)}</span> : <span className="ap-clock-in-out-page-131">—</span>}
                    </td>
                    <td className="ap-clock-in-out-page-132">
                      <span className="badge" style={{
                  background: s.status === "active" ? "var(--success-bg)" : "var(--info-bg)",
                  color: s.status === "active" ? "var(--success-text)" : "var(--info-text)"
                }}>
                        {s.status === "active" ? "● Active" : s.status === "on_break" ? "⏸ Break" : "✓ Complete"}
                      </span>
                    </td>
                    <td className="ap-clock-in-out-page-133">
                      <div className="ap-clock-in-out-page-134">
                        <button onClick={() => setEditTarget(s)} className="ap-clock-in-out-page-135">Edit</button>
                        <button onClick={() => setDeleteTarget(s)} className="ap-clock-in-out-page-136">Delete</button>
                      </div>
                    </td>
                  </tr>)}
              </tbody>
            </table></div>}
        </div>}

      {/* ══════════ REPORTS TAB ══════════ */}
      {tab === "reports" && <div className="ap-clock-in-out-page-137">
          {loading ? <Spinner /> : reports && <>
              <div className="ap-clock-in-out-page-138">
                {[{
            label: "Total Hours",
            value: fmtClockMins(reports.totalWorkedMins),
            sub: `${reports.totalSessions} sessions`,
            color: "#3B82F6",
            bg: "#EFF6FF",
            icon: "⏱"
          }, {
            label: "Overtime",
            value: fmtClockMins(reports.totalOTMins),
            sub: reports.totalOTMins > 0 ? "Needs review" : "None",
            color: reports.totalOTMins > 0 ? "#C2410C" : COLORS.faint,
            bg: reports.totalOTMins > 0 ? "#FFF7ED" : COLORS.bg,
            icon: "⚡"
          }, {
            label: "Late Arrivals",
            value: `${reports.totalLateDays} day${reports.totalLateDays !== 1 ? "s" : ""}`,
            sub: "vs shift start",
            color: reports.totalLateDays > 0 ? "#B45309" : COLORS.faint,
            bg: reports.totalLateDays > 0 ? "#FFFBEB" : COLORS.bg,
            icon: "🕐"
          }, {
            label: "Avg Daily Hours",
            value: fmtClockMins(reports.avgWorkedMins),
            sub: `Max: ${fmtClockMins(reports.maxWorkedMins)}`,
            color: "#7C3AED",
            bg: "#F5F3FF",
            icon: "📊"
          }].map(s => <div key={s.label} className="card ap-clock-in-out-page-139">
                    <div className="ap-clock-in-out-page-140">
                      <div className="ap-clock-in-out-page-141">{s.label}</div>
                      <div style={{
                background: s.bg
              }} className="ap-clock-in-out-page-142">{s.icon}</div>
                    </div>
                    <div style={{
              color: s.color
            }} className="ap-clock-in-out-page-143">{s.value}</div>
                    <div className="ap-clock-in-out-page-144">{s.sub}</div>
                  </div>)}
              </div>
              <div className="ap-clock-in-out-page-145">
                <div className="ap-clock-in-out-page-146">Session Breakdown</div>
                <div className="ap-clock-in-out-page-147"><table className="ap-clock-in-out-page-148">
                  <Thead cols={["Date", "In", "Out", "Work", "Break", "Overtime", "Late", "Efficiency"]} />
                  <tbody>
                    {reports.sessions.map((s, i) => {
                  const eff = s.workedMins && otThresholdH ? Math.min(100, Math.round(Math.min(s.workedMins, otThresholdH * 60) / (otThresholdH * 60) * 100)) : 0;
                  return <tr key={s._id} className="row ap-clock-in-out-page-149" style={{
                    background: i % 2 === 0 ? "var(--white)" : "var(--bg)"
                  }}>
                          <td className="ap-clock-in-out-page-150">{s.date}</td>
                          <td className="ap-clock-in-out-page-151">{toLocStr(s.clockInTime)}</td>
                          <td className="ap-clock-in-out-page-152">{toLocStr(s.clockOutTime)}</td>
                          <td className="ap-clock-in-out-page-153">{fmtClockMins(s.workedMins)}</td>
                          <td className="ap-clock-in-out-page-154">{s.totalBreakSecs ? `${Math.floor(s.totalBreakSecs / 60)}m` : "—"}</td>
                          <td className="ap-clock-in-out-page-155">{(s.otMins || 0) > 0 ? <span className="badge ap-clock-in-out-page-156">+{fmtClockMins(s.otMins)}</span> : <span className="ap-clock-in-out-page-157">—</span>}</td>
                          <td className="ap-clock-in-out-page-158">{(s.lateMins || 0) > 5 ? <span className="badge ap-clock-in-out-page-159">{s.lateMins}m late</span> : <span className="ap-clock-in-out-page-160">On time</span>}</td>
                          <td className="ap-clock-in-out-page-161">
                            <div className="ap-clock-in-out-page-162">
                              <div className="ap-clock-in-out-page-163">
                                <div style={{
                            width: `${eff}%`,
                            background: eff >= 90 ? "#16A34A" : eff >= 70 ? COLORS.brand : "#DC2626"
                          }} className="ap-clock-in-out-page-164" />
                              </div>
                              <span style={{
                          color: eff >= 90 ? "#16A34A" : eff >= 70 ? COLORS.brand : "#DC2626"
                        }} className="ap-clock-in-out-page-165">{eff}%</span>
                            </div>
                          </td>
                        </tr>;
                })}
                  </tbody>
                </table></div>
              </div>
            </>}
        </div>}

      {/* ══════════ SETTINGS TAB ══════════ */}
      {tab === "settings" && localSettings && <div className="ap-clock-in-out-page-166">
          {/* Shift Settings */}
          <div className="ap-clock-in-out-page-167">
            <div className="ap-clock-in-out-page-168">🕘 Shift & Hour Settings</div>
            {[{
          label: "Shift Start Time",
          key: "shiftStart",
          type: "time"
        }, {
          label: "Shift End Time",
          key: "shiftEnd",
          type: "time"
        }].map(({
          label,
          key,
          type
        }) => <div key={key} className="ap-clock-in-out-page-169">
                <div className="ap-clock-in-out-page-170">{label}</div>
                <input type={type} value={localSettings[key] || ""} onChange={e => setLocalSettings(p => ({
            ...p,
            [key]: e.target.value
          }))} className="ap-clock-in-out-page-171" />
              </div>)}
            {[{
          label: "Daily OT Threshold (hours)",
          key: "otThresholdH",
          min: 6,
          max: 12,
          step: 1,
          color: COLORS.brand,
          fmt: v => `${v}h`
        }, {
          label: "Weekly Target (hours)",
          key: "weeklyTargetH",
          min: 30,
          max: 60,
          step: 1,
          color: "#7C3AED",
          fmt: v => `${v}h`
        }, {
          label: "Max Break Per Day (mins)",
          key: "breakLimitMins",
          min: 15,
          max: 120,
          step: 5,
          color: "#D97706",
          fmt: v => `${v}m`
        }].map(({
          label,
          key,
          min,
          max,
          step,
          color,
          fmt
        }) => <div key={key} className="ap-clock-in-out-page-172">
                <div className="ap-clock-in-out-page-173">{label}</div>
                <div className="ap-clock-in-out-page-174">
                  <input type="range" min={min} max={max} step={step} value={localSettings[key] ?? min} onChange={e => setLocalSettings(p => ({
              ...p,
              [key]: Number(e.target.value)
            }))} className="ap-clock-in-out-page-175" />
                  <span style={{
              color
            }} className="ap-clock-in-out-page-176">{fmt(localSettings[key])}</span>
                </div>
              </div>)}
            <button onClick={saveSettings} className="btn ap-clock-in-out-page-177">
              {settingsSaved ? "✓ Saved!" : "Save Settings"}
            </button>
          </div>

          {/* IP Restriction */}
          <div className="ap-clock-in-out-page-178">
            <div className="ap-clock-in-out-page-179">
              <div className="ap-clock-in-out-page-180">🌐 IP Restriction</div>
              <label className="toggle ap-clock-in-out-page-181">
                <input type="checkbox" checked={localSettings.ipEnabled || false} onChange={e => {
              const v = e.target.checked;
              setLocalSettings(p => ({
                ...p,
                ipEnabled: v
              }));
              api.updateSettings({
                ipEnabled: v
              }).then(({
                settings: s
              }) => setSettings(s));
            }} className="ap-clock-in-out-page-182" />
                <span className="tog-sl" />
              </label>
            </div>
            <div className="ap-clock-in-out-page-183">
              When enabled, employees can only clock in from approved IP addresses.
            </div>
            <div style={{
          background: ipEnabled && allowedIPs.includes(MOCK_IP) ? "#ECFDF5" : ipEnabled ? "#FEF2F2" : COLORS.bg,
          border: `1px solid ${ipEnabled && allowedIPs.includes(MOCK_IP) ? "#A7F3D0" : ipEnabled ? "#FECACA" : COLORS.border}`
        }} className="ap-clock-in-out-page-184">
              <span className="ap-clock-in-out-page-185">{ipEnabled && allowedIPs.includes(MOCK_IP) ? "✅" : ipEnabled ? "⛔" : "🌐"}</span>
              <div>
                <div className="ap-clock-in-out-page-186">Current IP: <span className="ap-clock-in-out-page-187">{MOCK_IP}</span></div>
                <div style={{
              color: ipEnabled && allowedIPs.includes(MOCK_IP) ? "#16A34A" : ipEnabled ? "#DC2626" : COLORS.muted
            }} className="ap-clock-in-out-page-188">
                  {ipEnabled ? allowedIPs.includes(MOCK_IP) ? "✓ Allowed" : "✗ Blocked" : "IP restriction is off"}
                </div>
              </div>
            </div>
            <div className="ap-clock-in-out-page-189">Allowed IPs ({allowedIPs.length})</div>
            <div className="ap-clock-in-out-page-190">
              {allowedIPs.map(ip => <div key={ip} className="ap-clock-in-out-page-191">
                  <span className="ap-clock-in-out-page-192">{ip}</span>
                  {ip === MOCK_IP && <span className="badge ap-clock-in-out-page-193">Current</span>}
                  <button onClick={() => doRemoveIP(ip)} className="ap-clock-in-out-page-194">✕</button>
                </div>)}
              {allowedIPs.length === 0 && <div className="ap-clock-in-out-page-195">No IPs added yet.</div>}
            </div>
            <div className="ap-clock-in-out-page-196">
              <input value={newIP} onChange={e => setNewIP(e.target.value)} onKeyDown={e => {
            if (e.key === "Enter") doAddIP();
          }} placeholder="e.g. 192.168.1.50" className="ap-clock-in-out-page-197" />
              <button onClick={doAddIP} className="btn ap-clock-in-out-page-198">+ Add</button>
            </div>
            {!allowedIPs.includes(MOCK_IP) && <button onClick={() => {
          setNewIP(MOCK_IP);
          doAddIP();
        }} className="ap-clock-in-out-page-199">
                + Add Current IP ({MOCK_IP})
              </button>}
          </div>
        </div>}

      {/* ── Edit Modal ── */}
      {editTarget && <EditModal session={editTarget} onClose={() => setEditTarget(null)} onSave={handleUpdateSession} />}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && <DeleteModal session={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteSession} />}
    </div>;
};
export default ClockInOutPage;