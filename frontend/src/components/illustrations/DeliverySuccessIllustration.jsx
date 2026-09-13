import React from 'react';

/**
 * DeliverySuccessIllustration
 * Celebratory flat-style SVG illustration for "Food Delivered & Verified" state.
 * Features: A happy delivery box with fresh food elements, a prominent glowing
 * checkmark seal, floating celebratory confetti/sparkles, and warm organic blobs.
 */
const DeliverySuccessIllustration = ({ className = 'w-full h-auto max-w-[240px]', size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-[140px]',
    md: 'max-w-[220px]',
    lg: 'max-w-[320px]',
  };

  return (
    <div className={`flex items-center justify-center select-none ${sizeClasses[size] || ''} ${className}`}>
      <svg
        viewBox="0 0 320 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-xs"
      >
        <defs>
          {/* Warm background gradient */}
          <radialGradient id="successGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#86efac" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#fef3c7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
          </radialGradient>

          {/* Delivery Box Gradient */}
          <linearGradient id="boxGrad" x1="160" y1="110" x2="160" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Lid Gradient */}
          <linearGradient id="lidGrad" x1="160" y1="95" x2="160" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Checkmark Badge Gradient */}
          <linearGradient id="badgeGrad" x1="210" y1="140" x2="250" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Ribbon Gradient */}
          <linearGradient id="ribbonGrad" x1="160" y1="90" x2="160" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* 1. Soft Warm & Mint Ambient Blobs */}
        <circle cx="160" cy="140" r="110" fill="url(#successGlow)" />
        <ellipse cx="160" cy="225" rx="90" ry="14" fill="#E2E8F0" fillOpacity="0.6" className="dark:fill-stone-800" />

        {/* 2. Floating Confetti & Joyful Sparkles */}
        {/* Confetti Ribbon 1 */}
        <path d="M70 70 Q 85 60 80 80 T 95 90" stroke="#E8873A" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.85" />
        {/* Confetti Ribbon 2 */}
        <path d="M245 65 Q 235 80 250 85 T 240 105" stroke="#10B981" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85" />
        
        {/* Star Sparkle Left */}
        <path d="M95 125 L98 133 L106 136 L98 139 L95 147 L92 139 L84 136 L92 133 Z" fill="#F59E0B" opacity="0.9" />
        {/* Star Sparkle Top Right */}
        <path d="M225 50 L227.5 56 L234 58 L227.5 60 L225 66 L222.5 60 L216 58 L222.5 56 Z" fill="#10B981" opacity="0.9" />
        {/* Star Sparkle Top Center */}
        <path d="M155 30 L157 35 L163 36.5 L157 38 L155 43 L153 38 L147 36.5 L153 35 Z" fill="#E8873A" opacity="0.8" />
        
        {/* Confetti Dots */}
        <circle cx="65" cy="110" r="4.5" fill="#3B82F6" opacity="0.75" />
        <circle cx="260" cy="120" r="5" fill="#EC4899" opacity="0.75" />
        <circle cx="115" cy="55" r="3.5" fill="#10B981" opacity="0.8" />
        <circle cx="205" cy="40" r="4" fill="#F59E0B" opacity="0.8" />
        <circle cx="270" cy="165" r="3.5" fill="#E8873A" opacity="0.75" />

        {/* 3. Fresh Food Items Peeking from Box */}
        {/* Fresh Green Apples / Produce */}
        <circle cx="132" cy="105" r="17" fill="#10B981" />
        <path d="M132 88 C 132 84 136 82 138 80" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="140" cy="82" rx="4" ry="2" fill="#34D399" transform="rotate(-20 140 82)" />

        {/* Golden Bread / Baguette peeking out */}
        <ellipse cx="185" cy="98" rx="14" ry="24" fill="#FBBF24" transform="rotate(25 185 98)" />
        <path d="M178 90 L188 95 M180 102 L190 107" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />

        {/* Fresh Tomato / Orange */}
        <circle cx="158" cy="104" r="15" fill="#EF4444" />
        <path d="M158 89 C 158 86 160 84 162 83" stroke="#047857" strokeWidth="2" strokeLinecap="round" />

        {/* 4. Warm Donation Package / Parcel */}
        {/* Main Box Body */}
        <rect x="100" y="115" width="120" height="95" rx="14" fill="url(#boxGrad)" stroke="#B45309" strokeWidth="2" />
        
        {/* Box Lid / Rim */}
        <rect x="94" y="105" width="132" height="22" rx="6" fill="url(#lidGrad)" stroke="#B45309" strokeWidth="2" />
        
        {/* Green Eco Ribbon */}
        <rect x="150" y="105" width="20" height="105" fill="url(#ribbonGrad)" opacity="0.9" />
        
        {/* Box Heart Emblem */}
        <path
          d="M160 162 C 160 162 148 152 148 144 C 148 139 152 136 156 137 C 158 138 160 140 160 140 C 160 140 162 138 164 137 C 168 136 172 139 172 144 C 172 152 160 162 160 162 Z"
          fill="#FFFFFF"
          opacity="0.9"
        />

        {/* 5. Big Verified Checkmark Badge */}
        <g filter="drop-shadow(0 4px 8px rgba(16, 185, 129, 0.35))">
          {/* Outer Badge Ring */}
          <circle cx="218" cy="165" r="28" fill="#FFFFFF" />
          <circle cx="218" cy="165" r="24" fill="url(#badgeGrad)" />
          {/* White Checkmark */}
          <path
            d="M208 165 L215 172 L228 157"
            stroke="#FFFFFF"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* 6. Success Banner / Pill Label */}
        <g transform="translate(85, 208)">
          <rect width="150" height="26" rx="13" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.5" />
          <text
            x="75"
            y="17"
            textAnchor="middle"
            fill="#065F46"
            fontSize="11"
            fontWeight="bold"
            letterSpacing="0.3"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          >
            DELIVERED & VERIFIED ✓
          </text>
        </g>
      </svg>
    </div>
  );
};

export default DeliverySuccessIllustration;
