import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import ActivityHistory from './components/ActivityHistory';

// Integrated Feature Pages (Accessible when logged in)
import FindNGOsPage from './components/FindNGOsPage';
import NGOProfilePage from './components/NGOProfilePage';
import NGORequirementsPage from './components/NGORequirementsPage';
import MapPage from './components/MapPage';
import DonationTrackingPage from './components/DonationTrackingPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Disable actual socket connection for now to stop 404 polling
const socket = { on: () => {}, off: () => {}, emit: () => {} };

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));
  
  // Theme state: defaults to light mode unless previously set to dark
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return false; // Default to light theme
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

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });
    return () => socket.off('connect');
  }, []);

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
        console.error('Session expired or invalid token');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

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
    <Router>
      <div className="min-h-screen w-full overflow-x-hidden flex flex-col bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
        <Navbar user={user} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <main className="flex-1 flex w-full relative">
          <Routes>
            {/* STRICT AUTH GATING: If not logged in, only AuthPage is displayed */}
            {!user ? (
              <>
                <Route path="*" element={<AuthPage setToken={setToken} setUser={setUser} />} />
              </>
            ) : (
              <>
                {/* Main Dashboard (Live Feed, Post Surplus Modal, Active Pickups, Drawers) */}
                <Route path="/" element={<Dashboard socket={socket} user={user} token={token} />} />
                
                {/* User Activity Log */}
                <Route path="/activity" element={<ActivityHistory token={token} />} />
                
                {/* Verified NGOs Directory */}
                <Route path="/ngos" element={<FindNGOsPage />} />
                <Route path="/find-ngos" element={<FindNGOsPage />} />
                <Route path="/ngo/:id" element={<NGOProfilePage />} />
                
                {/* NGO Shortages & Community Needs */}
                <Route path="/requirements" element={<NGORequirementsPage />} />
                <Route path="/ngo-requirements" element={<NGORequirementsPage />} />
                
                {/* Interactive Live Map */}
                <Route path="/map" element={<MapPage />} />
                
                {/* Donation Dispatch Tracking */}
                <Route path="/track/:id" element={<DonationTrackingPage />} />
                
                {/* Fallback to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
