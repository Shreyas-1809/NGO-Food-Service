import React from 'react';
import Dashboard from '../../components/Dashboard';

/**
 * Donor specific wrapper around the generic Dashboard component.
 * The generic Dashboard receives a `role` prop to decide which sections
 * to render (surplus items, matched NGOs, volunteer section, etc.).
 */
export default function DonorDashboard({ socket, user, token, onLogout, isDarkMode, toggleTheme }) {
  return <Dashboard socket={socket} user={user} token={token} role="donor" onLogout={onLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
}
