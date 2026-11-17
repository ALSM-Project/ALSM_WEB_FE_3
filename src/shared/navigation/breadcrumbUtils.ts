import type { MenuItem } from '@/features/menus/types/menu';
import { getProjectName } from '@/shared/utils/projectCache';

export interface BreadcrumbNode {
  label: string;
  path?: string;
  href?: string;
}

/**
 * Normalizes uppercase or snake_case category strings into title-cased labels
 */
function toTitleCase(str: string): string {
  if (!str) return '';
  const canonicalMap: Record<string, string> = {
    ORGANIZATION: 'Organization',
    WORKSPACE: 'Workspace',
    'CONTRACT & BILLING': 'Contract & Billing',
    'SERVICE & CONTRACT': 'Contract & Billing',
    COMMUNICATION: 'Communication',
    'PROJECT MANAGEMENT': 'Project Management',
    DELIVERABLES: 'Project Management',
    COLLABORATION: 'Collaboration',
    ACCOUNT: 'Account',
    RESOURCES: 'Resources',
    ADMINISTRATION: 'Administration',
    SETTINGS: 'Organization',
  };

  const upper = str.toUpperCase().trim();
  if (canonicalMap[upper]) {
    return canonicalMap[upper];
  }

  return str
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Searches the menu hierarchy for a matching path
 */
function findInMenuItems(
  items: MenuItem[],
  targetPath: string
): { label: string; section?: string; path?: string } | null {
  for (const parent of items) {
    if (parent.children && parent.children.length > 0) {
      for (const child of parent.children) {
        if (child.path && (child.path === targetPath || targetPath === child.path.split('?')[0])) {
          const section = toTitleCase(parent.label || parent.category || '');
          return { label: child.label, section, path: child.path };
        }
      }
    }
    if (parent.path && (parent.path === targetPath || targetPath === parent.path.split('?')[0])) {
      const section = parent.category ? toTitleCase(parent.category) : undefined;
      return { label: parent.label, section, path: parent.path };
    }
  }
  return null;
}

/**
 * Derives a clean list of breadcrumb nodes for any URL pathname
 */
export function getBreadcrumbsFromRoute(
  pathname: string,
  menuItems: MenuItem[] = []
): BreadcrumbNode[] {
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';

  // 1. Root & Dashboard
  if (cleanPath === '/' || cleanPath === '/dashboard' || cleanPath === '/workspace') {
    return [{ label: 'Dashboard' }];
  }
  if (cleanPath === '/partner-dashboard') {
    return [{ label: 'Partner Dashboard' }];
  }

  // 2. Organization Section (Canonical Web 3 mapping)
  if (
    cleanPath === '/settings/organization' ||
    cleanPath === '/organization/profile' ||
    cleanPath === '/organisation/profile' ||
    cleanPath === '/account/company' ||
    cleanPath === '/account/company-profile'
  ) {
    return [{ label: 'Organization' }, { label: 'Organization Profile' }];
  }

  if (
    cleanPath === '/settings/team' ||
    cleanPath === '/settings/teams' ||
    cleanPath === '/settings/members' ||
    cleanPath === '/organisation/members' ||
    cleanPath === '/organization/members' ||
    cleanPath === '/project-members'
  ) {
    return [{ label: 'Organization' }, { label: 'Team Management' }];
  }

  if (
    cleanPath === '/internal-teams' ||
    cleanPath === '/organisation/teams' ||
    cleanPath === '/organization/teams'
  ) {
    return [{ label: 'Organization' }, { label: 'Internal Teams' }];
  }

  if (
    cleanPath === '/organization/projects' ||
    cleanPath === '/organisation/projects'
  ) {
    return [{ label: 'Organization' }, { label: 'Organization Projects' }];
  }

  if (
    cleanPath === '/settings/roles' ||
    cleanPath === '/organisation/roles' ||
    cleanPath === '/organization/roles'
  ) {
    return [{ label: 'Organization' }, { label: 'Roles & Permissions' }];
  }

  if (
    cleanPath === '/organization/analytics' ||
    cleanPath === '/organisation/analytics'
  ) {
    return [{ label: 'Organization' }, { label: 'Organization Analytics' }];
  }

  if (
    cleanPath === '/organization/audit-logs' ||
    cleanPath === '/organisation/audit-logs' ||
    cleanPath === '/project-activity'
  ) {
    return [{ label: 'Organization' }, { label: 'Audit Logs' }];
  }

  // 3. Contract & Billing Section
  if (
    cleanPath.startsWith('/billing') ||
    cleanPath === '/contracts' ||
    cleanPath === '/invoices' ||
    cleanPath === '/quotas'
  ) {
    const contractMatch = cleanPath.match(/^(?:\/billing)?\/contracts\/([^/]+)/);
    if (contractMatch) {
      const rawId = contractMatch[1];
      return [
        { label: 'Contract & Billing', path: '/billing/contracts' },
        { label: 'Enterprise Contracts', path: '/billing/contracts' },
        {
          label:
            rawId === 'new'
              ? 'New Contract'
              : rawId.toUpperCase().startsWith('ALSM') || rawId.toUpperCase().startsWith('CTR')
              ? rawId
              : 'Contract Details',
        },
      ];
    }
    if (cleanPath === '/billing/contracts' || cleanPath === '/contracts') {
      return [{ label: 'Contract & Billing' }, { label: 'Enterprise Contracts' }];
    }
    if (cleanPath === '/billing/invoices' || cleanPath === '/invoices') {
      return [{ label: 'Contract & Billing' }, { label: 'Invoices & Payments' }];
    }
    if (cleanPath === '/billing/usage' || cleanPath === '/quotas') {
      return [{ label: 'Contract & Billing' }, { label: 'Service Usage & Quotas' }];
    }
    if (cleanPath === '/billing/upgrade') {
      return [{ label: 'Contract & Billing' }, { label: 'Upgrade & Consultation' }];
    }
    return [{ label: 'Contract & Billing' }];
  }

  // 4. Project Management & Managed Modernization Routes
  if (cleanPath === '/project-files') {
    return [{ label: 'Project Management' }, { label: 'Project Files' }];
  }
  if (cleanPath === '/deliverables' || cleanPath === '/deliverables-sign-off') {
    return [{ label: 'Project Management' }, { label: 'Conversion Deliverables' }];
  }
  if (cleanPath === '/downloads') {
    return [{ label: 'Project Management' }, { label: 'Downloads' }];
  }
  if (cleanPath === '/conversion-requests') {
    return [{ label: 'Project Management' }, { label: 'Conversion Requests' }];
  }
  const conversionReqMatch = cleanPath.match(/^\/conversion-requests\/([^/]+)$/);
  if (conversionReqMatch) {
    return [
      { label: 'Project Management', path: '/conversion-requests' },
      { label: 'Conversion Requests', path: '/conversion-requests' },
      { label: conversionReqMatch[1] },
    ];
  }
  if (cleanPath === '/managed-projects' || cleanPath === '/project-progress') {
    return [{ label: 'Managed Services' }, { label: 'Managed Projects' }];
  }
  const managedProjMatch = cleanPath.match(/^\/managed-projects\/([^/]+)$/);
  if (managedProjMatch) {
    const projId = managedProjMatch[1];
    return [
      { label: 'Managed Services', path: '/managed-projects' },
      { label: 'Managed Projects', path: '/managed-projects' },
      { label: getProjectName(projId) || projId },
    ];
  }
  if (cleanPath === '/managed-dashboard') {
    return [{ label: 'Dashboard' }];
  }
  if (cleanPath === '/service-catalog') {
    return [{ label: 'Managed Services' }, { label: 'Service Catalog' }];
  }

  // 5. Communication Section
  if (cleanPath === '/conversations') {
    return [{ label: 'Communication' }, { label: 'Conversations' }];
  }
  if (
    cleanPath === '/meetings' ||
    cleanPath === '/meeting-requests' ||
    cleanPath === '/meeting-scheduler'
  ) {
    return [{ label: 'Communication' }, { label: 'Meeting Scheduler' }];
  }

  // 6. Account & Security Section
  if (cleanPath.startsWith('/account')) {
    const base: BreadcrumbNode[] = [{ label: 'Account' }];
    if (cleanPath.includes('password')) return [...base, { label: 'Change Password' }];
    if (cleanPath.includes('2fa')) return [...base, { label: 'Two-Factor Authentication' }];
    if (cleanPath.includes('sessions')) return [...base, { label: 'Active Sessions' }];
    if (cleanPath.includes('preferences')) return [...base, { label: 'Preferences' }];
    if (cleanPath.includes('profile')) return [...base, { label: 'Profile & Security' }];
    return [...base, { label: 'Account Settings' }];
  }

  // 7. Projects & Screens (Self-Service Modernization Workflow)
  if (cleanPath === '/projects') {
    return [{ label: 'Projects' }];
  }

  const projectMatch = cleanPath.match(/^\/projects\/([^/]+)(?:\/(.*))?$/);
  if (projectMatch) {
    const [, projectId, rest] = projectMatch;
    const projectLabel =
      projectId === 'create' || projectId === 'new'
        ? 'Create Project'
        : getProjectName(projectId);

    if (projectId === 'create' || projectId === 'new') {
      return [{ label: 'Projects', path: '/projects' }, { label: 'Create Project' }];
    }

    const baseBreadcrumb: BreadcrumbNode[] = [
      { label: 'Projects', path: '/projects' },
      { label: projectLabel, path: `/projects/${projectId}/screens` },
    ];

    if (!rest || rest === 'overview' || rest === 'screens') {
      return [{ label: 'Projects', path: '/projects' }, { label: projectLabel }];
    }

    if (rest === 'delete') {
      return [{ label: 'Projects', path: '/projects' }, { label: projectLabel }];
    }

    if (rest === 'upload') {
      return [...baseBreadcrumb, { label: 'Upload Source File' }];
    }

    if (rest === 'bulk-convert') {
      return [...baseBreadcrumb, { label: 'Bulk Convert' }];
    }

    if (rest === 'export') {
      return [...baseBreadcrumb, { label: 'Export Code Package' }];
    }

    if (rest === 'diagnostics') {
      return [...baseBreadcrumb, { label: 'Diagnostics & Error Logs' }];
    }

    // Handle /projects/:projectId/screens/:screenId/... pattern
    const screenMatch = rest.match(/^screens\/([^/]+)(?:\/(.*))?$/);
    if (screenMatch) {
      const [, screenId, screenAction] = screenMatch;
      const screenLabel = screenId.includes('.') ? screenId : screenId.toUpperCase();
      const screenBase: BreadcrumbNode[] = [...baseBreadcrumb, { label: screenLabel }];

      if (!screenAction || screenAction === 'convert') {
        return [...screenBase, { label: 'Convert' }];
      }
      if (screenAction === 'mapping') {
        return [...screenBase, { label: 'Field Mapping' }];
      }
      if (screenAction === 'review') {
        return [...screenBase, { label: 'Review Findings' }];
      }
      if (screenAction === 'result') {
        return [...screenBase, { label: 'Result Inspection' }];
      }
      if (screenAction === 'preview') {
        return [...screenBase, { label: 'Preview Studio' }];
      }
    }

    return baseBreadcrumb;
  }

  // 8. Documentation & Guides
  if (cleanPath === '/workspace/docs' || cleanPath === '/documentation' || cleanPath === '/docs') {
    return [{ label: 'Resources' }, { label: 'Documentation' }];
  }
  if (cleanPath === '/user-guide') {
    return [{ label: 'Resources' }, { label: 'User Guide' }];
  }
  if (cleanPath === '/modernization-guide') {
    return [{ label: 'Resources' }, { label: 'Modernization Guide' }];
  }
  if (cleanPath.includes('/contact') || cleanPath === '/support-requests') {
    return [{ label: 'Resources' }, { label: 'Contact & Upgrade' }];
  }

  // 9. Diagnostics & Screen standalones
  if (cleanPath === '/diagnostics') {
    return [{ label: 'Diagnostics & System Logs' }];
  }
  if (cleanPath === '/screens') {
    return [{ label: 'Projects', path: '/projects' }, { label: 'Screens' }];
  }
  if (cleanPath === '/conversion-queue' || cleanPath === '/conversion-history') {
    return [{ label: 'Projects', path: '/projects' }, { label: 'Bulk Convert' }];
  }
  if (cleanPath === '/conversion-results') {
    return [{ label: 'Projects', path: '/projects' }, { label: 'Result Inspection' }];
  }

  // 10. Dynamic search in provided menuItems
  if (menuItems && menuItems.length > 0) {
    const matched = findInMenuItems(menuItems, cleanPath);
    if (matched) {
      if (matched.section && matched.section !== matched.label) {
        return [{ label: matched.section }, { label: matched.label }];
      }
      return [{ label: matched.label }];
    }
  }

  // 11. Fallback segment parser
  const segments = cleanPath.split('/').filter(Boolean);
  const result: BreadcrumbNode[] = [];
  let accumulatedPath = '';

  segments.forEach((seg, index) => {
    accumulatedPath += `/${seg}`;
    const isLast = index === segments.length - 1;
    const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');

    result.push({
      label,
      path: isLast ? undefined : accumulatedPath,
    });
  });

  return result;
}
