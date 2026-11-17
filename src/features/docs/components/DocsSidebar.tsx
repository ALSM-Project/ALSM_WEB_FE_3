import React, { useState } from 'react';
import {
  DOCS_CATEGORIES,
  type DocCategory,
  type DocSectionItem,
} from '../data/docsContent';
import { Search, ChevronDown, ChevronRight, X } from 'lucide-react';

interface DocsSidebarProps {
  activeId: string;
  onSelectSection: (id: string) => void;
  className?: string;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  activeId,
  onSelectSection,
  className = '',
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const hasFilter = filterQuery.trim().length > 0;
  const normalizedQuery = filterQuery.toLowerCase();

  return (
    <aside
      aria-label="Documentation Navigation"
      className={`w-full lg:w-[270px] shrink-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs self-start sticky top-20 max-h-[calc(100vh-100px)] flex flex-col ${className}`}
    >
      {/* Search Filter Header */}
      <div className="relative mb-3 shrink-0">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter documentation..."
          className="w-full h-8 pl-9 pr-8 py-0 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />
        {hasFilter && (
          <button
            type="button"
            onClick={() => setFilterQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-0.5 rounded cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5 shrink-0" />
          </button>
        )}
      </div>

      {/* Navigation Groups List (Scrollable) */}
      <div className="overflow-y-auto space-y-4 pr-1 -mr-1 text-xs">
        {DOCS_CATEGORIES.map((category: DocCategory) => {
          const filteredItems = category.items.filter((item: DocSectionItem) =>
            !hasFilter ||
            item.label.toLowerCase().includes(normalizedQuery) ||
            item.summary.toLowerCase().includes(normalizedQuery)
          );

          if (filteredItems.length === 0) return null;

          const isCollapsed = !hasFilter && collapsedCategories[category.id];

          return (
            <div key={category.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider hover:text-slate-950 transition-colors text-left"
              >
                <span>{category.title}</span>
                <span className="text-slate-500">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {!isCollapsed && (
                <ul className="space-y-0.5 mt-1">
                  {filteredItems.map((item: DocSectionItem) => {
                    const Icon = item.icon;
                    const isActive = activeId === item.id;

                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => onSelectSection(item.id)}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer group ${
                            isActive
                              ? 'bg-blue-50 text-blue-900 font-bold border-l-2 border-blue-600'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive
                                  ? 'text-blue-600'
                                  : 'text-slate-500 group-hover:text-slate-800'
                              }`}
                            />
                            <span className="truncate text-xs">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 border ${
                                isActive
                                  ? 'bg-blue-200 text-blue-950 border-blue-300'
                                  : 'bg-slate-200 text-slate-900 border-slate-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
