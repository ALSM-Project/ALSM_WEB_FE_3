import { apiClient } from '@/services/api/apiClient';
import type {
  ConsultationTypeConfig,
  CreateMeetingRequestPayload,
  ListMeetingRequestsResponse,
  MeetingPriority,
  MeetingRequest,
  MeetingRequestStatus,
} from '../types/meeting';

export const meetingRequestsApi = {
  listMeetingRequests: async (params?: {
    search?: string;
    status?: MeetingRequestStatus | '';
    consultationType?: string;
    priority?: MeetingPriority | '';
    organizationId?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ListMeetingRequestsResponse> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.append('search', params.search);
    if (params?.status) qs.append('status', params.status);
    if (params?.consultationType) qs.append('consultationType', params.consultationType);
    if (params?.priority) qs.append('priority', params.priority);
    if (params?.organizationId) qs.append('organizationId', params.organizationId);
    if (params?.projectId) qs.append('projectId', params.projectId);
    if (params?.startDate) qs.append('startDate', params.startDate);
    if (params?.endDate) qs.append('endDate', params.endDate);
    if (params?.page) qs.append('page', String(params.page));
    if (params?.limit) qs.append('limit', String(params.limit));
    if (params?.sortBy) qs.append('sortBy', params.sortBy);
    if (params?.sortOrder) qs.append('sortOrder', params.sortOrder);

    const query = qs.toString();
    return apiClient.get<ListMeetingRequestsResponse>(`/meeting-requests${query ? `?${query}` : ''}`);
  },

  getMeetingRequest: async (id: string): Promise<MeetingRequest> => {
    return apiClient.get<MeetingRequest>(`/meeting-requests/${encodeURIComponent(id)}`);
  },

  createMeetingRequest: async (payload: CreateMeetingRequestPayload): Promise<MeetingRequest> => {
    return apiClient.post<MeetingRequest>('/meeting-requests', payload);
  },

  getConsultationTypes: async (): Promise<ConsultationTypeConfig[]> => {
    return apiClient.get<ConsultationTypeConfig[]>('/meeting-requests/consultation-types');
  },

  getCalendarStatus: async (): Promise<{ isEnabled: boolean; calendarUserEmail?: string }> => {
    return apiClient.get<{ isEnabled: boolean; calendarUserEmail?: string }>(
      '/meeting-requests/calendar-status',
    );
  },

  rescheduleMeeting: async (
    id: string,
    payload: { scheduledStartTime: string; scheduledEndTime: string; reason: string },
  ): Promise<MeetingRequest> => {
    return apiClient.post<MeetingRequest>(`/meeting-requests/${encodeURIComponent(id)}/reschedule`, payload);
  },

  cancelMeeting: async (id: string, reason: string): Promise<MeetingRequest> => {
    return apiClient.post<MeetingRequest>(`/meeting-requests/${encodeURIComponent(id)}/cancel`, { reason });
  },

  getOrganizationMembers: async (
    organizationId?: string,
  ): Promise<Array<{ id: string; name: string; email: string; role: string; status: string }>> => {
    const qs = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
    return apiClient.get(`/meeting-requests/organization-members${qs}`);
  },
};
