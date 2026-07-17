import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/api';

export default function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    const timer = setTimeout(() => navigate('/login', { replace: true }), 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="lp-root">
      <div className="lp-card" style={{ textAlign: 'center' }}>
        <div className="lp-title">You've been signed out</div>
        <p className="lp-subtitle">Redirecting to login…</p>
        <button className="lp-btn" onClick={() => navigate('/login', { replace: true })}>
          Sign In Again →
        </button>
      </div>
    </div>
  );
}