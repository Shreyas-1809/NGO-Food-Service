import React from 'react';

/**
 * HeroIllustration: A warm, friendly flat-style SVG scene depicting 
 * community hands sharing food with soft organic color-blob backgrounds.
 * Styled with FoodBridge brand colors (Forest Green #2F7A4D and Warm Orange #E8873A).
 */
const HeroIllustration = ({ className = 'w-full max-w-md h-auto', ...props }) => {
  return (
    <svg
      viewBox="0 0 520 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="FoodBridge sharing food illustration"
      role="img"
      {...props}
    >
      <defs>
        {/* Soft Warm Gradients */}
        <linearGradient id="warmBlobGrad" x1="60" y1="40" x2="460" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#FFEDD5" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#DCFCE7" stopOpacity="0.75" />
        </linearGradient>

        <linearGradient id="greenBlobGrad" x1="120" y1="100" x2="400" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#BBF7D0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#86EFAC" stopOpacity="0.35" />
        </linearGradient>

        <linearGradient id="bowlGrad" x1="200" y1="180" x2="320" y2="300" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5EFE6" />
        </linearGradient>

        <linearGradient id="lidGrad" x1="190" y1="170" x2="330" y2="210" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8873A" />
          <stop offset="100%" stopColor="#C8661E" />
        </linearGradient>

        <linearGradient id="greenAccentGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3DA065" />
          <stop offset="100%" stopColor="#2F7A4D" />
        </linearGradient>

        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#2F7A4D" floodOpacity="0.08" />
        </filter>

        <filter id="glowBadge" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#E8873A" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* BACKGROUND ORGANIC BLOBS */}
      {/* Primary Warm Blob */}
      <path
        d="M420 220C440 290 395 380 320 405C245 430 150 410 95 345C40 280 25 180 80 115C135 50 240 30 325 65C410 100 400 150 420 220Z"
        fill="url(#warmBlobGrad)"
      />

      {/* Secondary Soft Green Accent Blob */}
      <path
        d="M450 170C475 230 435 300 380 330C325 360 250 340 215 295C180 250 190 170 235 125C280 80 360 75 410 105C460 135 425 110 450 170Z"
        fill="url(#greenBlobGrad)"
      />

      {/* Small floating circles / dots for playfulness */}
      <circle cx="85" cy="140" r="14" fill="#E8873A" fillOpacity="0.18" />
      <circle cx="430" cy="95" r="9" fill="#2F7A4D" fillOpacity="0.22" />
      <circle cx="455" cy="290" r="16" fill="#E8873A" fillOpacity="0.15" />
      <circle cx="70" cy="310" r="8" fill="#2F7A4D" fillOpacity="0.2" />

      {/* Decorative leafy sprout (Top Right) */}
      <g transform="translate(370, 90) rotate(18)">
        <path
          d="M0 25C0 11 11 0 25 0C25 14 14 25 0 25Z"
          fill="#2F7A4D"
          fillOpacity="0.85"
        />
        <path
          d="M0 25C14 25 25 36 25 50C11 50 0 39 0 25Z"
          fill="#3DA065"
          fillOpacity="0.75"
        />
      </g>

      {/* Decorative Sparkle ✦ */}
      <g transform="translate(130, 85)">
        <path
          d="M12 0C12 6.6 6.6 12 0 12C6.6 12 12 17.4 12 24C12 17.4 17.4 12 24 12C17.4 12 12 6.6 12 0Z"
          fill="#E8873A"
          fillOpacity="0.8"
        />
      </g>
      <g transform="translate(385, 345) scale(0.65)">
        <path
          d="M12 0C12 6.6 6.6 12 0 12C6.6 12 12 17.4 12 24C12 17.4 17.4 12 24 12C17.4 12 12 6.6 12 0Z"
          fill="#2F7A4D"
          fillOpacity="0.7"
        />
      </g>

      {/* MAIN SCENE: Hands Exchanging Food */}
      {/* Left Arm & Hand (Giving / Donor) */}
      <g filter="url(#softShadow)">
        {/* Sleeve - Forest Green with soft cuff */}
        <path
          d="M30 260C45 235 90 220 150 230L170 270C125 285 70 295 30 295Z"
          fill="#2F7A4D"
        />
        <path
          d="M150 230C155 229 162 232 165 238L175 258C178 264 175 271 170 273L162 276L145 233L150 230Z"
          fill="#3DA065"
        />
        {/* Hand skin */}
        <path
          d="M165 242C175 235 195 240 215 250C225 255 232 263 230 272C227 282 216 286 195 284L170 272Z"
          fill="#F5CBA7"
        />
        {/* Gentle thumb holding bowl base */}
        <path
          d="M195 248C202 245 212 246 216 251C219 256 215 262 208 264L195 264Z"
          fill="#F0B27A"
        />
      </g>

      {/* Right Arm & Hand (Receiving / NGO Partner) */}
      <g filter="url(#softShadow)">
        {/* Sleeve - Warm Orange with soft cuff */}
        <path
          d="M490 260C475 235 430 220 370 230L350 270C395 285 450 295 490 295Z"
          fill="#E8873A"
        />
        <path
          d="M370 230C365 229 358 232 355 238L345 258C342 264 345 271 350 273L358 276L375 233L370 230Z"
          fill="#F2A565"
        />
        {/* Hand skin */}
        <path
          d="M355 242C345 235 325 240 305 250C295 255 288 263 290 272C293 282 304 286 325 284L350 272Z"
          fill="#FADBD8"
        />
        {/* Gentle thumb supporting bowl */}
        <path
          d="M325 248C318 245 308 246 304 251C301 256 305 262 312 264L325 264Z"
          fill="#F5B7B1"
        />
      </g>

      {/* CENTRAL FOOD CONTAINER / BOWL */}
      <g filter="url(#softShadow)">
        {/* Bowl Body */}
        <path
          d="M185 220C185 285 215 320 260 320C305 320 335 285 335 220H185Z"
          fill="url(#bowlGrad)"
        />
        {/* Bowl Rim Highlight */}
        <ellipse cx="260" cy="220" rx="75" ry="12" fill="#FFFFFF" />
        <ellipse cx="260" cy="220" rx="72" ry="10" fill="#FBF8F3" />

        {/* Bowl Accent Stripe - Forest Green eco band */}
        <path
          d="M192 245C208 275 232 290 260 290C288 290 312 275 328 245L325 258C310 285 286 300 260 300C234 300 210 285 195 258L192 245Z"
          fill="#2F7A4D"
          fillOpacity="0.85"
        />

        {/* Small Sprout logo on Bowl */}
        <path
          d="M260 275C255 268 250 266 245 268C245 274 250 278 260 279C270 278 275 274 275 268C270 266 265 268 260 275Z"
          fill="#E8873A"
        />

        {/* Container Lid / Top Warm Fresh Food Element */}
        <path
          d="M195 214C195 190 224 175 260 175C296 175 325 190 325 214C325 218 296 224 260 224C224 224 195 218 195 214Z"
          fill="url(#lidGrad)"
        />
        {/* Lid Handle / Ribbon */}
        <rect x="245" y="165" width="30" height="12" rx="6" fill="#FFFFFF" />
      </g>

      {/* STEAM WISPS (Warm Fresh Food) */}
      <g stroke="#E8873A" strokeWidth="3.5" strokeLinecap="round" strokeOpacity="0.75">
        <path d="M242 152C236 142 245 130 240 120" />
        <path d="M260 148C265 136 256 124 262 112" />
        <path d="M278 152C284 142 275 130 281 120" />
      </g>

      {/* FLOATING HEART BADGE (Love / Care) */}
      <g transform="translate(260, 95)" filter="url(#glowBadge)">
        <circle cx="0" cy="0" r="24" fill="#2F7A4D" />
        <circle cx="0" cy="0" r="21" fill="url(#greenAccentGrad)" />
        {/* Heart icon */}
        <path
          d="M0 8C-9 -1 -12 -6 -12 -10C-12 -14 -9 -17 -5 -17C-2.2 -17 -0.5 -15.5 0 -14C0.5 -15.5 2.2 -17 5 -17C9 -17 12 -14 12 -10C12 -6 9 -1 0 8Z"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
};

export default HeroIllustration;
