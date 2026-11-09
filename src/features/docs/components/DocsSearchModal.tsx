import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { DOCS_CATEGORIES, type DocSectionItem } from '../data/docsContent';

interface DocsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (id: string) => void;
}

interface SearchResult {
  categoryTitle: string;
  item: DocSectionItem;
}

export const DocsSearchModal: React.FC<DocsSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten all items with category context
  const allTopics: SearchResult[] = DOCS_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({
      categoryTitle: cat.title,
      item,
    }))
  );

  const results = query.trim()
    ? allTopics.filter(
        ({ categoryTitle, item }) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.summary.toLowerCase().includes(query.toLowerCase()) ||
          categoryTitle.toLowerCase().includes(query.toLowerCase())
      )
    : allTopics.slice(0, 8); // show initial popular topics when query empty

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        onSelectTopic(results[selectedIndex].item.id);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, onSelectTopic]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-100 p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search all documentation topics, APIs, guides..."
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 text-slate-500 rounded border border-slate-200">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-50">
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No documentation topics found for &ldquo;<span className="font-semibold text-slate-700">{query}</span>&rdquo;.
            </div>
          ) : (
            results.map((result, index) => {
              const isSelected = index === selectedIndex;
              const Icon = result.item.icon;

              return (
                <div
                  key={`${result.categoryTitle}-${result.item.id}`}
                  onClick={() => {
                    onSelectTopic(result.item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-start justify-between gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {result.item.label}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          {result.categoryTitle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate leading-normal">
                        {result.item.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0 self-center">
                    {isSelected ? (
                      <CornerDownLeft className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.2 font-mono bg-white border border-slate-200 rounded">↑</kbd>{' '}
              <kbd className="px-1 py-0.2 font-mono bg-white border border-slate-200 rounded">↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.2 font-mono bg-white border border-slate-200 rounded">↵</kbd> Select
            </span>
          </div>
          <span>ALSM Documentation Search</span>
        </div>
      </div>
    </div>
  );
};
