import { meetingRequestsApi } from '../api/meeting-requests.api';
import type { Meeting } from '../types/meeting';

export class MeetingService {
  async getMeetings(query?: { status?: string; search?: string }): Promise<Meeting[]> {
    try {
      const res = await meetingRequestsApi.listMeetingRequests({
        status: (query?.status as any) || '',
        search: query?.search,
      });
      if (res && Array.isArray(res.items)) {
        return res.items;
      }
      return [];
    } catch (err) {
      console.warn('[MeetingService] listMeetingRequests error:', err);
      return [];
    }
  }

  async getMeetingById(id: string): Promise<Meeting | null> {
    try {
      return await meetingRequestsApi.getMeetingRequest(id);
    } catch {
      return null;
    }
  }
}

export const meetingService = new MeetingService();
