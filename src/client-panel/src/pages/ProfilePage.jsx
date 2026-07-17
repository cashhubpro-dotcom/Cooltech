import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { COLORS, FONTS } from '../constants/tokens';
import { clientProfileApi } from '../services/clientPortalApi';
import { Toast } from '../components/ui/Components';
const formatMemberSince = isoDate => {
  const d = new Date(isoDate);
  return d.toLocaleString('en-US', {
    month: 'short',
    year: 'numeric'
  });
};
const NOTIF_META = [{
  key: 'jobUpdates',
  label: 'Job Status Updates',
  sub: 'When technician is assigned or job is completed'
}, {
  key: 'invoiceReminders',
  label: 'Invoice Reminders',
  sub: 'Reminders before invoice due dates'
}, {
  key: 'amcReminders',
  label: 'AMC Visit Reminders',
  sub: 'Alerts before scheduled AMC visits'
}, {
  key: 'serviceReminders',
  label: 'Service Reminders',
  sub: 'Filter cleaning, gas refill alerts'
}, {
  key: 'promotions',
  label: 'Promotional Offers',
  sub: 'Seasonal discounts and new services'
}];
const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: ''
  });
  const [pwForm, setPwForm] = useState({
    current: '',
    newPw: '',
    confirm: ''
  });
  const [showPw, setShowPw] = useState({
    current: false,
    newPw: false,
    confirm: false
  });
  const [pwSaving, setPwSaving] = useState(false);
  const togglePwVisibility = key => setShowPw(p => ({
    ...p,
    [key]: !p[key]
  }));
  useEffect(() => {
    (async () => {
      try {
        const [profileRes, summaryRes, prefsRes] = await Promise.all([clientProfileApi.get(), clientProfileApi.summary(), clientProfileApi.getNotifPrefs()]);
        setProfile(profileRes.data);
        setSummary(summaryRes.data);
        setPrefs(prefsRes.data);
        setFormData({
          name: profileRes.data.name,
          contact: profileRes.data.contact,
          email: profileRes.data.email,
          phone: profileRes.data.phone,
          address: profileRes.data.address
        });
      } catch (err) {
        setToast(err.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await clientProfileApi.update(formData);
      setProfile(p => ({
        ...p,
        ...res.data
      }));
      setEditMode(false);
      setToast('Profile updated successfully!');
    } catch (err) {
      setToast(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };
  const handleChangePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) {
      setToast('New password and confirmation do not match.');
      return;
    }
    setPwSaving(true);
    try {
      await clientProfileApi.changePassword(pwForm);
      setPwForm({
        current: '',
        newPw: '',
        confirm: ''
      });
      setToast('Password changed successfully!');
    } catch (err) {
      setToast(err.message || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };
  const handleTogglePref = async key => {
    const next = {
      ...prefs,
      [key]: !prefs[key]
    };
    setPrefs(next);
    try {
      const res = await clientProfileApi.updateNotifPrefs({
        [key]: next[key]
      });
      setPrefs(res.data);
      setToast('Preference saved!');
    } catch (err) {
      setPrefs(prefs);
      setToast(err.message || 'Failed to save preference.');
    }
  };
  if (loading) return <div className="cp-profile-page-1">Loading profile…</div>;
  if (!profile || !summary || !prefs) return null;
  return <div>
      <div className="section-hdr">
        <div>
          <div className="section-title">My Profile</div>
          <div className="section-sub">Account information and preferences</div>
        </div>
        {!editMode && <button className="btn btn-outline" onClick={() => setEditMode(true)}>✏️ Edit Profile</button>}
      </div>

      <div className="cp-profile-page-2">

        {/* Left: profile card */}
        <div className="cp-profile-page-3">
          <div className="card animate-fade-up">
            <div className="card-body cp-profile-page-4">
              <div style={{
              background: `linear-gradient(135deg, ${profile.color}, ${COLORS.brandD})`
            }} className="cp-profile-page-5">
                {profile.avatar}
              </div>
              <div className="cp-profile-page-6">{profile.name}</div>
              <div className="cp-profile-page-7">{profile.contact}</div>
              <div className="cp-profile-page-8">{profile.email}</div>
              <div className="cp-profile-page-9">
                {profile.amc && <span className="cp-profile-page-10">✅ AMC Active</span>}
                <span className="cp-profile-page-11">⭐ Valued Client</span>
              </div>
            </div>
          </div>

          <div className="card animate-fade-up1">
            <div className="card-header"><div className="card-title">Account Summary</div></div>
            <div className="card-body cp-profile-page-12">
              {[{
              label: 'Member Since',
              value: formatMemberSince(summary.memberSince)
            }, {
              label: 'AC Units',
              value: `${summary.units} Units`
            }, {
              label: 'Total Jobs Done',
              value: summary.totalJobsDone
            }, {
              label: 'Total Spent',
              value: `₹${(summary.totalSpent / 1000).toFixed(1)}K`
            }, {
              label: 'Client Type',
              value: summary.clientType
            }, {
              label: 'GST Number',
              value: summary.gst || '—'
            }].map(({
              label,
              value
            }) => <div key={label} className="cp-profile-page-13">
                  <span className="cp-profile-page-14">{label}</span>
                  <span style={{
                fontFamily: label === 'Total Spent' ? FONTS.mono : undefined
              }} className="cp-profile-page-15">{value}</span>
                </div>)}
            </div>
          </div>
        </div>

        {/* Right: edit form + password */}
        <div className="cp-profile-page-16">

          <div className="card animate-fade-up">
            <div className="card-header">
              <div className="card-title">Contact Information</div>
              {editMode && <div className="cp-profile-page-17">
                  <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSaveProfile}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
                </div>}
            </div>
            <div className="card-body">
              {editMode ? <div className="cp-profile-page-18">
                  {[{
                label: 'Company / Client Name',
                key: 'name',
                placeholder: 'Company name'
              }, {
                label: 'Contact Person',
                key: 'contact',
                placeholder: 'Contact person name'
              }, {
                label: 'Email Address',
                key: 'email',
                placeholder: 'email@example.com'
              }, {
                label: 'Phone Number',
                key: 'phone',
                placeholder: '98XXXXXXXX'
              }].map(f => <div key={f.key} className="form-field cp-profile-page-19">
                      <label className="form-label">{f.label}</label>
                      <input className="form-input" placeholder={f.placeholder} value={formData[f.key]} onChange={e => setFormData(p => ({
                  ...p,
                  [f.key]: e.target.value
                }))} />
                    </div>)}
                  <div className="form-field cp-profile-page-20">
                    <label className="form-label">Address</label>
                    <textarea className="form-input" rows={2} value={formData.address} onChange={e => setFormData(p => ({
                  ...p,
                  address: e.target.value
                }))} />
                  </div>
                </div> : <div className="cp-profile-page-21">
                  {[{
                label: 'Company / Client Name',
                value: profile.name
              }, {
                label: 'Contact Person',
                value: profile.contact
              }, {
                label: 'Email Address',
                value: profile.email
              }, {
                label: 'Phone Number',
                value: profile.phone
              }, {
                label: 'Address',
                value: profile.address,
                wide: true
              }].map(f => <div key={f.label} style={{
                gridColumn: f.wide ? '1 / -1' : undefined
              }}>
                      <div className="cp-profile-page-22">{f.label}</div>
                      <div className="cp-profile-page-23">{f.value}</div>
                    </div>)}
                </div>}
            </div>
          </div>

          <div className="card animate-fade-up1">
            <div className="card-header"><div className="card-title">🔒 Change Password</div></div>
            <div className="card-body">
              <div className="cp-profile-page-24">
                {[{
                label: 'Current Password',
                key: 'current',
                placeholder: '••••••••'
              }, {
                label: 'New Password',
                key: 'newPw',
                placeholder: 'Min 8 characters'
              }, {
                label: 'Confirm New',
                key: 'confirm',
                placeholder: 'Re-enter new password'
              }].map(f => <div key={f.key} className="form-field cp-profile-page-25">
                    <label className="form-label">{f.label}</label>
                    <div className="cp-profile-page-26">
                      <input type={showPw[f.key] ? 'text' : 'password'} className="form-input cp-profile-page-27" placeholder={f.placeholder} value={pwForm[f.key]} onChange={e => setPwForm(p => ({
                    ...p,
                    [f.key]: e.target.value
                  }))} autoComplete={f.key === 'current' ? 'current-password' : 'new-password'} />
                      <button type="button" onClick={() => togglePwVisibility(f.key)} aria-label={showPw[f.key] ? 'Hide password' : 'Show password'} className="cp-profile-page-28">
                        {showPw[f.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>)}
              </div>
              <button className="btn btn-outline btn-sm" disabled={pwSaving} onClick={handleChangePassword}>
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </div>

          <div className="card animate-fade-up2">
            <div className="card-header"><div className="card-title">🔔 Notification Preferences</div></div>
            <div className="card-body">
              {NOTIF_META.map((meta, i) => <div key={meta.key} style={{
              borderBottom: i < NOTIF_META.length - 1 ? "1px solid var(--border)" : "none"
            }} className="cp-profile-page-29">
                  <div>
                    <div className="cp-profile-page-30">{meta.label}</div>
                    <div className="cp-profile-page-31">{meta.sub}</div>
                  </div>
                  <div onClick={() => handleTogglePref(meta.key)} style={{
                background: prefs[meta.key] ? "var(--brand)" : "var(--border)"
              }} className="cp-profile-page-32">
                    <div style={{
                  left: prefs[meta.key] ? "21px" : "3px"
                }} className="cp-profile-page-33" />
                  </div>
                </div>)}
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </div>;
};
export default ProfilePage;