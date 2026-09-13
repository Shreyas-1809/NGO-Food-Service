import React from 'react';

/**
 * EmptyStateNoShortages
 * Flat-style friendly SVG scene for "No Shortages Posted".
 * Depicts a wholesome pantry basket with fresh leafy produce and a green badge,
 * symbolizing all demands fulfilled / no shortages.
 */
const EmptyStateNoShortages = ({ className = 'w-36 h-36', ...props }) => {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="No shortages posted illustration"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id="shortBlobGrad" x1="30" y1="20" x2="170" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DCFCE7" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id="crateGrad" x1="60" y1="90" x2="140" y2="135" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5EFE6" />
        </linearGradient>
        <filter id="shortDrop" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#2F7A4D" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Background Soft Organic Blob */}
      <path
        d="M160 85C170 120 135 145 95 148C55 150 30 120 28 85C26 50 55 22 98 22C140 22 150 50 160 85Z"
        fill="url(#shortBlobGrad)"
      />

      {/* Decorative Dots */}
      <circle cx="38" cy="40" r="4" fill="#2F7A4D" fillOpacity="0.25" />
      <circle cx="168" cy="45" r="3" fill="#E8873A" fillOpacity="0.3" />
      <circle cx="165" cy="125" r="5" fill="#2F7A4D" fillOpacity="0.2" />

      {/* Shadow base */}
      <ellipse cx="100" cy="132" rx="55" ry="10" fill="#E8DFD2" fillOpacity="0.5" />

      {/* Produce sticking out of the basket */}
      {/* Carrot / Warm veggie */}
      <g transform="translate(112, 60) rotate(18)">
        <path d="M6 0C10 0 12 6 8 26C7 32 3 32 2 26C-2 6 2 0 6 0Z" fill="#E8873A" />
        {/* Carrot green leaves */}
        <path d="M6 0C3 -8 0 -6 2 -12C4 -8 7 -6 6 0Z" fill="#2F7A4D" />
        <path d="M6 0C8 -8 12 -6 10 -12C8 -8 6 -6 6 0Z" fill="#3DA065" />
      </g>

      {/* Fresh leafy greens */}
      <g transform="translate(75, 52)">
        <path d="M12 28C12 12 24 2 34 8C36 22 24 30 12 28Z" fill="#2F7A4D" />
        <path d="M12 28C8 14 -2 10 0 22C2 30 8 30 12 28Z" fill="#3DA065" />
      </g>

      {/* Apple / Round Fruit */}
      <circle cx="98" cy="80" r="14" fill="#E8873A" fillOpacity="0.9" />
      <path d="M98 67C99 63 103 62 104 60" stroke="#2F7A4D" strokeWidth="2" strokeLinecap="round" />

      {/* Pantry Crate / Basket */}
      <g filter="url(#shortDrop)">
        <rect x="58" y="82" width="84" height="48" rx="10" fill="url(#crateGrad)" />
        <rect x="58" y="82" width="84" height="48" rx="10" stroke="#E8DFD2" strokeWidth="1.5" />

        {/* Basket slat lines */}
        <line x1="68" y1="96" x2="132" y2="96" stroke="#2F7A4D" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />
        <line x1="68" y1="112" x2="132" y2="112" stroke="#2F7A4D" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.3" />

        {/* Handle cutouts */}
        <rect x="88" y="88" width="24" height="7" rx="3.5" fill="#E8DFD2" fillOpacity="0.7" />
      </g>

      {/* Green Check Badge (All good / stocked) */}
      <g transform="translate(132, 106)" filter="url(#shortDrop)">
        <circle cx="10" cy="10" r="14" fill="#2F7A4D" />
        <path d="M6 10L9 13L14 7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Sparkle */}
      <path
        d="M45 78C45 81 42 84 39 84C42 84 45 87 45 90C45 87 48 84 51 84C48 84 45 81 45 78Z"
        fill="#E8873A"
        fillOpacity="0.6"
      />
    </svg>
  );
};

export default EmptyStateNoShortages;
