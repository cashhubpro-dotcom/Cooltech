import { useState, useEffect, useRef } from 'react';
import { COLORS, FONTS } from '../constants/token';
import { Camera, Upload, Trash2, X, Loader } from 'lucide-react';
import { Toast, ProgressBar } from '../components/ui/Components';
import { technicianProfileApi, authApi } from '../services/technicianPortalApi';
import { fmtDateDMY } from '../../../shared/formatDate';

// ─── Same convention the admin panel's AvatarEditor uses ──────────────────
// If technicianProfileApi doesn't yet expose uploadAvatar/removeAvatar, add
// them to technicianPortalApi.js mirroring settingsApi.uploadLogo in the
// admin api.js (FormData + fetch, same BASE/token as the rest of that file).
const hasRealAvatar = url => url && url !== '' && url !== 'null' && url !== 'undefined';

// ─── Avatar Editor — upload / take photo / remove, same UX as admin panel ──
const AvatarEditor = ({
  avatarUrl,
  fallback,
  editMode,
  onAvatarChange
}) => {
  const fileInputRef = useRef();
  const cameraInputRef = useRef();
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const hasAvatar = hasRealAvatar(avatarUrl);
  const handleFile = async file => {
    if (!file) return;
    setUploading(true);
    setShowMenu(false);
    try {
      const res = await technicianProfileApi.uploadAvatar(file);
      onAvatarChange(res.data?.avatarUrl ?? res.avatarUrl ?? '');
    } catch (err) {
      alert(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };
  const handleRemove = async () => {
    setRemoving(true);
    setShowMenu(false);
    try {
      await technicianProfileApi.removeAvatar();
      onAvatarChange('');
    } catch (err) {
      alert(err.message || 'Failed to remove avatar.');
    } finally {
      setRemoving(false);
    }
  };
  return <div style={{
    position: 'relative',
    display: 'inline-block'
  }}>
      <div className="tp-profile-page-6" style={{
      position: 'relative',
      overflow: 'hidden'
    }}>
        {hasAvatar ? <img src={avatarUrl} alt="avatar" style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }} /> : fallback}
        {(uploading || removing) && <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,255,255,.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
            <Loader size={18} color={COLORS.brand} className="tp-spin" />
          </div>}
      </div>

      {editMode && <button type="button" onClick={() => setShowMenu(m => !m)} style={{
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 28,
      height: 28,
      borderRadius: '50%',
      background: COLORS.brand,
      border: '2px solid white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer'
    }}>
          <Camera size={13} color="white" />
        </button>}

      {showMenu && editMode && <>
          <div onClick={() => setShowMenu(false)} style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40
      }} />
          <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: 8,
        background: 'var(--white)',
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        boxShadow: '0 10px 30px rgba(0,0,0,.15)',
        padding: 6,
        width: 190,
        zIndex: 41
      }}>
            <button onClick={() => {
          fileInputRef.current.click();
          setShowMenu(false);
        }} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '8px 10px',
          border: 'none',
          background: 'none',
          borderRadius: 7,
          fontSize: 12.5,
          fontWeight: 600,
          color: COLORS.h2,
          cursor: 'pointer',
          textAlign: 'left'
        }}>
              <Upload size={14} color={COLORS.brand} /> Upload from device
            </button>
            <button onClick={() => {
          cameraInputRef.current.click();
          setShowMenu(false);
        }} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '8px 10px',
          border: 'none',
          background: 'none',
          borderRadius: 7,
          fontSize: 12.5,
          fontWeight: 600,
          color: COLORS.h2,
          cursor: 'pointer',
          textAlign: 'left'
        }}>
              <Camera size={14} color={COLORS.brand} /> Take a photo
            </button>
            {hasAvatar && <button onClick={handleRemove} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '8px 10px',
          border: 'none',
          background: 'none',
          borderRadius: 7,
          fontSize: 12.5,
          fontWeight: 600,
          color: '#DC2626',
          cursor: 'pointer',
          textAlign: 'left'
        }}>
                <Trash2 size={14} color="#DC2626" /> Remove photo
              </button>}
            <button onClick={() => setShowMenu(false)} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '8px 10px',
          border: 'none',
          background: 'none',
          borderRadius: 7,
          fontSize: 12.5,
          fontWeight: 600,
          color: COLORS.muted,
          cursor: 'pointer',
          textAlign: 'left'
        }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </>}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={e => handleFile(e.target.files[0])} style={{
      display: 'none'
    }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={e => handleFile(e.target.files[0])} style={{
      display: 'none'
    }} />
    </div>;
};

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    phone: '',
    email: ''
  });
  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: ''
  });
  const [saving, setSaving] = useState(false);
  const loadData = async () => {
    try {
      const [profileRes, perfRes] = await Promise.all([technicianProfileApi.get(), technicianProfileApi.performance()]);
      // Both endpoints wrap their payload in { data: ... } — see
      // routes/technicianPortal.routes.js (matches the /salary, /salary/summary shape).
      const p = profileRes.data;
      const s = perfRes.data;
      setProfile(p);
      setPerf(s);
      setForm({
        phone: p.phone,
        email: p.email
      });
    } catch (err) {
      setToast(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  const ratingBg = r => r >= 4.5 ? '#16A34A' : r >= 4.0 ? '#D97706' : '#DC2626';
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await technicianProfileApi.update(form);
      await loadData();
      setEditMode(false);
      setToast('Profile updated successfully!');
    } catch (err) {
      setToast(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };
  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) {
      return setToast("Passwords don't match");
    }
    try {
      await authApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwForm({
        currentPassword: '',
        newPassword: '',
        confirm: ''
      });
      setToast('Password updated successfully!');
    } catch (err) {
      setToast(err.message || 'Password update failed');
    }
  };
  if (loading) return <div className="tp-profile-page-1">Loading profile…</div>;
  if (!profile || !perf) return <div className="tp-profile-page-2">Failed to load profile.</div>;
  const t = profile;
  return <div>
      <style>{`.tp-spin{ animation: tpSpin .8s linear infinite; } @keyframes tpSpin{ to{ transform: rotate(360deg); } }`}</style>
      <div className="sec-hdr">
        <div>
          <div className="sec-title">My Profile</div>
          <div className="sec-sub">Your account details, certifications and performance</div>
        </div>
        {!editMode && <button className="btn btn-outline" onClick={() => setEditMode(true)}>✏️ Edit Profile</button>}
      </div>

      <div className="tp-profile-page-3">

        {/* Left column */}
        <div className="tp-profile-page-4">
          <div className="card afu">
            <div className="card-body tp-profile-page-5">
              <AvatarEditor avatarUrl={t.avatarUrl} fallback={t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()} editMode={editMode} onAvatarChange={url => setProfile(p => ({
              ...p,
              avatarUrl: url
            }))} />
              <div className="tp-profile-page-7">{t.name}</div>
              <div className="tp-profile-page-8">{t.role}</div>
              <div className="tp-profile-page-9">📍 {t.area}</div>

              <div style={{
              background: `${ratingBg(t.rating)}15`,
              border: `1.5px solid ${ratingBg(t.rating)}30`
            }} className="tp-profile-page-10">
                <div style={{
                color: ratingBg(t.rating)
              }} className="tp-profile-page-11">{t.rating} ⭐</div>
                <div className="tp-profile-page-12">Customer Rating</div>
              </div>

              <div className="tp-profile-page-13">
                <span className="tp-profile-page-14">🔧 {perf.totalJobs} Jobs Done</span>
                <span className="tp-profile-page-15">
                  {t.status === 'available' ? '✅ Active' : t.status}
                </span>
              </div>
            </div>
          </div>

          <div className="card afu1">
            <div className="card-header"><div className="card-title">🛠 Skills & Expertise</div></div>
            <div className="card-body">
              {(t.skills || []).map(skill => <div key={skill} className="tp-profile-page-16">
                  <div className="tp-profile-page-17" />
                  <span className="tp-profile-page-18">{skill}</span>
                </div>)}
            </div>
          </div>

          <div className="card afu2">
            <div className="card-header"><div className="card-title">🏅 Certifications</div></div>
            <div className="card-body">
              {(t.certifications || []).map((cert, i, arr) => <div key={cert} style={{
              borderBottom: i < arr.length - 1 ? "1px solid var(--bg)" : "none"
            }} className="tp-profile-page-19">
                  <div className="tp-profile-page-20">✓</div>
                  <span className="tp-profile-page-21">{cert}</span>
                </div>)}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="tp-profile-page-22">
          <div className="card afu">
            <div className="card-header">
              <div className="card-title">Personal Information</div>
              {editMode && <div className="tp-profile-page-23">
                  <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSaveProfile}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                </div>}
            </div>
            <div className="card-body">
              {editMode ? <div className="tp-profile-page-24">
                  {[{
                label: 'Phone Number',
                key: 'phone',
                placeholder: '98XXXXXXXX'
              }, {
                label: 'Work Email',
                key: 'email',
                placeholder: 'name@cooltech.com'
              }].map(f => <div key={f.key} className="form-field tp-profile-page-25">
                      <label className="form-label">{f.label}</label>
                      <input className="form-input" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({
                  ...p,
                  [f.key]: e.target.value
                }))} />
                    </div>)}
                </div> : <div className="tp-profile-page-26">
                  {[{
                label: 'Employee ID',
                value: t.id
              }, {
                label: 'Role',
                value: t.role
              }, {
                label: 'Phone',
                value: t.phone
              }, {
                label: 'Email',
                value: t.email
              }, {
                label: 'Service Area',
                value: t.area
              }, {
                label: 'Joined',
                value: t.joinDate ?fmtDateDMY(new Date(t.joinDate)) : '—'
              }].map(f => <div key={f.label}>
                      <div className="tp-profile-page-27">{f.label}</div>
                      <div className="tp-profile-page-28">{f.value}</div>
                    </div>)}
                </div>}
            </div>
          </div>

          <div className="card afu1">
            <div className="card-header"><div className="card-title">📊 Performance Overview</div></div>
            <div className="card-body">
              <div className="tp-profile-page-29">
                {[{
                label: 'Total Jobs',
                value: perf.totalJobs,
                color: COLORS.brand
              }, {
                label: 'Done (Current)',
                value: perf.doneCurrent,
                color: '#16A34A'
              }, {
                label: 'Rating',
                value: `${perf.rating}⭐`,
                color: '#D97706'
              }, {
                label: 'Last Net Pay',
                value: perf.lastNetPay != null ? `₹${perf.lastNetPay.toLocaleString()}` : '—',
                color: '#0369A1'
              }].map(s => <div key={s.label} className="tp-profile-page-30">
                    <div style={{
                  color: s.color,
                  fontFamily: s.label === 'Last Net Pay' ? FONTS.mono : undefined
                }} className="tp-profile-page-31">{s.value}</div>
                    <div className="tp-profile-page-32">{s.label}</div>
                  </div>)}
              </div>

              <div className="tp-profile-page-33">
                <div className="tp-profile-page-34">MONTHLY JOB COMPLETION</div>
                {perf.monthlyCompletion.slice().reverse().map(m => <div key={m.month} className="tp-profile-page-35">
                    <div className="tp-profile-page-36">
                      <span className="tp-profile-page-37">{m.month}</span>
                      <span className="tp-profile-page-38">{m.jobsDone} jobs</span>
                    </div>
                    <ProgressBar value={m.jobsDone} max={40} color={COLORS.brand} />
                  </div>)}
              </div>
            </div>
          </div>

          <div className="card afu2">
            <div className="card-header"><div className="card-title">🔒 Change Password</div></div>
            <div className="card-body">
              <div className="tp-profile-page-39">
                {[{
                label: 'Current Password',
                key: 'currentPassword',
                ph: '••••••••'
              }, {
                label: 'New Password',
                key: 'newPassword',
                ph: 'Min 8 characters'
              }, {
                label: 'Confirm New',
                key: 'confirm',
                ph: 'Re-enter new'
              }].map(f => <div key={f.key} className="form-field tp-profile-page-40">
                    <label className="form-label">{f.label}</label>
                    <input type="password" className="form-input" placeholder={f.ph} value={pwForm[f.key]} onChange={e => setPwForm(p => ({
                  ...p,
                  [f.key]: e.target.value
                }))} />
                  </div>)}
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleChangePassword}>Update Password</button>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>;
};
export default ProfilePage;