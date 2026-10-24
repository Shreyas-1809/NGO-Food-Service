import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-full transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'py-1.5 px-3 text-xs gap-1.5 uppercase tracking-wider',
    md: 'py-2.5 px-4 text-sm gap-2 uppercase tracking-wider',
    lg: 'py-3.5 px-6 text-base gap-2 uppercase tracking-wider',
  };

  const variantStyles = {
    primary: 'bg-[#173B78] hover:bg-[#15336B] dark:bg-[#3F66CC] dark:hover:bg-[#3F66CC] text-white shadow-[0_4px_14px_rgba(23,59,120,0.16)] dark:shadow-[0_0_20px_rgba(76,130,232,0.30)]',
    secondary: 'bg-[#F3F0EA] hover:bg-[#E5E1D8] dark:bg-[#15223F] dark:hover:bg-[#1A2A4D] text-[#18315E] dark:text-white border border-[#E5E1D8] dark:border-[#1E2D52]',
    danger: 'bg-[#F3F0EA] hover:bg-[#E5E1D8] dark:bg-[#15223F] dark:hover:bg-[#1A2A4D] text-[#C2410C] dark:text-[#D9B65D] border border-[#E5E1D8] dark:border-[#1E2D52]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
