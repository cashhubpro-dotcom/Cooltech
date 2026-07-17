import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, forgotPassword, isLoggedIn, getUser, homeRouteForRole } from '../services/api';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'reset_sent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');

  const navigate = useNavigate();

  // useEffect(() => {
  //   if (isLoggedIn()) {
  //     const user = getUser();
  //     navigate(homeRouteForRole(user?.role), { replace: true });
  //   }
  // }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      setLoading(false);
      navigate(homeRouteForRole(user.role), { replace: true });
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail) { setForgotError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setLoading(false);
      setMode('reset_sent');
    } catch (err) {
      setLoading(false);
      setForgotError(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="lp-root">
      <div className="lp-bg-shape lp-bg-shape-1" />
      <div className="lp-bg-shape lp-bg-shape-2" />
      <div className="lp-grid-lines" />
      <div className="lp-noise" />
      <div className="lp-side-strip" />

      <div className="lp-card">
        <div className="lp-logo-wrap">
          <div className="lp-icon-box">❄️</div>
          <div className="lp-brand-text">
            <div className="lp-brand-name">Cool<span>Tech</span> AC</div>
            <div className="lp-brand-sub">AC Services Platform</div>
          </div>
        </div>

        {mode === 'login' && (
          <form onSubmit={handleLogin} autoComplete="off">
            <div className="lp-title">Welcome back</div>
            <div className="lp-subtitle">Login to your account to continue</div>

            {error && <div className="lp-error">{error}</div>}

            <div className="lp-field">
              <label className="lp-label">Email Address</label>
              <div className="lp-input-wrap">
                <input
                  className="lp-input"
                  type="email"
                  placeholder="you@cooltech.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required autoComplete="off"
                />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label">Password</label>
              <div className="lp-input-wrap">
                <input
                  className="lp-input lp-input-pass"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required autoComplete="new-password"
                />
                <button type="button" className="lp-input-icon" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <div className="lp-forgot-row">
              <button type="button" className="lp-link" onClick={() => { setMode('forgot'); setForgotEmail(email); setForgotError(''); }}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading ? <><span className="lp-spinner" />Logging in…</> : 'Login →'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <button type="button" className="lp-back-btn" onClick={() => setMode('login')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Login
            </button>
            <div className="lp-title">Reset password</div>
            <div className="lp-subtitle">We'll send a reset link to your email</div>

            {forgotError && <div className="lp-error">{forgotError}</div>}

            <div className="lp-field">
              <label className="lp-label">Email Address</label>
              <input
                className="lp-input"
                type="email"
                placeholder="you@cooltech.com"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
              />
            </div>

            <button type="submit" className="lp-btn" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="lp-spinner" />Sending…</> : 'Send Reset Link →'}
            </button>
          </form>
        )}

        {mode === 'reset_sent' && (
          <div style={{ textAlign: 'center' }}>
            <div className="lp-sent-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#00c6ff" strokeWidth="1.5">
                <path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/>
              </svg>
            </div>
            <div className="lp-title" style={{ textAlign: 'center', marginBottom: '8px' }}>Check your inbox</div>
            <p className="lp-success-text">
              A password reset link has been sent to<br />
              <strong>{forgotEmail}</strong><br />
              It may take a minute to arrive.
            </p>
            <button type="button" className="lp-btn" onClick={() => { setMode('login'); setForgotEmail(''); }}>
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}