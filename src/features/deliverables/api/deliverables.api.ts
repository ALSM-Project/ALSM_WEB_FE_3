import { apiClient } from '@/services/api/apiClient';

export type DeliverableStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'READY_FOR_REVIEW'
  | 'REVISION_REQUESTED';
export type DeliverablePackageType =
  | 'FULL_MODERNIZATION_PACKAGE'
  | 'FRONTEND_COMPONENTS'
  | 'BACKEND_SERVICES'
  | 'VALIDATION_REPORT'
  | 'TECHNICAL_REPORT'
  | 'REVIEW_REPORT';

export interface DeliverableCustomerReview {
  decision: 'APPROVED' | 'REVISION_REQUESTED';
  reviewedByUserId: string;
  reviewedByUserName: string;
  reviewedAt: string;
  feedbackNotes?: string;
}

export interface DeliverableItem {
  id: string;
  projectId: string;
  projectName: string;
  organizationId: string;
  version: string;
  title: string;
  description: string;
  packageType: DeliverablePackageType;
  fileCount: number;
  totalSizeFormatted: string;
  downloadUrl?: string;
  status: DeliverableStatus;
  customerReview?: DeliverableCustomerReview;
  createdAt: string;
  updatedAt: string;
}

export const deliverablesApi = {
  getDeliverables: async (projectId?: string): Promise<DeliverableItem[]> => {
    try {
      const url = projectId ? `/deliverables?projectId=${projectId}` : '/deliverables';
      const response = await apiClient.get<DeliverableItem[]>(url);
      return Array.isArray(response) ? response : [];
    } catch (err) {
      console.error('Failed to fetch deliverables:', err);
      return [];
    }
  },

  getDeliverableById: async (id: string): Promise<DeliverableItem | null> => {
    try {
      return await apiClient.get<DeliverableItem>(`/deliverables/${id}`);
    } catch {
      return null;
    }
  },

  reviewDeliverable: async (
    id: string,
    decision: 'APPROVED' | 'REVISION_REQUESTED',
    feedbackNotes?: string,
  ): Promise<DeliverableItem> => {
    return apiClient.post<DeliverableItem>(`/deliverables/${id}/review`, {
      decision,
      feedbackNotes,
    });
  },
};
