import React from 'react';
import { AlignLeft, ArrowUp } from 'lucide-react';
import type { TocItem } from '../data/docsContent';

interface DocsTableOfContentsProps {
  items: TocItem[];
  activeHeadingId: string;
  onSelectHeading: (id: string) => void;
  className?: string;
}

export const DocsTableOfContents: React.FC<DocsTableOfContentsProps> = ({
  items,
  activeHeadingId,
  onSelectHeading,
  className = '',
}) => {
  if (!items || items.length === 0) return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside
      aria-label="Table of Contents"
      className={`hidden xl:block w-[220px] shrink-0 sticky top-20 self-start max-h-[calc(100vh-100px)] overflow-y-auto pl-4 border-l border-slate-200/80 ${className}`}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
        <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
        <span>On This Page</span>
      </div>

      <nav aria-label="On this page navigation">
        <ul className="space-y-1 text-xs">
          {items.map((item) => {
            const isActive = activeHeadingId === item.id;
            const isH3 = item.level === 3;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectHeading(item.id)}
                  className={`block w-full text-left py-1 text-xs transition-colors cursor-pointer leading-tight ${
                    isH3 ? 'pl-3' : 'pl-0'
                  } ${
                    isActive
                      ? 'text-blue-600 font-semibold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className="line-clamp-2">{item.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>Back to top</span>
        </button>
      </div>
    </aside>
  );
};
