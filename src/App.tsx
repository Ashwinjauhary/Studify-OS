import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { supabase } from './lib/supabase';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMissions from './pages/admin/Missions';
import AdminUsers from './pages/admin/Users';
import AdminGamification from './pages/admin/Gamification';
import AdminSettings from './pages/admin/Settings';
import AdminCommunication from './pages/admin/Communication';

import Onboarding from './pages/Onboarding';
import Missions from './pages/Missions';
import Focus from './pages/Focus';
import Gamification from './pages/Gamification';
import Dashboard from './pages/StudentDashboard';
import Career from './pages/Career';
import Social from './pages/Social';
import Analytics from './pages/AnalyticsPage';
import Notifications from './pages/Notifications';
import Resources from './pages/Resources';
import CalendarPage from './pages/Calendar';
import Chat from './pages/Chat';
import Settings from './pages/Settings';

import LandingPage from './pages/LandingPage';

// Placeholder removed
// const Dashboard = () => ...;
// const Missions = () => <h1 className="text-3xl font-bold text-white mb-6">Daily Missions</h1>; // Replaced

// Auth Guard Component with Onboarding Check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading, initialized } = useAuthStore();

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-primary">
        Loading System...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/landing" replace />;
  }

  // If profile exists but no Education Level (new user), force Onboarding
  // Except if we are ON the onboarding page
  const isOnboarding = window.location.pathname === '/onboarding';
  if (profile && !profile.education_level && !isOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

function App() {
  // Main App Component
  const { setSession, fetchProfile, profile } = useAuthStore();

  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      fetchProfile();
    });

    // Auth Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Theme Listener
  useEffect(() => {
    if (profile?.theme_preference) {
      const theme = profile.theme_preference;
      document.documentElement.classList.remove('dark', 'light', 'cyber');
      document.documentElement.classList.add(theme);
    }
  }, [profile?.theme_preference]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />

        {/* Student App */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="missions" element={<Missions />} />
          <Route path="focus" element={<Focus />} />
          <Route path="gamification" element={<Gamification />} />
          <Route path="career" element={<Career />} />
          <Route path="social" element={<Social />} />
          <Route path="resources" element={<Resources />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="chat" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Admin Panel */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="missions" element={<AdminMissions />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="gamification" element={<AdminGamification />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="communication" element={<AdminCommunication />} />
        </Route>

        {/* Catch-all for undefined routes in dev */}
        <Route path="*" element={<div className="text-gray-400 text-center mt-20">Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
