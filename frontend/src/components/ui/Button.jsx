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
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'py-1.5 px-3 text-xs gap-1.5',
    md: 'py-2.5 px-4 text-sm gap-2',
    lg: 'py-3.5 px-6 text-base gap-2',
  };

  const variantStyles = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700',
    danger: 'bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400',
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
