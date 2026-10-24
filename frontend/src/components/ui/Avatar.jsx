import React from 'react';

const COLORS = [
  'bg-gradient-to-tr from-emerald-500 to-teal-400',
  'bg-gradient-to-tr from-indigo-500 to-purple-500',
  'bg-gradient-to-tr from-rose-500 to-pink-400',
  'bg-gradient-to-tr from-amber-500 to-orange-400',
  'bg-gradient-to-tr from-sky-500 to-cyan-400',
  'bg-gradient-to-tr from-violet-500 to-fuchsia-400',
  'bg-gradient-to-tr from-lime-500 to-green-400',
  'bg-gradient-to-tr from-blue-500 to-indigo-400'
];

const Avatar = ({ name, src, className = 'w-12 h-12 rounded-xl text-sm' }) => {
  if (src && !src.includes('images.unsplash.com')) {
    return (
      <img
        src={src}
        alt={name}
        className={`object-cover border border-[#E5E1D8] shrink-0 ${className}`}
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


