import React from 'react';

// Maps strictly to the requested vocabulary
const STATUS_CONFIG = {
  'Active': { bg: 'bg-[#F3F0EA] text-[#18315E] border-[#E5E1D8]', text: 'text-[#18315E]', border: 'border-[#E5E1D8]' },
  'Pending': { bg: 'bg-[#F3F0EA] text-[#E5B85C] border-[#E5E1D8]', text: 'text-[#E5B85C]', border: 'border-[#E5E1D8]' },
  'Accepted': { bg: 'bg-[#F3F0EA] text-[#18315E] border-[#E5E1D8]', text: 'text-[#18315E]', border: 'border-[#E5E1D8]' },
  'Scheduled': { bg: 'bg-[#F3F0EA] text-[#18315E] border-[#E5E1D8]', text: 'text-[#18315E]', border: 'border-[#E5E1D8]' },
  'In Transit': { bg: 'bg-[#F3F0EA] text-[#18315E] border-[#E5E1D8]', text: 'text-[#18315E]', border: 'border-[#E5E1D8]' },
  'Completed': { bg: 'bg-[#F3F0EA] text-[#18315E] border-[#E5E1D8]', text: 'text-[#18315E]', border: 'border-[#E5E1D8]' },
  'Expired': { bg: 'bg-[#F3F0EA] text-[#18315E] border-[#E5E1D8]', text: 'text-[#18315E]', border: 'border-[#E5E1D8]' },
  'Cancelled': { bg: 'bg-[#F3F0EA] text-[#18315E] border-[#E5E1D8]', text: 'text-[#18315E]', border: 'border-[#E5E1D8]' },
};

const StatusBadge = ({ status, className = '' }) => {
  // Normalize string for safety, but try to match exact capitalization
  const exactMatch = Object.keys(STATUS_CONFIG).find(
    k => k.toLowerCase() === (status || '').toLowerCase()
  );
  
  const label = exactMatch || 'Unknown';
  const config = STATUS_CONFIG[exactMatch] || { bg: 'bg-[#F3F0EA]', text: 'text-[#18315E]', border: 'border-[#E5E1D8]' };

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;


