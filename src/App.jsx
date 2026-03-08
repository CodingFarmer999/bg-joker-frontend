import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import OAuthCallback from './OAuthCallback';
import './App.css';

// User Pages
const Dashboard = React.lazy(() => import('./pages/user/Dashboard'));

// Auth Pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));

// Admin Pages
const AdminPage = React.lazy(() => import('./pages/admin/AdminPage'));
const EventSearchPage = React.lazy(() => import('./pages/admin/EventSearchPage'));
const EventManagementPage = React.lazy(() => import('./pages/admin/EventManagementPage'));
const AdminManagementPage = React.lazy(() => import('./pages/admin/AdminManagementPage'));

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('joker-theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />
      <Suspense fallback={<div className="loader-container"><div className="loader"></div></div>}>
        <Routes>
          {/* Public & User Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/events" element={
            <ProtectedRoute requireAdmin={true}>
              <EventSearchPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/events/:eventId" element={
            <ProtectedRoute requireAdmin={true}>
              <EventManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminManagementPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
