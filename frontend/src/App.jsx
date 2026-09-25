import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import DonorDashboard from './pages/donor/Dashboard';
import NGODashboard from './pages/ngo/Dashboard';
import LogSurplus from './pages/donor/LogSurplus';
import VolunteerSection from './pages/donor/VolunteerSection';
import AuthPage from './components/AuthPage';
import ActivityHistory from './components/ActivityHistory';

// Integrated Feature Pages (Accessible when logged in)
import FindNGOsPage from './components/FindNGOsPage';
import MapPage from './components/MapPage';
import NGOProfilePage from './components/NGOProfilePage';
import DonationTrackingPage from './components/DonationTrackingPage';
import ErrorBoundary from './components/ErrorBoundary';
import VolunteerTaskPage from './components/VolunteerTaskPage';
import ConfirmPickupPage from './components/ConfirmPickupPage';
import ConfirmDeliveryPage from './components/ConfirmDeliveryPage';
import { io } from 'socket.io-client';

import { LanguageProvider } from './context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(API_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling']
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  // Theme state: defaults to saved preference or user's system preference (prefers-color-scheme)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Listen to system preference changes when user hasn't explicitly set a preference in localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (err) {
        console.error('Session restore failed:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // Handle live updates to user profile (e.g. background check verification)
  useEffect(() => {
    if (!user?._id) return;
    
    const roomName = `room:${user._id}`;
    socket.emit('join_room', roomName);

    const handleUserUpdate = (data) => {
      if (data && data.user) {
        setUser(data.user);
      }
    };

    socket.on('user_updated', handleUserUpdate);

    return () => {
      socket.off('user_updated', handleUserUpdate);
    };
  }, [user?._id]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
          <span className="text-sm font-medium">Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Router>
          <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <Navbar 
              user={user} 
              token={token}
              onLogout={handleLogout} 
              isDarkMode={isDarkMode} 
              toggleTheme={toggleTheme} 
              onUserUpdated={(updatedUser) => setUser(updatedUser)}
            />

            <main className="flex-1 flex w-full relative">
              <Routes>
                {/* Public no-login confirmation and task tracking routes */}
                <Route path="/pickup/:taskId" element={<VolunteerTaskPage />} />
                <Route path="/confirm-pickup/:taskId" element={<ConfirmPickupPage />} />
                <Route path="/confirm-delivery/:taskId" element={<ConfirmDeliveryPage />} />

                {/* STRICT AUTH GATING: If not logged in, only AuthPage is displayed */}
                {!user ? (
                  <>
                    <Route path="*" element={<AuthPage setToken={setToken} setUser={setUser} />} />
                  </>
                ) : (
                  <>
                    {/* Main Dashboard (Live Feed, Post Surplus Modal, Active Pickups, Drawers) */}
                    <Route path="/" element={user?.role === 'DONOR' ? <DonorDashboard socket={socket} user={user} token={token} /> : <NGODashboard socket={socket} user={user} token={token} />} />

                    {/* User Activity Log */}
                    <Route path="/activity" element={<ActivityHistory token={token} user={user} />} />

                    {/* Verified NGOs Directory & Map */}
                    <Route path="/ngos" element={<FindNGOsPage user={user} />} />
                    <Route path="/find-ngos" element={<FindNGOsPage user={user} />} />
                    <Route path="/map" element={<MapPage user={user} />} />
                    <Route path="/ngo/:id" element={<NGOProfilePage user={user} />} />

                    {/* Direct Donate Flow */}
                    <Route path="/donate" element={<Dashboard socket={socket} user={user} token={token} autoOpenDonate={true} />} />
<Route path="/donor/log-surplus" element={<LogSurplus socket={socket} user={user} token={token} />} />
<Route path="/donor/volunteer" element={<VolunteerSection socket={socket} user={user} token={token} />} />

                    {/* Donation Dispatch Tracking */}
                    <Route path="/track/:id" element={<DonationTrackingPage />} />
                    <Route path="/track" element={<DonationTrackingPage />} />

                    {/* Fallback to Dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                )}
              </Routes>
            </main>
          </div>
        </Router>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
