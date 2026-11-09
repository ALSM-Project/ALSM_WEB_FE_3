import { apiClient } from '@/services/api/apiClient';

export type ConversionRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PROJECT_CREATED'
  | 'WITHDRAWN';

export type ManagedConversionPipeline =
  | 'BMS_DSPF_TO_FRONTEND'
  | 'COBOL_TO_JAVA'
  | 'RPG_TO_FRONTEND';

export interface ConversionRequestFile {
  fileId: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: 'SOURCE_CODE' | 'SPECIFICATION' | 'DOCUMENTATION' | 'OTHER';
  uploadedAt: string;
  storageKey?: string;
}

export interface ConversionRequest {
  id: string;
  requestNumber: string;
  organizationId: string;
  projectName: string;
  projectDescription?: string;
  businessDomain?: string;
  pipeline: ManagedConversionPipeline;
  sourceTechnology: string;
  targetArchitecture: string;
  scope: {
    estimatedScreens?: number;
    estimatedPrograms?: number;
    estimatedLinesOfCode?: number;
    complexity?: string;
  };
  contact: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
  };
  specialInstructions?: string;
  expectedDeliverables?: string;
  preferredTimelineWeeks?: number;
  files: ConversionRequestFile[];
  status: ConversionRequestStatus;
  linkedProjectId?: string;
  reviewFeedback?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  projectCreatedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversionRequestPayload {
  projectName: string;
  projectDescription?: string;
  businessDomain?: string;
  contractNumber?: string;
  contractId?: string;
  businessRequirements?: string;
  pipeline: ManagedConversionPipeline;
  sourceTechnology: string;
  targetArchitecture: string;
  scope?: {
    estimatedScreens?: number;
    estimatedPrograms?: number;
    estimatedLinesOfCode?: number;
    complexity?: string;
  };
  contact: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
  };
  specialInstructions?: string;
  expectedDeliverables?: string;
  preferredTimelineWeeks?: number;
  files?: Array<{
    fileId: string;
    originalName: string;
    fileSize: number;
    mimeType?: string;
    category?: string;
    storageKey?: string;
  }>;
}

export interface WorkspaceMetrics {
  totalProjects: number;
  selfServiceProjects: number;
  managedProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingRequests: number;
}

export const conversionRequestsApi = {
  list: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ConversionRequest[]; total: number; page: number; totalPages: number }> => {
    const qs = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return apiClient.get(qs ? `/conversion-requests?${qs}` : '/conversion-requests');
  },

  getById: async (id: string): Promise<ConversionRequest> => {
    return apiClient.get(`/conversion-requests/${id}`);
  },

  submit: async (payload: CreateConversionRequestPayload): Promise<ConversionRequest> => {
    return apiClient.post('/conversion-requests', payload);
  },

  getMetrics: async (): Promise<WorkspaceMetrics> => {
    return apiClient.get('/conversion-requests/metrics');
  },
};
