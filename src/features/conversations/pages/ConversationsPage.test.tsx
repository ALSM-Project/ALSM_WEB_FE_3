import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ConversationsPage } from './ConversationsPage';
import { conversationsApi } from '../api/conversations.api';
import { projectService } from '@/features/projects/services/project.service';
import type { ConversationItem, ConversationMessageItem } from '../types/conversation';

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

vi.mock('../api/conversations.api', () => ({
  conversationsApi: {
    list: vi.fn(),
    getById: vi.fn(),
    listMessages: vi.fn(),
    postMessage: vi.fn(),
    create: vi.fn(),
    createWebSocket: vi.fn(() => ({
      ws: null,
      close: vi.fn(),
      sendMessage: vi.fn(),
    })),
  },
}));

vi.mock('@/features/projects/services/project.service', () => ({
  projectService: {
    getProjects: vi.fn(),
  },
}));

const mockConversations: ConversationItem[] = [
  {
    id: 'conv-001',
    status: 'OPEN',
    channel: 'CHAT',
    customerName: 'John Doe',
    customerEmail: 'customer@acme.com',
    organizationId: 'org-001',
    projectId: 'proj-001',
    projectName: 'Core Banking Migration',
    title: 'Core Banking — AST Architecture Review',
    conversationType: 'PROJECT',
    participants: [
      { userId: 'usr-001', name: 'John Doe', role: 'CUSTOMER', email: 'customer@acme.com', type: 'CUSTOMER' },
      { userId: 'alsm-001', name: 'Lead Architect', role: 'STAFF', email: 'lead@alsm.io', type: 'ALSM' },
    ],
    lastMessage: 'We have updated the AST parser rules for Cobol subroutines.',
    unreadCount: 2,
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-08T10:00:00Z',
  },
  {
    id: 'conv-002',
    status: 'OPEN',
    channel: 'PORTAL',
    customerName: 'John Doe',
    customerEmail: 'customer@acme.com',
    organizationId: 'org-001',
    title: 'ALSM Technical Support — General Inquiries',
    conversationType: 'SUPPORT',
    participants: [
      { userId: 'usr-001', name: 'John Doe', role: 'CUSTOMER', email: 'customer@acme.com', type: 'CUSTOMER' },
    ],
    unreadCount: 3,
    createdAt: '2026-11-02T00:00:00Z',
    updatedAt: '2026-11-02T00:00:00Z',
  },
];

const mockMessages: ConversationMessageItem[] = [
  {
    id: 'msg-001',
    conversationId: 'conv-001',
    senderUserId: 'alsm-001',
    senderName: 'Lead Architect',
    senderEmail: 'lead@alsm.io',
    senderRole: 'STAFF',
    content: 'We have updated the AST parser rules for Cobol subroutines.',
    isInternal: false,
    createdAt: '2026-11-08T10:00:00Z',
  },
];

describe('ConversationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(projectService.getProjects).mockResolvedValue([
      { id: 'proj-001', name: 'Core Banking Migration' } as any,
    ]);
    vi.mocked(conversationsApi.list).mockResolvedValue(mockConversations);
    vi.mocked(conversationsApi.getById).mockResolvedValue(mockConversations[0]);
    vi.mocked(conversationsApi.listMessages).mockResolvedValue(mockMessages);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ConversationsPage />
      </MemoryRouter>
    );

  it('renders page header, filters, and loads conversation list', async () => {
    renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: 'Conversations' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search conversations/i)).toBeInTheDocument();

    const convCards = await screen.findAllByText('Core Banking — AST Architecture Review');
    expect(convCards.length).toBeGreaterThan(0);
    expect(screen.getByText('ALSM Technical Support — General Inquiries')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('selects a conversation and displays messages in the chat workspace', async () => {
    renderComponent();

    const convCards = await screen.findAllByText('Core Banking — AST Architecture Review');
    fireEvent.click(convCards[0]);

    await waitFor(() => {
      expect(
        screen.getByText('We have updated the AST parser rules for Cobol subroutines.')
      ).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
  });

  it('allows sending a message', async () => {
    vi.mocked(conversationsApi.postMessage).mockResolvedValue({
      id: 'msg-002',
      conversationId: 'conv-001',
      senderUserId: 'usr-001',
      senderName: 'John Doe',
      senderEmail: 'customer@acme.com',
      senderRole: 'CUSTOMER',
      content: 'Thank you, looks good!',
      isInternal: false,
      createdAt: new Date().toISOString(),
    });

    renderComponent();

    const convCards = await screen.findAllByText('Core Banking — AST Architecture Review');
    fireEvent.click(convCards[0]);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: 'Thank you, looks good!' } });

    const sendBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(conversationsApi.postMessage).toHaveBeenCalledWith(
        'conv-001',
        expect.objectContaining({
          content: 'Thank you, looks good!',
        })
      );
    });
  });
});
