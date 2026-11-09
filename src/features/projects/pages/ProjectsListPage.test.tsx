import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Project } from '../types/project';
import { ProjectsListPage } from './ProjectsListPage';

const mockProjects: Project[] = [
  {
    id: 'proj-alpha',
    name: 'Alpha BMS Portal',
    description: 'BMS core screens',
    status: 'ACTIVE',
    conversionType: 'BMS_DSPF_TO_FRONTEND',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-10T10:00:00Z',
  },
  {
    id: 'proj-beta',
    name: 'Beta COBOL Core',
    description: 'COBOL banking batch jobs',
    status: 'DRAFT',
    conversionType: 'COBOL_TO_JAVA',
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: '2026-08-12T10:00:00Z',
  },
];

const mocks = vi.hoisted(() => ({
  getProjects: vi.fn(),
}));

vi.mock('../services/project.service', () => ({
  projectService: {
    getProjects: mocks.getProjects,
  },
}));

describe('ProjectsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter initialEntries={['/projects']}>
        <Routes>
          <Route path="/projects" element={<ProjectsListPage />} />
          <Route path="/projects/:projectId" element={<div>Project Overview Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders projects and supports filtering by search and type', async () => {
    mocks.getProjects.mockResolvedValue(mockProjects);
    renderPage();

    expect(await screen.findByText('Alpha BMS Portal')).toBeInTheDocument();
    expect(screen.getByText('Beta COBOL Core')).toBeInTheDocument();

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Search projects by name/i);
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    expect(screen.getByText('Alpha BMS Portal')).toBeInTheDocument();
    expect(screen.queryByText('Beta COBOL Core')).not.toBeInTheDocument();

    // Reset search
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Beta COBOL Core')).toBeInTheDocument();

    // Type filter
    const cobolBtn = screen.getByRole('button', { name: 'COBOL' });
    fireEvent.click(cobolBtn);

    expect(screen.queryByText('Alpha BMS Portal')).not.toBeInTheDocument();
    expect(screen.getByText('Beta COBOL Core')).toBeInTheDocument();
  });

  it('shows empty filter state when search has no matches', async () => {
    mocks.getProjects.mockResolvedValue(mockProjects);
    renderPage();

    await screen.findByText('Alpha BMS Portal');

    const searchInput = screen.getByPlaceholderText(/Search projects by name/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentProjectName' } });

    expect(screen.getByText('No Projects Found')).toBeInTheDocument();
    expect(screen.getByText(/Clear Filters/i)).toBeInTheDocument();
  });
});
