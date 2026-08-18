import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import HomePage from './components/HomePage';
import DonorDashboard from './components/DonorDashboard';
import ReceiverDashboard from './components/ReceiverDashboard';
import VolunteerDashboard from './components/VolunteerDashboard';
import NGOProfilePage from './components/NGOProfilePage';
import MapPage from './components/MapPage';
import DonationTrackingPage from './components/DonationTrackingPage';
import ImpactDashboard from './components/ImpactDashboard';
import ExplorePage from './components/ExplorePage';
import AboutPage from './components/AboutPage';
import NGORequirementsPage from './components/NGORequirementsPage';
import AvailableDonationsForNGO from './components/AvailableDonationsForNGO';
import FindNGOsPage from './components/FindNGOsPage';
import AIAssistantWidget from './components/AIAssistantWidget';
import NotificationsDrawer from './components/NotificationsDrawer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getUserRole = (u) => {
  if (!u) return null;
  if (u.role) return u.role;
  if (u.accountType === 'ORGANISATION') return 'RECEIVER';
  return u.accountType || 'DONOR';
};

const getRoleDashboardPath = (role) => {
  if (role === 'VOLUNTEER') return '/volunteer';
  if (role === 'RECEIVER') return '/receiver';
  return '/donor';
};

// ProtectedRoute component that enforces role-based access
const ProtectedRoute = ({ allowedRoles, user, isLoading, children }) => {
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole(user);
  if (!allowedRoles.includes(role)) {
    // Redirect unauthorized attempts to user's designated dashboard
    return <Navigate to={getRoleDashboardPath(role)} replace />;
  }

  return children;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {}
    }
    return null;
  });
  const [isLoadingSession, setIsLoadingSession] = useState(Boolean(localStorage.getItem('token')));

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [showNotifications, setShowNotifications] = useState(false);

  // Restore session via /api/auth/me on startup or token change
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setIsLoadingSession(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        const fetchedUser = res.data;
        setUser(fetchedUser);
        localStorage.setItem('user', JSON.stringify(fetchedUser));
      } catch (err) {
        console.error('Session restoration failed:', err?.response?.data?.message || err.message);
        // Clear invalid token/session
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoadingSession(false);
      }
    };

    restoreSession();
  }, [token]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const handleSetUser = (u) => {
    setUser(u);
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
    }
  };

  const currentRole = getUserRole(user);

  return (
    <Router>
      <div className="min-h-screen w-full flex flex-col bg-[#FBFBFA] dark:bg-[#121514] font-sans text-stone-900 dark:text-stone-50 transition-colors duration-200 relative overflow-x-hidden">
        
        {/* Navigation Bar */}
        <Navbar
          user={user}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
          onOpenNotifications={() => setShowNotifications(!showNotifications)}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full relative">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/find-ngos" element={<FindNGOsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/impact" element={<ImpactDashboard />} />
            <Route path="/ngo/:id" element={<NGOProfilePage />} />
            <Route path="/ngo-requirements" element={<NGORequirementsPage />} />
            <Route path="/available-donations" element={<AvailableDonationsForNGO />} />
            <Route path="/track/:id" element={<DonationTrackingPage />} />

            {/* Role Protected Routes */}
            <Route 
              path="/donor" 
              element={
                <ProtectedRoute allowedRoles={['DONOR']} user={user} isLoading={isLoadingSession}>
                  <DonorDashboard user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/donate" 
              element={
                <ProtectedRoute allowedRoles={['DONOR']} user={user} isLoading={isLoadingSession}>
                  <DonorDashboard user={user} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/receiver" 
              element={
                <ProtectedRoute allowedRoles={['RECEIVER']} user={user} isLoading={isLoadingSession}>
                  <ReceiverDashboard user={user} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/request" 
              element={
                <ProtectedRoute allowedRoles={['RECEIVER']} user={user} isLoading={isLoadingSession}>
                  <ReceiverDashboard user={user} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/volunteer" 
              element={
                <ProtectedRoute allowedRoles={['VOLUNTEER']} user={user} isLoading={isLoadingSession}>
                  <VolunteerDashboard user={user} />
                </ProtectedRoute>
              } 
            />

            {/* General Dashboard Redirect */}
            <Route 
              path="/dashboard" 
              element={
                user ? (
                  <Navigate to={getRoleDashboardPath(currentRole)} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />

            {/* Auth Routes */}
            <Route 
              path="/login" 
              element={
                user ? (
                  <Navigate to={getRoleDashboardPath(currentRole)} replace />
                ) : (
                  <AuthPage setToken={setToken} setUser={handleSetUser} />
                )
              } 
            />
            <Route 
              path="/auth" 
              element={
                user ? (
                  <Navigate to={getRoleDashboardPath(currentRole)} replace />
                ) : (
                  <AuthPage setToken={setToken} setUser={handleSetUser} />
                )
              } 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Slide-over Notifications Drawer */}
        {showNotifications && (
          <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-50 animate-in slide-in-from-right duration-300">
            <NotificationsDrawer
              user={user || { accountType: 'DONOR', role: 'DONOR' }}
              socket={{ on: () => {}, off: () => {} }}
              onClose={() => setShowNotifications(false)}
            />
          </div>
        )}

        {/* Floating AI Assistant Widget */}
        <AIAssistantWidget />

      </div>
    </Router>
  );
}

export default App;
