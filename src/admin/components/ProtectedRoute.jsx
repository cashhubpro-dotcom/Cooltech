import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps routes that require authentication.
 * Optionally pass `roles` to restrict to specific roles.
 *
 * Usage in router:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 *
 *   <Route element={<ProtectedRoute roles={['Admin']} />}>
 *     <Route path="/admin" element={<AdminPanel />} />
 *   </Route>
 */
export default function ProtectedRoute({
  roles
}) {
  const {
    user,
    loading
  } = useAuth();

  // Still checking stored token
  if (loading) {
    return <div className="ap-protected-route-1">
        <span className="lp-spinner ap-protected-route-2" />
      </div>;
  }

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Logged in but wrong role → redirect to dashboard
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}