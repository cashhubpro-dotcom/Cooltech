import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword, homeRouteForRole } from '../services/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
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
      const user = await resetPassword(token, password);
      setLoading(false);
      setDone(true);
      setTimeout(() => navigate(homeRouteForRole(user.role), { replace: true }), 1500);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Reset link is invalid or has expired.');
    }
  };

  return (
    <div className="lp-root">
      <div className="lp-bg-shape lp-bg-shape-1" />
      <div className="lp-bg-shape lp-bg-shape-2" />
      <div className="lp-grid-lines" />

      <div className="lp-card">
        <div className="lp-logo-wrap">
          <div className="lp-icon-box">❄️</div>
          <div className="lp-brand-text">
            <div className="lp-brand-name">Cool<span>Tech</span> AC</div>
            <div className="lp-brand-sub">AC Services Platform</div>
          </div>
        </div>

        {!done ? (
          <form onSubmit={handleSubmit}>
            <div className="lp-title">Set a new password</div>
            <div className="lp-subtitle">Choose a new password for your account</div>

            {error && <div className="lp-error">{error}</div>}

            <div className="lp-field">
              <label className="lp-label">New Password</label>
              <div className="lp-input-wrap">
                <input
                  className="lp-input lp-input-pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="lp-input-icon" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label">Confirm Password</label>
              <input
                className="lp-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="lp-btn" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="lp-spinner" />Resetting…</> : 'Reset Password →'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div className="lp-title">Password reset successful</div>
            <p className="lp-success-text">Redirecting you to your dashboard…</p>
          </div>
        )}
      </div>
    </div>
  );
}