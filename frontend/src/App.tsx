import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import BucketsPage from './pages/BucketsPage';
import AdminPage from './pages/AdminPage';

// ── Loading skeleton — matches the chat app layout ──────────────────────
const AppLoadingSkeleton: React.FC = () => (
  <div className="flex h-screen bg-dark-base dark:bg-dark-base overflow-hidden">
    {/* Sidebar skeleton */}
    <div className="w-[260px] flex-shrink-0 flex flex-col gap-3 p-4 border-r border-white/[0.06]">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="skeleton w-8 h-8 rounded-xl" />
        <div className="skeleton w-20 h-5 rounded-md" />
      </div>
      <div className="skeleton w-full h-9 rounded-xl" />
      <div className="skeleton w-full h-8 rounded-lg" />
      <div className="mt-2 space-y-1.5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton h-9 rounded-lg" style={{ width: `${85 - i * 3}%`, animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
    </div>
    {/* Main area skeleton */}
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
      <div className="skeleton w-16 h-16 rounded-full" />
      <div className="skeleton w-56 h-8 rounded-xl" />
      <div className="skeleton w-40 h-5 rounded-lg" />
      <div className="grid grid-cols-2 gap-3 mt-4 w-full max-w-lg">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoadingSkeleton />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AppLoadingSkeleton />;
  if (user) return <Navigate to="/chat" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => (
  <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
    <Routes>
      <Route path="/"          element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/auth"      element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/chat"      element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/buckets"   element={<ProtectedRoute><BucketsPage /></ProtectedRoute>} />
      <Route path="/admin"     element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  </div>
);

const App: React.FC = () => (
  <AuthProvider>
    <AppRoutes />
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: 'var(--surface-2)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          borderRadius: '12px',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          backdropFilter: 'blur(12px)',
          boxShadow: 'var(--shadow-elevated)',
        },
        success: {
          iconTheme: { primary: '#10B981', secondary: 'white' },
        },
        error: {
          iconTheme: { primary: '#EF4444', secondary: 'white' },
        },
      }}
    />
  </AuthProvider>
);

export default App;
