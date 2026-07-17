import { useState, useEffect, useRef } from "react";
import { COLORS, FONTS } from "../constants/tokens";
import { User, Mail, Phone, MapPin, Shield, Clock, Briefcase, Camera, CheckCircle, Edit3, Save, X, Loader, Upload, Trash2 } from "lucide-react";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const token = () => localStorage.getItem("admin_token");

// ─── Sync user fields to localStorage + notify Sidebar instantly ─────────────
const syncUserToStorage = (updates = {}) => {
  try {
    const existing = JSON.parse(localStorage.getItem("admin_user") || "{}");
    localStorage.setItem("user", JSON.stringify({
      ...existing,
      ...updates
    }));
    window.dispatchEvent(new Event("user-updated")); // Sidebar listens for this
  } catch {/* silent */}
};

// borderWidth/Style/Color separately to avoid React shorthand conflict warning
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
const iStyleFocus = {
  borderColor: COLORS.brand,
  boxShadow: `0 0 0 3px ${COLORS.brand}20`
};
const Field = ({
  label,
  icon: Icon,
  value,
  editable,
  onChange,
  type = "text",
  readOnly
}) => {
  const [focused, setFocused] = useState(false);
  return <div className="ap-profile-page-1">
      <label className="ap-profile-page-2">{label}</label>
      <div className="ap-profile-page-3">
        {Icon && <span className="ap-profile-page-4"><Icon size={14} /></span>}
        <input type={type} value={value || ""} readOnly={readOnly || !editable} onChange={e => onChange?.(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{
        paddingLeft: Icon ? "34px" : "12px",
        background: readOnly || !editable ? "var(--bg)" : "var(--bg)",
        color: readOnly ? "var(--text-muted)" : "var(--text-h2)",
        cursor: readOnly || !editable ? "default" : "text",
        ...(focused && editable ? iStyleFocus : {})
      }} className="ap-profile-page-5" />
      </div>
    </div>;
};
const StatPill = ({
  label,
  value,
  color,
  bg
}) => <div style={{
  background: bg
}} className="ap-profile-page-6">
    <div style={{
    color
  }} className="ap-profile-page-7">{value ?? 0}</div>
    <div className="ap-profile-page-8">{label}</div>
  </div>;
const formatTime = dateStr => {
  const date = new Date(dateStr);
  const now = new Date();
  const time = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return `Today, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short"
  }) + `, ${time}`;
};

// ─── Generate initials from name ──────────────────────────────────────────────
const getInitials = name => (name || "AD").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

// ─── Check if avatar is a real image (not empty/null) ─────────────────────────
const hasRealAvatar = avatar => avatar && avatar !== "" && avatar !== "null" && avatar !== "undefined";

// ─── Avatar Editor ────────────────────────────────────────────────────────────
const AvatarEditor = ({
  avatar,
  name,
  editMode,
  onAvatarChange
}) => {
  const fileInputRef = useRef();
  const cameraInputRef = useRef();
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const initials = getInitials(name);
  const hasAvatar = hasRealAvatar(avatar);
  const avatarSrc = hasAvatar ? avatar.startsWith("/") ? `${API}${avatar}` : avatar : null;
  const handleFile = async file => {
    if (!file) return;
    setUploading(true);
    setShowMenu(false);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch(`${API}/api/profile/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        onAvatarChange(data.avatar);
        syncUserToStorage({
          avatar: data.avatar
        }); // ← sync to sidebar
      } else alert(data.message || "Upload failed.");
    } catch {
      alert("Network error during upload.");
    } finally {
      setUploading(false);
    }
  };

  // ── Remove avatar → back to initials ────────────────────────────────────────
  const handleRemove = async () => {
    setRemoving(true);
    setShowMenu(false);
    try {
      const res = await fetch(`${API}/api/profile/avatar`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token()}`
        }
      });
      if (res.ok) {
        onAvatarChange("");
        syncUserToStorage({
          avatar: ""
        }); // ← sync to sidebar
      } else alert("Failed to remove avatar.");
    } catch {
      alert("Network error.");
    } finally {
      setRemoving(false);
    }
  };
  return <div className="ap-profile-page-9">
      {/* Avatar circle */}
      <div style={{
      background: hasAvatar ? "transparent" : "linear-gradient(135deg, var(--xea580c20), var(--xea580c40))"
    }} className="ap-profile-page-10">
        {hasAvatar ? <img src={avatarSrc} alt="avatar" className="ap-profile-page-11" /> : <span>{initials}</span>}
        {/* Spinner overlay while uploading or removing */}
        {(uploading || removing) && <div className="ap-profile-page-12">
            <Loader size={18} color={COLORS.brand} className="ap-profile-page-13" />
          </div>}
      </div>

      {/* Camera button — only in edit mode */}
      {editMode && <button onClick={() => setShowMenu(m => !m)} className="ap-profile-page-14">
          <Camera size={12} color="white" />
        </button>}

      {/* Upload / Remove menu */}
      {showMenu && editMode && <>
          {/* Backdrop to close menu */}
          <div onClick={() => setShowMenu(false)} className="ap-profile-page-15" />
          <div className="ap-profile-page-16">

            {/* Upload from device */}
            <button onClick={() => {
          fileInputRef.current.click();
          setShowMenu(false);
        }} onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "none"} className="ap-profile-page-17">
              <Upload size={14} color={COLORS.brand} /> Upload from device
            </button>

            {/* Camera capture */}
            <button onClick={() => {
          cameraInputRef.current.click();
          setShowMenu(false);
        }} onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "none"} className="ap-profile-page-18">
              <Camera size={14} color={COLORS.brand} /> Take a photo
            </button>

            {/* Remove avatar — only if one exists */}
            {hasAvatar && <>
                <div className="ap-profile-page-19" />
                <button onClick={handleRemove} onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"} onMouseLeave={e => e.currentTarget.style.background = "none"} className="ap-profile-page-20">
                  <Trash2 size={14} color="#DC2626" /> Remove photo
                </button>
              </>}

            {/* Cancel */}
            <div className="ap-profile-page-21" />
            <button onClick={() => setShowMenu(false)} className="ap-profile-page-22">
              <X size={14} /> Cancel
            </button>
          </div>
        </>}

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} className="ap-profile-page-23" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={e => handleFile(e.target.files[0])} className="ap-profile-page-24" />
    </div>;
};

// ─── ProfilePage ──────────────────────────────────────────────────────────────
const ProfilePage = ({
  clockProps
}) => {
  const {
    clockStatus
  } = clockProps || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [snapshot, setSnapshot] = useState(null); // stores profile copy before editing
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [stats, setStats] = useState({
    todayJobs: 0,
    completedJobs: 0,
    attendanceDays: 0
  });
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token()}`
          }
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setProfile(data);
        setActivity(data.recentActivity || []);
        if (data.stats) setStats(s => ({
          ...s,
          todayJobs: data.stats.todayJobs ?? 0,
          completedJobs: data.stats.completedJobs ?? 0
        }));
      } catch {
        setError("Could not load profile. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    // Try attendance sessions for attendance days count
    // Tries /api/attendance/sessions first, falls back to /api/attendance
    const fetchAttendance = async () => {
      const URLS = [`${API}/api/attendance/sessions`, `${API}/api/attendance`, `${API}/api/timelogs`];
      for (const url of URLS) {
        try {
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token()}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            const count = Array.isArray(data) ? data.length : data?.data?.length ?? 0;
            setStats(s => ({
              ...s,
              attendanceDays: count
            }));
            return; // stop at first success
          }
        } catch {/* try next */}
      }
      // All failed — keep 0, no console error
    };
    fetchProfile();
    fetchAttendance();
  }, []);
  const set = key => val => {
    setProfile(p => ({
      ...p,
      [key]: val
    }));
    // Sync name to sidebar live while typing
    if (key === "name") syncUserToStorage({
      name: val
    });
  };
  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Save failed.");
        return;
      }
      setProfile(data.user);
      syncUserToStorage({
        name: data.user.name,
        avatar: data.user.avatar
      }); // ← sync to sidebar
      setActivity(prev => [{
        action: "Updated profile information",
        dot: "#8B5CF6",
        createdAt: new Date().toISOString()
      }, ...prev].slice(0, 20));
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const clkColor = {
    in: "#16A34A",
    break: "#D97706",
    out: COLORS.faint
  }[clockStatus || "out"];
  const clkLabel = {
    in: "Clocked In",
    break: "On Break",
    out: "Not Clocked In"
  }[clockStatus || "out"];
  const clkBg = {
    in: "#ECFDF5",
    break: "#FFFBEB",
    out: "#F1F5F9"
  }[clockStatus || "out"];
  if (loading) return <div className="ap-profile-page-25">
      <Loader size={20} className="ap-profile-page-26" />
      <span className="ap-profile-page-27">Loading profile…</span>
    </div>;
  if (!profile) return <div className="ap-profile-page-28">⚠ {error || "Profile unavailable."}</div>;
  return <div className="fi ap-profile-page-29">

      <div className="dash-page-header">
        <div>
          <div className="ap-profile-page-30">My Profile</div>
          <div className="ap-profile-page-31">View and manage your personal information</div>
        </div>
        <div className="dash-header-actions">
          {editMode ? <>
              <button className="btn ap-profile-page-32" onClick={() => {
            setProfile(snapshot); // restore original
            syncUserToStorage({
              name: snapshot?.name,
              avatar: snapshot?.avatar
            }); // restore sidebar
            setEditMode(false);
            setError("");
          }}>
                <X size={14} /> Cancel
              </button>
              <button className="btn ap-profile-page-33" onClick={handleSave} disabled={saving} style={{
            background: saving ? "var(--xfda97a)" : "linear-gradient(135deg,var(--brand),var(--brand-dark))"
          }}>
                <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
              </button>
            </> : <button className="btn ap-profile-page-34" onClick={() => {
          setSnapshot({
            ...profile
          });
          setEditMode(true);
        }}>
              <Edit3 size={14} /> Edit Profile
            </button>}
        </div>
      </div>

      {saved && <div className="ap-profile-page-35">
          <CheckCircle size={16} color="#16A34A" />
          <span className="ap-profile-page-36">Profile updated successfully!</span>
        </div>}
      {error && <div className="ap-profile-page-37">⚠ {error}</div>}

      <div className="profile-layout">

        {/* ── Left ── */}
        <div className="ap-profile-page-38">

          <div style={{
          border: `1px solid ${editMode ? COLORS.brand : COLORS.border}`,
          boxShadow: editMode ? "0 0 0 3px var(--xea580c15)" : "0 1px 4px rgba(0,0,0,.05)"
        }} className="ap-profile-page-39">
            <AvatarEditor avatar={profile.avatar} name={profile.name} editMode={editMode} onAvatarChange={url => setProfile(p => ({
            ...p,
            avatar: url
          }))} />
            <div className="ap-profile-page-40">{profile.name}</div>
            <div className="ap-profile-page-41">
              {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)} · {profile.department || "Management"}
            </div>
            <div style={{
            background: clkBg
          }} className="ap-profile-page-42">
              <span style={{
              background: clkColor
            }} className="ap-profile-page-43" />
              <span style={{
              color: clkColor
            }} className="ap-profile-page-44">{clkLabel}</span>
            </div>
          </div>

          <div className="ap-profile-page-45">
            <div className="ap-profile-page-46">Quick Stats</div>
            <div className="ap-profile-page-47">
              <StatPill label="Today's Jobs" value={stats.todayJobs} color={COLORS.brand} bg="#FFF7ED" />
              <StatPill label="Jobs Done" value={stats.completedJobs} color="#16A34A" bg="#F0FDF4" />
              <StatPill label="Attendance Days" value={stats.attendanceDays} color="#3B82F6" bg="#EFF6FF" />
              <StatPill label="Role Level" value={profile.roleLevel || "L5"} color="#7C3AED" bg="#F5F3FF" />
            </div>
          </div>

          <div className="ap-profile-page-48">
            <div className="ap-profile-page-49">Employment</div>
            {[["Employee ID", profile.empId || "—", Briefcase], ["Joined", profile.joined || "—", Clock], ["Department", profile.department || "—", Shield]].map(([label, val, Icon]) => <div key={label} className="ap-profile-page-50">
                <Icon size={13} color={COLORS.faint} className="ap-profile-page-51" />
                <span className="ap-profile-page-52">{label}</span>
                <span style={{
              fontFamily: label === "Employee ID" ? "Fira Code, monospace" : "Plus Jakarta Sans, sans-serif"
            }} className="ap-profile-page-53">{val}</span>
              </div>)}
          </div>
        </div>

        {/* ── Right ── */}
        <div className="ap-profile-page-54">

          <div className="ap-profile-page-55">
            <div className="ap-profile-page-56">
              <User size={16} color={COLORS.brand} /> Personal Information
            </div>
            <div className="ap-profile-page-57">
              <Field label="Full Name" icon={User} value={profile.name} editable={editMode} onChange={set("name")} />
              <Field label="Employee ID" icon={Briefcase} value={profile.empId} readOnly />
              <Field label="Email" icon={Mail} value={profile.email} editable={editMode} onChange={set("email")} type="email" />
              <Field label="Phone" icon={Phone} value={profile.phone} editable={editMode} onChange={set("phone")} type="tel" />
              <div className="ap-profile-page-58">
                <Field label="Location" icon={MapPin} value={profile.location} editable={editMode} onChange={set("location")} />
              </div>
            </div>
          </div>

          <div className="ap-profile-page-59">
            <div className="ap-profile-page-60">
              <Edit3 size={16} color={COLORS.brand} /> About Me
            </div>
            <div className="ap-profile-page-61">
              <label className="ap-profile-page-62">Bio</label>
              <textarea value={profile.bio || ""} readOnly={!editMode} onChange={e => set("bio")(e.target.value)} placeholder={editMode ? "Write something about yourself…" : "No bio added yet."} rows={4} style={{
              background: !editMode ? "var(--bg)" : "var(--bg)",
              cursor: !editMode ? "default" : "text"
            }} className="ap-profile-page-63" />
            </div>
          </div>

          <div className="ap-profile-page-64">
            <div className="ap-profile-page-65">
              <Shield size={16} color={COLORS.brand} /> Role & Permissions
            </div>
            <div className="ap-profile-page-66">
              {(profile.permissions || []).map(p => <span key={p} className="ap-profile-page-67">
                  <CheckCircle size={10} /> {p}
                </span>)}
            </div>
            <div className="ap-profile-page-68">
              <Shield size={14} color="#16A34A" />
              <span className="ap-profile-page-69">
                {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)} — Full platform access granted
              </span>
            </div>
          </div>

          <div className="ap-profile-page-70">
            <div className="ap-profile-page-71">
              <Clock size={16} color={COLORS.brand} /> Recent Activity
            </div>
            {activity.length === 0 ? <div className="ap-profile-page-72">
                No activity yet — login, profile edits, and job actions will appear here.
              </div> : activity.slice(0, 5).map((a, i) => <div key={i} style={{
            borderBottom: i < Math.min(activity.length, 5) - 1 ? "1px solid var(--border)" : "none"
          }} className="ap-profile-page-73">
                  <div style={{
              background: a.dot || COLORS.brand
            }} className="ap-profile-page-74" />
                  <div className="ap-profile-page-75">{a.action}</div>
                  <div className="ap-profile-page-76">{formatTime(a.createdAt)}</div>
                </div>)}
          </div>
        </div>
      </div>
    </div>;
};
export default ProfilePage;