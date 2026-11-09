import { describe, it, expect } from 'vitest';
import {
  mergeDynamicAndStaticNavigation,
  STATIC_RESOURCE_DOCS,
  STATIC_SERVICE_ITEMS,
} from '@/context/NavigationContext';
import type { MenuItem } from '@/features/menus/types/menu';

describe('Additive Menu Integration — Static Documents & Navigation Preservation (WEB_3)', () => {
  it('preserves all static Document entries exactly when dynamic menu is empty', () => {
    const merged = mergeDynamicAndStaticNavigation([]);
    const resourceItems = merged.filter((item) => item.category === 'RESOURCES');

    expect(resourceItems).toHaveLength(STATIC_RESOURCE_DOCS.length);
    expect(resourceItems.map((i) => i.id)).toEqual([
      'docs',
      'user-guide',
      'modernization-guide',
      'contact',
    ]);
    expect(resourceItems.map((i) => i.path)).toEqual([
      '/workspace/docs',
      '/workspace/docs#how-it-works',
      '/workspace/docs#bms-dspf',
      '/workspace/contact',
    ]);
  });

  it('preserves all static Account entries when dynamic menu is empty', () => {
    const merged = mergeDynamicAndStaticNavigation([]);
    const accountItem = merged.find((item) => item.id === 'settings');

    expect(accountItem).toBeDefined();
    expect(accountItem?.category).toBe('ACCOUNT');
    expect(accountItem?.children?.map((c) => c.id)).toEqual([
      'account-profile',
      'account-preferences',
      'security-password',
      'security-2fa',
      'security-sessions',
    ]);
  });

  it('preserves all static Service & Contract entries when dynamic menu is empty or missing service items', () => {
    // 1. When dynamic menu is empty (fallback to DEFAULT_SIDEBAR_NAV)
    const defaultMerged = mergeDynamicAndStaticNavigation([]);
    const defaultContract = defaultMerged.some(
      (i) => i.path === '/billing/contracts' || (i.children && i.children.some((c) => c.path === '/billing/contracts')),
    );
    const defaultUsage = defaultMerged.some(
      (i) => i.path === '/billing/usage' || (i.children && i.children.some((c) => c.path === '/billing/usage')),
    );
    const defaultInvoices = defaultMerged.some(
      (i) => i.path === '/billing/invoices' || (i.children && i.children.some((c) => c.path === '/billing/invoices')),
    );

    expect(defaultContract).toBe(true);
    expect(defaultUsage).toBe(true);
    expect(defaultInvoices).toBe(true);

    // 2. When dynamic menu has non-service items (e.g. only Dashboard)
    const dynamicOnlyDashboard: MenuItem[] = [
      { id: 'web3_dashboard', label: 'Dashboard', path: '/dashboard', isVisible: true, category: 'MAIN' },
    ];
    const dynamicMerged = mergeDynamicAndStaticNavigation(dynamicOnlyDashboard);
    const dynamicContract = dynamicMerged.find((i) => i.path === '/billing/contracts');
    const dynamicUsage = dynamicMerged.find((i) => i.path === '/billing/usage');
    const dynamicInvoices = dynamicMerged.find((i) => i.path === '/billing/invoices');

    expect(STATIC_SERVICE_ITEMS).toHaveLength(3);
    expect(dynamicContract).toBeDefined();
    expect(dynamicUsage).toBeDefined();
    expect(dynamicInvoices).toBeDefined();
  });

  it('additively merges dynamic items without deleting static documents or service contracts', () => {
    const dynamicBackendItems: MenuItem[] = [
      {
        id: 'web3_dashboard',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        path: '/dashboard',
        isVisible: true,
        order: 1,
        category: 'MAIN',
      },
    ];

    const merged = mergeDynamicAndStaticNavigation(dynamicBackendItems);

    expect(merged.find((i) => i.id === 'web3_dashboard')).toBeDefined();

    const docsItem = merged.find((i) => i.id === 'docs');
    const userGuideItem = merged.find((i) => i.id === 'user-guide');
    const modGuideItem = merged.find((i) => i.id === 'modernization-guide');
    const contactItem = merged.find((i) => i.id === 'contact');

    expect(docsItem).toBeDefined();
    expect(docsItem?.path).toBe('/workspace/docs');
    expect(userGuideItem).toBeDefined();
    expect(modGuideItem).toBeDefined();
    expect(contactItem).toBeDefined();

    const contractItem = merged.find((i) => i.path === '/billing/contracts');
    expect(contractItem).toBeDefined();
    expect(contractItem?.label).toBe('Contract & Subscription');
  });
});
