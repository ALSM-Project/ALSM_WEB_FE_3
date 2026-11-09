import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Project } from '../types/project';
import type { LegacyScreen } from '@/features/screens/types/screen';
import { ProjectOverviewPage } from './ProjectOverviewPage';

const mockProject: Project = {
  id: 'proj-acme-123',
  name: 'Core Banking Ledger Modernization',
  description: 'Enterprise migration of legacy BMS maps to React',
  status: 'ACTIVE',
  conversionType: 'BMS_DSPF_TO_FRONTEND',
  createdAt: '2026-08-10T08:00:00Z',
  updatedAt: '2026-08-15T12:00:00Z',
};

const mockScreens: LegacyScreen[] = [
  {
    id: 'scr-1',
    projectId: 'proj-acme-123',
    name: 'ACCT010',
    sourceType: 'BMS',
    status: 'Completed',
    framework: 'React',
    lastUpdated: '2026-08-15',
  },
  {
    id: 'scr-2',
    projectId: 'proj-acme-123',
    name: 'ACCT020',
    sourceType: 'BMS',
    status: 'Review Required',
    framework: 'React',
    lastUpdated: '2026-08-15',
  },
  {
    id: 'scr-3',
    projectId: 'proj-acme-123',
    name: 'ACCT030',
    sourceType: 'BMS',
    status: 'Failed',
    framework: 'React',
    lastUpdated: '2026-08-15',
  },
];

const mocks = vi.hoisted(() => ({
  getProjectById: vi.fn(),
  getScreens: vi.fn(),
  deleteProject: vi.fn(),
  updateProject: vi.fn(),
}));

vi.mock('../services/project.service', () => ({
  projectService: {
    getProjectById: mocks.getProjectById,
    getProject: mocks.getProjectById,
    deleteProject: mocks.deleteProject,
    updateProject: mocks.updateProject,
  },
}));

vi.mock('@/features/conversion/services/conversion.service', () => ({
  conversionService: {
    getScreens: mocks.getScreens,
  },
}));

describe('ProjectOverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (projectId = 'proj-acme-123') => {
    return render(
      <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectOverviewPage />} />
          <Route path="/projects" element={<div>Projects List Page</div>} />
          <Route path="/projects/:projectId/upload" element={<div>Upload Page</div>} />
          <Route path="/projects/:projectId/screens" element={<div>Screens Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders project metadata and real screen counts', async () => {
    mocks.getProjectById.mockResolvedValue(mockProject);
    mocks.getScreens.mockResolvedValue(mockScreens);

    renderPage();

    expect(await screen.findByRole('heading', { name: /Core Banking Ledger Modernization/i })).toBeInTheDocument();
    expect(screen.getByText('Enterprise migration of legacy BMS maps to React')).toBeInTheDocument();
    expect(screen.getByText(/BMS \/ DSPF Screen Maps/i)).toBeInTheDocument();
    expect(screen.getByText(/React 19 \(TypeScript \+ Tailwind\)/i)).toBeInTheDocument();

    // Verify screen counts using card container queries
    const totalScreensCard = await screen.findByTitle('Click to view all screens');
    expect(totalScreensCard).toHaveTextContent('3');

    const convertedCard = screen.getByTitle('Click to view converted screens');
    expect(convertedCard).toHaveTextContent('1');

    const reviewCard = screen.getByTitle('Click to view screens requiring review');
    expect(reviewCard).toHaveTextContent('1');

    const failedCard = screen.getByTitle('Click to view diagnostics and error logs');
    expect(failedCard).toHaveTextContent('1');
  });

  it('shows not found state when project does not exist', async () => {
    mocks.getProjectById.mockResolvedValue(null);
    mocks.getScreens.mockResolvedValue([]);

    renderPage('proj-non-existent');

    expect(await screen.findByRole('heading', { name: /Project Not Found/i })).toBeInTheDocument();
    expect(screen.getByText(/Back to Projects List/i)).toBeInTheDocument();
  });
});
