import type { AxiosProgressEvent } from 'axios';
import { apiClient } from '@/services/api/apiClient';
import type { ConversionResultBundle, FieldMapping, MethodMappingEntry, MethodMappingView } from '../types/conversion';
import type { LegacyScreen } from '@/features/screens/types/screen';
import type { DiagnosticLog } from '@/features/diagnostics/types/diagnostics';
import { diagnosticsService } from '@/features/diagnostics/services/diagnostics.service';
import type { ProgramAnalysis } from '@/features/screens/types/copybookDependency';

/** Shape returned by the real backend — see ScreenRecord in ALSM_WEB_BE. */
interface ScreenRecordDto {
  id: string;
  projectId: string;
  name: string;
  sourceType: 'BMS' | 'DSPF' | 'COBOL';
  status: 'READY' | 'PROCESSING' | 'COMPLETED' | 'REVIEW_REQUIRED' | 'FAILED';
  inputReference: string;
  sizeBytes?: number;
  createdAt: string;
  updatedAt: string;
}

const SCREEN_STATUS_LABELS: Record<ScreenRecordDto['status'], LegacyScreen['status']> = {
  READY: 'Ready',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  REVIEW_REQUIRED: 'Review Required',
  FAILED: 'Failed',
};

function toLegacyScreen(record: ScreenRecordDto): LegacyScreen {
  return {
    id: record.id,
    projectId: record.projectId,
    name: record.name,
    sourceType: record.sourceType,
    status: SCREEN_STATUS_LABELS[record.status],
    framework: 'React',
    lastUpdated: new Date(record.updatedAt).toLocaleString(),
    sizeKb: record.sizeBytes ? Math.round(record.sizeBytes / 1024) : undefined,
    inputReference: record.inputReference,
  };
}

export interface ConversionJob {
  id: string;
  screenId?: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DEAD' | 'CANCELLED';
  resultReference?: string;
  errorCode?: string;
  errorMessage?: string;
  toolVersion?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface UploadConversionSourceResult {
  inputReference: string;
  files: { name: string; sizeBytes: number }[];
  screens: LegacyScreen[];
}

interface FieldMappingResponse {
  mappings: Omit<FieldMapping, 'id'>[];
}

export class ConversionService {
  /** Real, backend-persisted screens — a screen only exists once a real source file has been uploaded (see uploadSource). No in-memory or seeded fallback list. */
  async getScreens(projectId: string): Promise<LegacyScreen[]> {
    const records = await apiClient.get<ScreenRecordDto[]>(`/projects/${projectId}/screens`);
    return records.map(toLegacyScreen);
  }

  async getScreenById(screenId: string): Promise<LegacyScreen | null> {
    try {
      return toLegacyScreen(await apiClient.get<ScreenRecordDto>(`/screens/${screenId}`));
    } catch {
      return null;
    }
  }

  async getScreenSource(screenId: string): Promise<{ name: string; content: string; sourceType: string; linesOfCode: number } | null> {
    try {
      return await apiClient.get<{ name: string; content: string; sourceType: string; linesOfCode: number }>(`/screens/${screenId}/source`);
    } catch {
      return null;
    }
  }

  /** Real COBOL copybook dependency analysis for one screen (computed by the backend at
   * upload time). No mock fallback — a real failure here must surface as a real error. */
  async getCopybookDependencies(screenId: string): Promise<ProgramAnalysis> {
    return apiClient.get<ProgramAnalysis>(`/screens/${screenId}/copybook-dependencies`);
  }

  /** Deletes a screen record (and its associated source file) from the backend. */
  async deleteScreen(projectId: string, screenId: string): Promise<boolean> {
    try {
      await apiClient.delete(`/projects/${projectId}/screens/${screenId}`);
      return true;
    } catch {
      return false;
    }
  }

  /** Uploads real legacy source files (BMS/DSPF or COBOL + copybooks) to the backend. The
   * backend persists both the file bytes and a real Screen record per uploaded program/screen —
   * nothing is simulated and nothing needs to be re-registered client-side afterward. */
  async uploadSource(
    projectId: string,
    files: File[],
    onUploadProgress?: (percent: number) => void,
  ): Promise<UploadConversionSourceResult> {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const response = await apiClient.postForm<{
      inputReference: string;
      files: { name: string; sizeBytes: number }[];
      screens: ScreenRecordDto[];
    }>(`/projects/${projectId}/conversion-sources`, form, {
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (!onUploadProgress || !event.total) return;
        onUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return { ...response, screens: response.screens.map(toLegacyScreen) };
  }

  /** Creates a single conversion job. Jobs start QUEUED — there is no fake instant success; poll getLatestConversion for real status. */
  async createConversion(
    projectId: string,
    input: { screenId?: string; inputReference?: string },
  ): Promise<ConversionJob> {
    return apiClient.post<ConversionJob>(`/projects/${projectId}/conversions`, input);
  }

  /** Fetches the real generated code for a COMPLETED conversion job. Throws if the job hasn't completed yet — callers should only call this once status === 'COMPLETED'. */
  async getConversionResult(jobId: string): Promise<ConversionResultBundle> {
    return apiClient.get<ConversionResultBundle>(`/conversions/${jobId}/result`);
  }

  /** Re-enqueues a real failed/dead conversion job. The backend rejects this for a job that
   * isn't FAILED/DEAD (CONVERSION_JOB_NOT_RETRYABLE) — no client-side status check here,
   * the server is the source of truth. */
  async retryConversion(jobId: string): Promise<ConversionJob> {
    return apiClient.post<ConversionJob>(`/conversions/${jobId}/retry`);
  }

  async bulkConvertScreens(projectId: string, screenIds: string[]): Promise<ConversionJob[]> {
    // Real conversion jobs start QUEUED — the real per-screen status now comes from the
    // backend (synced onto the Screen record as its job progresses), not a local guess.
    return apiClient.post<ConversionJob[]>(`/projects/${projectId}/conversions/bulk`, { screenIds });
  }

  async getProjectConversions(projectId: string): Promise<ConversionJob[]> {
    try {
      return await apiClient.get<ConversionJob[]>(`/projects/${projectId}/conversions`);
    } catch {
      return [];
    }
  }

  async getLatestConversion(projectId: string, screenId: string): Promise<ConversionJob | null> {
    try {
      const jobs = await apiClient.get<ConversionJob[]>(
        `/projects/${projectId}/screens/${screenId}/conversions`,
      );
      return jobs[0] ?? null;
    } catch {
      return null;
    }
  }

  /** Real, full conversion history for a screen (UC-19) — every past attempt, newest
   * first. Same backend endpoint as getLatestConversion, but returns the whole array
   * instead of discarding everything but jobs[0]. */
  async getConversionHistory(projectId: string, screenId: string): Promise<ConversionJob[]> {
    return apiClient.get<ConversionJob[]>(`/projects/${projectId}/screens/${screenId}/conversions`);
  }

  /** Fetches one specific conversion job by id — used to inspect a specific historical
   * version's result rather than only ever the latest one. */
  async getConversionJobById(jobId: string): Promise<ConversionJob> {
    return apiClient.get<ConversionJob>(`/conversions/${jobId}`);
  }

  async getFieldMappings(projectId: string, screenId: string): Promise<FieldMapping[]> {
    const res = await apiClient.get<FieldMappingResponse>(
      `/projects/${projectId}/screens/${screenId}/field-mapping`,
    );
    if (res?.mappings && Array.isArray(res.mappings)) {
      return res.mappings.map((entry, index) => ({ id: `fm-${index}`, ...entry }));
    }
    return [];
  }

  /** Real class/method names detected in the screen's latest generated Java code (UC-28),
   * plus any saved user overrides. No mock fallback — a COBOL screen with no completed
   * conversion yet honestly reports hasGeneratedCode: false. */
  async getMethodMapping(projectId: string, screenId: string): Promise<MethodMappingView> {
    return apiClient.get<MethodMappingView>(`/projects/${projectId}/screens/${screenId}/method-mapping`);
  }

  /** Saves method-mapping renames. The backend applies them to the screen's latest
   * generated Java code for real, not just as inert saved metadata. */
  async saveMethodMapping(
    projectId: string,
    screenId: string,
    entries: MethodMappingEntry[],
  ): Promise<MethodMappingView> {
    return apiClient.put<MethodMappingView>(`/projects/${projectId}/screens/${screenId}/method-mapping`, {
      entries,
    });
  }

  async saveFieldMapping(
    projectId: string,
    screenId: string,
    mappings: FieldMapping[],
  ): Promise<boolean> {
    await apiClient.put(`/projects/${projectId}/screens/${screenId}/field-mapping`, {
      mappings: mappings.map(({ legacyField, componentMapping }) => ({
        legacyField,
        componentMapping,
      })),
    });
    return true;
  }

  async reconvert(
    projectId: string,
    screenId: string,
    mappings: FieldMapping[],
  ): Promise<{ job: ConversionJob; validation: any }> {
    return apiClient.post<{ job: ConversionJob; validation: any }>(
      `/projects/${projectId}/screens/${screenId}/reconvert`,
      {
        mappings: mappings.map(({ legacyField, componentMapping }) => ({
          legacyField,
          componentMapping,
        })),
      },
    );
  }

  async saveScreenCode(
    projectId: string,
    screenId: string,
    code: string,
    filename?: string,
  ): Promise<{ success: boolean; conversionJobId: string }> {
    return apiClient.put<{ success: boolean; conversionJobId: string }>(
      `/projects/${projectId}/screens/${screenId}/code`,
      { code, filename },
    );
  }

  async getDiagnosticsLogs(projectId: string): Promise<DiagnosticLog[]> {
    return diagnosticsService.getDiagnosticsLogs(projectId);
  }

  async applyDiagnosticPatch(logId: string, projectId: string): Promise<void> {
    return diagnosticsService.applyDiagnosticPatch(logId, projectId);
  }

  async aiRemediate(
    projectId: string,
    screenId: string,
  ): Promise<{ message: string; jobId: string }> {
    return apiClient.post<{ message: string; jobId: string }>(
      `/projects/${projectId}/screens/${screenId}/ai-remediate`,
    );
  }
}

export const conversionService = new ConversionService();
