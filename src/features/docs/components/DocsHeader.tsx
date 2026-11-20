import React, { useState } from 'react';
import {
  BookOpen,
  Share2,
  Printer,
  Check,
  Search,
  Sparkles,
} from 'lucide-react';

interface DocsHeaderProps {
  categoryTitle?: string;
  topicTitle?: string;
  onOpenSearch?: () => void;
}

export const DocsHeader: React.FC<DocsHeaderProps> = ({
  categoryTitle = 'PLATFORM OVERVIEW',
  topicTitle = 'Documentation & Developer Guide',
  onOpenSearch,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
      {/* Top Bar: Breadcrumbs & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-slate-700 hover:text-slate-950 font-semibold cursor-pointer">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Docs</span>
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-700 font-semibold">{categoryTitle}</span>
          <span className="text-slate-400">/</span>
          <span className="text-blue-700 font-bold">{topicTitle}</span>
        </nav>

        <div className="flex items-center gap-2.5">
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Search documentation (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Search docs</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-slate-700 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Copy direct link to this page"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-emerald-800 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Share</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Print documentation"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main Header Content: Strict Semantic H1 & Controlled Line Length */}
      <div className="pt-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            ALSM Enterprise Docs
          </span>
          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
            v2.4.0 Production
          </span>
          <span className="text-xs font-semibold text-slate-600">
            • Last updated Nov 2026
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Technical Documentation & Developer Guide
        </h1>

        <p className="max-w-[620px] text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
          Comprehensive enterprise technical reference for analyzing, transforming, validating, and exporting IBM CICS BMS screen maps, AS/400 DSPF display files, and COBOL applications into production-ready React 19 UI interfaces and Java 17 Spring Boot microservices.
        </p>
      </div>
    </header>
  );
};
