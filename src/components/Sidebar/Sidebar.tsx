import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useNavigation } from '@/hooks/useNavigation';
import { SidebarItem } from './SidebarItem';
import { ChevronLeft, ChevronRight, LogOut, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import type { MenuItem } from '@/features/menus/types/menu';
import { ROUTES } from '@/shared/constants/routes';

import logo2 from '@/assets/logo2.png';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onLogout?: () => void;
}

interface NavSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggle,
  onLogout,
}) => {
  const { sidebarNav, loading } = useNavigation();
  const { isSuspended, isExpired } = useWorkspace();

  const isPermitted = (item: MenuItem): boolean => {
    if (item.isVisible === false) return false;
    return true;
  };

  // Dynamically group items into canonical sections without hardcoded items or duplicates
  const sections = useMemo(() => {
    const result: NavSection[] = [];
    const seenPaths = new Set<string>();

    const normalizeSectionTitle = (raw: string): string => {
      const upper = raw.trim().toUpperCase();
      if (
        upper === 'SERVICE' ||
        upper === 'CONTRACT & BILLING' ||
        upper === 'SERVICE & CONTRACT' ||
        upper === 'BILLING'
      ) {
        return 'CONTRACT & BILLING';
      }
      return upper;
    };

    for (const item of sidebarNav) {
      if (!isPermitted(item)) continue;

      // Top level standalone root item (e.g. Dashboard)
      const isRootStandalone =
        (!item.parentId || item.parentId === '') &&
        item.path &&
        item.path !== '#' &&
        (!item.children || item.children.length === 0) &&
        (item.id.includes('dashboard') || !item.category || item.category === '' || item.category === 'MAIN');

      if (isRootStandalone && item.path) {
        let existing = result.find((s) => s.title === '');
        if (!existing) {
          existing = { title: '', items: [] };
          result.push(existing);
        }
        const itemPath = item.path.toLowerCase();
        if (!seenPaths.has(itemPath)) {
          seenPaths.add(itemPath);
          existing.items.push(item);
        }
        continue;
      }

      // Group or items: unpack children directly under section header
      const isContractBillingGroup =
        item.category === 'CONTRACT & BILLING' ||
        item.category === 'SERVICE' ||
        item.category === 'SERVICE & CONTRACT' ||
        item.id === 'web3_group_contract_billing' ||
        item.label.toLowerCase() === 'contract & billing' ||
        item.label.toLowerCase() === 'service & contract';

      if (isContractBillingGroup && item.children && item.children.length > 0) {
        let existing = result.find((s) => s.title === 'CONTRACT & BILLING');
        if (!existing) {
          existing = { title: 'CONTRACT & BILLING', items: [] };
          result.push(existing);
        }
        for (const child of item.children) {
          if (!isPermitted(child)) continue;
          const childPath = child.path?.toLowerCase();
          if (childPath && childPath !== '#' && seenPaths.has(childPath)) {
            continue;
          }
          if (childPath && childPath !== '#') {
            seenPaths.add(childPath);
          }
          if (!existing.items.some((i) => i.id === child.id || (i.path && child.path && i.path === child.path))) {
            existing.items.push(child);
          }
        }
      } else if ((!item.path || item.path === '#') && item.children && item.children.length > 0) {
        const sectionTitle = normalizeSectionTitle(item.label);
        let existing = result.find((s) => s.title === sectionTitle);
        if (!existing) {
          existing = { title: sectionTitle, items: [] };
          result.push(existing);
        }

        for (const child of item.children) {
          if (!isPermitted(child)) continue;
          const childPath = child.path?.toLowerCase();
          if (childPath && childPath !== '#' && seenPaths.has(childPath)) {
            continue;
          }
          if (childPath && childPath !== '#') {
            seenPaths.add(childPath);
          }
          if (!existing.items.some((i) => i.id === child.id || (i.path && child.path && i.path === child.path))) {
            existing.items.push(child);
          }
        }
      } else {
        // Individual items at top-level
        const sectionTitle = normalizeSectionTitle(item.category || '');
        const itemPath = item.path?.toLowerCase();
        if (itemPath && itemPath !== '#' && seenPaths.has(itemPath)) {
          continue;
        }
        if (itemPath && itemPath !== '#') {
          seenPaths.add(itemPath);
        }

        let existing = result.find((s) => s.title === sectionTitle);
        if (!existing) {
          existing = { title: sectionTitle, items: [] };
          result.push(existing);
        }
        if (!existing.items.some((i) => i.id === item.id || (i.path && item.path && i.path === item.path))) {
          existing.items.push(item);
        }
      }
    }

    // Canonical ordering of sections
    const canonicalOrder = [
      '',
      'ORGANIZATION',
      'CONTRACT & BILLING',
      'PROJECT MANAGEMENT',
      'COMMUNICATION',
      'DELIVERABLES',
      'COLLABORATION',
      'ACCOUNT',
      'RESOURCES',
    ];

    const ordered: NavSection[] = [];
    for (const title of canonicalOrder) {
      const match = result.find((s) => s.title === title);
      if (match && match.items.length > 0) {
        ordered.push(match);
      }
    }

    // Add any remaining custom sections not in canonicalOrder
    for (const section of result) {
      if (!canonicalOrder.includes(section.title) && section.items.length > 0) {
        ordered.push(section);
      }
    }

    return ordered;
  }, [sidebarNav]);

  const renderSection = (title: string, items: MenuItem[]) => {
    if (items.length === 0) return null;
    const showHeader = !isCollapsed && title.trim() !== '' && title !== 'TOP';
    return (
      <div key={title || 'top'} className="mb-5 last:mb-0">
        {showHeader && (
          <div className="px-2.5 text-xs font-bold uppercase tracking-wider text-[#475569] mb-2 select-none">
            {title}
          </div>
        )}
        <div className="space-y-1">
          {items.map((item) => (
            <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`bg-white text-[#0F172A] flex flex-col h-screen sticky top-0 border-r border-[#E2E8F0] z-30 shrink-0 font-heading transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Sidebar Top Header Logo */}
      <div
        className={`border-b border-[#E2E8F0] flex items-center box-border h-[var(--app-header-height,64px)] min-h-[var(--app-header-height,64px)] ${
          isCollapsed ? 'justify-center px-0' : 'justify-between px-5'
        }`}
        style={{
          height: 'var(--app-header-height, 64px)',
          minHeight: 'var(--app-header-height, 64px)',
          boxSizing: 'border-box',
        }}
      >
        {!isCollapsed && (
          <Link to={ROUTES.DASHBOARD} className="flex items-center flex-1 overflow-visible cursor-pointer" title="Go to Dashboard">
            <img
              src={logo2}
              alt="ALSM"
              className="w-[82px] h-auto object-contain scale-[1.6] origin-left hover:opacity-90 transition-opacity"
            />
          </Link>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg
               text-[#64748B]
               hover:text-[#2563EB]
               hover:bg-[#EFF6FF]
               transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Contract Suspended / Expired Notice Banner */}
      {!isCollapsed && (isSuspended || isExpired) && (
        <div
          className={`mx-3 mt-3 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            isSuspended
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="truncate">
            {isSuspended ? 'Contract Suspended (Read-Only)' : 'Contract Expired (Read-Only)'}
          </span>
        </div>
      )}

      {/* Navigation Content Area */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm font-heading">
        {loading ? (
          <div className="p-4 text-xs text-[#64748B] text-center">Loading Menu...</div>
        ) : (
          sections.map((section) => renderSection(section.title, section.items))
        )}
      </nav>

      {/* Bottom Sidebar Footer: Sign Out */}
      <footer className="p-3 border-t border-[#E2E8F0] shrink-0">
        <button
          type="button"
          onClick={onLogout}
          className={`w-full h-9 flex items-center rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : 'px-2.5 space-x-2.5'
          }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </footer>
    </aside>
  );
};

export default Sidebar;
