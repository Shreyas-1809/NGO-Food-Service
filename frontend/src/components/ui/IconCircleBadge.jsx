import React from 'react';

/**
 * IconCircleBadge
 * Reusable friendly circular badge containing a clean line icon with soft background tint.
 * 
 * Props:
 * - icon: React component (e.g. from lucide-react)
 * - color: 'orange' | 'green' | 'amber' | 'blue' | 'purple' | 'rose' | 'stone'
 * - size: 'sm' (32px) | 'md' (40px) | 'lg' (48px) | 'xl' (56px)
 * - variant: 'soft' (tinted background) | 'solid' (full color + white icon)
 * - className: additional custom classes
 */
const COLOR_MAP = {
  orange: {
    soft: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400',
    solid: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
  },
  green: {
    soft: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400',
    solid: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
  },
  amber: {
    soft: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    solid: 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
  },
  blue: {
    soft: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
    solid: 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
  },
  purple: {
    soft: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
    solid: 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
  },
  rose: {
    soft: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    solid: 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
  },
  stone: {
    soft: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
    solid: 'bg-stone-700 text-white'
  }
};

const SIZE_MAP = {
  sm: {
    box: 'w-8 h-8',
    icon: 'w-4 h-4'
  },
  md: {
    box: 'w-10 h-10',
    icon: 'w-5 h-5'
  },
  lg: {
    box: 'w-12 h-12',
    icon: 'w-6 h-6'
  },
  xl: {
    box: 'w-14 h-14',
    icon: 'w-7 h-7'
  }
};

const IconCircleBadge = ({
  icon: Icon,
  color = 'orange',
  size = 'md',
  variant = 'soft',
  className = '',
  ...props
}) => {
  const colorStyles = COLOR_MAP[color]?.[variant] || COLOR_MAP.orange.soft;
  const sizeStyles = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${sizeStyles.box} ${colorStyles} ${className}`}
      {...props}
    >
      {Icon && <Icon className={sizeStyles.icon} />}
    </div>
  );
};

export default IconCircleBadge;
