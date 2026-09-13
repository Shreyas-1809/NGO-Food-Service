import React from 'react';

/**
 * EmptyStateNoResults
 * Flat-style friendly SVG scene for "No Search / Filter Results".
 * Depicts a magnifying glass exploring a clean plate/map area with soft blobs.
 */
const EmptyStateNoResults = ({ className = 'w-36 h-36', ...props }) => {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="No results found illustration"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id="resBlobGrad" x1="30" y1="20" x2="170" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.75" />
          <stop offset="60%" stopColor="#E0F2FE" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#DCFCE7" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="plateGrad" x1="60" y1="70" x2="140" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5EFE6" />
        </linearGradient>
        <filter id="resDrop" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#2F7A4D" floodOpacity="0.08" />
        </filter>
        <filter id="magDrop" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#E8873A" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Background Soft Organic Blob */}
      <path
        d="M165 75C175 110 140 145 100 148C60 150 32 120 28 85C24 50 55 20 95 20C135 20 155 45 165 75Z"
        fill="url(#resBlobGrad)"
      />

      {/* Decorative Dots */}
      <circle cx="35" cy="45" r="4" fill="#E8873A" fillOpacity="0.25" />
      <circle cx="165" cy="38" r="3" fill="#2F7A4D" fillOpacity="0.3" />
      <circle cx="168" cy="120" r="5" fill="#E8873A" fillOpacity="0.2" />

      {/* Empty Plate Base */}
      <g filter="url(#resDrop)">
        <ellipse cx="100" cy="100" rx="55" ry="24" fill="url(#plateGrad)" stroke="#E8DFD2" strokeWidth="1.5" />
        <ellipse cx="100" cy="100" rx="38" ry="16" fill="#FBF8F3" stroke="#E8DFD2" strokeWidth="1" />
      </g>

      {/* Dotted exploration trail */}
      <path
        d="M60 70C65 50 85 45 105 55C125 65 140 55 145 45"
        stroke="#2F7A4D"
        strokeWidth="2"
        strokeDasharray="3 4"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />

      {/* Small Map Pin on Plate */}
      <g transform="translate(85, 76)">
        <path
          d="M6 0C2.7 0 0 2.7 0 6C0 10.5 6 16 6 16C6 16 12 10.5 12 6C12 2.7 9.3 0 6 0Z"
          fill="#2F7A4D"
          fillOpacity="0.85"
        />
        <circle cx="6" cy="6" r="2.5" fill="#FFFFFF" />
      </g>

      {/* Magnifying Glass floating over the scene */}
      <g transform="translate(105, 52) rotate(-15)" filter="url(#magDrop)">
        {/* Glass Lens Rim */}
        <circle cx="22" cy="22" r="22" fill="#FFFFFF" fillOpacity="0.85" stroke="#E8873A" strokeWidth="4" />
        {/* Lens reflection shine */}
        <path
          d="M10 14C12 10 16 8 20 8"
          stroke="#E8873A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
        {/* Handle */}
        <path
          d="M38 38L56 56"
          stroke="#C8661E"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M38 38L42 42"
          stroke="#E8873A"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>

      {/* Sparkles */}
      <path
        d="M48 95C48 98 45 101 42 101C45 101 48 104 48 107C48 104 51 101 54 101C51 101 48 98 48 95Z"
        fill="#2F7A4D"
        fillOpacity="0.6"
      />
      <path
        d="M152 75C152 77 150 79 148 79C150 79 152 81 152 83C152 81 154 79 156 79C154 79 152 77 152 75Z"
        fill="#E8873A"
        fillOpacity="0.7"
      />
    </svg>
  );
};

export default EmptyStateNoResults;
