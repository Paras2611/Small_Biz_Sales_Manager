import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary', // primary, secondary, danger, ghost
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-[6px] transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#2B5FAD] text-white hover:bg-[#234E8E] focus:ring-2 focus:ring-[#3A7BD5]/30',
    secondary: 'bg-white border border-[#D1D9E6] text-[#1F2937] hover:bg-[#F5F7FA] focus:ring-2 focus:ring-[#3A7BD5]/20',
    danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-2 focus:ring-[#DC2626]/30',
    ghost: 'text-[#6B7C93] hover:text-[#1F2937] hover:bg-[#EEF2F7]',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-base',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}
