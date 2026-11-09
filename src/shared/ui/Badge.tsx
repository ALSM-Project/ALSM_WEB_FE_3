import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'processing' | 'warning' | 'danger' | 'neutral' | 'info' | 'ai' | 'purple';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    processing: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0]',
    info: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
    ai: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide',
          variants[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let variant: BadgeProps['variant'] = 'neutral';
  const lower = status.toLowerCase();
  if (['completed', 'passed', 'active', 'ready', 'success', 'converted', 'approved'].some((s) => lower.includes(s))) {
    variant = 'success';
  } else if (['processing', 'uploading', 'converting', 'analyzing', 'validating', 'queued'].some((s) => lower.includes(s))) {
    variant = 'processing';
  } else if (['review', 'required', 'warning', 'pending', 'revision'].some((s) => lower.includes(s))) {
    variant = 'warning';
  } else if (['failed', 'error', 'danger', 'fatal', 'rejected'].some((s) => lower.includes(s))) {
    variant = 'danger';
  } else if (['managed'].some((s) => lower.includes(s))) {
    variant = 'purple';
  } else if (['draft'].some((s) => lower.includes(s))) {
    variant = 'neutral';
  }

  return <Badge variant={variant}>{status}</Badge>;
};

export default Badge;
