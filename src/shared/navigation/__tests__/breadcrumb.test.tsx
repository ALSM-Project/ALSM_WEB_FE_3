import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getBreadcrumbsFromRoute } from '../breadcrumbUtils';
import { Breadcrumb } from '../Breadcrumb';
import type { MenuItem } from '@/features/menus/types/menu';

describe('breadcrumbUtils - getBreadcrumbsFromRoute', () => {
  it('correctly maps Team Management routes to Organization > Team Management', () => {
    expect(getBreadcrumbsFromRoute('/settings/team')).toEqual([
      { label: 'Organization' },
      { label: 'Team Management' },
    ]);
    expect(getBreadcrumbsFromRoute('/settings/teams')).toEqual([
      { label: 'Organization' },
      { label: 'Team Management' },
    ]);
    expect(getBreadcrumbsFromRoute('/settings/members')).toEqual([
      { label: 'Organization' },
      { label: 'Team Management' },
    ]);
    expect(getBreadcrumbsFromRoute('/organization/members')).toEqual([
      { label: 'Organization' },
      { label: 'Team Management' },
    ]);
    expect(getBreadcrumbsFromRoute('/project-members')).toEqual([
      { label: 'Organization' },
      { label: 'Team Management' },
    ]);
  });

  it('correctly maps Organization Profile routes', () => {
    expect(getBreadcrumbsFromRoute('/settings/organization')).toEqual([
      { label: 'Organization' },
      { label: 'Organization Profile' },
    ]);
    expect(getBreadcrumbsFromRoute('/organization/profile')).toEqual([
      { label: 'Organization' },
      { label: 'Organization Profile' },
    ]);
    expect(getBreadcrumbsFromRoute('/account/company')).toEqual([
      { label: 'Organization' },
      { label: 'Organization Profile' },
    ]);
  });

  it('correctly maps Roles, Projects, Analytics, and Audit Logs', () => {
    expect(getBreadcrumbsFromRoute('/settings/roles')).toEqual([
      { label: 'Organization' },
      { label: 'Roles & Permissions' },
    ]);
    expect(getBreadcrumbsFromRoute('/organization/roles')).toEqual([
      { label: 'Organization' },
      { label: 'Roles & Permissions' },
    ]);
    expect(getBreadcrumbsFromRoute('/organization/projects')).toEqual([
      { label: 'Organization' },
      { label: 'Organization Projects' },
    ]);
    expect(getBreadcrumbsFromRoute('/organization/analytics')).toEqual([
      { label: 'Organization' },
      { label: 'Organization Analytics' },
    ]);
    expect(getBreadcrumbsFromRoute('/organization/audit-logs')).toEqual([
      { label: 'Organization' },
      { label: 'Audit Logs' },
    ]);
    expect(getBreadcrumbsFromRoute('/internal-teams')).toEqual([
      { label: 'Organization' },
      { label: 'Internal Teams' },
    ]);
  });

  it('correctly maps Contract & Billing routes', () => {
    expect(getBreadcrumbsFromRoute('/billing/contracts')).toEqual([
      { label: 'Contract & Billing' },
      { label: 'Enterprise Contracts' },
    ]);
    expect(getBreadcrumbsFromRoute('/billing/invoices')).toEqual([
      { label: 'Contract & Billing' },
      { label: 'Invoices & Payments' },
    ]);
    expect(getBreadcrumbsFromRoute('/billing/usage')).toEqual([
      { label: 'Contract & Billing' },
      { label: 'Service Usage & Quotas' },
    ]);
  });

  it('resolves dynamically from menuItems hierarchy when provided', () => {
    const customMenu: MenuItem[] = [
      {
        id: 'group_reports',
        label: 'FINANCIAL REPORTS',
        category: 'FINANCIAL REPORTS',
        isVisible: true,
        order: 1,
        children: [
          {
            id: 'monthly_statement',
            label: 'Monthly Statements',
            path: '/finance/monthly',
            isVisible: true,
            order: 1,
          },
        ],
      },
    ];

    expect(getBreadcrumbsFromRoute('/finance/monthly', customMenu)).toEqual([
      { label: 'Financial Reports' },
      { label: 'Monthly Statements' },
    ]);
  });
});

describe('Breadcrumb Component', () => {
  it('renders Organization > Team Management when on /settings/team', () => {
    render(
      <MemoryRouter initialEntries={['/settings/team']}>
        <Breadcrumb />
      </MemoryRouter>
    );

    expect(screen.getByText('Organization')).toBeInTheDocument();
    expect(screen.getByText('Team Management')).toBeInTheDocument();
  });
});
