import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (user) {
    return <Navigate to="/chat" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <Routes>
        <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster position="top-right" />
    </AuthProvider>
  );
};

export default App; 