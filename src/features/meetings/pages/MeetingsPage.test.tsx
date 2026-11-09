import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MeetingsPage } from './MeetingsPage';
import { meetingRequestsApi } from '../api/meeting-requests.api';
import { projectService } from '@/features/projects/services/project.service';
import { organizationApi } from '@/features/organization/api/organization.api';
import type { MeetingRequest } from '../types/meeting';

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
    listMeetingRequests: vi.fn(),
    getConsultationTypes: vi.fn(),
    createMeetingRequest: vi.fn(),
    rescheduleMeeting: vi.fn(),
    cancelMeeting: vi.fn(),
    getOrganizationMembers: vi.fn(),
  },
}));

vi.mock('@/features/projects/services/project.service', () => ({
  projectService: {
    getProjects: vi.fn(),
  },
}));

vi.mock('@/features/organization/api/organization.api', () => ({
  organizationApi: {
    getMembers: vi.fn(),
  },
}));

const mockMeetings: MeetingRequest[] = [
  {
    id: 'meet-001',
    requestId: 'MTR-2026-001',
    customer: {
      fullName: 'John Doe',
      companyName: 'Acme Corp',
      email: 'customer@acme.com',
      customerType: 'EXISTING_CUSTOMER',
      organizationId: 'org-001',
    },
    topic: 'Enterprise Architecture & AST Validation Review',
    consultationType: 'TECHNICAL',
    priority: 'HIGH',
    status: 'CONFIRMED',
    requirements: {
      serviceMode: 'ALSM_MANAGED',
      legacySystemType: 'COBOL',
      estimatedScreens: 12,
      estimatedPrograms: 45,
      estimatedProjectScale: 'LARGE',
      businessRequirements: 'Technical deep-dive on AST paragraph mapping and Spring Boot structure.',
      projectId: 'proj-001',
      projectName: 'Core Banking Migration',
    },
    scheduling: {
      scheduledStartTime: '2026-11-10T14:00:00Z',
      scheduledEndTime: '2026-11-10T15:00:00Z',
      timezone: 'Asia/Ho_Chi_Minh',
      durationMinutes: 60,
      format: 'GOOGLE_MEET',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      meetingCode: 'alsm-arch-demo',
      calendarIntegrationStatus: 'CONNECTED',
      attendeeEmails: ['customer@acme.com', 'architect@alsm.io'],
    },
    assignment: {
      assignedSalesId: 'staff-001',
      assignedSalesName: 'Senior Architect ALSM',
      assignedSalesEmail: 'architect@alsm.io',
    },
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 'meet-002',
    requestId: 'MTR-2026-002',
    customer: {
      fullName: 'John Doe',
      companyName: 'Acme Corp',
      email: 'customer@acme.com',
      customerType: 'EXISTING_CUSTOMER',
      organizationId: 'org-001',
    },
    topic: 'Initial Kickoff & Ingestion Consultation',
    consultationType: 'LEGACY_MODERNIZATION',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    requirements: {
      serviceMode: 'ALSM_MANAGED',
      legacySystemType: 'BMS/CICS',
      estimatedScreens: 20,
      estimatedPrograms: 10,
      estimatedProjectScale: 'MEDIUM',
      businessRequirements: 'Review BMS screens and ingestion pipeline.',
    },
    scheduling: {
      scheduledStartTime: '2026-10-20T09:00:00Z',
      scheduledEndTime: '2026-10-20T10:00:00Z',
      timezone: 'Asia/Ho_Chi_Minh',
      durationMinutes: 60,
      format: 'GOOGLE_MEET',
      meetingUrl: 'https://meet.google.com/xyz-uvwx-rst',
      calendarIntegrationStatus: 'CONNECTED',
    },
    assignment: {
      assignedSalesName: 'Lead Modernization Engineer',
    },
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z',
  },
];

describe('MeetingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(meetingRequestsApi.getConsultationTypes).mockResolvedValue([
      { key: 'TECHNICAL', label: 'Technical Consultation', description: '', recommendedDurationMinutes: 45 },
      { key: 'ENTERPRISE_ARCHITECTURE', label: 'Architecture Review', description: '', recommendedDurationMinutes: 60 },
    ]);
    vi.mocked(meetingRequestsApi.getOrganizationMembers).mockResolvedValue([
      { id: 'mem-001', name: 'Alice Engineer', email: 'alice@acme.com', role: 'MEMBER', status: 'Active' },
    ]);
    vi.mocked(projectService.getProjects).mockResolvedValue([
      { id: 'proj-001', name: 'Core Banking Migration' } as any,
    ]);
    vi.mocked(organizationApi.getMembers).mockResolvedValue([
      { id: 'mem-001', fullName: 'Alice Engineer', email: 'alice@acme.com', role: 'MEMBER' } as any,
    ]);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <MeetingsPage />
      </MemoryRouter>
    );

  it('renders page header, KPI cards, and meetings list', async () => {
    vi.mocked(meetingRequestsApi.listMeetingRequests).mockResolvedValue({
      items: mockMeetings,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
      statusCounts: { CONFIRMED: 1, COMPLETED: 1 },
    });

    renderComponent();

    expect(screen.getByText('Meeting Requests')).toBeInTheDocument();
    expect(
      screen.getByText(/Schedule and manage consultations with your assigned ALSM modernization team/i)
    ).toBeInTheDocument();

    expect(screen.getByText('Total Meetings')).toBeInTheDocument();
    expect(screen.getByText('Pending Requests')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Meetings')).toBeInTheDocument();
    expect(screen.getByText('Completed Meetings')).toBeInTheDocument();

    expect(await screen.findByText('Enterprise Architecture & AST Validation Review')).toBeInTheDocument();
    expect(screen.getByText('Initial Kickoff & Ingestion Consultation')).toBeInTheDocument();
  });

  it('opens Google Meet link when Join Google Meet is clicked', async () => {
    vi.mocked(meetingRequestsApi.listMeetingRequests).mockResolvedValue({
      items: mockMeetings,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
      statusCounts: { CONFIRMED: 1 },
    });
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    renderComponent();

    const joinButton = await screen.findByRole('button', { name: /Join Google Meet/i });
    expect(joinButton).toBeInTheDocument();
    fireEvent.click(joinButton);

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://meet.google.com/abc-defg-hij',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('shows empty state when no meetings exist', async () => {
    vi.mocked(meetingRequestsApi.listMeetingRequests).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      statusCounts: {},
    });

    renderComponent();

    expect(await screen.findByText('No Meeting Requests Found')).toBeInTheDocument();
  });

  it('navigates to the Request Meeting page when clicking + Request Meeting', async () => {
    vi.mocked(meetingRequestsApi.listMeetingRequests).mockResolvedValue({
      items: mockMeetings,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
      statusCounts: {},
    });

    renderComponent();

    const requestBtns = screen.getAllByRole('button', { name: /Request Meeting/i });
    expect(requestBtns.length).toBeGreaterThan(0);
    fireEvent.click(requestBtns[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/meeting-requests/new');
  });
});
