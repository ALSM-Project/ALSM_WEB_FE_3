export type ProjectStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'SOFT_DELETED';

export interface WorkspaceQuota {
  screensUsed: number;
  screensMax: number;
  programsUsed: number;
  programsMax: number;
  storageUsedGb: number;
  storageMaxGb: number;
}

export type ConversionType = 'BMS_DSPF_TO_FRONTEND' | 'COBOL_TO_JAVA';

export type ServiceType = 'SELF_SERVICE' | 'MANAGED';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  conversionType: ConversionType;
  serviceType?: ServiceType;
  conversionRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  conversionType: ConversionType;
  serviceType?: ServiceType;
}

/** Conversion type is deliberately not editable here - it's fixed at creation since
 * screens/jobs already uploaded for a project assume one specific conversion engine. */
export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}
