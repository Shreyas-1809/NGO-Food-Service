export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="FoodBridge logo"
    >
      <rect width="48" height="48" rx="12" fill="#0F2557" />
      <path d="M9 32 Q24 10 39 32" fill="none" stroke="#D9B65D" strokeWidth="3" strokeLinecap="round" />
      <line x1="16.5" y1="23.75" x2="16.5" y2="32" stroke="#D9B65D" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="24" y1="21" x2="24" y2="32" stroke="#D9B65D" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="31.5" y1="23.75" x2="31.5" y2="32" stroke="#D9B65D" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7" y1="32" x2="41" y2="32" stroke="#D9B65D" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 43 C18 39 18 35 21.5 35 C23 35 24 36 24 37 C24 36 25 35 26.5 35 C30 35 30 39 24 43 Z" fill="#D9B65D" />
    </svg>
  );
}
