import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { COLORS, FONTS } from "../constants/tokens";
import { Lock, Bell, Shield, Smartphone, Eye, EyeOff, Monitor, Moon, Sun, Globe, CheckCircle, AlertTriangle, Key, Trash2, LogOut, Save, ToggleLeft, ToggleRight, Loader } from "lucide-react";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const token = () => localStorage.getItem("admin_token");
const authFetch = (url, opts = {}) => fetch(`${API}${url}`, {
  ...opts,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
    ...opts.headers
  }
});

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionCard = ({
  icon: Icon,
  title,
  subtitle,
  children
}) => <div className="ap-account-settings-page-1">
    <div className="ap-account-settings-page-2">
      <div className="ap-account-settings-page-3">
        <Icon size={16} color={COLORS.brand} />
      </div>
      <div>
        <div className="ap-account-settings-page-4">{title}</div>
        {subtitle && <div className="ap-account-settings-page-5">{subtitle}</div>}
      </div>
    </div>
    {children}
  </div>;
const Toggle = ({
  checked,
  onChange,
  label,
  sub,
  loading
}) => <div className="ap-account-settings-page-6">
    <div>
      <div className="ap-account-settings-page-7">{label}</div>
      {sub && <div className="ap-account-settings-page-8">{sub}</div>}
    </div>
    <button onClick={() => !loading && onChange(!checked)} style={{
    cursor: loading ? "wait" : "pointer",
    opacity: loading ? "0.5" : "1"
  }} className="ap-account-settings-page-9">
      {checked ? <ToggleRight size={28} color={COLORS.brand} /> : <ToggleLeft size={28} color={COLORS.faint} />}
    </button>
  </div>;
const iStyle = {
  padding: "9px 12px",
  borderRadius: 8,
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: COLORS.border,
  fontSize: 13,
  color: COLORS.h2,
  background: "var(--bg)",
  fontFamily: FONTS.sans,
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .15s, box-shadow .15s"
};
const PasswordField = ({
  label,
  value,
  onChange,
  placeholder
}) => {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return <div className="ap-account-settings-page-10">
      <label className="ap-account-settings-page-11">{label}</label>
      <div className="ap-account-settings-page-12">
        <Lock size={14} className="ap-account-settings-page-13" />
        <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{
        ...(focused ? {
          borderColor: COLORS.brand,
          boxShadow: `0 0 0 3px ${COLORS.brand}20`
        } : {})
      }} className="ap-account-settings-page-14" />
        <button onClick={() => setShow(s => !s)} className="ap-account-settings-page-15">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>;
};
const Toast = ({
  type,
  message
}) => {
  const isSuccess = type === "success";
  return <div style={{
    background: isSuccess ? "var(--success-bg)" : "var(--danger-bg)",
    border: `1px solid ${isSuccess ? "#A7F3D0" : "#FECACA"}`
  }} className="ap-account-settings-page-16">
      {isSuccess ? <CheckCircle size={14} color="#16A34A" /> : <AlertTriangle size={14} color="#DC2626" />}
      <span style={{
      fontWeight: isSuccess ? "700" : "600",
      color: isSuccess ? "var(--success-text)" : "var(--danger-text)"
    }} className="ap-account-settings-page-17">{message}</span>
    </div>;
};

// ─── AccountSettingsPage ──────────────────────────────────────────────────────
const AccountSettingsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("password");
  const [pageLoading, setPageLoading] = useState(true);

  // ── Password tab ──────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    current: "",
    next: "",
    confirm: ""
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwToast, setPwToast] = useState(null); // { type, message }

  const handlePasswordSave = async () => {
    if (!pwForm.current) return setPwToast({
      type: "error",
      message: "Enter your current password."
    });
    if (pwForm.next.length < 8) return setPwToast({
      type: "error",
      message: "New password must be at least 8 characters."
    });
    if (pwForm.next !== pwForm.confirm) return setPwToast({
      type: "error",
      message: "Passwords don't match."
    });
    setPwSaving(true);
    setPwToast(null);
    try {
      const res = await authFetch("/api/account/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.next
        })
      });
      const data = await res.json();
      if (!res.ok) return setPwToast({
        type: "error",
        message: data.message || "Update failed."
      });
      setPwToast({
        type: "success",
        message: "Password updated successfully!"
      });
      setPwForm({
        current: "",
        next: "",
        confirm: ""
      });
      setTimeout(() => setPwToast(null), 3000);
    } catch {
      setPwToast({
        type: "error",
        message: "Network error. Please try again."
      });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Notifications tab ─────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    jobAssigned: true,
    newQuotation: true,
    invoiceOverdue: true,
    technicianAlert: false,
    dailySummary: true,
    smsAlerts: false,
    emailDigest: true,
    browserPush: false
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifToast, setNotifToast] = useState(null);
  const handleToggle = async (key, val) => {
    const updated = {
      ...notifs,
      [key]: val
    };
    setNotifs(updated); // optimistic update
    setNotifSaving(true);
    try {
      const res = await authFetch("/api/account/notifications", {
        method: "PUT",
        body: JSON.stringify({
          [key]: val
        })
      });
      if (!res.ok) {
        setNotifs(notifs); // rollback
        setNotifToast({
          type: "error",
          message: "Failed to save. Please try again."
        });
        setTimeout(() => setNotifToast(null), 2500);
      }
    } catch {
      setNotifs(notifs);
    } finally {
      setNotifSaving(false);
    }
  };

  // ── Appearance tab ────────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState({
    theme: "light",
    language: "en-IN",
    timezone: "Asia/Kolkata",
    currency: "INR"
  });
  const [appSaving, setAppSaving] = useState(false);
  const [appToast, setAppToast] = useState(null);
  const handleAppSave = async () => {
    setAppSaving(true);
    setAppToast(null);
    try {
      const res = await authFetch("/api/account/preferences", {
        method: "PUT",
        body: JSON.stringify(prefs)
      });
      const data = await res.json();
      if (!res.ok) return setAppToast({
        type: "error",
        message: data.message || "Failed to save."
      });
      setAppToast({
        type: "success",
        message: "Preferences saved!"
      });
      setTimeout(() => setAppToast(null), 2500);
    } catch {
      setAppToast({
        type: "error",
        message: "Network error."
      });
    } finally {
      setAppSaving(false);
    }
  };

  // ── Security tab ──────────────────────────────────────────────────────────
  const [twoFA, setTwoFA] = useState(false);
  const [twoFASaving, setTwoFASaving] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loginHist, setLoginHist] = useState([]);
  const [secToast, setSecToast] = useState(null);

  // Delete account confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const handle2FA = async () => {
    setTwoFASaving(true);
    try {
      const res = await authFetch("/api/account/security/2fa", {
        method: "PUT",
        body: JSON.stringify({
          enabled: !twoFA
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTwoFA(data.twoFactorEnabled);
        setSecToast({
          type: "success",
          message: `2FA ${data.twoFactorEnabled ? "enabled" : "disabled"} successfully.`
        });
        setTimeout(() => setSecToast(null), 2500);
      }
    } catch {/* silent */} finally {
      setTwoFASaving(false);
    }
  };
  const handleRevoke = async sessionId => {
    try {
      const res = await authFetch(`/api/account/security/sessions/${sessionId}`, {
        method: "DELETE"
      });
      if (res.ok) setSessions(prev => prev.filter(s => s._id !== sessionId));
    } catch {/* silent */}
  };
  const handleRevokeAll = async () => {
    try {
      const res = await authFetch("/api/account/security/sessions", {
        method: "DELETE"
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.isCurrent));
        setSecToast({
          type: "success",
          message: "All other sessions revoked."
        });
        setTimeout(() => setSecToast(null), 2500);
      }
    } catch {/* silent */}
  };
  const handleDeleteAccount = async () => {
    if (!deletePassword) return setDeleteError("Please enter your password to confirm.");
    try {
      const res = await authFetch("/api/account/account", {
        method: "DELETE",
        body: JSON.stringify({
          password: deletePassword
        })
      });
      const data = await res.json();
      if (!res.ok) return setDeleteError(data.message || "Incorrect password.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch {
      setDeleteError("Network error.");
    }
  };

  // ── Fetch all settings on mount ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      try {
        const [nRes, pRes, sRes] = await Promise.all([authFetch("/api/account/notifications"), authFetch("/api/account/preferences"), authFetch("/api/account/security")]);
        if (nRes.ok) setNotifs(await nRes.json());
        if (pRes.ok) setPrefs(await pRes.json());
        if (sRes.ok) {
          const sec = await sRes.json();
          setTwoFA(sec.twoFactorEnabled ?? false);
          setSessions(sec.activeSessions ?? []);
          setLoginHist(sec.loginHistory ?? []);
        }
      } catch {/* use defaults */} finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);
  const TABS = [{
    id: "password",
    label: "Password",
    icon: Lock
  }, {
    id: "notifications",
    label: "Notifications",
    icon: Bell
  }, {
    id: "appearance",
    label: "Appearance",
    icon: Monitor
  }, {
    id: "security",
    label: "Security",
    icon: Shield
  }];
  if (pageLoading) return <div className="ap-account-settings-page-18">
      <Loader size={20} className="ap-account-settings-page-19" />
      <span className="ap-account-settings-page-20">Loading settings…</span>
    </div>;
  return <div className="fi ap-account-settings-page-21">

      {/* Header */}
      <div>
        <div className="ap-account-settings-page-22">Account Settings</div>
        <div className="ap-account-settings-page-23">Manage your password, notifications, and security preferences</div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar ap-account-settings-page-24">
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} className="tab-btn ap-account-settings-page-25" style={{
        background: tab === t.id ? "linear-gradient(135deg,var(--brand),var(--brand-dark))" : "transparent",
        color: tab === t.id ? "white" : "var(--text-muted)",
        boxShadow: tab === t.id ? "0 2px 8px var(--xea580c40)" : "none"
      }}>
            <t.icon size={13} />
            <span className="hide-sm">{t.label}</span>
          </button>)}
      </div>

      {/* ══ PASSWORD TAB ══ */}
      {tab === "password" && <div className="ap-account-settings-page-26">
          <SectionCard icon={Key} title="Change Password" subtitle="Use a strong password of at least 8 characters">
            {pwToast && <Toast type={pwToast.type} message={pwToast.message} />}
            <div className="ap-account-settings-page-27">
              <PasswordField label="Current Password" value={pwForm.current} onChange={v => setPwForm(p => ({
            ...p,
            current: v
          }))} placeholder="Enter current password" />
              <PasswordField label="New Password" value={pwForm.next} onChange={v => setPwForm(p => ({
            ...p,
            next: v
          }))} placeholder="Min. 8 characters" />
              <PasswordField label="Confirm Password" value={pwForm.confirm} onChange={v => setPwForm(p => ({
            ...p,
            confirm: v
          }))} placeholder="Repeat new password" />
              {pwForm.next.length > 0 && <div>
                  <div className="ap-account-settings-page-28">Password strength</div>
                  <div className="ap-account-settings-page-29">
                    {[1, 2, 3, 4].map(i => {
                const score = Math.min(4, Math.floor(pwForm.next.length / 3));
                return <div key={i} style={{
                  background: i <= score ? ["#EF4444", "#F97316", "#EAB308", "#22C55E"][score - 1] : "#E5E7EB"
                }} className="ap-account-settings-page-30" />;
              })}
                  </div>
                </div>}
              <button className="btn ap-account-settings-page-31" onClick={handlePasswordSave} disabled={pwSaving} style={{
            background: pwSaving ? "var(--xfda97a)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))"
          }}>
                <Save size={14} /> {pwSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </SectionCard>
          <div className="ap-account-settings-page-32">
            <div className="ap-account-settings-page-33">💡 Password Tips</div>
            {["Use at least 8 characters", "Mix uppercase, lowercase, numbers and symbols", "Don't reuse passwords from other accounts", "Change your password every 90 days"].map(tip => <div key={tip} className="ap-account-settings-page-34"><span>•</span><span>{tip}</span></div>)}
          </div>
        </div>}

      {/* ══ NOTIFICATIONS TAB ══ */}
      {tab === "notifications" && <div className="ap-account-settings-page-35">
          {notifToast && <Toast type={notifToast.type} message={notifToast.message} />}
          <SectionCard icon={Bell} title="In-App Notifications" subtitle="Control what alerts appear inside the platform">
            <Toggle checked={notifs.jobAssigned} onChange={v => handleToggle("jobAssigned", v)} label="Job Assigned" sub="When a work order is assigned to you" loading={notifSaving} />
            <Toggle checked={notifs.newQuotation} onChange={v => handleToggle("newQuotation", v)} label="New Quotation Request" sub="When a customer requests a quote" loading={notifSaving} />
            <Toggle checked={notifs.invoiceOverdue} onChange={v => handleToggle("invoiceOverdue", v)} label="Overdue Invoices" sub="Daily reminder for unpaid invoices" loading={notifSaving} />
            <Toggle checked={notifs.technicianAlert} onChange={v => handleToggle("technicianAlert", v)} label="Technician Alerts" sub="When a technician goes off duty unexpectedly" loading={notifSaving} />
            <Toggle checked={notifs.dailySummary} onChange={v => handleToggle("dailySummary", v)} label="Daily Summary" sub="End-of-day operations summary at 7 PM" loading={notifSaving} />
          </SectionCard>
          <SectionCard icon={Smartphone} title="External Channels" subtitle="Push, SMS and email notification settings">
            <Toggle checked={notifs.smsAlerts} onChange={v => handleToggle("smsAlerts", v)} label="SMS Alerts" sub="Critical alerts sent to your registered number" loading={notifSaving} />
            <Toggle checked={notifs.emailDigest} onChange={v => handleToggle("emailDigest", v)} label="Email Digest" sub="Weekly report sent every Monday morning" loading={notifSaving} />
            <Toggle checked={notifs.browserPush} onChange={v => handleToggle("browserPush", v)} label="Browser Push" sub="Desktop push notifications when browser is open" loading={notifSaving} />
          </SectionCard>
        </div>}

      {/* ══ APPEARANCE TAB ══ */}
      {tab === "appearance" && <div className="ap-account-settings-page-36">
          <SectionCard icon={Monitor} title="Theme" subtitle="Choose how CoolTech looks for you">
            <div className="ap-account-settings-page-37">
              {[{
            id: "light",
            label: "Light",
            icon: Sun,
            bg: "#FFFFFF",
            border: "#E5E7EB"
          }, {
            id: "dark",
            label: "Dark",
            icon: Moon,
            bg: "#1A1A2E",
            border: "#2A2A4A"
          }, {
            id: "auto",
            label: "System",
            icon: Monitor,
            bg: "linear-gradient(135deg,#fff 50%,#1A1A2E 50%)",
            border: "#CBD5E1"
          }].map(t => <button key={t.id} onClick={() => setPrefs(p => ({
            ...p,
            theme: t.id
          }))} style={{
            border: prefs.theme === t.id ? `2px solid ${COLORS.brand}` : `1.5px solid ${t.border}`,
            background: prefs.theme === t.id ? `${COLORS.brand}08` : t.bg,
            boxShadow: prefs.theme === t.id ? "0 0 0 3px var(--xea580c18)" : "none"
          }} className="ap-account-settings-page-38">
                  <t.icon size={20} color={prefs.theme === t.id ? COLORS.brand : COLORS.muted} />
                  <span style={{
              color: prefs.theme === t.id ? "var(--brand)" : "var(--text-muted)"
            }} className="ap-account-settings-page-39">{t.label}</span>
                </button>)}
            </div>
          </SectionCard>
          <SectionCard icon={Globe} title="Regional Settings" subtitle="Language, timezone and currency">
            <div className="ap-account-settings-page-40">
              {[{
            label: "Language",
            key: "language",
            options: [["en-IN", "English (India)"], ["en-US", "English (US)"], ["hi-IN", "Hindi"]]
          }, {
            label: "Timezone",
            key: "timezone",
            options: [["Asia/Kolkata", "IST (UTC+5:30)"], ["Asia/Dubai", "GST (UTC+4)"], ["Europe/London", "GMT (UTC+0)"]]
          }, {
            label: "Currency",
            key: "currency",
            options: [["INR", "₹ Indian Rupee"], ["USD", "$ US Dollar"], ["AED", "د.إ Dirham"]]
          }].map(({
            label,
            key,
            options
          }) => <div key={key} className="ap-account-settings-page-41">
                  <label className="ap-account-settings-page-42">{label}</label>
                  <select value={prefs[key]} onChange={e => setPrefs(p => ({
              ...p,
              [key]: e.target.value
            }))} className="ap-account-settings-page-43">
                    {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>)}
              <button className="btn ap-account-settings-page-44" onClick={handleAppSave} disabled={appSaving} style={{
            background: appSaving ? "var(--xfda97a)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))"
          }}>
                <Save size={14} /> {appSaving ? "Saving…" : "Save Preferences"}
              </button>
              {appToast && <Toast type={appToast.type} message={appToast.message} />}
            </div>
          </SectionCard>
        </div>}

      {/* ══ SECURITY TAB ══ */}
      {tab === "security" && <div className="ap-account-settings-page-45">
          {secToast && <Toast type={secToast.type} message={secToast.message} />}

          {/* 2FA */}
          <SectionCard icon={Smartphone} title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account">
            <div className="ap-account-settings-page-46">
              <div className="ap-account-settings-page-47">
                <div className="ap-account-settings-page-48">
                  When enabled, you'll be prompted for a verification code from your authenticator app each time you log in.
                </div>
                <div style={{
              background: twoFA ? "var(--success-bg)" : "var(--danger-bg)",
              border: twoFA ? "1px solid var(--success-border)" : "1px solid var(--danger-border)"
            }} className="ap-account-settings-page-49">
                  <span style={{
                background: twoFA ? "var(--success)" : "var(--danger)"
              }} className="ap-account-settings-page-50" />
                  <span style={{
                color: twoFA ? "var(--success-text)" : "var(--danger-text)"
              }} className="ap-account-settings-page-51">{twoFA ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
              <button className="btn ap-account-settings-page-52" onClick={handle2FA} disabled={twoFASaving} style={{
            background: twoFA ? "var(--danger-bg)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))",
            color: twoFA ? "var(--danger-text)" : "white",
            border: twoFA ? "1px solid var(--danger-border)" : "none",
            opacity: twoFASaving ? "0.6" : "1"
          }}>
                {twoFASaving ? "…" : twoFA ? "Disable 2FA" : "Enable 2FA"}
              </button>
            </div>
          </SectionCard>

          {/* Active sessions */}
          <SectionCard icon={Monitor} title="Active Sessions" subtitle="Devices currently logged into your account">
            {sessions.length === 0 ? <div className="ap-account-settings-page-53">No active sessions found.</div> : sessions.map(s => <div key={s._id} className="ap-account-settings-page-54">
                <div style={{
            background: s.isCurrent ? "var(--xea580c12)" : "var(--bg)"
          }} className="ap-account-settings-page-55">
                  <Monitor size={16} color={s.isCurrent ? COLORS.brand : COLORS.faint} />
                </div>
                <div className="ap-account-settings-page-56">
                  <div className="ap-account-settings-page-57">{s.device || "Unknown device"}</div>
                  <div className="ap-account-settings-page-58">{s.location || "—"} · {s.lastSeen ? new Date(s.lastSeen).toLocaleString("en-IN", {
                dateStyle: "short",
                timeStyle: "short"
              }) : "—"}</div>
                </div>
                {s.isCurrent ? <span className="ap-account-settings-page-59">Current</span> : <button onClick={() => handleRevoke(s._id)} className="ap-account-settings-page-60">Revoke</button>}
              </div>)}
            <div className="ap-account-settings-page-61">
              <button className="btn ap-account-settings-page-62" onClick={handleRevokeAll}>
                <LogOut size={13} /> Revoke All Other Sessions
              </button>
            </div>
          </SectionCard>

          {/* Login history */}
          <SectionCard icon={Key} title="Recent Login History" subtitle="Last 5 login events">
            {loginHist.length === 0 ? <div className="ap-account-settings-page-63">No login history yet.</div> : loginHist.map((l, i) => <div key={i} style={{
          borderBottom: i < loginHist.length - 1 ? "1px solid var(--border)" : "none"
        }} className="ap-account-settings-page-64">
                <div style={{
            background: l.status === "success" ? "var(--success)" : "var(--danger)"
          }} className="ap-account-settings-page-65" />
                <div className="ap-account-settings-page-66">{l.device || "Unknown device"}</div>
                <div className="ap-account-settings-page-67">{l.ip || "—"}</div>
                <div className="ap-account-settings-page-68">
                  {l.createdAt ? new Date(l.createdAt).toLocaleString("en-IN", {
              dateStyle: "short",
              timeStyle: "short"
            }) : "—"}
                </div>
                {l.status === "failed" && <span className="ap-account-settings-page-69">Failed</span>}
              </div>)}
          </SectionCard>

          {/* Danger zone */}
          <div className="ap-account-settings-page-70">
            <div className="ap-account-settings-page-71">
              <AlertTriangle size={16} /> Danger Zone
            </div>
            <div className="ap-account-settings-page-72">
              These actions are permanent and cannot be undone. Please proceed with caution.
            </div>
            <div className="ap-account-settings-page-73">
              <button className="btn ap-account-settings-page-74" onClick={handleRevokeAll}>
                <LogOut size={13} /> Log Out All Devices
              </button>
              <button className="btn ap-account-settings-page-75" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={13} /> Delete Account
              </button>
            </div>

            {/* Delete confirmation inline panel */}
            {showDeleteConfirm && <div className="ap-account-settings-page-76">
                <div className="ap-account-settings-page-77">⚠ Confirm Account Deletion</div>
                <div className="ap-account-settings-page-78">Enter your password to permanently delete your account. This cannot be undone.</div>
                <div className="ap-account-settings-page-79">
                  <input type="password" value={deletePassword} onChange={e => {
              setDeletePassword(e.target.value);
              setDeleteError("");
            }} placeholder="Enter your password" style={{
              borderColor: deleteError ? "var(--danger-text)" : "var(--border)"
            }} className="ap-account-settings-page-80" />
                </div>
                {deleteError && <div className="ap-account-settings-page-81">⚠ {deleteError}</div>}
                <div className="ap-account-settings-page-82">
                  <button className="btn ap-account-settings-page-83" onClick={handleDeleteAccount}>
                    Yes, Delete My Account
                  </button>
                  <button className="btn ap-account-settings-page-84" onClick={() => {
              setShowDeleteConfirm(false);
              setDeletePassword("");
              setDeleteError("");
            }}>
                    Cancel
                  </button>
                </div>
              </div>}
          </div>
        </div>}
    </div>;
};
export default AccountSettingsPage;