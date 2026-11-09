import React from 'react';
import { Check } from 'lucide-react';
import { MANAGED_WORKFLOW_STAGES } from '../types/managed.types';
import type { ManagedStageKey } from '../types/managed.types';

interface StageWorkflowTrackerProps {
  currentStage: number; // 1 to 9
  currentStageKey?: ManagedStageKey;
  progressPct?: number;
}

export const StageWorkflowTracker: React.FC<StageWorkflowTrackerProps> = ({
  currentStage,
  progressPct,
}) => {
  const safeStage = Math.min(9, Math.max(1, currentStage || 1));
  const activeStageInfo =
    MANAGED_WORKFLOW_STAGES.find((s) => s.step === safeStage) ||
    MANAGED_WORKFLOW_STAGES[0];

  const calculatedPct =
    typeof progressPct === 'number' && progressPct > 0
      ? progressPct
      : Math.round((safeStage / 9) * 100);

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-6">
      {/* ── Top Header & Progress Overview ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              Stage {safeStage} of 9
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              Managed Modernization Turnkey Pipeline
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] mt-1.5 flex items-center gap-2">
            <span>{activeStageInfo.label}</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {activeStageInfo.description}
          </p>
        </div>

        <div className="sm:text-right shrink-0">
          <div className="text-2xl font-black text-[#2563EB] font-mono">
            {calculatedPct}%
          </div>
          <span className="text-[11px] font-semibold text-[#64748B]">
            Cumulative Modernization Completion
          </span>
        </div>
      </div>

      {/* ── Continuous Progress Bar ─────────────────────────────────────────── */}
      <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden border border-[#E2E8F0]">
        <div
          className="h-full bg-[#2563EB] transition-all duration-500 rounded-full"
          style={{ width: `${Math.min(100, Math.max(8, calculatedPct))}%` }}
        />
      </div>

      {/* ── 9-Stage Visual Steps Horizontal Grid ────────────────────────────── */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-cols-9 min-w-[780px] gap-2 pt-2">
          {MANAGED_WORKFLOW_STAGES.map((stage) => {
            const isCompleted = stage.step < safeStage;
            const isCurrent = stage.step === safeStage;

            return (
              <div
                key={stage.step}
                className="flex flex-col items-center text-center relative group"
              >
                {/* Connector line */}
                {stage.step < 9 && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-[#E2E8F0]'
                    }`}
                  />
                )}

                {/* Stage Badge Node */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : isCurrent
                      ? 'bg-[#2563EB] text-white ring-4 ring-[#2563EB]/20 shadow-xs'
                      : 'bg-white border-2 border-[#CBD5E1] text-[#94A3B8]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isCurrent ? (
                    <span className="animate-pulse">{stage.step}</span>
                  ) : (
                    <span>{stage.step}</span>
                  )}
                </div>

                {/* Stage Label */}
                <span
                  className={`mt-2 text-[11px] font-semibold leading-tight line-clamp-2 max-w-[90px] transition-colors ${
                    isCurrent
                      ? 'text-[#2563EB] font-bold'
                      : isCompleted
                      ? 'text-[#0F172A]'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  {stage.label}
                </span>

                {/* Step Percentage Indicator */}
                <span className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                  {stage.percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
