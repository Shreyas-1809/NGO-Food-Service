import React from 'react';

const COLORS = [
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-blue-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-purple-500'
];

const Avatar = ({ name, src, className = 'w-12 h-12 rounded-xl text-sm' }) => {
  if (src && !src.includes('images.unsplash.com')) {
    return (
      <img
        src={src}
        alt={name}
        className={`object-cover border border-slate-100 dark:border-slate-700 shrink-0 ${className}`}
      />
    );
  }

  // Generate deterministic color based on name string
  const hash = (name || '').split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const colorClass = COLORS[Math.abs(hash) % COLORS.length];

  // Get initials (up to 2)
  const initials = (name || '')
    .split(' ')
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');

  return (
    <div
      className={`flex items-center justify-center font-bold text-white shrink-0 ${colorClass} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default Avatar;
