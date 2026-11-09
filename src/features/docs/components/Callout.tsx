import React from 'react';
import { Info, AlertCircle, AlertTriangle, Lightbulb } from 'lucide-react';

export type CalloutType = 'note' | 'important' | 'warning' | 'tip';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const CALLOUT_CONFIG: Record<
  CalloutType,
  {
    icon: React.ComponentType<{ className?: string }>;
    containerClass: string;
    iconClass: string;
    titleClass: string;
    defaultTitle: string;
  }
> = {
  note: {
    icon: Info,
    containerClass: 'bg-blue-50/80 border-blue-200 text-blue-950',
    iconClass: 'text-blue-700',
    titleClass: 'text-blue-900',
    defaultTitle: 'Note',
  },
  important: {
    icon: AlertCircle,
    containerClass: 'bg-indigo-50/80 border-indigo-200 text-indigo-950',
    iconClass: 'text-indigo-700',
    titleClass: 'text-indigo-900',
    defaultTitle: 'Important',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'bg-amber-50/80 border-amber-300 text-amber-950',
    iconClass: 'text-amber-700',
    titleClass: 'text-amber-900',
    defaultTitle: 'Warning',
  },
  tip: {
    icon: Lightbulb,
    containerClass: 'bg-emerald-50/80 border-emerald-300 text-emerald-950',
    iconClass: 'text-emerald-700',
    titleClass: 'text-emerald-900',
    defaultTitle: 'Pro Tip',
  },
};

export const Callout: React.FC<CalloutProps> = ({
  type = 'note',
  title,
  children,
}) => {
  const config = CALLOUT_CONFIG[type] || CALLOUT_CONFIG.note;
  const Icon = config.icon;
  const displayTitle = title ?? config.defaultTitle;

  return (
    <aside
      role="note"
      className={`my-5 rounded-xl border p-4 sm:p-5 text-xs sm:text-sm leading-relaxed transition-all shadow-xs ${config.containerClass}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 shrink-0">
          <Icon className={`w-5 h-5 ${config.iconClass}`} />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5 max-w-prose">
          {displayTitle && (
            <h3 className={`font-bold tracking-tight text-xs sm:text-sm ${config.titleClass}`}>
              {displayTitle}
            </h3>
          )}
          <div className="text-slate-800 leading-relaxed space-y-2 [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
};
