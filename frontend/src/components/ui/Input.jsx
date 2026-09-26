import React from 'react';

export function Input({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[#1F2937]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`h-10 px-3 py-2 text-sm bg-white border rounded-[6px] transition-colors
          ${error ? 'border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20' : 'border-[#D1D9E6] focus:border-[#3A7BD5] focus:ring-2 focus:ring-[#3A7BD5]/30'}
          focus:outline-none placeholder:text-[#6B7C93] disabled:bg-[#EEF2F7] disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[#EF4444] font-medium">{error}</span>}
      {!error && helperText && <span className="text-xs text-[#6B7C93]">{helperText}</span>}
    </div>
  );
}
