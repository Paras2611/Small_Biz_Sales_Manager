import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-[8px] border border-[#D1D9E6] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.05)] p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between pb-3 mb-4 border-b border-[#EEF2F7] ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-[#1A2E4A]">{title}</h3>
        {subtitle && <p className="text-xs text-[#6B7C93] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
