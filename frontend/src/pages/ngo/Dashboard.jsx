import React from 'react';
import Dashboard from '../../components/Dashboard';

/**
 * NGO specific wrapper around the generic Dashboard component.
 * The generic Dashboard receives a `role` prop to decide which sections
 * to render (shortages, active pickups, etc.).
 */
export default function NGODashboard({ socket, user, token, onLogout, isDarkMode, toggleTheme }) {
  return <Dashboard socket={socket} user={user} token={token} role="ngo" onLogout={onLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
}
