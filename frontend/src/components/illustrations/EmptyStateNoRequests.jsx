import React from 'react';

/**
 * EmptyStateNoRequests
 * Flat-style friendly SVG scene for "No Claim Requests".
 * Depicts a clean bowl on a placemat with a floating awaiting-request envelope and soft blobs.
 */
const EmptyStateNoRequests = ({ className = 'w-36 h-36', ...props }) => {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="No claim requests illustration"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id="reqBlobGrad" x1="20" y1="20" x2="180" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFEDD5" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="reqBowlGrad" x1="70" y1="80" x2="130" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5EFE6" />
        </linearGradient>
        <filter id="reqDrop" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#2F7A4D" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Background Soft Blob */}
      <path
        d="M165 80C175 110 145 145 105 148C65 150 35 125 30 90C25 55 60 25 100 22C140 18 155 50 165 80Z"
        fill="url(#reqBlobGrad)"
      />

      {/* Decorative Dots */}
      <circle cx="35" cy="45" r="4" fill="#E8873A" fillOpacity="0.25" />
      <circle cx="165" cy="35" r="3" fill="#2F7A4D" fillOpacity="0.3" />
      <circle cx="170" cy="120" r="5" fill="#E8873A" fillOpacity="0.2" />

      {/* Placemat / Napkin */}
      <ellipse cx="100" cy="120" rx="65" ry="16" fill="#E8DFD2" fillOpacity="0.6" />

      {/* Bowl */}
      <g filter="url(#reqDrop)">
        <path
          d="M55 85C55 118 75 130 100 130C125 130 145 118 145 85H55Z"
          fill="url(#reqBowlGrad)"
        />
        <ellipse cx="100" cy="85" rx="45" ry="8" fill="#FFFFFF" />
        <ellipse cx="100" cy="85" rx="42" ry="6.5" fill="#FBF8F3" />
        {/* Decorative stripe on bowl */}
        <path
          d="M62 98C72 112 85 118 100 118C115 118 128 112 138 98"
          stroke="#2F7A4D"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
      </g>

      {/* Floating Gentle Request / Notification Card */}
      <g transform="translate(112, 38)" filter="url(#reqDrop)">
        <rect x="0" y="0" width="36" height="26" rx="6" fill="#FFFFFF" />
        <rect x="0" y="0" width="36" height="26" rx="6" stroke="#E8873A" strokeWidth="1.5" strokeOpacity="0.3" />
        {/* Envelope fold / lines */}
        <path d="M4 6L18 16L32 6" stroke="#E8873A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Soft notification badge */}
        <circle cx="32" cy="4" r="5" fill="#E8873A" />
        <circle cx="32" cy="4" r="2.5" fill="#FFFFFF" />
      </g>

      {/* Steam / waiting breeze */}
      <path d="M92 68C88 60 94 54 90 46" stroke="#2F7A4D" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />
      <path d="M104 64C108 56 102 50 106 42" stroke="#E8873A" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />

      {/* Sparkle */}
      <path
        d="M48 70C48 73 45 76 42 76C45 76 48 79 48 82C48 79 51 76 54 76C51 76 48 73 48 70Z"
        fill="#2F7A4D"
        fillOpacity="0.6"
      />
    </svg>
  );
};

export default EmptyStateNoRequests;
