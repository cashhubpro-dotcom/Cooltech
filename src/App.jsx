import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LogoutPage from './pages/LogoutPage';
import ResetPasswordPage from './pages/ResetPasswordPage';   // ← new
import ProtectedRoute from './components/ProtectedRoute';

import AdminApp from './admin/App';
import ClientApp from './client-panel/src/App';
import TechApp from './tech-panel/src/App';

import { CompanyProvider } from './admin/context/CompanyContext';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />   {/* ← new, public */}

        <Route
  path="/admin/*"
  element={
    <ProtectedRoute allowedRoles={['admin', 'manager', 'viewer']}>
      <CompanyProvider>
        <AdminApp />
      </CompanyProvider>
    </ProtectedRoute>
  }
/>
        <Route
          path="/tech/*"
          element={
            <ProtectedRoute allowedRoles={['technician']}>
              <TechApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/*"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientApp />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}