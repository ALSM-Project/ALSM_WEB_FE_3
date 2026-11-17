import type { MenuItem } from '../types/menu';

/**
 * Shared Account Navigation Settings
 */
export const ACCOUNT_CHILDREN: MenuItem[] = [
  {
    id: 'account-profile',
    label: 'Profile & Security',
    icon: 'User',
    path: '/account/profile',
    parentId: 'settings',
    isVisible: true,
    order: 1,
  },
  {
    id: 'company-legal-profile',
    label: 'Company Legal Profile',
    icon: 'Building2',
    path: '/settings/organization',
    parentId: 'settings',
    isVisible: true,
    order: 2,
  },
  {
    id: 'account-preferences',
    label: 'Preferences',
    icon: 'Sliders',
    path: '/account/preferences',
    parentId: 'settings',
    isVisible: true,
    order: 3,
  },
  {
    id: 'security-password',
    label: 'Change Password',
    icon: 'KeyRound',
    path: '/account/security/password',
    parentId: 'settings',
    isVisible: true,
    order: 4,
  },
  {
    id: 'security-2fa',
    label: 'Two-Factor Authentication',
    icon: 'ShieldAlert',
    path: '/account/security/2fa',
    parentId: 'settings',
    isVisible: true,
    order: 5,
  },
  {
    id: 'security-sessions',
    label: 'Active Sessions',
    icon: 'Smartphone',
    path: '/account/security/sessions',
    parentId: 'settings',
    isVisible: true,
    order: 6,
  },
];

/**
 * Shared Resources Navigation Items
 */
export const RESOURCE_ITEMS: MenuItem[] = [
  {
    id: 'docs',
    label: 'Documentation',
    icon: 'BookOpen',
    path: '/workspace/docs',
    isVisible: true,
    order: 50,
    category: 'RESOURCES',
  },
  {
    id: 'user-guide',
    label: 'User Guide',
    icon: 'FileText',
    path: '/workspace/docs#how-it-works',
    isVisible: true,
    order: 51,
    category: 'RESOURCES',
  },
  {
    id: 'modernization-guide',
    label: 'Modernization Guide',
    icon: 'HelpCircle',
    path: '/workspace/docs#bms-dspf',
    isVisible: true,
    order: 52,
    category: 'RESOURCES',
  },
  {
    id: 'contact',
    label: 'Contact & Upgrade',
    icon: 'Mail',
    path: '/workspace/contact',
    isVisible: true,
    order: 53,
    category: 'RESOURCES',
  },
];

/**
 * Canonical Sidebar Navigation for PLATFORM-BASED MODERNIZATION (Loại 1: Self-Service Developer Workspace)
 * Perfectly mirrors MenuBuilder (WEB_3) structure.
 */
export const SELF_SERVICE_SIDEBAR_NAV: MenuItem[] = [
  // ROOT DASHBOARD
  {
    id: 'web3_dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    isVisible: true,
    order: 1,
    category: '',
  },

  // WORKSPACE SECTION
  {
    id: 'web3_group_workspace',
    label: 'WORKSPACE',
    icon: 'FolderKanban',
    isVisible: true,
    order: 2,
    category: 'WORKSPACE',
    children: [
      {
        id: 'web3_projects',
        label: 'Projects',
        icon: 'FolderKanban',
        path: '/projects',
        parentId: 'web3_group_workspace',
        isVisible: true,
        order: 1,
      },
    ],
  },

  // ORGANIZATION SECTION
  {
    id: 'web3_group_organization',
    label: 'ORGANIZATION',
    icon: 'Building2',
    isVisible: true,
    order: 3,
    category: 'ORGANIZATION',
    children: [
      {
        id: 'web3_org_profile',
        label: 'Organization Profile',
        icon: 'Building',
        path: '/settings/organization',
        parentId: 'web3_group_organization',
        isVisible: true,
        order: 1,
      },
      {
        id: 'web3_org_members',
        label: 'Team Management',
        icon: 'Users',
        path: '/settings/team',
        parentId: 'web3_group_organization',
        isVisible: true,
        order: 2,
      },
      {
        id: 'web3_org_roles',
        label: 'Roles & Permissions',
        icon: 'Shield',
        path: '/settings/roles',
        parentId: 'web3_group_organization',
        isVisible: true,
        order: 3,
      },
      {
        id: 'web3_org_analytics',
        label: 'Organization Analytics',
        icon: 'BarChart3',
        path: '/organization/analytics',
        parentId: 'web3_group_organization',
        isVisible: true,
        order: 4,
      },
    ],
  },

  // CONTRACT & BILLING SECTION [Platform-Based]
  {
    id: 'web3_group_contract_billing',
    label: 'CONTRACT & BILLING',
    icon: 'FileText',
    isVisible: true,
    order: 4,
    category: 'CONTRACT & BILLING',
    children: [
      {
        id: 'web3_billing_contracts',
        label: 'Enterprise Contracts',
        icon: 'FileText',
        path: '/billing/contracts',
        parentId: 'web3_group_contract_billing',
        isVisible: true,
        order: 1,
      },
      {
        id: 'invoices',
        label: 'Invoices & Payments',
        icon: 'Receipt',
        path: '/billing/invoices',
        parentId: 'web3_group_contract_billing',
        isVisible: true,
        order: 2,
      },
      {
        id: 'service-usage',
        label: 'Service Usage & Quotas',
        icon: 'Activity',
        path: '/billing/usage',
        parentId: 'web3_group_contract_billing',
        isVisible: true,
        order: 3,
      },
    ],
  },

  // COMMUNICATION SECTION
  {
    id: 'web3_group_communication',
    label: 'COMMUNICATION',
    icon: 'MessageSquare',
    isVisible: true,
    order: 5,
    category: 'COMMUNICATION',
    children: [
      {
        id: 'conversations',
        label: 'Conversations',
        icon: 'MessageSquare',
        path: '/conversations',
        parentId: 'web3_group_communication',
        isVisible: true,
        order: 1,
      },
      {
        id: 'meetings',
        label: 'Meeting Requests',
        icon: 'Calendar',
        path: '/meetings',
        parentId: 'web3_group_communication',
        isVisible: true,
        order: 2,
      },
    ],
  },

  // ACCOUNT SECTION
  {
    id: 'web3_group_account',
    label: 'ACCOUNT',
    icon: 'User',
    isVisible: true,
    order: 5,
    category: 'ACCOUNT',
    children: [
      {
        id: 'account-profile',
        label: 'Profile & Security',
        icon: 'User',
        path: '/account/profile',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 1,
      },
      {
        id: 'company-legal-profile',
        label: 'Company Legal Profile',
        icon: 'Building2',
        path: '/settings/organization',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 2,
      },
      {
        id: 'account-preferences',
        label: 'Preferences',
        icon: 'Sliders',
        path: '/account/preferences',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 3,
      },
      {
        id: 'security-password',
        label: 'Change Password',
        icon: 'KeyRound',
        path: '/account/security/password',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 4,
      },
      {
        id: 'security-2fa',
        label: 'Two-Factor Authentication',
        icon: 'ShieldAlert',
        path: '/account/security/2fa',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 5,
      },
      {
        id: 'security-sessions',
        label: 'Active Sessions',
        icon: 'Smartphone',
        path: '/account/security/sessions',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 6,
      },
    ],
  },
];

/**
 * Canonical Sidebar Navigation for MANAGED MODERNIZATION SERVICES (Loại 2: Turnkey Governance Portal)
 */
export const MANAGED_SIDEBAR_NAV: MenuItem[] = [
  // ROOT DASHBOARD
  {
    id: 'web3_dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    path: '/dashboard',
    isVisible: true,
    order: 1,
    category: '',
  },

  // ORGANIZATION SECTION
  {
    id: 'web3_group_organization',
    label: 'ORGANIZATION',
    icon: 'Building2',
    isVisible: true,
    order: 2,
    category: 'ORGANIZATION',
    children: [
      {
        id: 'web3_org_profile',
        label: 'Organization Profile',
        icon: 'Building',
        path: '/settings/organization',
        parentId: 'web3_group_organization',
        isVisible: true,
        order: 1,
      },
      {
        id: 'web3_org_members',
        label: 'Team Management',
        icon: 'Users',
        path: '/settings/team',
        parentId: 'web3_group_organization',
        isVisible: true,
        order: 2,
      },
      {
        id: 'web3_org_roles',
        label: 'Roles & Permissions',
        icon: 'Shield',
        path: '/settings/roles',
        parentId: 'web3_group_organization',
        isVisible: true,
        order: 3,
      },
      {
        id: 'web3_org_analytics',
        label: 'Organization Analytics',
        icon: 'BarChart3',
        path: '/organization/analytics',
        parentId: 'web3_group_organization',
        isVisible: true,
        order: 4,
      },
    ],
  },

  // DELIVERABLES / WORKFLOW SECTION (MANAGED MODERNIZATION)
  {
    id: 'web3_group_deliverables',
    label: 'DELIVERABLES',
    icon: 'FileCheck',
    isVisible: true,
    order: 3,
    category: 'DELIVERABLES',
    children: [
      {
        id: 'web3_deliverables',
        label: 'Milestones & Deliverables',
        icon: 'FileCheck',
        path: '/deliverables',
        parentId: 'web3_group_deliverables',
        isVisible: true,
        order: 1,
      },
      {
        id: 'web3_project_files',
        label: 'Project Files & Specs',
        icon: 'FolderGit2',
        path: '/project-files',
        parentId: 'web3_group_deliverables',
        isVisible: true,
        order: 2,
      },
    ],
  },

  // COLLABORATION SECTION
  {
    id: 'web3_group_collaboration',
    label: 'COLLABORATION',
    icon: 'Calendar',
    isVisible: true,
    order: 4,
    category: 'COLLABORATION',
    children: [
      {
        id: 'meetings',
        label: 'Meeting Scheduler',
        icon: 'Calendar',
        path: '/meetings',
        parentId: 'web3_group_collaboration',
        isVisible: true,
        order: 1,
      },
    ],
  },

  // ACCOUNT SECTION
  {
    id: 'web3_group_account',
    label: 'ACCOUNT',
    icon: 'User',
    isVisible: true,
    order: 5,
    category: 'ACCOUNT',
    children: [
      {
        id: 'account-profile',
        label: 'Profile & Security',
        icon: 'User',
        path: '/account/profile',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 1,
      },
      {
        id: 'company-legal-profile',
        label: 'Company Legal Profile',
        icon: 'Building2',
        path: '/settings/organization',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 2,
      },
      {
        id: 'account-preferences',
        label: 'Preferences',
        icon: 'Sliders',
        path: '/account/preferences',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 3,
      },
      {
        id: 'security-password',
        label: 'Change Password',
        icon: 'KeyRound',
        path: '/account/security/password',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 4,
      },
      {
        id: 'security-2fa',
        label: 'Two-Factor Authentication',
        icon: 'ShieldAlert',
        path: '/account/security/2fa',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 5,
      },
      {
        id: 'security-sessions',
        label: 'Active Sessions',
        icon: 'Smartphone',
        path: '/account/security/sessions',
        parentId: 'web3_group_account',
        isVisible: true,
        order: 6,
      },
    ],
  },
];

/**
 * Returns the appropriate sidebar navigation structure for the workspace mode.
 */
export function getSidebarNavForMode(mode: 'SELF_SERVICE' | 'MANAGED'): MenuItem[] {
  return mode === 'MANAGED' ? MANAGED_SIDEBAR_NAV : SELF_SERVICE_SIDEBAR_NAV;
}

export const DEFAULT_SIDEBAR_NAV: MenuItem[] = SELF_SERVICE_SIDEBAR_NAV;

/**
 * Finds an item recursively by ID in tree
 */
export function findMenuItemInTree(items: MenuItem[], id: string): MenuItem | null {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children && item.children.length > 0) {
      const found = findMenuItemInTree(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Checks if targetId is an ancestor of candidateId
 */
export function isDescendant(items: MenuItem[], targetId: string, candidateId: string): boolean {
  if (targetId === candidateId) return true;
  const targetItem = findMenuItemInTree(items, targetId);
  if (!targetItem || !targetItem.children) return false;

  for (const child of targetItem.children) {
    if (child.id === candidateId || isDescendant([child], child.id, candidateId)) {
      return true;
    }
  }
  return false;
}

/**
 * Flatten all menu items for parent selector dropdown
 */
export function flattenMenuItems(items: MenuItem[], depth = 0, prefix = ''): Array<{ item: MenuItem; depth: number; label: string }> {
  let result: Array<{ item: MenuItem; depth: number; label: string }> = [];

  for (const item of items) {
    const displayLabel = prefix ? `${prefix} > ${item.label}` : item.label;
    result.push({ item, depth, label: displayLabel });
    if (item.children && item.children.length > 0) {
      result = result.concat(flattenMenuItems(item.children, depth + 1, displayLabel));
    }
  }

  return result;
}

/**
 * Removes item from tree by ID
 */
export function removeItemFromTree(items: MenuItem[], id: string): MenuItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      children: item.children ? removeItemFromTree(item.children, id) : undefined,
    }));
}

/**
 * Inserts item as child of parentId or at root level if parentId is null
 */
export function insertItemInTree(items: MenuItem[], itemToInsert: MenuItem, parentId?: string | null): MenuItem[] {
  if (!parentId) {
    return [...items, { ...itemToInsert, parentId: undefined }];
  }

  return items.map((item) => {
    if (item.id === parentId) {
      const updatedChildren = item.children ? [...item.children, { ...itemToInsert, parentId }] : [{ ...itemToInsert, parentId }];
      return { ...item, children: updatedChildren };
    }

    if (item.children && item.children.length > 0) {
      return { ...item, children: insertItemInTree(item.children, itemToInsert, parentId) };
    }

    return item;
  });
}
