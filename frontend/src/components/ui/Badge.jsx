import React from 'react';

const statusMap = {
  // Leads
  'New': 'bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]',
  'Contacted': 'bg-[#EEF2F7] text-[#2B5FAD] border border-[#CBD5E1]',
  'Qualified': 'bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]',
  'Disqualified': 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]',
  // Opportunities
  'Open': 'bg-[#EFF6FF] text-[#2B5FAD] border border-[#BFDBFE]',
  'Closed Won': 'bg-[#D1FAE5] text-[#059669] border border-[#6EE7B7]',
  'Closed Lost': 'bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]',
  // Quotations
  'Draft': 'bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]',
  'Pending Approval': 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
  'Approved': 'bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]',
  'Rejected': 'bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]',
  'Expired': 'bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E7EB]',
  // Follow-ups
  'Scheduled': 'bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]',
  'Completed': 'bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]',
  'Rescheduled': 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
  'Cancelled': 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]',
  'Overdue': 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] font-semibold',
  // Priorities
  'High': 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]',
  'Medium': 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
  'Low': 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]',
};

export function Badge({ status, label, className = '' }) {
  const text = label || status;
  const style = statusMap[status] || 'bg-[#F3F4F6] text-[#1F2937] border border-[#E5E7EB]';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-medium tracking-wide ${style} ${className}`}>
      {text}
    </span>
  );
}
