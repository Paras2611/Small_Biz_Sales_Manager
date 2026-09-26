import React from 'react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[8px] border border-[#D1D9E6]">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[#EEF2F7] flex items-center justify-center text-[#2B5FAD] mb-4">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-[#1A2E4A] mb-1">{title}</h3>
      <p className="text-sm text-[#6B7C93] max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
