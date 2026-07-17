import { Navigate } from 'react-router-dom';
import { isLoggedIn, getUser, panelForRole } from '../services/api';

export default function ProtectedRoute({ allowedRoles, children }) {

  const panel = panelForRole(allowedRoles?.[0]);

  const user = getUser(panel);

  if (!isLoggedIn(panel) || !user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}