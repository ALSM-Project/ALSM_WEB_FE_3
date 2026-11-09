import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
  iconColor?: string;
  iconBg?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  onClick,
  className = '',
  iconColor = 'text-[#2563EB]',
  iconBg = 'bg-[#EFF6FF] border-[#BFDBFE]',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#CBD5E1] transition-all flex items-center justify-between gap-4 ${
        onClick ? 'cursor-pointer hover:shadow-xs group' : ''
      } ${className}`}
    >
      <div className="space-y-1 min-w-0 flex-1">
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-2xl lg:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          {value}
        </p>
        {(subtext || trend) && (
          <div className="flex items-center gap-1.5 pt-0.5 text-xs text-[#64748B] truncate">
            {trend && (
              <span
                className={`font-semibold ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtext && <span>{subtext}</span>}
          </div>
        )}
      </div>

      {Icon && (
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${iconBg} ${iconColor} transition-transform ${
            onClick ? 'group-hover:scale-105' : ''
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
