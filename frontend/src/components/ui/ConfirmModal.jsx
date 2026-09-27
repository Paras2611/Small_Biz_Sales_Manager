import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, HelpCircle, LogOut, Send, Plus, X, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this operation?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary' | 'danger' | 'warning' | 'success' | 'info'
  operation = null, // e.g. 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGOUT' | 'CONVERT' | 'APPROVE'
  isLoading = false,
  details = null,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: Trash2,
          iconBg: 'bg-[#FEF2F2]',
          iconColor: 'text-[#DC2626]',
          badgeBg: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
          buttonVariant: 'danger',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-[#FFFBEB]',
          iconColor: 'text-[#D97706]',
          badgeBg: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
          buttonVariant: 'warning',
        };
      case 'success':
        return {
          icon: CheckCircle2,
          iconBg: 'bg-[#ECFDF5]',
          iconColor: 'text-[#10B981]',
          badgeBg: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
          buttonVariant: 'primary',
        };
      case 'logout':
        return {
          icon: LogOut,
          iconBg: 'bg-[#FEF2F2]',
          iconColor: 'text-[#DC2626]',
          badgeBg: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
          buttonVariant: 'danger',
        };
      default:
        return {
          icon: operation === 'CREATE' ? Plus : operation === 'SUBMIT' ? Send : HelpCircle,
          iconBg: 'bg-[#EFF6FF]',
          iconColor: 'text-[#2B5FAD]',
          badgeBg: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]',
          buttonVariant: 'primary',
        };
    }
  };

  const style = getVariantStyles();
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => !isLoading && onClose()}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-[12px] border border-[#D1D9E6] shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center flex-shrink-0 shadow-inner`}>
              <Icon className={`w-6 h-6 ${style.iconColor}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-[#1A2E4A] leading-snug">{title}</h3>
                {operation && (
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${style.badgeBg}`}>
                    {operation}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7C93] mt-1.5 leading-relaxed">{message}</p>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-[#94A3B8] hover:text-[#1F2937] p-1 rounded-[6px] hover:bg-[#EEF2F7] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Optional Details Content Box */}
          {details && (
            <div className="mt-4 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] text-xs text-[#334155] space-y-1">
              {typeof details === 'string' ? details : details}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-[#F5F7FA] border-t border-[#EEF2F7] flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="text-xs"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={style.buttonVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            className="text-xs font-semibold px-4"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
