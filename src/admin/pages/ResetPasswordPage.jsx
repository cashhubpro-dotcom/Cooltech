import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
export default function ResetPasswordPage() {
  const {
    token
  } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If no token in URL, redirect to login
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };
  return <div className="lp-root">
      <div className="lp-bg-orb lp-bg-orb-1" />
      <div className="lp-bg-orb lp-bg-orb-2" />
      <div className="lp-bg-orb lp-bg-orb-3" />
      <div className="lp-grid-lines" />

      <div className="lp-card">
        {/* Logo */}
        <div className="lp-logo-wrap">
          <div className="lp-ac-icon">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="7" width="26" height="12" rx="3" stroke="#00c6ff" strokeWidth="1.5" />
              <path d="M8 13h16" stroke="#00c6ff" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="24.5" cy="13" r="1.5" fill="#00c6ff" opacity="0.7" />
              <path d="M10 19v4M16 19v5M22 19v3" stroke="#00c6ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
          <div>
            <div className="lp-brand">Cool<span>Tech</span> AC</div>
            <div className="lp-tagline">Management System</div>
          </div>
        </div>

        {/* ── SUCCESS STATE ── */}
        {success ? <div className="ap-reset-password-page-1">
            <div className="lp-sent-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="lp-title ap-reset-password-page-2">
              Password Reset!
            </div>
            <p className="lp-success-text">
              Your password has been updated successfully.<br />
              Redirecting you to login…
            </p>
            <button className="lp-btn" onClick={() => navigate('/login')}>
              Go to Login →
            </button>
          </div> : (/* ── RESET FORM ── */
      <form onSubmit={handleSubmit}>
            <button type="button" className="lp-back-btn" onClick={() => navigate('/login')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Login
            </button>

            <div className="lp-title">Set new password</div>
            <div className="lp-subtitle">Must be at least 6 characters</div>

            {error && <div className="lp-error">{error}</div>}

            <div className="lp-field">
              <label className="lp-label">New Password</label>
              <div className="lp-input-wrap">
                <input className="lp-input lp-input-pass" type={showPass ? 'text' : 'password'} placeholder="Enter new password" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="lp-input-icon" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                  {showPass ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
                </button>
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label">Confirm Password</label>
              <input className="lp-input" type="password" placeholder="Re-enter new password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>

            {/* Password strength indicator */}
            {password && <div className="ap-reset-password-page-3">
                <div className="ap-reset-password-page-4">
                  {[1, 2, 3, 4].map(i => <div key={i} style={{
              background: password.length >= i * 3 ? i <= 1 ? '#ef4444' : i === 2 ? '#f97316' : i === 3 ? '#eab308' : '#22c55e' : '#334155'
            }} className="ap-reset-password-page-5" />)}
                </div>
                <div className="ap-reset-password-page-6">
                  {password.length < 3 ? 'Too short' : password.length < 6 ? 'Weak' : password.length < 9 ? 'Fair' : 'Strong'}
                </div>
              </div>}

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading ? <><span className="lp-spinner" />Resetting…</> : 'Reset Password →'}
            </button>
          </form>)}
      </div>
    </div>;
}