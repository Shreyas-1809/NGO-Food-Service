import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import HomePage from './components/HomePage';
import DonorDashboard from './components/DonorDashboard';
import ReceiverDashboard from './components/ReceiverDashboard';
import NGOProfilePage from './components/NGOProfilePage';
import MapPage from './components/MapPage';
import DonationTrackingPage from './components/DonationTrackingPage';
import ImpactDashboard from './components/ImpactDashboard';
import ExplorePage from './components/ExplorePage';
import AboutPage from './components/AboutPage';
import NGORequirementsPage from './components/NGORequirementsPage';
import AvailableDonationsForNGO from './components/AvailableDonationsForNGO';
import AIAssistantWidget from './components/AIAssistantWidget';
import NotificationsDrawer from './components/NotificationsDrawer';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {}
    }
    if (savedToken) {
      return { name: 'Ananya Sharma (Donor)', email: 'donor@demo.org', role: 'DONOR', accountType: 'DONOR' };
    }
    return null; // Show Login page by default if no token present
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [showNotifications, setShowNotifications] = useState(false);

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
    if (u) localStorage.setItem('user', JSON.stringify(u));
  };

  const renderDashboard = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.accountType === 'ORGANISATION' || user.role === 'RECEIVER') {
      return <ReceiverDashboard user={user} />;
    }
    return <DonorDashboard user={user} />;
  };

  return (
    <Router>
      <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300 relative overflow-x-hidden">
        
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
            <Route path="/donate" element={<DonorDashboard user={user || { name: 'Ananya Sharma (Donor)', role: 'DONOR', accountType: 'DONOR' }} />} />
            <Route path="/request" element={<ReceiverDashboard user={user || { name: 'Helping Hands Foundation', role: 'RECEIVER', accountType: 'ORGANISATION' }} />} />
            <Route path="/ngos" element={<ExplorePage />} />
            <Route path="/ngo/:id" element={<NGOProfilePage />} />
            <Route path="/ngo-requirements" element={<NGORequirementsPage />} />
            <Route path="/available-donations" element={<AvailableDonationsForNGO />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/impact" element={<ImpactDashboard />} />
            <Route path="/track/:id" element={<DonationTrackingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/dashboard" element={renderDashboard()} />
            <Route path="/login" element={<AuthPage setToken={setToken} setUser={handleSetUser} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Slide-over Notifications Drawer */}
        {showNotifications && (
          <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 z-50 animate-in slide-in-from-right duration-300">
            <NotificationsDrawer
              user={user || { accountType: 'DONOR' }}
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
