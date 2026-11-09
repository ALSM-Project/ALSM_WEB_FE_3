import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import type { DocSectionItem } from '../data/docsContent';

interface DocsBottomNavProps {
  previousTopic?: DocSectionItem | null;
  nextTopic?: DocSectionItem | null;
  onNavigate: (id: string) => void;
}

export const DocsBottomNav: React.FC<DocsBottomNavProps> = ({
  previousTopic,
  nextTopic,
  onNavigate,
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);

  return (
    <footer className="mt-12 pt-8 border-t border-slate-200/80 space-y-6">
      {/* Helpfulness feedback rating */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
        <div>
          <h4 className="text-xs font-semibold text-slate-800">Was this page helpful?</h4>
          <p className="text-[11px] text-slate-500">Your feedback helps improve our enterprise developer documentation.</p>
        </div>

        <div className="flex items-center gap-2">
          {feedbackGiven ? (
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              <Check className="w-3.5 h-3.5" />
              <span>Thank you for your feedback!</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setFeedbackGiven('yes')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs text-slate-700 font-medium transition-colors cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
                <span>Yes</span>
              </button>
              <button
                type="button"
                onClick={() => setFeedbackGiven('no')}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs text-slate-700 font-medium transition-colors cursor-pointer"
              >
                <ThumbsDown className="w-3.5 h-3.5 text-slate-500" />
                <span>No</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Previous / Next Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {previousTopic ? (
          <button
            type="button"
            onClick={() => onNavigate(previousTopic.id)}
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/20 transition-all text-left group cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-100/70 text-slate-600 group-hover:text-blue-600 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-500">
                Previous Topic
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                {previousTopic.label}
              </p>
            </div>
          </button>
        ) : (
          <div />
        )}

        {nextTopic ? (
          <button
            type="button"
            onClick={() => onNavigate(nextTopic.id)}
            className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/20 transition-all text-right group cursor-pointer shadow-2xs hover:shadow-xs ml-auto w-full sm:w-auto sm:min-w-[220px]"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-500">
                Next Topic
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                {nextTopic.label}
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-100/70 text-slate-600 group-hover:text-blue-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        ) : (
          <div />
        )}
      </div>
    </footer>
  );
};
