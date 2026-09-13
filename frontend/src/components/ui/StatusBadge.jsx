import React from 'react';

// Maps strictly to the requested vocabulary
const STATUS_CONFIG = {
  'Active': { bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  'Pending': { bg: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  'Accepted': { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  'Scheduled': { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  'In Transit': { bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  'Completed': { bg: 'bg-teal-100 dark:bg-teal-900/50', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  'Expired': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-600' },
  'Cancelled': { bg: 'bg-rose-100 dark:bg-rose-900/50', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
};

const StatusBadge = ({ status, className = '' }) => {
  // Normalize string for safety, but try to match exact capitalization
  const exactMatch = Object.keys(STATUS_CONFIG).find(
    k => k.toLowerCase() === (status || '').toLowerCase()
  );
  
  const label = exactMatch || 'Unknown';
  const config = STATUS_CONFIG[exactMatch] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
