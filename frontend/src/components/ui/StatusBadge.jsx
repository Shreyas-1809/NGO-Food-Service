import React from 'react';

// Maps strictly to the requested vocabulary
const STATUS_CONFIG = {
  'Pending': { bg: 'bg-success', text: 'text-success', border: 'border-success' },
  'Requests Sent': { bg: 'bg-info', text: 'text-info', border: 'border-info' },
  'Accepted': { bg: 'bg-primary', text: 'text-primary', border: 'border-primary' },
  'Completed': { bg: 'bg-success', text: 'text-success', border: 'border-success' },
  'Declined': { bg: 'bg-danger', text: 'text-danger', border: 'border-danger' },
  'Awaiting NGO': { bg: 'bg-warning', text: 'text-warning', border: 'border-warning' },
};

const StatusBadge = ({ status, className = '' }) => {
  // Normalize string for safety, but try to match exact capitalization
  const exactMatch = Object.keys(STATUS_CONFIG).find(
    k => k.toLowerCase() === (status || '').toLowerCase()
  );

  const label = exactMatch || 'Unknown';
  const config = STATUS_CONFIG[exactMatch] || { bg: 'bg-secondary', text: 'text-secondary', border: 'border-secondary' };

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;