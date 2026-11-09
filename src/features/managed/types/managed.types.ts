export type ManagedStageKey =
  | 'REQUIREMENTS_GATHERING'
  | 'LEGACY_ANALYSIS'
  | 'CONVERSION'
  | 'TESTING_VALIDATION'
  | 'TEAM_LEAD_REVIEW'
  | 'ADMIN_DELIVERY_REVIEW'
  | 'CUSTOMER_REVIEW'
  | 'ACCEPTANCE'
  | 'DELIVERY';

export interface WorkflowStageInfo {
  step: number;
  key: ManagedStageKey;
  label: string;
  description: string;
  percentage: number;
}

export const MANAGED_WORKFLOW_STAGES: WorkflowStageInfo[] = [
  {
    step: 1,
    key: 'REQUIREMENTS_GATHERING',
    label: 'Requirements Gathering',
    description: 'Collecting and validating customer legacy files, specifications, and modernization goals.',
    percentage: 11,
  },
  {
    step: 2,
    key: 'LEGACY_ANALYSIS',
    label: 'Legacy Analysis',
    description: 'Mainframe screen and COBOL syntax analysis, complexity scoring, and inventory breakdown.',
    percentage: 22,
  },
  {
    step: 3,
    key: 'CONVERSION',
    label: 'Conversion',
    description: 'Transforming BMS/DSPF to modern TypeScript/React screens and COBOL to modern target architecture.',
    percentage: 33,
  },
  {
    step: 4,
    key: 'TESTING_VALIDATION',
    label: 'Testing & Validation',
    description: 'Automated layout verification, visual regression testing, and data binding validation.',
    percentage: 44,
  },
  {
    step: 5,
    key: 'TEAM_LEAD_REVIEW',
    label: 'Team Lead Review',
    description: 'Internal engineering review, code quality sign-off, and architectural validation.',
    percentage: 56,
  },
  {
    step: 6,
    key: 'ADMIN_DELIVERY_REVIEW',
    label: 'Admin Delivery Review',
    description: 'Delivery readiness review by ALSM Admin before customer presentation.',
    percentage: 67,
  },
  {
    step: 7,
    key: 'CUSTOMER_REVIEW',
    label: 'Customer Review',
    description: 'Customer sandbox preview, interactive screen inspection, and feedback collection.',
    percentage: 78,
  },
  {
    step: 8,
    key: 'ACCEPTANCE',
    label: 'Acceptance',
    description: 'Formal deliverable review, customer sign-off, and acceptance recording.',
    percentage: 89,
  },
  {
    step: 9,
    key: 'DELIVERY',
    label: 'Delivery',
    description: 'Final deployment bundle release, source code handover, and project completion.',
    percentage: 100,
  },
];

export interface ManagedProjectMilestone {
  stageKey: ManagedStageKey;
  label: string;
  targetDate: string;
  completedAt?: string;
  isCurrent: boolean;
  isCompleted: boolean;
}

export interface ManagedProjectItem {
  id: string;
  name: string;
  description?: string;
  conversionType: 'BMS_DSPF_TO_FRONTEND' | 'COBOL_TO_JAVA';
  serviceType: 'MANAGED';
  conversionRequestId?: string;
  contractNumber?: string;
  contractId?: string;
  status: string;
  currentStage: number;
  currentStageKey: ManagedStageKey;
  progressPct: number;
  estimatedScreens?: number;
  convertedScreens?: number;
  latestDeliverableVersion?: string;
  businessRequirements?: string;
  files?: Array<{
    fileId: string;
    originalName: string;
    fileSize: number;
    mimeType?: string;
    category?: string;
    storageKey?: string;
    uploadedAt?: string;
  }>;
  acceptance?: {
    accepted: boolean;
    acceptedBy?: string;
    acceptedByName?: string;
    acceptedAt?: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
}
