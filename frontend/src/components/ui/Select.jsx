import React from 'react';

export function Select({
  label,
  error,
  options = [],
  id,
  className = '',
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-[#1F2937]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`h-10 px-3 py-2 text-sm bg-white border rounded-[6px] transition-colors
          ${error ? 'border-[#EF4444]' : 'border-[#D1D9E6] focus:border-[#3A7BD5] focus:ring-2 focus:ring-[#3A7BD5]/30'}
          focus:outline-none disabled:bg-[#EEF2F7] disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-[#EF4444] font-medium">{error}</span>}
    </div>
  );
}
