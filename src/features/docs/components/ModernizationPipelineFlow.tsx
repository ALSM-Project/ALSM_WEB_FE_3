import React from 'react';
import { PIPELINE_STAGES, type PipelineStage } from '../data/docsContent';
import { ArrowRight, Workflow } from 'lucide-react';

interface ModernizationPipelineFlowProps {
  onSelectStage?: (targetId: string) => void;
}

export const ModernizationPipelineFlow: React.FC<ModernizationPipelineFlowProps> = ({
  onSelectStage,
}) => {
  return (
    <section aria-labelledby="pipeline-flow-heading" className="my-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <h2 id="pipeline-flow-heading" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              ALSM End-to-End Modernization Lifecycle
            </h2>
            <p className="text-xs text-slate-600 font-normal">
              Deterministic 6-stage AST transformation and automated code generation pipeline
            </p>
          </div>
        </div>
        <span className="inline-flex items-center text-xs font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-md border border-slate-300 shrink-0">
          Deterministic Pipeline
        </span>
      </div>

      {/* 6-stage Grid (Single-level cards, not nested) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 pt-1">
        {PIPELINE_STAGES.map((stage: PipelineStage, index: number) => {
          const isLast = index === PIPELINE_STAGES.length - 1;

          return (
            <div
              key={stage.step}
              onClick={() => onSelectStage?.(stage.targetId)}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs p-4 transition-all duration-150 cursor-pointer text-left shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="inline-flex items-center justify-center h-6 px-2 text-xs font-mono font-bold rounded bg-blue-100 text-blue-800 border border-blue-200">
                    {stage.step}
                  </span>
                  {!isLast && (
                    <ArrowRight className="hidden lg:block w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  )}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {stage.name}
                </h3>
                <p className="text-xs font-medium text-slate-600 mt-1">
                  {stage.shortDesc}
                </p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {stage.details}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-slate-700 truncate max-w-[120px]" title={stage.tech}>
                  {stage.tech}
                </span>
                <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  View →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
