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
    soft: 'bg-[#F3F0EA] text-[#E5B85C]',
    solid: 'bg-[#173B78] text-white shadow-md'
  },
  green: {
    soft: 'bg-[#F3F0EA] text-[#18315E]',
    solid: 'bg-[#173B78] text-white shadow-md'
  },
  amber: {
    soft: 'bg-[#F3F0EA] text-[#E5B85C]',
    solid: 'bg-[#E5B85C] text-white shadow-md'
  },
  blue: {
    soft: 'bg-[#F3F0EA] text-[#18315E]',
    solid: 'bg-[#173B78] text-white shadow-md'
  },
  purple: {
    soft: 'bg-[#F3F0EA] text-[#18315E]',
    solid: 'bg-[#173B78] text-white shadow-md'
  },
  rose: {
    soft: 'bg-[#F3F0EA] text-[#18315E]',
    solid: 'bg-[#173B78] text-white shadow-md'
  },
  stone: {
    soft: 'bg-[#F3F0EA] text-[#60708B]',
    solid: 'bg-[#173B78] text-white'
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


