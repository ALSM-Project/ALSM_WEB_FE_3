import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { ContractStatusGuard } from '@/app/guards';
import type { MenuItem } from '@/features/menus/types/menu';

// Mock contexts
const mockWorkspaceState = {
  activeContract: null,
  serviceMode: 'SELF_SERVICE',
  contractStatus: 'ACTIVE',
  isSuspended: false,
  isExpired: false,
  activeWorkspace: 'SELF_SERVICE',
  setActiveWorkspace: vi.fn(),
  isHybrid: false,
  canUseSelfService: true,
  canUseManaged: false,
  userRoles: ['DEVELOPER'],
  userPermissions: ['conversion.execute', 'projects.view'],
  organization: { id: 'org-1', name: 'Acme Test Org' },
  isLoading: false,
  error: null,
  refreshContract: vi.fn(),
};

vi.mock('@/context/WorkspaceContext', () => ({
  useWorkspace: () => mockWorkspaceState,
}));

vi.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: { fullName: 'Alex Test', email: 'alex@acme.com', role: 'DEVELOPER' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

const mockNavState = {
  sidebarNav: [] as MenuItem[],
  loading: false,
};

vi.mock('@/hooks/useNavigation', () => ({
  useNavigation: () => mockNavState,
}));

describe('Web 3 Sidebar Navigation — Contract Type & RBAC Dynamic Rendering', () => {
  it('renders Self-Service navigation hierarchy with MAIN, WORKSPACE, ORGANIZATION without duplicates', () => {
    mockNavState.sidebarNav = [
      {
        id: 'web3_group_main',
        label: 'MAIN',
        isVisible: true,
        children: [
          { id: 'web3_dashboard', label: 'Partner Dashboard', path: '/dashboard', isVisible: true },
          { id: 'web3_projects', label: 'My Projects', path: '/projects', isVisible: true },
          { id: 'web3_screens', label: 'Screens & Programs', path: '/screens', isVisible: true },
          { id: 'web3_downloads', label: 'Downloads', path: '/downloads', isVisible: true },
        ],
      },
      {
        id: 'web3_group_workspace',
        label: 'WORKSPACE',
        isVisible: true,
        children: [
          { id: 'web3_project_files', label: 'Project Files', path: '/project-files', isVisible: true },
          { id: 'web3_conversion_queue', label: 'Conversion Queue', path: '/conversion-queue', isVisible: true },
          { id: 'web3_diagnostics', label: 'Diagnostics', path: '/diagnostics', isVisible: true },
        ],
      },
      {
        id: 'web3_group_organization',
        label: 'ORGANIZATION',
        isVisible: true,
        children: [
          { id: 'web3_org_profile', label: 'Organization Profile', path: '/settings/organization', isVisible: true },
          { id: 'web3_org_members', label: 'Team Members', path: '/organisation/members', isVisible: true },
        ],
      },
    ];

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isCollapsed={false} />
      </MemoryRouter>
    );

    // Section headers
    expect(screen.getByText('MAIN')).toBeInTheDocument();
    expect(screen.getByText('WORKSPACE')).toBeInTheDocument();
    expect(screen.getByText('ORGANIZATION')).toBeInTheDocument();

    // Menu items
    expect(screen.getByText('Partner Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Screens & Programs')).toBeInTheDocument();
    expect(screen.getByText('Conversion Queue')).toBeInTheDocument();
    expect(screen.getByText('Diagnostics')).toBeInTheDocument();

    // Ensure no duplicates
    expect(screen.getAllByText('My Projects')).toHaveLength(1);
    expect(screen.getAllByText('Downloads')).toHaveLength(1);
  });

  it('renders Managed Modernization Services navigation hierarchy with PROJECT MANAGEMENT & COMMUNICATION', () => {
    mockNavState.sidebarNav = [
      {
        id: 'web3_group_main',
        label: 'MAIN',
        isVisible: true,
        children: [
          { id: 'web3_dashboard', label: 'Dashboard', path: '/dashboard', isVisible: true },
        ],
      },
      {
        id: 'web3_group_organization',
        label: 'ORGANIZATION',
        isVisible: true,
        children: [
          { id: 'web3_org_profile', label: 'Organization Profile', path: '/settings/organization', isVisible: true },
        ],
      },
      {
        id: 'web3_group_project_management',
        label: 'PROJECT MANAGEMENT',
        isVisible: true,
        children: [
          { id: 'web3_projects', label: 'Projects', path: '/projects', isVisible: true },
          { id: 'web3_project_files', label: 'Project Files', path: '/project-files', isVisible: true },
        ],
      },
      {
        id: 'web3_group_communication',
        label: 'COMMUNICATION',
        isVisible: true,
        children: [
          { id: 'web3_conversations', label: 'Conversations', path: '/conversations', isVisible: true },
          { id: 'web3_meetings', label: 'Meeting Requests', path: '/meeting-requests', isVisible: true },
        ],
      },
    ];

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isCollapsed={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('MAIN')).toBeInTheDocument();
    expect(screen.getByText('ORGANIZATION')).toBeInTheDocument();
    expect(screen.getByText('PROJECT MANAGEMENT')).toBeInTheDocument();
    expect(screen.getByText('COMMUNICATION')).toBeInTheDocument();

    expect(screen.getByText('Organization Profile')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Project Files')).toBeInTheDocument();
    expect(screen.getByText('Meeting Requests')).toBeInTheDocument();

    // Verify removed items are NOT present in Web3 Managed Modernization
    expect(screen.queryByText('Internal Teams')).not.toBeInTheDocument();
    expect(screen.queryByText('Roles & Permissions')).not.toBeInTheDocument();
    expect(screen.queryByText('Organisation Analytics')).not.toBeInTheDocument();
    expect(screen.queryByText('Conversion Deliverables')).not.toBeInTheDocument();
    expect(screen.queryByText('Project Activity History')).not.toBeInTheDocument();
  });

  it('displays suspended contract warning badge when isSuspended is true', () => {
    mockWorkspaceState.isSuspended = true;

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isCollapsed={false} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Contract Suspended \(Read-Only\)/i)).toBeInTheDocument();
    mockWorkspaceState.isSuspended = false;
  });

  it('ContractStatusGuard blocks access to mutation routes when contract is suspended', () => {
    mockWorkspaceState.isSuspended = true;

    render(
      <MemoryRouter initialEntries={['/projects/new']}>
        <Routes>
          <Route element={<ContractStatusGuard allowSuspended={false} />}>
            <Route path="/projects/new" element={<div>Create Project Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Create Project Page')).not.toBeInTheDocument();
    expect(screen.getByText('Contract Suspended')).toBeInTheDocument();
    expect(screen.getByText('View Contracts')).toBeInTheDocument();

    mockWorkspaceState.isSuspended = false;
  });
});
