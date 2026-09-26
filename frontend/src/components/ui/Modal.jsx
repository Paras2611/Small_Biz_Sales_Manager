import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-[8px] border border-[#D1D9E6] shadow-xl w-full ${maxWidth} overflow-hidden`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF2F7] bg-[#F5F7FA]">
          <h3 className="text-base font-semibold text-[#1A2E4A]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#6B7C93] hover:text-[#1F2937] hover:bg-[#EEF2F7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
