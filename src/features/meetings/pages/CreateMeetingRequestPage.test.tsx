import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CreateMeetingRequestPage } from './CreateMeetingRequestPage';
import { meetingRequestsApi } from '../api/meeting-requests.api';
import { projectService } from '@/features/projects/services/project.service';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/app/providers', () => ({
  useAuth: () => ({
    user: { id: 'usr-001', email: 'customer@acme.com', fullName: 'John Doe', role: 'ORGANIZATION_OWNER' },
  }),
}));

vi.mock('@/context/WorkspaceContext', () => ({
  useWorkspace: () => ({
    organization: { id: 'org-001', name: 'Acme Corp' },
  }),
}));

vi.mock('../api/meeting-requests.api', () => ({
  meetingRequestsApi: {
    getConsultationTypes: vi.fn(),
    getOrganizationMembers: vi.fn(),
    createMeetingRequest: vi.fn(),
  },
}));

vi.mock('@/features/projects/services/project.service', () => ({
  projectService: {
    getProjects: vi.fn(),
  },
}));

const mockOrgMembers = [
  { id: 'mem-001', name: 'John Doe', email: 'customer@acme.com', role: 'Partner Lead', status: 'Active' },
  { id: 'mem-002', name: 'Bob Colleague', email: 'bob@acme.com', role: 'Modernization Engineer', status: 'Active' },
];

describe('CreateMeetingRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(meetingRequestsApi.getConsultationTypes).mockResolvedValue([
      { key: 'TECHNICAL', label: 'Technical Consultation', description: '', recommendedDurationMinutes: 45 },
    ]);
    vi.mocked(meetingRequestsApi.getOrganizationMembers).mockResolvedValue(mockOrgMembers);
    vi.mocked(projectService.getProjects).mockResolvedValue([
      { id: 'proj-001', name: 'Core Banking Migration' } as any,
    ]);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <CreateMeetingRequestPage />
      </MemoryRouter>
    );

  it('renders all sections and loads strictly the organization members in section 3', async () => {
    renderComponent();

    expect(screen.getByText('Request Consultation & Architecture Meeting')).toBeInTheDocument();
    expect(screen.getByText(/Section 1 — Meeting Information & Context/i)).toBeInTheDocument();
    expect(screen.getByText(/Section 2 — Scheduling Preferences/i)).toBeInTheDocument();
    expect(screen.getByText(/Section 3 — Participants/i)).toBeInTheDocument();
    expect(screen.getByText(/Section 4 — Technical Scope & System Details/i)).toBeInTheDocument();

    // Check customer organization attendees
    expect(screen.getByText(/John Doe \(Requester — Included\)/i)).toBeInTheDocument();
    expect(await screen.findByText('Bob Colleague')).toBeInTheDocument();
    expect(screen.getByText('(bob@acme.com)')).toBeInTheDocument();

    // Ensure unrelated users are NOT rendered
    expect(screen.queryByText('Sarah Jenkins')).not.toBeInTheDocument();
    expect(screen.queryByText('David Kim')).not.toBeInTheDocument();
  });

  it('allows filling the form and submitting a meeting request', async () => {
    vi.mocked(meetingRequestsApi.createMeetingRequest).mockResolvedValue({ id: 'meet-123' } as any);

    renderComponent();

    // Title
    const titleInput = screen.getByPlaceholderText(/e\.g\. COBOL-to-Java Architecture/i);
    fireEvent.change(titleInput, { target: { value: 'COBOL to Java Architecture Review' } });

    // Select colleague
    const bobCheckbox = await screen.findByRole('checkbox', { name: /Bob Colleague/i });
    fireEvent.click(bobCheckbox);

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Meeting Request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(meetingRequestsApi.createMeetingRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'COBOL to Java Architecture Review',
          attendeeEmails: expect.arrayContaining(['customer@acme.com', 'bob@acme.com']),
        })
      );
    });
  });
});
